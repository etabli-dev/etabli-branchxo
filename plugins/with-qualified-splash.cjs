const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const { AndroidConfig, XML, withFinalizedMod } = require('expo/config-plugins');

const splashName = 'Theme.App.SplashScreen';
const behavior = 'android:windowSplashScreenBehavior';

// Keep the complete style in the API-qualified resource: Android selects a
// style resource as a whole rather than merging its items across qualifiers.
function qualifySplashStyle(base, qualified) {
  const splash = base.resources.style?.find((style) => style.$.name === splashName);
  if (!splash) throw new Error('Expected Expo splash style before API qualification');
  const copy = structuredClone(splash);
  if (!copy.item?.some((item) => item.$.name === behavior)) {
    throw new Error('Expected Expo splash behavior before API qualification');
  }
  splash.item = splash.item.filter((item) => item.$.name !== behavior);
  qualified.resources.style = [
    ...(qualified.resources.style ?? []).filter((style) => style.$.name !== splashName),
    copy,
  ];
  return { base, qualified };
}

module.exports = function withQualifiedSplash(config) {
  return withFinalizedMod(config, ['android', async (mod) => {
    const destination = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/values-v33/styles.xml');
    const basePath = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/values/styles.xml');
    const base = await AndroidConfig.Resources.readResourcesXMLAsync({ path: basePath });
    const qualified = await AndroidConfig.Resources.readResourcesXMLAsync({ path: destination });
    qualifySplashStyle(base, qualified);
    await mkdir(path.dirname(destination), { recursive: true });
    await XML.writeXMLAsync({ path: destination, xml: qualified });
    await XML.writeXMLAsync({ path: basePath, xml: base });
    return mod;
  }]);
};
module.exports.qualifySplashStyle = qualifySplashStyle;
