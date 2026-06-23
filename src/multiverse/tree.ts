import {
  CellIndex,
  EMPTY_BOARD,
  Mark,
  Move,
  applyMove,
  isLegalMove,
  other,
  replay,
  statusFor,
} from '../game';
import { MultiverseTree, ProbPoint, Universe, UniverseId } from './types';

/* eslint-disable @typescript-eslint/no-use-before-define */

/** Stable, monotonic id generator that does not require crypto. */
let idCounter = 0;
function nextId(prefix = 'u'): UniverseId {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

/** For tests / reset. */
export function _resetIdCounterForTests(): void {
  idCounter = 0;
}

/**
 * Returns the full sequence of moves leading to `universe` from the empty board,
 * walking up to the root and concatenating prefixes correctly.
 */
export function fullMoves(tree: MultiverseTree, universeId: UniverseId): readonly Move[] {
  const u = tree.universes[universeId];
  if (!u) throw new Error(`Unknown universe ${universeId}`);
  if (u.parentId === null) {
    return u.moves;
  }
  const parent = tree.universes[u.parentId];
  if (!parent) throw new Error(`Dangling parent ${u.parentId} for ${universeId}`);
  const parentFull = fullMoves(tree, parent.id);
  return [...parentFull.slice(0, u.parentPly), ...u.moves];
}

/** Reconstruct the board for the given universe by full replay (no caching). */
export function reconstructBoard(tree: MultiverseTree, universeId: UniverseId) {
  return replay(fullMoves(tree, universeId));
}

/** Builds a fresh tree with a single empty root universe. */
export function createInitialTree(): MultiverseTree {
  const root: Universe = {
    id: nextId('root'),
    parentId: null,
    parentPly: 0,
    moves: [],
    board: EMPTY_BOARD,
    status: statusFor(EMPTY_BOARD),
    probHistory: [],
    createdAt: Date.now(),
    label: 'root',
  };
  return {
    rootId: root.id,
    universes: { [root.id]: root },
  };
}

/** Returns true if `move` is the same cell as the next move that would have been
 * played in the parent's timeline at `parentPly` (i.e. the user "redid" history). */
function isSameAsExistingNextMove(
  tree: MultiverseTree,
  universeId: UniverseId,
  atPly: number,
  candidate: Move,
): boolean {
  const u = tree.universes[universeId];
  if (!u) return false;
  const full = fullMoves(tree, universeId);
  const existing = full[atPly];
  if (!existing) return false;
  return existing.cell === candidate.cell && existing.mark === candidate.mark;
}

/** Append a forward move in the active universe (no scrubbing, no branching). */
export function appendMove(
  tree: MultiverseTree,
  universeId: UniverseId,
  cell: CellIndex,
): { tree: MultiverseTree; universe: Universe } {
  const u = tree.universes[universeId];
  if (!u) throw new Error(`Unknown universe ${universeId}`);
  if (u.status.kind !== 'open') {
    throw new Error('Cannot move in a terminal universe');
  }
  const mark: Mark = u.status.toMove;
  if (!isLegalMove(u.board, cell)) {
    throw new Error(`Illegal cell ${cell}`);
  }
  const move: Move = { cell, mark };
  const nextBoard = applyMove(u.board, move);
  const nextStatus = statusFor(nextBoard);
  const updated: Universe = {
    ...u,
    moves: [...u.moves, move],
    board: nextBoard,
    status: nextStatus,
  };
  return {
    tree: {
      ...tree,
      universes: { ...tree.universes, [u.id]: updated },
    },
    universe: updated,
  };
}

/**
 * Fork from universe `parentId` at `atPly` (0..fullMoves.length-1), playing a
 * DIFFERENT `cell` than was originally played. Creates a new child universe
 * containing only its own divergent move(s). The parent is left untouched.
 *
 * If `atPly === fullMoves(parent).length`, this is just a forward extension and we
 * still create a child (this is the "fork from current ply" / what-if branch case).
 */
export function fork(
  tree: MultiverseTree,
  parentId: UniverseId,
  atPly: number,
  cell: CellIndex,
  label?: string,
): { tree: MultiverseTree; universe: Universe } {
  const parent = tree.universes[parentId];
  if (!parent) throw new Error(`Unknown parent universe ${parentId}`);

  const parentFull = fullMoves(tree, parentId);
  if (atPly < 0 || atPly > parentFull.length) {
    throw new Error(`Invalid parentPly ${atPly} (parent has ${parentFull.length} plies)`);
  }

  // Replay parent's prefix to derive the board at the fork point and who is to move.
  const prefix = parentFull.slice(0, atPly);
  const prefixBoard = replay(prefix);
  const prefixStatus = statusFor(prefixBoard);
  if (prefixStatus.kind !== 'open') {
    throw new Error('Cannot branch past a terminal position');
  }
  if (prefixBoard[cell] !== null) {
    throw new Error(`Cannot fork onto occupied cell ${cell}`);
  }
  const mark = prefixStatus.toMove;
  const move: Move = { cell, mark };

  // Sanity: if the divergent move is identical to what was already played, do not fork.
  if (isSameAsExistingNextMove(tree, parentId, atPly, move)) {
    throw new Error('Fork move is identical to the existing next move (not a divergence)');
  }

  const childBoard = applyMove(prefixBoard, move);
  const childStatus = statusFor(childBoard);

  const child: Universe = {
    id: nextId('u'),
    parentId,
    parentPly: atPly,
    moves: [move],
    board: childBoard,
    status: childStatus,
    probHistory: [],
    createdAt: Date.now(),
    label: label ?? `branch ${Object.keys(tree.universes).length + 1}`,
  };

  return {
    tree: {
      ...tree,
      universes: { ...tree.universes, [child.id]: child },
    },
    universe: child,
  };
}

/**
 * High-level "play at active universe with optional scrub" helper used by the UI.
 *
 * - If `scrubPly === fullMoves(active).length`, simply appendMove on active.
 * - If `scrubPly < fullMoves(active).length` AND the cell would be the same move as
 *   what was originally played → this is a redo, return active untouched.
 * - Otherwise (different cell at a past ply) → fork from active at scrubPly.
 */
export function playOrFork(
  tree: MultiverseTree,
  activeId: UniverseId,
  scrubPly: number,
  cell: CellIndex,
): { tree: MultiverseTree; universe: Universe; forked: boolean } {
  const active = tree.universes[activeId];
  if (!active) throw new Error(`Unknown active universe ${activeId}`);
  const full = fullMoves(tree, activeId);

  if (scrubPly === full.length) {
    const res = appendMove(tree, activeId, cell);
    return { ...res, forked: false };
  }
  // scrubbed back in time
  const existing = full[scrubPly];
  if (existing && existing.cell === cell) {
    return { tree, universe: active, forked: false };
  }
  const res = fork(tree, activeId, scrubPly, cell);
  return { ...res, forked: true };
}

/** Append a probability snapshot to a universe (immutable update). */
export function appendProb(
  tree: MultiverseTree,
  universeId: UniverseId,
  point: ProbPoint,
): MultiverseTree {
  const u = tree.universes[universeId];
  if (!u) return tree;
  // skip dupes by ply
  if (u.probHistory.some((p) => p.ply === point.ply)) return tree;
  const updated: Universe = { ...u, probHistory: [...u.probHistory, point] };
  return { ...tree, universes: { ...tree.universes, [u.id]: updated } };
}

/** Returns immediate children of a universe. */
export function childrenOf(tree: MultiverseTree, universeId: UniverseId): readonly Universe[] {
  return Object.values(tree.universes).filter((u) => u.parentId === universeId);
}

/** Returns the chain root → ...ancestors → universe. */
export function pathToRoot(tree: MultiverseTree, universeId: UniverseId): readonly Universe[] {
  const out: Universe[] = [];
  let cur: Universe | undefined = tree.universes[universeId];
  while (cur) {
    out.push(cur);
    cur = cur.parentId === null ? undefined : tree.universes[cur.parentId];
  }
  return out.reverse();
}

/**
 * Summary of outcomes across the entire multiverse.
 * Counts each universe (node) once.
 */
export interface MultiverseSummary {
  readonly xWins: number;
  readonly oWins: number;
  readonly draws: number;
  readonly open: number;
  readonly total: number;
}

export function summarize(tree: MultiverseTree): MultiverseSummary {
  let xWins = 0;
  let oWins = 0;
  let draws = 0;
  let open = 0;
  const all = Object.values(tree.universes);
  for (const u of all) {
    if (u.status.kind === 'win') {
      if (u.status.winner === 'X') xWins++;
      else oWins++;
    } else if (u.status.kind === 'draw') {
      draws++;
    } else {
      open++;
    }
  }
  return { xWins, oWins, draws, open, total: all.length };
}

/** Invariant check: each non-root universe's prefix (parent path up to parentPly) is consistent. */
export function assertTreeInvariants(tree: MultiverseTree): void {
  for (const u of Object.values(tree.universes)) {
    if (u.parentId === null) {
      if (u.parentPly !== 0) throw new Error(`Root ${u.id} has parentPly != 0`);
      continue;
    }
    const parent = tree.universes[u.parentId];
    if (!parent) throw new Error(`Universe ${u.id} has missing parent ${u.parentId}`);
    const parentFull = fullMoves(tree, parent.id);
    if (u.parentPly < 0 || u.parentPly > parentFull.length) {
      throw new Error(`Universe ${u.id} parentPly out of range`);
    }
    const reconstructed = replay([...parentFull.slice(0, u.parentPly), ...u.moves]);
    for (let i = 0; i < 9; i++) {
      if (reconstructed[i] !== u.board[i]) {
        throw new Error(`Universe ${u.id} board mismatch at cell ${i}`);
      }
    }
  }
}

/** Friendly helper for `other(mark)` re-export used by UI. */
export const opponent = other;
