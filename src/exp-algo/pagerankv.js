/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * PageRank (experimental) with optional edge weight consideration.
 *
 * Pragmatic UDF-oriented implementation:
 * - builds directed adjacency from a provided node set using graph.traverse
 * - runs power-iteration until convergence or maxIterations
 * - supports weighted transitions based on an edge weight attribute
 */

// Ensure shared helpers are loaded when running under Node/Jest.
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  require('./community');
}

(function initExpPageRankV() {
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

  function mapToObject(map) {
    const obj = Object.create(null);
    for (const [k, v] of map.entries()) {
      obj[String(k)] = v;
    }
    return obj;
  }

  /**
   * Weighted PageRank over a node set.
   *
   * @param {object} params
   * @param {any[]} params.nodes Input nodes (objects), must include `id` by default.
   * @param {string|string[]} [params.direction='both'] Traversal direction(s) used to build adjacency.
   * @param {number} [params.maxEdgesPerNode=Infinity] Safety cap per node traversal.
   * @param {number} [params.damping=0.85] Damping factor (alpha).
   * @param {number} [params.maxIterations=50] Maximum power-iterations.
   * @param {number} [params.tolerance=1e-8] L1 delta threshold for convergence.
   * @param {string|string[]} [params.weightAttribute='weight'] Edge attribute(s) to read weight from.
   * @param {number} [params.defaultWeight=1] Weight to use when attribute is missing.
   * @param {number} [params.minWeight=0] Lower bound clamp for weights.
   * @param {(node:any)=>any} [params.getNodeId]
   * @param {boolean} [params.debug=false]
   *
   * @returns {{ scores: Object, iterations: number, converged: boolean, debug?: Object }}
   */
  function pagerankv({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    damping = 0.85,
    maxIterations = 50,
    tolerance = 1e-8,
    weightAttribute = 'weight',
    defaultWeight = 1,
    minWeight = 0,
    getNodeId = exp.defaultGetNodeId,
    debug = false,
  }) {
    const keys = Array.isArray(weightAttribute) ? weightAttribute : [weightAttribute];

    const getWeight = (edge) =>
      exp.getEdgeWeight(edge, {
        keys,
        defaultValue: defaultWeight,
        minValue: minWeight,
      });

    const built = exp.buildDirectedAdjacency({
      nodes,
      direction,
      maxEdgesPerNode,
      getNodeId,
      getWeight,
      debug,
    });

    const nodeIds = built.nodeIds;
    const adjacency = built.adjacency;
    const n = nodeIds.length;

    if (n === 0) {
      return { scores: Object.create(null), iterations: 0, converged: true };
    }

    const clampDamping =
      typeof damping === 'number' && Number.isFinite(damping)
        ? Math.min(1, Math.max(0, damping))
        : 0.85;

    const maxIter =
      typeof maxIterations === 'number' && Number.isFinite(maxIterations) && maxIterations > 0
        ? Math.floor(maxIterations)
        : 50;

    const tol =
      typeof tolerance === 'number' && Number.isFinite(tolerance) && tolerance >= 0
        ? tolerance
        : 1e-8;

    const index = new Map();
    for (let i = 0; i < n; i++) {
      index.set(nodeIds[i], i);
    }

    const outWeight = new Array(n);
    for (let i = 0; i < n; i++) {
      const id = nodeIds[i];
      const row = adjacency.get(id);
      let s = 0;
      if (row) {
        for (const w of row.values()) {
          if (w > 0) s += w;
        }
      }
      outWeight[i] = s;
    }

    // Initial uniform distribution.
    let rank = new Array(n);
    for (let i = 0; i < n; i++) rank[i] = 1 / n;

    let next = new Array(n);

    const base = (1 - clampDamping) / n;

    let converged = false;
    let iterations = 0;
    const deltas = debug ? [] : null;

    for (let iter = 0; iter < maxIter; iter++) {
      iterations = iter + 1;

      for (let i = 0; i < n; i++) next[i] = base;

      let danglingMass = 0;

      for (let i = 0; i < n; i++) {
        const r = rank[i];
        const ow = outWeight[i];
        if (!(ow > 0)) {
          danglingMass += r;
          continue;
        }

        const srcId = nodeIds[i];
        const row = adjacency.get(srcId);
        if (!row) {
          danglingMass += r;
          continue;
        }

        const factor = (clampDamping * r) / ow;

        for (const [dstId, w] of row.entries()) {
          if (!(w > 0)) continue;
          const j = index.get(dstId);
          if (typeof j !== 'number') continue;
          next[j] += factor * w;
        }
      }

      if (danglingMass > 0) {
        const add = (clampDamping * danglingMass) / n;
        for (let j = 0; j < n; j++) next[j] += add;
      }

      let delta = 0;
      for (let j = 0; j < n; j++) {
        delta += Math.abs(next[j] - rank[j]);
      }

      if (deltas) deltas.push(delta);

      // swap
      const tmp = rank;
      rank = next;
      next = tmp;

      if (delta <= tol) {
        converged = true;
        break;
      }
    }

    const scores = new Map();
    for (let i = 0; i < n; i++) {
      scores.set(nodeIds[i], rank[i]);
    }

    const out = {
      scores: mapToObject(scores),
      iterations,
      converged,
    };

    if (debug) {
      out.debug = {
        adjacency: built.debug,
        deltas,
      };
    }

    return out;
  }

  falkor.register('exp.pagerankv', pagerankv);

  // Conditional Export for Jest
  // QuickJS/FalkorDB will ignore this because 'module' is not defined.
  // istanbul ignore next
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      pagerankv,
    };
  }
})();
