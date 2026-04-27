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

  test('flex.exp.pagerankv supports NetworkX-style personalization (subset keys + normalization)', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Directed 3-cycle. Without personalization, scores would be uniform.
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'})
      CREATE
        (a)-[:R {weight:1}]->(b),
        (b)-[:R {weight:1}]->(c),
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

    const aId = nameToId.get('a');

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.pagerankv({
        nodes: nodes,
        maxIterations: 300,
        tolerance: 1e-12,
        personalization: flex.map.fromPairs([['${aId}', 10]])
      }) AS res
    `);

    const res = out.data[0].res;
    const scores = res.scores;

    const a = scores[nameToId.get('a')];
    const b = scores[nameToId.get('b')];
    const c = scores[nameToId.get('c')];

    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);

    const sum = a + b + c;
    expect(sum).toBeGreaterThan(0.999);
    expect(sum).toBeLessThan(1.001);
  });

  test('flex.exp.pagerankv uses personalization for dangling redistribution by default', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Node b is dangling (no outgoing edges).
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'})
      CREATE (a)-[:R {weight:1}]->(b)
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

    const aId = nameToId.get('a');
    const bId = nameToId.get('b');

    const defaultDanglingOut = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.pagerankv({
        nodes: nodes,
        maxIterations: 300,
        tolerance: 1e-12,
        personalization: flex.map.fromPairs([['${aId}', 1]])
      }) AS res
    `);

    const defaultScores = defaultDanglingOut.data[0].res.scores;
    const aDefault = defaultScores[aId];
    const bDefault = defaultScores[bId];
    expect(aDefault).toBeGreaterThan(bDefault);

    const explicitDanglingOut = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.pagerankv({
        nodes: nodes,
        maxIterations: 300,
        tolerance: 1e-12,
        personalization: flex.map.fromPairs([['${aId}', 1]]),
        dangling: flex.map.fromPairs([['${bId}', 1]])
      }) AS res
    `);

    const explicitScores = explicitDanglingOut.data[0].res.scores;
    const aExplicit = explicitScores[aId];
    const bExplicit = explicitScores[bId];
    expect(bExplicit).toBeGreaterThan(aExplicit);
  });
});
