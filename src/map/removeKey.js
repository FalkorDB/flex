/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

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

falkor.register('map.removeKey', removeKey);
