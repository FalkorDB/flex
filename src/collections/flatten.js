/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * One-level flatten of a nested list.
 *
 * - If `nested` is not an array, returns an empty list.
 * - For each element:
 *   - If it is an array, its elements are concatenated.
 *   - Otherwise, the element is included as-is.
 *
 * @param {Array|null} nested
 * @returns {Array}
 */
function flatten(nested) {
    if (!Array.isArray(nested)) return [];

    const result = [];
    for (const item of nested) {
        if (Array.isArray(item)) {
            result.push(...item);
        } else {
            result.push(item);
        }
    }
    return result;
}

falkor.register('coll.flatten', flatten);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        flatten
    };
}
