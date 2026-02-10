/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Degree centrality (experimental).
 *
 * Notes:
 * - Builds an in-memory undirected adjacency for the provided node set using `graph.traverse`.
 * - Treats the observed edges as undirected (symmetrized), similar to exp.louvain/exp.leiden.
 */

// Ensure shared helpers are loaded when running under Node/Jest.
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  require('./community');
}

(function initExpDegreeCentrality() {
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

  function degreeCentrality({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    normalized = true,
    getNodeId = exp.defaultGetNodeId,
    getWeight = (edge) => exp.getEdgeWeight(edge),
    debug = false,
  }) {
    if (typeof exp.buildUndirectedAdjacency !== 'function') {
      throw new TypeError('exp.degreeCentrality: missing shared helper buildUndirectedAdjacency');
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

    const degreeById = Object.create(null);
    const weightedDegreeById = Object.create(null);
    const normalizedById = Object.create(null);

    let maxDegree = 0;

    for (const id of nodeIds) {
      const neigh = adjacency.get(id) || new Map();
      let deg = 0;
      let wdeg = 0;

      for (const [nbrId, w] of neigh.entries()) {
        if (nbrId === id) continue; // ignore self-loops for centrality
        deg += 1;
        wdeg += w;
      }

      degreeById[String(id)] = deg;
      weightedDegreeById[String(id)] = wdeg;

      if (deg > maxDegree) maxDegree = deg;

      if (normalized) {
        normalizedById[String(id)] = n > 1 ? deg / (n - 1) : 0;
      }
    }

    const out = {
      n,
      maxDegree,
      degree: degreeById,
      weightedDegree: weightedDegreeById,
    };

    if (normalized) {
      out.normalized = normalizedById;
    }

    if (debug) {
      out.debug = built.debug;
    }

    return out;
  }

  falkor.register('exp.degreeCentrality', degreeCentrality);

  // Conditional Export for Jest
  // QuickJS/FalkorDB will ignore this because 'module' is not defined.
  // istanbul ignore next
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      degreeCentrality,
    };
  }
})();
