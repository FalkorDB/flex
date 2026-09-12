/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Find articulation points (cut vertices) in an undirected graph.
 *
 * An articulation point is a vertex whose removal (along with its edges)
 * disconnects the graph or increases its number of connected components.
 *
 * Uses Tarjan's DFS-based algorithm in O(V + E) time.
 *
 * @param {Object} adj - Adjacency map: { nodeId: [neighborId, ...], ... }
 * @returns {Array|null} List of node IDs that are articulation points, or null for invalid input
 */
function articulationPoints(adj) {
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
    var ap = {};
    var timer = [0]; // use array for mutable reference

    function _flex_ap_dfs(u) {
        var children = 0;
        disc[u] = low[u] = timer[0]++;
        var neighbors = adj[u] || [];

        for (var j = 0; j < neighbors.length; j++) {
            var v = String(neighbors[j]);
            if (disc[v] === undefined) {
                children++;
                parent[v] = u;
                _flex_ap_dfs(v);

                if (low[v] < low[u]) {
                    low[u] = low[v];
                }

                // u is an articulation point if:
                // 1) u is root of DFS tree and has two or more children
                if (parent[u] === undefined && children > 1) {
                    ap[u] = true;
                }
                // 2) u is not root and low value of one of its children
                //    is >= discovery value of u
                if (parent[u] !== undefined && low[v] >= disc[u]) {
                    ap[u] = true;
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
            _flex_ap_dfs(nodes[k]);
        }
    }

    return Object.keys(ap);
}

falkor.register('exp.articulationPoints', articulationPoints);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        articulationPoints
    };
}
