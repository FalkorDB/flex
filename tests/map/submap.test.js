const { initializeFLEX } = require('../setup');

describe('FLEX map.submap Integration Tests', () => {
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

    test('flex.map.submap selects only requested keys', async () => {
        const q = `
        RETURN flex.map.submap({a: 1, b: 2, c: 3}, ['a','c','z']) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, c: 3 });
    });

    test('flex.map.submap returns empty map for invalid inputs', async () => {
        const q = `
        RETURN flex.map.submap(NULL, ['a']) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});
    });
});
