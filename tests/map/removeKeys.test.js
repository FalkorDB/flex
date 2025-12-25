const { initializeFLEX } = require('../setup');
const removeKeysModule = require('../../src/map/removeKeys');

describe('FLEX map.removeKeys Integration Tests', () => {
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

    test('flex.map.removeKeys removes given keys', async () => {
        const q = `
        RETURN flex.map.removeKeys({a: 1, b: 2, c: 3}, ['b']) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, c: 3 });

        expect(removeKeysModule.removeKeys({a: 1, b: 2, c: 3}, ['b'])).toEqual({ a: 1, c: 3 });
    });

    test('flex.map.removeKeys returns empty map for non-object input', async () => {
        const q = `
        RETURN flex.map.removeKeys(NULL, ['a']) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});

        expect(removeKeysModule.removeKeys(null, ['a'])).toEqual({});
    });
});
