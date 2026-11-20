/**
 * Format a date/time value using a simple token-based pattern.
 * Supported tokens: YYYY, MM, DD, HH, mm, ss, SSS, [Z].
 *
 * NOTE: We intentionally name this function `dateFormat` (not just
 * `format`) to avoid collisions with other modules like `text/format.js`
 * once all sources are concatenated into a single FLEX bundle.
 *
 * @param {Date|number|string|null} datetime
 * @param {string|null} pattern
 * @param {string|null} tz offset like "+02:00" (optional)
 * @returns {string|null}
 */
const _flex_formatHelpers = typeof module !== 'undefined' && module.exports
    ? require('./_helpers')
    : null;
const _flex_formatNormalizeDate = _flex_formatHelpers
    ? _flex_formatHelpers._flex_normalizeDate
    : _flex_normalizeDate;
const _flex_formatParseTzOffsetMinutes = _flex_formatHelpers
    ? _flex_formatHelpers._flex_parseTzOffsetMinutes
    : _flex_parseTzOffsetMinutes;

function dateFormat(datetime, pattern, tz) {
    let d = _flex_formatNormalizeDate(datetime);
    if (!d) return null;

    // Default pattern approximating ISO8601 in UTC
    if (pattern == null) {
        pattern = 'YYYY-MM-DDTHH:mm:ss[Z]';
    }

    const offsetMinutes = _flex_formatParseTzOffsetMinutes(tz);
    if (offsetMinutes !== null) {
        // Show local wall time in the given offset for the same instant
        d = new Date(d.getTime() + offsetMinutes * 60000);
    }

    function pad(num, size) {
        let s = String(num);
        while (s.length < size) s = '0' + s;
        return s;
    }

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    const second = d.getUTCSeconds();
    const ms = d.getUTCMilliseconds();

    let out = pattern;
    out = out.replace('YYYY', pad(year, 4));
    out = out.replace('MM', pad(month, 2));
    out = out.replace('DD', pad(day, 2));
    out = out.replace('HH', pad(hour, 2));
    out = out.replace('mm', pad(minute, 2));
    out = out.replace('ss', pad(second, 2));
    out = out.replace('SSS', pad(ms, 3));
    out = out.replace('[Z]', 'Z');

    return out;
}

falkor.register('date.format', dateFormat);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Public API shape used by docs/tests
        format: dateFormat,
        // Extra exports useful for unit tests
        dateFormat,
        _flex_normalizeDate: _flex_formatNormalizeDate,
        _flex_parseTzOffsetMinutes: _flex_formatParseTzOffsetMinutes,
    };
}
