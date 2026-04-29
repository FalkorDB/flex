/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * PageRank (experimental) with optional edge weight consideration.
 *
 * Pragmatic UDF-oriented implementation:
 * - builds directed adjacency from a provided node set using graph.traverse
 * - runs power-iteration until convergence or maxIterations
 * - supports weighted transitions based on edge attributes or a custom weight function
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

  function coerceEdgeWeight(value, { defaultWeight, minWeight }) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return defaultWeight;
    }
    return value < minWeight ? minWeight : value;
  }

  function buildAttributeWeightedSumGetter(weightAttribute, { defaultWeight, minWeight }) {
    const isMap = weightAttribute instanceof Map;
    const isObject =
      !isMap && weightAttribute != null && typeof weightAttribute === 'object' && !Array.isArray(weightAttribute);

    if (!isMap && !isObject) return null;

    const entries = isMap ? Array.from(weightAttribute.entries()) : Object.entries(weightAttribute);
    if (entries.length === 0) {
      throw new TypeError('pagerankv: `weightAttribute` map must include at least one key');
    }

    const terms = entries.map(([k, coeff]) => {
      if (typeof coeff !== 'number' || !Number.isFinite(coeff)) {
        throw new TypeError('pagerankv: `weightAttribute` map values must be finite numbers');
      }
      return [String(k), coeff];
    });

    return (edge) => {
      if (!edge) return defaultWeight;

      let seen = false;
      let total = 0;

      for (const [k, coeff] of terms) {
        if (!Object.prototype.hasOwnProperty.call(edge, k)) continue;
        const v = edge[k];
        if (typeof v !== 'number' || !Number.isFinite(v)) continue;
        total += v * coeff;
        seen = true;
      }

      if (!seen) return defaultWeight;
      return total < minWeight ? minWeight : total;
    };
  }

  function buildEdgeWeightGetter({ weightAttribute, defaultWeight, minWeight, getWeight }) {
    if (typeof getWeight === 'function') {
      return (edge) =>
        coerceEdgeWeight(
          getWeight(edge, {
            defaultWeight,
            minWeight,
            getEdgeWeight: exp.getEdgeWeight,
          }),
          { defaultWeight, minWeight }
        );
    }

    const weightedSumGetter = buildAttributeWeightedSumGetter(weightAttribute, {
      defaultWeight,
      minWeight,
    });
    if (weightedSumGetter) return weightedSumGetter;

    const keys = Array.isArray(weightAttribute) ? weightAttribute : [weightAttribute];
    return (edge) =>
      exp.getEdgeWeight(edge, {
        keys,
        defaultValue: defaultWeight,
        minValue: minWeight,
      });
  }

  function normalizeNodeWeightMap(raw, { n, stableIndex, name }) {
    if (raw == null) {
      const uniform = new Array(n);
      for (let i = 0; i < n; i++) uniform[i] = 1 / n;
      return uniform;
    }

    const isMap = raw instanceof Map;
    const isObject = !isMap && typeof raw === 'object' && !Array.isArray(raw);
    if (!isObject && !isMap) {
      throw new TypeError(`pagerankv: \`${name}\` must be an object map or Map`);
    }

    const vec = new Array(n);
    for (let i = 0; i < n; i++) vec[i] = 0;

    const addEntry = (k, v) => {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw new TypeError(`pagerankv: \`${name}\` values must be finite numbers`);
      }
      if (v < 0) {
        throw new RangeError(`pagerankv: \`${name}\` values must be >= 0`);
      }

      const sid = exp.stableKeyPart(k);
      const idx = stableIndex.get(sid);
      if (typeof idx !== 'number') return;
      vec[idx] += v;
    };

    if (isMap) {
      for (const [k, v] of raw.entries()) addEntry(k, v);
    } else {
      for (const [k, v] of Object.entries(raw)) addEntry(k, v);
    }

    let sum = 0;
    for (let i = 0; i < n; i++) sum += vec[i];
    if (!(sum > 0)) {
      throw new TypeError(
        `pagerankv: \`${name}\` must assign positive weight to at least one input node`
      );
    }

    for (let i = 0; i < n; i++) vec[i] /= sum;
    return vec;
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
   * @param {string|string[]|Object<string,number>|Map<string,number>} [params.weightAttribute='weight'] Edge attribute key(s), or a key->coefficient map for weighted sum.
   * @param {number} [params.defaultWeight=1] Weight to use when attribute is missing.
   * @param {number} [params.minWeight=0] Lower bound clamp for weights.
   * @param {(edge:any,ctx:{defaultWeight:number,minWeight:number,getEdgeWeight:(edge:any,opts?:object)=>number})=>number} [params.getWeight] Custom edge weight function; when provided, overrides `weightAttribute`.
   * @param {Object<string,number>|Map<any,number>} [params.personalization]
   * @param {Object<string,number>|Map<any,number>} [params.dangling]
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
    getWeight = null,
    personalization = null,
    dangling = null,
    getNodeId = exp.defaultGetNodeId,
    debug = false,
  }) {
    const edgeWeight = buildEdgeWeightGetter({
      weightAttribute,
      defaultWeight,
      minWeight,
      getWeight,
    });

    const built = exp.buildDirectedAdjacency({
      nodes,
      direction,
      maxEdgesPerNode,
      getNodeId,
      getWeight: edgeWeight,
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
    const stableIndex = new Map();
    for (let i = 0; i < n; i++) {
      const id = nodeIds[i];
      index.set(id, i);
      stableIndex.set(exp.stableKeyPart(id), i);
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

    const personalizationVector = normalizeNodeWeightMap(personalization, {
      n,
      stableIndex,
      name: 'personalization',
    });

    const danglingVector =
      dangling == null
        ? personalizationVector
        : normalizeNodeWeightMap(dangling, {
            n,
            stableIndex,
            name: 'dangling',
          });

    let converged = false;
    let iterations = 0;
    const deltas = debug ? [] : null;

    for (let iter = 0; iter < maxIter; iter++) {
      iterations = iter + 1;

      for (let i = 0; i < n; i++) next[i] = (1 - clampDamping) * personalizationVector[i];

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
        const add = clampDamping * danglingMass;
        for (let j = 0; j < n; j++) next[j] += add * danglingVector[j];
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
