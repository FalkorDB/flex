/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Capitalize the first character of a string
 *
 * @param {string|null} str
 * @returns {string|null}
 */
function capitalize(str) {
    // Check for null/undefined explicitly to allow empty strings to pass through
    if (str == null) return null;
    if (str === "") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Decapitalize the first character of a string
 *
 * @param {string|null} str
 * @returns {string|null}
 */
function decapitalize(str) {
    if (str == null) return null;
    if (str === "") return "";
    return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Swap the case of each character in a string
 *
 * @param {string|null} str
 * @returns {string|null}
 */
function swapCase(str) {
    if (str == null) return null;
    return str.split('').map(c => 
        c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
    ).join('');
}

/**
 * Convert a string to camelCase
 *
 * @param {string|null} str
 * @returns {string|null}
 */
function camelCase(str) {
    if (str == null) return null;
    return str.toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        // Ensure the very first character is lowercase
        .replace(/^(.)/, (m) => m.toLowerCase());
}

/**
 * Convert a string to UpperCamelCase (PascalCase)
 *
 * @param {string|null} str
 * @returns {string|null}
 */
function upperCamelCase(str) {
    // Fixed the reference: called camelCase directly instead of text.camelCase
    const camel = camelCase(str);
    return camel ? camel.charAt(0).toUpperCase() + camel.slice(1) : null;
}

/**
 * Convert a string to snake_case
 *
 * @param {string|null} str
 * @returns {string|null}
 */
function snakeCase(str) {
    if (str == null) return null;
    const matches = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
    // Safety check: if no matches found, return empty string or original
    if (!matches) return str; 
    return matches
        .map(x => x.toLowerCase())
        .join('_');
}

// Registration
falkor.register('text.swapCase', swapCase);
falkor.register('text.camelCase', camelCase);
falkor.register('text.snakeCase', snakeCase);
falkor.register('text.capitalize', capitalize);
falkor.register('text.decapitalize', decapitalize);
falkor.register('text.upperCamelCase', upperCamelCase);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        swapCase,
        camelCase,
        snakeCase,
        capitalize,
        decapitalize,
        upperCamelCase
    };
}
