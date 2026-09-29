/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const { articulationPoints } = require('../../src/exp/articulationPoints');

describe('FLEX Articulation Points Integration Tests', () => {
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

    test('flex.exp.articulationPoints finds cut vertices in a simple graph', async () => {
        // Graph: A -- B -- C (B is the only articulation point)
        const q = `RETURN flex.exp.articulationPoints({A: ['B'], B: ['A', 'C'], C: ['B']}) AS ap`;
        const result = await graph.query(q);
        expect(result.data[0]['ap'].sort()).toEqual(['B']);

        // Local module test
        const ap = articulationPoints({A: ['B'], B: ['A', 'C'], C: ['B']});
        expect(ap.sort()).toEqual(['B']);
    });

    test('flex.exp.articulationPoints finds multiple articulation points', async () => {
        // Graph:  a -- b -- d -- e
        //          \  /
        //           c
        // Node b and d are articulation points
        const q = `RETURN flex.exp.articulationPoints({
            a: ['b', 'c'],
            b: ['a', 'c', 'd'],
            c: ['a', 'b'],
            d: ['b', 'e'],
            e: ['d']
        }) AS ap`;
        const result = await graph.query(q);
        expect(result.data[0]['ap'].sort()).toEqual(['b', 'd']);

        // Local module test with numeric keys
        const adj = {
            '0': ['1', '2'],
            '1': ['0', '2', '3'],
            '2': ['0', '1'],
            '3': ['1', '4'],
            '4': ['3']
        };
        const ap = articulationPoints(adj);
        expect(ap.sort()).toEqual(['1', '3']);
    });

    test('flex.exp.articulationPoints returns empty for a complete graph', async () => {
        // Triangle: no articulation points
        const adj = {
            A: ['B', 'C'],
            B: ['A', 'C'],
            C: ['A', 'B']
        };
        const q = `RETURN flex.exp.articulationPoints({A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B']}) AS ap`;
        const result = await graph.query(q);
        expect(result.data[0]['ap']).toEqual([]);

        // Local module test
        expect(articulationPoints(adj)).toEqual([]);
    });

    test('flex.exp.articulationPoints handles single node', async () => {
        const adj = { A: [] };
        const q = `RETURN flex.exp.articulationPoints({A: []}) AS ap`;
        const result = await graph.query(q);
        expect(result.data[0]['ap']).toEqual([]);

        // Local module test
        expect(articulationPoints(adj)).toEqual([]);
    });

    test('flex.exp.articulationPoints handles empty graph', async () => {
        const q = `RETURN flex.exp.articulationPoints({}) AS ap`;
        const result = await graph.query(q);
        expect(result.data[0]['ap']).toEqual([]);

        // Local module test
        expect(articulationPoints({})).toEqual([]);
    });

    test('flex.exp.articulationPoints handles invalid inputs', async () => {
        const q = `RETURN flex.exp.articulationPoints(NULL) AS ap`;
        const result = await graph.query(q);
        expect(result.data[0]['ap']).toBe(null);

        // Local module tests
        expect(articulationPoints(null)).toBe(null);
        expect(articulationPoints(undefined)).toBe(null);
        expect(articulationPoints([1, 2])).toBe(null);
        expect(articulationPoints('not a map')).toBe(null);
        expect(articulationPoints(123)).toBe(null);
        expect(articulationPoints({ A: 'not array' })).toBe(null);
    });

    test('flex.exp.articulationPoints handles disconnected graph', async () => {
        // Two components: A--B and C--D--E (D is articulation point in its component)
        const adj = {
            A: ['B'],
            B: ['A'],
            C: ['D'],
            D: ['C', 'E'],
            E: ['D']
        };
        const ap = articulationPoints(adj);
        expect(ap.sort()).toEqual(['D']);
    });
});
