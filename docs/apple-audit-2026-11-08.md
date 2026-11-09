# Apple platform audit — 8–9 November 2026

The game now uses a side-by-side board and settings layout when the window is
at least 900 × 600. Smaller windows retain the phone layout. A browser regression
checks the 1280 × 800 layout; the exported screenshot was also visually checked.

Cancelling a computer move previously left the thinking flag set, so remounting
the game screen could prevent the computer from resuming. Cancellation now clears
that transient state. A regression first reproduced the failure and now checks
that a cancelled move can resume without adding an extra move.

## Verified checks

| Check | Result |
|---|---|
| TypeScript, ESLint, Jest | Passed; 63 tests |
| Expo export | Web, Android and iOS bundles produced |
| Chromium journeys | 3 passed, including the desktop layout |
| npm audit | No high or critical findings; 28 moderate and 4 low remain |
| Expo policy gate | Passed with the explicit temporary quarantine; 10 offline fixtures passed |
| Expo iOS prebuild and CocoaPods | Passed with the committed dependency versions |
| Native iPhone Release | Passed; arm64 iPhoneOS app, iOS 16.4+, phone/tablet families, 3.56 MB embedded game bundle |
| Android native gates | Debug/release APK, release AAB and both lint models passed; debug/release lint: 0 errors, 42/40 warnings |
| Android packaged checks | Permissions, embedded game bundle, APK signature, 16 KiB ZIP alignment and all 23 arm64 ELF libraries passed |
| macOS package | Local arm64 DMG built; disk-image integrity and extracted app strict signature checks passed (ad-hoc signing) |
| macOS interactive journey | Blocked: accessibility could not obtain an app window; process liveness alone is not gameplay acceptance |

The 32 affected dependency entries propagate three underlying advisories. The
[dependency review](dependency-audit-2026-11-09.md) records exact routes,
build/test exposure, upstream fixes, release dates and incompatible parent ranges.
No high/critical finding is waived and no forced dependency override was applied.

The checks used Node 22.23.4 and Xcode 27.2 on an Apple Silicon Mac. Native iOS
sources are generated in the ignored `ios/` directory; they are not committed.
The new `Native iOS build` workflow performs an unsigned device Release compile
on macOS and retains its build log. Its first remote run has not yet been observed.

The Android lint run found Expo generating `android:windowSplashScreenBehavior`
in the base splash style despite its API 33 requirement. A local config plugin
now moves that setting to `values-v33`, preserving the complete splash style and
parent there. Both clean prebuilds verify this without raising the minimum SDK
or disabling Android lint.

The packaged macOS apps stayed alive with isolated test data, but the GUI tool
returned `cgWindowNotFound` (and a Branchxo retry timed out). No native gameplay
or native screenshot was obtained. Browser layout journeys passed separately.

## Reproduce

```sh
npm ci
npm run check
npm run check:expo
npm run export -- --platform all --max-workers 2
npm run test:browser
npx expo prebuild --platform ios --no-install
(cd ios && pod install)
EXTRA_PACKAGER_ARGS='--max-workers 2' xcodebuild -workspace ios/etablibranchxo.xcworkspace -scheme etablibranchxo \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/branchxo-ios-build -jobs 2 CODE_SIGNING_ALLOWED=NO build
```

Android generation and native checks use JDK 17 and the pinned SDK/NDK from
`.github/workflows/checks.yml`:

```sh
npx expo prebuild --platform android --no-install
(cd android && ./gradlew --no-daemon --max-workers=2 \
  :app:assembleDebug :app:assembleRelease :app:bundleRelease \
  :app:lintDebug :app:lintRelease \
  :app:generateDebugLintModel :app:generateReleaseLintModel \
  -PreactNativeArchitectures=arm64-v8a)
npm run check:android-permissions
npm run desktop:build -- --bundles dmg -- --locked
```

For a macOS 14+ launch check, `ETABLI_SMOKE_TEST=1` starts the packaged app
with a fresh WKWebView data store and a 1280 × 800 window. Normal launches use the existing saved-game
store. This flag is intended for smoke tests; each test launch starts empty.

The raw Expo version check still requests the SDK 58 patches published on
3 November. `npm run check:expo` delegates to that check and temporarily accepts
only the three reviewed installed/recommended version pairs listed in the
[roadmap](platform-roadmap.md). This quarantine expires at 2026-11-17 00:00 UTC;
unknown mismatches, tool errors and expiry remain blocking. Ten offline policy
fixtures and two Android splash-resource fixtures pass. Native compatibility is established by the separate builds above,
not by the quarantine. No dependency versions changed.

Signing, notarization, TestFlight, real-device acceptance and store publication
remain separate release gates. No production credentials or saved games were used.

Detailed local logs and screenshots are retained in
`/Users/rh/Documents/Etabli-Fleet-Audit-2026-11-08/games/`.
