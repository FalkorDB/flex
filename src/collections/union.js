/*
 * Copyright FalkorDB Ltd. 2023 - present
 */

function union (a, b) {
  return [...new Set([...a, ...b])];
}

falkor.register('coll.union', union);

