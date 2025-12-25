/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const repeatModule = require('../../src/text/repeat');

describe('FLEX text.repeat Integration Tests', () => {
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

	test('Text function: repeat', async () => {
		res = await graph.query("RETURN flex.text.repeat('A', 3) AS res");
        expect(res.data[0]['res']).toBe('AAA');

        expect(repeatModule.repeat('A', 3)).toBe('AAA');
    });
});

