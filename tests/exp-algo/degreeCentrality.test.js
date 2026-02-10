/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const degreeModule = require('../../src/exp-algo/degreeCentrality');

describe('FLEX exp-algo Degree Centrality Integration Tests', () => {
  let db, graph;

  beforeAll(async () => {
    const env = await initializeFLEX('exp_algo_degree_centrality');
    db = env.db;
    graph = env.graph;
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('module is importable in Node (conditional export)', () => {
    expect(typeof degreeModule.degreeCentrality).toBe('function');
  });

  test('flex.exp.degreeCentrality computes degree/normalized degree on a small graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Graph (directed edges, but algorithm treats as undirected):
    // a -- b
    // a -- c
    // b -- c
    // c -- d
    // Degrees: a=2, b=2, c=3, d=1
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'}), (d:N {name:'d'})
      CREATE
        (a)-[:R]->(b),
        (a)-[:R]->(c),
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
      RETURN flex.exp.degreeCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res).toHaveProperty('degree');
    expect(res).toHaveProperty('normalized');
    expect(res.n).toBe(4);

    const degByName = Object.create(null);
    const normByName = Object.create(null);

    for (const [id, deg] of Object.entries(res.degree)) {
      const name = idToName.get(String(id));
      degByName[name] = deg;
    }

    for (const [id, v] of Object.entries(res.normalized)) {
      const name = idToName.get(String(id));
      normByName[name] = v;
    }

    expect(degByName).toEqual({ a: 2, b: 2, c: 3, d: 1 });

    // normalized = degree / (n-1) = degree / 3
    expect(normByName.a).toBeCloseTo(2 / 3, 8);
    expect(normByName.b).toBeCloseTo(2 / 3, 8);
    expect(normByName.c).toBeCloseTo(1, 8);
    expect(normByName.d).toBeCloseTo(1 / 3, 8);
  });

  test('weightedDegree uses relationship weight when present', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // a -- b (w=2)
    // a -- c (w=5)
    // weightedDegree(a) = 7
    await graph.query(`
      CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'})
      CREATE
        (a)-[:R {weight:2}]->(b),
        (a)-[:R {weight:5}]->(c)
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
      RETURN flex.exp.degreeCentrality({nodes: nodes, normalized: false}) AS res
    `);

    const res = out.data[0].res;
    expect(res).toHaveProperty('weightedDegree');
    expect(res).not.toHaveProperty('normalized');

    const wdegByName = Object.create(null);
    for (const [id, wdeg] of Object.entries(res.weightedDegree)) {
      const name = idToName.get(String(id));
      wdegByName[name] = wdeg;
    }

    expect(wdegByName.a).toBe(7);
    expect(wdegByName.b).toBe(2);
    expect(wdegByName.c).toBe(5);
  });
});
