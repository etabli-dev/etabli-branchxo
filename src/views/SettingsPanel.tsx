import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AiLevel } from '../ai';
import { Mark } from '../game';
import { ProbMode } from '../analysis';
import { useAppStore, Mode } from '../state';
import { SegmentedControl, colors, fonts, spacing, radii } from '../ui';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label="Mode">
        <SegmentedControl<Mode>
          options={[
            { value: 'hotseat', label: 'Hotseat' },
            { value: 'vs-computer', label: 'vs Computer' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </Field>

      {mode === 'vs-computer' && (
        <>
          <Field label="AI level">
            <SegmentedControl<AiLevel>
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'perfect', label: 'Perfect' },
              ]}
              value={aiLevel}
              onChange={setAiLevel}
            />
          </Field>
          <Field label="AI plays as">
            <SegmentedControl<Mark>
              options={[
                { value: 'X', label: 'X' },
                { value: 'O', label: 'O' },
              ]}
              value={aiMark}
              onChange={setAiMark}
            />
          </Field>
        </>
      )}

      <Field label="Probability mode">
        <SegmentedControl<ProbMode>
          options={[
            { value: 'perfect', label: 'vs Perfect' },
            { value: 'random', label: 'vs Random' },
          ]}
          value={probMode}
          onChange={setProbMode}
        />
      </Field>

      <Field label="Hint overlay (per-player)">
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Toggle
            label="X hints"
            value={overlayFlags.X}
            onPress={() => setOverlayFlag('X', !overlayFlags.X)}
          />
          <Toggle
            label="O hints"
            value={overlayFlags.O}
            onPress={() => setOverlayFlag('O', !overlayFlags.O)}
          />
        </View>
      </Field>

      <Pressable onPress={newGame} accessibilityRole="button" accessibilityLabel="New game" style={styles.newGame}>
        <Text style={styles.newGameText}>New game (reset multiverse)</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={`${label} ${value ? 'on' : 'off'}`}
      style={[styles.toggle, value && styles.toggleActive]}
    >
      <Text style={[styles.toggleText, value && { color: colors.bg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { ...fonts.small, color: colors.textDim, marginBottom: 2 },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { ...fonts.label, color: colors.textDim },
  newGame: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  newGameText: { ...fonts.label, color: colors.text },
});
