import { test, expect } from '@playwright/test';

function collectCriticalErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => {
    const message = String(error?.message || error);
    const expectedGenericNetworkFailure = /failed to fetch|load failed|networkerror|network request failed/i.test(message);
    const expectedGatewayAccessFailure = /founder-os-gateway\.dmoseley1024\.workers\.dev/i.test(message)
      && /access control checks|cross-origin|cors|origin/i.test(message);

    if (!expectedGenericNetworkFailure && !expectedGatewayAccessFailure) {
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

test('Founder Home launch actions and filters are functional', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  const create = page.locator('[data-launch-action="create"]').first();
  await expect(create).toBeVisible();
  await create.click();
  const wizard = page.locator('[data-workspace-creation]');
  await expect(wizard).toBeVisible();
  await wizard.locator('[data-workspace-creation-close]').click();
  await expect(wizard).toBeHidden();

  await page.locator('[data-launch-filter="active"]').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-launch-filter', 'active');
  await expect(page.locator('.workspace-card:not([hidden])').first()).toBeVisible();

  await page.locator('[data-launch-filter="all"]').first().click();
  const search = page.locator('[data-launch-search]');
  await search.fill('Natural Nation');
  await expect(page.locator('.workspace-card[data-workspace-id="natural-nation"]')).toBeVisible();
  await expect(page.locator('.workspace-card[data-workspace-id="founder-os"]')).toBeHidden();
  await search.fill('');
  expect(criticalErrors).toEqual([]);
});

test('Founder Action Center opens and routes a workspace action', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');

  const metric = page.locator('[data-action-center-filter="active"]');
  await expect(metric).toBeVisible();
  await metric.click();
  const panel = page.locator('[data-founder-action-center]');
  await expect(panel).toBeVisible();

  const action = panel.locator('[data-action-center-action^="workspace:"]').first();
  await expect(action).toBeVisible();
  const value = await action.getAttribute('data-action-center-action');
  const [, workspaceId, target] = value.split(':');
  await action.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', workspaceId);
  await expect(page.locator('body')).toHaveAttribute('data-active-view', target || 'mission');
  expect(criticalErrors).toEqual([]);
});

test('planning, mission, and Project Records controls use their authoritative owners', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');

  const missionRepo = page.locator('[data-mission-view="repo"]').first();
  await expect(missionRepo).toBeVisible();
  await missionRepo.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'repo');

  await page.locator('[data-nav-view="mission"]').click();
  const readiness = page.locator('[data-mission-action="run-closeout-check"]');
  await expect(readiness).toBeVisible();
  await readiness.click();
  await expect(page.locator('[data-mission-action-output]')).toContainText('Closeout Readiness Check');

  await page.locator('[data-nav-view="knowledge"]').click();
  const audit = page.locator('[data-knowledge-action="audit"]');
  await expect(audit).toBeVisible();
  await audit.click();
  await expect(page.locator('[data-knowledge-action-output]')).toContainText('Knowledge Audit Complete');

  await page.locator('[data-nav-view="discovery"]').click();
  const review = page.locator('[data-review-blueprint]');
  await expect(review).toBeEnabled();
  await review.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', /^(blueprint|build)$/);

  if ((await page.locator('body').getAttribute('data-active-view')) === 'build') {
    const refresh = page.locator('[data-build-refresh]').first();
    await expect(refresh).toBeVisible();
    await expect(refresh).toBeEnabled();
  }
  expect(criticalErrors).toEqual([]);
});

test('legacy duplicate action surfaces are absent', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  const inventory = await page.evaluate(async () => {
    const response = await fetch('./config/action-inventory.json', { cache: 'no-store' });
    return response.json();
  });
  expect(inventory.inventoryId).toBe('FOS-ACTIONS-005');
  expect(inventory.controls.length).toBeGreaterThanOrEqual(40);

  await expect(page.locator('[data-approval-dialog]')).toHaveCount(0);
  await expect(page.locator('[data-action]')).toHaveCount(0);
  await expect(page.locator('[data-workspace-button]')).toHaveCount(0);
  await expect(page.locator('[data-resume-workspace]')).toHaveCount(0);
  await expect(page.locator('[data-context-module]')).toHaveCount(0);
  await expect(page.locator('[onclick]')).toHaveCount(0);
  expect(criticalErrors).toEqual([]);
});


test('Founder Command Center exposes governed Sprint 1 entry points', async ({ page }) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  const dashboard = page.locator('[data-founder-command-center]');
  await expect(dashboard).toBeVisible();
  await expect(dashboard.locator('[data-command-center-section="workspace"]')).toBeVisible();
  await expect(dashboard.locator('[data-command-center-section="ai"]')).toBeVisible();
  await expect(dashboard.locator('[data-command-center-section="gateway"]')).toBeVisible();
  await expect(dashboard.locator('[data-command-center-section="activity"]')).toBeVisible();
  await expect(dashboard.locator('[data-command-center-section="quick-actions"]')).toBeVisible();

  await expect(dashboard.locator('[data-action-center-action="create"]')).toBeVisible();
  await expect(dashboard.locator('[data-action-center-action="inbox"]')).toBeVisible();
  await expect(dashboard.locator('[data-action-center-action="workspace:natural-nation:build"]')).toBeVisible();
  await expect(dashboard.locator('[data-command-center-section="quick-actions"] [data-action-center-action="workspace:natural-nation:ai"]')).toBeVisible();
  await expect(dashboard.locator('[data-action-center-action="workspace:founder-os:repo"]')).toBeVisible();

  await dashboard.locator('[data-action-center-action="inbox"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'approvals');
  await expect(page.locator('[data-workspace="approvals"]')).toBeVisible();
  expect(criticalErrors).toEqual([]);
});


test('workspace dashboard remains isolated and mobile-safe', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');
  const dashboard = page.locator('[data-founder-command-center]');
  await expect(dashboard).toHaveAttribute('data-dashboard-scope', 'natural-nation');
  await expect(dashboard).toContainText('Natural Nation');
  await expect(dashboard).not.toContainText('Open Founder OS');
  await expect(dashboard.locator('[data-action-center-action^="workspace:founder-os:"]')).toHaveCount(0);
  await expect(page.locator('[data-action-center-filter="current"]')).toBeVisible();
  await expect(page.locator('[data-action-center-filter="progress"]')).toBeVisible();
  if (testInfo.project.use.hasTouch) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const box = await page.locator('.sidebar').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  }
  expect(criticalErrors).toEqual([]);
});
