/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const fromPairsModule = require('../../src/map/fromPairs');

describe('FLEX map.fromPairs Integration Tests', () => {
    let db, graph;

    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

	afterAll(async () => {
        // Close the main client connection
        if (db) {
            await db.close();
            // Note: In some versions, db.quit() is used instead
        }
    });

    test('flex.map.fromPairs basic conversion', async () => {
        const q = `
        RETURN flex.map.fromPairs([['a', 1], ['b', 2], ['c', 3]]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, b: 2, c: 3 });

        expect(fromPairsModule.fromPairs([['a', 1], ['b', 2], ['c', 3]])).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('flex.map.fromPairs handles duplicates', async () => {
        const q = `
        RETURN flex.map.fromPairs([['x', 10], ['y', 20], ['x', 42]]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ x: 42, y: 20 });

        expect(fromPairsModule.fromPairs([['x', 10], ['y', 20], ['x', 42]])).toEqual({ x: 42, y: 20 });
    });

    test('flex.map.fromPairs ignores invalid entries', async () => {
        const q = `
        RETURN flex.map.fromPairs([['a', 1], ['b'], NULL, ['c', 3]]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, c: 3 });

        expect(fromPairsModule.fromPairs([['a', 1], ['b'], null, ['c', 3]])).toEqual({ a: 1, c: 3 });
    });

    test('flex.map.fromPairs null input returns empty map', async () => {
        const q = `
        RETURN flex.map.fromPairs(NULL) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});

        expect(fromPairsModule.fromPairs(null)).toEqual({});
    });

    test('flex.map.fromPairs empty list returns empty map', async () => {
        const q = `
        RETURN flex.map.fromPairs([]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({});

        expect(fromPairsModule.fromPairs([])).toEqual({});
    });
});

