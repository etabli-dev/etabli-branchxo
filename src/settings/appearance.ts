/**
 * Appearance model shared by the Établi apps (owner decision of 2026-11-24): light, dark or the
 * device's mode, an accent colour and the app language. Same stored keys, raw values, colours and
 * order as the native apps' AppearanceModel.swift (etabli-doc/ios/App/AppearanceModel.swift).
 * Missing or unknown stored values (also the removed "teal" and "brown") fall back to the defaults.
 * Pure TypeScript: no React Native imports, so the unit tests can check every value.
 */

export const APPEARANCE_MODE_KEY = 'appearance.mode';
export const APPEARANCE_ACCENT_KEY = 'appearance.accent';
export const APP_LANGUAGE_KEY = 'app.language';

export const APPEARANCE_MODES = ['system', 'light', 'dark'] as const;
export type AppearanceMode = (typeof APPEARANCE_MODES)[number];

export const ACCENT_CHOICES = ['coderBlue', 'green', 'yellow', 'orange', 'red', 'purple', 'graphite'] as const;
export type AccentChoice = (typeof ACCENT_CHOICES)[number];

export const APP_LANGUAGES = ['system', 'de', 'en'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export type Language = Exclude<AppLanguage, 'system'>;

export type ColorScheme = 'light' | 'dark';

function parse<T extends string>(values: readonly T[], stored: unknown, fallback: T): T {
  return typeof stored === 'string' && (values as readonly string[]).includes(stored) ? (stored as T) : fallback;
}

export const parseMode = (stored: unknown): AppearanceMode => parse(APPEARANCE_MODES, stored, 'system');
export const parseAccent = (stored: unknown): AccentChoice => parse(ACCENT_CHOICES, stored, 'coderBlue');
export const parseLanguage = (stored: unknown): AppLanguage => parse(APP_LANGUAGES, stored, 'system');

/**
 * Accent values, light / dark, as #RRGGBB. Light values reach 4.5:1 against the light background and
 * with white on them; dark values against the dark background and with #212121 on them. Coder blue is
 * the Hugo Coder theme's $link-color / $link-color-dark (luizdepra/hugo-coder,
 * assets/scss/_variables.scss); the others are Material tones of the theme's notice colour families.
 */
export const ACCENT_VALUES: Readonly<Record<AccentChoice, { readonly light: string; readonly dark: string }>> = {
  coderBlue: { light: '#1565C0', dark: '#42A5F5' },
  green: { light: '#2E7D32', dark: '#66BB6A' },
  yellow: { light: '#8C6200', dark: '#FFCA28' },
  orange: { light: '#BF360C', dark: '#FFA726' },
  red: { light: '#C62828', dark: '#E57373' },
  purple: { light: '#4527A0', dark: '#B39DDB' },
  graphite: { light: '#212121', dark: '#DADADA' },
};

/** The Hugo Coder theme's neutral colours (luizdepra/hugo-coder, assets/scss/_variables.scss). */
export const CODER_PALETTE = {
  backgroundLight: '#FAFAFA', // $bg-color
  backgroundDark: '#212121', // $bg-color-dark
  foregroundLight: '#212121', // $fg-color
  foregroundDark: '#DADADA', // $fg-color-dark
  surfaceLight: '#E0E0E0', // $alt-bg-color
  surfaceDark: '#424242', // $alt-bg-color-dark
  borderLight: '#CCCCCC', // $darker-alt-bg-color
  borderDark: '#4F4F4F', // $lighter-alt-bg-color-dark
  /** Text and symbols on an accent fill: white in light mode, the dark background in dark mode. */
  onAccentLight: '#FFFFFF',
  onAccentDark: '#212121',
} as const;

/** Opacity of selection fills (selected segments and chips) over the surface behind them. */
export const SELECTION_OPACITY = 0.16;

/**
 * Owner rule (2026-11-24): no yellow shade in any background. Yellow and orange therefore draw
 * selection fills in the mode's neutral text colour instead of their own colour.
 */
export function hasNeutralSelection(accent: AccentChoice): boolean {
  return accent === 'yellow' || accent === 'orange';
}

/** The colour of a selection fill, drawn at SELECTION_OPACITY. */
export function selectionTint(accent: AccentChoice, scheme: ColorScheme): string {
  if (hasNeutralSelection(accent)) {
    return scheme === 'dark' ? CODER_PALETTE.foregroundDark : CODER_PALETTE.foregroundLight;
  }
  return ACCENT_VALUES[accent][scheme];
}

export function accentColor(accent: AccentChoice, scheme: ColorScheme): string {
  return ACCENT_VALUES[accent][scheme];
}

/** The mode actually shown: the device's scheme for "system". */
export function resolveScheme(mode: AppearanceMode, system: string | null | undefined): ColorScheme {
  if (mode !== 'system') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

/**
 * The app language for a list of preferred languages (BCP 47, most preferred first), as
 * Bundle.preferredLocalizations does for an app localised in German and English: the first
 * preferred language the app has, English otherwise.
 */
export function matchLanguage(preferred: readonly unknown[]): Language {
  for (const entry of preferred) {
    if (typeof entry !== 'string') continue;
    const primary = entry.split(/[-_]/)[0]?.toLowerCase();
    if (primary === 'de' || primary === 'en') return primary;
  }
  return 'en';
}

export function resolveLanguage(choice: AppLanguage, preferred: readonly unknown[]): Language {
  return choice === 'system' ? matchLanguage(preferred) : choice;
}

// === Colour arithmetic (used by the theme and the contrast tests) ===

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m || !m[1]) throw new Error(`Not a #RRGGBB colour: ${hex}`);
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

export function rgbToHex([r, g, b]: readonly [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** `top` drawn at `opacity` over the opaque `base`. */
export function blend(top: string, base: string, opacity: number = SELECTION_OPACITY): string {
  const t = hexToRgb(top);
  const b = hexToRgb(base);
  return rgbToHex([0, 1, 2].map((i) => (t[i] ?? 0) * opacity + (b[i] ?? 0) * (1 - opacity)) as [number, number, number]);
}

/** `hex` as an rgba() string at `opacity`. */
export function withOpacity(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function relativeLuminance(hex: string): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2 contrast ratio. */
export function contrastRatio(a: string, b: string): number {
  const x = relativeLuminance(a);
  const y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Hue in degrees (0..<360) and chroma (0..255); a grey has chroma 0 and hue null. */
export function hueAndChroma(hex: string): { hue: number | null; chroma: number } {
  const [r, g, b] = hexToRgb(hex);
  const high = Math.max(r, g, b);
  const chroma = high - Math.min(r, g, b);
  if (chroma === 0) return { hue: null, chroma };
  const sector = high === r ? (g - b) / chroma : high === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  const degrees = sector * 60;
  return { hue: degrees < 0 ? degrees + 360 : degrees, chroma };
}

/** True for a visibly coloured (chroma >= 8) orange-yellow to yellow (hue 30–70°) colour. */
export function isYellowish(hex: string): boolean {
  const { hue, chroma } = hueAndChroma(hex);
  return hue !== null && chroma >= 8 && hue >= 30 && hue <= 70;
}
