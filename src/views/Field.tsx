import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing, useChrome } from '../ui';

/** A labelled settings row in the game's settings style. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useChrome();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.textDim }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  fieldLabel: { ...fonts.small, marginBottom: 2 },
});
