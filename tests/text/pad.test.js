/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const padModule = require('../../src/text/pad');

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

	test('Padding: lpad & rpad', async () => {
		let res = await graph.query("RETURN flex.text.lpad('5', 3, '0') AS res");
        expect(res.data[0]['res']).toBe('005');

		res = await graph.query("RETURN flex.text.rpad('5', 3, '!') AS res");
        expect(res.data[0]['res']).toBe('5!!');

        // Test local module
        expect(padModule.lpad('5', 3, '0')).toBe('005');
        expect(padModule.rpad('5', 3, '!')).toBe('5!!');
    });
});

