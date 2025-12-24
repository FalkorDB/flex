/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX coll.frequencies Integration Tests', () => {
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

    test('flex.coll.frequencies counts numbers', async () => {
        const q = `
        RETURN flex.coll.frequencies([1,2,2,3,3,3]) AS freq
        `;
        const result = await graph.query(q);
        expect(result.data[0]['freq']).toEqual({ "1":1, "2":2, "3":3 });
    });

    test('flex.coll.frequencies counts strings', async () => {
        const q = `
        RETURN flex.coll.frequencies(['a','b','a','c','b','a']) AS freq
        `;
        const result = await graph.query(q);
        expect(result.data[0]['freq']).toEqual({ a:3, b:2, c:1 });
    });

    test('flex.coll.frequencies handles null elements', async () => {
        const q = `
        RETURN flex.coll.frequencies([1,null,2,null,2]) AS freq
        `;
        const result = await graph.query(q);
        expect(result.data[0]['freq']).toEqual({ "1":1, "2":2, "null":2 });
    });

    test('flex.coll.frequencies empty list returns empty map', async () => {
        const q = `
        RETURN flex.coll.frequencies([]) AS freq
        `;
        const result = await graph.query(q);
        expect(result.data[0]['freq']).toEqual({});
    });

    test('flex.coll.frequencies null input returns empty map', async () => {
        const q = `
        RETURN flex.coll.frequencies(NULL) AS freq
        `;
        const result = await graph.query(q);
        expect(result.data[0]['freq']).toEqual({});
    });
});

