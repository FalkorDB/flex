/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX text.format Integration Tests', () => {
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

	test('flex.text.format', async () => {
		let res = await graph.query("RETURN flex.text.format('Hello {0}', ['World']) AS res");
        expect(res.data[0]['res']).toBe('Hello World');
    });
});

