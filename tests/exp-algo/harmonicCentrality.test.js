/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const harmonicModule = require('../../src/exp-algo/harmonicCentrality');

describe('FLEX exp-algo Harmonic Centrality Integration Tests', () => {
  let db, graph;

  beforeAll(async () => {
    const env = await initializeFLEX('exp_algo_harmonic_centrality');
    db = env.db;
    graph = env.graph;
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('module is importable in Node (conditional export)', () => {
    expect(typeof harmonicModule.harmonicCentrality).toBe('function');
    expect(typeof harmonicModule._flex_bfsDistances).toBe('function');
  });

  test('flex.exp.harmonicCentrality on a connected line graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Line graph: a -- b -- c -- d
    // Distances from a: b=1, c=2, d=3  => H(a) = 1/1 + 1/2 + 1/3 = 11/6
    // Distances from b: a=1, c=1, d=2  => H(b) = 1/1 + 1/1 + 1/2 = 5/2
    // Distances from c: a=2, b=1, d=1  => H(c) = 1/2 + 1/1 + 1/1 = 5/2
    // Distances from d: a=3, b=2, c=1  => H(d) = 1/3 + 1/2 + 1/1 = 11/6
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'}), (d:N {name:'d'})
      CREATE
        (a)-[:R]->(b),
        (b)-[:R]->(c),
        (c)-[:R]->(d)
    `);

    const idRows = await graph.query(`
      MATCH (n:N)
      RETURN ID(n) AS id, n.name AS name
      ORDER BY id
    `);

    const idToName = new Map();
    for (const row of idRows.data) {
      idToName.set(String(row.id), row.name);
    }

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.harmonicCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res).toHaveProperty('harmonic');
    expect(res).toHaveProperty('normalized');
    expect(res.n).toBe(4);

    const hByName = Object.create(null);
    const normByName = Object.create(null);

    for (const [id, h] of Object.entries(res.harmonic)) {
      hByName[idToName.get(String(id))] = h;
    }
    for (const [id, v] of Object.entries(res.normalized)) {
      normByName[idToName.get(String(id))] = v;
    }

    // H(a) = 1 + 0.5 + 1/3 = 11/6 ≈ 1.8333
    expect(hByName.a).toBeCloseTo(11 / 6, 8);
    // H(b) = 1 + 1 + 0.5 = 5/2 = 2.5
    expect(hByName.b).toBeCloseTo(5 / 2, 8);
    // H(c) = 0.5 + 1 + 1 = 5/2 = 2.5
    expect(hByName.c).toBeCloseTo(5 / 2, 8);
    // H(d) = 1/3 + 0.5 + 1 = 11/6 ≈ 1.8333
    expect(hByName.d).toBeCloseTo(11 / 6, 8);

    // normalized = H / (n-1) = H / 3
    expect(normByName.a).toBeCloseTo(11 / 18, 8);
    expect(normByName.b).toBeCloseTo(5 / 6, 8);
    expect(normByName.c).toBeCloseTo(5 / 6, 8);
    expect(normByName.d).toBeCloseTo(11 / 18, 8);
  });

  test('flex.exp.harmonicCentrality on a disconnected graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Two disconnected components: {a -- b} and {c -- d}
    // H(a) = 1/1 + 0 + 0 = 1  (b reachable at dist 1; c,d unreachable)
    // H(b) = 1/1 + 0 + 0 = 1
    // H(c) = 0 + 0 + 1/1 = 1
    // H(d) = 0 + 0 + 1/1 = 1
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'}), (d:N {name:'d'})
      CREATE
        (a)-[:R]->(b),
        (c)-[:R]->(d)
    `);

    const idRows = await graph.query(`
      MATCH (n:N)
      RETURN ID(n) AS id, n.name AS name
      ORDER BY id
    `);

    const idToName = new Map();
    for (const row of idRows.data) {
      idToName.set(String(row.id), row.name);
    }

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.harmonicCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res.n).toBe(4);

    const hByName = Object.create(null);

    for (const [id, h] of Object.entries(res.harmonic)) {
      hByName[idToName.get(String(id))] = h;
    }

    expect(hByName.a).toBeCloseTo(1, 8);
    expect(hByName.b).toBeCloseTo(1, 8);
    expect(hByName.c).toBeCloseTo(1, 8);
    expect(hByName.d).toBeCloseTo(1, 8);
  });

  test('flex.exp.harmonicCentrality star graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Star graph: center connected to a, b, c
    // H(center) = 1/1 + 1/1 + 1/1 = 3
    // H(a)      = 1/1 + 1/2 + 1/2 = 2
    await graph.query(`
      CREATE (center:N {name:'center'}), (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'})
      CREATE
        (center)-[:R]->(a),
        (center)-[:R]->(b),
        (center)-[:R]->(c)
    `);

    const idRows = await graph.query(`
      MATCH (n:N)
      RETURN ID(n) AS id, n.name AS name
      ORDER BY id
    `);

    const idToName = new Map();
    for (const row of idRows.data) {
      idToName.set(String(row.id), row.name);
    }

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.harmonicCentrality({nodes: nodes, normalized: false}) AS res
    `);

    const res = out.data[0].res;
    expect(res).not.toHaveProperty('normalized');

    const hByName = Object.create(null);
    for (const [id, h] of Object.entries(res.harmonic)) {
      hByName[idToName.get(String(id))] = h;
    }

    expect(hByName.center).toBeCloseTo(3, 8);
    expect(hByName.a).toBeCloseTo(2, 8);
    expect(hByName.b).toBeCloseTo(2, 8);
    expect(hByName.c).toBeCloseTo(2, 8);
  });

  test('single node graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    await graph.query(`CREATE (a:N {name:'a'})`);

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.harmonicCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res.n).toBe(1);

    const values = Object.values(res.harmonic);
    expect(values.length).toBe(1);
    expect(values[0]).toBe(0);

    const normValues = Object.values(res.normalized);
    expect(normValues.length).toBe(1);
    expect(normValues[0]).toBe(0);
  });
});
