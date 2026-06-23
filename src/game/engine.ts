import {
  ALL_CELLS,
  Board,
  Cell,
  CellIndex,
  EMPTY_BOARD,
  GameStatus,
  Mark,
  Move,
  WIN_LINES,
} from './types';

/** Returns the opposite mark. */
export function other(mark: Mark): Mark {
  return mark === 'X' ? 'O' : 'X';
}

/** Counts moves on the board and infers whose turn it is (X first). */
export function inferToMove(board: Board): Mark {
  let xs = 0;
  let os = 0;
  for (const c of board) {
    if (c === 'X') xs++;
    else if (c === 'O') os++;
  }
  return xs <= os ? 'X' : 'O';
}

/** Returns the win line if a mark has 3 in a row on the board, otherwise null. */
export function findWinLine(
  board: Board,
): { winner: Mark; line: readonly [number, number, number] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const va = board[a];
    if (va !== null && va !== undefined && va === board[b] && va === board[c]) {
      return { winner: va, line };
    }
  }
  return null;
}

/** Returns the current game status given a board. */
export function statusFor(board: Board): GameStatus {
  const win = findWinLine(board);
  if (win) return { kind: 'win', winner: win.winner, line: win.line };
  const hasEmpty = board.some((c) => c === null);
  if (!hasEmpty) return { kind: 'draw' };
  return { kind: 'open', toMove: inferToMove(board) };
}

/** Convenience: true if cell is empty AND board is not terminal. */
export function isLegalMove(board: Board, cell: CellIndex): boolean {
  if (board[cell] !== null) return false;
  const s = statusFor(board);
  return s.kind === 'open';
}

/** Returns a new board after applying the move. Throws on illegal move. */
export function applyMove(board: Board, move: Move): Board {
  if (!isLegalMove(board, move.cell)) {
    throw new Error(`Illegal move: cell=${move.cell}, current=${board[move.cell] ?? 'empty'}`);
  }
  const next: Cell[] = [...board];
  next[move.cell] = move.mark;
  return Object.freeze(next);
}

/** Returns all legal empty cell indices in ascending order. */
export function emptyCells(board: Board): readonly CellIndex[] {
  return ALL_CELLS.filter((c) => board[c] === null);
}

/** Replays an ordered list of moves from an empty board, returning the final board. */
export function replay(moves: readonly Move[]): Board {
  let b: Board = EMPTY_BOARD;
  for (const m of moves) {
    b = applyMove(b, m);
  }
  return b;
}

/** Replays up to N moves (inclusive index N-1). N=0 returns empty board. */
export function replayTo(moves: readonly Move[], count: number): Board {
  return replay(moves.slice(0, count));
}
