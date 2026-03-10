# exp.hasCycle

## Description
Detects whether a directed graph (given as a list of edges) contains a cycle. Returns `true` if any directed cycle exists, `false` otherwise. This is useful for validating that a dependency graph is a valid DAG (Directed Acyclic Graph) before processing.

## Syntax
```cypher
flex.exp.hasCycle(edges)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edges` | list | Yes | A list of `[from, to]` pairs representing directed edges |

## Returns
**Type:** boolean

`true` if the graph contains a directed cycle, `false` otherwise.

## Examples

### Example 1: Acyclic Graph
```cypher
RETURN flex.exp.hasCycle([['a','b'],['b','c']]) AS result
```

**Output:**
```
result
------
false
```

### Example 2: Circular Dependency
```cypher
RETURN flex.exp.hasCycle([['a','b'],['b','c'],['c','a']]) AS result
```

**Output:**
```
result
------
true
```

### Example 3: Self-Loop Detection
```cypher
RETURN flex.exp.hasCycle([['a','a']]) AS result
```

**Output:**
```
result
------
true
```

### Example 4: Validating a Data Lineage Graph
```cypher
// Check if data lineage has circular dependencies before processing
WITH [['raw_data','cleaned'],['cleaned','enriched'],['enriched','report']] AS lineage
RETURN flex.exp.hasCycle(lineage) AS hasCircularDep
```

**Output:**
```
hasCircularDep
--------------
false
```

## Notes
- Returns `false` for an empty edge list (no edges means no cycles)
- Returns `false` for invalid inputs (non-array values)
- Pair with `flex.exp.topoSort` for a complete DAG workflow: check for cycles first, then sort
- Internally uses the same algorithm as `topoSort` for consistency

## See Also
- [exp.topoSort](./topoSort.md) - Topological sort of a directed graph
