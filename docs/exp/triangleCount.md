# exp.triangleCount

## Description
Counts the number of triangles a node participates in. A triangle is formed when two neighbors of the node are also directly connected to each other.

This is a per-node metric. To compute graph-wide triangle counts, aggregate the per-node results in Cypher.

## Syntax
```cypher
flex.exp.triangleCount(neighbors, adjacencyMap)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `neighbors` | list | Yes | List of the node's neighbor IDs |
| `adjacencyMap` | map | Yes | Map from node ID (string key) to list of neighbor IDs |

## Returns
**Type:** integer

The number of triangles the node participates in.
- Returns `0` when the node has fewer than 2 neighbors
- Returns `null` for invalid inputs

## Examples

### Example 1: Single Triangle
```cypher
// Triangle: A-B, A-C, B-C
// Check triangles for node A (neighbors B, C)
WITH { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] } AS adj
RETURN flex.exp.triangleCount(adj['A'], adj) AS triangles
```

**Output:**
```
triangles
---------
1
```

### Example 2: Star Graph (No Triangles)
```cypher
// Star: A-B, A-C, A-D (B, C, D not connected to each other)
WITH { A: ['B', 'C', 'D'], B: ['A'], C: ['A'], D: ['A'] } AS adj
RETURN flex.exp.triangleCount(adj['A'], adj) AS triangles
```

**Output:**
```
triangles
---------
0
```

### Example 3: Per-Node Triangle Count from Graph Data
```cypher
// Build adjacency map, then compute per-node triangle counts
MATCH (n)--(m)
WITH n, collect(DISTINCT toString(id(m))) AS nbs
WITH collect([toString(id(n)), nbs]) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
UNWIND keys(adj) AS nodeId
RETURN nodeId, flex.exp.triangleCount(adj[nodeId], adj) AS triangles
ORDER BY triangles DESC
```

## Notes
- **Cost:** O(d × d_max) per node, where d is the node's degree and d_max is the maximum degree among its neighbors. Can be expensive on dense graphs.
- Neighbor IDs are compared as strings to match map key lookup behavior
- If a neighbor is missing from the adjacency map, it is safely skipped
- Pair with `exp.clusteringCoefficient` to compute the local clustering coefficient

## See Also
- [exp.clusteringCoefficient](./clusteringCoefficient.md) - Local clustering coefficient from triangle count
