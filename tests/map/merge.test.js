const { initializeFLEX } = require('../setup');
const mergeModule = require('../../src/map/merge');

describe('FLEX map.merge Integration Tests', () => {
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

    test('flex.map.merge merges two maps with override', async () => {
        const q = `
        RETURN flex.map.merge({a: 1, b: 2}, {b: 3, c: 4}) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, b: 3, c: 4 });

        expect(mergeModule.merge({a: 1, b: 2}, {b: 3, c: 4})).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('flex.map.merge ignores non-object inputs', async () => {
        const q = `
        RETURN flex.map.merge({a: 1}, NULL, 42, ['x']) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1 });

        expect(mergeModule.merge({a: 1}, null, 42, ['x'])).toEqual({ a: 1 });
    });
});
