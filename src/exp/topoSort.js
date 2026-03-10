/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Perform a topological sort on a directed graph given as a list of edges.
 * Returns an ordered list of nodes such that for every directed edge [u, v],
 * u comes before v. Returns null if the graph contains a cycle.
 *
 * @param {Array} edges - List of [from, to] pairs
 * @returns {Array|null} Topologically sorted node list, or null if a cycle exists
 */
function topoSort(edges) {
    if (!Array.isArray(edges)) {
        return null;
    }

    // Build adjacency list and compute in-degrees (Kahn's algorithm)
    var adj = {};
    var inDeg = {};

    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        if (!Array.isArray(edge) || edge.length < 2) {
            return null;
        }
        var u = edge[0];
        var v = edge[1];

        if (!(u in adj)) {
            adj[u] = [];
            inDeg[u] = 0;
        }
        if (!(v in adj)) {
            adj[v] = [];
            inDeg[v] = 0;
        }
        adj[u].push(v);
        inDeg[v] = inDeg[v] + 1;
    }

    // Collect nodes with in-degree 0
    var nodes = Object.keys(adj);
    var queue = [];
    for (var i = 0; i < nodes.length; i++) {
        if (inDeg[nodes[i]] === 0) {
            queue.push(nodes[i]);
        }
    }

    var sorted = [];
    while (queue.length > 0) {
        var node = queue.shift();
        sorted.push(node);
        var neighbors = adj[node];
        for (var j = 0; j < neighbors.length; j++) {
            var nb = neighbors[j];
            inDeg[nb] = inDeg[nb] - 1;
            if (inDeg[nb] === 0) {
                queue.push(nb);
            }
        }
    }

    // If not all nodes were visited, a cycle exists
    if (sorted.length !== nodes.length) {
        return null;
    }

    return sorted;
}

/**
 * Detect whether a directed graph (given as a list of edges) contains a cycle.
 *
 * @param {Array} edges - List of [from, to] pairs
 * @returns {boolean} true if a cycle exists, false otherwise
 */
function hasCycle(edges) {
    return topoSort(edges) === null && Array.isArray(edges);
}

falkor.register('exp.topoSort', topoSort);
falkor.register('exp.hasCycle', hasCycle);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        topoSort,
        hasCycle
    };
}
