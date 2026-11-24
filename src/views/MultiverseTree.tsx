import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Pressable, Text, View } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useAppStore } from '../state';
import { Strings, useStrings } from '../i18n';
import { fonts, game, radii, spacing, useChrome } from '../ui';
import { Universe, childrenOf, pathToRoot, summarize } from '../multiverse';

const NODE_R = 20;
const H_SPACING = 78;
const V_SPACING = 86;
const PAD = 30;

interface Layout {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly universe: Universe;
}

/**
 * Tidy-tree layout (Reingold-Tilford style, simplified):
 * - Each leaf is assigned a unique column.
 * - Internal nodes are centered over their children.
 */
function layoutTree(tree: ReturnType<typeof useAppStore.getState>['tree']): {
  nodes: Layout[];
  edges: { from: Layout; to: Layout }[];
  width: number;
  height: number;
} {
  const positions: Record<string, { x: number; y: number; depth: number }> = {};
  let nextCol = 0;

  function place(id: string, depth: number): number {
    const u = tree.universes[id];
    if (!u) return nextCol;
    const kids = childrenOf(tree, id);
    if (kids.length === 0) {
      const col = nextCol++;
      positions[id] = { x: PAD + col * H_SPACING, y: PAD + depth * V_SPACING, depth };
      return col;
    }
    const childCols = kids.map((k) => place(k.id, depth + 1));
    const first = childCols[0] ?? 0;
    const last = childCols[childCols.length - 1] ?? first;
    const mid = (first + last) / 2;
    positions[id] = { x: PAD + mid * H_SPACING, y: PAD + depth * V_SPACING, depth };
    return mid;
  }
  place(tree.rootId, 0);

  const nodes: Layout[] = Object.keys(positions).map((id) => {
    const pos = positions[id];
    const u = tree.universes[id];
    if (!pos || !u) throw new Error('layout invariant');
    return { id, x: pos.x, y: pos.y, universe: u };
  });

  const edges: { from: Layout; to: Layout }[] = [];
  const nodeById: Record<string, Layout> = {};
  for (const n of nodes) nodeById[n.id] = n;
  for (const n of nodes) {
    const u = tree.universes[n.id];
    if (!u) continue;
    for (const child of childrenOf(tree, n.id)) {
      const childNode = nodeById[child.id];
      if (childNode) edges.push({ from: n, to: childNode });
    }
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  return { nodes, edges, width: maxX + PAD * 2, height: maxY + PAD * 2 };
}

function nodeColor(u: Universe): string {
  if (u.status.kind === 'win') {
    return u.status.winner === 'X' ? game.outcomeXWin : game.outcomeOWin;
  }
  if (u.status.kind === 'draw') return game.outcomeDraw;
  return game.outcomeOpen;
}

export function MultiverseTree() {
  const tree = useAppStore((s) => s.tree);
  const activeId = useAppStore((s) => s.activeUniverseId);
  const setActiveUniverse = useAppStore((s) => s.setActiveUniverse);
  const t = useStrings();
  const c = useChrome();

  const layout = useMemo(() => layoutTree(tree), [tree]);
  const activePath = useMemo(() => new Set(pathToRoot(tree, activeId).map((u) => u.id)), [tree, activeId]);
  const summary = useMemo(() => summarize(tree), [tree]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">{t.multiverseTitle}</Text>
      <View style={styles.summaryRow}>
        <SummaryBadge label={t.badgeXWins(summary.xWins)} color={game.outcomeXWin} />
        <SummaryBadge label={t.badgeOWins(summary.oWins)} color={game.outcomeOWin} />
        <SummaryBadge label={t.badgeDraws(summary.draws)} color={game.outcomeDraw} />
        <SummaryBadge label={t.badgeOpen(summary.open)} color={game.outcomeOpen} />
      </View>
      <ScrollView horizontal style={styles.tile}>
        <ScrollView>
          <View style={{ width: layout.width, height: layout.height }}>
            <Canvas style={{ width: layout.width, height: layout.height }}>
              {/* edges colored by destination outcome (faded) */}
              {layout.edges.map((e, i) => {
                const onActivePath = activePath.has(e.from.id) && activePath.has(e.to.id);
                const p = Skia.PathBuilder.Make();
                p.moveTo(e.from.x, e.from.y);
                p.lineTo(e.to.x, e.to.y);
                const outColor = nodeColor(e.to.universe);
                return (
                  <Path
                    key={`edge-${i}`}
                    path={p.detach()}
                    color={onActivePath ? game.highlight : outColor}
                    style="stroke"
                    strokeWidth={onActivePath ? 3 : 1.5}
                    opacity={onActivePath ? 1 : 0.45}
                  />
                );
              })}
              {/* nodes */}
              {layout.nodes.map((n) => {
                const active = n.id === activeId;
                const onPath = activePath.has(n.id);
                return (
                  <Group key={`node-${n.id}`}>
                    <Circle
                      cx={n.x}
                      cy={n.y}
                      r={NODE_R + (active ? 4 : 0)}
                      color={nodeColor(n.universe)}
                      opacity={onPath ? 1 : 0.7}
                    />
                    {active && (
                      <Circle
                        cx={n.x}
                        cy={n.y}
                        r={NODE_R + 6}
                        color={game.highlight}
                        style="stroke"
                        strokeWidth={2}
                      />
                    )}
                  </Group>
                );
              })}
            </Canvas>

            {/* hit layer */}
            {layout.nodes.map((n) => (
              <Pressable
                key={`hit-${n.id}`}
                onPress={() => setActiveUniverse(n.id)}
                accessibilityRole="button"
                accessibilityLabel={t.universeA11y(n.universe.label, describeStatus(n.universe, t))}
                accessibilityState={{ selected: n.id === activeId }}
                style={{
                  position: 'absolute',
                  left: n.x - NODE_R,
                  top: n.y - NODE_R,
                  width: NODE_R * 2,
                  height: NODE_R * 2,
                }}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function describeStatus(u: Universe, t: Strings): string {
  if (u.status.kind === 'win') return t.wins(u.status.winner);
  if (u.status.kind === 'draw') return t.drawLower;
  return t.toMove(u.status.toMove);
}

function SummaryBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text numberOfLines={1} style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md },
  title: { ...fonts.title, marginBottom: spacing.sm },
  tile: { backgroundColor: game.bg, borderRadius: radii.md, borderWidth: 1, borderColor: game.border },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: game.bgElev,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  badgeText: { ...fonts.small, color: game.text },
});
