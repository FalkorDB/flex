/**
 * Convert a date/time instant to a wall time in the given timezone offset.
 * The returned Date represents the same instant, shifted so that UTC fields
 * reflect local time in the target offset.
 *
 * @param {Date|number|string|null} datetime
 * @param {string|null} tz offset like "+02:00" or "-0500"
 * @returns {Date|null}
 */
const _flex_toTimeZoneHelpers = typeof module !== 'undefined' && module.exports
    ? require('./_helpers')
    : null;
const _flex_toTimeZoneNormalizeDate = _flex_toTimeZoneHelpers
    ? _flex_toTimeZoneHelpers._flex_normalizeDate
    : _flex_normalizeDate;
const _flex_toTimeZoneParseTzOffsetMinutes = _flex_toTimeZoneHelpers
    ? _flex_toTimeZoneHelpers._flex_parseTzOffsetMinutes
    : _flex_parseTzOffsetMinutes;

function toTimeZone(datetime, tz) {
    const d0 = _flex_toTimeZoneNormalizeDate(datetime);
    if (!d0) return null;

    const offsetMinutes = _flex_toTimeZoneParseTzOffsetMinutes(tz);
    if (offsetMinutes === null) {
        return d0;
    }

    const millis = d0.getTime() + offsetMinutes * 60000;
    return new Date(millis);
}

falkor.register('date.toTimeZone', toTimeZone);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toTimeZone,
        _flex_normalizeDate: _flex_toTimeZoneNormalizeDate,
        _flex_parseTzOffsetMinutes: _flex_toTimeZoneParseTzOffsetMinutes,
    };
}
