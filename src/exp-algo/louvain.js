/**
 * Louvain community detection (modularity optimization).
 *
 * This implementation is designed to run in the FalkorDB/RedisGraph UDF
 * environment, and relies on the global `graph.traverse` function to build
 * an in-memory adjacency structure.
 *
 * Notes:
 * - The implementation treats the traversed neighborhood graph as UNDIRECTED
 *   (it will symmetrize edges when building adjacency).
 * - You must provide the list of nodes to consider (there is no portable
 *   `graph.nodes()` API across environments).
 * - Edge weights default to 1 when missing.
 */

/**
 * Defensive helper to read an edge weight.
 *
 * By default this checks common keys used in various graphs/UDFs.
 */
function getEdgeWeight(
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
}

function defaultGetNodeId(node) {
  if (node == null) return undefined;
  if (typeof node === 'number' || typeof node === 'string') return node;
  return node.id;
}

function stableKeyPart(x) {
  // We only need a stable ordering for undirected edge keys.
  return String(x);
}

function makeUndirectedEdgeKey(a, b) {
  const sa = stableKeyPart(a);
  const sb = stableKeyPart(b);
  return sa <= sb ? `${sa}::${sb}` : `${sb}::${sa}`;
}

function otherEndpoint(edge, currentId, getNodeId) {
  const s = edge ? edge.source : undefined;
  const d = edge ? edge.destination : undefined;

  const sId = s != null ? getNodeId(s) : undefined;
  const dId = d != null ? getNodeId(d) : undefined;

  if (typeof sId !== 'undefined' && sId !== null && typeof dId !== 'undefined' && dId !== null) {
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
}

/**
 * Build an undirected weighted adjacency map using `graph.traverse`.
 *
 * @param {object} params
 * @param {any[]} params.nodes List of node objects (must contain `id` by default).
 * @param {string|string[]} [params.direction=['incoming','outgoing']] Traversal direction(s) to use.
 * @param {number} [params.maxEdgesPerNode=Infinity] Safety cap per traversed node.
 * @param {(node:any)=>any} [params.getNodeId]
 * @param {(edge:any, opts?:any)=>number} [params.getWeight]
 *
 * @returns {{ adjacency: Map<any, Map<any, number>>, nodeIds: any[] }}
 */
function buildUndirectedAdjacency({
  nodes,
  direction = ['incoming', 'outgoing'],
  maxEdgesPerNode = Infinity,
  getNodeId = defaultGetNodeId,
  getWeight = (edge) => getEdgeWeight(edge),
  debug = false,
}) {
  if (!Array.isArray(nodes)) {
    throw new TypeError('buildUndirectedAdjacency: `nodes` must be an array');
  }
  if (typeof graph === 'undefined' || !graph || typeof graph.traverse !== 'function') {
    throw new TypeError('buildUndirectedAdjacency: global `graph.traverse` is not available');
  }

  const nodeIds = [];
  const byStableId = new Map();
  for (const n of nodes) {
    const id = getNodeId(n);
    if (typeof id === 'undefined') continue;
    nodeIds.push(id);
    byStableId.set(stableKeyPart(id), id);
  }

  // First collect undirected edges into a canonical key -> weight map.
  // This avoids double-counting when the same connection is observed from
  // multiple traversal directions / endpoints.
  const undirectedWeightByKey = new Map();
  const selfLoopWeightById = new Map();

  const debugEdgeCounts = debug ? Object.create(null) : null;

  const directions = Array.isArray(direction) ? direction : [direction];

  for (const dir of directions) {
    for (let i = 0; i < nodes.length; i++) {
      const current = nodes[i];
      const currentId = getNodeId(current);
      if (typeof currentId === 'undefined') continue;

      const reachables =
        graph.traverse([current], {
          direction: dir,
          returnType: 'edges',
        }) || [];

      const edges = reachables[0] || [];
      if (debugEdgeCounts) {
        debugEdgeCounts[String(currentId)] = edges.length;
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
        if (typeof sId !== 'undefined' && sId !== null && typeof dId !== 'undefined' && dId !== null) {
          if (sId === dId) {
            selfLoopWeightById.set(sId, (selfLoopWeightById.get(sId) || 0) + w);
            continue;
          }
          const key = makeUndirectedEdgeKey(sId, dId);
          undirectedWeightByKey.set(key, (undirectedWeightByKey.get(key) || 0) + w);
          continue;
        }

        // Fallback: if only one endpoint is present, infer neighbor relative to current.
        const neighbor = otherEndpoint(edge, currentId, getNodeId);
        const nId = getNodeId(neighbor);
        if (typeof nId === 'undefined' || nId === null) continue;

        if (nId === currentId) {
          selfLoopWeightById.set(currentId, (selfLoopWeightById.get(currentId) || 0) + w);
          continue;
        }

        const key = makeUndirectedEdgeKey(currentId, nId);
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

  return { adjacency, nodeIds, debug: debugEdgeCounts ? { edgeCounts: debugEdgeCounts, undirectedEdgeKeys: undirectedWeightByKey.size } : undefined };
}

function renumberPartition(partition) {
  const newByOld = new Map();
  let next = 0;
  const out = new Map();

  for (const [nodeId, c] of partition.entries()) {
    if (!newByOld.has(c)) newByOld.set(c, next++);
    out.set(nodeId, newByOld.get(c));
  }

  return out;
}

function partitionToCommunities(partition) {
  const commToNodes = new Map();
  for (const [nodeId, c] of partition.entries()) {
    if (!commToNodes.has(c)) commToNodes.set(c, []);
    commToNodes.get(c).push(nodeId);
  }
  return commToNodes;
}

function communitiesToObject(communities) {
  const obj = Object.create(null);
  for (const [c, nodes] of communities.entries()) {
    obj[String(c)] = nodes;
  }
  return obj;
}

function partitionToObject(partition) {
  const obj = Object.create(null);
  for (const [k, v] of partition.entries()) {
    obj[String(k)] = v;
  }
  return obj;
}

/**
 * Perform a single Louvain "local moving" phase on a given adjacency graph.
 *
 * @param {object} params
 * @param {Map<any, Map<any, number>>} params.adjacency Symmetric adjacency map.
 * @param {any[]} params.nodeIds Node ids to iterate over.
 * @param {number} params.resolution Modularity resolution parameter (gamma).
 * @param {number} params.maxPasses Max full passes over all nodes.
 * @param {number} params.minGain Minimum gain threshold to accept a move.
 *
 * @returns {{ partition: Map<any, any>, moved: boolean }}
 */
function oneLevel({
  adjacency,
  nodeIds,
  resolution,
  maxPasses,
  minGain,
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
    return { partition: renumberPartition(trivial), moved: false };
  }

  // Init: each node in its own community.
  const partition = new Map();
  const tot = new Map();
  for (const id of nodeIds) {
    partition.set(id, id);
    tot.set(id, degree.get(id) || 0);
  }

  let movedAny = false;

  for (let pass = 0; pass < maxPasses; pass++) {
    let movedThisPass = false;

    for (const nodeId of nodeIds) {
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
      } else {
        partition.set(nodeId, currentComm);
      }

      // Add node to its (possibly new) community.
      tot.set(bestComm, (tot.get(bestComm) || 0) + nodeDegree);
    }

    if (!movedThisPass) break;
  }

  return { partition: renumberPartition(partition), moved: movedAny };
}

/**
 * Induce a graph where each community becomes a node.
 *
 * The returned graph is a weighted adjacency map where weights are summed
 * between communities.
 */
function inducedGraph({ adjacency, partition }) {
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
}

/**
 * Louvain algorithm.
 *
 * @param {object} params
 * @param {any[]} params.nodes Input nodes (objects), must include `id` by default.
 * @param {string|string[]} [params.direction=['incoming','outgoing']] Traversal direction(s) used to build adjacency.
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
  direction = ['incoming', 'outgoing'],
  maxEdgesPerNode = Infinity,
  resolution = 1,
  maxPasses = 10,
  maxLevels = 10,
  minGain = 1e-12,
  getNodeId = defaultGetNodeId,
  getWeight = (edge) => getEdgeWeight(edge),
  debug = false,
}) {
  const built = buildUndirectedAdjacency({
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
    const { partition: part, moved } = oneLevel({
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

    const induced = inducedGraph({ adjacency: currentAdj, partition: part });

    // If coarsening doesn't reduce the graph, stop.
    if (induced.nodeIds.length >= currentNodeIds.length) {
      break;
    }

    currentAdj = induced.adjacency;
    currentNodeIds = induced.nodeIds;
  }

  // Renumber final communities densely.
  const finalPartition = renumberPartition(originalToCurrent);
  const communities = partitionToCommunities(finalPartition);

  const out = {
    partition: partitionToObject(finalPartition),
    communities: communitiesToObject(communities),
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
    getEdgeWeight,
    buildUndirectedAdjacency,
    louvain,
  };
}
