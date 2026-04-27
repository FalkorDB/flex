# exp.pagerankv (Experimental)

## Description
Compute **PageRank** scores over a supplied set of nodes.

**Warning:** This function is **experimental**.
- The API, behavior, and performance characteristics may change between releases.
- It is intended for exploration and prototyping, not as a stable production API.

This implementation runs inside FalkorDB’s UDF runtime and uses `graph.traverse` to build an in-memory **directed** adjacency representation of the supplied node set.

It supports **weighted transitions**: if an edge has a numeric weight attribute (default: `weight`), rank is distributed proportionally to that weight.

## Syntax
```cypher
flex.exp.pagerankv({nodes: nodes, direction: 'both', damping: 0.85, maxIterations: 50, tolerance: 1e-8, personalization: {'42': 1}})
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `list<node>` | Yes | The node set to score. Typically provided via `collect(n)`. |
| `direction` | `string \| list<string>` | No | Traversal direction(s) used to build adjacency. Default: `'both'`. |
| `maxEdgesPerNode` | `integer` | No | Safety cap on how many edges to scan per node when building adjacency. Default: `Infinity`. |
| `damping` | `float` | No | Damping factor (α). Default: `0.85`. |
| `maxIterations` | `integer` | No | Maximum number of power-iterations. Default: `50`. |
| `tolerance` | `float` | No | Convergence threshold (L1 delta). Default: `1e-8`. |
| `weightAttribute` | `string \| list<string>` | No | Relationship property name(s) to read weights from. Default: `'weight'`. |
| `defaultWeight` | `float` | No | Weight to use when no attribute is present. Default: `1`. |
| `minWeight` | `float` | No | Clamp lower bound for weights. Default: `0`. |
| `personalization` | `map<string, float>` | No | Personalized restart weights keyed by node id. Keys may be a subset of supplied nodes. Values are normalized over in-graph keys. Missing nodes receive zero. Default: uniform distribution over all nodes. |
| `dangling` | `map<string, float>` | No | Redistribution weights for dangling nodes (nodes with no outgoing edges). Values are normalized over in-graph keys. Default: `personalization` (or uniform when `personalization` is omitted). |
| `debug` | `boolean` | No | When `true`, returns extra debug information (adjacency stats + per-iteration deltas). Default: `false`. |

## Returns
**Type:** `map`

A map with the following keys:
- `scores` (`map`): mapping from `nodeId -> score`.
- `iterations` (`integer`): number of iterations performed.
- `converged` (`boolean`): whether the algorithm met the `tolerance` threshold before hitting `maxIterations`.
- `debug` (`map`, optional): only present when `debug: true`.

## Examples

### Example 1: Weighted links
```cypher
CREATE (a:N {name:'a'}), (b:N {name:'b'}), (c:N {name:'c'})
CREATE
  (a)-[:R {weight: 10}]->(b),
  (a)-[:R {weight: 1}]->(c),
  (b)-[:R {weight: 1}]->(a),
  (c)-[:R {weight: 1}]->(a);

MATCH (n:N)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.pagerankv({nodes: nodes}) AS res;
```

### Example 2: Custom weight attribute
```cypher
MATCH (n)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.pagerankv({nodes: nodes, weightAttribute: 'strength'}) AS res;
```

### Example 3: Personalized PageRank (seed-biased restarts)
```cypher
MATCH (n:N)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.pagerankv({
  nodes: nodes,
  personalization: {
    '42': 0.7,
    '87': 0.3
  }
}) AS res;
```

## Notes
- **Edge weights:** when `weightAttribute` is present and numeric, it is used to distribute rank proportionally across outgoing edges.
- **Personalization normalization:** `personalization` does not need to sum to `1`; in-graph values are normalized automatically.
- **Dangling nodes:** when `dangling` is omitted, dangling mass is redistributed using the personalization distribution (uniform when no personalization is provided).
- **Validation:** `personalization` and `dangling` values must be finite and non-negative, and at least one in-graph value must be positive.

## See Also
- [docs/README.md](../README.md)
