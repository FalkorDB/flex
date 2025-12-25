/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const levenshteinModule = require('../../src/similarity/levenshtein');

describe('FLEX Levenshtein Integration Tests', () => {
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

    test('flex.sim.levenshtein basic string distance', async () => {
        const q = `
        UNWIND [
            ['kitten',  'sitting'],
            ['flaw',    'lawn'],
            ['gumbo',   'gambol'],
            ['book',    'back'],
            ['same',    'same'],
            ['',        'abc'],
            ['abc',     '']
        ] AS pair
        RETURN
            pair[0] AS a,
            pair[1] AS b,
            flex.sim.levenshtein(pair[0], pair[1]) AS dist
        ORDER BY a, b
        `;

        const result = await graph.query(q);

        expect(result.data[0]).toEqual({'a': '',       'b': 'abc',     'dist': 3});
        expect(result.data[1]).toEqual({'a': 'abc',    'b': '',        'dist': 3});
        expect(result.data[2]).toEqual({'a': 'book',   'b': 'back',    'dist': 2});
        expect(result.data[3]).toEqual({'a': 'flaw',   'b': 'lawn',    'dist': 2});
        expect(result.data[4]).toEqual({'a': 'gumbo',  'b': 'gambol',  'dist': 2});
        expect(result.data[5]).toEqual({'a': 'kitten', 'b': 'sitting', 'dist': 3});
        expect(result.data[6]).toEqual({'a': 'same',   'b': 'same',    'dist': 0});

        // Test local module
        expect(levenshteinModule.levenshtein('',       'abc')).toBe(3);
        expect(levenshteinModule.levenshtein('abc',    '')).toBe(3);
        expect(levenshteinModule.levenshtein('book',   'back')).toBe(2);
        expect(levenshteinModule.levenshtein('flaw',   'lawn')).toBe(2);
        expect(levenshteinModule.levenshtein('gumbo',  'gambol')).toBe(2);
        expect(levenshteinModule.levenshtein('kitten', 'sitting')).toBe(3);
        expect(levenshteinModule.levenshtein('same',   'same')).toBe(0);
    });

    test('flex.sim.levenshtein handles nulls gracefully', async () => {
        const q = `
        RETURN
            flex.sim.levenshtein(NULL, 'abc')  AS d1,
            flex.sim.levenshtein('abc', NULL)  AS d2,
            flex.sim.levenshtein(NULL, NULL)   AS d3
        `;

        const result = await graph.query(q);

        expect(result.data[0]['d1']).toBe(3);
        expect(result.data[0]['d2']).toBe(3);
        expect(result.data[0]['d3']).toBe(0);

        expect(levenshteinModule.levenshtein(null, 'abc')).toBe(3);
        expect(levenshteinModule.levenshtein('abc', null)).toBe(3);
        expect(levenshteinModule.levenshtein(null, null)).toBe(0);
    });

    test('flex.sim.levenshtein symmetry', async () => {
        const q = `
        RETURN
            flex.sim.levenshtein('distance', 'editing') AS d1,
            flex.sim.levenshtein('editing', 'distance') AS d2
        `;

        const result = await graph.query(q);

        expect(result.data[0]['d1']).toBe(result.data[0]['d2']);

        expect(levenshteinModule.levenshtein('distance', 'editing')).toBe(levenshteinModule.levenshtein('editing', 'distance'));
    });
});

