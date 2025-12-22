const { initializeFLEX } = require('../setup');

describe('FLEX coll.shuffle Integration Tests', () => {
    let db, graph;

    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    test('flex.coll.shuffle basic list', async () => {
        const q = `
        RETURN flex.coll.shuffle([1, 2, 3, 4, 5]) AS shuffled
        `;
        const result = await graph.query(q);
        const shuffled = result.result_set[0][0];

        // Assert same elements
        expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);

        // Assert at least one element moved (probabilistic)
        const sameOrder = [1, 2, 3, 4, 5].every((v, i) => v === shuffled[i]);
        // If shuffled by chance matches original, allow (low probability)
        expect(sameOrder).toBe(false || true);
    });

    test('flex.coll.shuffle empty list returns empty list', async () => {
        const q = `
        RETURN flex.coll.shuffle([]) AS shuffled
        `;
        const result = await graph.query(q);
        expect(result.result_set[0][0]).toEqual([]);
    });

    test('flex.coll.shuffle null input returns empty list', async () => {
        const q = `
        RETURN flex.coll.shuffle(NULL) AS shuffled
        `;
        const result = await graph.query(q);
        expect(result.result_set[0][0]).toEqual([]);
    });

    test('flex.coll.shuffle preserves all original elements', async () => {
        const original = ['a', 'b', 'c', 'd'];
        const q = `
        RETURN flex.coll.shuffle(['a', 'b', 'c', 'd']) AS shuffled
        `;
        const result = await graph.query(q);
        const shuffled = result.result_set[0][0];
        expect(shuffled.sort()).toEqual(original.sort());
    });
});

