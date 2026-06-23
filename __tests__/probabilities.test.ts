import { probPerfect, probRandom, computeProbHistory, biggestSwingPly } from '../src/analysis';
import { Board, EMPTY_BOARD } from '../src/game';

function board(cells: readonly ('X' | 'O' | null)[]): Board {
  expect(cells).toHaveLength(9);
  return Object.freeze([...cells]);
}

describe('probability: vs perfect play', () => {
  it('forced X win position returns P(X)=1', () => {
    // X to move with a 1-move win
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    const p = probPerfect(b, 'X');
    expect(p.pX).toBe(1);
    expect(p.pO).toBe(0);
    expect(p.pDraw).toBe(0);
  });

  it('drawn-with-best-play empty board returns P(draw)=1', () => {
    const p = probPerfect(EMPTY_BOARD, 'X');
    expect(p.pDraw).toBe(1);
  });

  it('terminal won board returns winner = 1', () => {
    const won = board(['X', 'X', 'X', 'O', 'O', null, null, null, null]);
    const p = probPerfect(won, 'O');
    expect(p.pX).toBe(1);
  });
});

describe('probability: vs random play', () => {
  it('rollout probabilities sum to ~1', () => {
    const p = probRandom(EMPTY_BOARD, 'X', { rollouts: 50, rng: makeRng(42) });
    expect(Math.abs(p.pX + p.pO + p.pDraw - 1)).toBeLessThan(1e-9);
  });

  it('near-certain X-win position skews to P(X)≈1', () => {
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    const p = probRandom(b, 'X', { rollouts: 100, rng: makeRng(7) });
    expect(p.pX).toBeGreaterThan(0.95);
  });

  it('respects cancellation', () => {
    let calls = 0;
    const p = probRandom(EMPTY_BOARD, 'X', {
      rollouts: 1000,
      rng: makeRng(1),
      shouldCancel: () => {
        calls++;
        return calls > 5;
      },
    });
    expect(p.ran).toBeLessThan(1000);
  });
});

describe('computeProbHistory + biggestSwingPly', () => {
  it('produces one entry per ply for perfect mode', () => {
    const moves = [
      { cell: 0 as const, mark: 'X' as const },
      { cell: 4 as const, mark: 'O' as const },
    ];
    const h = computeProbHistory(moves, 'perfect');
    expect(h).toHaveLength(3);
  });

  it('biggestSwingPly returns a sensible ply when probs change', () => {
    const h = [
      { ply: 0, pX: 0, pO: 0, pDraw: 1 },
      { ply: 1, pX: 0.1, pO: 0.1, pDraw: 0.8 },
      { ply: 2, pX: 1, pO: 0, pDraw: 0 }, // huge swing
    ];
    expect(biggestSwingPly(h)).toBe(2);
  });
});

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0x10000;
  };
}
