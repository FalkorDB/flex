const { initializeFLEX } = require('../setup');
const fromJsonMapModule = require('../../src/json/fromJsonMap');

describe('FLEX json.fromJsonMap Integration Tests', () => {
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

    test('flex.json.fromJsonMap parses object JSON', async () => {
        const q = `
        RETURN flex.json.fromJsonMap('{"a":1,"b":2}') AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, b: 2 });

        expect(fromJsonMapModule.fromJsonMap('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
    });

    test('flex.json.fromJsonMap returns empty map for non-object JSON', async () => {
        const q = `
        RETURN flex.json.fromJsonMap('[1,2,3]') AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});

        expect(fromJsonMapModule.fromJsonMap('[1,2,3]')).toEqual({});
    });

    test('flex.json.fromJsonMap returns empty map for invalid JSON', async () => {
        const q = `
        RETURN flex.json.fromJsonMap('{invalid}') AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});

        expect(fromJsonMapModule.fromJsonMap('{invalid}')).toEqual({});
    });

    test('flex.json.fromJsonMap returns empty map for non-string input', async () => {
        const q = `
        RETURN flex.json.fromJsonMap(NULL) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});

        expect(fromJsonMapModule.fromJsonMap(null)).toEqual({});
    });
});
