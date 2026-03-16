/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Find bridges (cut edges) in an undirected graph.
 *
 * A bridge is an edge whose removal disconnects the graph or increases
 * its number of connected components.
 *
 * Uses Tarjan's DFS-based algorithm in O(V + E) time.
 *
 * @param {Object} adj - Adjacency map: { nodeId: [neighborId, ...], ... }
 * @returns {Array|null} List of [nodeA, nodeB] pairs representing bridges, or null for invalid input
 */
function bridges(adj) {
    if (adj == null || typeof adj !== 'object' || Array.isArray(adj)) {
        return null;
    }

    var nodes = Object.keys(adj);
    if (nodes.length === 0) return [];

    // Validate that all values are arrays
    for (var i = 0; i < nodes.length; i++) {
        if (!Array.isArray(adj[nodes[i]])) return null;
    }

    var disc = {};
    var low = {};
    var parent = {};
    var result = [];
    var timer = [0]; // use array for mutable reference

    function _flex_br_dfs(u) {
        disc[u] = low[u] = timer[0]++;
        var neighbors = adj[u] || [];

        for (var j = 0; j < neighbors.length; j++) {
            var v = String(neighbors[j]);
            if (disc[v] === undefined) {
                parent[v] = u;
                _flex_br_dfs(v);

                if (low[v] < low[u]) {
                    low[u] = low[v];
                }

                // If the lowest reachable vertex from subtree rooted at v
                // is below v in DFS tree, then u-v is a bridge
                if (low[v] > disc[u]) {
                    result.push([u, v]);
                }
            } else if (v !== parent[u]) {
                if (disc[v] < low[u]) {
                    low[u] = disc[v];
                }
            }
        }
    }

    // Run DFS from each unvisited node (handles disconnected graphs)
    for (var k = 0; k < nodes.length; k++) {
        if (disc[nodes[k]] === undefined) {
            _flex_br_dfs(nodes[k]);
        }
    }

    return result;
}

falkor.register('exp.bridges', bridges);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        bridges
    };
}
