import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radii, spacing } from './theme';

interface Props {
  readonly label: string;
  readonly active?: boolean;
  readonly onPress?: () => void;
  readonly tone?: 'neutral' | 'warn' | 'good';
  readonly accessibilityLabel?: string;
}

export function Pill({ label, active = false, onPress, tone = 'neutral', accessibilityLabel }: Props) {
  const bg = active
    ? tone === 'warn'
      ? colors.outcomeOWin
      : tone === 'good'
        ? colors.outcomeXWin
        : colors.accent
    : colors.bgElev;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.pill, { backgroundColor: bg }]}
    >
      <Text style={[styles.text, { color: active ? colors.bg : colors.textDim }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...fonts.small,
    fontWeight: '700',
  },
});
