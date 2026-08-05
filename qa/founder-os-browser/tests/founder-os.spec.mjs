import { test, expect } from '@playwright/test';

function collectCriticalErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => {
    const message = String(error?.message || error);
    if (!/failed to fetch|load failed|networkerror|network request failed/i.test(message)) {
      errors.push(message);
    }
  });
  return errors;
}

function sidebarHome(page) {
  return page.locator('.nav [data-nav-home]');
}

async function openHome(page) {
  await page.goto('./');
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'registry');
  await expect(page.locator('[data-workspace="registry"]')).toBeVisible();
  await expect(page.locator('[data-open-workspace]').first()).toBeVisible();
}

async function openWorkspace(page, workspaceId) {
  const control = page.locator(`[data-open-workspace="${workspaceId}"]`);
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  await control.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', workspaceId);
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');
  await expect(page.locator('[data-workspace="mission"]')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#workspace=${encodeURIComponent(workspaceId)}&view=mission$`));
}

test('Founder Home greeting opens and saves Account & Settings', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  const greeting = page.locator('[data-open-founder-settings]');
  await expect(greeting).toBeVisible();
  await greeting.click();

  const dialog = page.locator('[data-founder-system-dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Account & Settings' })).toBeVisible();

  const testName = `Founder QA ${testInfo.project.name}`;
  await dialog.locator('input[name="name"]').fill(testName);
  await dialog.locator('[data-save-founder-settings]').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-open-founder-settings]')).toContainText(testName);
  expect(criticalErrors).toEqual([]);
});

test('every explicit Open Workspace button targets its immutable workspace ID', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  const workspaceIds = await page.locator('[data-open-workspace]').evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('data-open-workspace')).filter(Boolean)
  );

  expect(workspaceIds.length).toBeGreaterThanOrEqual(2);
  expect(new Set(workspaceIds).size).toBe(workspaceIds.length);

  for (const workspaceId of workspaceIds) {
    if ((await page.locator('body').getAttribute('data-active-workspace')) !== 'registry') {
      await sidebarHome(page).click();
      await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'registry');
      await expect(page.locator(`[data-open-workspace="${workspaceId}"]`)).toBeVisible();
    }
    await openWorkspace(page, workspaceId);
  }

  expect(criticalErrors).toEqual([]);
});

test('browser Back, Forward, refresh, and Home restore deterministic routes', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');

  const blueprint = page.locator('[data-nav-view="blueprint"]');
  await expect(blueprint).toBeVisible();
  await blueprint.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'blueprint');
  await expect(page.locator('[data-workspace="blueprint"]')).toBeVisible();
  await expect(page).toHaveURL(/#workspace=natural-nation&view=blueprint$/);

  await page.goBack();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'natural-nation');
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');
  await expect(page.locator('[data-workspace="mission"]')).toBeVisible();

  await page.goForward();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'blueprint');
  await expect(page.locator('[data-workspace="blueprint"]')).toBeVisible();

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'natural-nation');
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'blueprint');
  await expect(page.locator('[data-workspace="blueprint"]')).toBeVisible();

  await sidebarHome(page).click();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'registry');
  await expect(page.locator('[data-workspace="registry"]')).toBeVisible();
  await expect(page).toHaveURL((url) => url.hash === '');
  expect(criticalErrors).toEqual([]);
});

test('direct workspace URL restores the requested workspace and page', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await page.goto('./#workspace=natural-nation&view=blueprint');

  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'natural-nation');
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'blueprint');
  await expect(page.locator('[data-workspace="blueprint"]')).toBeVisible();
  await expect(page.locator('[data-nav-view="blueprint"]')).toHaveAttribute('aria-current', 'page');
  expect(criticalErrors).toEqual([]);
});

test('touch activation works for the greeting and workspace button', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Touch validation runs only in mobile browser projects.');
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  await page.locator('[data-open-founder-settings]').tap();
  const dialog = page.locator('[data-founder-system-dialog]');
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-close-founder-dialog]').tap();
  await expect(dialog).toBeHidden();

  await page.locator('[data-open-workspace="natural-nation"]').tap();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'natural-nation');
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');
  await expect(page.locator('[data-workspace="mission"]')).toBeVisible();
  expect(criticalErrors).toEqual([]);
});
