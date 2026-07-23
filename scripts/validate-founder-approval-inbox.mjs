import fs from 'node:fs';

const requiredFiles = [
  'docs/founder-os/js/founder-approval-inbox.js',
  'docs/founder-os/css/founder-approval-inbox.css',
  'docs/founder-os/js/founder-action-center.js',
  'docs/founder-os/js/app.js',
  'services/founder-os-gateway/src/routes/founder-approval-actions.js',
  'services/founder-os-gateway/src/index.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required Approval Inbox file: ${file}`);
}

const inbox = fs.readFileSync(requiredFiles[0], 'utf8');
const actionCenter = fs.readFileSync(requiredFiles[2], 'utf8');
const app = fs.readFileSync(requiredFiles[3], 'utf8');
const approvalActions = fs.readFileSync(requiredFiles[4], 'utf8');
const gatewayIndex = fs.readFileSync(requiredFiles[5], 'utf8');

const inboxContracts = [
  "view.dataset.workspace = 'approvals'",
  'data-approval-decision="approve"',
  'data-approval-decision="request_changes"',
  'data-approval-decision="defer"',
  'data-approval-decision="reject"',
  'data-approval-decision="note"',
  '/decision',
  '/approval-action',
  'Founder Key',
  'founderNotes',
  'Decision history',
  'window.NNOSApprovalInbox'
];

for (const contract of inboxContracts) {
  if (!inbox.includes(contract)) throw new Error(`Approval Inbox contract missing: ${contract}`);
}

const protectedActionContracts = [
  'authenticateFounder',
  'ALLOWED_ACTIONS',
  '"defer"',
  '"reject"',
  '"note"',
  'founder-deferred',
  'founder-rejected',
  'founderNotes',
  'commitFilesAtomically',
  'FOUNDER_APPROVAL_ACTION_REJECTED'
];

for (const contract of protectedActionContracts) {
  if (!approvalActions.includes(contract)) throw new Error(`Protected approval action contract missing: ${contract}`);
}

if (!gatewayIndex.includes('handleFounderApprovalActions') || !gatewayIndex.includes('founderApprovalInboxActions')) {
  throw new Error('Gateway does not register the protected Approval Inbox action route.');
}

if (!actionCenter.includes('approval:${task.id}') || !actionCenter.includes('NNOSApprovalInbox')) {
  throw new Error('Action Center does not deep-link to exact Approval Inbox records.');
}

if (!app.includes("approvals: { title: 'Approval Inbox'") || !app.includes("target === 'approvals'")) {
  throw new Error('Founder OS router does not recognize the Approval Inbox view.');
}

if (!app.includes("paths.asset('js/founder-approval-inbox.js?v=section-2')")) {
  throw new Error('Approval Inbox runtime is not loaded through route-safe NNOSPaths.');
}

console.log('Founder Approval Inbox protected-action contracts passed.');
