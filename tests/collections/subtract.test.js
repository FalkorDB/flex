/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const subtractModule = require('../../src/collections/subtract');

describe('FLEX coll.subtract Integration Tests', () => {
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

    test('flex.coll.subtract basic behavior', async () => {
        const q = `
        RETURN flex.coll.subtract([1,2,3,1], [1]) AS out,
               flex.coll.subtract([1,2,3], []) AS out2,
               flex.coll.subtract(NULL, [1]) AS out3
        `;
        const result = await graph.query(q);

        expect(result.data[0]['out']).toEqual([2,3]);
        expect(result.data[0]['out2']).toEqual([1,2,3]);
        expect(result.data[0]['out3']).toEqual([]);

        // Local module checks
        expect(subtractModule.subtract([1,2,3,1], [1])).toEqual([2,3]);
        expect(subtractModule.subtract([1,2,3], [])).toEqual([1,2,3]);
        expect(subtractModule.subtract(null, [1])).toEqual([]);
        // Non-array toRemove should behave like an empty removal list
        expect(subtractModule.subtract([1,2,3], null)).toEqual([1,2,3]);
    });
});
