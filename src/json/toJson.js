/**
 * Serialize a value to JSON.
 *
 * @param {any} value
 * @returns {string|null}
 */
function toJson(value) {
    try {
        const json = JSON.stringify(value);
        // JSON.stringify(undefined) returns undefined - normalize to null
        return json === undefined ? null : json;
    } catch (e) {
        return null;
    }
}

falkor.register('json.toJson', toJson);
