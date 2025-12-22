const { initializeFLEX } = require('./setup');

describe('FLEX Collections union Module Integration Tests', () => {
    let db, graph;

    // Start/Connect and Load FLEX
    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    // Test collection union
    test('flex.union', async () => {
        const query = "RETURN flex.union([1, 2], [2, 3])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([1, 2, 3]);

        const query = "RETURN flex.union([1, 2], [])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([1, 2]);
    });
});
