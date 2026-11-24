import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform, Settings } from 'react-native';
import { create } from 'zustand';
import {
  APPEARANCE_ACCENT_KEY,
  APPEARANCE_MODE_KEY,
  APP_LANGUAGE_KEY,
  AccentChoice,
  AppLanguage,
  AppearanceMode,
  parseAccent,
  parseLanguage,
  parseMode,
} from './appearance';

/**
 * The appearance and language choice (Settings → Appearance), stored on the device under the
 * suite-wide keys `appearance.mode`, `appearance.accent` and `app.language`, separately from the
 * saved game. On iOS a launch argument such as `-appearance.mode dark -app.language de` (the user
 * defaults' argument domain, as in the native apps) sets the starting value for screenshots/tests.
 */
interface PreferencesState {
  mode: AppearanceMode;
  accent: AccentChoice;
  language: AppLanguage;
  hydrated: boolean;
  setMode: (mode: AppearanceMode) => void;
  setAccent: (accent: AccentChoice) => void;
  setLanguage: (language: AppLanguage) => void;
}

function persist(key: string, value: string): void {
  AsyncStorage.setItem(key, value).catch((e: unknown) => {
    if (__DEV__) console.warn('branchxo: could not store', key, e);
  });
}

/** Applies the mode to the native windows, so system sheets, alerts and the keyboard follow it. */
function applyNativeScheme(mode: AppearanceMode): void {
  try {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
    }
  } catch (e) {
    if (__DEV__) console.warn('branchxo: could not apply the colour scheme', e);
  }
}

export const usePreferences = create<PreferencesState>((set) => ({
  mode: 'system',
  accent: 'coderBlue',
  language: 'system',
  hydrated: false,
  setMode: (mode) => {
    set({ mode });
    applyNativeScheme(mode);
    persist(APPEARANCE_MODE_KEY, mode);
  },
  setAccent: (accent) => {
    set({ accent });
    persist(APPEARANCE_ACCENT_KEY, accent);
  },
  setLanguage: (language) => {
    set({ language });
    persist(APP_LANGUAGE_KEY, language);
  },
}));

/** iOS launch-argument value for `key`, if any (only the argument domain sets these keys). */
function launchArgument(key: string): unknown {
  if (Platform.OS !== 'ios') return undefined;
  try {
    return typeof Settings?.get === 'function' ? Settings.get(key) : undefined;
  } catch {
    return undefined;
  }
}

/** The device's preferred languages, most preferred first. */
export function devicePreferredLanguages(): string[] {
  try {
    if (Platform.OS === 'ios' && typeof Settings?.get === 'function') {
      const list = Settings.get('AppleLanguages');
      if (Array.isArray(list)) return list.filter((v): v is string => typeof v === 'string');
    }
    if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      return [...navigator.languages];
    }
    return [Intl.DateTimeFormat().resolvedOptions().locale];
  } catch {
    return [];
  }
}

export async function hydratePreferences(): Promise<void> {
  let stored: readonly (readonly [string, string | null])[] = [];
  try {
    stored = await AsyncStorage.multiGet([APPEARANCE_MODE_KEY, APPEARANCE_ACCENT_KEY, APP_LANGUAGE_KEY]);
  } catch (e) {
    if (__DEV__) console.warn('branchxo: could not read the appearance', e);
  }
  const value = (key: string): unknown => launchArgument(key) ?? stored.find(([k]) => k === key)?.[1];
  const mode = parseMode(value(APPEARANCE_MODE_KEY));
  usePreferences.setState({
    mode,
    accent: parseAccent(value(APPEARANCE_ACCENT_KEY)),
    language: parseLanguage(value(APP_LANGUAGE_KEY)),
    hydrated: true,
  });
  applyNativeScheme(mode);
}

declare const __DEV__: boolean;
