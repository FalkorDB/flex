/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const indexOfModule = require('../../src/text/indexOf');

describe('FLEX text.indexOf Integration Tests', () => {
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

	test('flex.text.indexOf and indexesOf', async () => {
        const q1 = "RETURN flex.text.indexOf('hello world', 'o') AS res";
        const r1 = await graph.query(q1);
        expect(r1.data[0]['res']).toBe(4);

        const q2 = "RETURN flex.text.indexesOf('hello world', 'o') AS res";
        const r2 = await graph.query(q2);
        expect(r2.data[0]['res']).toEqual([4, 7]);

        // Test local module
        expect(indexOfModule.indexOf('hello world', 'o')).toBe(4);
        expect(indexOfModule.indexesOf('hello world', 'o')).toEqual([4, 7]);
    });
});

