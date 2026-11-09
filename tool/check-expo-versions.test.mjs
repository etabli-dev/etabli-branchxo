import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpoCheck } from './check-expo-versions.mjs';

const rows = [
  'expo@58.0.22 - expected version: ~58.0.23',
  'expo-splash-screen@58.0.12 - expected version: ~58.0.13',
  'react-native-safe-area-context@5.10.1 - expected version: ~5.11.1',
];
const fixture = (recommendations = rows) => ({
  status: 1,
  stdout: ['The following packages should be updated for best compatibility with the installed expo version:',
    ...recommendations.map(row => `  ${row}`),
    'Your project may not work correctly until you install the expected versions of the packages.'].join('\n'),
  stderr: 'Found outdated dependencies\n',
  now: new Date('2026-11-09T00:00:00Z'),
});
test('a clean Expo result passes even after the quarantine expires', () => {
  assert.equal(evaluateExpoCheck({ status: 0, stdout: 'Dependencies are up to date', now: '2026-11-18' }).ok, true);
});
test('all reviewed package/version pairs are temporarily quarantined', () => {
  assert.deepEqual(evaluateExpoCheck(fixture()).quarantined, true);
  assert.equal(evaluateExpoCheck(fixture()).ok, true);
});
test('a remaining subset must still use the exact reviewed pairs', () => {
  for (const row of rows) assert.equal(evaluateExpoCheck(fixture([row])).ok, true);
});
test('an unknown package or a different installed/recommended version fails', () => {
  for (const row of ['react@19.2.0 - expected version: 19.3.0',
    'expo@58.0.21 - expected version: ~58.0.23', 'expo@58.0.22 - expected version: ~58.0.24']) {
    assert.equal(evaluateExpoCheck(fixture([...rows, row])).ok, false);
  }
});
test('expiry is enforced at the deadline and afterwards', () => {
  for (const now of ['2026-11-17T00:00:00Z', '2027-01-01T00:00:00Z']) {
    assert.equal(evaluateExpoCheck({ ...fixture(), now }).ok, false);
  }
});
test('tool failure or signal is never treated as a version quarantine', () => {
  for (const status of [2, null]) assert.equal(evaluateExpoCheck({ ...fixture(), status }).ok, false);
  assert.equal(evaluateExpoCheck({ ...fixture(), stdout: 'Network request failed', stderr: '' }).ok, false);
});
test('unexpected diagnostics accompanying known mismatches remain blocking', () => {
  assert.equal(evaluateExpoCheck({ ...fixture(), stderr: 'Found outdated dependencies\nNetwork request failed' }).ok, false);
});
test('missing markers and duplicate recommendations fail closed', () => {
  assert.equal(evaluateExpoCheck({ ...fixture(), stderr: '' }).ok, false);
  assert.equal(evaluateExpoCheck(fixture([...rows, rows[0]])).ok, false);
});
test('colored CLI output retains the same exact review requirements', () => {
  const input = fixture(); input.stdout = `\x1b[33m${input.stdout}\x1b[0m`;
  assert.equal(evaluateExpoCheck(input).ok, true);
});
test('an invalid clock cannot extend the exception', () => {
  assert.equal(evaluateExpoCheck({ ...fixture(), now: 'invalid' }).ok, false);
});
