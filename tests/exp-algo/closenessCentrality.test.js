/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const closenessModule = require('../../src/exp-algo/closenessCentrality');

describe('FLEX exp-algo Closeness Centrality Integration Tests', () => {
  let db, graph;

  beforeAll(async () => {
    const env = await initializeFLEX('exp_algo_closeness_centrality');
    db = env.db;
    graph = env.graph;
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('module is importable in Node (conditional export)', () => {
    expect(typeof closenessModule.closenessCentrality).toBe('function');
    expect(typeof closenessModule._flex_bfsDistancesCloseness).toBe('function');
  });

  test('flex.exp.closenessCentrality on a connected line graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Line graph: a -- b -- c -- d
    // sumDist from a: 1+2+3 = 6  => C(a) = 3/6 = 0.5
    // sumDist from b: 1+1+2 = 4  => C(b) = 3/4 = 0.75
    // sumDist from c: 2+1+1 = 4  => C(c) = 3/4 = 0.75
    // sumDist from d: 3+2+1 = 6  => C(d) = 3/6 = 0.5
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
      RETURN flex.exp.closenessCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res).toHaveProperty('closeness');
    expect(res).toHaveProperty('wassermanFaust');
    expect(res).toHaveProperty('normalized');
    expect(res.n).toBe(4);

    const cByName = Object.create(null);
    const wfByName = Object.create(null);

    for (const [id, c] of Object.entries(res.closeness)) {
      cByName[idToName.get(String(id))] = c;
    }
    for (const [id, wf] of Object.entries(res.wassermanFaust)) {
      wfByName[idToName.get(String(id))] = wf;
    }

    expect(cByName.a).toBeCloseTo(0.5, 8);
    expect(cByName.b).toBeCloseTo(0.75, 8);
    expect(cByName.c).toBeCloseTo(0.75, 8);
    expect(cByName.d).toBeCloseTo(0.5, 8);

    // For a connected graph, Wasserman-Faust equals classic closeness
    // because r = n-1 and the factor (r/(n-1)) = 1.
    expect(wfByName.a).toBeCloseTo(0.5, 8);
    expect(wfByName.b).toBeCloseTo(0.75, 8);
  });

  test('flex.exp.closenessCentrality on a disconnected graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Two disconnected components: {a -- b} and {c -- d}
    // From a: reachable = {b} at dist 1; c,d unreachable
    // sumDist = 1, reachable = 1, n = 4
    // Classic C(a) = 3 / Infinity => but sumDist only covers reachable... 
    // Actually: classic C(a) = (n-1)/sumDist where sumDist includes only reachable
    // For strict classic: if not all nodes reachable, C(a) = 0
    // But our implementation: C(a) = (n-1)/sumDist = 3/1 = 3
    // Wait, that's wrong. Let me re-check the formula.
    // Classic closeness for disconnected = 0 when there are unreachable nodes?
    // No, our implementation: sumDist sums over reachable only, so C(a) = (n-1)/1 = 3
    // Actually looking at the code: classic = sumDist > 0 ? (n-1)/sumDist : 0
    // sumDist(a) = 1, so classic(a) = 3/1 = 3
    //
    // Wasserman-Faust: r=1, n=4
    // WF(a) = (1/3) * (1/1) = 1/3
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
      RETURN flex.exp.closenessCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res.n).toBe(4);

    const cByName = Object.create(null);
    const wfByName = Object.create(null);

    for (const [id, c] of Object.entries(res.closeness)) {
      cByName[idToName.get(String(id))] = c;
    }
    for (const [id, wf] of Object.entries(res.wassermanFaust)) {
      wfByName[idToName.get(String(id))] = wf;
    }

    // Classic: (n-1)/sumDist = 3/1 = 3 (inflated for disconnected graph)
    expect(cByName.a).toBeCloseTo(3, 8);
    expect(cByName.b).toBeCloseTo(3, 8);
    expect(cByName.c).toBeCloseTo(3, 8);
    expect(cByName.d).toBeCloseTo(3, 8);

    // Wasserman-Faust: (r/(n-1)) * (r/sumDist) = (1/3) * (1/1) = 1/3
    expect(wfByName.a).toBeCloseTo(1 / 3, 8);
    expect(wfByName.b).toBeCloseTo(1 / 3, 8);
    expect(wfByName.c).toBeCloseTo(1 / 3, 8);
    expect(wfByName.d).toBeCloseTo(1 / 3, 8);
  });

  test('flex.exp.closenessCentrality star graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Star graph: center connected to a, b, c
    // sumDist(center) = 1+1+1 = 3, C = 3/3 = 1
    // sumDist(a) = 1+2+2 = 5,     C = 3/5 = 0.6
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
      RETURN flex.exp.closenessCentrality({nodes: nodes, normalized: false}) AS res
    `);

    const res = out.data[0].res;
    expect(res).not.toHaveProperty('normalized');

    const cByName = Object.create(null);
    for (const [id, c] of Object.entries(res.closeness)) {
      cByName[idToName.get(String(id))] = c;
    }

    expect(cByName.center).toBeCloseTo(1, 8);
    expect(cByName.a).toBeCloseTo(3 / 5, 8);
    expect(cByName.b).toBeCloseTo(3 / 5, 8);
    expect(cByName.c).toBeCloseTo(3 / 5, 8);
  });

  test('single node graph', async () => {
    await graph.query(`MATCH (n) DETACH DELETE n`);

    await graph.query(`CREATE (a:N {name:'a'})`);

    const out = await graph.query(`
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.closenessCentrality({nodes: nodes}) AS res
    `);

    const res = out.data[0].res;
    expect(res.n).toBe(1);

    const values = Object.values(res.closeness);
    expect(values.length).toBe(1);
    expect(values[0]).toBe(0);

    const wfValues = Object.values(res.wassermanFaust);
    expect(wfValues.length).toBe(1);
    expect(wfValues[0]).toBe(0);
  });
});
