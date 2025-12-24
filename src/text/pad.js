/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// left pad
function lpad(str, count, delim = ' ') {
	if (str === null) return null;
	return str.toString().padStart(count, delim);
}

// right pad
function rpad(str, count, delim = ' ') {
	if (str === null) return null;
	return str.toString().padEnd(count, delim);
}

falkor.register('text.lpad', lpad) ;
falkor.register('text.rpad', rpad) ;
