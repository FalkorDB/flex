/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Shuffle a list using Fisher-Yates algorithm
 *
 * @param {Array|null} list
 * @returns {Array}
 */
function shuffle(list) {
    if (!Array.isArray(list)) return [];

    const result = [...list]; // clone to avoid mutation
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

falkor.register('coll.shuffle', shuffle);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        shuffle
    };
}
