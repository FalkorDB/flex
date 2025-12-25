/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

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
    });
});

