function union (a, b) {
  return [...new Set([...a, ...b])];
}

function intersection (a, b) {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}

falkor.register('union', union);
falkor.register('intersection', intersection);
