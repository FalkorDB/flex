/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Compute Strongly Connected Components of a directed graph
 * using Tarjan's algorithm.
 *
 * @param {Array} edges - List of directed edges, each [source, target]
 * @returns {Array} List of components, each a list of node identifiers
 */
function scc(edges) {
    if (!Array.isArray(edges)) return [];

    // Build adjacency list and collect all nodes
    const adj = new Map();

    for (const edge of edges) {
        if (!Array.isArray(edge) || edge.length < 2) continue;
        const u = edge[0];
        const v = edge[1];
        if (!adj.has(u)) adj.set(u, []);
        if (!adj.has(v)) adj.set(v, []);
        adj.get(u).push(v);
    }

    // Tarjan's SCC state
    let index = 0;
    const stack = [];
    const onStack = new Set();
    const indices = new Map();
    const lowlinks = new Map();
    const result = [];

    function strongconnect(v) {
        indices.set(v, index);
        lowlinks.set(v, index);
        index++;
        stack.push(v);
        onStack.add(v);

        const successors = adj.get(v) || [];
        for (const w of successors) {
            if (!indices.has(w)) {
                strongconnect(w);
                lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
            } else if (onStack.has(w)) {
                lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
            }
        }

        if (lowlinks.get(v) === indices.get(v)) {
            const component = [];
            let w;
            do {
                w = stack.pop();
                onStack.delete(w);
                component.push(w);
            } while (w !== v);
            result.push(component);
        }
    }

    const nodes = adj.keys();
    for (const v of nodes) {
        if (!indices.has(v)) {
            strongconnect(v);
        }
    }

    return result;
}

falkor.register('exp.scc', scc);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scc
    };
}
