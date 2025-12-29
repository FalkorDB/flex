/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

/**
 * Jaro-Winkler similarity
 *
 * @param {string|null} s1
 * @param {string|null} s2
 * @returns {number} similarity in range [0, 1]
 */
function jaroWinkler(s1, s2) {
    if (s1 == null) s1 = "";
    if (s2 == null) s2 = "";

    s1 = String(s1);
    s2 = String(s2);

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 && len2 === 0) return 1.0;
    if (len1 === 0 || len2 === 0) return 0.0;
    if (s1 === s2) return 1.0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;

    // Count matches
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, len2);

        for (let j = start; j < end; j++) {
            if (s2Matches[j]) continue;
            if (s1[i] !== s2[j]) continue;

            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let t = 0;
    let k = 0;

    for (let i = 0; i < len1; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) t++;
        k++;
    }

    const transpositions = t / 2;

    // Jaro score
    const jaro =
        (matches / len1 +
         matches / len2 +
         (matches - transpositions) / matches) / 3;

    // Winkler adjustment
    let prefix = 0;
    const maxPrefix = 4;

    for (let i = 0; i < Math.min(maxPrefix, len1, len2); i++) {
        if (s1[i] === s2[i]) prefix++;
        else break;
    }

    const scalingFactor = 0.1;

    return jaro + prefix * scalingFactor * (1 - jaro);
}

falkor.register("text.jaroWinkler", jaroWinkler);

// Conditional Export for Jest
// QuickJS/FalkorDB will ignore this because 'module' is not defined.
// istanbul ignore next
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        jaroWinkler
    };
}
