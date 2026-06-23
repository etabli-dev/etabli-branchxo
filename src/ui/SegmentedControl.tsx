import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from './theme';

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly { value: T; label: string; accessibilityLabel?: string }[];
  readonly value: T;
  readonly onChange: (v: T) => void;
  readonly testID?: string;
}

export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const { options, value, onChange, testID } = props;
  return (
    <View style={styles.container} testID={testID}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgElev,
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.panel,
  },
  label: {
    ...fonts.label,
    color: colors.textDim,
  },
  labelSelected: {
    color: colors.text,
  },
});
