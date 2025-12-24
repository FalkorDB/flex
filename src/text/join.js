/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// join the given strings with the given delimiter
function join (arr, delimiter) {
	if (!arr) return null;
	return arr.join(delimiter);
}

falkor.register('text.join', join) ;
