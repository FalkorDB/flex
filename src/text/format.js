/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// sprintf format the string (Basic implementation)
function format(str, params) {
	if (str === null) return null;
	let result = str;
	params.forEach((param, i) => {
		result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), param);
	});
	return result;
}

falkor.register('text.format', format);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        format
    };
}
