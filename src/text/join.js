/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Join array elements with a delimiter
 *
 * @param {Array|null} arr
 * @param {string} delimiter
 * @returns {string|null}
 */
// join the given strings with the given delimiter
function join (arr, delimiter) {
	if (!arr) return null;
	return arr.join(delimiter);
}

falkor.register('text.join', join);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        join
    };
}
