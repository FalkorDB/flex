/**
 * Truncate a date/time value to the given unit (UTC-based).
 * Supported units: minute, hour, day, week, month, quarter, year.
 *
 * @param {Date|number|string|null} datetime
 * @param {string} unit
 * @returns {Date|null}
 */
const _flex_truncateHelpers = typeof module !== 'undefined' && module.exports
    ? require('./_helpers')
    : null;
const _flex_truncateNormalizeDate = _flex_truncateHelpers
    ? _flex_truncateHelpers._flex_normalizeDate
    : _flex_normalizeDate;

function truncate(datetime, unit) {
    const d0 = _flex_truncateNormalizeDate(datetime);
    if (!d0) return null;
    const d = new Date(d0.getTime());

    switch (unit) {
        case 'minute':
            d.setUTCSeconds(0, 0);
            break;
        case 'hour':
            d.setUTCMinutes(0, 0, 0);
            break;
        case 'day':
            d.setUTCHours(0, 0, 0, 0);
            break;
        case 'week': {
            // Truncate to Monday 00:00:00.000 in UTC
            const day = d.getUTCDay(); // 0=Sun..6=Sat
            const diff = (day + 6) % 7; // days since Monday
            d.setUTCDate(d.getUTCDate() - diff);
            d.setUTCHours(0, 0, 0, 0);
            break;
        }
        case 'month':
            d.setUTCDate(1);
            d.setUTCHours(0, 0, 0, 0);
            break;
        case 'quarter': {
            const month = d.getUTCMonth();
            const qStart = Math.floor(month / 3) * 3;
            d.setUTCMonth(qStart, 1);
            d.setUTCHours(0, 0, 0, 0);
            break;
        }
        case 'year':
            d.setUTCMonth(0, 1);
            d.setUTCHours(0, 0, 0, 0);
            break;
        default:
            // Unknown unit: return original normalized date
            return d0;
    }

    return d;
}

falkor.register('date.truncate', truncate);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        truncate,
        _flex_normalizeDate: _flex_truncateNormalizeDate,
    };
}
