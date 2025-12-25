const { initializeFLEX } = require('../setup');

const dateFormatModule = require('../../src/date/format');
const dateParseModule = require('../../src/date/parse');
const dateTruncateModule = require('../../src/date/truncate');
const dateToTimeZoneModule = require('../../src/date/toTimeZone');

describe('FLEX date.* Integration Tests', () => {
    let db, graph;

    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    afterAll(async () => {
        if (db) {
            await db.close();
        }
    });

    test('flex.date.parse + format roundtrip for YYYY-MM-DD', async () => {
        const q = `
        RETURN flex.date.format(
            flex.date.parse('2024-01-02', 'YYYY-MM-DD'),
            'YYYY-MM-DD'
        ) AS s
        `;
        const result = await graph.query(q);
        expect(result.data[0]['s']).toBe('2024-01-02');

        // Local module check for coverage: parse + format should roundtrip
        const parsed = dateParseModule.parse('2024-01-02', 'YYYY-MM-DD');
        const formatted = dateFormatModule.dateFormat(parsed, 'YYYY-MM-DD');
        expect(formatted).toBe('2024-01-02');
    });

    test('flex.date.truncate to day', async () => {
        const q = `
        RETURN flex.date.format(
            flex.date.truncate('2024-01-02T03:04:05Z', 'day'),
            'YYYY-MM-DDTHH:mm:ss[Z]'
        ) AS s
        `;
        const result = await graph.query(q);
        expect(result.data[0]['s']).toBe('2024-01-02T00:00:00Z');

        // Local module check for coverage: truncate to day
        const truncated = dateTruncateModule.truncate('2024-01-02T03:04:05Z', 'day');
        const formatted = dateFormatModule.dateFormat(truncated, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(formatted).toBe('2024-01-02T00:00:00Z');
    });

    test('flex.date.toTimeZone applies positive offset', async () => {
        const q = `
        RETURN flex.date.format(
            flex.date.toTimeZone('2024-01-02T00:00:00Z', '+02:00'),
            'YYYY-MM-DDTHH:mm:ss[Z]'
        ) AS s
        `;
        const result = await graph.query(q);
        expect(result.data[0]['s']).toBe('2024-01-02T02:00:00Z');

        // Local module check for coverage: toTimeZone should shift by +02:00
        const shifted = dateToTimeZoneModule.toTimeZone('2024-01-02T00:00:00Z', '+02:00');
        const formatted = dateFormatModule.dateFormat(shifted, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(formatted).toBe('2024-01-02T02:00:00Z');
    });
});

// Pure unit tests for date modules (no FalkorDB), to improve coverage

describe('date.* module unit tests', () => {
    test('parse supports YYYY-MM-DDTHH:mm:ss pattern', () => {
        const d = dateParseModule.parse('2024-01-02T03:04:05', 'YYYY-MM-DDTHH:mm:ss');
        const formatted = dateFormatModule.dateFormat(d, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(formatted).toBe('2024-01-02T03:04:05Z');
    });

    test('parse returns null for invalid input', () => {
        expect(dateParseModule.parse('not-a-date', 'YYYY-MM-DD')).toBeNull();
        expect(dateParseModule.parse(null, 'YYYY-MM-DD')).toBeNull();
    });

    test('parse applies timezone offset correctly', () => {
        // Local time 10:00 in +02:00 corresponds to 08:00Z
        const d = dateParseModule.parse('2024-01-02T10:00:00', 'YYYY-MM-DDTHH:mm:ss', '+02:00');
        const formatted = dateFormatModule.dateFormat(d, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(formatted).toBe('2024-01-02T08:00:00Z');
    });

    test('format uses default pattern when pattern is null', () => {
        const d = dateParseModule.parse('2024-01-02', 'YYYY-MM-DD');
        const formatted = dateFormatModule.dateFormat(d, null);
        // Default pattern is YYYY-MM-DDTHH:mm:ss[Z]
        expect(formatted).toBe('2024-01-02T00:00:00Z');
    });

    test('truncate supports minute and hour units', () => {
        const base = '2024-01-02T03:04:05Z';
        const minute = dateTruncateModule.truncate(base, 'minute');
        const minuteStr = dateFormatModule.dateFormat(minute, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(minuteStr).toBe('2024-01-02T03:04:00Z');

        const hour = dateTruncateModule.truncate(base, 'hour');
        const hourStr = dateFormatModule.dateFormat(hour, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(hourStr).toBe('2024-01-02T03:00:00Z');
    });

    test('truncate supports week, month, quarter, and year', () => {
        const base = '2024-03-15T10:20:30Z';

        const week = dateTruncateModule.truncate(base, 'week');
        const weekStr = dateFormatModule.dateFormat(week, 'YYYY-MM-DDTHH:mm:ss[Z]');
        // 2024-03-15 is a Friday; week truncation is to Monday of that week
        expect(weekStr).toBe('2024-03-11T00:00:00Z');

        const month = dateTruncateModule.truncate(base, 'month');
        const monthStr = dateFormatModule.dateFormat(month, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(monthStr).toBe('2024-03-01T00:00:00Z');

        const quarter = dateTruncateModule.truncate(base, 'quarter');
        const quarterStr = dateFormatModule.dateFormat(quarter, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(quarterStr).toBe('2024-01-01T00:00:00Z');

        const year = dateTruncateModule.truncate(base, 'year');
        const yearStr = dateFormatModule.dateFormat(year, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(yearStr).toBe('2024-01-01T00:00:00Z');
    });

    test('truncate returns original date for unknown unit', () => {
        const base = '2024-01-02T03:04:05Z';
        const truncated = dateTruncateModule.truncate(base, 'unknown');
        const truncatedStr = dateFormatModule.dateFormat(truncated, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(truncatedStr).toBe('2024-01-02T03:04:05Z');
    });

    test('toTimeZone applies negative and null offsets', () => {
        const base = '2024-01-02T00:00:00Z';

        // -03:00 should shift to previous day 21:00Z
        const neg = dateToTimeZoneModule.toTimeZone(base, '-03:00');
        const negStr = dateFormatModule.dateFormat(neg, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(negStr).toBe('2024-01-01T21:00:00Z');

        // Null / invalid tz should return original instant
        const same1 = dateToTimeZoneModule.toTimeZone(base, null);
        const same1Str = dateFormatModule.dateFormat(same1, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(same1Str).toBe('2024-01-02T00:00:00Z');

        const same2 = dateToTimeZoneModule.toTimeZone(base, 'invalid');
        const same2Str = dateFormatModule.dateFormat(same2, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(same2Str).toBe('2024-01-02T00:00:00Z');
    });

    test('_flex_parseTzOffsetMinutes handles various inputs', () => {
        const parseOffset = dateToTimeZoneModule._flex_parseTzOffsetMinutes;
        expect(parseOffset('+02:30')).toBe(150);
        expect(parseOffset('-0500')).toBe(-300);
        expect(parseOffset('Z')).toBeNull();
        expect(parseOffset(null)).toBeNull();
    });
});
