/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Extract regex groups from all matches in a string
 *
 * @param {string|null} str
 * @param {string} regex
 * @returns {Array|null}
 */
// returns an array containing a nested array for each match
function regexGroups(str, regex) {
	if (str === null) return null;
	const re = new RegExp(regex, 'g');
	return [...str.matchAll(re)].map(match => [...match]);
}

falkor.register('text.regexGroups', regexGroups);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        regexGroups
    };
}
