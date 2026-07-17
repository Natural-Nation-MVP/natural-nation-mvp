import assert from 'node:assert/strict';
import fs from 'node:fs';
import { commandCenterData } from '../founder-os/app/app.mjs';

const html = fs.readFileSync(new URL('../founder-os/app/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../founder-os/app/styles.css', import.meta.url), 'utf8');

assert.equal(commandCenterData.workspaces[0].number, 1);
assert.equal(commandCenterData.workspaces[0].name, 'Natural Nation');
assert.equal(commandCenterData.workspaces[1].number, 2);
assert.notEqual(commandCenterData.workspaces[0].id, commandCenterData.workspaces[1].id);
assert.ok(commandCenterData.workspaces.every((workspace) => workspace.metrics && workspace.runs && workspace.approvals && workspace.health && workspace.schedules && workspace.release && workspace.evidence));
assert.ok(html.includes('aria-label="Workspace navigation"'));
assert.ok(html.includes('aria-live="polite"'));
assert.ok(html.includes('Skip to main content'));
assert.ok(css.includes('@media(max-width:560px)'));
assert.ok(!JSON.stringify(commandCenterData).match(/api[_-]?key|authorization|password|secret:\/\//i));
console.log('FOS-APP-001 validation passed');
