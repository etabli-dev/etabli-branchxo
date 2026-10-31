import React from 'react';
import { Text, View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

const message = (text: string) => (
  <View style={{ flex: 1, backgroundColor: '#0b1020', padding: 24, justifyContent: 'center' }}>
    <Text accessibilityRole="alert" style={{ color: '#ffffff' }}>{text}</Text>
  </View>
);

class EngineBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  render(): React.ReactNode {
    return this.state.failed
      ? message('The drawing engine could not be loaded. Reload the page or check the installation.')
      : this.props.children;
  }
}

export default function App(): React.ReactElement {
  return (
    <EngineBoundary>
      <WithSkiaWeb getComponent={() => import('./GameApp')}
        opts={{ locateFile: () => '/canvaskit.wasm' }}
        fallback={message('Loading game…')} />
    </EngineBoundary>
  );
}
