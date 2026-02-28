/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

const { initializeFLEX } = require('../setup');
const louvainModule = require('../../src/exp-algo/louvain');

describe('FLEX exp-algo Louvain Integration Tests', () => {
  let db, graph;

  beforeAll(async () => {
    const env = await initializeFLEX('exp_algo_louvain');
    db = env.db;
    graph = env.graph;
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  test('module is importable in Node (conditional export)', () => {
    expect(typeof louvainModule.louvain).toBe('function');
  });

  test('flex.exp.louvain is callable and finds communities in a more realistic weighted graph', async () => {
    // Make the test idempotent when re-run against the same local DB.
    await graph.query(`MATCH (n) DETACH DELETE n`);

    // Real-life-ish scenario: 3 teams in an organization.
    // - Strong communication within a team (weight=10)
    // - Weak cross-team communication (weight=1)
    //
    // We expect Louvain to recover 3 communities corresponding to the teams.
    await graph.query(`
      CREATE
        // Team 1
        (alice:N {name:'alice'}), (bob:N {name:'bob'}), (carol:N {name:'carol'}), (dave:N {name:'dave'}),
        // Team 2
        (erin:N {name:'erin'}), (frank:N {name:'frank'}), (grace:N {name:'grace'}), (heidi:N {name:'heidi'}),
        // Team 3
        (ivan:N {name:'ivan'}), (judy:N {name:'judy'}), (mallory:N {name:'mallory'}), (oscar:N {name:'oscar'})

      // Dense-ish intra-team edges (directed, but treated as undirected in the algo)
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

    const resQ = `
      MATCH (n:N)
      WITH n ORDER BY ID(n)
      WITH collect(n) AS nodes
      RETURN flex.exp.louvain({nodes: nodes, direction: 'incoming'}) AS res
    `;

    const out = await graph.query(resQ);
    const res = out.data[0].res;

    expect(res).toHaveProperty('partition');
    expect(res).toHaveProperty('communities');

    const communities = res.communities;
    const commKeys = Object.keys(communities);

    // We expect 3 communities of size 4 (community ids themselves are arbitrary).
    expect(commKeys.length).toBe(3);

    const nameSets = commKeys.map((k) => {
      const ids = communities[k] || [];
      const names = ids.map((id) => idToName.get(String(id)));
      return new Set(names);
    });

    // Each community should have exactly 4 members.
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
