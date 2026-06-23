import { Board, CellIndex, Mark, applyMove, emptyCells, other, statusFor } from '../game';

export type AiLevel = 'easy' | 'medium' | 'perfect';

/** Outcome score from the perspective of `forMark`: +1 win, 0 draw, -1 loss. */
export type Score = -1 | 0 | 1;

interface MinimaxResult {
  readonly score: Score;
  readonly bestCell: CellIndex | null;
  /** Depth to reach the outcome — used to prefer faster wins and slower losses. */
  readonly depth: number;
}

/**
 * Canonical key for a board state including whose turn it is.
 * (We do NOT bother canonicalizing symmetry — the table is already tiny (<6k entries)
 * and this keeps the code simpler and easier to audit.)
 */
function key(board: Board, toMove: Mark): string {
  let s = '';
  for (const c of board) s += c === null ? '.' : c;
  return `${s}|${toMove}`;
}

const cache = new Map<string, MinimaxResult>();

/** For tests. */
export function _clearMinimaxCacheForTests(): void {
  cache.clear();
}

/** Returns the full minimax evaluation for the side to move, with best cell. */
export function minimax(board: Board, toMove: Mark, forMark: Mark, depth = 0): MinimaxResult {
  const status = statusFor(board);
  if (status.kind === 'win') {
    const score: Score = status.winner === forMark ? 1 : -1;
    return { score, bestCell: null, depth };
  }
  if (status.kind === 'draw') {
    return { score: 0, bestCell: null, depth };
  }

  const k = key(board, toMove);
  const cached = cache.get(k);
  if (cached) {
    return { ...cached, depth: depth + cached.depth };
  }

  const maximizing = toMove === forMark;
  let bestScore: Score = maximizing ? -1 : 1;
  let bestCell: CellIndex | null = null;
  let bestDepth = Infinity;

  for (const cell of emptyCells(board)) {
    const child = applyMove(board, { cell, mark: toMove });
    const sub = minimax(child, other(toMove), forMark, depth + 1);
    const subScore = sub.score;
    const subDepth = sub.depth;

    if (bestCell === null) {
      bestScore = subScore;
      bestCell = cell;
      bestDepth = subDepth;
      continue;
    }

    if (maximizing) {
      // Prefer higher score; on ties, prefer shorter path to win, longer path to loss.
      if (subScore > bestScore) {
        bestScore = subScore;
        bestCell = cell;
        bestDepth = subDepth;
      } else if (subScore === bestScore) {
        const preferShorter = bestScore >= 0;
        if (preferShorter ? subDepth < bestDepth : subDepth > bestDepth) {
          bestCell = cell;
          bestDepth = subDepth;
        }
      }
    } else {
      if (subScore < bestScore) {
        bestScore = subScore;
        bestCell = cell;
        bestDepth = subDepth;
      } else if (subScore === bestScore) {
        const preferShorter = bestScore <= 0;
        if (preferShorter ? subDepth < bestDepth : subDepth > bestDepth) {
          bestCell = cell;
          bestDepth = subDepth;
        }
      }
    }
  }

  const result: MinimaxResult = { score: bestScore, bestCell, depth: bestDepth };
  // Store the relative-depth result (depth offset removed) so cache is position-only.
  cache.set(k, { score: bestScore, bestCell, depth: bestDepth - depth });
  return result;
}

/** Exact outcome assuming both sides play optimally from `board`, side to move = `toMove`. */
export function exactOutcome(
  board: Board,
  toMove: Mark,
): { result: 'X' | 'O' | 'draw' } {
  const s = statusFor(board);
  if (s.kind === 'win') return { result: s.winner };
  if (s.kind === 'draw') return { result: 'draw' };
  const xRes = minimax(board, toMove, 'X');
  if (xRes.score === 1) return { result: 'X' };
  if (xRes.score === -1) return { result: 'O' };
  return { result: 'draw' };
}
