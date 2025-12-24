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

    const toRemove = {};
    if (Array.isArray(keys)) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key != null) {
                toRemove[key] = true;
            }
        }
    }

    const result = {};
    for (const key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key) && !toRemove[key]) {
            result[key] = map[key];
        }
    }

    return result;
}

falkor.register('map.removeKeys', removeKeys);
