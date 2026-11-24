import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, radii, spacing } from './theme';
import { useChrome } from './useChrome';

interface Props {
  readonly label: string;
  readonly active?: boolean;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
}

export function Pill({ label, active = false, onPress, accessibilityLabel }: Props) {
  const c = useChrome();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.pill, { backgroundColor: active ? c.accent : c.surface, borderColor: c.border }]}
    >
      <Text numberOfLines={1} style={[styles.text, { color: active ? c.onAccent : c.textDim }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  text: {
    ...fonts.small,
    fontWeight: '700',
  },
});
