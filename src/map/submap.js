/**
 * Create a new map containing only a subset of keys from the input map.
 *
 * @param {Object|null} map
 * @param {Array<string>|null} keys
 * @returns {Object}
 */
function submap(map, keys) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return {};
    }
    if (!Array.isArray(keys)) {
        return {};
    }

    const result = {};

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key != null && Object.prototype.hasOwnProperty.call(map, key)) {
            result[key] = map[key];
        }
    }

    return result;
}

falkor.register('map.submap', submap);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        submap
    };
}
