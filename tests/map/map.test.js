const { initializeFLEX } = require('../setup');

describe('FLEX map Integration Tests', () => {
    let db, graph;

    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    test('flex.map.removeKey basic removal', async () => {
        const q = `
        RETURN flex.map.removeKey({a: 1, b: 2, c: 3}, 'b') AS m
        `;

        const result = await graph.query(q).result_set;

        expect(result[0][0]).toEqual({ a: 1, c: 3 });
    });

    test('flex.map.removeKey missing key returns copy', async () => {
        const q = `
        RETURN flex.map.removeKey({a: 1, b: 2}, 'x') AS m
        `;

        const result = await graph.query(q).result_set;

        expect(result[0][0]).toEqual({ a: 1, b: 2 });
    });

    test('flex.map.removeKey null key', async () => {
        const q = `
        RETURN flex.map.removeKey({a: 1, b: 2}, NULL) AS m
        `;

        const result = await graph.query(q).result_set;

        expect(result[0][0]).toEqual({ a: 1, b: 2 });
    });

    test('flex.map.removeKey null map', async () => {
        const q = `
        RETURN flex.map.removeKey(NULL, 'a') AS m
        `;

        const result = await graph.query(q).result_set;

        expect(result[0][0]).toEqual({});
    });
});

describe('FLEX map.fromPairs Integration Tests', () => {
    let db, graph;

    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    test('flex.map.fromPairs basic conversion', async () => {
        const q = `
        RETURN flex.map.fromPairs([['a', 1], ['b', 2], ['c', 3]]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0][0]).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('flex.map.fromPairs handles duplicates', async () => {
        const q = `
        RETURN flex.map.fromPairs([['x', 10], ['y', 20], ['x', 42]]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0][0]).toEqual({ x: 42, y: 20 });
    });

    test('flex.map.fromPairs ignores invalid entries', async () => {
        const q = `
        RETURN flex.map.fromPairs([['a', 1], ['b'], NULL, ['c', 3]]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0][0]).toEqual({ a: 1, c: 3 });
    });

    test('flex.map.fromPairs null input returns empty map', async () => {
        const q = `
        RETURN flex.map.fromPairs(NULL) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0][0]).toEqual({});
    });

    test('flex.map.fromPairs empty list returns empty map', async () => {
        const q = `
        RETURN flex.map.fromPairs([]) AS m
        `;
        const result = await graph.query(q);
        expect(result.data[0][0]).toEqual({});
    });
});

