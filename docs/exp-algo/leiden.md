# exp.leiden (Experimental)

## Description
Detect communities in a graph using a **Leiden-style** modularity-optimization algorithm.

**Warning:** This function is **experimental**.
- The API, behavior, and performance characteristics may change between releases.
- It is intended for exploration and prototyping, not as a stable production API.

This implementation runs inside FalkorDB’s UDF runtime and uses `graph.traverse` to build an in-memory adjacency representation of the supplied node set.

Compared to `exp.louvain`, Leiden adds a **refinement** step. In this implementation, refinement is done by splitting each community into **connected components**, which helps avoid disconnected communities.

## Syntax
```cypher
flex.exp.leiden({nodes: nodes, resolution: 1, maxLevels: 10, maxPasses: 10, seed: 42})
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `list<node>` | Yes | The set of nodes to cluster. Typically provided via `collect(n)`. |
| `direction` | `string \| list<string>` | No | Which traversal direction(s) to use when building adjacency. Supported values are implementation-defined by FalkorDB UDFs; commonly `'incoming'`, `'outgoing'`, or `'both'`. Default: `'both'`. |
| `maxEdgesPerNode` | `integer` | No | Safety cap on how many edges to scan per node when building adjacency. Default: `Infinity`. |
| `resolution` | `float` | No | Modularity resolution parameter (γ). Higher values tend to produce smaller communities. Default: `1`. |
| `maxPasses` | `integer` | No | Maximum number of node-moving passes per level. Default: `10`. |
| `maxLevels` | `integer` | No | Maximum number of coarsening (aggregation) levels. Default: `10`. |
| `minGain` | `float` | No | Minimum modularity gain required to move a node to a different community. Default: `1e-12`. |
| `seed` | `integer` | No | When provided, uses a deterministic pseudo-random node iteration order (helps avoid order-bias and makes results reproducible). |
| `debug` | `boolean` | No | When `true`, returns additional debug information. Default: `false`. |

## Returns
**Type:** `map`

A map with the following keys:
- `partition` (`map`): mapping from `nodeId -> communityId`.
- `communities` (`map`): mapping from `communityId -> list<nodeId>`.
- `levels` (`integer`): number of coarsening levels performed.
- `debug` (`map`, optional): only present when `debug: true`.

## Examples

### Example 1: Team communication communities
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
RETURN flex.exp.leiden({nodes: nodes, seed: 42}) AS res;
```

## Notes
- **Refinement step:** this implementation splits each community into connected components.
- **Performance:** requires building an in-memory adjacency structure; prefer running it on a bounded subgraph.
- **Edge weights:** uses relationship property `weight` when present; otherwise defaults to `1`.

## See Also
- [exp.louvain](./louvain.md)
- [docs/README.md](../README.md)
