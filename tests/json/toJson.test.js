const { initializeFLEX } = require('../setup');
const toJsonModule = require('../../src/json/toJson');

describe('FLEX json.toJson Integration Tests', () => {
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

    test('flex.json.toJson serializes objects', async () => {
        const q = `
        RETURN flex.json.toJson({a: 1, b: "x"}) AS j
        `;
        const result = await graph.query(q);
        expect(result.data[0]['j']).toBe('{"a":1,"b":"x"}');

        expect(toJsonModule.toJson({a: 1, b: "x"})).toBe('{"a":1,"b":"x"}');
    });

    test('flex.json.toJson serializes arrays', async () => {
        const q = `
        RETURN flex.json.toJson([1, 2, 3]) AS j
        `;
        const result = await graph.query(q);
        expect(result.data[0]['j']).toBe('[1,2,3]');

        expect(toJsonModule.toJson([1, 2, 3])).toBe('[1,2,3]');
    });

    test('flex.json.toJson normalizes undefined to null', async () => {
        const q = `
        WITH flex.json.toJson(NULL) AS j
        RETURN j
        `;
        const result = await graph.query(q);
        expect(result.data[0]['j']).toBe('null');

        expect(toJsonModule.toJson(null)).toBe('null');
    });
});
