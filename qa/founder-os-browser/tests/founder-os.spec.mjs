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

async function returnHome(page) {
  const directHome = page.locator('[data-nav-home]:visible').first();
  if (await directHome.count()) {
    await directHome.click();
    return;
  }

  // Drawer behavior has its own interaction contract below. Route restoration
  // uses the public navigation API so animated mobile chrome cannot make these
  // history assertions depend on transient element geometry.
  await page.evaluate(() => {
    if (!window.NNOSNavigationManager?.openHome) throw new Error('Navigation Manager is unavailable.');
    window.NNOSNavigationManager.openHome('browser-qa', 'push');
  });
}

async function openView(page, target) {
  const visibleControl = page.locator(`[data-nav-view="${target}"]:visible`).first();
  if (await visibleControl.count()) {
    await visibleControl.click();
    return;
  }
  await page.evaluate((view) => {
    if (!window.NNOSNavigationManager?.openView) throw new Error('Navigation Manager is unavailable.');
    window.NNOSNavigationManager.openView(view, 'browser-qa');
  }, target);
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
      await returnHome(page);
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

  await openView(page, 'blueprint');
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

  await returnHome(page);
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

  const create = page.locator('[data-launch-action="create"]:visible, [data-create-workspace]:visible').first();
  await expect(create).toBeVisible();
  await create.click();
  const wizard = page.locator('[data-workspace-creation]');
  await expect(wizard).toBeVisible();
  await wizard.locator('[data-workspace-creation-close]').click();
  await expect(wizard).toBeHidden();

  await page.locator('[data-launch-filter="active"]:visible').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-launch-filter', 'active');
  await expect(page.locator('.workspace-card:not([hidden])').first()).toBeVisible();

  await page.locator('[data-launch-filter="all"]:visible').first().click();
  const search = page.locator('[data-launch-search]');
  await search.fill('Natural Nation');
  await expect(page.locator('.workspace-card[data-workspace-id="natural-nation"]')).toBeVisible();
  await expect(page.locator('.workspace-card[data-workspace-id="founder-os"]')).toBeHidden();
  await search.fill('');
  expect(criticalErrors).toEqual([]);
});

test('Founder Action Center opens and routes a workspace action', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');

  const metricId = testInfo.project.use.hasTouch ? 'current' : 'active';
  const metric = page.locator(`[data-action-center-filter="${metricId}"]`);
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

test('planning, mission, and Project Records controls use their authoritative owners', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');
  await expect(page.locator('script[src*="knowledge-engine.js"]')).toHaveCount(1);

  const missionRepo = page.locator('[data-mission-view="repo"]').first();
  await expect(missionRepo).toBeVisible();
  await missionRepo.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'repo');

  await openView(page, 'mission');
  const readiness = page.locator('[data-mission-action="run-closeout-check"]');
  await expect(readiness).toBeVisible();
  await readiness.click();
  await expect(page.locator('[data-mission-action-output]')).toContainText('Closeout Readiness Check');

  await openView(page, 'knowledge');
  const audit = page.locator('[data-knowledge-action="audit"]');
  await expect(audit).toBeVisible();
  await expect(page.locator('[data-workspace="knowledge"] [data-workspace-settings-panel]')).toHaveCount(0);
  await expect(page.locator('[data-workspace="knowledge"]')).not.toContainText('Manage Natural Nation');
  await audit.click();
  await expect(page.locator('[data-knowledge-action-output]')).toContainText('Knowledge Audit Complete');

  const command = page.locator('.knowledge-command');
  const commandLayout = await command.evaluate((node) => {
    const measure = (element) => {
      if (!element) return null;
      const { top, right, bottom, left, width, height } = element.getBoundingClientRect();
      return { top, right, bottom, left, width, height };
    };
    return {
      command: measure(node),
      copy: measure(node.firstElementChild),
      actions: measure(node.querySelector('.knowledge-command-actions')),
      search: measure(node.querySelector('.knowledge-search')),
      buttons: [...node.querySelectorAll('.knowledge-command-actions button')].map(measure),
    };
  });
  const { command: commandBox, copy, actions, search, buttons } = commandLayout;
  const pixelTolerance = 2;
  expect(commandBox).not.toBeNull();
  expect(copy).not.toBeNull();
  expect(actions).not.toBeNull();
  expect(search).not.toBeNull();
  expect(actions.top).toBeGreaterThanOrEqual(copy.bottom - pixelTolerance);
  expect(search.width).toBeGreaterThan(0);
  expect(search.left).toBeGreaterThanOrEqual(actions.left - pixelTolerance);
  expect(search.right).toBeLessThanOrEqual(actions.right + pixelTolerance);
  expect(buttons).toHaveLength(2);
  buttons.forEach((button) => {
    expect(button.height).toBeGreaterThanOrEqual(48 - pixelTolerance);
    expect(button.left).toBeGreaterThanOrEqual(actions.left - pixelTolerance);
    expect(button.right).toBeLessThanOrEqual(actions.right + pixelTolerance);
  });

  if (testInfo.project.use.hasTouch) {
    expect(search.width).toBeGreaterThanOrEqual(actions.width - pixelTolerance);
    buttons.forEach((button) => {
      expect(button.top).toBeGreaterThanOrEqual(search.bottom - pixelTolerance);
    });
    expect(Math.abs(buttons[0].top - buttons[1].top)).toBeLessThanOrEqual(pixelTolerance);
  } else {
    expect(copy.width).toBeGreaterThanOrEqual(Math.min(560, commandBox.width) - pixelTolerance);
  }

  if (!testInfo.project.use.hasTouch) {
    const browser = page.locator('.knowledge-browser');
    const detail = page.locator('[data-knowledge-detail]');
    const primary = detail.locator('.knowledge-actions > .primary');
    await expect(browser).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(primary).toBeVisible();
    await expect(primary).toContainText(/Open Record|Approve/);
    await expect(detail.locator('.knowledge-secondary-actions .btn')).toHaveCount(2);
    const desktopLayout = await browser.evaluate((node) => {
      const list = node.querySelector('.knowledge-list')?.getBoundingClientRect();
      const panel = node.querySelector('.knowledge-detail')?.getBoundingClientRect();
      const action = node.querySelector('.knowledge-actions > .primary')?.getBoundingClientRect();
      return Boolean(list && panel && action
        && panel.width > list.width
        && action.width > 0
        && action.right <= panel.right
        && action.height >= 48);
    });
    expect(desktopLayout).toBe(true);
  }

  if (testInfo.project.use.hasTouch) {
    await page.locator('[data-knowledge-record]').first().click();
    const detail = page.locator('[data-knowledge-detail]');
    await expect(detail).toBeVisible();
    await expect(detail.locator('.knowledge-mobile-detail-close')).toContainText('Product Records');
    await expect(detail.locator('.knowledge-actions > .primary')).toBeVisible();
    await expect(detail.locator('.knowledge-actions > .primary')).toContainText(/Open Record|Approve/);
    await expect(detail.locator('.knowledge-secondary-actions .btn')).toHaveCount(2);
    const fitsViewport = await detail.locator('.knowledge-actions').evaluate((node) => node.scrollWidth <= node.clientWidth);
    expect(fitsViewport).toBe(true);
    const touchTargets = await detail.locator('.knowledge-actions .btn, .knowledge-technical summary').evaluateAll((nodes) =>
      nodes.every((node) => node.getBoundingClientRect().height >= 48)
    );
    expect(touchTargets).toBe(true);
    await detail.locator('[data-knowledge-action="close-detail"]').click();
  }

  await openView(page, 'discovery');
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

test('Approval Inbox and AI Team Monitor expose founder decision status', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');

  await page.evaluate(() => {
    if (!window.NNOSApprovalInbox?.open) throw new Error('Approval Inbox controller is unavailable.');
    window.NNOSApprovalInbox.open();
  });
  await expect(page.locator('[data-workspace="approvals"]')).toBeVisible();
  await expect(page.locator('[data-approval-refresh]')).toBeVisible();
  const approvalSummary = page.locator('[data-approval-summary]');
  await expect(approvalSummary).toBeVisible();
  await expect(approvalSummary).toContainText('Needs your decision');
  await expect(approvalSummary).toContainText('Workspaces represented');
  await expect(approvalSummary).toContainText('Gateway coverage');
  const approvalImpact = await page.evaluate(() => {
    const complete = window.NNOSApprovalInbox.describeImpact({
      changeSummary: 'Adds governed approval controls.',
      projectEffect: 'Founder OS can record a protected decision without changing member-facing behavior.',
      changedFiles: [{
        path: 'docs/founder-os/js/founder-approval-inbox.js',
        purpose: 'Approval behavior',
        projectEffect: 'Connects Founder decisions to the governed action flow.',
        risk: 'Medium'
      }],
      evidence: ['Cross-browser checks passed.'],
      verificationSummary: '5 checks passed',
      overallRisk: 'Medium',
      rollbackPlan: 'Revert this change set.'
    });
    const incomplete = window.NNOSApprovalInbox.describeImpact({ resultSummary: 'Approval is waiting.' });
    return { complete, incomplete };
  });
  expect(approvalImpact.complete.filesComplete).toBe(true);
  expect(approvalImpact.complete.files[0]).toEqual({
    path: 'docs/founder-os/js/founder-approval-inbox.js',
    purpose: 'Approval behavior',
    effect: 'Connects Founder decisions to the governed action flow.',
    risk: 'Medium'
  });
  expect(approvalImpact.complete.verification).toBe('5 checks passed');
  expect(approvalImpact.incomplete.filesComplete).toBe(false);
  expect(approvalImpact.incomplete.projectEffect).toContain('Do not approve');

  await openView(page, 'ai');
  await expect(page.locator('[data-workspace="ai"]')).toBeVisible();
  const monitor = page.locator('[data-ai-monitor-summary]');
  await expect(monitor).toBeVisible();
  await expect(monitor.locator('[data-ai-current-owner]')).not.toBeEmpty();
  await expect(monitor.locator('[data-ai-current-task]')).not.toBeEmpty();
  await expect(monitor.locator('[data-ai-blocked-count]')).toHaveText(/^\d+ blocked$/);
  await expect(monitor.locator('[data-ai-approval-count]')).toHaveText(/^\d+ Founder decisions$/);
  await expect(monitor.locator('[data-ai-provider-health]')).toContainText('Providers configured');
  await expect(monitor.locator('[data-ai-refresh]')).toBeVisible();
  const teamControls = page.locator('[data-ai-team-controls]');
  await expect(teamControls).toBeVisible();
  await expect(teamControls).toContainText('AI-Controlled Team');
  await expect(teamControls).toContainText('Workspace Team Plan');
  await expect(teamControls).toContainText('Active roles');
  await expect(teamControls).toContainText('Blocked');
  await expect(teamControls).toContainText('Founder');
  await expect(teamControls).toContainText(/Monitor by exception|Decision required/);
  const override = teamControls.locator('[data-founder-ai-override]');
  await expect(override).toBeVisible();
  await expect(override).not.toHaveAttribute('open', '');
  await expect(override.locator('[data-ai-control]')).toHaveCount(6);
  const teamPlanBeforeRoles = await page.evaluate(() => {
    const teamPlan = document.querySelector('[data-ai-team-controls]');
    const rolesPanel = document.querySelector('[data-ai-roles]')?.closest('article');
    return Boolean(teamPlan && rolesPanel && (teamPlan.compareDocumentPosition(rolesPanel) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(teamPlanBeforeRoles).toBe(true);
  await expect(page.locator('[data-ai-roles] [data-ai-agent]')).toHaveCount(5);
  const firstRoleCard = page.locator('[data-ai-roles] .ai-role-card').first();
  const firstRoleToggle = firstRoleCard.locator('[data-ai-role-toggle]');
  const firstRoleDetails = firstRoleCard.locator('[data-ai-role-details]');
  await expect(firstRoleToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(firstRoleDetails).toBeHidden();
  await firstRoleToggle.click();
  await expect(firstRoleToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(firstRoleDetails).toBeVisible();
  await expect(firstRoleDetails).toContainText('Current responsibility');
  await expect(firstRoleDetails).toContainText('Expected result');
  await expect(firstRoleDetails).toContainText('Next handoff');
  const technicalDetails = firstRoleDetails.locator('.ai-technical-details');
  await expect(technicalDetails).not.toHaveAttribute('open', '');
  await expect(page.locator('[data-ai-roles] .ai-role-status')).toHaveCount(5);
  const workflowSteps = page.locator('.ai-workflow-step');
  expect(await workflowSteps.count()).toBeGreaterThanOrEqual(1);
  await expect(workflowSteps.first()).toContainText('Expected result');
  await expect(workflowSteps.first()).toContainText('Next handoff');
  await expect(workflowSteps.first().locator('.ai-task-evidence')).not.toHaveAttribute('open', '');
  if (testInfo.project.use.hasTouch) {
    const roleColumns = await page.locator('[data-ai-roles]').evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    expect(roleColumns).toBe(1);
  }
  const activeTasks = await page.locator('.orchestration-task:not([data-task-status="complete"]):not([data-task-status="completed"])').count();
  if (activeTasks === 0) await expect(teamControls.locator('[data-ai-control="submit_review"]')).toBeDisabled();
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


test('desktop Founder Home preserves the established Launch Center', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  test.skip(Boolean(testInfo.project.use.hasTouch), 'Desktop contract runs in desktop projects.');
  await openHome(page);
  await expect(page.locator('[data-founder-command-center]')).toBeHidden();
  await expect(page.locator('[data-action-center-filter="active"]')).toBeVisible();
  await expect(page.locator('[data-action-center-filter="approvals"]')).toBeVisible();
  await expect(page.locator('[data-action-center-filter="blocked"]')).toBeVisible();
  await expect(page.locator('[data-action-center-filter="gateway"]')).toBeVisible();
  await expect(page.locator('[data-launch-action="create"]').first()).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  expect(criticalErrors).toEqual([]);
});

test('workspace dashboard remains isolated and mobile-safe', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Workspace dashboard redesign is mobile-only.');
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
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('[data-mobile-workspace-navigation]')).toBeVisible();
  }
  expect(criticalErrors).toEqual([]);
});


test('approved mobile workspace chrome matches the Founder reference', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Mobile workspace chrome runs in touch projects.');
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');
  await expect(page.locator('[data-mobile-workspace-header]')).toBeVisible();
  await expect(page.locator('[data-mobile-workspace-header]')).toContainText('Natural Nation');
  await expect(page.locator('[data-mobile-workspace-navigation]')).toBeVisible();
  await expect(page.locator('[data-mobile-workspace-navigation] button')).toHaveCount(4);
  await expect(page.locator('.workspace-metric')).toHaveCount(4);
  await expect(page.locator('.workspace-metric-current')).toBeVisible();
  await expect(page.locator('.workspace-metric-approvals')).toBeVisible();
  await expect(page.locator('.workspace-metric-progress')).toBeVisible();
  await expect(page.locator('.workspace-metric-blocked')).toBeVisible();
  const metricShare = await page.locator('.workspace-metrics').evaluate((element) => element.getBoundingClientRect().height / window.innerHeight);
  expect(metricShare).toBeLessThanOrEqual(0.305);
  await expect(page.locator('[data-command-center-section="next-action"]')).toBeVisible();
  await expect(page.locator('[data-command-center-section="activity"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(criticalErrors).toEqual([]);
});


test('global and workspace mobile navigation expose governed destinations', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Mobile navigation contract runs in touch projects.');
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);

  const navigation = page.locator('[data-mobile-workspace-navigation]');
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('button')).toHaveCount(4);
  await expect(navigation).toContainText('Workspaces');
  await expect(navigation).toContainText('Approvals');
  await expect(navigation).toContainText('Create');
  await expect(navigation).toContainText('Account');

  await openWorkspace(page, 'natural-nation');
  await expect(navigation).toContainText('Overview');
  await expect(navigation).toContainText('Approvals');
  await expect(navigation).toContainText('Build');
  await expect(navigation).toContainText('Team');
  await expect(navigation).not.toContainText('Create');
  const overview = navigation.locator('[data-action-center-action$=":mission"]');
  const approvals = navigation.locator('[data-action-center-action="inbox"]');
  const team = navigation.locator('[data-action-center-action$=":ai"]');
  await expect(overview).toHaveAttribute('aria-current', 'page');

  await approvals.click();
  await expect(page.locator('[data-workspace="approvals"]')).toBeVisible();
  await expect(page.locator('[data-founder-action-center]')).toBeHidden();
  await expect(approvals).toHaveAttribute('aria-current', 'page');
  await expect(overview).not.toHaveAttribute('aria-current', 'page');

  await team.click();
  await expect(page.locator('[data-workspace="ai"]')).toBeVisible();
  await expect(team).toHaveAttribute('aria-current', 'page');
  await expect(overview).not.toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-ai-monitor-summary]')).toBeVisible();
  const monitorBeforeRoles = await page.evaluate(() => {
    const monitorPanel = document.querySelector('[data-ai-monitor-summary]')?.closest('article');
    const rolesPanel = document.querySelector('[data-ai-roles]')?.closest('article');
    return Boolean(monitorPanel && rolesPanel && (monitorPanel.compareDocumentPosition(rolesPanel) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(monitorBeforeRoles).toBe(true);
  expect(criticalErrors).toEqual([]);
});


test('mobile Build and Team routes open on the first tap after refresh', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Mobile first-tap navigation runs in touch projects.');
  const criticalErrors = collectCriticalErrors(page);
  await page.goto('./#workspace=natural-nation&view=mission');
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');

  const navigation = page.locator('[data-mobile-workspace-navigation]');
  const build = navigation.locator('[data-action-center-action="workspace:natural-nation:build"]');
  const team = navigation.locator('[data-action-center-action="workspace:natural-nation:ai"]');

  const navigationIdentityPreserved = await page.evaluate(async () => {
    const before = document.querySelector('[data-mobile-workspace-navigation]');
    const beforeBuild = before?.querySelector('[data-action-center-action="workspace:natural-nation:build"]');
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { target: 'mission' } }));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const after = document.querySelector('[data-mobile-workspace-navigation]');
    const afterBuild = after?.querySelector('[data-action-center-action="workspace:natural-nation:build"]');
    return before === after && beforeBuild === afterBuild;
  });
  expect(navigationIdentityPreserved).toBe(true);

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');
  await page.evaluate(() => {
    window.NNOSNavigationManager.openWorkspace = () => {
      throw new Error('Current-workspace tabs must not reopen the workspace.');
    };
  });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await build.tap();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'build');
  await expect(page.locator('[data-workspace="build"]')).toBeVisible();
  await expect(page.locator('[data-workspace="build"]')).toBeInViewport();
  await expect(page.locator('[data-workspace="build"]')).toBeFocused();

  await page.goto('./#workspace=natural-nation&view=mission');
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'mission');
  await page.evaluate(() => {
    window.NNOSNavigationManager.openWorkspace = () => {
      throw new Error('Current-workspace tabs must not reopen the workspace.');
    };
  });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await team.tap();
  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'ai');
  await expect(page.locator('[data-workspace="ai"]')).toBeVisible();
  await expect(page.locator('[data-workspace="ai"]')).toBeInViewport();
  await expect(page.locator('[data-workspace="ai"]')).toBeFocused();
  expect(criticalErrors).toEqual([]);
});


test('mobile header controls open menus without leaving the workspace', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Mobile header contract runs in touch projects.');
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');

  const header = page.locator('[data-mobile-workspace-header]');
  const menu = header.locator('[data-action-center-action="mobile-menu"]');
  await menu.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'natural-nation');
  await expect(header).toBeVisible();
  await expect(header.locator('[data-mobile-header-popover]')).toBeVisible();
  const drawer = header.locator('[data-mobile-header-popover]');
  await expect(drawer).toContainText('Natural Nation');
  await expect(drawer).toContainText('Workspace Navigation');
  await expect(drawer.locator('[data-action-center-action="workspace:natural-nation:mission"]')).toBeVisible();
  await expect(drawer.locator('[data-action-center-action="workspace:natural-nation:build"]')).toBeVisible();
  await expect(drawer.locator('[data-action-center-action="workspace:natural-nation:ai"]')).toBeVisible();
  await expect(drawer.locator('[data-action-center-action="home"]')).toBeVisible();
  await expect(drawer).toHaveAttribute('data-mode', 'mobile-menu');
  const drawerBox = await drawer.boundingBox();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const bottomNavigationBox = await page.locator('[data-mobile-workspace-navigation]').boundingBox();
  expect(drawerBox.x).toBeLessThanOrEqual(1);
  expect(drawerBox.width).toBeLessThanOrEqual((await page.evaluate(() => window.innerWidth)) * 0.83);
  expect(drawerBox.y + drawerBox.height).toBeLessThanOrEqual(bottomNavigationBox.y + 1);
  expect(drawerBox.height).toBeLessThan(viewportHeight);

  await drawer.locator('[data-action-center-action="mobile-menu-close"]').click();
  await expect(header.locator('[data-mobile-header-popover]')).toBeHidden();

  const switcher = header.locator('[data-action-center-action="mobile-workspaces"]');
  await switcher.click();
  await expect(page.locator('body')).toHaveAttribute('data-active-workspace', 'natural-nation');
  await expect(header.locator('[data-mobile-header-popover]')).toBeVisible();
  const workspacePopover = header.locator('[data-mobile-header-popover]');
  await expect(workspacePopover).toContainText('Switch Workspace');
  await expect(workspacePopover).toContainText('Founder OS');
  const switcherBox = await workspacePopover.boundingBox();
  expect(switcherBox.width).toBeLessThanOrEqual(300);
  expect(switcherBox.height).toBeLessThanOrEqual((await page.evaluate(() => window.innerHeight)) * 0.63);
  await expect(header.locator('.mobile-header-brand strong')).toBeHidden();
  expect(criticalErrors).toEqual([]);
});


test('Evidence and Audit presents founder impact with secondary technical proof', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'natural-nation');
  await openView(page, 'evidence');

  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'evidence');
  const evidence = page.locator('[data-evidence-audit-app]');
  await expect(evidence).toBeVisible();
  await expect(evidence).toContainText('Evidence & Audit');
  await expect(evidence).toContainText('Verified runs');
  await expect(evidence).toContainText('Exceptions');
  await expect(evidence).toContainText('Recorded cost');
  await expect(evidence).toContainText('Project impact');
  await expect(evidence).toContainText('Affected files');
  await expect(evidence).toContainText('Decision and outcome');
  await expect(evidence.locator('.evidence-proof').first()).not.toHaveAttribute('open', '');

  if (testInfo.project.use.hasTouch) {
    const columns = await evidence.locator('.evidence-layout').evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(1);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(criticalErrors).toEqual([]);
});

test('Usage Analytics identifies the highest recorded driver with responsive charts', async ({ page }, testInfo) => {
  const criticalErrors = collectCriticalErrors(page);
  await openHome(page);
  await openWorkspace(page, 'founder-os');
  await openView(page, 'analytics');

  await expect(page.locator('body')).toHaveAttribute('data-active-view', 'analytics');
  const analytics = page.locator('[data-usage-analytics-app]');
  await expect(analytics).toBeVisible();
  await expect(analytics).toContainText('Usage Analytics');
  await expect(analytics).toContainText('Highest measured usage');
  await expect(analytics).toContainText('Cloudflare Workers');
  await expect(analytics).toContainText('$0.12');
  await expect(analytics).toContainText('Historical usage is preserved but unmetered');
  await expect(analytics.locator('.usage-bars')).toBeVisible();
  await expect(analytics.locator('.usage-pie')).toBeVisible();
  await expect(analytics.locator('.usage-trend')).toBeVisible();
  await expect(analytics.locator('[data-analytics-highest]')).toContainText('recorded cost');

  if (testInfo.project.use.hasTouch) {
    const columns = await analytics.locator('.usage-chart-grid').evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(1);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(criticalErrors).toEqual([]);
});
