# Experimental Link Prediction Heuristics

## Description
A family of lightweight link-prediction heuristics useful for recommendation-style workflows, missing-edge discovery, entity resolution, and suspicious-connection scoring. These functions live under the experimental `exp.*` namespace.

## Functions

### exp.commonNeighbors

Returns the number of common neighbors between two nodes given their neighbor lists.

#### Syntax
```cypher
flex.exp.commonNeighbors(neighborsA, neighborsB)
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `neighborsA` | list | Yes | Neighbor list of node A |
| `neighborsB` | list | Yes | Neighbor list of node B |

#### Returns
**Type:** integer

The count of elements present in both lists. Returns `null` for invalid inputs.

#### Example
```cypher
MATCH (a:Person {name: 'Alice'})-[:FRIENDS]->(n1)
MATCH (b:Person {name: 'Bob'})-[:FRIENDS]->(n2)
WITH collect(DISTINCT n1.id) AS nA, collect(DISTINCT n2.id) AS nB
RETURN flex.exp.commonNeighbors(nA, nB) AS score
```

---

### exp.adamicAdar

Computes the Adamic-Adar index. For each common neighbor *z* the score adds `1 / log(degree(z))`. Neighbors with lower degree contribute more, making this useful for distinguishing high-value connections.

#### Syntax
```cypher
flex.exp.adamicAdar(neighborsA, neighborsB, degrees)
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `neighborsA` | list | Yes | Neighbor list of node A |
| `neighborsB` | list | Yes | Neighbor list of node B |
| `degrees` | map | Yes | Map from neighbor id to its degree |

#### Returns
**Type:** float

The Adamic-Adar score. Common neighbors with degree ≤ 1 are skipped (log(1) = 0). Returns `null` for invalid inputs.

#### Example
```cypher
// Collect neighbor IDs and their degrees, then compute the index
MATCH (a:Person {name: 'Alice'})-[:FRIENDS]->(na)
WITH a, collect(DISTINCT na.id) AS nA
MATCH (b:Person {name: 'Bob'})-[:FRIENDS]->(nb)
WITH a, nA, collect(DISTINCT nb.id) AS nB
// Build degree map for potential common neighbors
UNWIND nA + nB AS cid
WITH DISTINCT cid, nA, nB
MATCH (c {id: cid})
WITH nA, nB, apoc.map.fromPairs(collect([c.id, size((c)--())])) AS deg
RETURN flex.exp.adamicAdar(nA, nB, deg) AS score
```

---

### exp.resourceAllocation

Computes the Resource Allocation index. For each common neighbor *z* the score adds `1 / degree(z)`. Similar to Adamic-Adar but without the logarithm, giving even more weight to low-degree common neighbors.

#### Syntax
```cypher
flex.exp.resourceAllocation(neighborsA, neighborsB, degrees)
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `neighborsA` | list | Yes | Neighbor list of node A |
| `neighborsB` | list | Yes | Neighbor list of node B |
| `degrees` | map | Yes | Map from neighbor id to its degree |

#### Returns
**Type:** float

The Resource Allocation score. Returns `null` for invalid inputs.

#### Example
```cypher
RETURN flex.exp.resourceAllocation([1, 2, 3], [2, 3, 4], {2: 4, 3: 5}) AS score
// score ≈ 0.45 (1/4 + 1/5)
```

---

### exp.preferentialAttachment

Computes the Preferential Attachment score, which is simply the product of the two neighbor list lengths. Nodes with many connections are more likely to form new connections.

#### Syntax
```cypher
flex.exp.preferentialAttachment(neighborsA, neighborsB)
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `neighborsA` | list | Yes | Neighbor list of node A |
| `neighborsB` | list | Yes | Neighbor list of node B |

#### Returns
**Type:** integer

`|neighborsA| * |neighborsB|`. Returns `null` for invalid inputs.

#### Example
```cypher
MATCH (a:Person {name: 'Alice'})-[:FRIENDS]->(n1)
MATCH (b:Person {name: 'Bob'})-[:FRIENDS]->(n2)
WITH collect(DISTINCT n1.id) AS nA, collect(DISTINCT n2.id) AS nB
RETURN flex.exp.preferentialAttachment(nA, nB) AS score
```

---

## Notes
- All functions treat lists as sets when counting common elements (duplicates are ignored).
- Functions return `null` when any required parameter is missing or has the wrong type.
- The `degrees` map keys should correspond to elements in the neighbor lists.
- These are **experimental** (`exp.*`) functions. Their API may evolve in future releases.

## See Also
- [sim.jaccard](../similarity/jaccard.md) – Jaccard similarity coefficient
- [coll.intersection](../collections/intersection.md) – Array intersection
- [coll.union](../collections/union.md) – Array union
