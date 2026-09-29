# exp.closenessCentrality (Experimental)

## Description
Compute **closeness centrality** for a set of nodes.

**Warning:** This function is **experimental**.
- The API, behavior, and performance characteristics may change between releases.
- It is intended for exploration and prototyping, not as a stable production API.

Classic closeness centrality of a node `v` is defined as:

```
C(v) = (n - 1) / Σ_{u ≠ v} d(v, u)
```

where `d(v, u)` is the shortest-path distance (hop count). For **disconnected graphs**, the classic formula can produce inflated values because the sum only includes reachable nodes. To address this, the function also returns the **Wasserman-Faust** variant:

```
C_WF(v) = (r / (n - 1)) × (r / Σ_{u reachable} d(v, u))
```

where `r` is the number of nodes reachable from `v` (excluding `v` itself).

This implementation runs inside FalkorDB's UDF runtime and uses `graph.traverse` to build an in-memory adjacency representation of the supplied node set.

**Important:** Edges discovered via traversal are treated as **undirected** (symmetrized), similar to `exp.louvain` and `exp.leiden`.

## Syntax
```cypher
flex.exp.closenessCentrality({nodes: nodes})
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `list<node>` | Yes | The set of nodes to analyze. Typically provided via `collect(n)`. |
| `direction` | `string \| list<string>` | No | Which traversal direction(s) to use when building adjacency. Common values: `'incoming'`, `'outgoing'`, `'both'`. Default: `'both'`. |
| `maxEdgesPerNode` | `integer` | No | Safety cap on how many edges to scan per node when building adjacency. Default: `Infinity`. |
| `normalized` | `boolean` | No | When `true`, also returns normalized closeness centrality. Default: `true`. |
| `debug` | `boolean` | No | When `true`, returns additional debug information about adjacency building. Default: `false`. |

## Returns
**Type:** `map`

A map with the following keys:
- `n` (`integer`): number of input nodes.
- `closeness` (`map`): mapping from `nodeId -> C(v)` (classic closeness centrality).
- `wassermanFaust` (`map`): mapping from `nodeId -> C_WF(v)` (Wasserman-Faust variant for disconnected graphs). For connected graphs, this equals the classic closeness value.
- `normalized` (`map`, optional): mapping from `nodeId -> C(v)` (same as classic closeness, which is already normalized by `n-1`). Only present when `normalized: true`.
- `debug` (`map`, optional): only present when `debug: true`.

## Examples

### Example 1: Basic Usage
```cypher
MATCH (n:N)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
RETURN flex.exp.closenessCentrality({nodes: nodes}) AS res
```

### Example 2: Facility Placement
```cypher
// Find the most central location for placing a service facility
MATCH (n:Location)
WITH n ORDER BY ID(n)
WITH collect(n) AS nodes
WITH flex.exp.closenessCentrality({nodes: nodes}) AS res
UNWIND keys(res.closeness) AS nodeId
RETURN nodeId, res.closeness[nodeId] AS score
ORDER BY score DESC
LIMIT 5
```

### Example 3: Disconnected Graph — Wasserman-Faust Variant
```cypher
// For disconnected graphs, use the Wasserman-Faust variant
// which correctly penalizes nodes that cannot reach the whole network.
MATCH (n:City)
WITH collect(n) AS nodes
WITH flex.exp.closenessCentrality({nodes: nodes}) AS res
UNWIND keys(res.wassermanFaust) AS nodeId
RETURN nodeId,
       res.closeness[nodeId] AS classic,
       res.wassermanFaust[nodeId] AS wf
ORDER BY wf DESC
```

## Notes
- **Disconnected graphs:** The classic closeness formula `(n-1)/sumDist` uses only reachable nodes in the denominator, which can produce inflated values when the graph is disconnected. Use the `wassermanFaust` field for a more meaningful ranking in disconnected graphs.
- **Isolated nodes:** A node with no neighbors receives a closeness (and Wasserman-Faust) score of `0`.
- **Distances:** Uses unweighted BFS (hop count). Edge weights are used only for adjacency building, not for shortest-path distances.
- **Performance:** Runs BFS from every node (O(n × (n + m))). Prefer running on a bounded subgraph.

## See Also
- [exp.harmonicCentrality](./harmonicCentrality.md) — harmonic centrality (handles disconnected graphs naturally)
- [docs/README.md](../README.md)
