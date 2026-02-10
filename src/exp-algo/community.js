/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

(function initFlexExpAlgoCommunityHelpers() {
  const g =
    // istanbul ignore next
    typeof globalThis !== 'undefined'
      ? globalThis
      : // istanbul ignore next
        typeof self !== 'undefined'
        ? self
        : this;

  const exp = g.__flexExpAlgo || (g.__flexExpAlgo = Object.create(null));

  // Always assign to avoid stale state across GRAPH.UDF LOAD REPLACE.
  const define = (key, value) => {
    exp[key] = value;
  };

  define('getEdgeWeight', function getEdgeWeight(
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

  define('defaultGetNodeId', function defaultGetNodeId(node) {
    if (node == null) return undefined;
    if (typeof node === 'number' || typeof node === 'string') return node;
    return node.id;
  });

  define('stableKeyPart', function stableKeyPart(x) {
    // Stable ordering for undirected edge keys.
    // Note: this can collide for ids like 1 and "1".
    return String(x);
  });

  define('otherEndpoint', function otherEndpoint(edge, currentId, getNodeId) {
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
      if (sId === currentId) return d;
      if (dId === currentId) return s;
      return s;
    }

    // Fallbacks (some environments might not provide both endpoints)
    if (s !== undefined && s !== null) return s;
    if (d !== undefined && d !== null) return d;
    return null;
  });

  define('normalizeTraverseDirections', function normalizeTraverseDirections(direction) {
    // For portability, interpret 'both' as ['incoming','outgoing'].
    const out = [];
    const seen = new Set();

    const add = (d) => {
      if (!d) return;
      if (d === 'both') {
        if (!seen.has('incoming')) {
          seen.add('incoming');
          out.push('incoming');
        }
        if (!seen.has('outgoing')) {
          seen.add('outgoing');
          out.push('outgoing');
        }
        return;
      }
      if (!seen.has(d)) {
        seen.add(d);
        out.push(d);
      }
    };

    if (Array.isArray(direction)) {
      for (const d of direction) add(d);
    } else {
      add(direction || 'both');
    }

    return out;
  });

  define('traverseEdgesForNode', function traverseEdgesForNode(node, dir) {
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
   * Important:
   * - adjacency is built only over the provided node list
   * - any edge to a node outside `nodes` is ignored
   */
  define('buildUndirectedAdjacency', function buildUndirectedAdjacency({
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

    // Dedupe ids by stable key.
    const nodeIds = [];
    const byStableId = new Map();
    for (const n of nodes) {
      const id = getNodeId(n);
      if (typeof id === 'undefined' || id === null) continue;
      const sid = exp.stableKeyPart(id);
      if (byStableId.has(sid)) continue;
      byStableId.set(sid, id);
      nodeIds.push(id);
    }

    const allowedStable = new Set(byStableId.keys());

    // Collect undirected weights as (aStable -> (bStable -> weight)), where aStable <= bStable.
    const undirectedWeights = new Map();
    const selfLoopWeightByStable = new Map();

    const debugEdgeCounts = debug ? Object.create(null) : null;
    const directions = exp.normalizeTraverseDirections(direction);

    const addUndirected = (aStable, bStable, w) => {
      const left = aStable <= bStable ? aStable : bStable;
      const right = aStable <= bStable ? bStable : aStable;
      let row = undirectedWeights.get(left);
      if (!row) {
        row = new Map();
        undirectedWeights.set(left, row);
      }
      row.set(right, (row.get(right) || 0) + w);
    };

    for (const dir of directions) {
      for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i];
        const currentId = getNodeId(current);
        if (typeof currentId === 'undefined' || currentId === null) continue;

        const currentStable = exp.stableKeyPart(currentId);
        if (!allowedStable.has(currentStable)) continue;

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

          // Preferred path: use both endpoints.
          if (
            typeof sId !== 'undefined' &&
            sId !== null &&
            typeof dId !== 'undefined' &&
            dId !== null
          ) {
            const sStable = exp.stableKeyPart(sId);
            const dStable = exp.stableKeyPart(dId);
            if (!allowedStable.has(sStable) || !allowedStable.has(dStable)) continue;

            if (sStable === dStable) {
              selfLoopWeightByStable.set(
                sStable,
                (selfLoopWeightByStable.get(sStable) || 0) + w
              );
            } else {
              addUndirected(sStable, dStable, w);
            }

            continue;
          }

          // Fallback: infer neighbor relative to current.
          const neighbor = exp.otherEndpoint(edge, currentId, getNodeId);
          const nId = getNodeId(neighbor);
          if (typeof nId === 'undefined' || nId === null) continue;

          const nStable = exp.stableKeyPart(nId);
          if (!allowedStable.has(nStable)) continue;

          // If we couldn't infer a neighbor, treat it as ambiguous and skip.
          // Real self-loops are handled above.
          if (nStable === currentStable) continue;

          addUndirected(currentStable, nStable, w);
        }
      }
    }

    // Materialize symmetric adjacency.
    const adjacency = new Map();
    for (const id of nodeIds) adjacency.set(id, new Map());

    for (const [sid, w] of selfLoopWeightByStable.entries()) {
      const id = byStableId.has(sid) ? byStableId.get(sid) : sid;
      const row = adjacency.get(id) || new Map();
      row.set(id, (row.get(id) || 0) + w);
      adjacency.set(id, row);
    }

    let undirectedEdgeKeys = 0;

    for (const [aStable, row] of undirectedWeights.entries()) {
      const a = byStableId.has(aStable) ? byStableId.get(aStable) : aStable;
      for (const [bStable, w] of row.entries()) {
        undirectedEdgeKeys += 1;
        const b = byStableId.has(bStable) ? byStableId.get(bStable) : bStable;

        let aRow = adjacency.get(a);
        if (!aRow) {
          aRow = new Map();
          adjacency.set(a, aRow);
        }
        let bRow = adjacency.get(b);
        if (!bRow) {
          bRow = new Map();
          adjacency.set(b, bRow);
        }

        aRow.set(b, (aRow.get(b) || 0) + w);
        bRow.set(a, (bRow.get(a) || 0) + w);
      }
    }

    let debugOut;
    if (debugEdgeCounts) {
      let totalUndirectedWeight = 0;
      for (const row of undirectedWeights.values()) {
        for (const w of row.values()) totalUndirectedWeight += w;
      }

      let totalSelfLoopWeight = 0;
      for (const w of selfLoopWeightByStable.values()) totalSelfLoopWeight += w;

      debugOut = {
        edgeCounts: debugEdgeCounts,
        undirectedEdgeKeys,
        totalUndirectedWeight,
        totalSelfLoopWeight,
        directions,
      };
    }

    return { adjacency, nodeIds, debug: debugOut };
  });

  define('renumberPartition', function renumberPartition(partition) {
    const newByOld = new Map();
    let next = 0;
    const out = new Map();

    for (const [nodeId, c] of partition.entries()) {
      if (!newByOld.has(c)) newByOld.set(c, next++);
      out.set(nodeId, newByOld.get(c));
    }

    return out;
  });

  define('partitionToCommunities', function partitionToCommunities(partition) {
    const commToNodes = new Map();
    for (const [nodeId, c] of partition.entries()) {
      let arr = commToNodes.get(c);
      if (!arr) {
        arr = [];
        commToNodes.set(c, arr);
      }
      arr.push(nodeId);
    }
    return commToNodes;
  });

  define('communitiesToObject', function communitiesToObject(communities) {
    const obj = Object.create(null);
    for (const [c, nodes] of communities.entries()) {
      obj[String(c)] = nodes;
    }
    return obj;
  });

  define('partitionToObject', function partitionToObject(partition) {
    const obj = Object.create(null);
    for (const [k, v] of partition.entries()) {
      obj[String(k)] = v;
    }
    return obj;
  });

  /**
   * Perform a single Louvain-style "local moving" phase.
   * If `random` is provided, node iteration order is shuffled per pass.
   */
  define('oneLevel', function oneLevel({
    adjacency,
    nodeIds,
    resolution,
    maxPasses,
    minGain,
    random,
  }) {
    const degree = new Map();
    let m2 = 0;

    for (const id of nodeIds) {
      const neigh = adjacency.get(id) || new Map();
      let k = 0;
      for (const w of neigh.values()) k += w;
      degree.set(id, k);
      m2 += k;
    }

    if (!(m2 > 0)) {
      const trivial = new Map();
      for (const id of nodeIds) trivial.set(id, id);
      return { partition: exp.renumberPartition(trivial), moved: false, moves: 0 };
    }

    const partition = new Map();
    const tot = new Map();
    for (const id of nodeIds) {
      partition.set(id, id);
      tot.set(id, degree.get(id) || 0);
    }

    const shuffleInPlace =
      random &&
      ((arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          const tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
        }
      });

    let movedAny = false;
    let moves = 0;

    for (let pass = 0; pass < maxPasses; pass++) {
      let movedThisPass = false;

      const order = random ? nodeIds.slice() : nodeIds;
      if (shuffleInPlace) shuffleInPlace(order);

      for (const nodeId of order) {
        const nodeDegree = degree.get(nodeId) || 0;
        const currentComm = partition.get(nodeId);

        const neighComms = new Map();
        const neigh = adjacency.get(nodeId) || new Map();
        for (const [nbrId, w] of neigh.entries()) {
          if (!(w > 0)) continue;
          const c = partition.get(nbrId);
          neighComms.set(c, (neighComms.get(c) || 0) + w);
        }

        tot.set(currentComm, (tot.get(currentComm) || 0) - nodeDegree);

        let bestComm = currentComm;
        let bestGain = 0;

        for (const [c, k_i_in] of neighComms.entries()) {
          const totC = tot.get(c) || 0;
          const gain = k_i_in - (resolution * totC * nodeDegree) / m2;
          if (gain > bestGain) {
            bestGain = gain;
            bestComm = c;
          }
        }

        if (bestComm !== currentComm && bestGain > minGain) {
          partition.set(nodeId, bestComm);
          movedThisPass = true;
          movedAny = true;
          moves += 1;
        } else {
          partition.set(nodeId, currentComm);
        }

        tot.set(bestComm, (tot.get(bestComm) || 0) + nodeDegree);
      }

      if (!movedThisPass) break;
    }

    return { partition: exp.renumberPartition(partition), moved: movedAny, moves };
  });

  define('inducedGraph', function inducedGraph({ adjacency, partition }) {
    const out = new Map();

    for (const [i, neigh] of adjacency.entries()) {
      const ci = partition.get(i);
      let row = out.get(ci);
      if (!row) {
        row = new Map();
        out.set(ci, row);
      }

      for (const [j, w] of neigh.entries()) {
        const cj = partition.get(j);
        row.set(cj, (row.get(cj) || 0) + w);
      }
    }

    return { adjacency: out, nodeIds: Array.from(out.keys()) };
  });
})();

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.__flexExpAlgo;
}
