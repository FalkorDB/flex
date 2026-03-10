/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Harmonic centrality (experimental).
 *
 * H(v) = sum_{u != v} 1 / d(v, u)
 *
 * Normalized form: H_norm(v) = H(v) / (n - 1)
 *
 * Notes:
 * - Builds an in-memory undirected adjacency for the provided node set using `graph.traverse`.
 * - Treats the observed edges as undirected (symmetrized), similar to exp.louvain/exp.leiden.
 * - Handles disconnected graphs naturally: unreachable pairs contribute 0 (1/Infinity = 0).
 * - Uses unweighted BFS (hop count) for shortest-path distances.
 */

// Ensure shared helpers are loaded when running under Node/Jest.
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  require('./community');
}

(function initExpHarmonicCentrality() {
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
   * Run BFS from a single source over the undirected adjacency and return
   * shortest-path distances to all reachable nodes.
   *
   * @param {Map} adjacency  node-id -> Map(neighbor-id -> weight)
   * @param {*}   sourceId   starting node id
   * @returns {Map<*, number>} node-id -> hop distance
   */
  function _flex_bfsDistances(adjacency, sourceId) {
    const dist = new Map();
    dist.set(sourceId, 0);

    const queue = [sourceId];
    let head = 0;

    while (head < queue.length) {
      const current = queue[head++];
      const d = dist.get(current);
      const neigh = adjacency.get(current);
      if (!neigh) continue;

      for (const nbrId of neigh.keys()) {
        if (nbrId === current) continue; // skip self-loops
        if (dist.has(nbrId)) continue;   // already visited
        dist.set(nbrId, d + 1);
        queue.push(nbrId);
      }
    }

    return dist;
  }

  function harmonicCentrality({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    normalized = true,
    getNodeId = exp.defaultGetNodeId,
    getWeight = (edge) => exp.getEdgeWeight(edge),
    debug = false,
  }) {
    if (typeof exp.buildUndirectedAdjacency !== 'function') {
      throw new TypeError('exp.harmonicCentrality: missing shared helper buildUndirectedAdjacency');
    }

    const built = exp.buildUndirectedAdjacency({
      nodes,
      direction,
      maxEdgesPerNode,
      getNodeId,
      getWeight,
      debug,
    });

    const adjacency = built.adjacency;
    const nodeIds = built.nodeIds;
    const n = nodeIds.length;

    const harmonicById = Object.create(null);
    const normalizedById = Object.create(null);

    for (const srcId of nodeIds) {
      const dist = _flex_bfsDistances(adjacency, srcId);

      let sum = 0;
      for (const otherId of nodeIds) {
        if (otherId === srcId) continue;
        const d = dist.get(otherId);
        if (d !== undefined && d > 0) {
          sum += 1 / d;
        }
        // unreachable nodes contribute 0
      }

      harmonicById[String(srcId)] = sum;

      if (normalized) {
        normalizedById[String(srcId)] = n > 1 ? sum / (n - 1) : 0;
      }
    }

    const out = {
      n,
      harmonic: harmonicById,
    };

    if (normalized) {
      out.normalized = normalizedById;
    }

    if (debug) {
      out.debug = built.debug;
    }

    return out;
  }

  falkor.register('exp.harmonicCentrality', harmonicCentrality);

  // Conditional Export for Jest
  // QuickJS/FalkorDB will ignore this because 'module' is not defined.
  // istanbul ignore next
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      harmonicCentrality,
      _flex_bfsDistances,
    };
  }
})();
