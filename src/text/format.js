/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Format a string by replacing {0}, {1}, etc. with provided parameters
 *
 * @param {string|null} str
 * @param {Array} params
 * @returns {string|null}
 */
// sprintf format the string (Basic implementation)
function format(str, params) {
	if (str === null) return null;
	return str.replace(/\{(\d+)\}/g, (match, index) => {
		const i = Number(index);
		return i < params.length ? String(params[i]) : match;
	});
}

falkor.register('text.format', format);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        format
    };
}
