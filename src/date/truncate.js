/**
 * Truncate a date/time value to the given unit (UTC-based).
 * Supported units: minute, hour, day, week, month, quarter, year.
 *
 * @param {Date|number|string|null} datetime
 * @param {string} unit
 * @returns {Date|null}
 */
function truncate(datetime, unit) {
    var d0 = _flex_normalizeDate(datetime);
    if (!d0) return null;
    var d = new Date(d0.getTime());

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
            var day = d.getUTCDay(); // 0=Sun..6=Sat
            var diff = (day + 6) % 7; // days since Monday
            d.setUTCDate(d.getUTCDate() - diff);
            d.setUTCHours(0, 0, 0, 0);
            break;
        }
        case 'month':
            d.setUTCDate(1);
            d.setUTCHours(0, 0, 0, 0);
            break;
        case 'quarter': {
            var month = d.getUTCMonth();
            var qStart = Math.floor(month / 3) * 3;
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

falkor.register('date.truncate', truncate);
