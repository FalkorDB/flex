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
    if (typeof exp.bfsDistances !== 'function') {
      throw new TypeError('exp.harmonicCentrality: missing shared helper bfsDistances');
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
      const dist = exp.bfsDistances(adjacency, srcId);

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
    };
  }
})();
