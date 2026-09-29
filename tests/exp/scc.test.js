/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const sccModule = require('../../src/exp/scc');

/**
 * Helper: sort each component internally, then sort the list of components
 * so that test assertions are order-independent.
 */
function sortComponents(components) {
    return components
        .map(c => [...c].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)))
        .sort((a, b) => {
            const minA = a[0];
            const minB = b[0];
            return minA < minB ? -1 : minA > minB ? 1 : 0;
        });
}

describe('FLEX exp.scc Integration Tests', () => {
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

    test('flex.exp.scc simple cycle', async () => {
        // A -> B -> C -> A  (one SCC with all three nodes)
        const q = `RETURN flex.exp.scc([['A','B'],['B','C'],['C','A']]) AS components`;
        const result = await graph.query(q);
        const components = sortComponents(result.data[0]['components']);
        expect(components).toEqual([['A', 'B', 'C']]);

        const local = sortComponents(sccModule.scc([['A','B'],['B','C'],['C','A']]));
        expect(local).toEqual([['A', 'B', 'C']]);
    });

    test('flex.exp.scc two separate SCCs', async () => {
        // Cycle 1: A -> B -> A
        // Cycle 2: C -> D -> C
        // Bridge:  B -> C  (not mutual, so no merge)
        const q = `RETURN flex.exp.scc([['A','B'],['B','A'],['B','C'],['C','D'],['D','C']]) AS components`;
        const result = await graph.query(q);
        const components = sortComponents(result.data[0]['components']);
        expect(components).toEqual([['A', 'B'], ['C', 'D']]);

        const local = sortComponents(
            sccModule.scc([['A','B'],['B','A'],['B','C'],['C','D'],['D','C']])
        );
        expect(local).toEqual([['A', 'B'], ['C', 'D']]);
    });

    test('flex.exp.scc DAG returns singleton components', async () => {
        // A -> B -> C  (no cycles — each node is its own SCC)
        const q = `RETURN flex.exp.scc([['A','B'],['B','C']]) AS components`;
        const result = await graph.query(q);
        const components = sortComponents(result.data[0]['components']);
        expect(components).toEqual([['A'], ['B'], ['C']]);

        const local = sortComponents(sccModule.scc([['A','B'],['B','C']]));
        expect(local).toEqual([['A'], ['B'], ['C']]);
    });

    test('flex.exp.scc empty edge list returns empty', async () => {
        const q = `RETURN flex.exp.scc([]) AS components`;
        const result = await graph.query(q);
        expect(result.data[0]['components']).toEqual([]);

        expect(sccModule.scc([])).toEqual([]);
    });

    test('flex.exp.scc null input returns empty', async () => {
        const q = `RETURN flex.exp.scc(NULL) AS components`;
        const result = await graph.query(q);
        expect(result.data[0]['components']).toEqual([]);

        expect(sccModule.scc(null)).toEqual([]);
    });

    test('flex.exp.scc single self-loop', async () => {
        const q = `RETURN flex.exp.scc([['A','A']]) AS components`;
        const result = await graph.query(q);
        const components = sortComponents(result.data[0]['components']);
        expect(components).toEqual([['A']]);

        const local = sortComponents(sccModule.scc([['A','A']]));
        expect(local).toEqual([['A']]);
    });

    test('flex.exp.scc with numeric node identifiers', async () => {
        // 1 -> 2 -> 3 -> 1  (one SCC)
        const q = `RETURN flex.exp.scc([[1,2],[2,3],[3,1]]) AS components`;
        const result = await graph.query(q);
        const components = sortComponents(result.data[0]['components']);
        expect(components).toEqual([[1, 2, 3]]);

        const local = sortComponents(sccModule.scc([[1,2],[2,3],[3,1]]));
        expect(local).toEqual([[1, 2, 3]]);
    });

    test('flex.exp.scc ignores malformed edges', async () => {
        // Valid cycle plus some invalid edge entries
        const local = sortComponents(sccModule.scc([['A','B'],['B','A'], 'bad', [1], null]));
        expect(local).toEqual([['A', 'B']]);
    });
});
