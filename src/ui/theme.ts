/**
 * Color-blind-safe palette.
 *
 * X / O marks use shape + color so total-color-blindness still distinguishes them
 * (X = saturated blue/cyan, O = saturated orange — Okabe–Ito accessible pairing).
 *
 * Outcome colors:
 *   X-win   → blue
 *   O-win   → orange
 *   draw    → neutral grey
 *   open    → soft purple
 */

export const colors = {
  bg: '#0b1020',
  bgElev: '#141a30',
  panel: '#1c2340',
  text: '#eef0fa',
  textDim: '#9aa3c7',
  border: '#2b345c',
  accent: '#7dd3fc',

  markX: '#3b82f6', // blue
  markO: '#f59e0b', // orange
  markXSoft: 'rgba(59, 130, 246, 0.18)',
  markOSoft: 'rgba(245, 158, 11, 0.18)',

  outcomeXWin: '#60a5fa',
  outcomeOWin: '#fbbf24',
  outcomeDraw: '#94a3b8',
  outcomeOpen: '#a78bfa',

  heatLow: '#440154',
  heatMid: '#21918c',
  heatHigh: '#fde725',
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const fonts = {
  body: { fontSize: 14 },
  small: { fontSize: 12 },
  title: { fontSize: 22, fontWeight: '700' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
} as const;

/** Viridis-ish gradient for the heat overlay. */
export function viridis(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  // 3-stop interpolation
  const stops: readonly { t: number; r: number; g: number; b: number }[] = [
    { t: 0.0, r: 0x44, g: 0x01, b: 0x54 },
    { t: 0.5, r: 0x21, g: 0x91, b: 0x8c },
    { t: 1.0, r: 0xfd, g: 0xe7, b: 0x25 },
  ];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (a && b && clamped <= b.t) {
      const span = b.t - a.t;
      const u = span === 0 ? 0 : (clamped - a.t) / span;
      const r = Math.round(a.r + (b.r - a.r) * u);
      const g = Math.round(a.g + (b.g - a.g) * u);
      const bb = Math.round(a.b + (b.b - a.b) * u);
      return `rgb(${r},${g},${bb})`;
    }
  }
  const last = stops[stops.length - 1];
  return last ? `rgb(${last.r},${last.g},${last.b})` : '#fff';
}
