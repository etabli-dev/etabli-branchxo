import React from 'react';
import { Text, View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { STRINGS } from './src/i18n/strings';
import { APP_LANGUAGE_KEY, parseLanguage, resolveLanguage } from './src/settings/appearance';

/** The chosen app language before the game (and its storage layer) loads; web storage is synchronous here. */
function startupStrings() {
  let stored: string | null = null;
  try {
    stored = globalThis.localStorage?.getItem(APP_LANGUAGE_KEY) ?? null;
  } catch {
    stored = null;
  }
  const preferred = typeof navigator !== 'undefined' && Array.isArray(navigator.languages) ? navigator.languages : [];
  return STRINGS[resolveLanguage(parseLanguage(stored), preferred)];
}

const t = startupStrings();

const message = (text: string) => (
  <View style={{ flex: 1, backgroundColor: '#0b1020', padding: 24, justifyContent: 'center' }}>
    <Text accessibilityRole="alert" style={{ color: '#ffffff' }}>{text}</Text>
  </View>
);

class EngineBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  render(): React.ReactNode {
    return this.state.failed ? message(t.engineFailed) : this.props.children;
  }
}

export default function App(): React.ReactElement {
  return (
    <EngineBoundary>
      <WithSkiaWeb getComponent={() => import('./GameApp')}
        opts={{ locateFile: () => '/canvaskit.wasm' }}
        fallback={message(t.engineLoading)} />
    </EngineBoundary>
  );
}
