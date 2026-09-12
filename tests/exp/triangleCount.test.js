/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const triangleCountModule = require('../../src/exp/triangleCount');

describe('FLEX exp.triangleCount Integration Tests', () => {
    let db, graph;

    // Start/Connect and Load FLEX
    beforeAll(async () => {
        const env = await initializeFLEX();
        db = env.db;
        graph = env.graph;
    });

    afterAll(async () => {
        if (db) {
            await db.close();
        }
    });

    test('flex.exp.triangleCount with a complete triangle', async () => {
        // Triangle: A-B, A-C, B-C
        // Node A has neighbors [B, C], B and C are connected
        const adjMap = '{ "A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B"] }';
        const q = `WITH flex.json.fromJsonMap(${JSON.stringify(adjMap)}) AS adj RETURN flex.exp.triangleCount(adj["A"], adj) AS tc`;
        const result = await graph.query(q);
        expect(result.data[0]['tc']).toBe(1);

        // Direct module test
        const adj = { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] };
        expect(triangleCountModule.triangleCount(['B', 'C'], adj)).toBe(1);
    });

    test('flex.exp.triangleCount with no triangles', async () => {
        // Star graph: A-B, A-C, A-D (no edges between B, C, D)
        const adjMap = '{ "A": ["B", "C", "D"], "B": ["A"], "C": ["A"], "D": ["A"] }';
        const q = `WITH flex.json.fromJsonMap(${JSON.stringify(adjMap)}) AS adj RETURN flex.exp.triangleCount(adj["A"], adj) AS tc`;
        const result = await graph.query(q);
        expect(result.data[0]['tc']).toBe(0);

        // Direct module test
        const adj = { A: ['B', 'C', 'D'], B: ['A'], C: ['A'], D: ['A'] };
        expect(triangleCountModule.triangleCount(['B', 'C', 'D'], adj)).toBe(0);
    });

    test('flex.exp.triangleCount with multiple triangles', async () => {
        // Complete graph K4: A-B-C-D all connected
        // Node A has neighbors [B, C, D]
        // Triangles through A: A-B-C, A-B-D, A-C-D = 3
        const adj = {
            A: ['B', 'C', 'D'],
            B: ['A', 'C', 'D'],
            C: ['A', 'B', 'D'],
            D: ['A', 'B', 'C']
        };

        expect(triangleCountModule.triangleCount(['B', 'C', 'D'], adj)).toBe(3);
    });

    test('flex.exp.triangleCount with numeric IDs', async () => {
        // Adjacency map with numeric IDs (keys are strings in maps)
        const adj = { '1': [2, 3], '2': [1, 3], '3': [1, 2] };
        expect(triangleCountModule.triangleCount([2, 3], adj)).toBe(1);
    });

    test('flex.exp.triangleCount with single or no neighbors', async () => {
        const adj = { A: ['B'], B: ['A'] };
        expect(triangleCountModule.triangleCount(['B'], adj)).toBe(0);
        expect(triangleCountModule.triangleCount([], adj)).toBe(0);
    });

    test('flex.exp.triangleCount handles invalid inputs', async () => {
        const q = `
        RETURN
            flex.exp.triangleCount(NULL, NULL) AS d1,
            flex.exp.triangleCount([1, 2], NULL) AS d2
        `;

        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(null);
        expect(result.data[0]['d2']).toBe(null);

        // Direct module tests
        expect(triangleCountModule.triangleCount(null, {})).toBe(null);
        expect(triangleCountModule.triangleCount([1, 2], null)).toBe(null);
        expect(triangleCountModule.triangleCount('not array', {})).toBe(null);
        expect(triangleCountModule.triangleCount([1, 2], 'not object')).toBe(null);
        expect(triangleCountModule.triangleCount([1, 2], [1, 2])).toBe(null);
    });

    test('flex.exp.triangleCount with partial adjacency map', async () => {
        // Neighbor C is not in the adjacency map — should not crash
        const adj = { A: ['B', 'C'], B: ['A', 'C'] };
        // A's neighbors are B and C. B's adjacency list has C, so triangle A-B-C exists.
        // But we also check C's adjacency for completeness — C is not in map.
        // Only the pair (B, C) is checked: B's list contains C → count = 1
        expect(triangleCountModule.triangleCount(['B', 'C'], adj)).toBe(1);
    });
});
