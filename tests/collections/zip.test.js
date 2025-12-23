const { initializeFLEX } = require('../setup');

describe('FLEX coll.zip Integration Tests', () => {
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

    test('flex.coll.zip basic lists', async () => {
        const q = `
        RETURN flex.coll.zip([1, 2, 3], ['a', 'b', 'c']) AS zipped
        `;
        const result = await graph.query(q);
        expect(result.data[0]['zipped']).toEqual([[1,'a'], [2,'b'], [3,'c']]);
    });

    test('flex.coll.zip stops at shorter list', async () => {
        const q = `
        RETURN flex.coll.zip([1, 2, 3], ['x', 'y']) AS zipped
        `;
        const result = await graph.query(q);
        expect(result.data[0]['zipped']).toEqual([[1,'x'], [2,'y']]);
    });

    test('flex.coll.zip handles null elements inside lists', async () => {
        const q = `
        RETURN flex.coll.zip([1, null, 3], ['a', 'b', null]) AS zipped
        `;
        const result = await graph.query(q);
        expect(result.data[0]['zipped']).toEqual([[1,'a'], [null,'b'], [3,null]]);
    });

    test('flex.coll.zip returns empty list if any input is NULL', async () => {
        const q = `
        RETURN flex.coll.zip(NULL, [1,2,3]) AS zipped,
               flex.coll.zip([1,2,3], NULL) AS zipped2
        `;
        const result = await graph.query(q);
        expect(result.data[0]['zipped']).toEqual([]);
        expect(result.data[0]['zipped2']).toEqual([]);
    });

    test('flex.coll.zip empty lists', async () => {
        const q = `
        RETURN flex.coll.zip([], []) AS zipped
        `;
        const result = await graph.query(q);
        expect(result.data[0]['zipped']).toEqual([]);
    });
});

