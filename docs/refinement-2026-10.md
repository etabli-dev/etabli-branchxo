# October 2026 refinement

## Purpose and acceptance

Preserve the existing game rules, AI behavior, visualizations and saved games. A new user must be able to install from the lockfile, start a supported Expo development build, finish/restart a game and recover saved state. Validate unit tests, strict typing, lint and real application bundles; treat simulator/device and store acceptance separately.

## Baseline and plan

The apps use Expo SDK 51 / React Native 0.74.5, an obsolete distribution toolchain. Branchxo's frozen installation fails because package-lock.json is incomplete. Lattttice installs only with legacy peer resolution and reports 50 dependency findings (including two critical); it carries unused Three/Expo GL dependencies although Projection3D is implemented with React Native views. Existing engine tests pass for Lattttice but do not prove either application can bundle or start.

1. Restore reproducible installs and remove verified-unused runtime dependencies.
2. Move to a supported Expo toolchain and resolve its actual type/bundle compatibility issues. Keep game semantics and IDs stable. Verify current upstream upgrade requirements.
3. Review persistence, illegal moves, branching/AI cancellation and probability calculations. Add regression tests for observed defects, not duplicated implementation assertions.
4. Build the actual app, add CI and accurate first-use instructions, and record remaining device/store gates.

Local implementation and functional verification are complete for this repair scope. Raw evidence is in the suite workspace `.refinement/2026-10-30/logs`. The native patch verification and external acceptance gates below still prevent an unconditional release-readiness claim.

### Supported runtime milestone

Expo 51 / React Native 0.74 predates current Android distribution requirements. Upgrade the SDK and its matched native modules together to Expo 58 (initially 58.0.21, then the source-validated 58.0.22 patch) (React Native 0.88.1, React 19.3), preserving game rules, saved-state keys and application identifiers. Verify ordinary `npm ci`, Expo dependency diagnostics, type/lint/tests, web and Android production bundles, then a native debug build. SDK 58 requires Xcode 26.4+ for the separate iOS gate. No store publication is implied.

Observed baseline: 56 tests passed.

### Saved state and asynchronous work

Validate saved settings and replay saved move histories before exposing them to the UI. Preserve an unreadable save until the user explicitly starts a new game. Cancel background search on reset/mode change/unmount and bind each asynchronous run to its own cancellation token; an older search must not move in a newer game. Test corrupt snapshots, cyclic ancestry, rapid reset/mode transitions and storage failures.

### Observed runtime and packaging changes

SDK 58 dependency diagnostics require TypeScript 6 and Jest 30; both now use
those versions with ts-jest's supported Node16 configuration. Zustand 5 removes
the React 19 peer mismatch. Removed obsolete splash configuration and placeholder
EAS project identifiers; splash resources use the supported plugin configuration.

The browser baseline showed Branchxo's blank screen (`PathBuilder` before
CanvasKit existed). Its web entry now loads a locally packaged CanvasKit before
importing the game, with an explicit load-failure screen. Two real Chromium tests
pass: engine failure handling and a complete win → reload → view changes → fork
journey with external networking blocked. Lattttice passes win → reload → all
four views → reset → AI reply; its unused Skia and screens dependencies are removed.
Saved-state failure/retry and AI cancellation regressions pass. Monte Carlo
sampling rejects invalid budgets and no longer claims a synthetic sample after
cancellation. Numerical estimates remain heuristic, not a proof of a winning strategy.

### Compatible dependency repair (2026-10-31)

The initial SDK 58 toolchain inherited the high-severity
[Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
The supported patch uses Expo **58.0.22**, Expo CLI **58.1.18** and
expo-modules-core **58.0.29**. The patched CLI removes its vulnerable Zod 3
dependency. React Native 0.88.1, React 19.3, game code and saved-state keys
remain unchanged. There is no forced transitive override.
A CLI-only patch was rejected because Expo's matched-dependency check required
the corresponding Expo patch; the supported set was adopted instead.

The online `npm audit --audit-level high` gate now passes: **0 high,
0 critical, 37 moderate and 3 low** affected dependency entries. Counts include
transitive impacts, not that many distinct advisories. Remaining findings are
[glob cancellation](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
[minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)
and [deepmerge prototype poisoning](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
in development/build/test tooling. Track compatible upstream fixes; do not
silence these with framework downgrades or unsupported major overrides. No game
exploit was observed. CI retains its independent high-severity gate.

### Observed checks for the patched source

- Clean `npm ci --offline --no-audit --no-fund` passes (`branchxo-sdk-patch-cached-frozen`). Registry access was unreliable, so the verified npm cache was used; Expo/core tarball SHA-512 integrity matches the lockfile. Interrupted downloads and partial candidate-install retries remain recorded as preparation failures. The candidate tree was cleaned before this successful frozen install; the audit ran separately online.
- TypeScript, lint and **62 unit tests pass** (`branchxo-sdk-patch-cached-checks`). Expo's matched-dependency check passes (`branchxo-sdk-patch-cached-expo-check`).
- Web, Android and iOS JavaScript exports pass (`branchxo-sdk-patch-cached-exports`, one Metro worker). This is not an iOS native build.
- Two Chromium journeys pass: complete win → reload → view changes → fork, plus engine-load failure handling. External networking is blocked during the application journeys (`branchxo-sdk-patch-cached-browser`).
- The live manifest/lockfile and 47 JavaScript/TypeScript source/configuration files match the isolated candidate used for those checks. Documentation and CI changes are reviewed separately.

### Native baseline and pending patch verification

Before the 58.0.22 patch, native arm64 debug and standalone development APKs
built successfully on Expo 58.0.21 / expo-modules-core 58.0.28. The standalone
baseline contains its JavaScript bundle, verifies with the Android Debug
certificate, is not debuggable, and declares minimum API 24 / target API 36.
APK ZIP and all included arm64 ELF load segments passed the inspected 16 KiB
alignment criteria. Baseline standalone SHA-256:
`79d32f5d21e746ef5210044c6f09962708687e86417aca0ee144d28145f990de`.
This historical APK does **not** validate the newer native patch.

The patched native debug and standalone builds are **pending at this source
freeze**. Local work continues with one Gradle worker and an external CMake
one-job pool because the host has heavy load and memory pressure. BranchXO's
first patched attempt was deliberately interrupted to enforce that resource
limit; it was not a compiler failure. Final native completion and artifact
hashes will be recorded in the suite workspace receipts and the exact-commit
GitHub workflow results. A passing source/export check does not imply a passing
native build, remote CI result or installation.

The README gives exact standalone build/install prerequisites and commands.
The ordinary debug variant requires Metro; the release build variant embeds
the game bundle. Both generated variants use the Android Debug key and are
local development artifacts. CI explicitly installs the matching SDK/NDK/CMake,
builds both variants, checks the embedded standalone bundle and uploads them
under a development label. No private distribution signing is configured.

### Remaining acceptance and next action

Both games use fixed dark React Native colors. The existing Expo
`userInterfaceStyle: automatic` preference does not implement an adaptive game
theme, and Android prebuild warns that optional system-UI integration is absent.
The README states the fixed appearance; no dependency was added solely to
silence that warning. Adaptive themes remain outside this repair scope.

Complete the current-patch native build/packaging gates and inspect the workflow
result for the published commit. Full interactive AVDs suffered documented
system-wide failures during the suite's device work, so a native game journey
was not performed. A healthy emulator or physical arm64 device must still verify
play, reload, view changes, AI cancellation, lifecycle, accessibility, performance
and 16 KiB-device behavior. Static alignment checks alone do not establish those
runtime outcomes. iOS native compilation requires Xcode 26.4+ (absent here),
followed by iOS device checks. Prepare private distribution signing and store
metadata after the acceptance checks. No store release or submission was performed.

Run the first-use commands in [README](https://github.com/etabli-dev/etabli-branchxo/blob/main/README.md).
Source publication is separate from store acceptance; remote CI and local native
completion must be checked against their actual evidence.
