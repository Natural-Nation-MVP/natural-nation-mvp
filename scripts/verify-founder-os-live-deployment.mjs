import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const baseUrlInput = process.env.FOUNDER_OS_BASE_URL;
const expectedSha = process.env.EXPECTED_SHA;
const expectedRunId = process.env.EXPECTED_RUN_ID || '';
const maxAttempts = Number.parseInt(process.env.MAX_ATTEMPTS || '36', 10);
const retryDelayMs = Number.parseInt(process.env.RETRY_DELAY_MS || '10000', 10);
const reportPath = resolve(process.env.REPORT_PATH || 'artifacts/founder-os-live-deployment-report.json');

if (!baseUrlInput) {
  throw new Error('FOUNDER_OS_BASE_URL is required.');
}

if (!expectedSha || !/^[a-f0-9]{40}$/i.test(expectedSha)) {
  throw new Error('EXPECTED_SHA must be a full 40-character Git commit SHA.');
}

if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
  throw new Error('MAX_ATTEMPTS must be a positive integer.');
}

if (!Number.isInteger(retryDelayMs) || retryDelayMs < 0) {
  throw new Error('RETRY_DELAY_MS must be a non-negative integer.');
}

const baseUrl = new URL(baseUrlInput.endsWith('/') ? baseUrlInput : `${baseUrlInput}/`);
const canonicalUrl = new URL('founder-os/', baseUrl);

const requiredAssets = [
  'css/founder-os.css',
  'css/founder-home-functionality.css',
  'css/workspace-launch-center.css',
  'js/workspace-registry.js',
  'js/founder-home-functionality.js',
  'js/navigation-manager-035.js'
];

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function withVerificationQuery(inputUrl, attempt) {
  const url = new URL(inputUrl);
  url.searchParams.set('deployment-verification', `${expectedSha}-${attempt}-${Date.now()}`);
  return url;
}

async function fetchResponse(inputUrl, attempt) {
  const requestUrl = withVerificationQuery(inputUrl, attempt);
  const response = await fetch(requestUrl, {
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate',
      pragma: 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`${requestUrl.href} returned HTTP ${response.status}.`);
  }

  return { response, requestUrl };
}

async function fetchText(inputUrl, attempt) {
  const { response, requestUrl } = await fetchResponse(inputUrl, attempt);
  return {
    body: await response.text(),
    contentType: response.headers.get('content-type') || '',
    requestUrl: requestUrl.href
  };
}

async function fetchJson(inputUrl, attempt) {
  const result = await fetchText(inputUrl, attempt);
  try {
    return { ...result, value: JSON.parse(result.body) };
  } catch (error) {
    throw new Error(`${result.requestUrl} did not return valid JSON: ${error.message}`);
  }
}

function readMeta(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta\\s+[^>]*name=["']${escapedName}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*name=["']${escapedName}["'][^>]*>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function collectAssetUrls(html) {
  const urls = [];
  const attributePattern = /(?:src|href)=["']([^"']+)["']/gi;
  let match;

  while ((match = attributePattern.exec(html)) !== null) {
    const candidate = match[1];
    if (/^(?:\.\/)?(?:css|js)\//i.test(candidate)) {
      urls.push(candidate);
    }
  }

  return [...new Set(urls)];
}

function assertEqual(actual, expected, label) {
  if (String(actual) !== String(expected)) {
    throw new Error(`${label} mismatch. Expected ${expected}; received ${actual ?? 'missing'}.`);
  }
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label} is missing ${expected}.`);
  }
}

function validateDeploymentRecord(record, label) {
  assertEqual(record.application, 'Founder OS', `${label} application`);
  assertEqual(record.commitSha, expectedSha, `${label} commitSha`);

  if (expectedRunId) {
    assertEqual(record.runId, expectedRunId, `${label} runId`);
  }

  assertEqual(record.entryMode, 'canonical-redirect', `${label} entryMode`);
  assertEqual(record.workspaceCardMode, 'static-grid-explicit-button', `${label} workspaceCardMode`);

  if (!record.deployedAt || Number.isNaN(Date.parse(record.deployedAt))) {
    throw new Error(`${label} deployedAt is missing or invalid.`);
  }
}

async function validateAsset(assetReference, attempt) {
  const assetUrl = new URL(assetReference, canonicalUrl);
  const { response, requestUrl } = await fetchResponse(assetUrl, attempt);
  const contentLength = Number.parseInt(response.headers.get('content-length') || '0', 10);
  const body = await response.arrayBuffer();

  if (body.byteLength === 0 && contentLength === 0) {
    throw new Error(`${requestUrl.href} returned an empty asset.`);
  }

  return {
    asset: assetReference,
    url: requestUrl.href,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    bytes: body.byteLength || contentLength
  };
}

async function verifyAttempt(attempt) {
  const rootDeploymentUrl = new URL('deployment.json', baseUrl);
  const canonicalDeploymentUrl = new URL('deployment.json', canonicalUrl);
  const rootHtmlUrl = new URL('./', baseUrl);
  const canonicalHtmlUrl = new URL('./', canonicalUrl);

  const [rootDeployment, canonicalDeployment, rootHtml, canonicalHtml] = await Promise.all([
    fetchJson(rootDeploymentUrl, attempt),
    fetchJson(canonicalDeploymentUrl, attempt),
    fetchText(rootHtmlUrl, attempt),
    fetchText(canonicalHtmlUrl, attempt)
  ]);

  validateDeploymentRecord(rootDeployment.value, 'Root deployment marker');
  validateDeploymentRecord(canonicalDeployment.value, 'Canonical deployment marker');
  assertEqual(
    canonicalDeployment.value.commitSha,
    rootDeployment.value.commitSha,
    'Deployment marker commit agreement'
  );
  assertEqual(
    canonicalDeployment.value.runId,
    rootDeployment.value.runId,
    'Deployment marker run agreement'
  );

  assertEqual(readMeta(rootHtml.body, 'founder-os-entry'), 'canonical-redirect', 'Root entry marker');
  assertEqual(readMeta(rootHtml.body, 'founder-os-deployment-sha'), expectedSha, 'Root deployment meta');
  assertIncludes(rootHtml.body, 'window.location.replace', 'Root canonical redirect');

  const forbiddenRootRuntime = [
    'workspace-registry.js',
    'workspace-manager.js',
    'founder-home-functionality.js',
    'navigation-manager-035.js'
  ];

  for (const runtimeFile of forbiddenRootRuntime) {
    if (rootHtml.body.includes(runtimeFile)) {
      throw new Error(`Root redirect unexpectedly loads ${runtimeFile}.`);
    }
  }

  assertEqual(
    readMeta(canonicalHtml.body, 'founder-os-deployment-sha'),
    expectedSha,
    'Canonical deployment meta'
  );

  const assetReferences = collectAssetUrls(canonicalHtml.body);
  if (assetReferences.length === 0) {
    throw new Error('Canonical HTML contains no local CSS or JavaScript assets.');
  }

  for (const requiredAsset of requiredAssets) {
    const matchedReference = assetReferences.find((assetReference) =>
      assetReference.replace(/^\.\//, '').split('?')[0] === requiredAsset
    );

    if (!matchedReference) {
      throw new Error(`Canonical HTML is missing required asset ${requiredAsset}.`);
    }
  }

  const expectedVersionSuffix = `-${expectedSha}`;
  for (const assetReference of assetReferences) {
    const assetUrl = new URL(assetReference, canonicalUrl);
    const version = assetUrl.searchParams.get('v');

    if (!version) {
      throw new Error(`${assetReference} is missing the shared deployment version query.`);
    }

    if (!version.endsWith(expectedVersionSuffix)) {
      throw new Error(
        `${assetReference} does not target deployment ${expectedSha}. Received version ${version}.`
      );
    }
  }

  const assetResults = await Promise.all(
    assetReferences.map((assetReference) => validateAsset(assetReference, attempt))
  );

  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    attempt,
    expectedSha,
    expectedRunId: expectedRunId || null,
    baseUrl: baseUrl.href,
    canonicalUrl: canonicalUrl.href,
    deployment: {
      root: rootDeployment.value,
      canonical: canonicalDeployment.value
    },
    html: {
      rootRequestUrl: rootHtml.requestUrl,
      canonicalRequestUrl: canonicalHtml.requestUrl,
      rootContentType: rootHtml.contentType,
      canonicalContentType: canonicalHtml.contentType,
      rootDeploymentMeta: readMeta(rootHtml.body, 'founder-os-deployment-sha'),
      canonicalDeploymentMeta: readMeta(canonicalHtml.body, 'founder-os-deployment-sha')
    },
    assets: assetResults
  };
}

let latestError;
let report;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    console.log(`Live deployment verification attempt ${attempt}/${maxAttempts}: ${baseUrl.href}`);
    report = await verifyAttempt(attempt);
    console.log(
      `Verified Founder OS deployment ${expectedSha} with ${report.assets.length} live assets.`
    );
    break;
  } catch (error) {
    latestError = error;
    console.warn(`Attempt ${attempt} did not pass: ${error.message}`);

    if (attempt < maxAttempts) {
      await sleep(retryDelayMs);
    }
  }
}

if (!report) {
  report = {
    ok: false,
    checkedAt: new Date().toISOString(),
    expectedSha,
    expectedRunId: expectedRunId || null,
    baseUrl: baseUrl.href,
    canonicalUrl: canonicalUrl.href,
    attempts: maxAttempts,
    error: latestError?.stack || String(latestError || 'Unknown verification failure')
  };
}

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Live deployment report written to ${reportPath}.`);

if (!report.ok) {
  throw latestError || new Error('Founder OS live deployment verification failed.');
}
