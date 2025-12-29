# Flex Read-Only Scope: APOC/GDS Parity

This document defines the initial scope for Flex read-only functions and procedures, focusing on high-value features from Neo4j APOC and GDS that are missing from the current FalkorDB API and the existing Flex proposal.

## 1. Existing Flex Surface (What We Already Cover)

Current Flex proposal (from `flex-first-content.txt`):

- `flex.text.levenshtein`
- `flex.text.jaroWinkler`
- `flex.sim.jaccard`
- `flex.sim.overlap`
- `flex.map.removeKey`
- `flex.map.fromPairs`
- `flex.coll.zip`
- `flex.coll.toSet`
- `flex.coll.intersection`
- `flex.coll.shuffle`
- `flex.coll.sortMaps`
- `flex.coll.partition`
- `flex.coll.frequencies`
- `flex.text.clean`
- `flex.text.randomString`

These map well to commonly used APOC families:

- `apoc.text.*` – string cleaning and similarity (Levenshtein, Jaro–Winkler, etc.)
- `apoc.coll.*` – collection zipping, sets, intersections, shuffling, partitioning, frequencies
- `apoc.map.*` – map from pairs, remove keys

Conclusion: we already cover a good slice of high-use APOC helpers for text similarity and basic list/map utilities.

## 2. High-Value APOC-Style Gaps & Proposed Flex Additions

Below are categories where APOC is heavily used and FalkorDB+Flex currently lack equivalent functionality. All proposals here are **read-only**.

### 2.1 Date/Time Parsing & Formatting (`apoc.date.*`)

APOC commonly used functions:

- `apoc.date.parse`
- `apoc.date.format`
- `apoc.date.convert`, `apoc.date.convertZone`
- `apoc.date.truncate` (truncate to day/week/month/etc.)

FalkorDB supports Cypher temporal types but lacks rich date utilities (custom format parsing, timezone conversion, truncation).

**Proposed Flex API**

- `flex.date.parse(text, pattern, tz)`
- `flex.date.format(datetime, pattern, tz)`
- `flex.date.truncate(datetime, unit)`
  - `unit`: `minute | hour | day | week | month | quarter | year`
- `flex.date.toTimeZone(datetime, tz)`

Use cases: ETL, data cleansing, reporting queries.

### 2.2 JSON & Map Conversions (`apoc.convert.*`, `apoc.map.*`)

APOC read-only utilities:

- `apoc.convert.toJson(value)`
- `apoc.convert.fromJsonMap`, `apoc.convert.fromJsonList`
- `apoc.map.merge`, `apoc.map.submap`, `apoc.map.setKey`, `apoc.map.removeKeys`

FalkorDB today:

- Built-in `toJSON()`
- No `fromJson*` or map-merge utilities

Current Flex:

- `flex.map.removeKey`
- `flex.map.fromPairs`

**Gaps & Proposed Flex API**

- `flex.json.toJson(value)`
  - Thin wrapper over `toJSON()` for consistent naming.
- `flex.json.fromJsonMap(str)`
- `flex.json.fromJsonList(str)`
- `flex.map.merge(map1, map2, ...)`
- `flex.map.submap(map, keys: List<String>)`
- `flex.map.removeKeys(map, keys: List<String>)`
- (Optional) tree/graph projection helper similar to `apoc.convert.toTree`.

Primary use cases: ingesting semi-structured JSON, dynamic properties, generic tooling.

### 2.3 Rich Collection Helpers (`apoc.coll.*`)

Popular (read-only) APOC collection helpers not currently covered:

- `apoc.coll.union`, `apoc.coll.unionAll`
- `apoc.coll.subtract`
- `apoc.coll.containsAll`, `apoc.coll.containsAny`
- `apoc.coll.flatten`
- Richer sort utilities (multi-key) – `apoc.coll.sort()`, `sortNodes()`, `sortMaps()`
- Less frequent but useful: `apoc.coll.permutations`, `apoc.coll.combinations`

FalkorDB core list functions are minimal. Current Flex extends with `intersection`, `toSet`, `zip`, `partition`, `frequencies`, `sortMaps` but misses union/subtract/flatten/contains*.

**Proposed Flex API**

- `flex.coll.union(list1, list2)`
- `flex.coll.subtract(list, toRemove)`
- `flex.coll.containsAll(list, candidates)`
- `flex.coll.containsAny(list, candidates)`
- `flex.coll.flatten(nestedList)`

These significantly improve ergonomics for list-heavy queries and ETL.

### 2.4 Extra Text Utilities (`apoc.text.*` beyond similarity)

Widely used APOC text helpers:

- `apoc.text.split(str, regex)`, `apoc.text.join(list, delim)`
- `apoc.text.regexGroups(str, regex)`
- `apoc.text.replace(str, regex, replacement)` (regex aware)
- URL / encoding helpers: `apoc.text.urlencode`, `urldecode`, base64 encode/decode, `apoc.text.slug`

FalkorDB:

- Basic string functions
- No regex-based helpers, no split/join, no encoding utilities

Current Flex:

- `flex.text.clean`
- `flex.text.randomString`

**Proposed Flex API**

- `flex.text.split(text, pattern)`
- `flex.text.join(list, delim)`
- `flex.text.regexGroups(text, pattern)`
- `flex.text.replaceRegex(text, pattern, replacement)`
- `flex.text.urlEncode(text)`, `flex.text.urlDecode(text)`
- `flex.text.base64Encode(text)`, `flex.text.base64Decode(text)`

Use cases: ETL, data cleansing, URL handling, light-weight transformation in Cypher.

### 2.5 Dynamic Cypher Execution (`apoc.cypher.run*`) – Optional / Later Phase

APOC dynamic query helpers:

- `apoc.cypher.run`
- `apoc.cypher.runManyReadOnly`
- `apoc.cypher.runFirstColumn`

These are heavily used for meta-programming and generic tooling.

FalkorDB has no equivalent procedure that accepts Cypher as a string; subqueries (`CALL { ... }`) require static queries.

**Potential Flex API (read-only only, sandboxed)**

- `flex.cypher.run(query :: String, params :: Map)`

This is powerful but higher risk/complexity. Recommended as a later phase, possibly behind configuration or role-based access control.

### 2.6 Graph/Path Exploration Helpers (`apoc.path.*`)

APOC path utilities (read-only):

- `apoc.path.expand`, `apoc.path.expandConfig`
- `apoc.path.subgraphNodes`, `apoc.path.subgraphAll`

FalkorDB today:

- Path functions: `shortestPath`, `allShortestPaths`, `nodes(path)`, `relationships(path)`
- Algorithms: BFS, `SPpaths`, `SSpaths`, `MSF`

Missing: a flexible, config-driven path expander like `apoc.path.expandConfig` that allows filtering by labels, rel types, predicates, min/max depth, termination predicates, etc.

**Proposed Flex API (procedures, read-only)**

- `CALL flex.path.expand(startNode, config) YIELD path`
- `CALL flex.path.subgraphNodes(startNode, config) YIELD node`
- `CALL flex.path.subgraphAll(startNode, config) YIELD path`

Where `config` may include:

- `minDepth`, `maxDepth`
- allowed/forbidden labels and relationship types
- node/relationship filter predicates
- termination predicates / whitelist/blacklist semantics

These would be among the most impactful additions for interactive graph exploration.

## 3. High-Value GDS-Style Algorithms (Read-Only Modes)

FalkorDB already exposes several core algorithms:

- **Pathfinding**: BFS, shortest paths (`SPpaths`, `SSpaths`, `shortestPath`, `allShortestPaths`)
- **Centrality**: PageRank, Betweenness
- **Community detection**: WCC, Label Propagation (CDLP)

Neo4j GDS adds many more algorithms that users expect. The following are strong candidates for read-only extensions (streaming mode only).

### 3.1 Additional Centrality Measures

Popular centrality algorithms in GDS:

- Degree centrality
- Closeness centrality
- Eigenvector centrality
- Harmonic centrality

FalkorDB currently provides `indegree` / `outdegree` functions, but not algorithms that compute centrality scores for all nodes.

**Proposed Flex/Algo API (read-only streaming)**

- `CALL algo.degreeCentrality.stream(config) YIELD node, score`
- `CALL algo.closenessCentrality.stream(config) YIELD node, score`
- `CALL algo.eigenvectorCentrality.stream(config) YIELD node, score`

### 3.2 More Community / Clustering Algorithms

Widely used in GDS:

- Louvain (modularity-based community detection)
- (Later phases: Leiden, k-means, etc.)

FalkorDB today: WCC and label propagation.

**Proposed Flex/Algo API**

- `CALL algo.louvain.stream(config) YIELD node, communityId, score`
  - Alternatively, namespaced as `flex.gds.louvain.stream`.

### 3.3 Graph-Based Similarity & Link Prediction

Relevant GDS capabilities:

- `gds.nodeSimilarity.*` (similarity based on graph neighborhoods)
- KNN / cosine similarity over projected graphs
- Link prediction algorithms

FalkorDB today:

- Vector similarity (`vec.euclideanDistance`, `vec.cosineDistance`) and vector indexes
- Flex proposal: Jaccard/overlap on property lists (not graph neighborhoods)

**Gaps**

- No node similarity based on graph structure (e.g., Jaccard over neighbor sets)
- No built-in link prediction algorithms

**Proposed Flex/Algo API**

- `CALL algo.nodeSimilarity.stream(config) YIELD node1, node2, similarity`
  - Implement simple neighborhood-based similarity (e.g., Jaccard / cosine on adjacency).
- (Later) Basic link prediction scores as separate procedures.

### 3.4 Embedding Algorithms (Later Phase)

GDS provides:

- Node embedding algorithms (e.g., FastRP, Node2Vec)

FalkorDB today:

- Supports vector indexes over external embeddings
- No graph-native embedding algorithms

These are high value for ML workflows but higher effort; recommended as a separate, later phase of Flex/Algo evolution.

## 4. Prioritized Roadmap for Read-Only Flex

To align with the most popular Neo4j APOC/GDS read-only features that FalkorDB currently lacks, a pragmatic rollout order is:

1. **Date/time utilities**
   - `flex.date.parse/format/truncate/toTimeZone`

2. **JSON & map utilities**
   - `flex.json.fromJson*`, `flex.json.toJson`
   - `flex.map.merge/submap/removeKeys`

3. **Collection helpers**
   - `flex.coll.union/subtract/flatten/containsAll/containsAny`

4. **Richer text utilities**
   - `flex.text.split/join/regexGroups/replaceRegex/urlEncode/urlDecode/base64*`

5. **Configurable path exploration**
   - `flex.path.expand`, `flex.path.subgraphNodes`, `flex.path.subgraphAll`

6. **Additional centrality & community algorithms**
   - Degree/closeness/eigenvector centrality, Louvain community detection

7. **Graph-based node similarity**
   - `algo.nodeSimilarity.stream`-style procedure over neighborhoods

8. **Optional later-phase items**
   - Dynamic Cypher execution: `flex.cypher.run`
   - Graph-native embedding algorithms

This scope gives Flex a focused, high-impact read-only surface that covers the bulk of everyday APOC/GDS usage while staying incremental and implementable.
