/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Perform bitwise AND operation
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function and(a, b) {
	return a & b;
}

/**
 * Perform bitwise OR operation
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function or(a, b) {
	return a | b;
}

/**
 * Perform bitwise XOR operation
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function xor(a, b) {
	return a ^ b;
}

/**
 * Perform bitwise NOT operation
 *
 * @param {number} a
 * @returns {number}
 */
function not(a) {
	return ~a;
}

/**
 * Perform bitwise left shift operation
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function shiftLeft(a, b) {
	return a << b;
}

/**
 * Perform bitwise right shift operation
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
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
