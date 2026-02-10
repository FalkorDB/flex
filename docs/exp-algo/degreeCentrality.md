# exp.degreeCentrality (Experimental)

## Description
Compute **degree centrality** for a set of nodes.

**Warning:** This function is **experimental**.
- The API, behavior, and performance characteristics may change between releases.
- It is intended for exploration and prototyping, not as a stable production API.

This implementation runs inside FalkorDB’s UDF runtime and uses `graph.traverse` to build an in-memory adjacency representation of the supplied node set.

**Important:** Edges discovered via traversal are treated as **undirected** (symmetrized), similar to `exp.louvain` and `exp.leiden`.

## Syntax
```cypher
flex.exp.degreeCentrality({nodes: nodes})
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `list<node>` | Yes | The set of nodes to analyze. Typically provided via `collect(n)`. |
| `direction` | `string \| list<string>` | No | Which traversal direction(s) to use when building adjacency. Common values: `'incoming'`, `'outgoing'`, `'both'`. Default: `'both'`. |
| `maxEdgesPerNode` | `integer` | No | Safety cap on how many edges to scan per node when building adjacency. Default: `Infinity`. |
| `normalized` | `boolean` | No | When `true`, also returns normalized degree (divide by `n-1`). Default: `true`. |
| `debug` | `boolean` | No | When `true`, returns additional debug information about adjacency building. Default: `false`. |

## Returns
**Type:** `map`

A map with the following keys:
- `n` (`integer`): number of input nodes.
- `maxDegree` (`integer`): maximum degree over the input node set.
- `degree` (`map`): mapping from `nodeId -> degree`.
- `weightedDegree` (`map`): mapping from `nodeId -> sum(weights)`.
- `normalized` (`map`, optional): mapping from `nodeId -> degree/(n-1)` (only when `normalized: true`).
- `debug` (`map`, optional): only present when `debug: true`.

## Example
```cypher
// Compute degree centrality for all nodes with label N
MATCH (n:N)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.degreeCentrality({nodes: nodes}) AS res;
```

## Notes
- **Edge weights:** `weightedDegree` uses relationship property `weight` when present; otherwise it defaults to `1`.
- **Performance:** requires building an in-memory adjacency structure; prefer running it on a bounded subgraph.

## See Also
- [exp.louvain](./louvain.md)
- [exp.leiden](./leiden.md)
- [docs/README.md](../README.md)
