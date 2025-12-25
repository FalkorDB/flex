/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Find the index of the first occurrence of a substring
 *
 * @param {string|null} str
 * @param {string} lookup
 * @param {number} offset
 * @param {number} to
 * @returns {number|null}
 */
function indexOf(str, lookup, offset = 0, to = -1) {
	if (str === null) return null;
	const end = to === -1 ? str.length : to;
	const index = str.substring(0, end).indexOf(lookup, offset);
	return index;
}

/**
 * Find all indexes of occurrences of a substring
 *
 * @param {string|null} str
 * @param {string} lookup
 * @param {number} from
 * @param {number} to
 * @returns {Array|null}
 */
// finds all occurrences of the lookup string
function indexesOf(str, lookup, from = 0, to = -1) {
	if (str === null) return null;
	const end = to === -1 ? str.length : to;
	const results = [];
	let pos = str.indexOf(lookup, from);
	while (pos !== -1 && pos < end) {
		results.push(pos);
		pos = str.indexOf(lookup, pos + 1);
	}
	return results;
}

falkor.register('text.indexOf', indexOf);
falkor.register('text.indexesOf', indexesOf);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        indexOf,
        indexesOf
    };
}
