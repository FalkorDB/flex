/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Return the union of two arrays.
 *
 * Semantics:
 * - If both arguments are non-arrays, returns an empty array.
 * - If exactly one argument is an array, returns a de-duplicated copy of that array.
 * - If both are arrays, returns a new array containing all unique elements
 *   from `a` followed by any additional unique elements from `b`, in order
 *   of first occurrence.
 *
 * This implementation is designed to be more allocation- and GC-friendly
 * than the naive `[...new Set([...a, ...b])]` pattern, which creates an
 * intermediate concatenated array before building the Set and result.
 *
 * @param {Array|null} a
 * @param {Array|null} b
 * @returns {Array}
 */
function union(a, b) {
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);

  if (!aIsArray && !bIsArray) return [];
  if (!aIsArray && bIsArray) return [...new Set(b)];
  if (aIsArray && !bIsArray) return [...new Set(a)];

  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0 && lenB === 0) return [];
  if (lenA === 0) return [...new Set(b)];
  if (lenB === 0) return [...new Set(a)];

  // Seed the Set with `a` and copy `a` to result.
  // This preserves the relative order of elements in `a`.
  const set = new Set(a);
  const result = a.slice();

  // Append only elements from `b` that are not already in the Set.
  for (let i = 0; i < lenB; i++) {
    const v = b[i];
    if (!set.has(v)) {
      set.add(v);
      result.push(v);
    }
  }

  return result;
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
