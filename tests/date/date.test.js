const { initializeFLEX } = require('../setup');

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
    });
});
