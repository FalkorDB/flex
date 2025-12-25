/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const jaccardModule = require('../../src/similarity/jaccard');

describe('FLEX Jaccard Integration Tests', () => {
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

    test('flex.sim.jaccard', async () => {
		// Test with simple collections/arrays
		const q1 = `RETURN flex.sim.jaccard([1, 2, 3], [2, 3, 4]) AS sim`
        const result1 = await graph.query(q1);
        expect(result1.data[0]['sim']).toBe(0.5); // 2 common / 4 total unique

		// Test with identical sets
		const q2 = `RETURN flex.sim.jaccard([1, 2, 3], [1, 2, 3]) AS sim`
        const result2 = await graph.query(q2);
        expect(result2.data[0]['sim']).toBe(1); // identical sets

		// Test with no overlap
		const q3 = `RETURN flex.sim.jaccard([1, 2], [3, 4]) AS sim`
        const result3 = await graph.query(q3);
        expect(result3.data[0]['sim']).toBe(0); // no common elements

		// Test with empty sets
		const q4 = `RETURN flex.sim.jaccard([], []) AS sim`
        const result4 = await graph.query(q4);
        expect(result4.data[0]['sim']).toBe(0); // both empty

		// Test with string arrays
		const q5 = `RETURN flex.sim.jaccard(['tag1', 'tag2', 'tag3'], ['tag2', 'tag3', 'tag4']) AS sim`
        const result5 = await graph.query(q5);
        expect(result5.data[0]['sim']).toBe(0.5); // 2 common / 4 total unique

		// Test local module directly for code coverage
		expect(jaccardModule.jaccard([1, 2, 3], [2, 3, 4])).toBe(0.5);
		expect(jaccardModule.jaccard([1, 2, 3], [1, 2, 3])).toBe(1);
		expect(jaccardModule.jaccard([1, 2], [3, 4])).toBe(0);
		expect(jaccardModule.jaccard([], [])).toBe(0);
		expect(jaccardModule.jaccard(['tag1', 'tag2', 'tag3'], ['tag2', 'tag3', 'tag4'])).toBe(0.5);
		expect(jaccardModule.jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(0.333333333333333, 10);
    });

    test('flex.sim.jaccard handles invalid inputs', async () => {
		// Test with invalid inputs via FalkorDB
		const q = `
		RETURN
			flex.sim.jaccard(NULL, [1, 2]) AS d1,
			flex.sim.jaccard([1, 2], NULL) AS d2,
			flex.sim.jaccard(NULL, NULL) AS d3
		`;

		const result = await graph.query(q);

		expect(result.data[0]['d1']).toBe(null);
		expect(result.data[0]['d2']).toBe(null);
		expect(result.data[0]['d3']).toBe(null);

		// Test local module directly for code coverage
		expect(jaccardModule.jaccard(null, [1, 2])).toBe(null);
		expect(jaccardModule.jaccard([1, 2], null)).toBe(null);
		expect(jaccardModule.jaccard(null, null)).toBe(null);
		expect(jaccardModule.jaccard('not an array', [1, 2])).toBe(null);
		expect(jaccardModule.jaccard([1, 2], 'not an array')).toBe(null);
		expect(jaccardModule.jaccard(123, 456)).toBe(null);
    });

    test('flex.sim.jaccard symmetry', async () => {
		// Test symmetry via FalkorDB
		const q = `
		RETURN
			flex.sim.jaccard([1, 2, 3], [3, 4, 5]) AS d1,
			flex.sim.jaccard([3, 4, 5], [1, 2, 3]) AS d2
		`;

		const result = await graph.query(q);

		expect(result.data[0]['d1']).toBe(result.data[0]['d2']);

		// Test local module directly for code coverage
		expect(jaccardModule.jaccard([1, 2, 3], [3, 4, 5])).toBe(jaccardModule.jaccard([3, 4, 5], [1, 2, 3]));
		expect(jaccardModule.jaccard(['a', 'b'], ['b', 'c'])).toBe(jaccardModule.jaccard(['b', 'c'], ['a', 'b']));
    });
});

