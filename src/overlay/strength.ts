import { Board, CellIndex, Mark, WIN_LINES, emptyCells, other } from '../game';

/**
 * Computes the "strength" of placing `mark` at `cell` on `board`.
 *
 * For each of the (up to 4) winning lines passing through `cell`:
 *   - count my marks (k) and opponent marks (m) on the OTHER two cells.
 *   - line type:
 *       only mine (m=0): w_offense = 10^k  (k ∈ {0,1,2})
 *       only opp (k=0):  w_defense = 10^m * 0.9
 *       mixed (k>0 && m>0): 0
 *       fully empty (k=0,m=0): 1 (centrality)
 *
 * Note: we DON'T count the candidate cell itself in k/m (since we're asking
 * "what is currently on the line excluding the empty cell I'm thinking of placing
 * into"). This gives:
 *   - if my two other cells on a line are mine → k=2, m=0 → 100  (completes win)
 *   - if opp has two other cells on a line → k=0, m=2 → 90      (blocks loss)
 *   - if I have one other on the line → k=1 → 10                 (builds threat)
 *   - empty line → 1                                              (centrality)
 */
export function strengthFor(board: Board, cell: CellIndex, mark: Mark): number {
  if (board[cell] !== null) return 0;
  const opp = other(mark);
  let total = 0;
  for (const line of WIN_LINES) {
    if (line[0] !== cell && line[1] !== cell && line[2] !== cell) continue;
    let k = 0;
    let m = 0;
    for (const idx of line) {
      if (idx === cell) continue;
      const v = board[idx];
      if (v === mark) k++;
      else if (v === opp) m++;
    }
    if (k > 0 && m > 0) {
      total += 0;
    } else if (k > 0) {
      total += Math.pow(10, k);
    } else if (m > 0) {
      total += Math.pow(10, m) * 0.9;
    } else {
      total += 1;
    }
  }
  return total;
}

export interface StrengthEntry {
  readonly cell: CellIndex;
  readonly score: number;
}

/** Returns every empty cell with its strength, sorted descending. */
export function rankedStrengths(board: Board, mark: Mark): readonly StrengthEntry[] {
  return emptyCells(board)
    .map((cell) => ({ cell, score: strengthFor(board, cell, mark) }))
    .sort((a, b) => b.score - a.score);
}

/** Top-N entries (default 3). */
export function topN(board: Board, mark: Mark, n = 3): readonly StrengthEntry[] {
  return rankedStrengths(board, mark).slice(0, n);
}

/** Normalize scores to [0,1] for heat shading. */
export function normalizedStrengths(
  board: Board,
  mark: Mark,
): readonly (StrengthEntry & { norm: number })[] {
  const raw = rankedStrengths(board, mark);
  if (raw.length === 0) return [];
  let max = 0;
  for (const r of raw) if (r.score > max) max = r.score;
  return raw.map((r) => ({ ...r, norm: max <= 0 ? 0 : r.score / max }));
}
