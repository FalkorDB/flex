/**
 * Louvain community detection (modularity optimization).
 *
 * This implementation is designed to run in the FalkorDB/RedisGraph UDF
 * environment, and relies on the global `graph.traverse` function to build
 * an in-memory adjacency structure.
 *
 * Notes:
 * - The implementation treats the traversed neighborhood graph as UNDIRECTED.
 * - You must provide the list of nodes to consider (there is no portable
 *   `graph.nodes()` API across environments).
 * - Edge weights default to 1 when missing.
 */

// Ensure shared helpers are loaded when running under Node/Jest.
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  require('./community');
}

(function initExpLouvain() {
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

  /**
   * Louvain algorithm.
   *
   * @param {object} params
   * @param {any[]} params.nodes Input nodes (objects), must include `id` by default.
   * @param {string|string[]} [params.direction='both'] Traversal direction(s) used to build adjacency.
   * @param {number} [params.maxEdgesPerNode=Infinity] Safety cap per node traversal.
   * @param {number} [params.resolution=1] Modularity resolution (gamma).
   * @param {number} [params.maxPasses=10] Max passes per level.
   * @param {number} [params.maxLevels=10] Max coarsening levels.
   * @param {number} [params.minGain=1e-12] Minimum gain threshold to accept a move.
   * @param {(node:any)=>any} [params.getNodeId]
   * @param {(edge:any)=>number} [params.getWeight]
   *
   * @returns {{ partition: Object, communities: Object, levels: number }}
   */
  function louvain({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    resolution = 1,
    maxPasses = 10,
    maxLevels = 10,
    minGain = 1e-12,
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

    // Mapping from original nodeId -> current node id in the coarsened graph.
    const originalToCurrent = new Map();
    for (const id of baseNodeIds) originalToCurrent.set(id, id);

    let currentAdj = baseAdj;
    let currentNodeIds = baseNodeIds;
    let levels = 0;

    for (let level = 0; level < maxLevels; level++) {
      const { partition: part, moved } = exp.oneLevel({
        adjacency: currentAdj,
        nodeIds: currentNodeIds,
        resolution,
        maxPasses,
        minGain,
      });

      levels += 1;

      // Update original mapping: original -> part(current).
      for (const [orig, cur] of originalToCurrent.entries()) {
        originalToCurrent.set(orig, part.get(cur));
      }

      // If nothing moved, stop.
      if (!moved) {
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
      out.debug = built.debug;
    }

    return out;
  }

  falkor.register('exp.louvain', louvain);

  // Conditional Export for Jest
  // QuickJS/FalkorDB will ignore this because 'module' is not defined.
  // istanbul ignore next
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getEdgeWeight: exp.getEdgeWeight,
      buildUndirectedAdjacency: exp.buildUndirectedAdjacency,
      oneLevel: exp.oneLevel,
      inducedGraph: exp.inducedGraph,
      louvain,
    };
  }
})();
