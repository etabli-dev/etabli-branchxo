import { assertTreeInvariants, createInitialTree, fullMoves, playOrFork } from '../src/multiverse';

describe('saved tree validation', () => {
  it('checks root boards and status, not just child branches', () => {
    const tree = createInitialTree();
    const root = tree.universes[tree.rootId]!;
    expect(() => assertTreeInvariants({ ...tree, universes: {
      [root.id]: { ...root, board: ['X', null, null, null, null, null, null, null, null] },
    } })).toThrow(/board mismatch/);
    expect(() => assertTreeInvariants({ ...tree, universes: {
      [root.id]: { ...root, status: { kind: 'draw' } },
    } })).toThrow(/status mismatch/);
  });
  it('refuses cyclic ancestry without recursive stack exhaustion', () => {
    const tree = createInitialTree();
    const root = tree.universes[tree.rootId]!;
    const corrupt = { ...tree, universes: { [root.id]: { ...root, parentId: root.id } } };
    expect(() => fullMoves(corrupt, root.id)).toThrow('Cyclic universe ancestry');
    expect(() => assertTreeInvariants(corrupt)).toThrow();
  });
  it('accepts a played and forked tree after a JSON round trip', () => {
    let tree = createInitialTree();
    tree = playOrFork(tree, tree.rootId, 0, 4).tree;
    tree = playOrFork(tree, tree.rootId, 1, 0).tree;
    tree = playOrFork(tree, tree.rootId, 1, 8).tree;
    expect(() => assertTreeInvariants(JSON.parse(JSON.stringify(tree)))).not.toThrow();
  });
});
