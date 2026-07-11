const REQUIRED_BLUEPRINT_FIELDS = [
  "workspaceId",
  "blueprintVersion",
  "decisionResolutions",
  "confirmation",
  "clientRequestId"
];

export function validateApprovalRequest(body, routeParams) {
  const blockers = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return [{ code: "INVALID_BODY", message: "Request body must be a JSON object." }];
  }

  for (const field of REQUIRED_BLUEPRINT_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      blockers.push({
        code: "REQUIRED_FIELD_MISSING",
        field,
        message: `${field} is required.`
      });
    }
  }

  if (body.workspaceId && body.workspaceId !== routeParams.workspaceId) {
    blockers.push({
      code: "WORKSPACE_MISMATCH",
      field: "workspaceId",
      message: "The request workspace does not match the route workspace."
    });
  }

  if (body.blueprintVersion && body.blueprintVersion !== routeParams.blueprintVersion) {
    blockers.push({
      code: "BLUEPRINT_VERSION_MISMATCH",
      field: "blueprintVersion",
      message: "The request Blueprint version does not match the route version."
    });
  }

  if (body.workspaceId && body.workspaceId !== "natural-nation") {
    blockers.push({
      code: "WORKSPACE_NOT_SUPPORTED",
      field: "workspaceId",
      message: "The first protected slice currently supports only the Natural Nation workspace."
    });
  }

  if (!body.confirmation?.approved || !body.confirmation?.effectAcknowledged) {
    blockers.push({
      code: "CONFIRMATION_REQUIRED",
      field: "confirmation",
      message: "Founder approval and effect acknowledgement are required."
    });
  }

  const billingResolution = body.decisionResolutions?.["billing-mvp"];
  const acceptedBillingResolutions = ["included-in-mvp", "excluded-from-mvp"];

  if (!acceptedBillingResolutions.includes(billingResolution)) {
    blockers.push({
      code: "UNRESOLVED_DECISION",
      field: "billing-mvp",
      message: "Resolve whether subscription billing is included in the MVP."
    });
  }

  if (typeof body.clientRequestId === "string" && body.clientRequestId.length < 8) {
    blockers.push({
      code: "INVALID_CLIENT_REQUEST_ID",
      field: "clientRequestId",
      message: "clientRequestId must be a stable unique identifier."
    });
  }

  return blockers;
}
