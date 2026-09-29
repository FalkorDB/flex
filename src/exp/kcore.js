/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Build an undirected adjacency set from an array of [source, target] edges.
 * Self-loops are ignored.
 *
 * @param {Array} edges - Array of [source, target] pairs
 * @returns {Map<*, Set>} adjacency map
 */
function _flex_buildAdjacency(edges) {
    const adj = new Map();

    for (var i = 0; i < edges.length; i++) {
        var e = edges[i];
        if (!Array.isArray(e) || e.length < 2) continue;
        var u = e[0];
        var v = e[1];
        if (u === v) continue; // skip self-loops

        if (!adj.has(u)) adj.set(u, new Set());
        if (!adj.has(v)) adj.set(v, new Set());
        adj.get(u).add(v);
        adj.get(v).add(u);
    }

    return adj;
}

/**
 * Compute the core number of every node in an undirected graph using the
 * Batagelj–Zahar bucket-sort algorithm.
 *
 * The graph is given as an array of [source, target] edge pairs and is
 * treated as **undirected** (each edge is counted in both directions).
 * Self-loops are ignored.
 *
 * Returns an array of [node, coreNumber] pairs sorted by node.
 *
 * @param {Array} edges - Array of [source, target] pairs
 * @returns {Array|null} Array of [node, coreNumber] pairs, or null for invalid input
 */
function coreNumber(edges) {
    if (!Array.isArray(edges)) return null;
    if (edges.length === 0) return [];

    var adj = _flex_buildAdjacency(edges);
    if (adj.size === 0) return [];

    // Compute initial degrees
    var deg = new Map();
    var maxDeg = 0;
    adj.forEach(function (neighbors, node) {
        var d = neighbors.size;
        deg.set(node, d);
        if (d > maxDeg) maxDeg = d;
    });

    // Bucket sort: bin[d] holds nodes with current degree d
    var bin = new Array(maxDeg + 1);
    for (var i = 0; i <= maxDeg; i++) bin[i] = [];
    deg.forEach(function (d, node) {
        bin[d].push(node);
    });

    var core = new Map();
    var removed = new Set();

    for (var d = 0; d <= maxDeg; d++) {
        while (bin[d].length > 0) {
            var v = bin[d].pop();
            if (removed.has(v)) continue;

            core.set(v, d);
            removed.add(v);

            adj.get(v).forEach(function (u) {
                if (!removed.has(u)) {
                    var du = deg.get(u);
                    // Decrease effective degree and move to appropriate bin
                    var newDeg = du - 1;
                    deg.set(u, newDeg);
                    // newDeg will be >= d (property of core decomposition)
                    bin[newDeg].push(u);
                }
            });
        }
    }

    // Return sorted array of [node, coreNumber] pairs
    var result = [];
    core.forEach(function (c, node) {
        result.push([node, c]);
    });
    result.sort(function (a, b) {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
    });

    return result;
}

/**
 * Extract the k-core of an undirected graph — the maximal subgraph in which
 * every node has degree at least k.
 *
 * The graph is given as an array of [source, target] edge pairs and is
 * treated as **undirected**. Self-loops are ignored.
 *
 * Returns an array of nodes whose core number is >= k, sorted.
 *
 * @param {Array} edges - Array of [source, target] pairs
 * @param {number} k    - Minimum core number threshold
 * @returns {Array|null} Array of nodes in the k-core, or null for invalid input
 */
function kcore(edges, k) {
    if (!Array.isArray(edges) || typeof k !== 'number' || k < 0) return null;

    var pairs = coreNumber(edges);
    if (pairs === null) return null;

    var nodes = [];
    for (var i = 0; i < pairs.length; i++) {
        if (pairs[i][1] >= k) {
            nodes.push(pairs[i][0]);
        }
    }

    return nodes;
}

falkor.register('exp.coreNumber', coreNumber);
falkor.register('exp.kcore', kcore);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        coreNumber,
        kcore
    };
}
