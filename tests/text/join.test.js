/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const joinModule = require('../../src/text/join');

describe('FLEX text.join Integration Tests', () => {
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

	test('String utility: join', async () => {
        let res = await graph.query("RETURN flex.text.join(['a', 'b'], '-') AS res");
        expect(res.data[0]['res']).toBe('a-b');

        expect(joinModule.join(['a', 'b'], '-')).toBe('a-b');
    });
});

