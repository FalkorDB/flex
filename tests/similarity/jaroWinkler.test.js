const { initializeFLEX } = require('../setup');

describe('FLEX Jaro-Winkler Integration Tests', () => {
    let db, graph;

    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    test('flex.jaroWinkler basic similarity', async () => {
        const q = `
        UNWIND [
            ['MARTHA', 'MARHTA'],
            ['DIXON',  'DICKSONX'],
            ['JELLYFISH', 'SMELLYFISH'],
            ['same', 'same'],
            ['abc', 'xyz']
        ] AS pair
        RETURN
            pair[0] AS a,
            pair[1] AS b,
            round(flex.jaroWinkler(pair[0], pair[1]), 5) AS sim
        ORDER BY a, b
        `;

        const result = await graph.query(q).result_set;

        expect(result[0]).toEqual(['DIXON', 'DICKSONX', 0.81333]);
        expect(result[1]).toEqual(['JELLYFISH', 'SMELLYFISH', 0.89630]);
        expect(result[2]).toEqual(['MARTHA', 'MARHTA', 0.96111]);
        expect(result[3]).toEqual(['abc', 'xyz', 0.0]);
        expect(result[4]).toEqual(['same', 'same', 1.0]);
    });

    test('flex.jaroWinkler handles nulls', async () => {
        const q = `
        RETURN
            flex.jaroWinkler(NULL, 'abc')  AS d1,
            flex.jaroWinkler('abc', NULL)  AS d2,
            flex.jaroWinkler(NULL, NULL)   AS d3
        `;

        const result = await graph.query(q).result_set;

        expect(result[0][0]).toBe(0.0);
        expect(result[0][1]).toBe(0.0);
        expect(result[0][2]).toBe(1.0);
    });

    test('flex.jaroWinkler symmetry', async () => {
        const q = `
        RETURN
            round(flex.jaroWinkler('distance', 'editing'), 6) AS d1,
            round(flex.jaroWinkler('editing', 'distance'), 6) AS d2
        `;

        const result = await graph.query(q).result_set;

        expect(result[0][0]).toBe(result[0][1]);
    });
});

