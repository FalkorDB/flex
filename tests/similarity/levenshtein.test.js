const { initializeFLEX } = require('../setup');

describe('FLEX Levenshtein Integration Tests', () => {
    let db, graph;

    // Start/Connect and Load FLEX
    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    test('flex.levenshtein basic string distance', async () => {
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
            flex.levenshtein(pair[0], pair[1]) AS dist
        ORDER BY a, b
        `;

        const result = await graph.query(q);

        expect(result.data[0]).toEqual(['', 'abc', 3]);
        expect(result.data[1]).toEqual(['abc', '', 3]);
        expect(result.data[2]).toEqual(['book', 'back', 2]);
        expect(result.data[3]).toEqual(['flaw', 'lawn', 2]);
        expect(result.data[4]).toEqual(['gumbo', 'gambol', 2]);
        expect(result.data[5]).toEqual(['kitten', 'sitting', 3]);
        expect(result.data[6]).toEqual(['same', 'same', 0]);
    });

    test('flex.levenshtein handles nulls gracefully', async () => {
        const q = `
        RETURN
            flex.levenshtein(NULL, 'abc')  AS d1,
            flex.levenshtein('abc', NULL)  AS d2,
            flex.levenshtein(NULL, NULL)   AS d3
        `;

        const result = await graph.query(q);

        expect(result.data[0][0]).toBe(3);
        expect(result.data[0][1]).toBe(3);
        expect(result.data[0][2]).toBe(0);
    });

    test('flex.levenshtein symmetry', async () => {
        const q = `
        RETURN
            flex.levenshtein('distance', 'editing') AS d1,
            flex.levenshtein('editing', 'distance') AS d2
        `;

        const result = await graph.query(q);

        expect(result.data[0][0]).toBe(result.data[0][1]);
    });
});

