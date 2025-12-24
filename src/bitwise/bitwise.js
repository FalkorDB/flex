/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function and(a, b) {
	return a & b;
}

function or(a, b) {
	return a | b;
}

function xor(a, b) {
	return a ^ b;
}

function not(a) {
	return ~a;
}

function shiftLeft(a, b) {
	return a << b;
}

function shiftRight(a, b) {
	return a >> b;
}

falkor.register('bitwise.or', or);
falkor.register('bitwise.and', and);
falkor.register('bitwise.xor', xor);
falkor.register('bitwise.not', not);
falkor.register('bitwise.shiftLeft', shiftLeft);
falkor.register('bitwise.shiftRight', shiftRight);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        and,
        or,
        xor,
        not,
        shiftLeft,
        shiftRight
    };
}
