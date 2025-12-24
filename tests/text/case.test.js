/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX Case Integration Tests', () => {
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

	// --- Case Transformations ---
    test('Case functions: capitalize, swapCase, camelCase, etc.', async () => {
        const cases = [
            ["capitalize('node')", "Node"],
            ["decapitalize('Node')", "node"],
            ["swapCase('aBc')", "AbC"],
            ["camelCase('foo bar')", "fooBar"],
            ["upperCamelCase('foo bar')", "FooBar"],
            ["snakeCase('FooBar')", "foo_bar"],
        ];

        for (const [fn, expected] of cases) {
            const res = await graph.query(`RETURN flex.text.${fn} AS res`);
			expect(res.data[0]['res']).toBe(expected);
        }
    });
});

