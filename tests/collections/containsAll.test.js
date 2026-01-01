/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const containsAllModule = require('../../src/collections/containsAll');

describe('FLEX coll.containsAll Integration Tests', () => {
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

    test('flex.coll.containsAll basic behavior', async () => {
        const q = `
        RETURN flex.coll.containsAll([1,2,3], [1,2]) AS c1,
               flex.coll.containsAll([1,2,3], [1,4]) AS c2,
               flex.coll.containsAll([1,2,3], []) AS c3,
               flex.coll.containsAll(NULL, [1]) AS c4
        `;
        const result = await graph.query(q);

        expect(result.data[0]['c1']).toBe(true);
        expect(result.data[0]['c2']).toBe(false);
        expect(result.data[0]['c3']).toBe(true);
        expect(result.data[0]['c4']).toBe(false);

        // Local module checks
        expect(containsAllModule.containsAll([1,2,3], [1,2])).toBe(true);
        expect(containsAllModule.containsAll([1,2,3], [1,4])).toBe(false);
        expect(containsAllModule.containsAll([1,2,3], [])).toBe(true);
        expect(containsAllModule.containsAll(null, [1])).toBe(false);
        expect(containsAllModule.containsAll([1,2,3], null)).toBe(false);
    });
});
