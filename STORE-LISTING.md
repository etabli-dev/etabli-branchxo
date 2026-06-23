# STORE-LISTING.md

Final copy + assets manifest for branchxo's App Store and Google Play listings.

---

## Identity

- **App name:** branchxo
- **Display name (stores):** branchxo: Multiverse Tic-Tac-Toe
- **Bundle id (iOS):** `com.raban.branchxo`
- **Package name (Android):** `com.raban.branchxo`
- **Category:**
  - iOS: Games → Board, Games → Strategy
  - Android: Games → Board
- **Age rating:** 4+ (iOS) / Everyone (Android / IARC)

---

## Subtitle / short description

> Tic-tac-toe with a branching timeline. Fork the multiverse.

(iOS allows up to 30 characters for the subtitle; the above is 47 — use
"Branching-timeline tic-tac-toe" (32 → truncate to "Branching tic-tac-toe"
at 22) for iOS subtitle.)

- **iOS subtitle (≤30 chars):** `Branching tic-tac-toe`
- **Google Play short description (≤80 chars):** `Tic-tac-toe with a branching timeline. Fork the multiverse and explore what-ifs.`

---

## Full description (≤4000 chars)

```
branchxo is tic-tac-toe with a twist: every move lives on an explicit timeline,
and you can BRANCH at any past ply to spin up a parallel universe and explore
the what-if. Instead of one game, you grow a multiverse tree of games — each
its own self-contained 3-in-a-row, all of them visible at once.

• MULTIVERSE TREE — A Skia-rendered tree of every universe in play.
  Color-coded by outcome (X-win, O-win, draw, or still open). Tap any node
  to activate that universe and keep playing from there.

• TIMELINE SCRUBBER — Step back through any universe ply by ply. Tap a
  different cell at a past ply to fork into a new universe (the original
  is preserved untouched).

• HEAT OVERLAY — Optional strength hint for the side to move. Cells are
  scored by an offense + defense weighting: immediate wins (★) and
  immediate blocks (⛨) dominate; threat-building and centrality follow.
  Toggle per-player so each hotseat player can play with or without hints.

• PROBABILITY ANALYSIS — After every move, branchxo charts P(X), P(O), and
  P(draw) over time for the active universe, with the turning-point ply
  marked. Choose "vs perfect play" (exact minimax outcome) or "vs random
  play" (Monte-Carlo rollouts).

• PERFECT-PLAY AI — 3×3 is a solved game; branchxo ships easy, medium,
  and perfect (full minimax) opponents. Perfect-play AI never loses.

• HOTSEAT OR vs COMPUTER — Both modes work the same way: tap, scrub,
  branch, repeat.

No accounts. No ads. No data collection. No network. Plays entirely
offline; your multiverse persists on-device.

Color-blind-safe palette + VoiceOver labels on every cell and tree node.

This is tic-tac-toe as a thinking toy — a small game with a big tree
behind it.
```

---

## Keywords (iOS, 100 chars total, comma-separated)

```
tic-tac-toe,multiverse,branch,timeline,strategy,minimax,offline,no-ads,puzzle,board,xo,thinking
```

(Count: 99 chars including commas.)

---

## What's New (release notes, 1.0.0)

```
First release.

• Branching multiverse tic-tac-toe
• Skia-rendered multiverse tree, timeline scrubber, board view, and heat overlay
• Easy / Medium / Perfect AI
• Win probability charts (vs perfect or vs random play)
• Hotseat or vs Computer
• 100% offline, no ads, no tracking
```

---

## Screenshot manifest

Required sizes (Expo `eas build` + `eas submit` will accept these; capture from
simulator/emulator and a Pixel-sized device emulator):

| Device class | Resolution | Used for |
|---|---|---|
| iPhone 6.7" (15 Pro Max / 16 Pro Max) | 1290 × 2796 | iOS — required |
| iPhone 6.5" (older) | 1242 × 2688 | iOS — optional but recommended |
| iPhone 5.5" (legacy) | 1242 × 2208 | iOS — required only if supporting older devices |
| iPad 12.9" (3rd gen+) | 2048 × 2732 | iOS — required because we set `supportsTablet: true` |
| Android phone | 1080 × 1920 minimum | Google Play — 2 required, up to 8 |
| Android 7" tablet | 1200 × 1920 | Optional |
| Android 10" tablet | 1600 × 2560 | Optional |

Capture **one of each** for these in-app views:

1. **Board view** — mid-game with the strength halos active (top-3 ranked
   cells with rings), showing the timeline strip + probability chart
   underneath. Caption: "Play, scrub, branch."
2. **Timeline view** — horizontal filmstrip of mini-boards with one ply
   highlighted. Caption: "Step through every ply."
3. **Multiverse view** — a tree with at least 5 nodes including one X-win
   (blue), one O-win (orange), and one open (purple) branch. Caption:
   "One game becomes many."
4. **Heat view** — strength heat-overlay with viridis shading. Caption:
   "See the strongest moves."
5. **Probability chart in board view** — close-up showing P(X), P(O),
   P(draw) curves over plies, with the turning-point dot. Caption:
   "Track every turning point."

Workflow for capture (manual):

```bash
npx expo start
# i for iOS sim, choose iPhone 15 Pro Max
# play / fork to build the tree, then Cmd-S to screenshot
# repeat for each of the 5 views
# then close, reopen for Android: npx expo start --android
```

All screenshots should be **framed** (App Store rejects raw status-bar
shots for some categories). Recommended tool: `fastlane snapshot` or
manual framing via Figma export.

---

## App Icon

- 1024 × 1024 PNG (no alpha for iOS): `assets/icon.png` — present.
- Android adaptive: `assets/adaptive-icon.png` (1024 × 1024 with safe
  zone) + background color `#0b1020` (set in `app.json`).
- Source SVGs (`assets/icon.svg`, `assets/adaptive-icon.svg`) document
  the intended branching-tree motif and are checked in.

The ship'd PNGs are placeholder geometry generated from a Node script
(see Phase-1 `DECISIONS.md`). Final icon art SHOULD be commissioned
or designed before public submission — the placeholders pass binary
validation but are not visually distinctive.

---

## Splash screen

- `assets/splash.png` 1284 × 1284 (centered, `resizeMode: contain`)
- Background color: `#0b1020`
- Source SVG: `assets/splash.svg` (branching tree + brand)

---

## Privacy

- See `PRIVACY.md` (in the repo).
- **iOS privacy nutrition label:** all categories = "Data Not Collected".
- **Google Play Data Safety:** "No data collected", "No data shared".
- **Privacy policy URL:** host `PRIVACY.md` at any public URL (e.g. a
  GitHub Pages site) and use that URL in App Store Connect / Play
  Console.

---

## Age rating answers (both stores)

| Question | Answer |
|---|---|
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Profanity | None |
| Sexual content / nudity | None |
| Horror / fear themes | None |
| Mature / suggestive themes | None |
| Simulated gambling | None |
| Alcohol / tobacco / drugs | None |
| Unrestricted web access | No |
| User-generated content | No |
| In-app purchases | No |
| Shares user location | No |
| Personal information collected | No |

Result: **4+ (iOS), Everyone (Google Play / IARC)**.

---

## Support + marketing URLs

For the listing forms:

- **Support URL:** `https://github.com/raban-heller/branchxo` (or your repo)
- **Marketing URL:** optional, same.
- **Privacy policy URL:** must be a publicly reachable HTTPS URL hosting
  `PRIVACY.md`.
