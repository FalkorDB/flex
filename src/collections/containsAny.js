/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Return true if `list` contains any element in `candidates`.
 *
 * - If either argument is not an array, returns false.
 * - Uses strict equality (===) for comparison.
 * - Ignores null/undefined in candidates.
 *
 * @param {Array|null} list
 * @param {Array|null} candidates
 * @returns {boolean}
 */
function containsAny(list, candidates) {
    if (!Array.isArray(list) || !Array.isArray(candidates)) return false;

    if (candidates.length === 0) return false;

    const set = new Set(list);
    for (const c of candidates) {
        if (c == null) continue; // skip null/undefined
        if (set.has(c)) return true;
    }
    return false;
}

falkor.register('coll.containsAny', containsAny);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        containsAny
    };
}
