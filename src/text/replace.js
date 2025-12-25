/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// replace each substring matching regex
function replace(str, regex, replacement) {
	if (str === null) return null;
	const re = new RegExp(regex, 'g');
	return str.replace(re, replacement);
}

falkor.register('text.replace', replace);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        replace
    };
}
