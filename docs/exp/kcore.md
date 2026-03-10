# exp.coreNumber / exp.kcore

## Description
K-core decomposition identifies the dense backbone of a graph. A **k-core** is the maximal subgraph in which every node has degree at least *k*. The **core number** of a node is the largest *k* for which it belongs to the k-core.

Two functions are provided:

| Function | Purpose |
|----------|---------|
| `exp.coreNumber` | Compute the core number of every node |
| `exp.kcore` | Extract nodes belonging to a given k-core |

Both functions treat the input graph as **undirected**. Each `[source, target]` edge is counted in both directions. Self-loops are ignored. Duplicate edges do not affect the result.

## Syntax
```cypher
flex.exp.coreNumber(edges)
flex.exp.kcore(edges, k)
```

## Parameters

### exp.coreNumber
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edges` | list of [source, target] pairs | Yes | Edge list representing the graph |

### exp.kcore
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edges` | list of [source, target] pairs | Yes | Edge list representing the graph |
| `k` | integer | Yes | Minimum core number threshold (≥ 0) |

## Returns

### exp.coreNumber
**Type:** list of [node, coreNumber] pairs

Returns an array of `[node, coreNumber]` pairs sorted by node, where `coreNumber` is an integer ≥ 0. Returns `null` for invalid inputs and `[]` for an empty edge list.

### exp.kcore
**Type:** list of nodes

Returns a sorted array of nodes whose core number is ≥ k. Returns `null` for invalid inputs and `[]` when no node meets the threshold.

## Examples

### Example 1: Core Numbers of a Small Graph
```cypher
// Triangle with a pendant: 1-2, 2-3, 3-1, 3-4
RETURN flex.exp.coreNumber([[1,2],[2,3],[3,1],[3,4]]) AS cores
```

**Output:**
```
cores
-----
[[1, 2], [2, 2], [3, 2], [4, 1]]
```
Nodes 1, 2, 3 form a triangle (core 2); node 4 is a leaf (core 1).

### Example 2: Extract the 2-Core
```cypher
RETURN flex.exp.kcore([[1,2],[2,3],[3,1],[3,4]], 2) AS dense_nodes
```

**Output:**
```
dense_nodes
-----------
[1, 2, 3]
```

### Example 3: Find Influential Users in a Social Network
```cypher
// Collect the friendship edge list
MATCH (a:User)-[:FRIENDS_WITH]->(b:User)
WITH collect([a.id, b.id]) AS edges
// Get core numbers for every user
RETURN flex.exp.coreNumber(edges) AS user_cores
```

### Example 4: Extract a Dense Community Sub-Network
```cypher
MATCH (a:User)-[:FRIENDS_WITH]->(b:User)
WITH collect([a.id, b.id]) AS edges
WITH flex.exp.kcore(edges, 3) AS dense_ids
UNWIND dense_ids AS uid
MATCH (u:User {id: uid})
RETURN u.name, u.id
```

## Notes
- The graph is always treated as **undirected** regardless of edge direction in the input.
- **Self-loops** are ignored; they do not contribute to degree.
- **Duplicate edges** are deduplicated internally and do not inflate degree counts.
- Node identifiers can be any comparable type (integers, strings, etc.).
- The algorithm runs in O(V + E) time using bucket-sort decomposition (Batagelj & Zahar, 2003).
- For directed graphs, convert to undirected by collecting both `[a, b]` and `[b, a]` or only one direction as appropriate for your analysis.
- Returns `null` when `edges` is not a list, or when `k` is not a non-negative number.

## Use Cases
- **Influential-subnetwork discovery** — high-core-number nodes sit in dense, well-connected regions.
- **Seed-set selection** — choose seeds from the innermost core for influence-maximisation algorithms.
- **Graph pruning** — remove low-core periphery before running expensive analytics.
- **Structural robustness analysis** — the core-number distribution reveals how resilient a network is to node removal.

## See Also
- [sim.jaccard](../similarity/jaccard.md) — Set similarity metric
- [coll.intersection](../collections/intersection.md) — Set intersection
