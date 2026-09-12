/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const ccModule = require('../../src/exp/clusteringCoefficient');

describe('FLEX exp.clusteringCoefficient Integration Tests', () => {
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

    test('flex.exp.clusteringCoefficient fully connected', async () => {
        // Node with degree 3, 3 triangles (K4 node) → 3 / C(3,2) = 3/3 = 1.0
        const q = `RETURN flex.exp.clusteringCoefficient(3, 3) AS cc`;
        const result = await graph.query(q);
        expect(result.data[0]['cc']).toBe(1);

        expect(ccModule.clusteringCoefficient(3, 3)).toBe(1);
    });

    test('flex.exp.clusteringCoefficient partial connectivity', async () => {
        // Node with degree 3, 1 triangle → 1 / C(3,2) = 1/3 ≈ 0.333
        const q = `RETURN flex.exp.clusteringCoefficient(1, 3) AS cc`;
        const result = await graph.query(q);
        expect(result.data[0]['cc']).toBeCloseTo(1 / 3, 10);

        expect(ccModule.clusteringCoefficient(1, 3)).toBeCloseTo(1 / 3, 10);
    });

    test('flex.exp.clusteringCoefficient no triangles', async () => {
        // Node with degree 3, 0 triangles → 0
        const q = `RETURN flex.exp.clusteringCoefficient(0, 3) AS cc`;
        const result = await graph.query(q);
        expect(result.data[0]['cc']).toBe(0);

        expect(ccModule.clusteringCoefficient(0, 3)).toBe(0);
    });

    test('flex.exp.clusteringCoefficient low degree returns 0', async () => {
        // Degree 0 or 1 can't form triangles
        const q = `
        RETURN
            flex.exp.clusteringCoefficient(0, 0) AS cc0,
            flex.exp.clusteringCoefficient(0, 1) AS cc1
        `;
        const result = await graph.query(q);
        expect(result.data[0]['cc0']).toBe(0);
        expect(result.data[0]['cc1']).toBe(0);

        expect(ccModule.clusteringCoefficient(0, 0)).toBe(0);
        expect(ccModule.clusteringCoefficient(0, 1)).toBe(0);
    });

    test('flex.exp.clusteringCoefficient handles invalid inputs', async () => {
        const q = `
        RETURN
            flex.exp.clusteringCoefficient(NULL, 3) AS d1,
            flex.exp.clusteringCoefficient(1, NULL) AS d2,
            flex.exp.clusteringCoefficient(NULL, NULL) AS d3
        `;

        const result = await graph.query(q);
        expect(result.data[0]['d1']).toBe(null);
        expect(result.data[0]['d2']).toBe(null);
        expect(result.data[0]['d3']).toBe(null);

        // Direct module tests
        expect(ccModule.clusteringCoefficient(null, 3)).toBe(null);
        expect(ccModule.clusteringCoefficient(1, null)).toBe(null);
        expect(ccModule.clusteringCoefficient(null, null)).toBe(null);
        expect(ccModule.clusteringCoefficient('not number', 3)).toBe(null);
        expect(ccModule.clusteringCoefficient(1, 'not number')).toBe(null);
    });

    test('flex.exp.clusteringCoefficient with degree 2', async () => {
        // Degree 2: max triangles = C(2,2) = 1
        // 1 triangle → coefficient = 1
        const q = `RETURN flex.exp.clusteringCoefficient(1, 2) AS cc`;
        const result = await graph.query(q);
        expect(result.data[0]['cc']).toBe(1);

        expect(ccModule.clusteringCoefficient(1, 2)).toBe(1);

        // 0 triangles → coefficient = 0
        expect(ccModule.clusteringCoefficient(0, 2)).toBe(0);
    });
});
