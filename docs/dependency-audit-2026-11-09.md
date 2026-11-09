# Dependency advisory review — 9 November 2026

`npm audit --json` reports **28 moderate and 4 low affected dependency entries,
with zero high or critical findings**. These entries propagate three underlying
advisories through parent packages; they are not 32 distinct vulnerabilities.
The existing CI `npm audit --audit-level high` gate remains enabled. This review
records outstanding exposure; it does not declare the dependencies vulnerability-free.

| Underlying advisory | Installed copies and route | Exposure and fix status |
|---|---|---|
| [deepmerge prototype poisoning, GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), low | `deepmerge` 4.3.1 through `jest-config` 30.5.2; the low entries also propagate to Jest, jest-cli and ts-jest | A malicious object supplied to merging can affect the returned object's prototype. This route is test configuration, not game state persistence. The advisory lists no patched version; the registry still lists 4.3.1 as latest. |
| [glob cancellation bypass, GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), moderate | `glob` 13.0.6 through Expo CLI/config/plugins/fingerprint/Metro and Jest; 10.5.0 through Istanbul's `test-exclude` | An aborted filesystem walk can continue consuming resources. The affected use is Node build, export, development-server and test tooling. Attacker-controlled patterns or directory trees can affect those tools; a cancellation timeout is not a reliable resource bound. Patched upstream version: 14.0.2. |
| [minimatch pattern amplification, GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderate | `minimatch` 10.2.6 through glob, Expo fingerprint, TypeScript ESLint and coverage tooling; 9.0.9 inside glob 10.5.0 | Crafted patterns with optimization level 2 or higher can consume excessive CPU/memory. Here patterns originate in repository/tool configuration rather than game input. Patched upstream version: 11.0.1. ESLint's separate 3.1.5 copy is outside this advisory's affected range. |

## Reachability assessment

`npm ls deepmerge glob minimatch --all` and the committed lockfile identify these
routes. App source and Expo's runtime entry/source were checked for imports of
the three packages: none were found. The installed Expo runtime entry exports
native/runtime facilities rather than its Node CLI. The static assessment is
therefore **build/development/test exposure, with no identified path from game
input to these vulnerable operations**. It is not a formal whole-program
reachability proof or an exploit test of every transitive consumer.

Expo itself is a production dependency and includes its tooling in the dependency
graph. An `--omit=dev` audit is consequently not evidence that the exported game
executes these packages, nor would it remove every finding. Untrusted checkout
contents, build configuration, filesystem trees or development tooling inputs
remain relevant. Do not expose the development server as a production service.

## Why versions were retained

The npm registry reports glob 14.0.2 published **2026-10-27 22:07 UTC** and minimatch
11.0.1 published **2026-10-27 22:26 UTC**. Neither meets the repository's fourteen-day
age rule at this review date; they first meet it on **10 November at those UTC
times**. Node 22 meets their declared engine ranges, so Node compatibility is not
the blocker.

Age alone will not make them compatible dependency resolutions. The locked Expo
packages require glob `^13.0.0` and minimatch `^10.2.2`; Jest requires glob
`^13.0.6`, test-exclude requires glob `^10.4.1`, its nested glob requires minimatch
`^9.0.4`, and TypeScript ESLint requires minimatch `^10.2.2`. The published fixes
cross those major-version ranges. No in-range patched release is identified by
the advisories. Prefer aged upstream Expo/Jest/coverage/ESLint releases that adopt
the fixes, then repeat export, browser and native builds. No forced transitive
override was applied.

The audit's automated top-level remedy suggests Expo **52.0.49** or Jest
**25.1.0**. Those are incompatible downgrades from SDK 58/Jest 30, not an acceptable
security update. Deepmerge requires an upstream fix or a reviewed replacement
in its consuming test tool. The separate Expo compatibility quarantine until
17 November concerns three SDK recommendations; it does not suppress npm security
findings and does not resolve these advisories.

Evidence is retained under
`/Users/rh/Documents/Etabli-Fleet-Audit-2026-11-08/games/`:
`etabli-<name>-audit.json`, `<name>-advisory-paths.txt`,
`<name>-advisory-constraints.json`, and `advisory-fix-versions.json`.
