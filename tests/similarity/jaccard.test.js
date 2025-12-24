/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX Jaccard Integration Tests', () => {
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

    test('flex.sim.jaccard', async () => {
+		// Ensure a clean slate for this test so that repeated runs don't
+		// accumulate `Person` nodes and change the result ordering.
+		await graph.query(`MATCH (p:Person)-[r]-() DELETE r`);
+		await graph.query(`MATCH (p:Person) DELETE p`);
+
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
				   RETURN n.name AS name, flex.sim.jaccard(alice, n) AS sim
				   ORDER BY n.name`

        const result = await graph.query(q);

        expect(result.data[0]['name']).toBe('Alice');
        expect(result.data[0]['sim']).toBe(1);

        expect(result.data[1]['name']).toBe('Bob');
        expect(result.data[1]['sim']).toBe(0.2);

        expect(result.data[2]['name']).toBe('Carol');
        expect(result.data[2]['sim']).toBe(0.25);

        expect(result.data[3]['name']).toBe('Dave');
        expect(result.data[3]['sim']).toBe(0);

        expect(result.data[4]['name']).toBe('Eve');
        expect(result.data[4]['sim']).toBe(0.333333333333333);
    });
});

