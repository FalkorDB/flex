/**
 * Return a new map with the specified keys removed.
 *
 * @param {Object|null} map
 * @param {Array<string>|null} keys
 * @returns {Object}
 */
function removeKeys(map, keys) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return {};
    }

    const toRemove = new Set(
        Array.isArray(keys) ? keys.filter((key) => key != null) : []
    );

    const result = {};
    for (const key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key) && !toRemove.has(key)) {
            result[key] = map[key];
        }
    }

    return result;
}

falkor.register('map.removeKeys', removeKeys);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        removeKeys
    };
}
