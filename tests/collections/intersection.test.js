/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX Collections intersection Module Integration Tests', () => {
    let db, graph;

    // Start/Connect and Load FLEX
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

    // Test collection intersection
    test('flex.coll.intersection', async () => {
        let query = "RETURN flex.coll.intersection([1, 2], [1, 2]) AS inter";
        let result = await graph.query(query);
        expect(result.data[0]['inter']).toEqual([1, 2]);

        query = "RETURN flex.coll.intersection([1, 2], [2, 3]) AS inter";
        result = await graph.query(query);
        expect(result.data[0]['inter']).toEqual([2]);

        query = "RETURN flex.coll.intersection([1, 2], [3, 4]) AS inter";
        result = await graph.query(query);
        expect(result.data[0]['inter']).toEqual([]);

        query = "RETURN flex.coll.intersection([1, 2], []) AS inter";
        result = await graph.query(query);
        expect(result.data[0]['inter']).toEqual([]);

        query = "RETURN flex.coll.intersection([], [1, 2]) AS inter";
        result = await graph.query(query);
        expect(result.data[0]['inter']).toEqual([]);

        query = "RETURN flex.coll.intersection([], []) AS inter";
        result = await graph.query(query);
        expect(result.data[0]['inter']).toEqual([]);
    });
});
