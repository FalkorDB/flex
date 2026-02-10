/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const leidenModule = require('../../src/exp-algo/leiden');

describe('FLEX exp-algo Leiden Integration Tests', () => {
  let db, graph;

  beforeAll(async () => {
    const env = await initializeFLEX('exp_algo_leiden');
    db = env.db;
    graph = env.graph;
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('module is importable in Node (conditional export)', () => {
    expect(typeof leidenModule.leiden).toBe('function');
  });

  test('refinement splits a disconnected community into connected components (unit test)', () => {
    const adjacency = new Map();
    adjacency.set(1, new Map([[2, 1]]));
    adjacency.set(2, new Map([[1, 1]]));
    adjacency.set(3, new Map([[4, 1]]));
    adjacency.set(4, new Map([[3, 1]]));

    const partition = new Map([
      [1, 'A'],
      [2, 'A'],
      [3, 'A'],
      [4, 'A'],
    ]);

    const res = leidenModule.refineByConnectedComponents({
      adjacency,
      nodeIds: [1, 2, 3, 4],
      partition,
    });

    expect(res.splitCommunities).toBe(1);
    expect(res.totalComponents).toBe(2);

    const p = res.partition;
    expect(p.get(1)).toBe(p.get(2));
    expect(p.get(3)).toBe(p.get(4));
    expect(p.get(1)).not.toBe(p.get(3));
  });

  test('flex.exp.leiden is callable and finds communities in a more realistic weighted graph', async () => {
    // Make the test idempotent when re-run against the same local DB.
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Same scenario as Louvain test: 3 teams with strong intra-team ties (10)
    // and weak cross-team ties (1). Expect 3 communities of size 4.
    await graph.query(`
      CREATE
        // Team 1
        (alice:N {name:'alice'}), (bob:N {name:'bob'}), (carol:N {name:'carol'}), (dave:N {name:'dave'}),
        // Team 2
        (erin:N {name:'erin'}), (frank:N {name:'frank'}), (grace:N {name:'grace'}), (heidi:N {name:'heidi'}),
        // Team 3
        (ivan:N {name:'ivan'}), (judy:N {name:'judy'}), (mallory:N {name:'mallory'}), (oscar:N {name:'oscar'})

      CREATE
        // Team 1
        (alice)-[:R {weight:10}]->(bob),
        (bob)-[:R {weight:10}]->(carol),
        (carol)-[:R {weight:10}]->(dave),
        (dave)-[:R {weight:10}]->(alice),
        (alice)-[:R {weight:10}]->(carol),
        (bob)-[:R {weight:10}]->(dave),

        // Team 2
        (erin)-[:R {weight:10}]->(frank),
        (frank)-[:R {weight:10}]->(grace),
        (grace)-[:R {weight:10}]->(heidi),
        (heidi)-[:R {weight:10}]->(erin),
        (erin)-[:R {weight:10}]->(grace),
        (frank)-[:R {weight:10}]->(heidi),

        // Team 3
        (ivan)-[:R {weight:10}]->(judy),
        (judy)-[:R {weight:10}]->(mallory),
        (mallory)-[:R {weight:10}]->(oscar),
        (oscar)-[:R {weight:10}]->(ivan),
        (ivan)-[:R {weight:10}]->(mallory),
        (judy)-[:R {weight:10}]->(oscar),

        // Weak cross-team edges
        (dave)-[:R {weight:1}]->(erin),
        (heidi)-[:R {weight:1}]->(ivan),
        (carol)-[:R {weight:1}]->(grace)
    `);

    // Get stable id->name mapping
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
      RETURN flex.exp.leiden({nodes: nodes, seed: 42}) AS res
    `);

    const res = out.data[0].res;

    expect(res).toHaveProperty('partition');
    expect(res).toHaveProperty('communities');

    const communities = res.communities;
    const commKeys = Object.keys(communities);

    expect(commKeys.length).toBe(3);

    const nameSets = commKeys.map((k) => {
      const ids = communities[k] || [];
      const names = ids.map((id) => idToName.get(String(id)));
      return new Set(names);
    });

    for (const s of nameSets) {
      expect(s.size).toBe(4);
    }

    const team1 = new Set(['alice', 'bob', 'carol', 'dave']);
    const team2 = new Set(['erin', 'frank', 'grace', 'heidi']);
    const team3 = new Set(['ivan', 'judy', 'mallory', 'oscar']);

    function sameSet(a, b) {
      if (a.size !== b.size) return false;
      for (const v of a) if (!b.has(v)) return false;
      return true;
    }

    const hasTeam1 = nameSets.some((s) => sameSet(s, team1));
    const hasTeam2 = nameSets.some((s) => sameSet(s, team2));
    const hasTeam3 = nameSets.some((s) => sameSet(s, team3));

    expect(hasTeam1).toBe(true);
    expect(hasTeam2).toBe(true);
    expect(hasTeam3).toBe(true);
  });
});
