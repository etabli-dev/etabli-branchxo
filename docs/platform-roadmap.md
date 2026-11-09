# Platform roadmap

Status as of 2026-11-09. See the
[Apple platform audit](apple-audit-2026-11-08.md) for native build and desktop-layout
verification. This page plans branchxo for Ubuntu/Debian, Windows,
macOS, iOS and Android, with the browser build as a bonus. It separates what has
been built and checked from what is only configured. "CI only" means a workflow
exists but its result has not been observed yet.

## 1. Platform role

branchxo is a **phone and desktop** game. It is one Expo / React Native code base
that already exports a web build, so a desktop window around that build is cheap
and needs no second user interface.

- **Android and iOS** are the primary targets: the layout is portrait-first and
  designed for touch, and hotseat play happens on one device passed between two
  players.
- **Ubuntu/Debian, Windows and macOS** get the same game in a desktop window
  (Tauri 2 around the web export) for playing or demonstrating the branching
  timeline with a mouse on a larger screen.
- **Web** is a bonus: the export runs in a current browser, but no hosted
  deployment exists.

All platforms play offline. Saved games stay on the device; there is no account
and no synchronisation between devices.

## 2. Current state

| Platform | Status | Technology | How it is built | What is verified | Distribution |
|---|---|---|---|---|---|
| Ubuntu/Debian | Desktop shell added; unsigned packages | Tauri 2.12 (WebKitGTK 4.1) around the Expo web export | `npm run desktop:build -- --bundles deb,appimage`; CI job `desktop.yml` on `ubuntu-24.04` | Locally on Ubuntu 26.04 x86_64 (2026-11-08): `.deb` and AppImage build, `dpkg-deb -I/-c`, launch under Xvfb (window 480×800, alive after 10 s, no panic), five-move hotseat win in the shell, relaunch keeps the game, AppImage launch, `desktop:dev` launch. Not verified: a real desktop session with GPU, installation with `apt`, other distributions; baseline desktop CI [passed](https://github.com/etabli-dev/etabli-branchxo/actions/runs/42525631266); current changes await a new run | None (CI artifact once pushed) |
| Windows | Baseline packages built in CI; native acceptance open | Tauri 2.12 (WebView2) | CI job `desktop.yml` on `windows-latest`: MSI (WiX) and NSIS `.exe` | Baseline desktop CI [passed](https://github.com/etabli-dev/etabli-branchxo/actions/runs/42525631266); not run locally, current changes await a new run | None |
| macOS | Local arm64 DMG built; GUI acceptance open | Tauri 2.12 (WKWebView), universal binary | CI job `desktop.yml` on `macos-15`: DMG, ad-hoc signed | Local arm64 DMG integrity and extracted app strict ad-hoc signature checks passed on 2026-11-09; interactive GUI blocked ([audit](apple-audit-2026-11-08.md)); no Intel runtime test | None |
| iOS | Unsigned native Release compiled; EAS not linked | Expo SDK 58, React Native 0.88.1, bundle ID `com.raban.branchxo` | EAS Build (`eas.json` profiles) or `npx expo run:ios` on a Mac with Xcode 26.4+ | iOS JavaScript bundle export (`npm run export -- --platform all`) in CI run [41490177585](https://github.com/etabli-dev/etabli-branchxo/actions/runs/41490177585). Unsigned arm64 iPhoneOS Release compiled locally on 2026-11-09 with Xcode 27.2 and an embedded game bundle ([audit](apple-audit-2026-11-08.md)); no simulator or device run, no EAS project linked | None |
| Android | Local APKs/AAB and lint passed; development signing | Expo prebuild + Gradle, package `com.raban.branchxo`, min API 24, target API 36 | CI job `android` in `checks.yml`: debug/release APK, release AAB, lint/model checks (Android Debug key) | CI run 41490177585 (APKs, permission gate, embedded bundle); emulator journey on API 35 ARM64 on 2026-11-02 ([refinement record](refinement-2026-10.md)). Local arm64 debug/release APK and AAB builds, lint/model gates, package permissions and 16 KiB ZIP/ELF alignment passed on 2026-11-09 ([audit](apple-audit-2026-11-08.md)). Not verified: physical device, native AI cancellation, 16 KiB device runtime, release signing | GitHub pre-release [v0.1.0](https://github.com/etabli-dev/etabli-branchxo/releases/tag/v0.1.0) (2026-06-24): debug-signed universal APK built before the SDK 58 refinement, so it lacks the October–November changes. CI artifacts are labelled development. No store listing |
| Web (bonus) | Export works | `react-native-web` + local CanvasKit (WASM) | `npm run export -- --platform web` → `dist/` | Two Playwright Chromium journeys in CI and locally (2026-11-08), also with the desktop shell's CSP applied | Not hosted (GitHub Pages serves the documentation only) |

Notes on the existing release documents: `STORE-LISTING.md` holds usable store
copy. `SUBMISSION-branchxo.md` (2026-06-23) predates the SDK 58 refinement in
places: the app version is `0.1.0` (not `1.0.0`), there is no
`extra.eas.projectId` (placeholder identifiers were removed), its `expo-doctor`
and Xcode notes refer to SDK 51, and its gate results (49 tests) are older than the
current 63 tests.
`eas.json` still contains placeholder submit values (`YOUR_APPLE_ID@example.com`,
`REPLACE_WITH_APP_STORE_CONNECT_APP_ID`, `REPLACE_WITH_APPLE_TEAM_ID`) and expects
`./google-service-account.json` (git-ignored, not present).

The raw Expo checker recommends `expo` 58.0.23, `expo-splash-screen` 58.0.13
and `react-native-safe-area-context` 5.11.1, published on 3 November. CI now runs
`npm run check:expo`, which delegates to that checker and permits only the reviewed
58.0.22 → 58.0.23, 58.0.12 → 58.0.13 and 5.10.1 → 5.11.1 recommendations until
2026-11-17 00:00 UTC, under the two-week dependency age rule. Unknown mismatches,
extra diagnostics, tool failures and expired exceptions still fail. Ten offline
fixtures exercise these boundaries. This temporary quarantine is distinct from
native compatibility, which is checked by the builds in the
[Apple platform audit](apple-audit-2026-11-08.md). No dependency versions changed.

The [dependency review](dependency-audit-2026-11-09.md) tracks the remaining
three npm advisories and their upstream/age constraints separately from Expo
compatibility. Recheck eligible upstream fixes after 10 November; the current
parent ranges still need a compatible upstream update.

## 3. Architecture

**Now.** All game logic and UI live in one TypeScript code base (`src/`,
`GameApp.tsx`). iOS and Android render it with React Native and native Skia. The
web entry (`App.web.tsx`) loads CanvasKit from the local `/canvaskit.wasm` before
importing the game, so the browser build needs no network.

The desktop app is a thin Rust shell in `src-tauri/` (one `main.rs`, no commands).
`tauri build` runs the web export first and embeds `dist/` in the binary; the
window loads it from Tauri's internal protocol (`tauri://localhost` on Linux and
macOS, `http://tauri.localhost` on Windows), so absolute asset paths work and
nothing is fetched from the network. The shell registers no plugins, commands or
capabilities. A Content Security Policy allows only bundled scripts and
`'wasm-unsafe-eval'` for CanvasKit; inline styles are allowed because
react-native-web injects its style sheet at runtime (Tauri's style nonce is
therefore disabled with `dangerousDisableAssetCspModification: ["style-src"]`).
Saved games use AsyncStorage, which is `localStorage` in the web view. On Linux
this is stored under `~/.local/share/com.raban.branchxo/` (observed); on Windows
and macOS it is the per-app web view data directory (not verified).

**Target.** Keep one code base. Desktop-specific code stays in `src-tauri/`;
larger-screen improvements (for example the board and the multiverse tree side by
side) belong in the shared React Native layout behind window-size checks, so they
also help tablets. The saved-game key (`branchxo:v2`) stays the same on every
platform.

## 4. Per-platform execution

### Ubuntu/Debian

- **Prerequisites:** Node 22.23.4 and npm, Rust 1.90 or newer (CI uses 1.93.1) and
  the Tauri Linux packages:
  `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`.
- **Run during development:** `npm ci`, then `npm run desktop:dev` (Expo dev server
  on port 19006 plus a debug shell that reloads on change).
- **Build:** `npm run desktop:build -- --bundles deb,appimage`. Output:
  `src-tauri/target/release/bundle/deb/etabli-branchxo_<version>_amd64.deb` and
  `.../appimage/etabli-branchxo_<version>_amd64.AppImage`.
- **Formats:** `.deb` for Ubuntu/Debian (depends on `libwebkit2gtk-4.1-0` and
  `libgtk-3-0`; built on Ubuntu 24.04 in CI, so it needs glibc 2.39 or newer:
  Ubuntu 24.04+, Debian 13+). AppImage (about 87 MiB, bundles WebKitGTK) for other
  distributions. Flatpak is not planned before the `.deb` is accepted.
- **Signing:** none needed for a downloadable `.deb`. An APT repository would need
  a GPG signing key (not planned).
- **CI job:** `desktop.yml`, `ubuntu-24.04`: builds `.deb` and AppImage with the
  committed `Cargo.lock` (`--locked`), launches the binary under Xvfb for 10 s,
  prints `dpkg-deb -I/-c`, uploads `branchxo-desktop-linux-x64`.
- **Acceptance:** CI green; on a real Ubuntu 24.04 desktop with GPU:
  `sudo apt install ./etabli-branchxo_0.1.0_amd64.deb`, start from the
  application menu (icon shown), board, timeline and chart are drawn on first
  display, hotseat win → close → reopen keeps the game, branch from ply 1, one
  vs-computer reply, `sudo apt remove etabli-branchxo` removes the program.
- **Known local finding:** under Xvfb with Mesa software rendering, WebKitGTK
  did not show the first frame of the Skia canvases until the next redraw (after
  the first click everything rendered). The same happens in WebKitGTK's own
  MiniBrowser over plain HTTP without the shell, and a minimal WebGL page shows
  it for every context created with `antialias: false`, which CanvasKit uses. The
  acceptance run on real hardware must confirm the first frame.

### Windows

- **Build:** on Windows 10/11 with Node 22, Rust (MSVC toolchain) and the Visual
  Studio C++ build tools: `npm ci`, `npm run desktop:build -- --bundles msi,nsis`.
- **Formats:** MSI (WiX, per-machine, for managed installs) and NSIS setup `.exe`
  (per-user). MSIX is not produced by the Tauri bundler and is not planned. The
  installers use Tauri's default WebView2 handling: if the runtime is missing they
  download Microsoft's bootstrapper (network needed at install time only).
- **Signing:** an Authenticode certificate (OV certificate, or Azure Trusted
  Signing) is needed to avoid SmartScreen warnings. Secrets to provide later:
  `WINDOWS_CERTIFICATE` (base64 PFX) and `WINDOWS_CERTIFICATE_PASSWORD`, or the
  Azure signing credentials used by a `bundle.windows.signCommand`.
- **CI job:** `desktop.yml`, `windows-latest`, artifact
  `branchxo-desktop-windows-x64`. Baseline desktop CI [passed](https://github.com/etabli-dev/etabli-branchxo/actions/runs/42525631266); not run locally, current changes await a new run.
- **Acceptance:** CI green; on Windows 11 x64 both installers install, the Start
  menu entry starts the game, the journey above passes, uninstall removes the
  program; SmartScreen behaviour of the unsigned build is recorded.

### macOS

- **Build:** on a Mac with Xcode command line tools, Node 22 and Rust with both
  targets (`rustup target add aarch64-apple-darwin x86_64-apple-darwin`):
  `npm run desktop:build -- --target universal-apple-darwin --bundles dmg`.
- **Formats:** DMG containing a universal `.app`. It is currently ad-hoc signed
  (`signingIdentity: "-"`) and not notarized, so Gatekeeper blocks a normal
  double-click; users have to allow it in System Settings → Privacy & Security.
- **Signing and notarization:** Apple Developer Program membership, a *Developer
  ID Application* certificate and notarization credentials. Secrets for CI:
  `APPLE_CERTIFICATE` (base64 `.p12`), `APPLE_CERTIFICATE_PASSWORD`,
  `APPLE_SIGNING_IDENTITY`, and either `APPLE_API_ISSUER`/`APPLE_API_KEY`/
  `APPLE_API_KEY_PATH` (App Store Connect API key) or `APPLE_ID`/`APPLE_PASSWORD`
  (app-specific password)/`APPLE_TEAM_ID`. Tauri signs and notarizes when they are
  set. The same membership covers iOS.
- **CI job:** `desktop.yml`, `macos-15`, artifact
  `branchxo-desktop-macos-universal`. Local arm64 package checks passed;
  interactive acceptance and Intel runtime remain open ([audit](apple-audit-2026-11-08.md)).
- **Acceptance:** CI green; the DMG opens on Apple Silicon and Intel Macs, the app
  runs the journey above; after signing, `spctl -a -vv` reports a notarized
  Developer ID app and it opens without warnings.

### iOS

- **What exists:** `app.json` sets bundle ID `com.raban.branchxo`, build number 1,
  `supportsTablet: true` and `ITSAppUsesNonExemptEncryption: false`. `eas.json`
  has three profiles: `development` (development client, internal distribution),
  `preview` (internal, iOS simulator build) and `production` (auto-incremented
  build numbers, `m-medium` builder). `appVersionSource` is `remote`.
- **What is missing:** no EAS project is linked; signed builds and device runs remain open.
  `expo-dev-client` is not installed (the `development` profile needs it), and
  `expo-updates` is not installed, so the profile channels have no effect (OTA
  updates are not planned). Store screenshots are open. `SUBMISSION-branchxo.md`
  (2026-06-23) still calls the icon a placeholder; the current suite icon was
  wired in on 2026-06-24 and needs the owner's confirmation as final art.
- **Build:** `npx eas login`, `npx eas init` (writes the project ID),
  `npx eas build -p ios --profile preview` (simulator build), then
  `npx eas build -p ios --profile production`. On a Mac with Xcode 26.4+,
  `npx expo run:ios` builds locally.
- **Distribution:** `npx eas submit -p ios --profile production --latest` uploads
  to App Store Connect → TestFlight (internal testers) → App Store review.
- **Prerequisites:** Apple Developer Program, an App Store Connect record for
  `com.raban.branchxo`, the real `appleId`, `ascAppId` and `appleTeamId` in
  `eas.json` (or an App Store Connect API key via `eas credentials`), a hosted
  privacy policy URL, iPhone and iPad screenshots.
- **CI job:** `ios.yml` compiles an unsigned iPhone Release after Expo prebuild
  and CocoaPods. Its first remote run is pending; it needs no EAS account. EAS
  remains the configured path for signed TestFlight builds.
- **Acceptance:** the TestFlight build installs on a physical iPhone and iPad;
  hotseat win → force quit → relaunch keeps the game; branch; vs-computer reply and
  cancellation on reset; VoiceOver reads cell and node labels.

### Android

- **What exists:** CI builds a debug APK (needs Metro) and a standalone release
  APK with the embedded bundle, plus a release AAB, all signed with the public
  Android Debug key. It checks APK permissions, the embedded bundle and
  debug/release lint with their generated models. The only published binary is the older
  debug-signed APK in the `v0.1.0` pre-release, which the documentation site links
  as "Download v0.1.0 (APK)". `eas.json` builds an APK in `preview` and an
  AAB in `production`; `submit.production.android` targets the `internal` track
  with `./google-service-account.json`.
- **Signed APK on GitHub Releases:** build with EAS (`npx eas build -p android
  --profile preview`; EAS keeps the release keystore) or locally with an
  owner-held keystore (`*.jks` is git-ignored). Attach the APK and its SHA-256 to a
  new GitHub Release that replaces the `v0.1.0` pre-release (the tag already
  exists, so the version must be bumped first). Note that Android refuses to
  update an app signed with a different key: users of the debug-signed `v0.1.0`
  APK must uninstall it, which deletes their saved games. A CI release job would
  need `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`
  and `ANDROID_KEY_PASSWORD`.
- **Google Play:** `npx eas build -p android --profile production` → AAB with Play
  App Signing. Upload the first AAB manually in Play Console, then
  `npx eas submit -p android --profile production --latest` to the internal track.
- **F-Droid:** not prepared in this repository (no metadata, prebuilt native
  dependencies); not planned.
- **Prerequisites:** Google Play Console account, an app record for
  `com.raban.branchxo`, a service-account JSON key with release rights, content
  rating and Data safety answers (in `STORE-LISTING.md`), feature graphic and
  screenshots. New personal developer accounts must run a closed test with
  testers before production access; check the current Play Console requirement.
- **CI job:** `android` in `checks.yml` (development APKs). A signed release job is
  a later milestone.
- **Acceptance:** the signed APK installs on a physical arm64 phone and a 16 KiB
  page-size device or emulator; the AAB passes the Play pre-launch report in
  internal testing; native AI reply and cancellation work.

### Web (bonus)

`npm run export -- --platform web` writes `dist/`; serve it at the origin root
(asset paths and `/canvaskit.wasm` are absolute). Hosting under a sub-path such as
the project's GitHub Pages site would need Expo's `experiments.baseUrl` and a
relative `locateFile` for CanvasKit. Not planned unless the owner wants a playable
web page.

## 5. Milestones

1. **M1 – CI green.** Verify the current changes with the strict dated Expo
   policy gate, then adopt the reviewed SDK 58 patches on or after 2026-11-17
   when they meet the two-week age rule. Push and get
   *Application checks* and `desktop.yml` green on `ubuntu-24.04`,
   `windows-latest` and `macos-15`. Exit: all jobs green and artifacts with the
   expected file names (`etabli-branchxo_0.1.0_amd64.deb`, AppImage, MSI, NSIS
   `.exe`, universal DMG).
2. **M2 – Linux desktop acceptance on real hardware.** Install the CI `.deb` on
   Ubuntu 24.04 (and 26.04) with GPU, run the Ubuntu/Debian acceptance list,
   including the first-frame Skia check; run the AppImage on one non-Debian
   distribution. Exit: dated evidence in the refinement record, issues fixed.
3. **M3 – Windows and macOS acceptance of unsigned builds.** Windows 11 x64 and
   one Apple Silicon Mac. Exit: journeys pass; SmartScreen/Gatekeeper behaviour
   documented in the README.
4. **M4 – EAS project and signed iOS acceptance.** The first local unsigned native
   Release compile passed; `eas init`, `preview` simulator build,
   `production` build, TestFlight internal test on iPhone and iPad. Exit: iOS
   acceptance list passes.
5. **M5 – Android release signing.** Release keystore (EAS-managed or owner-held),
   signed APK attached to a new GitHub Release (version bumped past `0.1.0`), AAB
   in Play internal testing, documentation download link updated. Exit: Android
   acceptance list passes.
6. **M6 – Desktop signing.** Developer ID signing and notarization for macOS,
   Authenticode for Windows, wired into a tag-triggered release job that is the
   only job with `contents: write`. Exit: signed artifacts open without warnings.
7. **M7 – Store submissions.** Final icon art, screenshots, hosted privacy policy,
   App Store review and Play production rollout. Exit: both listings live.
8. **M8 – Desktop layout (partial).** The wider-window board/settings layout and
   1280 × 800 browser regression are implemented and checked. Keyboard-specific
   navigation and remembered window size remain open; the latter would add
   `tauri-plugin-window-state` and one capability.

M1–M3 need no accounts and can start immediately; M4–M7 depend on the owner
decisions below.

## 6. Owner decisions and prerequisites

- **Accounts:** Apple Developer Program (iOS and macOS signing), Google Play
  Console, Expo account for EAS; for Windows signing an Authenticode certificate
  or Azure Trusted Signing, or a decision to ship unsigned with a warning.
- **Identity:** the desktop app uses the mobile identifier `com.raban.branchxo`
  and the package name `etabli-branchxo` (window title "branchxo"). Changing the
  identifier later moves desktop saved games and is impossible in the stores.
- **Version numbers:** `app.json` and `package.json` say `0.1.0`, and the tag
  `v0.1.0` already holds the old APK pre-release. The desktop packages take their
  version from `package.json`. Decide the next version (for example `0.2.0` for the
  first signed builds) and whether the first store release is `1.0.0`.
- **Release channel for desktop builds:** GitHub Releases from tags (needs a
  release job with `contents: write`) or CI artifacts only.
- **Windows WebView2 mode:** keep the download bootstrapper or embed the offline
  installer (about 127 MB larger).
- **Privacy policy URL:** host `PRIVACY.md` (for example on the existing Pages
  site) before store submission.
- **Icon:** confirm the current suite icon as final store art; store screenshots
  still have to be captured.
- **Optional channels:** Flatpak/Flathub, an APT repository, F-Droid and a hosted
  web version are not planned; each needs an explicit decision.
