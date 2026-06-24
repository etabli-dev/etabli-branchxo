#!/usr/bin/env bash
# capture.sh — deterministic screenshot harness for etabli-branchxo (v0.1.0)
#
# Regenerates every figure used in vignettes/etabli-branchxo.md from a running
# release build on a booted Android emulator/device. Reproducible: same taps,
# same slugs, same output paths every run.
#
# Prereqs: adb on PATH; a device/emulator booted; the release APK installed
#   (android/app/build/outputs/apk/release/app-release.apk).
# Usage:   bash scripts/capture.sh
set -euo pipefail

PKG=com.raban.branchxo
OUT="$(cd "$(dirname "$0")/.." && pwd)/vignettes/assets/0.1.0"
mkdir -p "$OUT"

cap(){ adb exec-out screencap -p > "$OUT/$1.png"; echo "  + $1.png"; }
tap(){ adb shell input tap "$1" "$2"; sleep "${3:-0.7}"; }

# 3x3 board cell centres on a 1080x2400 screen (row-major 0..8)
CX=(280 540 800 280 540 800 280 540 800)
CY=(690 690 690 950 950 950 1220 1220 1220)
cell(){ tap "${CX[$1]}" "${CY[$1]}"; }

# view-switcher tabs (segmented control, y=443)
TAB_BOARD=175; TAB_TIMELINE=415; TAB_MULTI=660; TAB_HEAT=905
view(){ tap "$1" 443 0.8; }

# deterministic fresh state
adb shell am force-stop "$PKG"
adb shell pm clear "$PKG" >/dev/null 2>&1 || true
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 5

cap 01-home-base
cell 4;            cap 02-first-move        # X centre
cell 0;            cap 03-o-reply           # O corner
cell 8; cell 2;    cap 04-midgame           # build a position
view $TAB_TIMELINE; cap 05-timeline-view
view $TAB_MULTI;    cap 06-multiverse-one
view $TAB_HEAT;     cap 07-heat-view
view $TAB_BOARD;    cap 08-board-back

# --- branch / multiverse flow ---
tap 440 1600 0.8                 # scrub timeline back to ply 2
cap 09-scrubbed-ply2
cell 6                            # tap a different empty cell -> fork prompt
cap 10-branch-prompt
tap 866 1372 1.0                  # press "Branch"
cap 11-after-branch
view $TAB_MULTI;    cap 12-multiverse-two
view $TAB_HEAT;     cap 12b-heat-branched

# --- settings + reset ---
view $TAB_BOARD
adb shell input swipe 540 1900 540 500 300; sleep 0.8
cap 13-settings
tap 540 2060 1.0                  # "New game (reset multiverse)"
view $TAB_BOARD
adb shell input swipe 540 600 540 1900 300; sleep 0.6
cap 15-reset-fresh

echo "Captured $(ls "$OUT"/*.png | wc -l) frames to $OUT"
