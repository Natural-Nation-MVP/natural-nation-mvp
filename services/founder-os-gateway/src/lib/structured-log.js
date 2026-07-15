const REDACTED_KEYS = new Set([
  "authorization",
  "token",
  "secret",
  "apiKey",
  "OPENAI_API_KEY",
  "GOOGLE_AI_API_KEY",
  "GITHUB_TOKEN",
  "FOUNDER_API_KEY"
]);

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      REDACTED_KEYS.has(key) || /token|secret|authorization|api.?key/i.test(key)
        ? "[REDACTED]"
        : sanitize(item)
    ])
  );
}

export function structuredLog(event, details = {}) {
  console.log(JSON.stringify({
    service: "founder-os-gateway",
    event,
    timestamp: new Date().toISOString(),
    ...sanitize(details)
  }));
}
