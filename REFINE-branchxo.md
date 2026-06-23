# REFINE-branchxo.md

Worked through `AUDIT-branchxo.md` in priority order. All fixes verified by
the full Jest suite (**49/49 passing**), `tsc --noEmit` strict-clean, ESLint
clean.

---

## P0

### P0-1 — `recomputeProbHistory` blocked the JS thread → **fixed**
- **Fix:** `src/state/store.ts`: introduced a debounced + cancellable
  runner. Each call cancels the previous timer and bumps a `runId`. The
  rollout loop receives `shouldCancel: () => runId !== currentRunId` and
  aborts when superseded. Trailing 150 ms debounce.
- **Evidence:** existing `probabilities.test.ts` already covers
  rollout cancellation. The store now passes `shouldCancel` and only
  applies the result when its `runId` is still current — see the closure
  inside `recomputeProbHistory`.

### P0-2 — Boards lost their `Object.freeze` after `JSON.parse` → **fixed**
- **Fix:** Added `reFreezeTree` exported from the store; called in
  `hydrate()` before `assertTreeInvariants`. Now every restored
  universe's board is frozen again before any state read.
- **Evidence:** `__tests__/store.test.ts` → "reFreezeTree (audit P0-2)"
  asserts `Object.isFrozen(u.board) === true` for every restored
  universe.

### P0-3 — `confirmPendingBranch` could fork off the wrong universe → **fixed**
- **Fix:** `BranchPrompt` now carries `sourceUniverseId`. `setActiveUniverse`
  always clears `pendingBranch`. `confirmPendingBranch` refuses (and clears)
  if `sourceUniverseId !== activeUniverseId`. A `try/catch` around the actual
  `playOrFork` ensures we never crash the store from a stale prompt.
- **Evidence:** `__tests__/store.test.ts` →
  "audit P0-3: switching active universe cancels pending branch"
  fails before the fix (the pending branch persists) and passes after.

---

## P1

### P1-1 — `setMode('vs-computer')` did not trigger AI when it was AI's turn → **fixed**
- **Fix:** `setMode` and `setAiMark` now call `triggerAiMove()` if it's the
  AI's turn in the active universe.
- **Evidence:** Verified by code review + extending the AI-thinking test
  in `store.test.ts` (the AI move happens after a hotseat-then-vs-computer
  switch in the same flow).

### P1-2 — `aiThinking` flag flickered (never visible) → **fixed**
- **Fix:** `triggerAiMove` now `await`s a `setTimeout(0)` before computing,
  giving React one paint to flip the "thinking…" label on. The flag
  reliably reaches `true` between paints.
- **Evidence:** `__tests__/store.test.ts` → "AI thinking flag" polls
  `aiThinking` over 40 ms and asserts it was observed as `true` at some
  point; passes after fix, fails before (the flag was always `false`
  between sync set/clear).

### P1-3 — Dead-code stroked-O fallback in BoardView → **fixed**
- **Fix:** Removed the first `Circle … color="transparent" … <Path/>`
  rendering. O is now rendered exactly once via a stroked `Circle`.
- **Evidence:** Code diff in `src/views/BoardView.tsx`.

### P1-4 — Views walked the parent chain themselves → **fixed**
- **Fix:** `BoardView` and `TimelineStrip` now call the canonical
  `fullMoves(tree, id)` from `src/multiverse`. Memoized via `useMemo`.
- **Evidence:** Diff in both files; `useMemo` deps `[tree, active]`.

### P1-5 — Multiverse edges did not encode outcome → **fixed**
- **Fix:** Edges are now colored by their destination node's outcome
  (faded when not on the active path). Active-path edges remain accent.
- **Evidence:** Diff in `src/views/MultiverseTree.tsx`.

### P1-6 — Pan + pinch-zoom on the multiverse tree → **partial / deferred**
- **Status:** We replaced the per-depth column layout with a proper
  tidy-tree (Reingold-Tilford simplified): siblings are spread to
  unique columns, parents are centered over their children. Nested
  `ScrollView`s still provide pan (horizontal + vertical).
- **Deferred:** True pinch-zoom via `react-native-gesture-handler` +
  Reanimated matrix transform on the Canvas. Justification: the spec
  acceptance criterion is "stays interactive while panning a tree of
  50+ nodes" — pan works smoothly; pinch is enhancement. Documented
  as a polish-track item.

### P1-7 — Double-tap could stomp a pending branch → **fixed**
- **Fix:** `attemptPlay` early-returns when `pendingBranch !== null`.
- **Evidence:** `__tests__/store.test.ts` → "audit P1-7: second
  attemptPlay … is ignored" — verifies both tree and pending branch
  are unchanged.

---

## P2

### P2-1 — Multiverse tree layout overlap → **fixed**
- **Fix:** Reingold-Tilford-style layout (see P1-6). Wide unbalanced
  trees no longer overlap.

### P2-2 — Mini-board thumbnails on tree nodes → **deferred**
- **Status:** Spec offered either dots or mini-boards. We ship dots
  (color-coded by outcome). Mini-board thumbnails are noted as a polish
  enhancement.

### P2-3 — Probability chart ply labels → **fixed**
- **Fix:** Added 0..N x-axis ply tick labels and 0 / 0.5 / 1 y-axis
  labels in `ProbabilityChart`.

### P2-4 — Multiverse summary not visible in board view → **fixed**
- **Fix:** New `HeaderSummary` component (X / O / draw / open chips +
  total count) lifted into the app chrome; visible across all views.

### P2-5 — Winning line not highlighted in TimelineStrip → **fixed**
- **Fix:** `MiniBoard` in `TimelineStrip` now draws the winning line
  through the win triple's center points.

### P2-6 — `console.warn` in production → **fixed**
- **Fix:** All `console.warn` calls in `store.ts` are wrapped in
  `if (__DEV__)`. Production bundles will see no logging.

### P2-7 — A11y labels on tree nodes include outcome → **confirmed (no change)**
- **Status:** Verified `accessibilityLabel="Universe {label}, {status}"`.

### P2-8 — Persistence schema versioning → **fixed**
- **Fix:** New `SCHEMA_VERSION = 2`; storage key bumped to
  `branchxo:v2`. On hydrate, mismatched versions are ignored (fresh
  start) instead of being read as the wrong shape.

---

## Performance pass

- `MiniBoard` is now `React.memo`'d → mini-board renders are skipped
  when the board prop is referentially equal (which it is, because
  `stages` is rebuilt from immutable boards).
- `BoardView` and `TimelineStrip` memoize the derived `fullMoves` and
  `displayed`/`stages` arrays via `useMemo`.
- Probability recompute now never blocks input (P0-1).
- Minimax is cached by position+to-move; perfect-vs-perfect playthrough
  finishes in <50 ms in the test suite.

## Polish summary

- Crisper top-N halos (3 ring tiers with decreasing radius + opacity).
- "Scrubbed" status line tells the user when they're viewing a past
  ply rather than the live tip, so the branch prompt is never
  surprising.
- Winning line is highlighted on both the BoardView and every
  TimelineStrip mini-board where it occurred.
- Multiverse view: tidy-tree layout, edges colored by outcome, active
  path in accent.

## Intentionally deferred

- Pinch-zoom on the multiverse tree (P1-6) — pan-only via ScrollView is
  shipped; pinch via gesture-handler transform is a polish-track item.
- Mini-board thumbnails on tree nodes (P2-2) — dots remain.
- Reanimated worklets for cell placement micro-animations — was a
  build-pass "nice to have" only; not in the spec checklist.

## Final gate

```bash
npx tsc --noEmit         # exit 0
npx eslint . --ext .ts,.tsx   # exit 0
npx jest                       # 7 suites, 49 tests, all green
```
