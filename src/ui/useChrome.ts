import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { resolveScheme } from '../settings/appearance';
import { usePreferences } from '../settings/preferences';
import { Chrome, chromeColors } from './theme';

/** The chrome colours for the chosen mode and accent; re-renders at once when either changes. */
export function useChrome(): Chrome {
  const mode = usePreferences((s) => s.mode);
  const accent = usePreferences((s) => s.accent);
  const system = useColorScheme();
  const scheme = resolveScheme(mode, system);
  return useMemo(() => chromeColors(scheme, accent), [scheme, accent]);
}
