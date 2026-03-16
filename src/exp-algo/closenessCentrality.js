/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Closeness centrality (experimental).
 *
 * Classic:     C(v) = (n - 1) / sum_{u != v} d(v, u)
 * Wasserman-Faust (for disconnected graphs):
 *              C_WF(v) = (r / (n - 1)) * (r / sum_{u reachable from v} d(v, u))
 *              where r = number of reachable nodes from v (excluding v itself)
 *
 * Notes:
 * - Builds an in-memory undirected adjacency for the provided node set using `graph.traverse`.
 * - Treats the observed edges as undirected (symmetrized), similar to exp.louvain/exp.leiden.
 * - For disconnected graphs the classic formula yields 0 for isolated components.
 *   The Wasserman-Faust variant is always provided alongside the classic score.
 * - Uses unweighted BFS (hop count) for shortest-path distances.
 */

// Ensure shared helpers are loaded when running under Node/Jest.
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  require('./community');
}

(function initExpClosenessCentrality() {
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

  function closenessCentrality({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    normalized = true,
    getNodeId = exp.defaultGetNodeId,
    getWeight = (edge) => exp.getEdgeWeight(edge),
    debug = false,
  }) {
    if (typeof exp.buildUndirectedAdjacency !== 'function') {
      throw new TypeError('exp.closenessCentrality: missing shared helper buildUndirectedAdjacency');
    }
    if (typeof exp.bfsDistances !== 'function') {
      throw new TypeError('exp.closenessCentrality: missing shared helper bfsDistances');
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

    const closenessById = Object.create(null);
    const wassermanFaustById = Object.create(null);
    const normalizedById = Object.create(null);

    for (const srcId of nodeIds) {
      const dist = exp.bfsDistances(adjacency, srcId);

      let sumDist = 0;
      let reachable = 0;

      for (const otherId of nodeIds) {
        if (otherId === srcId) continue;
        const d = dist.get(otherId);
        if (d !== undefined && d > 0) {
          sumDist += d;
          reachable += 1;
        }
      }

      // Classic closeness: (n-1) / sumDist
      // If sumDist is 0 (isolated node), closeness is 0.
      const classic = sumDist > 0 ? (n - 1) / sumDist : 0;

      // Wasserman-Faust variant for disconnected graphs:
      // C_WF(v) = (r / (n-1)) * (r / sumDist)
      let wf = 0;
      if (reachable > 0 && n > 1) {
        wf = (reachable / (n - 1)) * (reachable / sumDist);
      }

      closenessById[String(srcId)] = classic;
      wassermanFaustById[String(srcId)] = wf;

      if (normalized) {
        // Normalized classic closeness is the same as classic (already normalized by n-1).
        // We provide it explicitly for API consistency with other centrality functions.
        normalizedById[String(srcId)] = classic;
      }
    }

    const out = {
      n,
      closeness: closenessById,
      wassermanFaust: wassermanFaustById,
    };

    if (normalized) {
      out.normalized = normalizedById;
    }

    if (debug) {
      out.debug = built.debug;
    }

    return out;
  }

  falkor.register('exp.closenessCentrality', closenessCentrality);

  // Conditional Export for Jest
  // QuickJS/FalkorDB will ignore this because 'module' is not defined.
  // istanbul ignore next
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      closenessCentrality,
    };
  }
})();
