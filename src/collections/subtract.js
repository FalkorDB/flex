/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Return a new list with elements of `toRemove` removed from `list`.
 *
 * - If either argument is not an array, returns an empty list.
 * - Uses strict equality (===) for comparison.
 * - Preserves the original order of `list`.
 *
 * @param {Array|null} list
 * @param {Array|null} toRemove
 * @returns {Array}
 */
function subtract(list, toRemove) {
    if (!Array.isArray(list)) return [];

    if (!Array.isArray(toRemove) || toRemove.length === 0) return [...list];

    const removeSet = new Set(toRemove);
    return list.filter(item => !removeSet.has(item));
}

falkor.register('coll.subtract', subtract);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        subtract
    };
}
