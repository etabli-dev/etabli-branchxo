import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useAppStore } from '../state';
import { fullMoves as canonicalFullMoves } from '../multiverse';
import { findWinLine } from '../game';
import { colors, fonts, radii, spacing } from '../ui';

const MINI = 56;
const M_CELL = MINI / 3;

interface MiniBoardProps {
  readonly board: readonly ('X' | 'O' | null)[];
  readonly highlighted: boolean;
}

const MiniBoard = React.memo(function MiniBoardImpl({ board, highlighted }: MiniBoardProps) {
  const winLine = findWinLine(board);
  return (
    <View
      style={[
        styles.mini,
        highlighted && { borderColor: colors.accent, borderWidth: 2 },
      ]}
    >
      <Canvas style={{ width: MINI, height: MINI }}>
        {[1, 2].map((i) => (
          <Group key={i}>
            <Path
              path={Skia.Path.Make().moveTo(i * M_CELL, 0).lineTo(i * M_CELL, MINI)}
              color={colors.border}
              style="stroke"
              strokeWidth={1}
            />
            <Path
              path={Skia.Path.Make().moveTo(0, i * M_CELL).lineTo(MINI, i * M_CELL)}
              color={colors.border}
              style="stroke"
              strokeWidth={1}
            />
          </Group>
        ))}
        {board.map((c, idx) => {
          if (!c) return null;
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const x = col * M_CELL;
          const y = row * M_CELL;
          if (c === 'X') {
            const p = Skia.Path.Make();
            p.moveTo(x + 4, y + 4).lineTo(x + M_CELL - 4, y + M_CELL - 4);
            p.moveTo(x + M_CELL - 4, y + 4).lineTo(x + 4, y + M_CELL - 4);
            return (
              <Path key={idx} path={p} color={colors.markX} style="stroke" strokeWidth={2} />
            );
          }
          return (
            <Circle
              key={idx}
              cx={x + M_CELL / 2}
              cy={y + M_CELL / 2}
              r={M_CELL / 2 - 4}
              color={colors.markO}
              style="stroke"
              strokeWidth={2}
            />
          );
        })}
        {winLine && (() => {
          const aCol = winLine.line[0] % 3;
          const aRow = Math.floor(winLine.line[0] / 3);
          const cCol = winLine.line[2] % 3;
          const cRow = Math.floor(winLine.line[2] / 3);
          const p = Skia.Path.Make();
          p.moveTo(aCol * M_CELL + M_CELL / 2, aRow * M_CELL + M_CELL / 2);
          p.lineTo(cCol * M_CELL + M_CELL / 2, cRow * M_CELL + M_CELL / 2);
          const color = winLine.winner === 'X' ? colors.outcomeXWin : colors.outcomeOWin;
          return (
            <Path path={p} color={color} style="stroke" strokeWidth={2.5} opacity={0.9} />
          );
        })()}
      </Canvas>
    </View>
  );
});

export function TimelineStrip() {
  const tree = useAppStore((s) => s.tree);
  const activeId = useAppStore((s) => s.activeUniverseId);
  const scrubPly = useAppStore((s) => s.scrubPly);
  const setScrubPly = useAppStore((s) => s.setScrubPly);
  const active = tree.universes[activeId];

  const stages = useMemo(() => {
    if (!active) return [] as readonly (readonly ('X' | 'O' | null)[])[];
    const moves = canonicalFullMoves(tree, active.id);
    const out: ('X' | 'O' | null)[][] = [Array(9).fill(null)];
    let cur: ('X' | 'O' | null)[] = Array(9).fill(null);
    for (const m of moves) {
      cur = cur.slice();
      cur[m.cell] = m.mark;
      out.push(cur);
    }
    return out;
  }, [tree, active]);

  if (!active) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline (ply {scrubPly}/{stages.length - 1})</Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
        showsHorizontalScrollIndicator={false}
      >
        {stages.map((b, i) => (
          <Pressable
            key={i}
            onPress={() => setScrubPly(i)}
            accessibilityRole="button"
            accessibilityLabel={`Go to ply ${i}`}
            style={{ alignItems: 'center' }}
          >
            <MiniBoard board={b} highlighted={i === scrubPly} />
            <Text style={styles.plyLabel}>{i}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  title: {
    ...fonts.label,
    color: colors.textDim,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  mini: {
    width: MINI,
    height: MINI,
    backgroundColor: colors.bgElev,
    borderRadius: radii.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  plyLabel: {
    ...fonts.small,
    color: colors.textDim,
    marginTop: 2,
  },
});
