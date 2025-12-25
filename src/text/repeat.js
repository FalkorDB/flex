/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// multiply the given string with the given count
function repeat (item, count) {
	if (item === null) return null;
	return item.repeat(count);
}

falkor.register('text.repeat', repeat);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        repeat
    };
}
