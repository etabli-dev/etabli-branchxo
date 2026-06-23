import {
  Board,
  CellIndex,
  Mark,
  applyMove,
  emptyCells,
  findWinLine,
  other,
} from '../game';
import { strengthFor } from '../overlay/strength';
import { AiLevel, minimax } from './minimax';

/** Returns a cell that creates an immediate win for `mark`, or null. */
export function findImmediateWin(board: Board, mark: Mark): CellIndex | null {
  for (const cell of emptyCells(board)) {
    const next = applyMove(board, { cell, mark });
    const win = findWinLine(next);
    if (win && win.winner === mark) return cell;
  }
  return null;
}

/** Returns a cell that blocks an immediate win by the opponent of `mark`, or null. */
export function findImmediateBlock(board: Board, mark: Mark): CellIndex | null {
  return findImmediateWin(board, other(mark));
}

/** Deterministic-when-given-rng `easy` AI: random legal, but takes wins / blocks. */
export function pickEasy(
  board: Board,
  mark: Mark,
  rng: () => number = Math.random,
): CellIndex {
  const win = findImmediateWin(board, mark);
  if (win !== null) return win;
  const block = findImmediateBlock(board, mark);
  if (block !== null) return block;
  const empties = emptyCells(board);
  if (empties.length === 0) throw new Error('No legal moves');
  const idx = Math.floor(rng() * empties.length);
  const safe = Math.min(idx, empties.length - 1);
  const pick = empties[safe];
  if (pick === undefined) throw new Error('No legal moves');
  return pick;
}

/** `medium` AI: pick max strength using overlay heuristic. */
export function pickMedium(board: Board, mark: Mark): CellIndex {
  const empties = emptyCells(board);
  if (empties.length === 0) throw new Error('No legal moves');
  let best: CellIndex = empties[0] as CellIndex;
  let bestScore = -Infinity;
  for (const cell of empties) {
    const s = strengthFor(board, cell, mark);
    if (s > bestScore) {
      bestScore = s;
      best = cell;
    }
  }
  return best;
}

/** `perfect` AI: full minimax. */
export function pickPerfect(board: Board, mark: Mark): CellIndex {
  const res = minimax(board, mark, mark);
  if (res.bestCell === null) {
    const empties = emptyCells(board);
    const fallback = empties[0];
    if (fallback === undefined) throw new Error('No legal moves');
    return fallback;
  }
  return res.bestCell;
}

/** Dispatch by level. */
export function chooseMove(
  board: Board,
  mark: Mark,
  level: AiLevel,
  rng: () => number = Math.random,
): CellIndex {
  switch (level) {
    case 'easy':
      return pickEasy(board, mark, rng);
    case 'medium':
      return pickMedium(board, mark);
    case 'perfect':
      return pickPerfect(board, mark);
  }
}
