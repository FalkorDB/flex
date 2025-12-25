/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Return true if `list` contains all elements in `candidates`.
 *
 * - If either argument is not an array, returns false.
 * - Uses strict equality (===) for comparison.
 * - Ignores null/undefined in candidates.
 *
 * @param {Array|null} list
 * @param {Array|null} candidates
 * @returns {boolean}
 */
function containsAll(list, candidates) {
    if (!Array.isArray(list) || !Array.isArray(candidates)) return false;

    if (candidates.length === 0) return true;

    const set = new Set(list);
    for (const c of candidates) {
        if (c == null) continue; // skip null/undefined
        if (!set.has(c)) return false;
    }
    return true;
}

falkor.register('coll.containsAll', containsAll);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        containsAll
    };
}
