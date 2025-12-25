/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Pad a string on the left to reach the specified length
 *
 * @param {string|null} str
 * @param {number} count
 * @param {string} delim
 * @returns {string|null}
 */
// left pad
function lpad(str, count, delim = ' ') {
	if (str === null) return null;
	return str.toString().padStart(count, delim);
}

/**
 * Pad a string on the right to reach the specified length
 *
 * @param {string|null} str
 * @param {number} count
 * @param {string} delim
 * @returns {string|null}
 */
// right pad
function rpad(str, count, delim = ' ') {
	if (str === null) return null;
	return str.toString().padEnd(count, delim);
}

falkor.register('text.lpad', lpad);
falkor.register('text.rpad', rpad);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        lpad,
        rpad
    };
}
