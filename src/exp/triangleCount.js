/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Count the number of triangles a node participates in.
 *
 * A triangle is formed when two neighbors of the node are also
 * directly connected to each other.
 *
 * @param {Array} neighbors - List of the node's neighbor IDs
 * @param {Object} adjacencyMap - Map from node ID (string key) to list of neighbor IDs
 * @returns {number|null} Number of triangles, or null for invalid inputs
 */
function triangleCount(neighbors, adjacencyMap) {
    if (!Array.isArray(neighbors) || adjacencyMap == null || typeof adjacencyMap !== 'object' || Array.isArray(adjacencyMap)) {
        return null;
    }

    const degree = neighbors.length;
    if (degree < 2) return 0;

    let count = 0;

    for (let i = 0; i < degree; i++) {
        const niKey = String(neighbors[i]);
        const niNeighbors = adjacencyMap[niKey];
        if (!Array.isArray(niNeighbors)) continue;

        const niSet = new Set(niNeighbors.map(String));

        for (let j = i + 1; j < degree; j++) {
            if (niSet.has(String(neighbors[j]))) {
                count++;
            }
        }
    }

    return count;
}

falkor.register('exp.triangleCount', triangleCount);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        triangleCount
    };
}
