/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Return the intersection of two arrays
 *
 * @param {Array} a
 * @param {Array} b
 * @returns {Array}
 */
function intersection (a, b) {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}

falkor.register('coll.intersection', intersection);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        intersection
    };
}
