import { resolveLanguage, Language } from '../settings/appearance';
import { devicePreferredLanguages, usePreferences } from '../settings/preferences';
import { STRINGS, Strings } from './strings';

export type { Strings } from './strings';
export { STRINGS } from './strings';

// iOS and Android restart the app when the device language changes, so one read is enough.
const deviceLanguages = devicePreferredLanguages();

export function currentLanguage(): Language {
  return resolveLanguage(usePreferences.getState().language, deviceLanguages);
}

/** The strings of the chosen app language; components re-render at once when it changes. */
export function useStrings(): Strings {
  const choice = usePreferences((s) => s.language);
  return STRINGS[resolveLanguage(choice, deviceLanguages)];
}
