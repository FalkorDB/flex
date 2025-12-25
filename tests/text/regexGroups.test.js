/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const regexGroupsModule = require('../../src/text/regexGroups');

describe('FLEX text.regexGroups Integration Tests', () => {
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

	test('Regex functions: regexGroups', async () => {
        // Returns nested arrays for matches
        let res = await graph.query("RETURN flex.text.regexGroups('a1 b2', '(\\w)(\\d)') AS res");
        expect(res.data[0]['res']).toEqual([["a1", "a", "1"], ["b2", "b", "2"]]);

        expect(regexGroupsModule.regexGroups('a1 b2', '(\\w)(\\d)')).toEqual([["a1", "a", "1"], ["b2", "b", "2"]]);
    });
});
