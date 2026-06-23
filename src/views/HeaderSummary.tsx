import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../state';
import { summarize } from '../multiverse';
import { colors, fonts, radii, spacing } from '../ui';

export function HeaderSummary() {
  const tree = useAppStore((s) => s.tree);
  const s = summarize(tree);
  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`Multiverse summary: ${s.xWins} X wins, ${s.oWins} O wins, ${s.draws} draws, ${s.open} open of ${s.total} universes`}
    >
      <Chip color={colors.outcomeXWin} label={`${s.xWins}`} title="X" />
      <Chip color={colors.outcomeOWin} label={`${s.oWins}`} title="O" />
      <Chip color={colors.outcomeDraw} label={`${s.draws}`} title="draw" />
      <Chip color={colors.outcomeOpen} label={`${s.open}`} title="open" />
      <Text style={styles.total}>{s.total} universe{s.total === 1 ? '' : 's'}</Text>
    </View>
  );
}

function Chip({ color, label, title }: { color: string; label: string; title: string }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.chipText}>
        <Text style={styles.chipTitle}>{title} </Text>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: colors.bgElev,
    gap: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { ...fonts.small, color: colors.text },
  chipTitle: { color: colors.textDim },
  total: { ...fonts.small, color: colors.textDim, marginLeft: spacing.sm },
});
