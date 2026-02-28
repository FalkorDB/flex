/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Generic BFS traversal with edge filtering.
 *
 * This implementation is designed to run in the FalkorDB/RedisGraph UDF
 * environment, and relies on the global `graph.traverse` function.
 *
 * `graph.traverse` is expected to return an array aligned to the `nodes` input:
 *   graph.traverse(nodes, { direction, returnType: 'edges' }) => Array<Array<Edge>>
 *
 * @param {object} params
 * @param {object} params.startNode
 * @param {(edge: any, neighbor: any, current: any) => boolean} params.allowEdge
 * @param {string} params.direction
 * @param {number} [params.maxDepth=Infinity]
 * @param {number} [params.maxVisited=Infinity]
 * @param {(node: any) => any} [params.getNodeId]
 * @param {(edge: any, current: any) => any} [params.getNeighbor]
 *
 * @returns {{ parent: Map<any, { parentId: any, edge: any }>, visited: Set<any> }}
 */
function genericFilterBFS({
  startNode,
  allowEdge,
  direction,
  maxDepth = Infinity,
  maxVisited = Infinity,
  getNodeId = (node) => node && node.id,
  getNeighbor = (edge /*, current */) => edge && edge.source,
}) {
  if (!startNode) {
    return { parent: new Map(), visited: new Set() };
  }
  if (typeof graph === 'undefined' || !graph || typeof graph.traverse !== 'function') {
    throw new TypeError('genericFilterBFS: global `graph.traverse` is not available');
  }
  if (typeof allowEdge !== 'function') {
    throw new TypeError('genericFilterBFS: `allowEdge` must be a function');
  }

  const startId = getNodeId(startNode);
  const visited = new Set([startId]);
  const parent = new Map();

  let currentLevel = [startNode];
  let nextLevel = [];
  let depth = 0;

  while (currentLevel.length > 0) {
    if (depth >= maxDepth) break;
    if (visited.size > maxVisited) break;

    const reachables =
      graph.traverse(currentLevel, {
        direction,
        returnType: 'edges',
      }) || [];

    for (let i = 0; i < reachables.length; i++) {
      const edges = reachables[i] || [];
      const current = currentLevel[i];
      const currentId = getNodeId(current);

      for (const edge of edges) {
        const neighbor = getNeighbor(edge, current);
        const nId = getNodeId(neighbor);

        if (neighbor == null || typeof nId === 'undefined') continue;
        if (visited.has(nId)) continue;

        if (allowEdge(edge, neighbor, current)) {
          visited.add(nId);
          parent.set(nId, { parentId: currentId, edge });
          nextLevel.push(neighbor);
        }
      }
    }

    currentLevel = nextLevel;
    nextLevel = [];
    depth++;
  }

  return { parent, visited };
}

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    genericFilterBFS,
  };
}
