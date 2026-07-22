import fs from 'node:fs';

const requiredFiles = [
  'docs/founder-os/js/founder-approval-inbox.js',
  'docs/founder-os/css/founder-approval-inbox.css',
  'docs/founder-os/js/founder-action-center.js',
  'docs/founder-os/js/app.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required Approval Inbox file: ${file}`);
}

const inbox = fs.readFileSync(requiredFiles[0], 'utf8');
const actionCenter = fs.readFileSync(requiredFiles[2], 'utf8');
const app = fs.readFileSync(requiredFiles[3], 'utf8');

const inboxContracts = [
  "view.dataset.workspace = 'approvals'",
  'data-approval-decision="approve"',
  'data-approval-decision="request_changes"',
  'data-approval-decision="defer"',
  'data-approval-decision="reject"',
  'data-approval-decision="note"',
  '/decision',
  'Founder Key',
  'window.NNOSApprovalInbox'
];

for (const contract of inboxContracts) {
  if (!inbox.includes(contract)) throw new Error(`Approval Inbox contract missing: ${contract}`);
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

console.log('Founder Approval Inbox contracts passed.');