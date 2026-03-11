/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Compute Jaccard similarity coefficient between two collections
 *
 * @param {Array} a - First collection
 * @param {Array} b - Second collection
 * @returns {number|null}
 */
function jaccard(a, b) {
    // Return null for invalid inputs
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return null;
    }

    // Compute union and intersection sizes from unique values only
    const setA = new Set(a);
    const setB = new Set(b);
    let intersectionSize = 0;

    for (const value of setA) {
        if (setB.has(value)) {
            intersectionSize++;
        }
    }

    const unionSize = setA.size + setB.size - intersectionSize;

    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

falkor.register('sim.jaccard', jaccard);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jaccard
    };
}
