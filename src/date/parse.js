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

    const input = String(text);
    let d = null;

    if (pattern === 'YYYY-MM-DD') {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
        if (!m) return null;
        const year = Number(m[1]);
        const month = Number(m[2]) - 1; // 0-based
        const day = Number(m[3]);
        d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    } else if (pattern === 'YYYY-MM-DDTHH:mm:ss') {
        const m2 = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/.exec(input);
        if (!m2) return null;
        const y2 = Number(m2[1]);
        const mo2 = Number(m2[2]) - 1;
        const d2 = Number(m2[3]);
        const h2 = Number(m2[4]);
        const mi2 = Number(m2[5]);
        const s2 = Number(m2[6]);
        d = new Date(Date.UTC(y2, mo2, d2, h2, mi2, s2, 0));
    } else {
        // Generic ISO-8601 / Date constructor fallback
        d = new Date(input);
    }

    if (isNaN(d.getTime())) {
        return null;
    }

    // Optional timezone offset handling: interpret the parsed date as if in tz and convert to UTC
    const offsetMinutes = _flex_parseTzOffsetMinutes(tz);
    if (offsetMinutes !== null) {
        // Local time in tz -> UTC instant
        const utcMillis = d.getTime() - offsetMinutes * 60000;
        d = new Date(utcMillis);
    }

    return d;
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

falkor.register('date.parse', parse);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parse,
        _flex_parseTzOffsetMinutes,
    };
}
