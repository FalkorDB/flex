/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const { bridges } = require('../../src/exp/bridges');

describe('FLEX Bridges Integration Tests', () => {
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

    test('flex.exp.bridges finds bridge edges in a simple graph', async () => {
        // Graph: A -- B -- C (both edges are bridges)
        const q = `RETURN flex.exp.bridges({A: ['B'], B: ['A', 'C'], C: ['B']}) AS br`;
        const result = await graph.query(q);
        const br = result.data[0]['br'].map(e => e.sort()).sort();
        expect(br).toEqual([['A', 'B'], ['B', 'C']]);

        // Local module test
        const localBr = bridges({A: ['B'], B: ['A', 'C'], C: ['B']});
        const sorted = localBr.map(e => e.sort()).sort();
        expect(sorted).toEqual([['A', 'B'], ['B', 'C']]);
    });

    test('flex.exp.bridges returns empty for a cycle', async () => {
        // Triangle: no bridges
        const adj = {
            A: ['B', 'C'],
            B: ['A', 'C'],
            C: ['A', 'B']
        };
        const q = `RETURN flex.exp.bridges({A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B']}) AS br`;
        const result = await graph.query(q);
        expect(result.data[0]['br']).toEqual([]);

        // Local module test
        expect(bridges(adj)).toEqual([]);
    });

    test('flex.exp.bridges finds bridge in mixed graph', async () => {
        // Graph:  a -- b -- d -- e
        //          \  /
        //           c
        // Bridge: b-d and d-e
        const q = `RETURN flex.exp.bridges({
            a: ['b', 'c'],
            b: ['a', 'c', 'd'],
            c: ['a', 'b'],
            d: ['b', 'e'],
            e: ['d']
        }) AS br`;
        const result = await graph.query(q);
        const br = result.data[0]['br'].map(e => e.sort()).sort();
        expect(br).toEqual([['b', 'd'], ['d', 'e']]);

        // Local module test with numeric keys
        const adj = {
            '0': ['1', '2'],
            '1': ['0', '2', '3'],
            '2': ['0', '1'],
            '3': ['1', '4'],
            '4': ['3']
        };
        const localBr = bridges(adj).map(e => e.sort()).sort();
        expect(localBr).toEqual([['1', '3'], ['3', '4']]);
    });

    test('flex.exp.bridges handles single node', async () => {
        const q = `RETURN flex.exp.bridges({A: []}) AS br`;
        const result = await graph.query(q);
        expect(result.data[0]['br']).toEqual([]);

        // Local module test
        expect(bridges({ A: [] })).toEqual([]);
    });

    test('flex.exp.bridges handles empty graph', async () => {
        const q = `RETURN flex.exp.bridges({}) AS br`;
        const result = await graph.query(q);
        expect(result.data[0]['br']).toEqual([]);

        // Local module test
        expect(bridges({})).toEqual([]);
    });

    test('flex.exp.bridges handles invalid inputs', async () => {
        const q = `RETURN flex.exp.bridges(NULL) AS br`;
        const result = await graph.query(q);
        expect(result.data[0]['br']).toBe(null);

        // Local module tests
        expect(bridges(null)).toBe(null);
        expect(bridges(undefined)).toBe(null);
        expect(bridges([1, 2])).toBe(null);
        expect(bridges('not a map')).toBe(null);
        expect(bridges(123)).toBe(null);
        expect(bridges({ A: 'not array' })).toBe(null);
    });

    test('flex.exp.bridges handles disconnected graph', async () => {
        // Two components: A--B and C--D (all edges are bridges)
        const adj = {
            A: ['B'],
            B: ['A'],
            C: ['D'],
            D: ['C']
        };
        const localBr = bridges(adj).map(e => e.sort()).sort();
        expect(localBr).toEqual([['A', 'B'], ['C', 'D']]);
    });
});
