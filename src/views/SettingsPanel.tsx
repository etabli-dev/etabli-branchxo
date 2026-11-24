import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AiLevel } from '../ai';
import { Mark } from '../game';
import { ProbMode } from '../analysis';
import { useStrings } from '../i18n';
import { useAppStore, Mode } from '../state';
import { SegmentedControl, fonts, spacing, radii, useChrome } from '../ui';
import { AppearanceSettings } from './AppearanceSettings';
import { Field } from './Field';

export function SettingsPanel() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const aiLevel = useAppStore((s) => s.aiLevel);
  const setAiLevel = useAppStore((s) => s.setAiLevel);
  const aiMark = useAppStore((s) => s.aiMark);
  const setAiMark = useAppStore((s) => s.setAiMark);
  const probMode = useAppStore((s) => s.probMode);
  const setProbMode = useAppStore((s) => s.setProbMode);
  const overlayFlags = useAppStore((s) => s.overlayFlags);
  const setOverlayFlag = useAppStore((s) => s.setOverlayFlag);
  const newGame = useAppStore((s) => s.newGame);
  const t = useStrings();
  const c = useChrome();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label={t.modeLabel}>
        <SegmentedControl<Mode>
          options={[
            { value: 'hotseat', label: t.hotseat.short, accessibilityLabel: t.hotseat.full },
            { value: 'vs-computer', label: t.vsComputer.short, accessibilityLabel: t.vsComputer.full },
          ]}
          value={mode}
          onChange={setMode}
          testID="settings.mode"
        />
      </Field>

      {mode === 'vs-computer' && (
        <>
          <Field label={t.aiLevelLabel}>
            <SegmentedControl<AiLevel>
              options={[
                { value: 'easy', label: t.aiEasy },
                { value: 'medium', label: t.aiMedium },
                { value: 'perfect', label: t.aiPerfect },
              ]}
              value={aiLevel}
              onChange={setAiLevel}
              testID="settings.aiLevel"
            />
          </Field>
          <Field label={t.aiPlaysAs}>
            <SegmentedControl<Mark>
              options={[
                { value: 'X', label: 'X' },
                { value: 'O', label: 'O' },
              ]}
              value={aiMark}
              onChange={setAiMark}
              testID="settings.aiMark"
            />
          </Field>
        </>
      )}

      <Field label={t.probModeLabel}>
        <SegmentedControl<ProbMode>
          options={[
            { value: 'perfect', label: t.probPerfect.short, accessibilityLabel: t.probPerfect.full },
            { value: 'random', label: t.probRandom.short, accessibilityLabel: t.probRandom.full },
          ]}
          value={probMode}
          onChange={setProbMode}
          testID="settings.probMode"
        />
      </Field>

      <Field label={mode === 'vs-computer' ? t.hintsYouPlay(aiMark === 'X' ? 'O' : 'X') : t.hintsPerPlayer}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(mode === 'hotseat' || aiMark !== 'X') && (
            <Toggle
              label={t.hints('X')}
              value={overlayFlags.X}
              onPress={() => setOverlayFlag('X', !overlayFlags.X)}
              testID="settings.hints.X"
            />
          )}
          {(mode === 'hotseat' || aiMark !== 'O') && (
            <Toggle
              label={t.hints('O')}
              value={overlayFlags.O}
              onPress={() => setOverlayFlag('O', !overlayFlags.O)}
              testID="settings.hints.O"
            />
          )}
        </View>
      </Field>

      <Pressable
        onPress={newGame}
        accessibilityRole="button"
        accessibilityLabel={t.newGameA11y}
        testID="settings.newGame"
        style={[styles.newGame, { borderColor: c.accent }]}
      >
        <Text numberOfLines={1} style={[styles.newGameText, { color: c.accent }]}>{t.newGame}</Text>
      </Pressable>

      <AppearanceSettings />
    </ScrollView>
  );
}

function Toggle({ label, value, onPress, testID }: { label: string; value: boolean; onPress: () => void; testID: string }) {
  const c = useChrome();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      testID={testID}
      style={[
        styles.toggle,
        { backgroundColor: c.surface, borderColor: c.border },
        value && { backgroundColor: c.accent, borderColor: c.accent },
      ]}
    >
      <Text numberOfLines={1} style={[styles.toggleText, { color: value ? c.onAccent : c.textDim }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  toggleText: { ...fonts.label },
  newGame: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  newGameText: { ...fonts.label },
});
