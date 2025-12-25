# FLEX (FalkorDB Library for EXtensions)

![FLEX Status](https://img.shields.io/badge/status-active-success.svg) ![FalkorDB Version](https://img.shields.io/badge/FalkorDB-0.1.0+-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg)

**FLEX** is the standard utility library for [FalkorDB](https://falkordb.com), serving as a powerful companion to the core database. 

FLEX bridges the gap between basic graph queries and complex real-world application logic. It leverages QuickJS engine, meaning all extensions are written in **pure JavaScript**. For ease of extensibility, and massive ecosystem compatibility.

## 🚀 Why FLEX?

* **Comprehensive:** Over 41 functions covering string manipulation, collections, dates, and similarity metrics.
* **Fast:** Runs directly inside FalkorDB's embedded QuickJS engine, minimizing data movement.
* **Familiar:** If you know JavaScript, you can read, understand, and extend the source code.
* **Production Ready:** Includes similarity metrics and text processing tools for real-world applications.

---

## 📦 Installation & Loading

FLEX is a collection of User Defined Functions (UDFs). You can load the entire library into your FalkorDB instance using the standard `GRAPH.UDF LOAD` command via `redis-cli` or any FalkorDB client.

### Using the CLI Loader

```bash
# Clone the repository
git clone https://github.com/FalkorDB/flex.git
cd flex

# Build the library
npm run build

# Load into your FalkorDB instance
redis-cli -h<host> -p<port> GRAPH.UDF LOAD flex "$(cat dist/flex.js)"
```

📚 Function Categories
FLEX is organized into modular namespaces to keep your namespace clean.

| Category             | Namespace       | Description                                                        |
| :---                 | :---            | :---                                                               |
| **String Utilities** | `flex.text.*`   | Regex, casing, formatting, and text manipulation.                  |
| **Collections**      | `flex.coll.*`   | Set operations, shuffling, and list transformations.               |
| **Maps**             | `flex.map.*`    | Key management, merging, and object manipulation.                  |
| **JSON**             | `flex.json.*`   | Safe JSON parse/serialize helpers for maps and lists.              |
| **Similarity**       | `flex.sim.*`    | Jaccard index, Jaro-Winkler, and Levenshtein distance.             |
| **Temporal**         | `flex.date.*`   | Date formatting, parsing, truncation, and timezone conversion.     |
| **Bitwise**          | `flex.bitwise.*`| Low-level bitwise operations on integers.                          |


💡 Usage Examples
1. Fuzzy Search with Levenshtein Distance
Find users with names similar to "Sarah" using a threshold.


```cypher
MATCH (u:User)
WHERE flex.sim.levenshtein(u.name, "Sarah") <= 2
RETURN u.name, u.email
```

2. Fuzzy Name Matching with Jaro-Winkler
Find users with names similar to "Sarah" using Jaro-Winkler similarity.

```cypher
MATCH (u:User)
WHERE flex.sim.jaroWinkler(u.name, "Sarah") > 0.85
RETURN u.name, u.email
ORDER BY flex.sim.jaroWinkler(u.name, "Sarah") DESC
```

3. Data Cleaning & Normalization
Clean messy input data during ingestion.

```cypher
UNWIND $events AS event
CREATE (e:Event {
    name: flex.text.camelCase(event.raw_name),
    tags: flex.coll.union(event.tags, []), // Union with empty array removes duplicates
    timestamp: flex.date.parse(event.date_str, "YYYY-MM-DD")
})
```

4. JSON & Map Utilities
Safely ingest semi-structured JSON and normalize maps.

```cypher
WITH '{"id": 1, "name": "Alice", "extra": {"foo": 1}}' AS payload
WITH flex.json.fromJsonMap(payload) AS m
RETURN flex.map.submap(m, ['id','name'])      AS core,
       flex.map.merge(m.extra, {bar: 2})      AS merged_extra,
       flex.json.toJson(m)                    AS raw_json;
```

## 📖 Documentation

Complete documentation for all FLEX functions is available in the [docs/](./docs) directory.

- **[Function Reference](./docs/README.md)** - Complete index of all 41+ functions
- **[Standard Template](./docs/TEMPLATE.md)** - Documentation format for contributors

Each function is documented with:
- Clear description and syntax
- Parameter details and return types
- Practical examples with output
- Edge cases and notes
- Related function references

Browse by category:
- [Similarity Functions](./docs/README.md#similarity-functions-flexsim) - Fuzzy matching and distance metrics
- [Text Functions](./docs/README.md#text-functions-flextext) - String manipulation and formatting
- [Collection Functions](./docs/README.md#collection-functions-flexcoll) - List and set operations
- [Map Functions](./docs/README.md#map-functions-flexmap) - Object manipulation
- [JSON Functions](./docs/README.md#json-functions-flexjson) - Serialization and parsing
- [Date Functions](./docs/README.md#date-functions-flexdate) - Date/time manipulation
- [Bitwise Functions](./docs/README.md#bitwise-functions-flexbitwise) - Low-level bit operations

## 🛠️ Building & Contributing

We welcome contributions! FLEX is designed to be easily extensible.

### Prerequisites
- Node.js (for testing)
- FalkorDB instance (Docker container recommended)

### Adding a New Function
1. Create a new JS file in `src/` or add to an existing module
2. Implement your function in standard JavaScript
3. Add a test case in `tests/`
4. **Document your function** following the [standard template](./docs/TEMPLATE.md)

```javascript
// src/math.js example
exports.square = function(x) {
    return x * x;
};
```

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
