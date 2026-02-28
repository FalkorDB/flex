/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Generic DFS traversal with edge filtering.
 *
 * This implementation is designed to run in the FalkorDB/RedisGraph UDF
 * environment, and relies on the global `graph.traverse` function.
 *
 * `graph.traverse` is expected to return an array aligned to the `nodes` input:
 *   graph.traverse(nodes, { direction, returnType: 'edges' }) => Array<Array<Edge>>
 *
 * Notes vs BFS:
 * - DFS explores as deep as possible first (stack-based).
 * - `maxDepth` is interpreted as a hop limit from `startNode`.
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
function genericFilterDFS({
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
    throw new TypeError('genericFilterDFS: global `graph.traverse` is not available');
  }
  if (typeof allowEdge !== 'function') {
    throw new TypeError('genericFilterDFS: `allowEdge` must be a function');
  }

  const startId = getNodeId(startNode);
  const visited = new Set([startId]);
  const parent = new Map();

  // Stack entries carry the current hop depth from the start node.
  const stack = [{ node: startNode, depth: 0 }];

  while (stack.length > 0) {
    if (visited.size > maxVisited) break;

    const { node: current, depth } = stack.pop();
    if (!current) continue;

    if (depth >= maxDepth) {
      continue;
    }

    const reachables =
      graph.traverse([current], {
        direction,
        returnType: 'edges',
      }) || [];

    const edges = reachables[0] || [];
    const currentId = getNodeId(current);

    // Iterate in reverse so that the first edge in `edges` is processed first
    // (LIFO stack behavior).
    for (let i = edges.length - 1; i >= 0; i--) {
      const edge = edges[i];
      const neighbor = getNeighbor(edge, current);
      const nId = getNodeId(neighbor);

      if (neighbor == null || typeof nId === 'undefined') continue;
      if (visited.has(nId)) continue;

      if (allowEdge(edge, neighbor, current)) {
        visited.add(nId);
        parent.set(nId, { parentId: currentId, edge });
        stack.push({ node: neighbor, depth: depth + 1 });

        if (visited.size > maxVisited) {
          break;
        }
      }
    }
  }

  return { parent, visited };
}

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    genericFilterDFS,
  };
}
