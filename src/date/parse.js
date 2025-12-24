/**
 * Parse a date/time string into a Date.
 * Supports a small set of explicit patterns and falls back to Date parsing.
 *
 * @param {string|null} text
 * @param {string|null} pattern
 * @param {string|null} tz offset like "+02:00" or "-0500" (optional)
 * @returns {Date|null}
 */
function parse(text, pattern, tz) {
    if (text == null) {
        return null;
    }

    text = String(text);
    var d = null;

    if (pattern === 'YYYY-MM-DD') {
        var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
        if (!m) return null;
        var year = Number(m[1]);
        var month = Number(m[2]) - 1; // 0-based
        var day = Number(m[3]);
        d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    } else if (pattern === 'YYYY-MM-DDTHH:mm:ss') {
        var m2 = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/.exec(text);
        if (!m2) return null;
        var y2 = Number(m2[1]);
        var mo2 = Number(m2[2]) - 1;
        var d2 = Number(m2[3]);
        var h2 = Number(m2[4]);
        var mi2 = Number(m2[5]);
        var s2 = Number(m2[6]);
        d = new Date(Date.UTC(y2, mo2, d2, h2, mi2, s2, 0));
    } else {
        // Generic ISO-8601 / Date constructor fallback
        d = new Date(text);
    }

    if (isNaN(d.getTime())) {
        return null;
    }

    // Optional timezone offset handling: interpret the parsed date as if in tz and convert to UTC
    var offsetMinutes = _flex_parseTzOffsetMinutes(tz);
    if (offsetMinutes !== null) {
        // Local time in tz -> UTC instant
        var utcMillis = d.getTime() - offsetMinutes * 60000;
        d = new Date(utcMillis);
    }

    return d;
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

falkor.register('date.parse', parse);
