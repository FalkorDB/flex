const { initializeFLEX } = require('../setup');
const formatModule = require('../../src/date/format');
const parseModule = require('../../src/date/parse');
const toTimeZoneModule = require('../../src/date/toTimeZone');
const truncateModule = require('../../src/date/truncate');

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

        // Test local module
        const parsed = parseModule.parse('2024-01-02', 'YYYY-MM-DD');
        const formatted = formatModule.format(parsed, 'YYYY-MM-DD');
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

        // Test local module
        const truncated = truncateModule.truncate('2024-01-02T03:04:05Z', 'day');
        const formatted = formatModule.format(truncated, 'YYYY-MM-DDTHH:mm:ss[Z]');
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

        // Test local module
        const converted = toTimeZoneModule.toTimeZone('2024-01-02T00:00:00Z', '+02:00');
        const formatted = formatModule.format(converted, 'YYYY-MM-DDTHH:mm:ss[Z]');
        expect(formatted).toBe('2024-01-02T02:00:00Z');
    });
});
