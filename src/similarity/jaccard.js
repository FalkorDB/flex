function jaccard(n, m) {
    const nIds = n.getNeighbors().map(x => x.id);
    const mIds = m.getNeighbors().map(x => x.id);

    const unionSize = union(nIds, mIds).length;
    const intersectionSize = intersection(nIds, mIds).length;

    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

falkor.register('sim.jaccard', jaccard);
