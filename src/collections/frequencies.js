/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Count the frequency of each element in a list
 *
 * @param {Array|null} list
 * @returns {Object}
 */
function frequencies(list) {
    if (!Array.isArray(list)) return {};

    const result = {};

    for (const item of list) {
        // Use item as key; handle null/undefined
        const key = item === null || item === undefined ? 'null' : item;
        result[key] = (result[key] || 0) + 1;
    }

    return result;
}

falkor.register("coll.frequencies", frequencies);
