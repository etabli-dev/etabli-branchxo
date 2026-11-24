import {
  ACCENT_CHOICES,
  ACCENT_VALUES,
  APPEARANCE_ACCENT_KEY,
  APPEARANCE_MODES,
  APPEARANCE_MODE_KEY,
  APP_LANGUAGES,
  APP_LANGUAGE_KEY,
  CODER_PALETTE,
  SELECTION_OPACITY,
  blend,
  contrastRatio,
  hasNeutralSelection,
  hueAndChroma,
  isYellowish,
  matchLanguage,
  parseAccent,
  parseLanguage,
  parseMode,
  resolveLanguage,
  resolveScheme,
  selectionTint,
} from '../src/settings/appearance';
import { STRINGS } from '../src/i18n/strings';
import { TEXT_DIM, chromeColors } from '../src/ui/theme';

const schemes = ['light', 'dark'] as const;
const background = { light: CODER_PALETTE.backgroundLight, dark: CODER_PALETTE.backgroundDark };
const surface = { light: CODER_PALETTE.surfaceLight, dark: CODER_PALETTE.surfaceDark };
const foreground = { light: CODER_PALETTE.foregroundLight, dark: CODER_PALETTE.foregroundDark };
const onAccent = { light: CODER_PALETTE.onAccentLight, dark: CODER_PALETTE.onAccentDark };

describe('appearance model (suite-wide keys, values and order)', () => {
  it('uses the shared stored keys and raw values in the decided order', () => {
    expect(APPEARANCE_MODE_KEY).toBe('appearance.mode');
    expect(APPEARANCE_ACCENT_KEY).toBe('appearance.accent');
    expect(APP_LANGUAGE_KEY).toBe('app.language');
    expect(APPEARANCE_MODES).toEqual(['system', 'light', 'dark']);
    expect(ACCENT_CHOICES).toEqual(['coderBlue', 'green', 'yellow', 'orange', 'red', 'purple', 'graphite']);
    expect(APP_LANGUAGES).toEqual(['system', 'de', 'en']);
  });

  it('falls back to the defaults for missing or unknown stored values', () => {
    expect(parseMode(null)).toBe('system');
    expect(parseMode('dark')).toBe('dark');
    expect(parseMode('Dark')).toBe('system');
    expect(parseMode('auto')).toBe('system');
    expect(parseAccent(undefined)).toBe('coderBlue');
    expect(parseAccent('yellow')).toBe('yellow');
    expect(parseAccent('teal')).toBe('coderBlue');
    expect(parseAccent('brown')).toBe('coderBlue');
    expect(parseAccent('')).toBe('coderBlue');
    expect(parseAccent(42)).toBe('coderBlue');
    expect(parseLanguage('de')).toBe('de');
    expect(parseLanguage('fr')).toBe('system');
    expect(parseLanguage('DE')).toBe('system');
  });

  it('keeps the owner’s colour table', () => {
    expect(ACCENT_VALUES).toEqual({
      coderBlue: { light: '#1565C0', dark: '#42A5F5' },
      green: { light: '#2E7D32', dark: '#66BB6A' },
      yellow: { light: '#8C6200', dark: '#FFCA28' },
      orange: { light: '#BF360C', dark: '#FFA726' },
      red: { light: '#C62828', dark: '#E57373' },
      purple: { light: '#4527A0', dark: '#B39DDB' },
      graphite: { light: '#212121', dark: '#DADADA' },
    });
    expect(CODER_PALETTE).toMatchObject({
      backgroundLight: '#FAFAFA', backgroundDark: '#212121',
      foregroundLight: '#212121', foregroundDark: '#DADADA',
      surfaceLight: '#E0E0E0', surfaceDark: '#424242',
      onAccentLight: '#FFFFFF', onAccentDark: '#212121',
    });
  });

  it.each(ACCENT_CHOICES)('%s reaches 4.5:1 against the background and with its on-accent text', (accent) => {
    for (const scheme of schemes) {
      const value = ACCENT_VALUES[accent][scheme];
      expect(contrastRatio(value, background[scheme])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(value, onAccent[scheme])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps chrome text readable on the background, surface and every selection fill', () => {
    for (const scheme of schemes) {
      for (const base of [background[scheme], surface[scheme]]) {
        expect(contrastRatio(foreground[scheme], base)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(TEXT_DIM[scheme], base)).toBeGreaterThanOrEqual(4.5);
      }
      for (const accent of ACCENT_CHOICES) {
        const chrome = chromeColors(scheme, accent);
        expect(contrastRatio(chrome.text, chrome.selection)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(chrome.accent, chrome.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(chrome.onAccent, chrome.accent)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('never tints a background yellow (hue 30–70°, chroma ≥ 8)', () => {
    // The check itself: greys pass, the old orange fill and the yellow accents are caught.
    expect(hueAndChroma('#DADADA')).toEqual({ hue: null, chroma: 0 });
    expect(isYellowish('#808478')).toBe(false); // chroma 12 but hue 75°
    expect(isYellowish(blend('#FFA726', CODER_PALETTE.backgroundDark))).toBe(true);
    expect(isYellowish(ACCENT_VALUES.yellow.light)).toBe(true);
    expect(isYellowish(ACCENT_VALUES.yellow.dark)).toBe(true);

    for (const accent of ACCENT_CHOICES) {
      const neutral = accent === 'yellow' || accent === 'orange';
      expect(hasNeutralSelection(accent)).toBe(neutral);
      for (const scheme of schemes) {
        const tint = selectionTint(accent, scheme);
        expect(tint).toBe(neutral ? foreground[scheme] : ACCENT_VALUES[accent][scheme]);
        expect(isYellowish(tint)).toBe(false);
        for (const base of [background[scheme], surface[scheme]]) {
          expect(isYellowish(blend(tint, base, SELECTION_OPACITY))).toBe(false);
        }
        expect(isYellowish(chromeColors(scheme, accent).selection)).toBe(false);
      }
    }
  });

  it('resolves the shown scheme and the app language', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(matchLanguage(['de-DE', 'en-US'])).toBe('de');
    expect(matchLanguage(['fr-FR', 'de-CH'])).toBe('de');
    expect(matchLanguage(['fr-FR'])).toBe('en');
    expect(matchLanguage([])).toBe('en');
    expect(matchLanguage(['en_GB'])).toBe('en');
    expect(resolveLanguage('system', ['de'])).toBe('de');
    expect(resolveLanguage('en', ['de'])).toBe('en');
    expect(resolveLanguage('de', ['en'])).toBe('de');
  });
});

describe('string catalogues', () => {
  function shape(value: unknown): unknown {
    if (typeof value === 'function') return `fn${value.length}`;
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
    }
    return typeof value;
  }

  function leaves(value: unknown, path = ''): [string, string][] {
    if (typeof value === 'string') return [[path, value]];
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
    }
    return [];
  }

  it('German and English have the same entries', () => {
    expect(shape(STRINGS.de)).toEqual(shape(STRINGS.en));
  });

  it('no entry is empty or left untranslated by mistake', () => {
    for (const lang of ['de', 'en'] as const) {
      for (const [path, text] of leaves(STRINGS[lang])) expect([path, text.trim().length > 0]).toEqual([path, true]);
    }
    const same = leaves(STRINGS.de).filter(([path, text]) => leaves(STRINGS.en).some(([p, t]) => p === path && t === text));
    // Identical in both languages on purpose: names and symbols.
    expect(same.map(([path]) => path).sort()).toEqual(
      ['.accentNames.orange', '.languageSystem', '.modeSystem'].sort(),
    );
  });

  it('accent names follow the owner’s German labels', () => {
    expect(Object.values(STRINGS.de.accentNames)).toEqual(['Coder-Blau', 'Grün', 'Gelb', 'Orange', 'Rot', 'Violett', 'Graphit']);
    expect(Object.keys(STRINGS.de.accentNames)).toEqual([...ACCENT_CHOICES]);
  });

  it('interpolates counts and marks', () => {
    expect(STRINGS.en.universes(1)).toBe('1 universe');
    expect(STRINGS.en.universes(2)).toBe('2 universes');
    expect(STRINGS.de.universes(1)).toBe('1 Universum');
    expect(STRINGS.de.universes(3)).toBe('3 Universen');
    expect(STRINGS.en.cellA11y(3, 'X')).toBe('Cell 3, X');
    expect(STRINGS.de.cellA11y(9, null)).toBe('Feld 9, leer');
  });
});
