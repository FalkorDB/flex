/**
 * Parse a JSON string into a map (plain object).
 * Non-object results or invalid JSON yield an empty map.
 *
 * @param {string|null} str
 * @returns {Object}
 */
function fromJsonMap(str) {
    if (typeof str !== 'string') {
        return {};
    }

    try {
        const value = JSON.parse(str);
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }
        return {};
    } catch (e) {
        return {};
    }
}

falkor.register('json.fromJsonMap', fromJsonMap);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fromJsonMap
    };
}
