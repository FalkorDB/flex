/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Count the common neighbors between two neighbor lists.
 *
 * @param {Array} neighborsA - Neighbor list of node A
 * @param {Array} neighborsB - Neighbor list of node B
 * @returns {number|null} Size of the intersection, or null for invalid inputs
 */
function commonNeighbors(neighborsA, neighborsB) {
    if (!Array.isArray(neighborsA) || !Array.isArray(neighborsB)) {
        return null;
    }

    var setB = new Set(neighborsB);
    var count = 0;
    var seen = new Set();
    for (var i = 0; i < neighborsA.length; i++) {
        var v = neighborsA[i];
        if (setB.has(v) && !seen.has(v)) {
            count++;
            seen.add(v);
        }
    }
    return count;
}

/**
 * Compute the Adamic-Adar index for two neighbor lists.
 * For each common neighbor z the index adds 1 / log(degree(z)).
 *
 * @param {Array} neighborsA - Neighbor list of node A
 * @param {Array} neighborsB - Neighbor list of node B
 * @param {Object} degrees   - Map from neighbor id to its degree
 * @returns {number|null} Adamic-Adar score, or null for invalid inputs
 */
function adamicAdar(neighborsA, neighborsB, degrees) {
    if (!Array.isArray(neighborsA) || !Array.isArray(neighborsB) || typeof degrees !== 'object' || degrees === null) {
        return null;
    }

    var setB = new Set(neighborsB);
    var score = 0;
    var seen = new Set();
    for (var i = 0; i < neighborsA.length; i++) {
        var z = neighborsA[i];
        if (setB.has(z) && !seen.has(z)) {
            seen.add(z);
            var deg = degrees[z];
            if (typeof deg === 'number' && deg > 1) {
                score += 1 / Math.log(deg);
            }
            // degree <= 1 contributes nothing (log(1) = 0, would be Infinity)
        }
    }
    return score;
}

/**
 * Compute the Resource Allocation index for two neighbor lists.
 * For each common neighbor z the index adds 1 / degree(z).
 *
 * @param {Array} neighborsA - Neighbor list of node A
 * @param {Array} neighborsB - Neighbor list of node B
 * @param {Object} degrees   - Map from neighbor id to its degree
 * @returns {number|null} Resource Allocation score, or null for invalid inputs
 */
function resourceAllocation(neighborsA, neighborsB, degrees) {
    if (!Array.isArray(neighborsA) || !Array.isArray(neighborsB) || typeof degrees !== 'object' || degrees === null) {
        return null;
    }

    var setB = new Set(neighborsB);
    var score = 0;
    var seen = new Set();
    for (var i = 0; i < neighborsA.length; i++) {
        var z = neighborsA[i];
        if (setB.has(z) && !seen.has(z)) {
            seen.add(z);
            var deg = degrees[z];
            if (typeof deg === 'number' && deg > 0) {
                score += 1 / deg;
            }
        }
    }
    return score;
}

/**
 * Compute the Preferential Attachment score for two neighbor lists.
 * The score is simply |neighborsA| * |neighborsB|.
 *
 * @param {Array} neighborsA - Neighbor list of node A
 * @param {Array} neighborsB - Neighbor list of node B
 * @returns {number|null} Product of the two list lengths, or null for invalid inputs
 */
function preferentialAttachment(neighborsA, neighborsB) {
    if (!Array.isArray(neighborsA) || !Array.isArray(neighborsB)) {
        return null;
    }

    return neighborsA.length * neighborsB.length;
}

falkor.register('exp.commonNeighbors', commonNeighbors);
falkor.register('exp.adamicAdar', adamicAdar);
falkor.register('exp.resourceAllocation', resourceAllocation);
falkor.register('exp.preferentialAttachment', preferentialAttachment);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        commonNeighbors,
        adamicAdar,
        resourceAllocation,
        preferentialAttachment
    };
}
