/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Return the union of two arrays
 *
 * @param {Array} a
 * @param {Array} b
 * @returns {Array}
 */
function union (a, b) {
  return [...new Set([...a, ...b])];
}

falkor.register('coll.union', union);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        union
    };
}
