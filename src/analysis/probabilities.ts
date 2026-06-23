import { exactOutcome } from '../ai/minimax';
import { pickEasy } from '../ai/policies';
import {
  Board,
  EMPTY_BOARD,
  Mark,
  Move,
  applyMove,
  other,
  replay,
  statusFor,
} from '../game';
import { ProbPoint } from '../multiverse';

export type ProbMode = 'perfect' | 'random';

/**
 * Exact probability under optimal play: result is deterministic so probabilities
 * are 0/1 across {X-win, O-win, draw}.
 */
export function probPerfect(board: Board, toMove: Mark): { pX: number; pO: number; pDraw: number } {
  const s = statusFor(board);
  if (s.kind === 'win') {
    return {
      pX: s.winner === 'X' ? 1 : 0,
      pO: s.winner === 'O' ? 1 : 0,
      pDraw: 0,
    };
  }
  if (s.kind === 'draw') return { pX: 0, pO: 0, pDraw: 1 };
  const out = exactOutcome(board, toMove);
  return {
    pX: out.result === 'X' ? 1 : 0,
    pO: out.result === 'O' ? 1 : 0,
    pDraw: out.result === 'draw' ? 1 : 0,
  };
}

/**
 * Random-but-greedy rollouts. Both players choose moves with `pickEasy`
 * (random + take-win + block-loss). Returns observed frequencies.
 *
 * `rng` is provided for deterministic tests.
 * `shouldCancel` is checked between rollouts so the caller can cancel.
 */
export function probRandom(
  board: Board,
  toMove: Mark,
  options?: {
    rollouts?: number;
    rng?: () => number;
    shouldCancel?: () => boolean;
  },
): { pX: number; pO: number; pDraw: number; ran: number } {
  const rollouts = options?.rollouts ?? 300;
  const rng = options?.rng ?? Math.random;
  const shouldCancel = options?.shouldCancel ?? (() => false);

  let x = 0;
  let o = 0;
  let d = 0;
  let ran = 0;

  // short-circuit terminal
  const s = statusFor(board);
  if (s.kind === 'win')
    return {
      pX: s.winner === 'X' ? 1 : 0,
      pO: s.winner === 'O' ? 1 : 0,
      pDraw: 0,
      ran: 0,
    };
  if (s.kind === 'draw') return { pX: 0, pO: 0, pDraw: 1, ran: 0 };

  for (let i = 0; i < rollouts; i++) {
    if (shouldCancel()) break;
    let b: Board = board;
    let m = toMove;
    let st = statusFor(b);
    while (st.kind === 'open') {
      const cell = pickEasy(b, m, rng);
      b = applyMove(b, { cell, mark: m });
      m = other(m);
      st = statusFor(b);
    }
    if (st.kind === 'win') {
      if (st.winner === 'X') x++;
      else o++;
    } else {
      d++;
    }
    ran++;
  }

  const n = Math.max(1, x + o + d);
  return { pX: x / n, pO: o / n, pDraw: d / n, ran };
}

/**
 * Compute the full prob history for a sequence of moves under a given mode.
 * Returns one ProbPoint per ply 0..moves.length.
 */
export function computeProbHistory(
  moves: readonly Move[],
  mode: ProbMode,
  options?: { rollouts?: number; rng?: () => number; shouldCancel?: () => boolean },
): readonly ProbPoint[] {
  const out: ProbPoint[] = [];
  let board: Board = EMPTY_BOARD;
  // ply 0 = empty board, X to move
  let toMove: Mark = 'X';
  for (let i = 0; i <= moves.length; i++) {
    if (options?.shouldCancel?.()) break;
    const p =
      mode === 'perfect'
        ? probPerfect(board, toMove)
        : probRandom(board, toMove, options);
    out.push({ ply: i, pX: p.pX, pO: p.pO, pDraw: p.pDraw });
    const move = moves[i];
    if (!move) break;
    board = applyMove(board, move);
    toMove = other(move.mark);
  }
  return out;
}

/** Identifies the ply with the biggest swing in p(toMoveAtStart wins).
 *  Useful for the "turning point" annotation. Returns null if <2 points. */
export function biggestSwingPly(history: readonly ProbPoint[]): number | null {
  if (history.length < 2) return null;
  let bestPly = 1;
  let bestDelta = -1;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const cur = history[i];
    if (!prev || !cur) continue;
    const d = Math.abs(cur.pX - prev.pX) + Math.abs(cur.pO - prev.pO);
    if (d > bestDelta) {
      bestDelta = d;
      bestPly = cur.ply;
    }
  }
  return bestDelta > 0 ? bestPly : null;
}

/** Re-export replay convenience for charts. */
export { replay };
