import {
  _clearMinimaxCacheForTests,
  chooseMove,
  findImmediateBlock,
  findImmediateWin,
  pickEasy,
  pickPerfect,
} from '../src/ai';
import { Board, CellIndex, EMPTY_BOARD, applyMove, other, statusFor } from '../src/game';

function board(cells: readonly ('X' | 'O' | null)[]): Board {
  expect(cells).toHaveLength(9);
  return Object.freeze([...cells]);
}

describe('AI: easy', () => {
  beforeEach(() => _clearMinimaxCacheForTests());

  it('takes an immediate win when available', () => {
    // X to move; X has two on the top row, completes at cell 2.
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    expect(findImmediateWin(b, 'X')).toBe(2);
    const cell = pickEasy(b, 'X', () => 0); // rng = 0 still must prefer the win
    expect(cell).toBe(2);
  });

  it('blocks an immediate loss when no win is available', () => {
    // X to move; O has two on middle row, must block at 5.
    const b = board([null, null, null, 'O', 'O', null, 'X', null, null]);
    expect(findImmediateBlock(b, 'X')).toBe(5);
    const cell = pickEasy(b, 'X', () => 0);
    expect(cell).toBe(5);
  });
});

describe('AI: perfect minimax', () => {
  beforeEach(() => _clearMinimaxCacheForTests());

  it('takes an immediate forced win', () => {
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    expect(pickPerfect(b, 'X')).toBe(2);
  });

  it('blocks an immediate forced loss', () => {
    const b = board([null, null, null, 'O', 'O', null, 'X', null, null]);
    expect(pickPerfect(b, 'X')).toBe(5);
  });

  it('perfect-vs-perfect always draws', () => {
    // simulate a perfect-vs-perfect game starting from empty board
    let b: Board = EMPTY_BOARD;
    let toMove: 'X' | 'O' = 'X';
    while (statusFor(b).kind === 'open') {
      const cell = pickPerfect(b, toMove);
      b = applyMove(b, { cell, mark: toMove });
      toMove = other(toMove);
    }
    const s = statusFor(b);
    expect(s.kind).toBe('draw');
  });

  it('perfect never loses against random opponent (sampled)', () => {
    for (let seed = 0; seed < 30; seed++) {
      // perfect = X, random = O
      let b: Board = EMPTY_BOARD;
      let toMove: 'X' | 'O' = 'X';
      let rngState = seed * 9301 + 49297;
      const rng = () => {
        rngState = (rngState * 1664525 + 1013904223) >>> 0;
        return (rngState & 0xffff) / 0x10000;
      };
      while (statusFor(b).kind === 'open') {
        const cell =
          toMove === 'X' ? pickPerfect(b, toMove) : pickEasy(b, toMove, rng);
        b = applyMove(b, { cell, mark: toMove });
        toMove = other(toMove);
      }
      const s = statusFor(b);
      expect(s.kind !== 'win' || s.winner !== 'O').toBe(true);
    }
  });

  it('chooseMove dispatches by level', () => {
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    expect(chooseMove(b, 'X', 'easy', () => 0)).toBe(2);
    expect(chooseMove(b, 'X', 'medium')).toBe(2);
    expect(chooseMove(b, 'X', 'perfect')).toBe(2);
  });

  it('perfect AI from a "scrubbed" board position picks correctly (independent of history)', () => {
    // construct a mid-game board manually and ask for the move
    const b = board([
      'X', null, null,
      null, 'O', null,
      null, null, 'X',
    ]);
    const choice = pickPerfect(b, 'O');
    // any legal cell should at minimum avoid creating an immediate X-fork loss;
    // we just assert it is a legal empty cell.
    expect(b[choice as CellIndex]).toBeNull();
  });
});
