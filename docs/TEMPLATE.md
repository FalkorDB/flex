# Function Name

## Description
A clear, concise description of what the function does.

## Syntax
```cypher
namespace.functionName(param1, param2, ...)
```

## Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param1` | type | Yes/No | Description of parameter |
| `param2` | type | Yes/No | Description of parameter |

## Returns
**Type:** Return type

Description of the return value.

## Examples

### Example 1: Basic Usage
```cypher
// Description of what this example demonstrates
RETURN namespace.functionName(arg1, arg2) AS result
```

**Output:**
```
result
------
value
```

### Example 2: Real-world Use Case
```cypher
// Description of practical scenario
MATCH (n:Node)
WHERE namespace.functionName(n.property, value) > threshold
RETURN n
```

## Notes
- Important behavior details
- Edge cases and special handling
- Performance considerations (if relevant)

## See Also
- [Related Function 1](./related-function.md)
- [Related Function 2](./related-function.md)
