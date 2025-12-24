/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');

describe('FLEX Bitwise Module Integration Tests', () => {
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

    // Test Bitwise AND
    test('flex.bitwise.and', async () => {
        // 12 (1100) & 10 (1010) = 8 (1000)
        const query = "RETURN flex.bitwise.and(12, 10) AS res";
        const result = await graph.query(query);
        expect(result.data[0]['res']).toBe(8);
    });

    // Test Bitwise OR
    test('flex.bitwise.or', async () => {
        // 12 (1100) | 10 (1010) = 14 (1110)
        const query = "RETURN flex.bitwise.or(12, 10) AS res";
        const result = await graph.query(query);
        expect(result.data[0]['res']).toBe(14);
    });

    // Test Bitwise XOR
    test('flex.bitwise.xor', async () => {
        // 12 (1100) ^ 10 (1010) = 6 (0110)
        const query = "RETURN flex.bitwise.xor(12, 10) AS res";
        const result = await graph.query(query);
        expect(result.data[0]['res']).toBe(6);
    });

    // Test Bitwise NOT
    test('flex.bitwise.not', async () => {
        // ~15 = -16 (Two's complement inversion)
        const query = "RETURN flex.bitwise.not(15) AS res";
        const result = await graph.query(query);
        expect(result.data[0]['res']).toBe(-16);
    });

    // Test Bitwise Shift Left
    test('flex.bitwise.shiftLeft', async () => {
        // 5 (101) << 2 = 20 (10100)
        const query = "RETURN flex.bitwise.shiftLeft(5, 2) AS res";
        const result = await graph.query(query);
        expect(result.data[0]['res']).toBe(20);
    });

    // Test Bitwise Shift Right
    test('flex.bitwise.shiftRight', async () => {
        // 20 (10100) >> 2 = 5 (101)
        const query = "RETURN flex.bitwise.shiftRight(20, 2) AS res";
        const result = await graph.query(query);
        expect(result.data[0]['res']).toBe(5);
    });
});
