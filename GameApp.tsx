import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useStrings } from './src/i18n';
import { hydratePreferences, usePreferences } from './src/settings/preferences';
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
import { fonts, spacing, useChrome } from './src/ui';

export default function App() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 900 && height >= 600;
  const view = useAppStore((s) => s.view);
  const storageError = useAppStore((s) => s.storageError);
  const hydrated = useAppStore((s) => s.hydrated);
  const preferencesReady = usePreferences((s) => s.hydrated);
  const t = useStrings();
  const c = useChrome();

  useEffect(() => {
    void hydratePreferences();
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
        <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style={c.statusBar} />
          {preferencesReady && (
            <>
              <View style={styles.header}>
                <Text style={[styles.brand, { color: c.text }]} accessibilityRole="header">branchxo</Text>
                <Text style={[styles.sub, { color: c.textDim }]}>{t.brandSubtitle}</Text>
              </View>

              {storageError && (
                <Text accessibilityRole="alert" style={[styles.dim, { color: c.textDim }]}>
                  {storageError === 'save' ? t.saveFailed : t.loadFailed}
                </Text>
              )}
              <HeaderSummary />

              <View style={styles.switcher}>
                <ViewSwitcher />
              </View>

              <ScrollView
                contentContainerStyle={[styles.main, wide && styles.wideMain]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                testID="main-scroll"
              >
                {!hydrated ? (
                  <Text style={[styles.dim, { color: c.textDim }]}>{t.loading}</Text>
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
                      <Text style={[styles.sectionTitle, { color: c.text }]} accessibilityRole="header">
                        {t.settingsTitle}
                      </Text>
                      <SettingsPanel />
                    </View>
                  </>
                )}
              </ScrollView>

              <BranchPromptModal />
            </>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  brand: { ...fonts.title },
  sub: { ...fonts.small },
  switcher: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  main: { paddingBottom: spacing.xl },
  wideMain: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: spacing.lg },
  game: {},
  wideGame: { flex: 1, maxWidth: 620 },
  sidebar: { width: 340, paddingTop: 0 },
  dim: { ...fonts.small, padding: spacing.md },
  settings: { paddingTop: spacing.lg },
  sectionTitle: { ...fonts.label, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
});
