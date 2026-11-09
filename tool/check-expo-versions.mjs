import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

// Reviewed 3 November recommendations remain quarantined for the repository's
// fourteen-day dependency age policy. This exception expires, it never updates packages.
const expires = Date.parse('2026-11-17T00:00:00Z');
const reviewed = new Map([
  ['expo', ['58.0.22', '~58.0.23']],
  ['expo-splash-screen', ['58.0.12', '~58.0.13']],
  ['react-native-safe-area-context', ['5.10.1', '~5.11.1']],
]);
const messages = new Set([
  'The following packages should be updated for best compatibility with the installed expo version:',
  'Your project may not work correctly until you install the expected versions of the packages.',
  'Found outdated dependencies',
]);
const mismatch = /^(.+)@([^\s]+) - expected version: (.+)$/;

export function evaluateExpoCheck({ status, stdout = '', stderr = '', now = new Date() }) {
  // Strip terminal color codes only; unknown diagnostics must remain blocking.
  const output = stripVTControlCharacters(`${stdout}\n${stderr}`);
  const lines = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (status === 0 && !lines.some(line => mismatch.test(line))) {
    return { ok: true, quarantined: false, reason: 'Expo versions match.' };
  }
  if (status !== 1) return { ok: false, quarantined: false, reason: 'Expo check did not complete normally.' };
  const timestamp = new Date(now).getTime();
  if (!Number.isFinite(timestamp) || timestamp >= expires) {
    return { ok: false, quarantined: false, reason: 'The reviewed dependency quarantine expired on 2026-11-17; update the packages.' };
  }
  const found = new Set();
  const seenMessages = new Set();
  for (const line of lines) {
    if (messages.has(line)) { seenMessages.add(line); continue; }
    const match = mismatch.exec(line);
    if (!match) return { ok: false, quarantined: false, reason: 'Unexpected Expo diagnostic; the check remains blocking.' };
    const [, name, installed, expected] = match;
    const approved = reviewed.get(name);
    if (!approved || approved[0] !== installed || approved[1] !== expected || found.has(name)) {
      return { ok: false, quarantined: false, reason: 'An unreviewed Expo version mismatch remains blocking.' };
    }
    found.add(name);
  }
  if (found.size === 0 || seenMessages.size !== messages.size) {
    return { ok: false, quarantined: false, reason: 'Incomplete Expo compatibility output; the check remains blocking.' };
  }
  return { ok: true, quarantined: true, reason: 'Reviewed 3 November Expo recommendations quarantined until 2026-11-17. Native compatibility is checked by separate builds.' };
}

function main() {
  const require = createRequire(import.meta.url);
  const env = { ...process.env, CI: '1', NO_COLOR: '1' };
  delete env.FORCE_COLOR;
  const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'install', '--check'], {
    encoding: 'utf8', env, timeout: 120_000,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.error) { console.error(result.error.message); process.exitCode = 1; return; }
  const verdict = evaluateExpoCheck(result);
  process.stdout.write(`${verdict.reason}\n`);
  process.exitCode = verdict.ok ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
