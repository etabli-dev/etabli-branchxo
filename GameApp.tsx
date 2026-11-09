import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { hydrate, useAppStore } from './src/state';
import { cancelBackgroundWork, flushSave } from './src/state/store';
import {
  BoardView,
  BranchPromptModal,
  HeaderSummary,
  HeatView,
  MultiverseTree,
  ProbabilityChart,
  SettingsPanel,
  TimelineStrip,
  ViewSwitcher,
} from './src/views';
import { colors, fonts, spacing } from './src/ui';

export default function App() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 900 && height >= 600;
  const view = useAppStore((s) => s.view);
  const storageError = useAppStore((s) => s.storageError);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void flushSave();
    });
    return () => {
      listener.remove();
      cancelBackgroundWork();
      void flushSave();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <View style={styles.header}>
            <Text style={styles.brand} accessibilityRole="header">branchxo</Text>
            <Text style={styles.sub}>multiverse tic-tac-toe</Text>
          </View>

          {storageError && <Text accessibilityRole="alert" style={styles.dim}>{storageError}</Text>}
          <HeaderSummary />

          <View style={styles.switcher}>
            <ViewSwitcher />
          </View>

          <ScrollView
            contentContainerStyle={[styles.main, wide && styles.wideMain]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!hydrated ? (
              <Text style={styles.dim}>loading…</Text>
            ) : (
              <>
                <View testID="game-board" style={wide ? styles.wideGame : styles.game}>
                {view === 'board' && (
                  <>
                    <BoardView />
                    <TimelineStrip />
                    <ProbabilityChart />
                  </>
                )}
                {view === 'timeline' && (
                  <>
                    <TimelineStrip />
                    <BoardView />
                  </>
                )}
                {view === 'tree' && <MultiverseTree />}
                {view === 'heat' && <HeatView />}
                </View>

                <View testID="game-settings" style={[styles.settings, wide && styles.sidebar]}>
                  <Text style={styles.sectionTitle}>Settings</Text>
                  <SettingsPanel />
                </View>
              </>
            )}
          </ScrollView>

          <BranchPromptModal />
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  brand: { ...fonts.title, color: colors.text },
  sub: { ...fonts.small, color: colors.textDim },
  switcher: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  main: { paddingBottom: spacing.xl },
  wideMain: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: spacing.lg },
  game: {},
  wideGame: { flex: 1, maxWidth: 620 },
  sidebar: { width: 340, paddingTop: 0 },
  dim: { ...fonts.small, color: colors.textDim, padding: spacing.md },
  settings: { paddingTop: spacing.lg },
  sectionTitle: { ...fonts.label, color: colors.text, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
});
