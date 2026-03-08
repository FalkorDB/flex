/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const flattenModule = require('../../src/collections/flatten');

describe('FLEX coll.flatten Integration Tests', () => {
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

    test('flex.coll.flatten basic behavior', async () => {
        const q = `
        RETURN flex.coll.flatten([[1,2],[3]]) AS f1,
               flex.coll.flatten([[1],[2,3],[]]) AS f2,
               flex.coll.flatten([1,[2,3],4]) AS f3,
               flex.coll.flatten(NULL) AS f4
        `;
        const result = await graph.query(q);

        expect(result.data[0]['f1']).toEqual([1,2,3]);
        expect(result.data[0]['f2']).toEqual([1,2,3]);
        expect(result.data[0]['f3']).toEqual([1,2,3,4]);
        expect(result.data[0]['f4']).toEqual([]);

        // Local module checks
        expect(flattenModule.flatten([[1,2],[3]])).toEqual([1,2,3]);
        expect(flattenModule.flatten([[1],[2,3],[]])).toEqual([1,2,3]);
        expect(flattenModule.flatten([1,[2,3],4])).toEqual([1,2,3,4]);
        expect(flattenModule.flatten(null)).toEqual([]);
    });
});
