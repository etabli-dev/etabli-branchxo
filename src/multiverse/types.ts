import { Board, GameStatus, Move } from '../game';

export type UniverseId = string;

export interface ProbPoint {
  readonly ply: number; // 0..N (after `ply` moves)
  readonly pX: number;
  readonly pO: number;
  readonly pDraw: number;
}

/**
 * A Universe is a node in the multiverse tree.
 *
 * - `parentId` is null only for the root universe (the empty board).
 * - `parentPly` is the number of moves of the parent we inherit BEFORE we diverge.
 *   So the full move list at this node is `parent.moves.slice(0, parentPly).concat(moves)`,
 *   recursively. For the root, `parentPly = 0` and `moves` starts from empty.
 * - `moves` is THIS universe's *own* divergent move sequence (post-fork).
 * - `board` and `status` are derived from `fullMoves(this)` but cached for speed.
 * - `probHistory` has one entry per ply (0..fullMoves.length).
 */
export interface Universe {
  readonly id: UniverseId;
  readonly parentId: UniverseId | null;
  readonly parentPly: number;
  readonly moves: readonly Move[];
  readonly board: Board;
  readonly status: GameStatus;
  readonly probHistory: readonly ProbPoint[];
  readonly createdAt: number;
  readonly label: string; // human-readable, e.g. "root", "Branch A"
}

export interface MultiverseTree {
  readonly universes: Readonly<Record<UniverseId, Universe>>;
  readonly rootId: UniverseId;
}
