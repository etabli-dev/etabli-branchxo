import assert from 'node:assert/strict';
import test from 'node:test';
import plugin from '../plugins/with-qualified-splash.cjs';

const splash = () => ({ $: { name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen' }, item: [
  { $: { name: 'windowSplashScreenBackground' }, _: '@color/splashscreen_background' },
  { $: { name: 'windowSplashScreenAnimatedIcon' }, _: '@drawable/splashscreen_logo' },
  { $: { name: 'postSplashScreenTheme' }, _: '@style/AppTheme' },
  { $: { name: 'android:windowSplashScreenBehavior' }, _: 'icon_preferred' },
] });
test('moves only API33 item out of base and preserves complete qualified style', () => {
  const original = splash();
  const unrelated = { $: { name: 'Other', parent: 'OtherParent' }, item: [] };
  const base = { resources: { style: [structuredClone(original), unrelated] } };
  const qualified = { resources: { style: [unrelated, splash()] } };
  plugin.qualifySplashStyle(base, qualified);
  assert.equal(base.resources.style[0].item.length, 3);
  assert.equal(base.resources.style[0].item.some(i => i.$.name.startsWith('android:windowSplash')), false);
  assert.deepEqual(qualified.resources.style, [unrelated, original]);
  assert.equal(base.resources.style[1], unrelated);
  // Expo regenerates the base style on every prebuild; repeat without duplicates.
  base.resources.style[0] = splash();
  plugin.qualifySplashStyle(base, qualified);
  assert.equal(qualified.resources.style.length, 2);
});
test('fails closed if upstream splash shape changes', () => {
  assert.throws(() => plugin.qualifySplashStyle({ resources: {} }, { resources: {} }), /Expected Expo splash style/);
  const changed = splash();
  changed.item.pop();
  assert.throws(() => plugin.qualifySplashStyle({ resources: { style: [changed] } }, { resources: {} }), /Expected Expo splash behavior/);
});
