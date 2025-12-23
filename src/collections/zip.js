/**
 * Zip two lists into a list of pairs
 *
 * @param {Array|null} list1
 * @param {Array|null} list2
 * @returns {Array}
 */
function zip(list1, list2) {
    if (!Array.isArray(list1) || !Array.isArray(list2)) return [];

    const length = Math.min(list1.length, list2.length);
    const result = [];

    for (let i = 0; i < length; i++) {
        result.push([list1[i], list2[i]]);
    }

    return result;
}

falkor.register('coll.zip', zip);
