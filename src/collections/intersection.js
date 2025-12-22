function intersection (a, b) {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}

falkor.register('coll.intersection', intersection);

