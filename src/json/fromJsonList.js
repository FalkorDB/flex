/**
 * Parse a JSON string into a list (array).
 * Non-array results or invalid JSON yield an empty list.
 *
 * @param {string|null} str
 * @returns {Array}
 */
function fromJsonList(str) {
    if (typeof str !== 'string') {
        return [];
    }

    try {
        const value = JSON.parse(str);
        return Array.isArray(value) ? value : [];
    } catch (e) {
        return [];
    }
}

falkor.register('json.fromJsonList', fromJsonList);
