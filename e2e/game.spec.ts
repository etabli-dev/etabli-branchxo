import { expect, test } from '@playwright/test';

test('offline engine starts, hotseat wins, reloads, switches views and forks', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/');
  for (const cell of [1,4,2,5,3]) await page.getByRole('button', { name: `Cell ${cell}, empty`, exact: true }).click();
  await expect(page.getByLabel(/Multiverse summary: 1 X wins/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('branchxo:v2') ?? '{}');
    return s.tree?.universes[s.activeUniverseId]?.moves.length;
  })).toBe(5);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Cell 3, X', exact: true })).toBeVisible();
  for (const view of ['Timeline', 'Multiverse', 'Heat', 'Board']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    await expect(page.getByLabel(/Multiverse summary: 1 X wins/)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Go to ply 1', exact: true }).click();
  await page.getByRole('button', { name: 'Cell 9, empty', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm branch', exact: true }).click();
  await expect(page.getByText('2 universes', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cell 9, O', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm branch', exact: true })).not.toBeVisible();
  await page.screenshot({ path: info.outputPath('branched.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('a failed drawing-engine load is explained', async ({ page }) => {
  await page.route('**/canvaskit.wasm', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('drawing engine could not be loaded');
});
