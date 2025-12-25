// --- Module: bitwise/bitwise.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function and(a, b) {
	return a & b;
}

function or(a, b) {
	return a | b;
}

function xor(a, b) {
	return a ^ b;
}

function not(a) {
	return ~a;
}

function shiftLeft(a, b) {
	return a << b;
}

function shiftRight(a, b) {
	return a >> b;
}

falkor.register('bitwise.or', or);
falkor.register('bitwise.and', and);
falkor.register('bitwise.xor', xor);
falkor.register('bitwise.not', not);
falkor.register('bitwise.shiftLeft', shiftLeft);
falkor.register('bitwise.shiftRight', shiftRight);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        and,
        or,
        xor,
        not,
        shiftLeft,
        shiftRight
    };
}


// --- Module: collections/frequencies.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Count the frequency of each element in a list
 *
 * @param {Array|null} list
 * @returns {Object}
 */
function frequencies(list) {
    if (!Array.isArray(list)) return {};

    const result = {};

    for (const item of list) {
        // Use item as key; handle null/undefined
        const key = item === null || item === undefined ? 'null' : item;
        result[key] = (result[key] || 0) + 1;
    }

    return result;
}

falkor.register("coll.frequencies", frequencies);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        frequencies
    };
}


// --- Module: collections/intersection.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function intersection (a, b) {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}

falkor.register('coll.intersection', intersection);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        intersection
    };
}


// --- Module: collections/shuffle.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Shuffle a list using Fisher-Yates algorithm
 *
 * @param {Array|null} list
 * @returns {Array}
 */
function shuffle(list) {
    if (!Array.isArray(list)) return [];

    const result = [...list]; // clone to avoid mutation
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

falkor.register('coll.shuffle', shuffle);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        shuffle
    };
}


// --- Module: collections/union.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function union (a, b) {
  return [...new Set([...a, ...b])];
}

falkor.register('coll.union', union);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        union
    };
}


// --- Module: collections/zip.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Zip two lists into a list of pairs
 *
 * @param {Array|null} list1
 * @param {Array|null} list2
 * @returns {Array}
 */
function zip(list1, list2) {
    if (!Array.isArray(list1) || !Array.isArray(list2)) return [];

    const length = Math.min(list1.length, list2.length);
    const result = [];

    for (let i = 0; i < length; i++) {
        result.push([list1[i], list2[i]]);
    }

    return result;
}

falkor.register('coll.zip', zip);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        zip
    };
}


// --- Module: date/format.js ---
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

falkor.register('date.format', format);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        format
    };
}


// --- Module: date/parse.js ---
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
        parse
    };
}


// --- Module: date/toTimeZone.js ---
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

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toTimeZone
    };
}


// --- Module: date/truncate.js ---
/**
 * Truncate a date/time value to the given unit (UTC-based).
 * Supported units: minute, hour, day, week, month, quarter, year.
 *
 * @param {Date|number|string|null} datetime
 * @param {string} unit
 * @returns {Date|null}
 */
function truncate(datetime, unit) {
    const d0 = _flex_normalizeDate(datetime);
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

falkor.register('date.truncate', truncate);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        truncate
    };
}


// --- Module: json/fromJsonList.js ---
/**
 * Parse a JSON string into a list (array).
 * Non-array results or invalid JSON yield an empty list.
 *
 * @param {string|null} str
 * @returns {Array}
 */
function fromJsonList(str) {
    if (typeof str !== 'string') {
        return [];
    }

    try {
        const value = JSON.parse(str);
        return Array.isArray(value) ? value : [];
    } catch (e) {
        return [];
    }
}

falkor.register('json.fromJsonList', fromJsonList);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fromJsonList
    };
}


// --- Module: json/fromJsonMap.js ---
/**
 * Parse a JSON string into a map (plain object).
 * Non-object results or invalid JSON yield an empty map.
 *
 * @param {string|null} str
 * @returns {Object}
 */
function fromJsonMap(str) {
    if (typeof str !== 'string') {
        return {};
    }

    try {
        const value = JSON.parse(str);
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }
        return {};
    } catch (e) {
        return {};
    }
}

falkor.register('json.fromJsonMap', fromJsonMap);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fromJsonMap
    };
}


// --- Module: json/toJson.js ---
/**
 * Serialize a value to JSON.
 *
 * @param {any} value
 * @returns {string|null}
 */
function toJson(value) {
    try {
        const json = JSON.stringify(value);
        // JSON.stringify(undefined) returns undefined - normalize to null
        return json === undefined ? null : json;
    } catch (e) {
        return null;
    }
}

falkor.register('json.toJson', toJson);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toJson
    };
}


// --- Module: map/fromPairs.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Convert a list of [key, value] pairs into a map
 *
 * @param {Array|null} pairs
 * @returns {Object}
 */
function fromPairs(pairs) {
    if (!Array.isArray(pairs)) return {};

    const result = {};

    for (const pair of pairs) {
        if (Array.isArray(pair) && pair.length === 2) {
            const [key, value] = pair;
            if (key != null) {
                result[key] = value;
            }
        }
    }

    return result;
}

falkor.register('map.fromPairs', fromPairs);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fromPairs
    };
}


// --- Module: map/merge.js ---
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

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        merge
    };
}


// --- Module: map/removeKey.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Remove a single key from a map.
 *
 * @param {Object|null} map
 * @param {string|null} key
 * @returns {Object}
 */
function removeKey(map, key) {
    if (map == null || typeof map !== 'object') {
        return {};
    }

    // If key is null, return a shallow copy
    if (key == null) {
        return { ...map };
    }

    const result = {};

    for (const k in map) {
        if (Object.prototype.hasOwnProperty.call(map, k) && k !== key) {
            result[k] = map[k];
        }
    }

    return result;
}

falkor.register('map.removeKey', removeKey);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        removeKey
    };
}


// --- Module: map/removeKeys.js ---
/**
 * Return a new map with the specified keys removed.
 *
 * @param {Object|null} map
 * @param {Array<string>|null} keys
 * @returns {Object}
 */
function removeKeys(map, keys) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return {};
    }

    const toRemove = {};
    if (Array.isArray(keys)) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key != null) {
                toRemove[key] = true;
            }
        }
    }

    const result = {};
    for (const key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key) && !toRemove[key]) {
            result[key] = map[key];
        }
    }

    return result;
}

falkor.register('map.removeKeys', removeKeys);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        removeKeys
    };
}


// --- Module: map/submap.js ---
/**
 * Create a new map containing only a subset of keys from the input map.
 *
 * @param {Object|null} map
 * @param {Array<string>|null} keys
 * @returns {Object}
 */
function submap(map, keys) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return {};
    }
    if (!Array.isArray(keys)) {
        return {};
    }

    const result = {};

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key != null && Object.prototype.hasOwnProperty.call(map, key)) {
            result[key] = map[key];
        }
    }

    return result;
}

falkor.register('map.submap', submap);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        submap
    };
}


// --- Module: similarity/jaccard.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function jaccard(n, m) {
    const nIds = n.getNeighbors().map(x => x.id);
    const mIds = m.getNeighbors().map(x => x.id);

    const unionSize = union(nIds, mIds).length;
    const intersectionSize = intersection(nIds, mIds).length;

    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

falkor.register('sim.jaccard', jaccard);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jaccard
    };
}


// --- Module: similarity/jaroWinkler.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Jaro-Winkler similarity
 *
 * @param {string|null} s1
 * @param {string|null} s2
 * @returns {number} similarity in range [0, 1]
 */
function jaroWinkler(s1, s2) {
    if (s1 == null) s1 = "";
    if (s2 == null) s2 = "";

    s1 = String(s1);
    s2 = String(s2);

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 && len2 === 0) return 1.0;
    if (len1 === 0 || len2 === 0) return 0.0;
    if (s1 === s2) return 1.0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;

    // Count matches
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, len2);

        for (let j = start; j < end; j++) {
            if (s2Matches[j]) continue;
            if (s1[i] !== s2[j]) continue;

            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let t = 0;
    let k = 0;

    for (let i = 0; i < len1; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) t++;
        k++;
    }

    const transpositions = t / 2;

    // Jaro score
    const jaro =
        (matches / len1 +
         matches / len2 +
         (matches - transpositions) / matches) / 3;

    // Winkler adjustment
    let prefix = 0;
    const maxPrefix = 4;

    for (let i = 0; i < Math.min(maxPrefix, len1, len2); i++) {
        if (s1[i] === s2[i]) prefix++;
        else break;
    }

    const scalingFactor = 0.1;

    return jaro + prefix * scalingFactor * (1 - jaro);
}

falkor.register("sim.jaroWinkler", jaroWinkler);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jaroWinkler
    };
}


// --- Module: similarity/levenshtein.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Compute Levenshtein edit distance between two strings.
 *
 * @param {string|null} a
 * @param {string|null} b
 * @returns {number}
 */
function levenshtein(a, b) {
    // Handle null / undefined
    if (a == null) a = "";
    if (b == null) b = "";

    // Convert to strings (defensive for FLEX usage)
    a = String(a);
    b = String(b);

    const lenA = a.length;
    const lenB = b.length;

    // Fast paths
    if (lenA === 0) return lenB;
    if (lenB === 0) return lenA;
    if (a === b) return 0;

    // Ensure we use less memory: b is the shorter string
    if (lenA < lenB) {
        [a, b] = [b, a];
    }

    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);

    // Initial row
    for (let j = 0; j <= b.length; j++) {
        prev[j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        const charA = a.charCodeAt(i - 1);

        for (let j = 1; j <= b.length; j++) {
            const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;

            curr[j] = Math.min(
                prev[j] + 1,        // deletion
                curr[j - 1] + 1,    // insertion
                prev[j - 1] + cost  // substitution
            );
        }

        // Swap buffers
        for (let j = 0; j <= b.length; j++) {
            prev[j] = curr[j];
        }
    }

    return prev[b.length];
}

falkor.register('sim.levenshtein', levenshtein);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        levenshtein
    };
}


// --- Module: text/case.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function capitalize(str) {
    // Check for null/undefined explicitly to allow empty strings to pass through
    if (str == null) return null;
    if (str === "") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function decapitalize(str) {
    if (str == null) return null;
    if (str === "") return "";
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function swapCase(str) {
    if (str == null) return null;
    return str.split('').map(c => 
        c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
    ).join('');
}

function camelCase(str) {
    if (str == null) return null;
    return str.toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        // Ensure the very first character is lowercase
        .replace(/^(.)/, (m) => m.toLowerCase());
}

function upperCamelCase(str) {
    // Fixed the reference: called camelCase directly instead of text.camelCase
    const camel = camelCase(str);
    return camel ? camel.charAt(0).toUpperCase() + camel.slice(1) : null;
}

function snakeCase(str) {
    if (str == null) return null;
    const matches = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
    // Safety check: if no matches found, return empty string or original
    if (!matches) return str; 
    return matches
        .map(x => x.toLowerCase())
        .join('_');
}

// Registration
falkor.register('text.swapCase', swapCase);
falkor.register('text.camelCase', camelCase);
falkor.register('text.snakeCase', snakeCase);
falkor.register('text.capitalize', capitalize);
falkor.register('text.decapitalize', decapitalize);
falkor.register('text.upperCamelCase', upperCamelCase);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        swapCase,
        camelCase,
        snakeCase,
        capitalize,
        decapitalize,
        upperCamelCase
    };
}


// --- Module: text/format.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// sprintf format the string (Basic implementation)
function format(str, params) {
	if (str === null) return null;
	let result = str;
	params.forEach((param, i) => {
		result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), param);
	});
	return result;
}

falkor.register('text.format', format);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        format
    };
}


// --- Module: text/indexOf.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function indexOf(str, lookup, offset = 0, to = -1) {
	if (str === null) return null;
	const end = to === -1 ? str.length : to;
	const index = str.substring(0, end).indexOf(lookup, offset);
	return index;
}

// finds all occurrences of the lookup string
function indexesOf(str, lookup, from = 0, to = -1) {
	if (str === null) return null;
	const end = to === -1 ? str.length : to;
	const results = [];
	let pos = str.indexOf(lookup, from);
	while (pos !== -1 && pos < end) {
		results.push(pos);
		pos = str.indexOf(lookup, pos + 1);
	}
	return results;
}

falkor.register('text.indexOf', indexOf);
falkor.register('text.indexesOf', indexesOf);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        indexOf,
        indexesOf
    };
}


// --- Module: text/join.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// join the given strings with the given delimiter
function join (arr, delimiter) {
	if (!arr) return null;
	return arr.join(delimiter);
}

falkor.register('text.join', join);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        join
    };
}


// --- Module: text/pad.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// left pad
function lpad(str, count, delim = ' ') {
	if (str === null) return null;
	return str.toString().padStart(count, delim);
}

// right pad
function rpad(str, count, delim = ' ') {
	if (str === null) return null;
	return str.toString().padEnd(count, delim);
}

falkor.register('text.lpad', lpad);
falkor.register('text.rpad', rpad);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        lpad,
        rpad
    };
}


// --- Module: text/regexGroups.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// returns an array containing a nested array for each match
function regexGroups(str, regex) {
	if (str === null) return null;
	const re = new RegExp(regex, 'g');
	return [...str.matchAll(re)].map(match => [...match]);
}

falkor.register('text.regexGroups', regexGroups);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        regexGroups
    };
}


// --- Module: text/repeat.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// multiply the given string with the given count
function repeat (item, count) {
	if (item === null) return null;
	return item.repeat(count);
}

falkor.register('text.repeat', repeat);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        repeat
    };
}


// --- Module: text/replace.js ---
/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

// replace each substring matching regex
function replace(str, regex, replacement) {
	if (str === null) return null;
	const re = new RegExp(regex, 'g');
	return str.replace(re, replacement);
}

falkor.register('text.replace', replace);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        replace
    };
}
