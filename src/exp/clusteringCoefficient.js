/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Compute the local clustering coefficient for a node.
 *
 * The clustering coefficient is the ratio of actual triangles
 * to the maximum possible triangles for a node with the given degree.
 * It ranges from 0 (no triangles) to 1 (fully connected neighborhood).
 *
 * @param {number} triangles - Number of triangles the node participates in
 * @param {number} degree - Degree of the node (number of neighbors)
 * @returns {number|null} Clustering coefficient between 0 and 1, or null for invalid inputs
 */
function clusteringCoefficient(triangles, degree) {
    if (triangles == null || degree == null) return null;
    if (typeof triangles !== 'number' || typeof degree !== 'number') return null;
    if (degree < 2) return 0;

    const maxTriangles = (degree * (degree - 1)) / 2;
    return triangles / maxTriangles;
}

falkor.register('exp.clusteringCoefficient', clusteringCoefficient);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        clusteringCoefficient
    };
}
