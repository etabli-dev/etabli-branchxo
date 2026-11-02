import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const apks = {
  debug: resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk'),
  release: resolve(root, 'android/app/build/outputs/apk/release/app-release.apk'),
};

function report(message) {
  process.stdout.write(`${message}\n`);
}

function main() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--help') {
      report('Usage: node tool/check-android-permissions.mjs [--debug APK] [--release APK]');
      report('Uses AAPT, or build-tools/37.0.0/aapt under ANDROID_HOME or ANDROID_SDK_ROOT.');
      return;
    }
    const variant = args[i] === '--debug' ? 'debug' : args[i] === '--release' ? 'release' : null;
    if (!variant || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error(`Unknown option or missing APK path: ${args[i]}`);
    }
    apks[variant] = resolve(args[++i]);
  }

  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const aapt = process.env.AAPT || (sdk && resolve(
    sdk, 'build-tools', '37.0.0', process.platform === 'win32' ? 'aapt.exe' : 'aapt',
  ));
  if (!aapt) throw new Error('Set ANDROID_HOME, ANDROID_SDK_ROOT, or AAPT to the SDK aapt executable.');

  const failures = [];
  for (const [variant, apk] of Object.entries(apks)) {
    try {
      const badging = execFileSync(aapt, ['dump', 'badging', apk], {
        encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const packageName = /^package:\s+name='([^']+)'/m.exec(badging)?.[1];
      if (!packageName) throw new Error('aapt did not report an APK package name.');
      const requested = new Set();
      let hasUncappedInternet = false;
      for (const line of badging.split(/\r?\n/)) {
        if (!line.startsWith('uses-permission')) continue;
        const entry = /^(uses-permission(?:-sdk-\d+)?):\s+name='([^']+)'(.*)$/.exec(line);
        if (!entry) throw new Error(`Unrecognized aapt permission entry: ${line}`);
        const [, kind, name, attributes] = entry;
        requested.add(name);
        if (name === 'android.permission.INTERNET' && kind === 'uses-permission'
            && !/\bmaxSdkVersion\s*=/.test(attributes)) {
          hasUncappedInternet = true;
        }
      }
      const allowed = new Set([
        'android.permission.INTERNET',
        `${packageName}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
      ]);
      if (variant === 'debug') {
        allowed.add('android.permission.SYSTEM_ALERT_WINDOW');
        allowed.add('android.permission.ACCESS_LOCAL_NETWORK');
      }
      const unexpected = [...requested].filter((name) => !allowed.has(name)).sort();
      report(`${variant}: ${packageName}\n  APK: ${apk}\n  Permissions: ${[...requested].sort().join(', ') || '(none)'}`);
      if (unexpected.length) failures.push(`${variant}: unexpected permissions: ${unexpected.join(', ')}`);
      if (!hasUncappedInternet) failures.push(`${variant}: an ordinary, uncapped INTERNET declaration is required for Metro across supported Android versions.`);
    } catch (error) {
      failures.push(`${variant}: could not inspect ${apk}: ${error.message}`);
    }
  }
  if (failures.length) throw new Error(failures.join('\n'));
  report('Android APK permission checks passed for debug and standalone release.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
