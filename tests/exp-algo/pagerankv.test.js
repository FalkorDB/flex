/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const pagerankvModule = require('../../src/exp-algo/pagerankv');

describe('FLEX exp-algo PageRankV Integration Tests', () => {
  let db, graph;

  beforeAll(async () => {
    const env = await initializeFLEX('exp_algo_pagerankv');
    db = env.db;
    graph = env.graph;
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('module is importable in Node (conditional export)', () => {
    expect(typeof pagerankvModule.pagerankv).toBe('function');
  });

  test('flex.exp.pagerankv considers edge weights (heavier link gives higher score)', async () => {
    // Make the test idempotent when re-run against the same local DB.
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Symmetric-ish graph, except A->B has much larger weight than A->C.
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'})
      CREATE
        (a)-[:R {weight:10}]->(b),
        (a)-[:R {weight:1}]->(c),
        (b)-[:R {weight:1}]->(a),
        (c)-[:R {weight:1}]->(a)
    `);

    const idRows = await graph.query(`
      MATCH (n:N)
      RETURN ID(n) AS id, n.name AS name
      ORDER BY id
    `);

    const nameToId = new Map();
    for (const row of idRows.data) {
      nameToId.set(row.name, String(row.id));
    }

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.pagerankv({nodes: nodes, maxIterations: 200, tolerance: 1e-12}) AS res
    `);

    const res = out.data[0].res;
    expect(res).toHaveProperty('scores');
    expect(res).toHaveProperty('iterations');
    expect(res).toHaveProperty('converged');

    const scores = res.scores;

    const a = scores[nameToId.get('a')];
    const b = scores[nameToId.get('b')];
    const c = scores[nameToId.get('c')];

    expect(typeof a).toBe('number');
    expect(typeof b).toBe('number');
    expect(typeof c).toBe('number');

    // Weight should push more rank from A to B than to C.
    expect(b).toBeGreaterThan(c);

    const sum = a + b + c;
    expect(sum).toBeGreaterThan(0.999);
    expect(sum).toBeLessThan(1.001);
  });
});
