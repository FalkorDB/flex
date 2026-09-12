/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const kcoreModule = require('../../src/exp/kcore');

describe('FLEX Experimental K-Core Integration Tests', () => {
    let db, graph;

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

    // --- coreNumber tests ---

    test('flex.exp.coreNumber basic triangle', async () => {
        // Triangle: 1-2, 2-3, 3-1  →  all nodes have core number 2
        const q = `RETURN flex.exp.coreNumber([[1,2],[2,3],[3,1]]) AS cn`;
        const result = await graph.query(q);
        expect(result.data[0]['cn']).toEqual([[1, 2], [2, 2], [3, 2]]);

        // Local module
        expect(kcoreModule.coreNumber([[1, 2], [2, 3], [3, 1]])).toEqual([
            [1, 2], [2, 2], [3, 2]
        ]);
    });

    test('flex.exp.coreNumber star graph', async () => {
        // Star: center 0 connected to 1,2,3  →  center core 1, leaves core 1
        const edges = [[0, 1], [0, 2], [0, 3]];
        const q = `RETURN flex.exp.coreNumber([[0,1],[0,2],[0,3]]) AS cn`;
        const result = await graph.query(q);
        expect(result.data[0]['cn']).toEqual([[0, 1], [1, 1], [2, 1], [3, 1]]);

        expect(kcoreModule.coreNumber(edges)).toEqual([
            [0, 1], [1, 1], [2, 1], [3, 1]
        ]);
    });

    test('flex.exp.coreNumber path graph', async () => {
        // Path: 1-2-3-4  →  endpoints core 1, middle nodes core 1
        const edges = [[1, 2], [2, 3], [3, 4]];
        const cn = kcoreModule.coreNumber(edges);
        // All nodes in a path have core number 1
        for (const pair of cn) {
            expect(pair[1]).toBe(1);
        }
    });

    test('flex.exp.coreNumber triangle plus pendant', async () => {
        // Triangle 1-2-3 with pendant 3-4
        // Nodes 1,2,3 form a 2-core; node 4 has core number 1
        const edges = [[1, 2], [2, 3], [3, 1], [3, 4]];
        const cn = kcoreModule.coreNumber(edges);
        const map = new Map(cn);

        expect(map.get(1)).toBe(2);
        expect(map.get(2)).toBe(2);
        expect(map.get(3)).toBe(2);
        expect(map.get(4)).toBe(1);
    });

    test('flex.exp.coreNumber complete graph K4', async () => {
        // K4: every node connected to every other → core number 3
        const edges = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
        const cn = kcoreModule.coreNumber(edges);
        for (const pair of cn) {
            expect(pair[1]).toBe(3);
        }
    });

    test('flex.exp.coreNumber disconnected components', async () => {
        // Two disconnected edges: 1-2 and 3-4
        const edges = [[1, 2], [3, 4]];
        const cn = kcoreModule.coreNumber(edges);
        const map = new Map(cn);

        expect(map.get(1)).toBe(1);
        expect(map.get(2)).toBe(1);
        expect(map.get(3)).toBe(1);
        expect(map.get(4)).toBe(1);
    });

    test('flex.exp.coreNumber handles self-loops', async () => {
        // Self-loops should be ignored
        const edges = [[1, 1], [1, 2], [2, 3], [3, 1]];
        const cn = kcoreModule.coreNumber(edges);
        const map = new Map(cn);

        expect(map.get(1)).toBe(2);
        expect(map.get(2)).toBe(2);
        expect(map.get(3)).toBe(2);
    });

    test('flex.exp.coreNumber handles duplicate edges', async () => {
        // Duplicate edges should not affect the result (adjacency uses Set)
        const edges = [[1, 2], [1, 2], [2, 3], [3, 1]];
        const cn = kcoreModule.coreNumber(edges);
        const map = new Map(cn);

        expect(map.get(1)).toBe(2);
        expect(map.get(2)).toBe(2);
        expect(map.get(3)).toBe(2);
    });

    test('flex.exp.coreNumber empty edges', async () => {
        const q = `RETURN flex.exp.coreNumber([]) AS cn`;
        const result = await graph.query(q);
        expect(result.data[0]['cn']).toEqual([]);

        expect(kcoreModule.coreNumber([])).toEqual([]);
    });

    test('flex.exp.coreNumber invalid input', async () => {
        const q = `RETURN flex.exp.coreNumber(NULL) AS cn`;
        const result = await graph.query(q);
        expect(result.data[0]['cn']).toBe(null);

        expect(kcoreModule.coreNumber(null)).toBe(null);
        expect(kcoreModule.coreNumber('not an array')).toBe(null);
        expect(kcoreModule.coreNumber(123)).toBe(null);
    });

    test('flex.exp.coreNumber with string node identifiers', async () => {
        const edges = [['a', 'b'], ['b', 'c'], ['c', 'a']];
        const cn = kcoreModule.coreNumber(edges);
        const map = new Map(cn);

        expect(map.get('a')).toBe(2);
        expect(map.get('b')).toBe(2);
        expect(map.get('c')).toBe(2);
    });

    // --- kcore tests ---

    test('flex.exp.kcore basic triangle', async () => {
        // Triangle 1-2-3: all in 2-core
        const q = `RETURN flex.exp.kcore([[1,2],[2,3],[3,1]], 2) AS nodes`;
        const result = await graph.query(q);
        const nodes = result.data[0]['nodes'];
        expect(nodes.sort()).toEqual([1, 2, 3]);

        expect(kcoreModule.kcore([[1, 2], [2, 3], [3, 1]], 2).sort()).toEqual([1, 2, 3]);
    });

    test('flex.exp.kcore triangle plus pendant', async () => {
        // Triangle 1-2-3 with pendant 3-4
        // 2-core: {1, 2, 3}, 1-core: {1, 2, 3, 4}
        const edges = [[1, 2], [2, 3], [3, 1], [3, 4]];

        expect(kcoreModule.kcore(edges, 2).sort()).toEqual([1, 2, 3]);
        expect(kcoreModule.kcore(edges, 1).sort()).toEqual([1, 2, 3, 4]);
        expect(kcoreModule.kcore(edges, 3)).toEqual([]);
    });

    test('flex.exp.kcore with k=0 returns all nodes', async () => {
        const edges = [[1, 2], [2, 3]];
        expect(kcoreModule.kcore(edges, 0).sort()).toEqual([1, 2, 3]);
    });

    test('flex.exp.kcore with high k returns empty', async () => {
        const edges = [[1, 2], [2, 3], [3, 1]];
        expect(kcoreModule.kcore(edges, 10)).toEqual([]);
    });

    test('flex.exp.kcore empty edges', async () => {
        expect(kcoreModule.kcore([], 1)).toEqual([]);
    });

    test('flex.exp.kcore invalid input', async () => {
        const q = `RETURN flex.exp.kcore(NULL, 1) AS nodes`;
        const result = await graph.query(q);
        expect(result.data[0]['nodes']).toBe(null);

        expect(kcoreModule.kcore(null, 1)).toBe(null);
        expect(kcoreModule.kcore([[1, 2]], -1)).toBe(null);
        expect(kcoreModule.kcore([[1, 2]], 'abc')).toBe(null);
        expect(kcoreModule.kcore('not an array', 1)).toBe(null);
    });
});
