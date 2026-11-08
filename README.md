# branchxo

> **Multiverse Tic-Tac-Toe** — a branching-timeline twist on the classic 3×3 game.
> React Native + Expo (SDK 58) + TypeScript (strict).
> Repository: <https://github.com/etabli-dev/etabli-branchxo>

`branchxo` is not ordinary tic-tac-toe. Every move is recorded on an explicit
**timeline**, and you can scrub back and **branch** into a parallel universe by
making a different move at any past ply. The full game state is therefore a
**tree of universes**, not a single line.

---

The game uses a fixed dark palette; changing the device light/dark setting
does not switch the game theme.

## Run

```bash
npm ci
npx expo start
```

Prerequisites: Node.js 22.23.4, npm and Git. `npm ci` prepares the local
CanvasKit engine used by the web view. Start the web app with `npm run web`.
To build Android, install JDK 17 and the Android SDK, set `ANDROID_HOME`, then
run `npm run android` with a device/emulator connected. Expo prebuild provisions
the SDK 58 native project (compile SDK 37, target SDK 36). iOS needs macOS and
Xcode 26.4 or later. Native device operation is a separate acceptance check.

### Standalone Android development APK

For an APK with its JavaScript included, install Android SDK Platform 37.0
(`sdkmanager` package `platforms;android-37.0`),
Build Tools 37.0.0, NDK 27.1.12297006 and CMake 3.22.1 using Android Studio's
SDK Manager. Accept the SDK licenses, set `JAVA_HOME` to JDK 17 and
`ANDROID_HOME` to the SDK directory, and put its `platform-tools` on `PATH`.
From the repository root:

```sh
npm ci
npx expo prebuild --platform android --no-install
(cd android && ./gradlew --no-daemon --max-workers=2 \
  '-Dorg.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8' \
  -PreactNativeArchitectures=arm64-v8a :app:assembleRelease)
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Launch **branchxo** on the connected arm64 device/emulator. The manifest supports
Android 7.0 / API 24 and later and targets API 36. This release build variant
embeds the game bundle, so Metro is unnecessary after installation. Expo's
generated project signs it with the public Android Debug key: it is a local
development artifact, not a store release. The ordinary `assembleDebug` APK
instead expects Metro. CI prepares both variants under the same development
label; signing for distribution and physical-device acceptance remain separate.

### Android permissions

After building both APK variants, run `npm run check:android-permissions`.
The check reads the actual APK manifests with Build Tools 37.0.0 `aapt`, using
`ANDROID_HOME` or `ANDROID_SDK_ROOT`; set `AAPT` to use an explicit executable.
For existing artifacts, use `npm run check:android-permissions -- --debug path/to/debug.apk --release path/to/release.apk`.

Both variants retain an ordinary, uncapped `INTERNET` declaration for Metro
development and may request their own signature permission for internal receiver
registration. The debug APK may also request `SYSTEM_ALERT_WINDOW` for React
Native's legacy performance monitor and `ACCESS_LOCAL_NETWORK` for the bundled
React Native/Expo Metro development tooling. The standalone APK must omit both.
Shared-storage read/write, vibration and all other unexpected permissions are
rejected; saved games use app-private storage.
CI runs this check after building both APKs.

### Desktop app (Linux, Windows, macOS)

`src-tauri/` wraps the web export in a Tauri 2 window. Install Rust 1.90 or
newer and, on Ubuntu/Debian, the WebKitGTK build packages
(`libwebkit2gtk-4.1-dev build-essential file libxdo-dev
libayatana-appindicator3-dev librsvg2-dev`). Then:

```sh
npm ci
npm run desktop:dev                              # Expo dev server + debug window
npm run desktop:build -- --bundles deb,appimage  # Linux packages
```

`desktop:build` runs the web export first and embeds `dist/` in the binary; the
window loads nothing from the network. Packages are written to
`src-tauri/target/release/bundle/`. The *Desktop packages* workflow builds the
Linux `.deb` and AppImage, Windows MSI and NSIS installers and a universal macOS
DMG; none of them carries a publisher signature (the macOS app is only ad-hoc
signed). Saved games stay in the window's web storage
(`~/.local/share/com.raban.branchxo/` on Linux).

### Other scripts

```bash
npm test           # Jest unit tests
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # ESLint
```

---

## The game model

### Timeline (single line of play)

Each move appends to an ordered **timeline** of plies. The board at any ply is
reconstructable by replaying ply 0…t. You can scrub the timeline to view any
past position — scrubbing is **read-only**.

### Branching (the multiverse)

From any past ply, playing a *different* cell forks a **new universe**: a child
node sharing the prefix with its parent then diverging. The parent universe is
preserved untouched. Each universe is its own self-contained 3-in-a-row game.

- One universe is **active** at a time (the one you're extending).
- Others are dormant but stay in the tree and remain navigable.
- Win/draw is evaluated **per universe**.

### Modes

- **Hotseat** — two humans share the device.
- **vs Computer** — you choose the AI's mark and level. After a fork, the AI
  computes its reply *in that universe* from the fork point onward.

---

## Views (segmented switcher at the top)

| View | What it shows |
|---|---|
| **Board** | The active universe's current 3×3. Tap an empty cell to play. Scrubbed back + tapping a different cell prompts a "branch?" confirmation. Also shows the per-universe probability chart underneath. |
| **Timeline** | Horizontal filmstrip of mini-boards for every ply in the active universe. Tap any ply to scrub there. |
| **Multiverse** | The headline view: the whole universe tree rendered with Skia. Nodes are color-coded by outcome (X-win blue / O-win orange / draw grey / open purple). Tap a node to make that universe active; the active path is highlighted. Includes a one-glance multiverse outcome summary at the top. |
| **Heat** | Strength heat-overlay for the active board: every empty cell shaded on a viridis gradient by `strength(c)` (see below). |

---

## Move-strength overlay ("powerful next steps")

Toggleable **per-player** in Settings; off by default. For the side to move, the
strength of an empty cell `c` is

```
strength(c) = Σ over winning lines L through c:
  - line with only my marks (k):       10^k
  - line with only opp marks (k):      10^k * 0.9
  - mixed line:                        0
  - fully empty line:                  1     (centrality)
```

This makes an immediate win (`10^2 = 100`) and an immediate block (`~90`)
clearly dominate, building threats (`10^1 = 10`) sit below, and pure centrality
plays score `1` per empty line through the cell.

Top-N (default 3) candidate cells get ranked halos on the **Board** view; the
**Heat** view shades all empties on the viridis gradient.

---

## AI levels

- **Easy** — random legal move, but always takes an immediate win and blocks an
  immediate loss.
- **Medium** — picks the cell with the highest strength score (the same overlay
  function above).
- **Perfect** — full minimax over the (tiny) 3×3 game tree with a position cache
  keyed by `board|toMove`. Perfect play never loses; it always takes a forced
  win and blocks a forced loss.

---

## Probability modes

After every ply, branchxo records `P(X win), P(O win), P(draw)` for the active
universe. Two modes are available (toggle in Settings):

- **vs Perfect play** — exact outcome from each position via minimax. Since 3×3
  is solved, the answer is always 0/1 across the three outcomes.
- **vs Random play** — Monte-Carlo rollouts (default 300, both sides playing
  the random-but-greedy "Easy" policy). The resulting curve is the
  interesting one to watch over time.

The probability chart highlights the **biggest-swing ply** — the turning point.
The Multiverse view also shows a one-glance summary of outcome counts across
all universes in the tree.

---

## State, persistence

- Zustand store (`src/state/store.ts`) holds the multiverse tree, active
  universe, scrub position, mode, AI settings, view, per-player overlay flags,
  and probability mode.
- The whole tree + settings is persisted via `@react-native-async-storage/async-storage`
  and rehydrated on relaunch.
- **New game** in Settings resets the multiverse to a single empty root.

---

## Layout

```
/src
  /game        3×3 engine: types, win-check, rules, replay
  /multiverse  tree model, fork/branch logic, navigation
  /ai          easy/medium/perfect minimax + policies, cache
  /state       Zustand store + AsyncStorage hydrate/persist
  /views       BoardView, TimelineStrip, MultiverseTree, HeatView,
               ProbabilityChart, ViewSwitcher, SettingsPanel, BranchPrompt
  /overlay     strength function + ranked badges + heat-norm
  /analysis    minimax-exact probs + random rollouts + turning-point
  /ui          theme (color-blind safe), SegmentedControl, Pill
App.tsx
/src-tauri     Tauri 2 desktop shell around the web export
```

---

## Quality

- TypeScript **strict** (no `any`, `noUncheckedIndexedAccess` on).
- ESLint clean, Prettier formatted.
- Jest unit tests covering engine, strength fn, multiverse fork/branch
  invariants, AI (easy + perfect), and probability modes.
- Color-blind-safe palette (Okabe–Ito X/O pair); cells + tree nodes carry
  accessibility labels.

See [DECISIONS.md](./DECISIONS.md) for design notes.

## Platforms

Android and iOS are the primary targets; Linux, Windows and macOS run the same
game in the desktop shell; the web export is a bonus. Android development APKs
build in CI and passed an emulator journey. iOS has not been built natively. The
Linux desktop packages were built and started locally; the Windows and macOS
packages are set up to build in CI but have not been built yet. No store listing
or desktop release exists; the only published binary is the older debug-signed
APK in the `v0.1.0` pre-release. The [platform roadmap](docs/platform-roadmap.md)
lists the exact state, signing prerequisites and milestones for every platform.

## Verification and distribution

```sh
npm run check
npx expo install --check
npm run export -- --platform all
npx playwright install chromium
npm run test:browser
```

The production web export is `dist/`. Serve it at the origin root over HTTP(S).
The browser suite exercises the built app at phone dimensions with external
networking blocked. Read [the refinement record](docs/refinement-2026-10.md)
for observed results, dependency audit findings, and device/iOS/store
requirements. There is no configured EAS project or store
submission in this checkout. Link your own EAS project before using EAS Build.
