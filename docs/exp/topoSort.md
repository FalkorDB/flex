# exp.topoSort

## Description
Performs a topological sort on a directed graph given as a list of edges. Returns an ordered list of node identifiers such that for every directed edge `[u, v]`, node `u` appears before node `v` in the result. If the graph contains a cycle (making a topological ordering impossible), the function returns `null`.

This function uses Kahn's algorithm (BFS-based) for the sort.

## Syntax
```cypher
flex.exp.topoSort(edges)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `edges` | list | Yes | A list of `[from, to]` pairs representing directed edges |

## Returns
**Type:** list or null

An ordered list of node identifiers in topological order, or `null` if the graph contains a directed cycle.

## Examples

### Example 1: Linear Dependency Chain
```cypher
RETURN flex.exp.topoSort([['a','b'],['b','c'],['c','d']]) AS result
```

**Output:**
```
result
-------------------
["a", "b", "c", "d"]
```

### Example 2: Build Pipeline Scheduling
```cypher
// Model a build pipeline: build → compile → link → deploy, test → compile, test → deploy
WITH [['build','compile'],['compile','link'],['link','deploy'],['test','compile'],['test','deploy']] AS edges
RETURN flex.exp.topoSort(edges) AS buildOrder
```

**Output:**
```
buildOrder
---------------------------------
["build", "test", "compile", "link", "deploy"]
```

### Example 3: Cycle Detection via topoSort
```cypher
// Circular dependency: a → b → c → a
RETURN flex.exp.topoSort([['a','b'],['b','c'],['c','a']]) AS result
```

**Output:**
```
result
------
null
```

### Example 4: Package Dependency Ordering
```cypher
// Package dependencies: app needs lib-a and lib-b, lib-a needs core, lib-b needs core
WITH [['core','lib-a'],['core','lib-b'],['lib-a','app'],['lib-b','app']] AS deps
RETURN flex.exp.topoSort(deps) AS installOrder
```

**Output:**
```
installOrder
----------------------------
["core", "lib-a", "lib-b", "app"]
```

## Notes
- Node identifiers are derived from the edge list; isolated nodes (with no edges) are not included
- When a cycle exists, the function returns `null` rather than throwing an error
- Use `flex.exp.hasCycle` to explicitly check for cycles before sorting
- Returns `null` for invalid inputs (non-array or malformed edges)
- Empty edge list returns an empty array `[]`

## See Also
- [exp.hasCycle](./hasCycle.md) - Check whether a directed graph contains a cycle
