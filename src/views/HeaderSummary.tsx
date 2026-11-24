import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStrings } from '../i18n';
import { useAppStore } from '../state';
import { summarize } from '../multiverse';
import { fonts, game, radii, spacing, useChrome } from '../ui';

/** Outcome chips: game tokens, so they keep the game palette in both modes. */
export function HeaderSummary() {
  const tree = useAppStore((s) => s.tree);
  const t = useStrings();
  const c = useChrome();
  const s = summarize(tree);
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={t.summaryA11y(s.xWins, s.oWins, s.draws, s.open, s.total)}
    >
      <Chip color={game.outcomeXWin} label={`${s.xWins}`} title="X" />
      <Chip color={game.outcomeOWin} label={`${s.oWins}`} title="O" />
      <Chip color={game.outcomeDraw} label={`${s.draws}`} title={t.chipDraw} />
      <Chip color={game.outcomeOpen} label={`${s.open}`} title={t.chipOpen} />
      <Text numberOfLines={1} style={[styles.total, { color: c.textDim }]}>{t.universes(s.total)}</Text>
    </View>
  );
}

function Chip({ color, label, title }: { color: string; label: string; title: string }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text numberOfLines={1} style={styles.chipText}>
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
    backgroundColor: game.bgElev,
    gap: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { ...fonts.small, color: game.text },
  chipTitle: { color: game.textDim },
  total: { ...fonts.small, marginLeft: spacing.sm },
});
