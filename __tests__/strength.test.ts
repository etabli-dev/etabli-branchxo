import { CellIndex } from '../src/game';
import { strengthFor, rankedStrengths } from '../src/overlay';

function board(cells: readonly ('X' | 'O' | null)[]) {
  expect(cells).toHaveLength(9);
  return Object.freeze([...cells]);
}

describe('overlay strength', () => {
  it('immediate winning cell > immediate blocking cell > build > centrality', () => {
    // X has two in a row on top: cells 0,1; cell 2 completes win.
    // O has two in a row on middle: cells 3,4; cell 5 blocks (would-be O win).
    // X has one mark on column 0 (cell 0). cell 3 is occupied by O so build candidate is cell 6 for col 0,
    //  but cell 6 also forms diag mixed (0 X, 4 O, 8 ?) -> mixed -> 0.  Use cell 7 (X with 1 on middle col: middle col is 1?O?O which is mixed)
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    const win = strengthFor(b, 2 as CellIndex, 'X'); // completes X win
    const block = strengthFor(b, 5 as CellIndex, 'X'); // blocks O win
    const center = strengthFor(b, 8 as CellIndex, 'X'); // somewhere with empty lines
    // win should be >= 100 (10^2); block should be ~90 (10^2 * 0.9); center should be much less.
    expect(win).toBeGreaterThanOrEqual(100);
    expect(block).toBeGreaterThanOrEqual(90);
    expect(block).toBeLessThan(win);
    expect(center).toBeLessThan(block);
  });

  it('mixed lines contribute 0', () => {
    // line cells 0,1,2: X at 0, O at 1, candidate at 2. row line should add 0 (mixed).
    const b = board(['X', 'O', null, null, null, null, null, null, null]);
    const s = strengthFor(b, 2 as CellIndex, 'X');
    // Only the col line (2,5,8) and diag (2,4,6) contribute as empty lines -> 1+1 = 2.
    expect(s).toBe(2);
  });

  it('rankedStrengths sorted descending', () => {
    const b = board(['X', 'X', null, 'O', 'O', null, null, null, null]);
    const ranks = rankedStrengths(b, 'X');
    for (let i = 1; i < ranks.length; i++) {
      const prev = ranks[i - 1];
      const cur = ranks[i];
      if (prev && cur) expect(prev.score).toBeGreaterThanOrEqual(cur.score);
    }
    expect(ranks[0]?.cell).toBe(2);
  });

  it('centrality: empty board, center cell strongest', () => {
    const empty = board([null, null, null, null, null, null, null, null, null]);
    const ranks = rankedStrengths(empty, 'X');
    expect(ranks[0]?.cell).toBe(4);
  });
});
