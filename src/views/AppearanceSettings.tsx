import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStrings } from '../i18n';
import {
  ACCENT_CHOICES,
  ACCENT_VALUES,
  APPEARANCE_MODES,
  APP_LANGUAGES,
  AccentChoice,
  AppLanguage,
  AppearanceMode,
} from '../settings/appearance';
import { usePreferences } from '../settings/preferences';
import { SegmentedControl, fonts, spacing, useChrome } from '../ui';
import { Field } from './Field';

/** Settings → Appearance: app language, System / Light / Dark and the accent colour (suite-wide). */
export function AppearanceSettings() {
  const t = useStrings();
  const c = useChrome();
  const mode = usePreferences((s) => s.mode);
  const accent = usePreferences((s) => s.accent);
  const language = usePreferences((s) => s.language);
  const setMode = usePreferences((s) => s.setMode);
  const setAccent = usePreferences((s) => s.setAccent);
  const setLanguage = usePreferences((s) => s.setLanguage);

  const languageLabel: Record<AppLanguage, string> = { system: t.languageSystem, de: 'Deutsch', en: 'English' };
  const modeLabel: Record<AppearanceMode, string> = { system: t.modeSystem, light: t.modeLight, dark: t.modeDark };

  return (
    <View style={[styles.section, { borderTopColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">{t.appearanceTitle}</Text>
      <Field label={t.languageLabel}>
        <SegmentedControl<AppLanguage>
          options={APP_LANGUAGES.map((value) => ({ value, label: languageLabel[value] }))}
          value={language}
          onChange={setLanguage}
          testID="settings.appearance.language"
        />
      </Field>
      <Field label={t.appearanceModeLabel}>
        <SegmentedControl<AppearanceMode>
          options={APPEARANCE_MODES.map((value) => ({ value, label: modeLabel[value] }))}
          value={mode}
          onChange={setMode}
          testID="settings.appearance.mode"
        />
      </Field>
      <Field label={`${t.accentLabel}: ${t.accentNames[accent]}`}>
        <View style={styles.swatches}>
          {ACCENT_CHOICES.map((choice) => (
            <Swatch key={choice} choice={choice} selected={choice === accent} onPress={() => setAccent(choice)} />
          ))}
        </View>
      </Field>
      <Text style={[styles.note, { color: c.textDim }]}>{t.appearanceNote}</Text>
    </View>
  );
}

function Swatch({ choice, selected, onPress }: { choice: AccentChoice; selected: boolean; onPress: () => void }) {
  const t = useStrings();
  const c = useChrome();
  const color = ACCENT_VALUES[choice][c.scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.accentNames[choice]}
      accessibilityHint={t.accentLabel}
      accessibilityState={{ selected }}
      testID={`settings.appearance.accent.${choice}`}
      style={styles.swatchHit}
    >
      <View style={[styles.swatch, { backgroundColor: color, borderColor: selected ? c.text : c.border }, selected && styles.swatchSelected]}>
        {selected && <Text style={[styles.check, { color: c.onAccent }]}>✓</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  title: { ...fonts.label, fontSize: 15 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap' },
  swatchHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderWidth: 2 },
  check: { fontSize: 16, fontWeight: '800', lineHeight: 18 },
  note: { ...fonts.small },
});
