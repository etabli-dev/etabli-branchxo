import {
  Board,
  CellIndex,
  EMPTY_BOARD,
  WIN_LINES,
  applyMove,
  emptyCells,
  findWinLine,
  inferToMove,
  isLegalMove,
  replay,
  statusFor,
} from '../src/game';

function boardFrom(cells: readonly ('X' | 'O' | null)[]): Board {
  expect(cells).toHaveLength(9);
  return Object.freeze([...cells]);
}

describe('engine: win detection', () => {
  it('detects each of the 8 win lines for X and for O', () => {
    for (const line of WIN_LINES) {
      for (const mark of ['X', 'O'] as const) {
        const b: ('X' | 'O' | null)[] = Array(9).fill(null);
        b[line[0]] = mark;
        b[line[1]] = mark;
        b[line[2]] = mark;
        const r = findWinLine(boardFrom(b));
        expect(r).not.toBeNull();
        expect(r?.winner).toBe(mark);
        expect(r?.line).toEqual(line);
      }
    }
  });

  it('does NOT report a win on two-in-a-row with a gap', () => {
    const b = boardFrom(['X', 'X', null, null, null, null, null, null, null]);
    expect(findWinLine(b)).toBeNull();
  });

  it('does NOT report a win on a mixed line', () => {
    const b = boardFrom(['X', 'O', 'X', null, null, null, null, null, null]);
    expect(findWinLine(b)).toBeNull();
  });

  it('returns draw on a full board with no win', () => {
    const b = boardFrom(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']);
    expect(findWinLine(b)).toBeNull();
    expect(statusFor(b).kind).toBe('draw');
  });

  it('open status reports whose turn it is (X first)', () => {
    expect(inferToMove(EMPTY_BOARD)).toBe('X');
    const s = statusFor(EMPTY_BOARD);
    expect(s.kind).toBe('open');
    if (s.kind === 'open') expect(s.toMove).toBe('X');
  });
});

describe('engine: moves', () => {
  it('applyMove returns a new immutable board', () => {
    const b1 = applyMove(EMPTY_BOARD, { cell: 0, mark: 'X' });
    expect(b1[0]).toBe('X');
    expect(EMPTY_BOARD[0]).toBe(null); // unchanged
  });

  it('isLegalMove rejects occupied cells and terminal boards', () => {
    const b = applyMove(EMPTY_BOARD, { cell: 4, mark: 'X' });
    expect(isLegalMove(b, 4)).toBe(false);
    expect(isLegalMove(b, 0)).toBe(true);
    // construct a won board
    const won = replay([
      { cell: 0, mark: 'X' },
      { cell: 3, mark: 'O' },
      { cell: 1, mark: 'X' },
      { cell: 4, mark: 'O' },
      { cell: 2, mark: 'X' },
    ]);
    expect(statusFor(won).kind).toBe('win');
    expect(isLegalMove(won, 5 as CellIndex)).toBe(false);
  });

  it('emptyCells returns correct indices', () => {
    const b = applyMove(EMPTY_BOARD, { cell: 4, mark: 'X' });
    expect(emptyCells(b)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
  });
});
