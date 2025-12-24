/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

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

falkor.register('map.fromPairs', fromPairs);
