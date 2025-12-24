/**
 * Convert a date/time instant to a wall time in the given timezone offset.
 * The returned Date represents the same instant, shifted so that UTC fields
 * reflect local time in the target offset.
 *
 * @param {Date|number|string|null} datetime
 * @param {string|null} tz offset like "+02:00" or "-0500"
 * @returns {Date|null}
 */
function toTimeZone(datetime, tz) {
    const d0 = _flex_normalizeDate(datetime);
    if (!d0) return null;

    const offsetMinutes = _flex_parseTzOffsetMinutes(tz);
    if (offsetMinutes === null) {
        return d0;
    }

    const millis = d0.getTime() + offsetMinutes * 60000;
    return new Date(millis);
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

falkor.register('date.toTimeZone', toTimeZone);
