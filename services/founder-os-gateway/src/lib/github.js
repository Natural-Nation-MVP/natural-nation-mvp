const GITHUB_API = "https://api.github.com";

function repositoryConfig(env) {
  return {
    owner: env.GITHUB_OWNER,
    repository: env.GITHUB_REPOSITORY,
    branch: env.GITHUB_BRANCH || "main"
  };
}

async function githubRequest(env, path, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "founder-os-gateway",
      "x-github-api-version": "2022-11-28",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || `GitHub returned ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

export async function readRepositoryJson(env, path) {
  const { owner, repository, branch } = repositoryConfig(env);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await githubRequest(
    env,
    `/repos/${owner}/${repository}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`
  );

  if (data.type !== "file" || !data.content) {
    throw new Error(`Repository path is not a readable file: ${path}`);
  }

  const normalized = data.content.replace(/\n/g, "");
  const decoded = atob(normalized);
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  const text = new TextDecoder().decode(bytes);

  return {
    content: JSON.parse(text),
    sha: data.sha
  };
}

export async function repositoryFileExists(env, path) {
  try {
    await readRepositoryJson(env, path);
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    throw error;
  }
}

async function createBlob(env, content) {
  const { owner, repository } = repositoryConfig(env);
  return githubRequest(env, `/repos/${owner}/${repository}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content, encoding: "utf-8" })
  });
}

export async function commitFilesAtomically(env, { message, files }) {
  const { owner, repository, branch } = repositoryConfig(env);

  const ref = await githubRequest(
    env,
    `/repos/${owner}/${repository}/git/ref/heads/${encodeURIComponent(branch)}`
  );
  const parentSha = ref.object.sha;

  const parentCommit = await githubRequest(
    env,
    `/repos/${owner}/${repository}/git/commits/${parentSha}`
  );

  const treeEntries = [];
  for (const file of files) {
    const serialized = typeof file.content === "string"
      ? file.content
      : `${JSON.stringify(file.content, null, 2)}\n`;
    const blob = await createBlob(env, serialized);
    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha
    });
  }

  const tree = await githubRequest(env, `/repos/${owner}/${repository}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: parentCommit.tree.sha,
      tree: treeEntries
    })
  });

  const commit = await githubRequest(env, `/repos/${owner}/${repository}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [parentSha]
    })
  });

  await githubRequest(
    env,
    `/repos/${owner}/${repository}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false })
    }
  );

  return {
    commitSha: commit.sha,
    commitUrl: commit.html_url || `https://github.com/${owner}/${repository}/commit/${commit.sha}`,
    branch
  };
}
