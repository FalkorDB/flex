/**
 * Shallow-merge multiple maps into a new map.
 * Later maps override earlier ones. Non-object inputs are ignored.
 *
 * @param {...Object} maps
 * @returns {Object}
 */
function merge() {
    const result = {};

    for (let i = 0; i < arguments.length; i++) {
        const m = arguments[i];
        if (m && typeof m === 'object' && !Array.isArray(m)) {
            for (const key in m) {
                if (Object.prototype.hasOwnProperty.call(m, key)) {
                    result[key] = m[key];
                }
            }
        }
    }

    return result;
}

falkor.register('map.merge', merge);
