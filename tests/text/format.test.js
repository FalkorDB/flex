/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const formatModule = require('../../src/text/format');

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

        expect(formatModule.format('Hello {0}', ['World'])).toBe('Hello World');
    });

	test('format replaces repeated placeholders and leaves unmatched ones unchanged', () => {
		expect(formatModule.format('{0} + {0} = {1}', ['1', 2])).toBe('1 + 1 = 2');
		expect(formatModule.format('Hello {0} {2}', ['World'])).toBe('Hello World {2}');
	});
});
