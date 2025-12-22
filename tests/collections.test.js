const { initializeFLEX } = require('./setup');

describe('FLEX Text Module Integration Tests', () => {
    let db, graph;

    // Step 1 & 2: Start/Connect and Load FLEX
    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    // Step 3: Test each flex function
    test('flex.text.toReverse should reverse a string', async () => {
        const query = "RETURN flex.text.reverse('falkor')";
        const result = await graph.query(query);
        
        // Access the first row, first column of results
        expect(result.data[0][0]).toBe('roclaf');
    });
});
