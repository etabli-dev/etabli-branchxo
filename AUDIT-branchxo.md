# AUDIT-branchxo.md

Independent review pass against the spec checklist in `add/02-audit-branchxo.md`.
Findings only — no code changes. Priorities: **P0** = correctness / breaks
the multiverse/fork invariants; **P1** = wrong-but-not-crashing or spec
deviation; **P2** = hygiene / polish.

Tests run: `npm test` → **40/40 passing**. `tsc --noEmit` → clean.
`eslint . --ext .ts,.tsx` → clean.

---

## P0 — must fix

### P0-1 — `recomputeProbHistory` runs synchronously on the JS thread
**File:** `src/state/store.ts:235-253`
**What's wrong:** After every move (player or AI), the store synchronously
recomputes the full probability history. In `vs random play` mode that's up
to `R=300` rollouts × (plyCount+1) positions on every move. For a 9-ply
game that's ~2700 rollouts every tap. This **blocks JS input** and contradicts
the spec line "Recompute debounced + cancellable; never block input."
**Repro:** In Settings switch to "vs Random", play moves; perceptible stall.
**Fix:** Debounce (~150ms) and move into a microtask / `requestIdleCallback`
shim; thread `shouldCancel` through so a new tap cancels the previous run.

### P0-2 — `EMPTY_BOARD` is shared by reference into multiple universes
**File:** `src/game/types.ts:39`, `src/multiverse/tree.ts:50-56`
**What's wrong:** `EMPTY_BOARD` is exported as a `Object.freeze`d array. Both
`createInitialTree` and `replay` start from it. Because the engine always
returns a new `Object.freeze([...])` via `applyMove`, mutation is impossible
in practice. **However:** after `JSON.parse(persisted)` the rehydrated board
is a plain mutable array. Today no code mutates a board in place, but the
invariant "boards are immutable" is not enforced after hydrate. **Risk: P0 if
a future contributor adds an in-place mutation; P1 in current code.**
Currently we have an `assertTreeInvariants` recheck on hydrate that would
catch a divergent state, but not a subsequent mutation.
**Fix:** Re-freeze boards on hydrate (`Object.freeze(arr)` over each
`universe.board`). Add a dev-only freeze-check unit test.

### P0-3 — `confirmPendingBranch` does not validate that the pending atPly is still consistent
**File:** `src/state/store.ts:190-210`
**What's wrong:** If the user (a) taps a divergent cell scrubbed back (opens
prompt), then (b) navigates to a different universe in the Multiverse view,
then (c) taps "Branch" — the fork is applied to the **new** active universe
using stale `pending.atPly` and `cell`. This can fork off the wrong universe
or throw on illegal indices.
**Repro:** open prompt → switch active via tree → confirm.
**Fix:** Stash the source universe id inside `pendingBranch`; refuse confirm
if `activeUniverseId !== pendingBranch.sourceUniverseId`. Cancel the pending
branch on `setActiveUniverse`.

---

## P1 — important but not breaking

### P1-1 — Switching mode to vs-computer mid-game does not auto-trigger AI
**File:** `src/state/store.ts:113-115`
**What's wrong:** `setMode('vs-computer')` only sets the mode flag. If it's
the AI's turn at that moment, nothing happens until the human plays.
**Fix:** In `setMode`, if new mode is `vs-computer` and the active universe
is open and `toMove === aiMark`, call `triggerAiMove()`.

### P1-2 — `aiThinking` flag flickers because compute is synchronous
**File:** `src/state/store.ts:212-234`
**What's wrong:** `triggerAiMove` sets `aiThinking: true` then synchronously
computes and clears the flag in the same tick. The UI never sees `true`.
The "thinking…" label never appears.
**Fix:** Wrap the compute in `setTimeout(... , 0)` (or
`requestAnimationFrame`) and `await` so the flag actually shows between
frames.

### P1-3 — BoardView has dead-code stroked O fallback
**File:** `src/views/BoardView.tsx` (the first marks map renders O via
a `Circle ... color="transparent"` then a second map renders O via a
proper stroked `Circle`).
**What's wrong:** The first O render path is dead and confuses readers; on
weak GPUs the engine still walks both groups.
**Fix:** Drop the dead path; render X via Path, O via stroked Circle, in
one pass.

### P1-4 — TimelineStrip / BoardView re-walk the parent chain every render
**File:** `src/views/TimelineStrip.tsx`, `src/views/BoardView.tsx`
**What's wrong:** Both views recompute `fullMoves` via their own private
`walk()` rather than using the exported `fullMoves` from `src/multiverse`.
This duplicates the logic AND won't benefit from any future memoization in
the store.
**Fix:** Use the canonical `fullMoves(tree, id)` and memoize via
`React.useMemo` keyed on `(activeId, tree)`.

### P1-5 — `MultiverseTree` edge color encodes only "on active path" not outcome
**File:** `src/views/MultiverseTree.tsx`
**What's wrong:** The spec says "edges = moves, color-coded by outcome".
Currently only nodes encode outcome; edges are either accent (active path)
or border.
**Fix:** Color edges by destination-node outcome (faded) so the multiverse
view is "glance-readable" at scale.

### P1-6 — No pan/zoom gesture on the multiverse tree
**File:** `src/views/MultiverseTree.tsx`
**What's wrong:** The spec requires "Pan + pinch-zoom". We currently use
nested ScrollViews (pan only, no pinch).
**Fix:** Add `react-native-gesture-handler` `PinchGesture` + Reanimated
shared matrix transform on the Canvas. Acceptable to defer to refine pass.

### P1-7 — `attemptPlay` accepts a tap when one is pending
**File:** `src/state/store.ts:131-167`
**What's wrong:** If the branch prompt is open and the user manages to tap
another cell behind the modal (the modal is on top in production, but
tests / programmatic dispatch can bypass it), the second tap stomps the
first `pendingBranch`. Defensive guard needed.
**Fix:** Early-return from `attemptPlay` if `pendingBranch !== null`.

---

## P2 — hygiene / polish

### P2-1 — Multiverse layout overlap with wide trees
**File:** `src/views/MultiverseTree.tsx` (layout cursor)
**What's wrong:** The layout uses a per-depth column cursor: siblings at the
same depth are placed at successive x positions regardless of which subtree
they belong to. This causes visual overlap for trees that are wide and
unbalanced (>30 nodes).
**Fix:** Use a proper tidy-tree layout (Reingold-Tilford). For ≤50 nodes the
current layout is acceptable, but the spec says "tree of 50+ nodes" must
stay interactive — visual quality at 50+ is currently poor.

### P2-2 — No node thumbnails (mini-boards) on tree nodes
**File:** `src/views/MultiverseTree.tsx`
**What's wrong:** Spec says "nodes = positions (mini-board thumbnails or
status dots)". We chose dots — acceptable but spec offers either. The active
path could be more legible with mini-boards.
**Fix:** Optionally render mini-boards on tap-hover / for the active path.
Defer to polish.

### P2-3 — Probability chart x-axis: ply labels missing
**File:** `src/views/ProbabilityChart.tsx`
**What's wrong:** No axis tick labels. Readability suffers for the analytic
view.
**Fix:** Render ply numbers (0..N) along the x-axis.

### P2-4 — Multiverse summary in the tree view is hard-coded to badges; not
shown in board view
**File:** `src/views/MultiverseTree.tsx` (badges), `App.tsx`
**What's wrong:** The summary is only visible in the Multiverse tab. A
glance-summary belongs in the chrome / header for the board view too.
**Fix:** Lift summary into the header.

### P2-5 — No "highlight winning line" outside the BoardView
**File:** `src/views/BoardView.tsx` shows winning line. TimelineStrip mini
boards do not.
**Fix:** Highlight the winning line on the mini-board for the final ply.

### P2-6 — Console.warn calls allowed by ESLint
**File:** `src/state/store.ts`
**What's wrong:** `console.warn` for persistence failures will show up as
warnings in dev tools and (Android) in `logcat`. Spec says "no console
spam".
**Fix:** Replace with a no-op in production builds (`__DEV__` guard).

### P2-7 — VoiceOver labels on tree nodes do not include outcome
**File:** `src/views/MultiverseTree.tsx`
**What's wrong:** Actually we DO include outcome in `describeStatus`, so
"Universe branch-A, X wins" — fine. Verified.
**No fix.**

### P2-8 — No persistence schema version
**File:** `src/state/store.ts`
**What's wrong:** Storage key `branchxo:v1` is good, but the persisted blob
has no `schemaVersion`. A future migration would have to rely on shape
detection.
**Fix:** Add `version: 1` to the persisted payload; bump and migrate later.

---

## Checks that passed cleanly

- **A1** Win detection on all 8 lines + non-wins + draws → `engine.test.ts` ✓
- **A2 / A3** Fork prefix correctness, parent untouched, board reconstruction,
  cannot fork onto occupied, cannot branch past terminal → `multiverse.test.ts` ✓
- **B4 / B5** Easy AI takes win/block; perfect AI never loses
  perfect-vs-perfect, never-loses vs random — `ai.test.ts` ✓
- **B6** AI replies in the active universe from current/fork point — implemented
  in `store.triggerAiMove` (uses active universe board); covered indirectly
  by `pickPerfect` test from a mid-game board.
- **C7** Strength fn ordering (win > block > build > centrality) → `strength.test.ts` ✓
- **C8** Probability modes (perfect deterministic, random near-certain) →
  `probabilities.test.ts` ✓
- **C9** Multiverse summary counts → `summarize` in `multiverse.test.ts` ✓
- **D10** Views read shared state, switching does not mutate the tree —
  implementation has no mutating code paths in views; verified by code review
  (no `set` calls in any view).
- **D11** Branch affordance only on divergent move — `attemptPlay` short-circuits
  on forward play. ✓
- **D12** Tree active-path highlight and node outcome colors — implemented. ✓
- **D13** Overlay flags default OFF — verified in `useAppStore` initial state. ✓
- **E14** tsc strict clean / no `any` / ESLint clean — all pass. ✓
- **E15** Persistence: store + hydrate implemented. ✓
- **E16** A11y labels on cells (`BoardView`) and tree nodes (`MultiverseTree`). ✓
- **E17** `npx expo start` runs (deps install clean, Expo SDK 51, no patches). ✓ (Not
  visually verified — see "Verification gaps".)
- **E18** Tree-view performance at 50+ nodes → see P2-1.

---

## Verification gaps (could not run in this audit)

- We could not boot a simulator/emulator to verify cold-start visual
  behaviour or 60fps. All checks are static + unit-test based.
- The Skia tree pan/zoom claim (P1-6) is from code reading, not gesture
  trial.

---

## Recommended fix order

1. P0-1 (debounce/cancel probHistory)
2. P0-2 (re-freeze on hydrate; defensive)
3. P0-3 (validate pendingBranch source universe)
4. P1-1, P1-2, P1-3, P1-4, P1-5, P1-7
5. P1-6 (pan/zoom — polish-bound)
6. P2 items as bandwidth allows
