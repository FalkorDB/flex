/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

(function initFlexExpAlgoCommunityHelpers() {
  const g =
    // QuickJS/FalkorDB should support globalThis, but keep a fallback.
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

  function defineIfMissing(key, value) {
    // Always assign.
    // - Prevents stale behavior if FLEX is reloaded with GRAPH.UDF LOAD REPLACE.
    // - Maintains order-independence across concatenated modules.
    exp[key] = value;
  }

  defineIfMissing('getEdgeWeight', function getEdgeWeight(
    edge,
    {
      keys = ['weight'],
      defaultValue = 1,
      minValue = 0,
    } = {}
  ) {
    if (edge) {
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(edge, k)) {
          const v = edge[k];
          if (typeof v === 'number' && Number.isFinite(v)) {
            return v < minValue ? minValue : v;
          }
        }
      }
    }
    return defaultValue;
  });

  defineIfMissing('defaultGetNodeId', function defaultGetNodeId(node) {
    if (node == null) return undefined;
    if (typeof node === 'number' || typeof node === 'string') return node;
    return node.id;
  });

  defineIfMissing('stableKeyPart', function stableKeyPart(x) {
    // We only need a stable ordering for undirected edge keys.
    // Note: this can collide for ids like 1 and "1".
    return String(x);
  });

  defineIfMissing('makeUndirectedEdgeKey', function makeUndirectedEdgeKey(a, b) {
    const sa = exp.stableKeyPart(a);
    const sb = exp.stableKeyPart(b);
    return sa <= sb ? `${sa}::${sb}` : `${sb}::${sa}`;
  });

  defineIfMissing('otherEndpoint', function otherEndpoint(edge, currentId, getNodeId) {
    const s = edge ? edge.source : undefined;
    const d = edge ? edge.destination : undefined;

    const sId = s != null ? getNodeId(s) : undefined;
    const dId = d != null ? getNodeId(d) : undefined;

    if (
      typeof sId !== 'undefined' &&
      sId !== null &&
      typeof dId !== 'undefined' &&
      dId !== null
    ) {
      // If both endpoints exist, pick the one that isn't the current node.
      if (sId === currentId) return d;
      if (dId === currentId) return s;

      // If neither matches (unexpected), just return one endpoint.
      return s;
    }

    // Fallbacks (some environments might not provide both endpoints)
    // In that case, we assume `source` is the reachable neighbor (common in UDFs).
    if (s !== undefined && s !== null) return s;
    if (d !== undefined && d !== null) return d;
    return null;
  });

  defineIfMissing('normalizeTraverseDirections', function normalizeTraverseDirections(direction) {
    // UDF runtimes differ in whether they support direction: 'both'.
    // For portability, interpret 'both' as ['incoming','outgoing'].
    const out = [];

    const add = (d) => {
      if (d == null) return;
      if (d === 'both') {
        out.push('incoming', 'outgoing');
      } else {
        out.push(d);
      }
    };

    if (Array.isArray(direction)) {
      for (const d of direction) add(d);
    } else if (direction == null) {
      add('both');
    } else {
      add(direction);
    }

    return out;
  });

  defineIfMissing('traverseEdgesForNode', function traverseEdgesForNode(node, dir) {
    if (typeof graph === 'undefined' || !graph || typeof graph.traverse !== 'function') {
      throw new TypeError('buildUndirectedAdjacency: global `graph.traverse` is not available');
    }

    return (
      graph.traverse([node], {
        direction: dir,
        returnType: 'edges',
      }) || []
    );
  });

  /**
   * Build an undirected weighted adjacency map using `graph.traverse`.
   *
   * Important: adjacency is built only over the provided node list.
   * Any edge to a node outside `nodes` is ignored.
   */
  defineIfMissing('buildUndirectedAdjacency', function buildUndirectedAdjacency({
    nodes,
    direction = 'both',
    maxEdgesPerNode = Infinity,
    getNodeId = exp.defaultGetNodeId,
    getWeight = (edge) => exp.getEdgeWeight(edge),
    debug = false,
  }) {
    if (!Array.isArray(nodes)) {
      throw new TypeError('buildUndirectedAdjacency: `nodes` must be an array');
    }

    const nodeIds = [];
    const byStableId = new Map();
    for (const n of nodes) {
      const id = getNodeId(n);
      if (typeof id === 'undefined') continue;
      nodeIds.push(id);
      byStableId.set(exp.stableKeyPart(id), id);
    }

    const allowed = new Set(nodeIds);

    // First collect undirected edges into a canonical key -> weight map.
    // This avoids double-counting when the same connection is observed from
    // multiple traversal directions / endpoints.
    const undirectedWeightByKey = new Map();
    const selfLoopWeightById = new Map();

    const debugEdgeCounts = debug ? Object.create(null) : null;

    const directions = exp.normalizeTraverseDirections(direction);

    for (const dir of directions) {
      for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i];
        const currentId = getNodeId(current);
        if (typeof currentId === 'undefined') continue;

        const reachables = exp.traverseEdgesForNode(current, dir);
        const edges = reachables[0] || [];

        if (debugEdgeCounts) {
          const k = String(currentId);
          debugEdgeCounts[k] = (debugEdgeCounts[k] || 0) + edges.length;
        }

        const edgeCount = Math.min(edges.length, maxEdgesPerNode);

        for (let e = 0; e < edgeCount; e++) {
          const edge = edges[e];
          const w = getWeight(edge);
          if (!(w > 0)) continue;

          const s = edge ? edge.source : undefined;
          const d = edge ? edge.destination : undefined;
          const sId = s != null ? getNodeId(s) : undefined;
          const dId = d != null ? getNodeId(d) : undefined;

          // Preferred path: use both edge endpoints directly.
          if (
            typeof sId !== 'undefined' &&
            sId !== null &&
            typeof dId !== 'undefined' &&
            dId !== null
          ) {
            // Ignore edges not wholly within the node set.
            if (!allowed.has(sId) || !allowed.has(dId)) continue;

            if (sId === dId) {
              selfLoopWeightById.set(sId, (selfLoopWeightById.get(sId) || 0) + w);
              continue;
            }

            const key = exp.makeUndirectedEdgeKey(sId, dId);
            undirectedWeightByKey.set(key, (undirectedWeightByKey.get(key) || 0) + w);
            continue;
          }

          // Fallback: if only one endpoint is present, infer neighbor relative to current.
          if (!allowed.has(currentId)) continue;

          const neighbor = exp.otherEndpoint(edge, currentId, getNodeId);
          const nId = getNodeId(neighbor);
          if (typeof nId === 'undefined' || nId === null) continue;
          if (!allowed.has(nId)) continue;

          // If we couldn't infer a neighbor (common when traverse output omits endpoints),
          // treat it as ambiguous and skip it.
          // Real self-loops are handled in the (sId === dId) path above.
          if (nId === currentId) {
            continue;
          }

          const key = exp.makeUndirectedEdgeKey(currentId, nId);
          undirectedWeightByKey.set(key, (undirectedWeightByKey.get(key) || 0) + w);
        }
      }
    }

    // Materialize as a symmetric adjacency map.
    const adjacency = new Map();
    for (const id of nodeIds) {
      adjacency.set(id, new Map());
    }

    for (const [id, w] of selfLoopWeightById.entries()) {
      if (!adjacency.has(id)) adjacency.set(id, new Map());
      adjacency.get(id).set(id, (adjacency.get(id).get(id) || 0) + w);
    }

    for (const [key, w] of undirectedWeightByKey.entries()) {
      const parts = key.split('::');
      const aStr = parts[0];
      const bStr = parts[1];

      const a = byStableId.has(aStr) ? byStableId.get(aStr) : aStr;
      const b = byStableId.has(bStr) ? byStableId.get(bStr) : bStr;

      if (!adjacency.has(a)) adjacency.set(a, new Map());
      if (!adjacency.has(b)) adjacency.set(b, new Map());

      adjacency.get(a).set(b, (adjacency.get(a).get(b) || 0) + w);
      adjacency.get(b).set(a, (adjacency.get(b).get(a) || 0) + w);
    }

    let totalUndirectedWeight = 0;
    for (const w of undirectedWeightByKey.values()) totalUndirectedWeight += w;

    let totalSelfLoopWeight = 0;
    for (const w of selfLoopWeightById.values()) totalSelfLoopWeight += w;

    return {
      adjacency,
      nodeIds,
      debug: debugEdgeCounts
        ? {
            edgeCounts: debugEdgeCounts,
            undirectedEdgeKeys: undirectedWeightByKey.size,
            totalUndirectedWeight,
            totalSelfLoopWeight,
            directions,
          }
        : undefined,
    };
  });

  defineIfMissing('renumberPartition', function renumberPartition(partition) {
    const newByOld = new Map();
    let next = 0;
    const out = new Map();

    for (const [nodeId, c] of partition.entries()) {
      if (!newByOld.has(c)) newByOld.set(c, next++);
      out.set(nodeId, newByOld.get(c));
    }

    return out;
  });

  defineIfMissing('partitionToCommunities', function partitionToCommunities(partition) {
    const commToNodes = new Map();
    for (const [nodeId, c] of partition.entries()) {
      if (!commToNodes.has(c)) commToNodes.set(c, []);
      commToNodes.get(c).push(nodeId);
    }
    return commToNodes;
  });

  defineIfMissing('communitiesToObject', function communitiesToObject(communities) {
    const obj = Object.create(null);
    for (const [c, nodes] of communities.entries()) {
      obj[String(c)] = nodes;
    }
    return obj;
  });

  defineIfMissing('partitionToObject', function partitionToObject(partition) {
    const obj = Object.create(null);
    for (const [k, v] of partition.entries()) {
      obj[String(k)] = v;
    }
    return obj;
  });

  /**
   * Perform a single Louvain-style "local moving" phase on a given adjacency graph.
   *
   * If `random` is provided, node iteration order is shuffled per pass.
   */
  defineIfMissing('oneLevel', function oneLevel({
    adjacency,
    nodeIds,
    resolution,
    maxPasses,
    minGain,
    random,
  }) {
    // Precompute degrees and m2 (sum of degrees).
    const degree = new Map();
    let m2 = 0;
    for (const id of nodeIds) {
      const neigh = adjacency.get(id) || new Map();
      let k = 0;
      for (const w of neigh.values()) k += w;
      degree.set(id, k);
      m2 += k;
    }

    // Trivial graph.
    if (!(m2 > 0)) {
      const trivial = new Map();
      for (const id of nodeIds) trivial.set(id, id);
      return { partition: exp.renumberPartition(trivial), moved: false, moves: 0 };
    }

    // Init: each node in its own community.
    const partition = new Map();
    const tot = new Map();
    for (const id of nodeIds) {
      partition.set(id, id);
      tot.set(id, degree.get(id) || 0);
    }

    const shuffleInPlace = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    };

    let movedAny = false;
    let moves = 0;

    for (let pass = 0; pass < maxPasses; pass++) {
      let movedThisPass = false;

      const order = random ? nodeIds.slice() : nodeIds;
      if (random) shuffleInPlace(order);

      for (const nodeId of order) {
        const nodeDegree = degree.get(nodeId) || 0;
        const currentComm = partition.get(nodeId);

        // Compute weights of edges from nodeId to each neighboring community.
        const neighComms = new Map();
        const neigh = adjacency.get(nodeId) || new Map();
        for (const [nbrId, w] of neigh.entries()) {
          if (!(w > 0)) continue;
          const c = partition.get(nbrId);
          neighComms.set(c, (neighComms.get(c) || 0) + w);
        }

        // Remove node from its current community (update tot only).
        tot.set(currentComm, (tot.get(currentComm) || 0) - nodeDegree);

        let bestComm = currentComm;
        let bestGain = 0;

        for (const [c, k_i_in] of neighComms.entries()) {
          const totC = tot.get(c) || 0;
          // Gain proxy (constant scaling by 1/m2 omitted).
          const gain = k_i_in - (resolution * totC * nodeDegree) / m2;
          if (gain > bestGain) {
            bestGain = gain;
            bestComm = c;
          }
        }

        // Move if beneficial.
        if (bestComm !== currentComm && bestGain > minGain) {
          partition.set(nodeId, bestComm);
          movedThisPass = true;
          movedAny = true;
          moves += 1;
        } else {
          partition.set(nodeId, currentComm);
        }

        // Add node to its (possibly new) community.
        tot.set(bestComm, (tot.get(bestComm) || 0) + nodeDegree);
      }

      if (!movedThisPass) break;
    }

    return { partition: exp.renumberPartition(partition), moved: movedAny, moves };
  });

  /**
   * Induce a graph where each community becomes a node.
   * The returned graph is a weighted adjacency map where weights are summed between communities.
   */
  defineIfMissing('inducedGraph', function inducedGraph({ adjacency, partition }) {
    const out = new Map();

    for (const [i, neigh] of adjacency.entries()) {
      const ci = partition.get(i);
      if (!out.has(ci)) out.set(ci, new Map());

      const row = out.get(ci);
      for (const [j, w] of neigh.entries()) {
        const cj = partition.get(j);
        row.set(cj, (row.get(cj) || 0) + w);
      }
    }

    const nodeIds = Array.from(out.keys());
    return { adjacency: out, nodeIds };
  });
})();

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.__flexExpAlgo;
}
