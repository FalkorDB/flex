/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// returns an array containing a nested array for each match
function regexGroups(str, regex) {
	if (str === null) return null;
	const re = new RegExp(regex, 'g');
	return [...str.matchAll(re)].map(match => [...match]);
}

falkor.register('text.regexGroups', regexGroups) ;
