# exp.scc

## Description
Compute the **Strongly Connected Components (SCC)** of a directed graph using Tarjan's algorithm. A strongly connected component is a maximal set of nodes where every node is reachable from every other node following edge directions.

## Syntax
```cypher
exp.scc(edges)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edges` | List of Lists | Yes | Directed edges, each element is `[source, target]` |

## Returns
**Type:** List of Lists

Each inner list contains the node identifiers belonging to one strongly connected component. Singleton lists represent nodes with no mutual reachability.

## Examples

### Example 1: Simple Cycle
```cypher
RETURN flex.exp.scc([['A','B'],['B','C'],['C','A']]) AS components
```

**Output:**
```
components
----------
[["C","B","A"]]
```

### Example 2: Two Separate Cycles Connected by a One-Way Edge
```cypher
RETURN flex.exp.scc([
  ['A','B'],['B','A'],
  ['B','C'],
  ['C','D'],['D','C']
]) AS components
```

**Output:**
```
components
----------
[["B","A"],["D","C"]]
```

### Example 3: DAG (No Cycles)
```cypher
RETURN flex.exp.scc([['A','B'],['B','C']]) AS components
```

**Output:**
```
components
----------
[["C"],["B"],["A"]]
```

### Example 4: Real-World — Dependency Loop Detection
```cypher
// Build edge list from DEPENDS_ON relationships
MATCH (a)-[:DEPENDS_ON]->(b)
WITH collect([a.name, b.name]) AS edges
RETURN flex.exp.scc(edges) AS dependency_cycles
```

## Notes
- Returns an empty list for `NULL` or non-array input.
- Malformed edges (non-array or fewer than two elements) are silently skipped.
- Node identifiers can be strings or numbers.
- Uses Tarjan's algorithm with O(V + E) time complexity.
- **Experimental** — API may change in future releases.

## See Also
- [coll.intersection](../collections/intersection.md)
- [coll.union](../collections/union.md)
