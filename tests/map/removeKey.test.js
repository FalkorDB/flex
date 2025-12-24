const { initializeFLEX } = require('../setup');

describe('FLEX map Integration Tests', () => {
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

    test('flex.map.removeKey basic removal', async () => {
        const q = `
        RETURN flex.map.removeKey({a: 1, b: 2, c: 3}, 'b') AS m
        `;

        const result = await graph.query(q);
        expect(result.data[0]['m']).toEqual({ a: 1, c: 3 });
    });

    test('flex.map.removeKey missing key returns copy', async () => {
        const q = `
        RETURN flex.map.removeKey({a: 1, b: 2}, 'x') AS m
        `;

        const result = await graph.query(q);

        expect(result.data[0]['m']).toEqual({ a: 1, b: 2 });
    });

    test('flex.map.removeKey null key', async () => {
        const q = `
        RETURN flex.map.removeKey({a: 1, b: 2}, NULL) AS m
        `;

        const result = await graph.query(q);

        expect(result.data[0]['m']).toEqual({ a: 1, b: 2 });
    });

    test('flex.map.removeKey null map', async () => {
        const q = `
        RETURN flex.map.removeKey(NULL, 'a') AS m
        `;

        const result = await graph.query(q);

        expect(result.data[0]['m']).toEqual({});
    });
});

