# exp.bridges

## Description
Finds bridges (cut edges) in an undirected graph. A bridge is an edge whose removal disconnects the graph or increases its number of connected components. Uses Tarjan's DFS-based algorithm in O(V + E) time.

> **Experimental:** This function is part of the `flex.exp.*` namespace and may evolve in future releases.

## Syntax
```cypher
flex.exp.bridges(adjacencyMap)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `adjacencyMap` | map | Yes | Adjacency map representing the graph: keys are node IDs (strings), values are lists of neighbor IDs |

## Returns
**Type:** list of lists

A list of `[nodeA, nodeB]` pairs representing bridge edges.
- Returns an empty list `[]` when no bridges exist (e.g., a cycle)
- Returns `null` for invalid inputs (null, non-map, or values that are not lists)

## Behavior
- Treats the graph as **undirected** — the adjacency map should list each edge in both directions
- Handles disconnected graphs (multiple components)
- Node IDs are treated as strings
- Each bridge is returned once as a `[u, v]` pair following DFS traversal order

## Examples

### Example 1: Simple Chain
```cypher
// A -- B -- C  →  both edges are bridges
RETURN flex.exp.bridges({A: ['B'], B: ['A', 'C'], C: ['B']}) AS bridges
```
**Output:**
```
bridges
-------
[["A","B"],["B","C"]]
```

### Example 2: Critical Link Detection
```cypher
// Find links whose failure would partition the network
MATCH (n)-[:CONNECTS]->(m)
WITH n, collect(m.id) AS neighbors
WITH collect({key: n.id, value: neighbors}) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
RETURN flex.exp.bridges(adj) AS criticalLinks
```

### Example 3: Supply Chain Vulnerability
```cypher
// Identify single-connection supply routes
MATCH (s:Supplier)-[:SUPPLIES]->(d:Distributor)
WITH s, collect(d.name) AS neighbors
WITH collect({key: s.name, value: neighbors}) AS pairs
WITH flex.map.fromPairs(pairs) AS adj
WITH flex.exp.bridges(adj) AS vulnerable
UNWIND vulnerable AS link
RETURN link[0] AS from, link[1] AS to
```

## Notes
- The adjacency map must represent an undirected graph: if A connects to B, both `A: ['B']` and `B: ['A']` should be present
- Works with any string node identifiers
- Returns an empty list for fully 2-edge-connected graphs (every pair of nodes has at least two edge-disjoint paths)
- For finding critical *vertices*, see [exp.articulationPoints](articulationPoints.md)

## Use Cases
- **Bottleneck analysis** — identify edges that serve as the only connection between graph regions
- **Single points of failure** — find links whose failure disconnects the network
- **Network resilience** — assess how robust a network is to targeted edge removal
- **Attack surface analysis** — discover links whose compromise has maximum blast radius

## See Also
- [exp.articulationPoints](articulationPoints.md) — Find articulation points (cut vertices) whose removal disconnects the graph
