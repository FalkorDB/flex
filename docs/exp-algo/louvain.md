# exp.louvain (Experimental)

## Description
Detect communities in a graph using the **Louvain** modularity-optimization algorithm.

**Warning:** This function is **experimental**.
- The API, behavior, and performance characteristics may change between releases.
- It is intended for exploration and prototyping, not as a stable production API.

This implementation runs inside FalkorDB’s UDF runtime and uses `graph.traverse` to build an in-memory adjacency representation of the supplied node set.

## Syntax
```cypher
flex.exp.louvain({nodes: nodes, direction: 'incoming', resolution: 1, maxLevels: 10, maxPasses: 10})
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `list<node>` | Yes | The set of nodes to cluster. Typically provided via `collect(n)`. |
| `direction` | `string \| list<string>` | No | Which traversal direction(s) to use when building adjacency. Supported values are implementation-defined by FalkorDB UDFs; commonly `'incoming'`, `'outgoing'`, or `'both'`. Default: `['incoming','outgoing']`. |
| `maxEdgesPerNode` | `integer` | No | Safety cap on how many edges to scan per node when building adjacency. Default: `Infinity`. |
| `resolution` | `float` | No | Modularity resolution parameter (γ). Higher values tend to produce smaller communities. Default: `1`. |
| `maxPasses` | `integer` | No | Maximum number of node-moving passes per level. Default: `10`. |
| `maxLevels` | `integer` | No | Maximum number of coarsening (aggregation) levels. Default: `10`. |
| `minGain` | `float` | No | Minimum modularity gain required to move a node to a different community. Default: `1e-12`. |
| `debug` | `boolean` | No | When `true`, returns additional debug information about traversal/adjacency building. Default: `false`. |

## Returns
**Type:** `map`

A map with the following keys:
- `partition` (`map`): mapping from `nodeId -> communityId`.
- `communities` (`map`): mapping from `communityId -> list<nodeId>`.
- `levels` (`integer`): number of coarsening levels performed.
- `debug` (`map`, optional): only present when `debug: true`.

## Examples

### Example 1: Team communication communities
Identify communities in a communication graph with strong intra-team edges and weak cross-team edges.

```cypher
// Create a toy org with 3 teams
CREATE
  (alice:Person {name:'alice'}), (bob:Person {name:'bob'}), (carol:Person {name:'carol'}), (dave:Person {name:'dave'}),
  (erin:Person {name:'erin'}), (frank:Person {name:'frank'}), (grace:Person {name:'grace'}), (heidi:Person {name:'heidi'}),
  (ivan:Person {name:'ivan'}), (judy:Person {name:'judy'}), (mallory:Person {name:'mallory'}), (oscar:Person {name:'oscar'})

CREATE
  // Team 1 (strong)
  (alice)-[:COMM {weight:10}]->(bob),
  (bob)-[:COMM {weight:10}]->(carol),
  (carol)-[:COMM {weight:10}]->(dave),
  (dave)-[:COMM {weight:10}]->(alice),

  // Team 2 (strong)
  (erin)-[:COMM {weight:10}]->(frank),
  (frank)-[:COMM {weight:10}]->(grace),
  (grace)-[:COMM {weight:10}]->(heidi),
  (heidi)-[:COMM {weight:10}]->(erin),

  // Team 3 (strong)
  (ivan)-[:COMM {weight:10}]->(judy),
  (judy)-[:COMM {weight:10}]->(mallory),
  (mallory)-[:COMM {weight:10}]->(oscar),
  (oscar)-[:COMM {weight:10}]->(ivan),

  // Weak cross-team comms
  (dave)-[:COMM {weight:1}]->(erin),
  (heidi)-[:COMM {weight:1}]->(ivan);

MATCH (p:Person)
WITH p ORDER BY ID(p)
WITH collect(p) AS nodes
RETURN flex.exp.louvain({nodes: nodes, direction: 'incoming'}) AS communities;
```

### Example 2: Smaller communities using higher resolution
```cypher
MATCH (n)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.louvain({nodes: nodes, resolution: 2.0}) AS res;
```

## Notes
- **Performance:** Louvain requires building an in-memory adjacency structure. For large node sets this may be expensive; prefer running it on a bounded subgraph.
- **Edge weights:** the current implementation uses the `weight` relationship property when present; otherwise it defaults to `1`.
- **Direction:** results can change depending on which direction(s) you traverse when building adjacency.

## See Also
- [docs/README.md](../README.md)