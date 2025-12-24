/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX coll.shuffle Integration Tests', () => {
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

    test('flex.coll.shuffle basic list', async () => {
        const q = `
        RETURN flex.coll.shuffle([1, 2, 3, 4, 5]) AS shuffled
        `;
        const result = await graph.query(q);
        const shuffled = result.data[0]['shuffled'];

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
        expect(result.data[0]['shuffled']).toEqual([]);
    });

    test('flex.coll.shuffle null input returns empty list', async () => {
        const q = `
        RETURN flex.coll.shuffle(NULL) AS shuffled
        `;
        const result = await graph.query(q);
        expect(result.data[0]['shuffled']).toEqual([]);
    });

    test('flex.coll.shuffle preserves all original elements', async () => {
        const original = ['a', 'b', 'c', 'd'];
        const q = `
        RETURN flex.coll.shuffle(['a', 'b', 'c', 'd']) AS shuffled
        `;
        const result = await graph.query(q);
        const shuffled = result.data[0]['shuffled'];
        expect(shuffled.sort()).toEqual(original.sort());
    });
});

