const { initializeFLEX } = require('./setup');

describe('FLEX Similarity Module Integration Tests', () => {
    let db, graph;

    // Start/Connect and Load FLEX
    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    // Test similarity union
    test('flex.jaccard', async () => {
		await graph.query(`CREATE
		(eve:Person   {name: 'Eve'}),
		(bob:Person   {name: 'Bob'}),
		(dave:Person  {name: 'Dave'}),
		(carol:Person {name: 'Carol'}),
		(alice:Person {name: 'Alice'}),
		(eve)-[:FRIEND]->(bob),
		(bob)-[:FRIEND]->(alice),
		(bob)-[:FRIEND]->(carol),
		(bob)-[:FRIEND]->(eve),
		(dave)-[:FRIEND]->(alice),
		(carol)-[:FRIEND]->(alice),
		(carol)-[:FRIEND]->(bob),
		(alice)-[:FRIEND]->(bob),
		(alice)-[:FRIEND]->(carol),
		(alice)-[:FRIEND]->(dave)`)

		const q = `MATCH (alice:Person {name: 'Alice'}), (n)
				   RETURN n.name, flex.jaccard(alice, n) AS sim
				   ORDER BY n.name`

        const result = await graph.query(q);

        expect(result.data[0][0]).toBe('Alice');
        expect(result.data[0][1]).toBe(1);

        expect(result.data[1][0]).toBe('Bob');
        expect(result.data[1][1]).toBe(0.2);

        expect(result.data[2][0]).toBe('Carol');
        expect(result.data[2][1]).toBe(0.25);

        expect(result.data[3][0]).toBe('Dave');
        expect(result.data[3][1]).toBe(0);

        expect(result.data[4][0]).toBe('Eve');
        expect(result.data[4][1]).toBe(0.33333);
    });
});

