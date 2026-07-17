# Founder Walkthrough — Integration Governance

## Natural Nation: review and merge a pull request

1. Founder opens Natural Nation from the Workspace Registry.
2. Founder OS shows the workspace's GitHub connection as healthy and lists approved capabilities.
3. AI may read repository state and prepare a pull request through registered capabilities.
4. When a merge is requested, Founder OS creates an external action request with the exact workspace, pull request, head SHA, payload digest, evidence, and audit reference.
5. The Founder receives an attention item and opens the Natural Nation approval context.
6. Approval is recorded against that exact action request.
7. The execution runtime invokes the registered merge capability once with an idempotency key.
8. Result evidence and the external provider reference are attached to the execution run.

A notification cannot perform step 6 or step 7.

## Contractor Estimator: send an estimate

1. The workspace prepares a customer estimate and preview.
2. Verification confirms required totals, recipient, and attachment evidence.
3. Founder OS classifies external email delivery as consequential.
4. The Founder reviews the exact recipient, subject, payload digest, and attachments.
5. Only after approval may the runtime invoke `message.send-external` through the Contractor Estimator connection.

The Natural Nation email connection cannot be substituted, even when both workspaces use the same provider.

## Blocked examples

### Workspace mismatch

A Natural Nation execution request references the Contractor Estimator GitHub connection. Founder OS blocks the request before any connector invocation and records the mismatch.

### Revoked connection

A scheduled workflow reaches a revoked integration connection. The occurrence is marked blocked, no retry is attempted until the connection state changes, and a Founder attention item may be generated.

### Protected payload

An outbound payload contains a raw token or protected security value. Delivery is blocked. The value is not copied into logs, evidence, previews, notifications, or audit text.

## Founder boundary

The Founder may connect, suspend, revoke, approve, or deny governed external actions. Routine reads and bounded registered writes may proceed according to workspace policy. Consequential external mutations always preserve explicit Founder authority.
