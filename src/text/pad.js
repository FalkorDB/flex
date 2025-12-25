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
