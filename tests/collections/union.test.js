/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const unionModule = require('../../src/collections/union');

describe('FLEX Collections union Module Integration Tests', () => {
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

    // Test collection union
	test('flex.coll.union', async () => {
		let query = "RETURN flex.coll.union([1, 2], [2, 3]) AS union";
		let result = await graph.query(query);
		expect(result.data[0]['union'].sort((a, b) => a - b)).toEqual([1, 2, 3]);
		expect(unionModule.union([1, 2], [2, 3]).sort((a, b) => a - b)).toEqual([1, 2, 3]);

		query = "RETURN flex.coll.union([1, 2], []) AS union";
		result = await graph.query(query);
		expect(result.data[0]['union'].sort((a, b) => a - b)).toEqual([1, 2]);
		expect(unionModule.union([1, 2], []).sort((a, b) => a - b)).toEqual([1, 2]);
	});
});
