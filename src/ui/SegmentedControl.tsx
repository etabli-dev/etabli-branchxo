import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radii, spacing } from './theme';
import { useChrome } from './useChrome';

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly { value: T; label: string; accessibilityLabel?: string }[];
  readonly value: T;
  readonly onChange: (v: T) => void;
  readonly testID?: string;
}

/**
 * One-line segments: each visible label is short enough for a 375-pt screen in both languages
 * (`numberOfLines` only guards the layout); the full text is the accessibility label.
 */
export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const { options, value, onChange, testID } = props;
  const c = useChrome();
  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]} testID={testID}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            testID={testID ? `${testID}.${opt.value}` : undefined}
            style={[
              styles.segment,
              selected && { backgroundColor: c.selection, borderColor: c.accent },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: selected ? c.text : c.textDim }, selected && styles.labelSelected]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  label: {
    ...fonts.label,
  },
  labelSelected: {
    fontWeight: '700',
  },
});
