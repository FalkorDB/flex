/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Compute Levenshtein edit distance between two strings.
 *
 * @param {string|null} a
 * @param {string|null} b
 * @returns {number}
 */
function levenshtein(a, b) {
    // Handle null / undefined
    if (a == null) a = "";
    if (b == null) b = "";

    // Convert to strings (defensive for FLEX usage)
    a = String(a);
    b = String(b);

    const lenA = a.length;
    const lenB = b.length;

    // Fast paths
    if (lenA === 0) return lenB;
    if (lenB === 0) return lenA;
    if (a === b) return 0;

    // Ensure we use less memory: b is the shorter string
    if (lenA < lenB) {
        [a, b] = [b, a];
    }

    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);

    // Initial row
    for (let j = 0; j <= b.length; j++) {
        prev[j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        const charA = a.charCodeAt(i - 1);

        for (let j = 1; j <= b.length; j++) {
            const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;

            curr[j] = Math.min(
                prev[j] + 1,        // deletion
                curr[j - 1] + 1,    // insertion
                prev[j - 1] + cost  // substitution
            );
        }

        // Swap buffers
        for (let j = 0; j <= b.length; j++) {
            prev[j] = curr[j];
        }
    }

    return prev[b.length];
}

falkor.register('sim.levenshtein', levenshtein);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        levenshtein
    };
}
