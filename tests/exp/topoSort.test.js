/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const { topoSort, hasCycle } = require('../../src/exp/topoSort');

describe('FLEX Experimental topoSort & hasCycle Integration Tests', () => {
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

    // --- topoSort tests ---

    test('flex.exp.topoSort - linear chain', async () => {
        const edges = [['a', 'b'], ['b', 'c'], ['c', 'd']];
        const query = "RETURN flex.exp.topoSort([['a','b'],['b','c'],['c','d']]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toEqual(['a', 'b', 'c', 'd']);
        expect(topoSort(edges)).toEqual(['a', 'b', 'c', 'd']);
    });

    test('flex.exp.topoSort - diamond DAG', async () => {
        const edges = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']];
        const query = "RETURN flex.exp.topoSort([['a','b'],['a','c'],['b','d'],['c','d']]) AS result";
        const result = await graph.query(query);
        const sorted = result.data[0]['result'];
        // 'a' must come before 'b' and 'c'; 'b' and 'c' must come before 'd'
        expect(sorted.indexOf('a')).toBeLessThan(sorted.indexOf('b'));
        expect(sorted.indexOf('a')).toBeLessThan(sorted.indexOf('c'));
        expect(sorted.indexOf('b')).toBeLessThan(sorted.indexOf('d'));
        expect(sorted.indexOf('c')).toBeLessThan(sorted.indexOf('d'));

        const local = topoSort(edges);
        expect(local.indexOf('a')).toBeLessThan(local.indexOf('b'));
        expect(local.indexOf('a')).toBeLessThan(local.indexOf('c'));
        expect(local.indexOf('b')).toBeLessThan(local.indexOf('d'));
        expect(local.indexOf('c')).toBeLessThan(local.indexOf('d'));
    });

    test('flex.exp.topoSort - returns null on cycle', async () => {
        const edges = [['a', 'b'], ['b', 'c'], ['c', 'a']];
        const query = "RETURN flex.exp.topoSort([['a','b'],['b','c'],['c','a']]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toBeNull();
        expect(topoSort(edges)).toBeNull();
    });

    test('flex.exp.topoSort - single edge', async () => {
        const edges = [['x', 'y']];
        const query = "RETURN flex.exp.topoSort([['x','y']]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toEqual(['x', 'y']);
        expect(topoSort(edges)).toEqual(['x', 'y']);
    });

    test('flex.exp.topoSort - empty edge list', async () => {
        const query = "RETURN flex.exp.topoSort([]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toEqual([]);
        expect(topoSort([])).toEqual([]);
    });

    test('flex.exp.topoSort - invalid input', () => {
        expect(topoSort(null)).toBeNull();
        expect(topoSort('not an array')).toBeNull();
        expect(topoSort([['a']])).toBeNull();
    });

    test('flex.exp.topoSort - dependency graph example', () => {
        // build → compile → link → deploy
        //           ↑
        //         test ──→ deploy
        const edges = [
            ['build', 'compile'],
            ['compile', 'link'],
            ['link', 'deploy'],
            ['test', 'compile'],
            ['test', 'deploy']
        ];
        const result = topoSort(edges);
        expect(result).not.toBeNull();
        expect(result.indexOf('build')).toBeLessThan(result.indexOf('compile'));
        expect(result.indexOf('test')).toBeLessThan(result.indexOf('compile'));
        expect(result.indexOf('compile')).toBeLessThan(result.indexOf('link'));
        expect(result.indexOf('link')).toBeLessThan(result.indexOf('deploy'));
        expect(result.indexOf('test')).toBeLessThan(result.indexOf('deploy'));
    });

    // --- hasCycle tests ---

    test('flex.exp.hasCycle - no cycle', async () => {
        const edges = [['a', 'b'], ['b', 'c']];
        const query = "RETURN flex.exp.hasCycle([['a','b'],['b','c']]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toBe(false);
        expect(hasCycle(edges)).toBe(false);
    });

    test('flex.exp.hasCycle - has cycle', async () => {
        const edges = [['a', 'b'], ['b', 'c'], ['c', 'a']];
        const query = "RETURN flex.exp.hasCycle([['a','b'],['b','c'],['c','a']]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toBe(true);
        expect(hasCycle(edges)).toBe(true);
    });

    test('flex.exp.hasCycle - self loop', async () => {
        const edges = [['a', 'a']];
        const query = "RETURN flex.exp.hasCycle([['a','a']]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toBe(true);
        expect(hasCycle(edges)).toBe(true);
    });

    test('flex.exp.hasCycle - empty graph', async () => {
        const query = "RETURN flex.exp.hasCycle([]) AS result";
        const result = await graph.query(query);
        expect(result.data[0]['result']).toBe(false);
        expect(hasCycle([])).toBe(false);
    });

    test('flex.exp.hasCycle - invalid input returns false', () => {
        expect(hasCycle(null)).toBe(false);
        expect(hasCycle('not an array')).toBe(false);
    });
});
