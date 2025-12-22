const { initializeFLEX } = require('./setup');

describe('FLEX Collections Module Integration Tests', () => {
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

    // Test collection intersection
    test('flex.intersection', async () => {
        const query = "RETURN flex.intersection([1, 2], [1, 2])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([1, 2]);

        const query = "RETURN flex.intersection([1, 2], [2, 3])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([2]);

        const query = "RETURN flex.intersection([1, 2], [3, 4])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([]);

        const query = "RETURN flex.union([1, 2], [])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([]);

        const query = "RETURN flex.union([], [1, 2])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([]);

        const query = "RETURN flex.union([], [])";
        const result = await graph.query(query);
        expect(result.data[0][0]).toBe([]);
    });
});
