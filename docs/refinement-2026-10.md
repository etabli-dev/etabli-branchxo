# October–November 2026 refinement

## SDK package provisioning follow-up

The [first fresh BranchXO CI run](https://github.com/etabli-dev/etabli-branchxo/actions/runs/41201647115) stopped before the Android build because `sdkmanager` could not find `platforms;android-37`. The [official SDK repository metadata](https://dl.google.com/android/repository/repository2-3.xml) publishes this base platform as `platforms;android-37.0` (revision 2, stable channel 0). The installed local SDK and a fresh `sdkmanager --list` agree. This workflow now requests that exact identifier; compile SDK 37, target SDK 36, build-tools 37.0.0, NDK 27.1.12297006 and CMake 3.22.1 remain unchanged. The pinned setup action already accepted the Android SDK licenses successfully in the failed run. The corrected workflow completed successfully on October 31 at `a5f1e2811c646572dd03b8306e4c6ccd54bde7b2`: [application run 41201810724](https://github.com/etabli-dev/etabli-branchxo/actions/runs/41201810724). Both Android variants, source/browser checks and the high-severity dependency gate passed. This observed dependency-patch result precedes the separate November 2 permission repair recorded below.

## Purpose and acceptance

Preserve the existing game rules, AI behavior, visualizations and saved games. A new user must be able to install from the lockfile, start a supported Expo development build, finish/restart a game and recover saved state. Validate unit tests, strict typing, lint and real application bundles; treat simulator/device and store acceptance separately.

## Baseline and plan

The apps use Expo SDK 51 / React Native 0.74.5, an obsolete distribution toolchain. Branchxo's frozen installation fails because package-lock.json is incomplete. Lattttice installs only with legacy peer resolution and reports 50 dependency findings (including two critical); it carries unused Three/Expo GL dependencies although Projection3D is implemented with React Native views. Existing engine tests pass for Lattttice but do not prove either application can bundle or start.

1. Restore reproducible installs and remove verified-unused runtime dependencies.
2. Move to a supported Expo toolchain and resolve its actual type/bundle compatibility issues. Keep game semantics and IDs stable. Verify current upstream upgrade requirements.
3. Review persistence, illegal moves, branching/AI cancellation and probability calculations. Add regression tests for observed defects, not duplicated implementation assertions.
4. Build the actual app, add CI and accurate first-use instructions, and record remaining device/store gates.

Local implementation and functional verification are complete for this repair scope. Raw evidence is in the suite workspace `.refinement/2026-10-30/logs`. The external acceptance gates below still prevent an unconditional release-readiness claim. Dated native verification milestones are recorded separately.

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

### Native baseline and dependency-patch verification

Before the 58.0.22 patch, native arm64 debug and standalone development APKs
built successfully on Expo 58.0.21 / expo-modules-core 58.0.28. The standalone
baseline contains its JavaScript bundle, verifies with the Android Debug
certificate, is not debuggable, and declares minimum API 24 / target API 36.
APK ZIP and all included arm64 ELF load segments passed the inspected 16 KiB
alignment criteria. Baseline standalone SHA-256:
`79d32f5d21e746ef5210044c6f09962708687e86417aca0ee144d28145f990de`.
This historical APK does **not** validate the newer native patch.

The patched native debug and standalone variants passed in the October 31 [GitHub run](https://github.com/etabli-dev/etabli-branchxo/actions/runs/41201810724). The downloaded CI APKs were independently checked for signatures, bundled standalone JavaScript, minimum API 24 / target API 36 and 16 KiB ZIP/arm64 ELF alignment. These are dependency-patch artifacts; the November 2 permission repair supersedes them for local testing. Earlier pending-build notes applied to the initial source freeze, not to this observed CI outcome. The initial local patched attempt was deliberately interrupted to enforce one CMake job under host memory pressure; the subsequent local debug and standalone builds completed. That interruption was not a compiler failure.

The README gives exact standalone build/install prerequisites and commands.
The ordinary debug variant requires Metro; the release build variant embeds
the game bundle. Both generated variants use the Android Debug key and are
local development artifacts. CI explicitly installs the matching SDK/NDK/CMake,
builds both variants, checks the embedded standalone bundle and uploads them
under a development label. No private distribution signing is configured.

### Android permission repair (2026-11-02)

Inspection of the earlier built APKs found unused legacy storage, vibration and
standalone overlay permissions inherited from native dependencies/templates.
Neither game uses these capabilities; saved games use app-private AsyncStorage.
The Expo configuration now explicitly blocks `READ_EXTERNAL_STORAGE`,
`WRITE_EXTERNAL_STORAGE`, `VIBRATE` and `SYSTEM_ALERT_WINDOW` using
[blockedPermissions](https://docs.expo.dev/guides/permissions/). An empty
`permissions` list alone does not remove inherited declarations.

The new `npm run check:android-permissions` reads the actual debug and standalone
APKs with Android's `aapt`. It requires ordinary uncapped `INTERNET`, permits the
app's AndroidX internal receiver permission, and rejects any unexpected requested
permission. Debug alone may retain React Native/Expo's optional overlay and
local-network development tooling. Those two permissions are absent from the
standalone APK. Retaining `INTERNET` for framework/development compatibility is
not a claim that Android prevents all networking. The game itself needs no server.
CI runs the package check after building both variants and before uploading them.

Local validation completed on November 2:

- Typing, zero-warning lint and all **62 unit tests** pass. Lint excludes only
  generated Quarto `docs/_site` output; authored source and documentation inputs
  retain their existing checks. The first local lint failure was from rendered
  library JavaScript and remains recorded separately.
- Expo dependency compatibility and the online high-severity audit pass; residual
  moderate/low findings remain as listed above. Resolved application identifiers
  and the four blocked permissions are preserved.
- Both arm64 debug and standalone APKs build from the permission-repaired source.
  The actual package permission gate passes for both. The same checker rejects
  the preserved October CI APKs for their excess permissions; separate malformed
  tool-output checks are not substituted for the actual APK checks.
- Both APK signatures, minimum API 24 / target API 36, ZIP alignment and arm64 ELF
  load alignment/offset congruence at 16 KiB pass. The standalone APK contains the
  embedded game bundle and is not debuggable; the ordinary debug APK needs Metro.
  Both use the Android Debug key and are development artifacts, not store releases.
- Source/configuration/assets are hash-checked against the explicit November 2
  source snapshot. Build/check logs and immutable APK copies are retained in the
  suite workspace `.refinement/2026-10-30/`. Device journeys are separate evidence.

Debug APK SHA-256: `7420d67b15dc69f5240da801f0c57a154d16dc764e66584d664415ebb44b8850`.

Standalone development APK SHA-256: `85fe33b32024e19464ada7ca811540d8aab42f487e4fd6ba139861f18cc36380`.

### Installed Android journey — 2026-11-02

The permission-repaired standalone development APK, SHA-256
`85fe33b32024e19464ada7ca811540d8aab42f487e4fd6ba139861f18cc36380`,
passed an actual API 35 ARM64 emulator journey with 4 KiB pages and guest external
networking disabled. It used its embedded JavaScript bundle without Metro.
A five-move Hotseat X win survived force-stop/relaunch. Timeline, Multiverse and
Heat rendered; a confirmed branch from ply 1 created a second universe, survived
another restart, and left the original winning universe selectable.

The synthetic win and branch were retained; no app data was cleared or reset.
Screenshots, fresh UI hierarchies, process logs, the install receipt and artifact
hash are retained in the suite workspace
`.refinement/2026-10-30/android-local/games-flutter-20261102-pass1/`
(`branchxo-result.json`, `RESULTS.md`). This closes the scoped emulator gameplay,
view-rendering and restart-persistence checks. It does not establish native AI
reply/cancellation, broader lifecycle/accessibility/performance, physical-device,
16 KiB or iOS acceptance. The APK uses the Android Debug key, not distribution signing.

### Remaining acceptance and next action

Both games use fixed dark React Native colors. The existing Expo
`userInterfaceStyle: automatic` preference does not implement an adaptive game
theme, and Android prebuild warns that optional system-UI integration is absent.
The README states the fixed appearance; no dependency was added solely to
silence that warning. Adaptive themes remain outside this repair scope.

The October 31 interactive AVD attempts suffered documented system-wide failures; no native game journey was completed in that attempt. The November 2 scoped emulator results above establish Hotseat play, restart persistence and native view rendering. Native AI reply/cancellation, broader lifecycle, accessibility, performance, physical-device and 16 KiB-device checks remain open. Static alignment checks alone do not establish those remaining runtime outcomes. iOS native compilation requires Xcode 26.4+ (absent here),
followed by iOS device checks. Prepare private distribution signing and store
metadata after the acceptance checks. No store release or submission was performed.

Run the first-use commands in [README](https://github.com/etabli-dev/etabli-branchxo/blob/main/README.md).
Source publication is separate from store acceptance; remote CI and local native
completion must be checked against their actual evidence.
