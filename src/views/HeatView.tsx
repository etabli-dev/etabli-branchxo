import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CellIndex } from '../game';
import { normalizedStrengths } from '../overlay';
import { useAppStore } from '../state';
import { useStrings } from '../i18n';
import { fonts, game, radii, spacing, useChrome, viridis } from '../ui';

const SIZE = 280;
const CELL = SIZE / 3;

export function HeatView() {
  const tree = useAppStore((s) => s.tree);
  const activeId = useAppStore((s) => s.activeUniverseId);
  const t = useStrings();
  const c = useChrome();
  const active = tree.universes[activeId];

  const scores = useMemo(() => {
    if (!active || active.status.kind !== 'open') return [];
    return normalizedStrengths(active.board, active.status.toMove);
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: c.text }]}>{t.heatTitle}</Text>
      <View style={styles.tile}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Canvas style={{ flex: 1 }}>
          {/* base cells */}
          {Array.from({ length: 9 }).map((_, idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const x = col * CELL;
            const y = row * CELL;
            const entry = scores.find((s) => (s.cell as CellIndex) === (idx as CellIndex));
            const fill = entry ? viridis(entry.norm) : game.panel;
            const opacity = entry ? 0.55 + entry.norm * 0.4 : 0.6;
            return (
              <Group key={idx}>
                <Path
                  path={Skia.PathBuilder.Make().addRect({ x: x + 2, y: y + 2, width: CELL - 4, height: CELL - 4 }).detach()}
                  color={fill}
                  opacity={opacity}
                />
              </Group>
            );
          })}
          {/* grid lines */}
          {[1, 2].map((i) => (
            <Group key={i}>
              <Path
                path={Skia.PathBuilder.Make().moveTo(i * CELL, 0).lineTo(i * CELL, SIZE).detach()}
                color={game.border}
                style="stroke"
                strokeWidth={2}
              />
              <Path
                path={Skia.PathBuilder.Make().moveTo(0, i * CELL).lineTo(SIZE, i * CELL).detach()}
                color={game.border}
                style="stroke"
                strokeWidth={2}
              />
            </Group>
          ))}
        </Canvas>
        {/* score labels */}
        {scores.map((s) => {
          const col = (s.cell as number) % 3;
          const row = Math.floor((s.cell as number) / 3);
          return (
            <Text
              key={`l-${s.cell}`}
              style={[
                styles.scoreLabel,
                {
                  left: col * CELL + 4,
                  top: row * CELL + 4,
                },
              ]}
            >
              {s.score >= 100 ? '★' : s.score >= 90 ? '◆' : ''} {s.score.toFixed(1)}
            </Text>
          );
        })}
      </View>
      </View>
      <Text style={[styles.legend, { color: c.textDim }]}>{t.heatLegend}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, alignItems: 'center' },
  title: { ...fonts.label, marginBottom: spacing.sm },
  tile: { padding: spacing.sm, borderRadius: radii.md, backgroundColor: game.bg, borderWidth: 1, borderColor: game.border },
  scoreLabel: {
    position: 'absolute',
    color: game.text,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  legend: { ...fonts.small, marginTop: spacing.sm, textAlign: 'center' },
});
