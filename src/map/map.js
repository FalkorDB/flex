/**
 * Remove a single key from a map.
 *
 * @param {Object|null} map
 * @param {string|null} key
 * @returns {Object}
 */
function removeKey(map, key) {
    if (map == null || typeof map !== 'object') {
        return {};
    }

    // If key is null, return a shallow copy
    if (key == null) {
        return { ...map };
    }

    const result = {};

    for (const k in map) {
        if (Object.prototype.hasOwnProperty.call(map, k) && k !== key) {
            result[k] = map[k];
        }
    }

    return result;
}

/**
 * Convert a list of [key, value] pairs into a map
 *
 * @param {Array|null} pairs
 * @returns {Object}
 */
function fromPairs(pairs) {
    if (!Array.isArray(pairs)) return {};

    const result = {};

    for (const pair of pairs) {
        if (Array.isArray(pair) && pair.length === 2) {
            const [key, value] = pair;
            if (key != null) {
                result[key] = value;
            }
        }
    }

    return result;
}

falkor.register('map.removeKey', removeKey);
falkor.register('map.fromPairs', fromPairs);

