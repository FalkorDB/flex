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
function dateFormat(datetime, pattern, tz) {
    let d = _flex_normalizeDate(datetime);
    if (!d) return null;

    // Default pattern approximating ISO8601 in UTC
    if (pattern == null) {
        pattern = 'YYYY-MM-DDTHH:mm:ss[Z]';
    }

    const offsetMinutes = _flex_parseTzOffsetMinutes(tz);
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

function _flex_normalizeDate(value) {
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return value;
    }
    if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    if (value == null) {
        return null;
    }
    const d2 = new Date(String(value));
    return isNaN(d2.getTime()) ? null : d2;
}

function _flex_parseTzOffsetMinutes(tz) {
    if (typeof tz !== 'string') return null;
    const m = /^([+-])(\d{2}):?(\d{2})?$/.exec(tz);
    if (!m) return null;
    const sign = m[1] === '-' ? -1 : 1;
    const hours = Number(m[2]);
    const mins = m[3] ? Number(m[3]) : 0;
    return sign * (hours * 60 + mins);
}

falkor.register('date.format', dateFormat);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        format: dateFormat
    };
}
