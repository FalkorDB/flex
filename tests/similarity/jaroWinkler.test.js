const { initializeFLEX } = require('../setup');

describe('FLEX Jaro-Winkler Integration Tests', () => {
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

    test('flex.sim.jaroWinkler basic similarity', async () => {
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
            flex.sim.jaroWinkler(pair[0], pair[1]) AS sim
        ORDER BY a, b
        `;

        const result = await graph.query(q);

        expect(result.data[0]).toEqual({'a': 'DIXON',     'b': 'DICKSONX',   'sim': 0.813333333333333});
        expect(result.data[1]).toEqual({'a': 'JELLYFISH', 'b': 'SMELLYFISH', 'sim': 0.896296296296296});
        expect(result.data[2]).toEqual({'a': 'MARTHA',    'b': 'MARHTA',     'sim': 0.961111111111111});
        expect(result.data[3]).toEqual({'a': 'abc',       'b': 'xyz',        'sim': 0.0});
        expect(result.data[4]).toEqual({'a': 'same',      'b': 'same',       'sim': 1.0});
    });

    test('flex.sim.jaroWinkler handles nulls', async () => {
        const q = `
        RETURN
            flex.sim.jaroWinkler(NULL, 'abc')  AS d1,
            flex.sim.jaroWinkler('abc', NULL)  AS d2,
            flex.sim.jaroWinkler(NULL, NULL)   AS d3
        `;

        const result = await graph.query(q);

        expect(result.data[0]['d1']).toBe(0.0);
        expect(result.data[0]['d2']).toBe(0.0);
        expect(result.data[0]['d3']).toBe(1.0);
    });

    test('flex.sim.jaroWinkler symmetry', async () => {
		console.log("Im here!");
        const q = `
        RETURN
            flex.sim.jaroWinkler('distance', 'editing') AS d1,
            flex.sim.jaroWinkler('editing', 'distance') AS d2
        `;

        const result = await graph.query(q);

		console.log("result.data[0]['d1']: " + result.data[0]['d1']);
		console.log("result.data[0]['d2']: " + result.data[0]['d2']);
        expect(result.data[0]['d1']).toBe(result.data[0]['d2']);
    });
});

