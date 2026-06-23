/**
 * Refine-phase invariant test: forks/AI-moves on children never mutate ancestors.
 *
 * Snapshots the entire tree, then performs operations on a child universe and
 * asserts ancestor universes are byte-identical.
 */
import { _clearMinimaxCacheForTests, chooseMove } from '../src/ai';
import { CellIndex } from '../src/game';
import {
  _resetIdCounterForTests,
  appendMove,
  assertTreeInvariants,
  createInitialTree,
  fork,
  fullMoves,
  pathToRoot,
} from '../src/multiverse';

describe('tree invariants under operations', () => {
  beforeEach(() => {
    _resetIdCounterForTests();
    _clearMinimaxCacheForTests();
  });

  it('forks and AI moves in children leave ancestors byte-identical', () => {
    let t = createInitialTree();
    const root = t.rootId;
    t = appendMove(t, root, 4 as CellIndex).tree;
    t = appendMove(t, root, 0 as CellIndex).tree;
    t = appendMove(t, root, 8 as CellIndex).tree;

    const a = fork(t, root, 1, 1 as CellIndex); // X to move? at ply 1 O to move. cell 1.
    t = a.tree;

    const ancestors = pathToRoot(t, a.universe.id).slice(0, -1); // exclude leaf
    const ancestorSnap = JSON.stringify(ancestors);

    // Append several moves & forks in the child line.
    let cur = a.universe.id;
    while (t.universes[cur]?.status.kind === 'open') {
      const u = t.universes[cur];
      if (!u || u.status.kind !== 'open') break;
      const cell = chooseMove(u.board, u.status.toMove, 'perfect');
      const r = appendMove(t, cur, cell);
      t = r.tree;
      cur = r.universe.id;
    }
    // also fork off the child
    const aFull = fullMoves(t, a.universe.id);
    if (aFull.length >= 2) {
      // try a divergent move at ply (aFull.length - 1) on a different empty cell
      const lastBoard = t.universes[cur]?.board;
      if (lastBoard) {
        // try any empty cell different from last move
        for (let c = 0 as CellIndex; c < 9; c = (c + 1) as CellIndex) {
          const v = lastBoard[c];
          if (v === null) {
            // attempt a fork at a mid ply
            try {
              const child = fork(t, a.universe.id, Math.max(1, aFull.length - 2), c);
              t = child.tree;
              break;
            } catch {
              continue;
            }
          }
        }
      }
    }

    assertTreeInvariants(t);

    // Re-fetch ancestors from current tree and compare to snapshot.
    const ancestorsAfter = pathToRoot(t, a.universe.id).slice(0, -1).map((u) => t.universes[u.id]);
    expect(JSON.stringify(ancestorsAfter)).toBe(ancestorSnap);
  });
});
