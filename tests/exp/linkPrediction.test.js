/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const lpModule = require('../../src/exp/linkPrediction');

describe('FLEX Experimental Link Prediction Integration Tests', () => {
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

    // --- commonNeighbors ---

    test('flex.exp.commonNeighbors basic', async () => {
        const q = `RETURN flex.exp.commonNeighbors([1, 2, 3], [2, 3, 4]) AS score`;
        const result = await graph.query(q);
        expect(result.data[0]['score']).toBe(2);

        expect(lpModule.commonNeighbors([1, 2, 3], [2, 3, 4])).toBe(2);
        expect(lpModule.commonNeighbors([1, 2], [3, 4])).toBe(0);
        expect(lpModule.commonNeighbors([], [])).toBe(0);
        expect(lpModule.commonNeighbors([1, 1, 2], [1])).toBe(1);
    });

    test('flex.exp.commonNeighbors handles invalid inputs', async () => {
        const q = `
        RETURN
            flex.exp.commonNeighbors(NULL, [1, 2]) AS d1,
            flex.exp.commonNeighbors([1, 2], NULL) AS d2,
            flex.exp.commonNeighbors(NULL, NULL) AS d3
        `;
        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(null);
        expect(result.data[0]['d2']).toBe(null);
        expect(result.data[0]['d3']).toBe(null);

        expect(lpModule.commonNeighbors(null, [1])).toBe(null);
        expect(lpModule.commonNeighbors([1], null)).toBe(null);
        expect(lpModule.commonNeighbors('a', 'b')).toBe(null);
    });

    test('flex.exp.commonNeighbors symmetry', async () => {
        const q = `
        RETURN
            flex.exp.commonNeighbors([1, 2, 3], [3, 4, 5]) AS d1,
            flex.exp.commonNeighbors([3, 4, 5], [1, 2, 3]) AS d2
        `;
        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(result.data[0]['d2']);

        expect(lpModule.commonNeighbors([1, 2, 3], [3, 4, 5]))
            .toBe(lpModule.commonNeighbors([3, 4, 5], [1, 2, 3]));
    });

    // --- preferentialAttachment ---

    test('flex.exp.preferentialAttachment basic', async () => {
        const q = `RETURN flex.exp.preferentialAttachment([1, 2, 3], [4, 5]) AS score`;
        const result = await graph.query(q);
        expect(result.data[0]['score']).toBe(6);

        expect(lpModule.preferentialAttachment([1, 2, 3], [4, 5])).toBe(6);
        expect(lpModule.preferentialAttachment([], [1, 2])).toBe(0);
        expect(lpModule.preferentialAttachment([1], [2])).toBe(1);
    });

    test('flex.exp.preferentialAttachment handles invalid inputs', async () => {
        const q = `
        RETURN
            flex.exp.preferentialAttachment(NULL, [1]) AS d1,
            flex.exp.preferentialAttachment([1], NULL) AS d2
        `;
        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(null);
        expect(result.data[0]['d2']).toBe(null);

        expect(lpModule.preferentialAttachment(null, [1])).toBe(null);
        expect(lpModule.preferentialAttachment([1], 'x')).toBe(null);
    });

    // --- adamicAdar ---

    test('flex.exp.adamicAdar basic', async () => {
        // Common neighbor is 'b', degree of 'b' is 5
        // Expected: 1 / log(5) ≈ 0.6213
        const q = `RETURN flex.exp.adamicAdar(['a', 'b'], ['b', 'c'], {b: 5}) AS score`;
        const result = await graph.query(q);
        expect(result.data[0]['score']).toBeCloseTo(1 / Math.log(5), 10);

        expect(lpModule.adamicAdar(['a', 'b'], ['b', 'c'], {b: 5})).toBeCloseTo(1 / Math.log(5), 10);
    });

    test('flex.exp.adamicAdar multiple common neighbors', async () => {
        // Common neighbors: 2 (degree 4) and 3 (degree 10)
        const expected = 1 / Math.log(4) + 1 / Math.log(10);
        expect(lpModule.adamicAdar([1, 2, 3], [2, 3, 4], {2: 4, 3: 10})).toBeCloseTo(expected, 10);
    });

    test('flex.exp.adamicAdar degree 1 ignored', async () => {
        // Common neighbor 2 has degree 1 → log(1) = 0, so it's skipped
        expect(lpModule.adamicAdar([1, 2], [2, 3], {2: 1})).toBe(0);
    });

    test('flex.exp.adamicAdar no common neighbors', async () => {
        expect(lpModule.adamicAdar([1, 2], [3, 4], {1: 5, 2: 5, 3: 5, 4: 5})).toBe(0);
    });

    test('flex.exp.adamicAdar handles invalid inputs', async () => {
        const q = `
        RETURN
            flex.exp.adamicAdar(NULL, ['a'], {a: 2}) AS d1,
            flex.exp.adamicAdar(['a'], NULL, {a: 2}) AS d2,
            flex.exp.adamicAdar(['a'], ['a'], NULL) AS d3
        `;
        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(null);
        expect(result.data[0]['d2']).toBe(null);
        expect(result.data[0]['d3']).toBe(null);

        expect(lpModule.adamicAdar(null, [1], {1: 2})).toBe(null);
        expect(lpModule.adamicAdar([1], null, {1: 2})).toBe(null);
        expect(lpModule.adamicAdar([1], [1], null)).toBe(null);
        expect(lpModule.adamicAdar([1], [1], 'bad')).toBe(null);
    });

    // --- resourceAllocation ---

    test('flex.exp.resourceAllocation basic', async () => {
        // Common neighbor is 'b', degree of 'b' is 4
        // Expected: 1 / 4 = 0.25
        const q = `RETURN flex.exp.resourceAllocation(['a', 'b'], ['b', 'c'], {b: 4}) AS score`;
        const result = await graph.query(q);
        expect(result.data[0]['score']).toBeCloseTo(0.25, 10);

        expect(lpModule.resourceAllocation(['a', 'b'], ['b', 'c'], {b: 4})).toBeCloseTo(0.25, 10);
    });

    test('flex.exp.resourceAllocation multiple common neighbors', async () => {
        // Common neighbors: 2 (degree 4) and 3 (degree 5)
        const expected = 1 / 4 + 1 / 5;
        expect(lpModule.resourceAllocation([1, 2, 3], [2, 3, 4], {2: 4, 3: 5})).toBeCloseTo(expected, 10);
    });

    test('flex.exp.resourceAllocation no common neighbors', async () => {
        expect(lpModule.resourceAllocation([1, 2], [3, 4], {1: 5, 2: 5})).toBe(0);
    });

    test('flex.exp.resourceAllocation handles invalid inputs', async () => {
        const q = `
        RETURN
            flex.exp.resourceAllocation(NULL, ['a'], {a: 2}) AS d1,
            flex.exp.resourceAllocation(['a'], NULL, {a: 2}) AS d2,
            flex.exp.resourceAllocation(['a'], ['a'], NULL) AS d3
        `;
        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(null);
        expect(result.data[0]['d2']).toBe(null);
        expect(result.data[0]['d3']).toBe(null);

        expect(lpModule.resourceAllocation(null, [1], {1: 2})).toBe(null);
        expect(lpModule.resourceAllocation([1], null, {1: 2})).toBe(null);
        expect(lpModule.resourceAllocation([1], [1], null)).toBe(null);
    });
});
