# FLEX (FalkorDB Library for EXtensions)

![FLEX Status](https://img.shields.io/badge/status-active-success.svg) ![FalkorDB Version](https://img.shields.io/badge/FalkorDB-0.1.0+-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg)

**FLEX** is the standard utility library for [FalkorDB](https://falkordb.com), serving as a powerful companion to the core database. 

FLEX bridges the gap between basic graph queries and complex real-world application logic. It leverages QuickJS engine, meaning all extensions are written in **pure JavaScript**. For ease of extensibility, and massive ecosystem compatibility.

## 🚀 Why FLEX?

* **Comprehensive:** Over 50+ functions covering string manipulation, math, collections, and graph algorithms.
* **Fast:** Runs directly inside FalkorDB's embedded QuickJS engine, minimizing data movement.
* **Familiar:** If you know JavaScript, you can read, understand, and extend the source code.
* **GraphRAG Ready:** Includes vector similarity and text processing tools essential for AI-driven graph applications.

---

## 📦 Installation & Loading

FLEX is a collection of User Defined Functions (UDFs). You can load the entire library into your FalkorDB instance using the standard `GRAPH.UDF LOAD` command via `redis-cli` or any FalkorDB client.

### Using the CLI Loader

```bash
# Clone the repository
git clone https://github.com/FalkorDB/flex.git
cd flex

# Load into your FalkorDB instance
redis-cli -h<host> -p<port> GRAPH.UDF LOAD flex "$(cat src/flex.js)"
```

📚 Function Categories
FLEX is organized into modular namespaces to keep your namespace clean.

Category,         Namespace,   Description
String Utilities, flex.text.*, Regex, casing, fuzzy matching, and text cleaning.
Collections,      flex.coll.*, Set operations, flattening, shuffling, and list partitioning.
Maps,             flex.map.*,  Deep merging, key management, and JSON manipulation.
Similarity,       flex.sim.*,  Vector cosine similarity, Jaccard index, and Levenshtein distance.
Math & Stats,     flex.math.*, Percentiles, standard deviation, and random generation.
Temporal,         flex.date.*, Date formatting, parsing, and duration arithmetic.
System,           flex.sys.*,  Utilities for pausing execution (sleep) and system introspection.


💡 Usage Examples
1. Fuzzy Search with Levenshtein Distance
Find users with names similar to "Sarah" using a threshold.


```cypher
MATCH (u:User)
WHERE flex.sim.levenshtein(u.name, "Sarah") <= 2
RETURN u.name, u.email
```

2. Vector Similarity (GraphRAG)
Find documents semantically similar to a query vector.

```cypher
WITH [0.05, 0.23, -0.11, ...] AS query_vec
MATCH (d:Document)
WHERE flex.sim.cosine(d.embedding, query_vec) > 0.85
RETURN d.title, d.summary
ORDER BY flex.sim.cosine(d.embedding, query_vec) DESC
```

3. Data Cleaning & Normalization
Clean messy input data during ingestion.

```cypher
UNWIND $events AS event
CREATE (e:Event {
    id: flex.text.randomString(12, 'alphanumeric'),
    name: flex.text.toCamelCase(event.raw_name),
    tags: flex.coll.toSet(event.tags), // Remove duplicates
    timestamp: flex.date.parse(event.date_str, "YYYY-MM-DD")
})
```

🛠️ Building & Contributing
We welcome contributions! FLEX is designed to be easily extensible.

Prerequisites
Node.js (for testing)

FalkorDB instance (Docker container recommended)

Adding a New Function
Create a new JS file in src/ or add to an existing module.

Implement your function in standard JavaScript.

Add a test case in tests/.

```javascript
// src/math.js example
exports.square = function(x) {
    return x * x;
};
```

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
