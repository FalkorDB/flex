const { initializeFLEX } = require('../setup');
const fromJsonListModule = require('../../src/json/fromJsonList');

describe('FLEX json.fromJsonList Integration Tests', () => {
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

    test('flex.json.fromJsonList parses array JSON', async () => {
        const q = `
        RETURN flex.json.fromJsonList('[1,2,3]') AS lst
        `;
        const result = await graph.query(q);
        expect(result.data[0]['lst']).toEqual([1, 2, 3]);

        expect(fromJsonListModule.fromJsonList('[1,2,3]')).toEqual([1, 2, 3]);
    });

    test('flex.json.fromJsonList returns empty list for non-array JSON', async () => {
        const q = `
        RETURN flex.json.fromJsonList('{"a":1}') AS lst
        `;
        const result = await graph.query(q);
        expect(result.data[0]['lst']).toEqual([]);

        expect(fromJsonListModule.fromJsonList('{"a":1}')).toEqual([]);
    });

    test('flex.json.fromJsonList returns empty list for invalid JSON', async () => {
        const q = `
        RETURN flex.json.fromJsonList('not json') AS lst
        `;
        const result = await graph.query(q);
        expect(result.data[0]['lst']).toEqual([]);

        expect(fromJsonListModule.fromJsonList('not json')).toEqual([]);
    });

    test('flex.json.fromJsonList returns empty list for non-string input', async () => {
        const q = `
        RETURN flex.json.fromJsonList(NULL) AS lst
        `;
        const result = await graph.query(q);
        expect(result.data[0]['lst']).toEqual([]);

        expect(fromJsonListModule.fromJsonList(null)).toEqual([]);
    });
});
