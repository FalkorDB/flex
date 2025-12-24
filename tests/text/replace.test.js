/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX text.replace Integration Tests', () => {
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

	test('Regex functions: replace', async () => {
        let res = await graph.query("RETURN flex.text.replace('abc-123', '[0-9]', 'X') AS res");
        expect(res.data[0]['res']).toBe('abc-XXX');
    });
});

