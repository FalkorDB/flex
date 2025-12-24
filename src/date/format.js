/**
 * Format a date/time value using a simple token-based pattern.
 * Supported tokens: YYYY, MM, DD, HH, mm, ss, SSS, [Z].
 *
 * @param {Date|number|string|null} datetime
 * @param {string|null} pattern
 * @param {string|null} tz offset like "+02:00" (optional)
 * @returns {string|null}
 */
function format(datetime, pattern, tz) {
    var d = _flex_normalizeDate(datetime);
    if (!d) return null;

    // Default pattern approximating ISO8601 in UTC
    if (pattern == null) {
        pattern = 'YYYY-MM-DDTHH:mm:ss[Z]';
    }

    var offsetMinutes = _flex_parseTzOffsetMinutes(tz);
    if (offsetMinutes !== null) {
        // Show local wall time in the given offset for the same instant
        d = new Date(d.getTime() + offsetMinutes * 60000);
    }

    function pad(num, size) {
        var s = String(num);
        while (s.length < size) s = '0' + s;
        return s;
    }

    var year = d.getUTCFullYear();
    var month = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    var hour = d.getUTCHours();
    var minute = d.getUTCMinutes();
    var second = d.getUTCSeconds();
    var ms = d.getUTCMilliseconds();

    var out = pattern;
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
        var d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    if (value == null) {
        return null;
    }
    var d2 = new Date(String(value));
    return isNaN(d2.getTime()) ? null : d2;
}

function _flex_parseTzOffsetMinutes(tz) {
    if (typeof tz !== 'string') return null;
    var m = /^([+-])(\d{2}):?(\d{2})?$/.exec(tz);
    if (!m) return null;
    var sign = m[1] === '-' ? -1 : 1;
    var hours = Number(m[2]);
    var mins = m[3] ? Number(m[3]) : 0;
    return sign * (hours * 60 + mins);
}

falkor.register('date.format', format);
