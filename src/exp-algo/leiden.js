/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Leiden community detection (experimental).
 *
 * Pragmatic UDF-oriented variant:
 * - Local moving (Louvain-style)
 * - Refinement by splitting communities into connected components
 * - Graph coarsening (induced graph)
 */

// Ensure shared helpers are loaded when running under Node/Jest.
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  require('./community');
}

(function initExpLeiden() {
  const g =
    // istanbul ignore next
    typeof globalThis !== 'undefined'
      ? globalThis
      : // istanbul ignore next
        typeof self !== 'undefined'
        ? self
        : this;

  if (!g.__flexExpAlgo) {
    g.__flexExpAlgo = Object.create(null);
  }

  const exp = g.__flexExpAlgo;

  function makeSeededRandom(seed) {
    // Simple LCG (deterministic).
    let s = (seed >>> 0) || 1;
    return function random() {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /**
   * Refinement step: split each community into connected components
   * (with connectivity computed inside the community induced subgraph).
   */
  function refineByConnectedComponents({ adjacency, nodeIds, partition }) {
    const communities = exp.partitionToCommunities(partition);

    const refined = new Map();
    let splitCommunities = 0;
    let totalComponents = 0;

    for (const [comm, nodes] of communities.entries()) {
      if (!nodes || nodes.length <= 1) {
        if (nodes && nodes.length === 1) refined.set(nodes[0], comm);
        continue;
      }

      const inComm = new Set(nodes);
      const visited = new Set();

      let componentsForThisCommunity = 0;

      for (const start of nodes) {
        if (visited.has(start)) continue;

        componentsForThisCommunity += 1;
        totalComponents += 1;

        const compKey = `${String(comm)}__${componentsForThisCommunity}`;

        // BFS
        const q = [start];
        visited.add(start);
        refined.set(start, compKey);

        while (q.length) {
          const v = q.pop();
          const neigh = adjacency.get(v);
          if (!neigh) continue;

          for (const nbr of neigh.keys()) {
            if (!inComm.has(nbr)) continue;
            if (visited.has(nbr)) continue;
            visited.add(nbr);
            refined.set(nbr, compKey);
            q.push(nbr);
          }
        }
      }

      if (componentsForThisCommunity > 1) {
        splitCommunities += 1;
      }

      // If the community was actually connected, keep the original id to reduce churn.
      if (componentsForThisCommunity === 1) {
        for (const n of nodes) {
          refined.set(n, comm);
        }
      }
    }

    // Ensure every nodeId is present (defensive).
    for (const id of nodeIds) {
      if (!refined.has(id)) {
        refined.set(id, partition.get(id));
      }
    }

    return {
      partition: exp.renumberPartition(refined),
      splitCommunities,
      totalComponents,
    };
  }

  /**
   * Leiden algorithm.
   *
   * @param {object} params
   * @param {any[]} params.nodes Input nodes (objects), must include `id` by default.
   * @param {string|string[]} [params.direction='both'] Traversal direction(s) used to build adjacency.
   * @param {number} [params.maxEdgesPerNode=Infinity] Safety cap per node traversal.
   * @param {number} [params.resolution=1] Modularity resolution (gamma).
   * @param {number} [params.maxPasses=10] Max passes per level.
   * @param {number} [params.maxLevels=10] Max coarsening levels.
   * @param {number} [params.minGain=1e-12] Minimum gain threshold to accept a move.
   * @param {number} [params.seed] Deterministic seed for randomized node order.
   * @param {(node:any)=>any} [params.getNodeId]
   * @param {(edge:any)=>number} [params.getWeight]
   * @param {boolean} [params.debug=false]
   */
  function leiden({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    resolution = 1,
    maxPasses = 10,
    maxLevels = 10,
    minGain = 1e-12,
    seed,
    getNodeId = exp.defaultGetNodeId,
    getWeight = (edge) => exp.getEdgeWeight(edge),
    debug = false,
  }) {
    const built = exp.buildUndirectedAdjacency({
      nodes,
      direction,
      maxEdgesPerNode,
      getNodeId,
      getWeight,
      debug,
    });

    const baseAdj = built.adjacency;
    const baseNodeIds = built.nodeIds;

    const random = Number.isFinite(seed) ? makeSeededRandom(seed) : undefined;

    // Mapping from original nodeId -> current node id in the coarsened graph.
    const originalToCurrent = new Map();
    for (const id of baseNodeIds) originalToCurrent.set(id, id);

    let currentAdj = baseAdj;
    let currentNodeIds = baseNodeIds;
    let levels = 0;

    const debugOut = debug
      ? {
          adjacency: built.debug,
          levels: [],
        }
      : null;

    for (let level = 0; level < maxLevels; level++) {
      const movedRes = exp.oneLevel({
        adjacency: currentAdj,
        nodeIds: currentNodeIds,
        resolution,
        maxPasses,
        minGain,
        random,
      });

      const partLocal = movedRes.partition;

      const refinedRes = refineByConnectedComponents({
        adjacency: currentAdj,
        nodeIds: currentNodeIds,
        partition: partLocal,
      });

      const part = refinedRes.partition;

      levels += 1;

      if (debugOut) {
        debugOut.levels.push({
          moved: movedRes.moved,
          moves: movedRes.moves,
          splitCommunities: refinedRes.splitCommunities,
          totalComponents: refinedRes.totalComponents,
          communities: exp.partitionToCommunities(part).size,
        });
      }

      // Update original mapping: original -> part(current).
      for (const [orig, cur] of originalToCurrent.entries()) {
        originalToCurrent.set(orig, part.get(cur));
      }

      // If nothing moved and nothing split, stop.
      if (!movedRes.moved && refinedRes.splitCommunities === 0) {
        break;
      }

      const induced = exp.inducedGraph({ adjacency: currentAdj, partition: part });

      // If coarsening doesn't reduce the graph, stop.
      if (induced.nodeIds.length >= currentNodeIds.length) {
        break;
      }

      currentAdj = induced.adjacency;
      currentNodeIds = induced.nodeIds;
    }

    // Renumber final communities densely.
    const finalPartition = exp.renumberPartition(originalToCurrent);
    const communities = exp.partitionToCommunities(finalPartition);

    const out = {
      partition: exp.partitionToObject(finalPartition),
      communities: exp.communitiesToObject(communities),
      levels,
    };

    if (debug) {
      out.debug = debugOut;
    }

    return out;
  }

  falkor.register('exp.leiden', leiden);

  // Conditional Export for Jest
  // QuickJS/FalkorDB will ignore this because 'module' is not defined.
  // istanbul ignore next
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      refineByConnectedComponents,
      leiden,
    };
  }
})();
