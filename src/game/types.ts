/**
 * Core game types for branchxo.
 *
 * Board is a 3x3 grid flattened as a length-9 tuple-like array indexed 0..8:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */

export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type Board = readonly Cell[]; // length 9
export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Move {
  readonly cell: CellIndex;
  readonly mark: Mark;
}

export type GameStatus =
  | { kind: 'open'; toMove: Mark }
  | { kind: 'win'; winner: Mark; line: readonly [number, number, number] }
  | { kind: 'draw' };

export const ALL_CELLS: readonly CellIndex[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** The 8 winning triples (3 rows, 3 cols, 2 diagonals). */
export const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const EMPTY_BOARD: Board = Object.freeze([
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
]);
