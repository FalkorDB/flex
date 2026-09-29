# exp.articulationPoints

## Description
Finds articulation points (cut vertices) in an undirected graph. An articulation point is a vertex whose removal, along with all its incident edges, disconnects the graph or increases its number of connected components. Uses Tarjan's DFS-based algorithm in O(V + E) time.

> **Experimental:** This function is part of the `flex.exp.*` namespace and may evolve in future releases.

## Syntax
```cypher
flex.exp.articulationPoints(adjacencyMap)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `adjacencyMap` | map | Yes | Adjacency map representing the graph: keys are node IDs (strings), values are lists of neighbor IDs |

## Returns
**Type:** list

A list of node ID strings that are articulation points.
- Returns an empty list `[]` when no articulation points exist (e.g., a fully connected cycle)
- Returns `null` for invalid inputs (null, non-map, or values that are not lists)

## Behavior
- Treats the graph as **undirected** — the adjacency map should list each edge in both directions
- Handles disconnected graphs (multiple components)
- Node IDs are treated as strings

## Examples

### Example 1: Simple Chain
```cypher
// A -- B -- C  →  B is the only cut vertex
RETURN flex.exp.articulationPoints({A: ['B'], B: ['A', 'C'], C: ['B']}) AS cutVertices
```
**Output:**
```
cutVertices
-----------
["B"]
```

### Example 2: Network Bottleneck Analysis
```cypher
// Build adjacency map from graph edges and find single points of failure
MATCH (n)-[:CONNECTS]->(m)
WITH n, collect(m.id) AS neighbors
WITH collect({key: n.id, value: neighbors}) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
RETURN flex.exp.articulationPoints(adj) AS singlePointsOfFailure
```

### Example 3: Infrastructure Resilience
```cypher
// Identify critical routers whose failure would partition the network
MATCH (r:Router)-[:LINK]->(r2:Router)
WITH r, collect(r2.name) AS neighbors
WITH collect({key: r.name, value: neighbors}) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
WITH flex.exp.articulationPoints(adj) AS critical
UNWIND critical AS name
MATCH (r:Router {name: name})
SET r.critical = true
RETURN r.name
```

## Notes
- The adjacency map must represent an undirected graph: if A connects to B, both `A: ['B']` and `B: ['A']` should be present
- Works with any string node identifiers
- Returns an empty list for complete graphs (no cut vertex) and single-node graphs
- For finding critical *edges*, see [exp.bridges](bridges.md)

## Use Cases
- **Bottleneck analysis** — identify vertices that serve as the only path between graph regions
- **Single points of failure** — find infrastructure nodes whose failure disconnects the network
- **Network resilience** — assess how robust a network is to targeted node removal
- **Attack surface analysis** — discover nodes whose compromise has maximum blast radius

## See Also
- [exp.bridges](bridges.md) — Find bridge (cut) edges whose removal disconnects the graph
