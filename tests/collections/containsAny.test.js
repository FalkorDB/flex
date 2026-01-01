/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const containsAnyModule = require('../../src/collections/containsAny');

describe('FLEX coll.containsAny Integration Tests', () => {
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

    test('flex.coll.containsAny basic behavior', async () => {
        const q = `
        RETURN flex.coll.containsAny([1,2,3], [4,2]) AS c1,
               flex.coll.containsAny([1,2,3], [4,5]) AS c2,
               flex.coll.containsAny([1,2,3], []) AS c3,
               flex.coll.containsAny(NULL, [1]) AS c4
        `;
        const result = await graph.query(q);

        expect(result.data[0]['c1']).toBe(true);
        expect(result.data[0]['c2']).toBe(false);
        expect(result.data[0]['c3']).toBe(false);
        expect(result.data[0]['c4']).toBe(false);

        // Local module checks
        expect(containsAnyModule.containsAny([1,2,3], [4,2])).toBe(true);
        expect(containsAnyModule.containsAny([1,2,3], [4,5])).toBe(false);
        expect(containsAnyModule.containsAny([1,2,3], [])).toBe(false);
        expect(containsAnyModule.containsAny(null, [1])).toBe(false);
        expect(containsAnyModule.containsAny([1,2,3], null)).toBe(false);
    });
});
