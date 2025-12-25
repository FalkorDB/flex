/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

const subtractModule = require('../../src/collections/subtract');
const containsAllModule = require('../../src/collections/containsAll');
const containsAnyModule = require('../../src/collections/containsAny');
const flattenModule = require('../../src/collections/flatten');

describe('FLEX Collections extra helpers Integration Tests', () => {
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
        expect(subtractModule.subtract([1,2,3], null)).toEqual([]);
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
