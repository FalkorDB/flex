# exp.harmonicCentrality (Experimental)

## Description
Compute **harmonic centrality** for a set of nodes.

**Warning:** This function is **experimental**.
- The API, behavior, and performance characteristics may change between releases.
- It is intended for exploration and prototyping, not as a stable production API.

Harmonic centrality of a node `v` is defined as:

```
H(v) = Σ_{u ≠ v} 1 / d(v, u)
```

where `d(v, u)` is the shortest-path distance (hop count) between `v` and `u`. Unreachable pairs contribute `0` (since `1/∞ = 0`), which makes harmonic centrality well-defined on **disconnected graphs** without special handling.

This implementation runs inside FalkorDB's UDF runtime and uses `graph.traverse` to build an in-memory adjacency representation of the supplied node set.

**Important:** Edges discovered via traversal are treated as **undirected** (symmetrized), similar to `exp.louvain` and `exp.leiden`.

## Syntax
```cypher
flex.exp.harmonicCentrality({nodes: nodes})
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `list<node>` | Yes | The set of nodes to analyze. Typically provided via `collect(n)`. |
| `direction` | `string \| list<string>` | No | Which traversal direction(s) to use when building adjacency. Common values: `'incoming'`, `'outgoing'`, `'both'`. Default: `'both'`. |
| `maxEdgesPerNode` | `integer` | No | Safety cap on how many edges to scan per node when building adjacency. Default: `Infinity`. |
| `normalized` | `boolean` | No | When `true`, also returns normalized harmonic centrality (divide by `n-1`). Default: `true`. |
| `debug` | `boolean` | No | When `true`, returns additional debug information about adjacency building. Default: `false`. |

## Returns
**Type:** `map`

A map with the following keys:
- `n` (`integer`): number of input nodes.
- `harmonic` (`map`): mapping from `nodeId -> H(v)` (raw harmonic centrality).
- `normalized` (`map`, optional): mapping from `nodeId -> H(v) / (n-1)` (only when `normalized: true`). Values range from `0` to `1`.
- `debug` (`map`, optional): only present when `debug: true`.

## Examples

### Example 1: Basic Usage
```cypher
MATCH (n:N)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.harmonicCentrality({nodes: nodes}) AS res
```

### Example 2: Best-Hub Selection
```cypher
// Find the most reachable node in the network
MATCH (n:Station)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
WITH flex.exp.harmonicCentrality({nodes: nodes}) AS res
UNWIND keys(res.normalized) AS nodeId
RETURN nodeId, res.normalized[nodeId] AS score
ORDER BY score DESC
LIMIT 5
```

### Example 3: Disconnected Graph
```cypher
// Harmonic centrality handles disconnected components naturally —
// unreachable pairs contribute 0 instead of ∞.
MATCH (n:Location)
WITH collect(n) AS nodes
RETURN flex.exp.harmonicCentrality({nodes: nodes, normalized: true}) AS res
```

## Notes
- **Disconnected graphs:** Harmonic centrality is well-defined even when the graph is disconnected. Unreachable node pairs contribute `0` to the sum (since `1/∞ = 0`).
- **Distances:** Uses unweighted BFS (hop count). Edge weights are used only for adjacency building, not for shortest-path distances.
- **Performance:** Runs BFS from every node (O(n × (n + m))). Prefer running on a bounded subgraph.

## See Also
- [exp.closenessCentrality](./closenessCentrality.md) — closeness centrality (inverse sum of distances)
- [docs/README.md](../README.md)
