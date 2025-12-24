/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function indexOf(str, lookup, offset = 0, to = -1) {
	if (str === null) return null;
	const end = to === -1 ? str.length : to;
	const index = str.substring(0, end).indexOf(lookup, offset);
	return index;
}

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

falkor.register('text.indexOf', indexOf) ;
falkor.register('text.indexesOf', indexesOf) ;
