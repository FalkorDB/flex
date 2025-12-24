/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// multiply the given string with the given count
function repeat (item, count) {
	if (item === null) return null;
	return item.repeat(count);
}

falkor.register('text.repeat', repeat) ;
