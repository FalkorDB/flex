# exp.clusteringCoefficient

## Description
Computes the local clustering coefficient for a node. The clustering coefficient is the ratio of actual triangles to the maximum possible triangles for a node with the given degree. It ranges from 0 (no triangles) to 1 (fully connected neighborhood).

## Syntax
```cypher
flex.exp.clusteringCoefficient(triangles, degree)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `triangles` | number | Yes | Number of triangles the node participates in (from `exp.triangleCount`) |
| `degree` | number | Yes | Degree of the node (number of neighbors) |

## Returns
**Type:** number (float)

A value between 0 and 1 representing the local clustering coefficient:
- `1.0` indicates a fully connected neighborhood (all neighbors are connected)
- `0.0` indicates no triangles
- Returns `0` when degree is less than 2 (triangles are impossible)
- Returns `null` for invalid inputs

## Examples

### Example 1: Fully Connected Neighborhood
```cypher
// Node with 3 neighbors, all 3 possible triangles exist
RETURN flex.exp.clusteringCoefficient(3, 3) AS cc
```

**Output:**
```
cc
--
1.0
```

### Example 2: Partial Connectivity
```cypher
// Node with 3 neighbors, only 1 triangle
RETURN flex.exp.clusteringCoefficient(1, 3) AS cc
```

**Output:**
```
cc
----
0.333
```

### Example 3: Combined with triangleCount
```cypher
// Compute local clustering coefficient for each node
MATCH (n)--(m)
WITH n, collect(DISTINCT toString(id(m))) AS nbs
WITH collect([toString(id(n)), nbs]) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
UNWIND keys(adj) AS nodeId
WITH nodeId, adj[nodeId] AS neighbors, adj
WITH nodeId, neighbors,
     flex.exp.triangleCount(neighbors, adj) AS tc,
     size(neighbors) AS degree
RETURN nodeId, tc AS triangles, degree,
       flex.exp.clusteringCoefficient(tc, degree) AS cc
ORDER BY cc DESC
```

### Example 4: Average Clustering Coefficient (Graph-Wide)
```cypher
// Compute the average clustering coefficient across all nodes
MATCH (n)--(m)
WITH n, collect(DISTINCT toString(id(m))) AS nbs
WITH collect([toString(id(n)), nbs]) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
UNWIND keys(adj) AS nodeId
WITH adj[nodeId] AS neighbors, adj
WITH flex.exp.clusteringCoefficient(
       flex.exp.triangleCount(neighbors, adj),
       size(neighbors)
     ) AS cc
RETURN avg(cc) AS avgClusteringCoefficient
```

## Notes
- The formula is: `triangles / (degree × (degree - 1) / 2)`
- For degree < 2, returns 0 since triangles are structurally impossible
- The global clustering coefficient for a graph can be approximated by averaging the local coefficients of all nodes
- **Cost:** O(1) per call — the expensive part is computing triangle counts via `exp.triangleCount`

## See Also
- [exp.triangleCount](./triangleCount.md) - Count triangles a node participates in
