// GitHub Releases API helpers. Zero runtime dependencies (uses global fetch, Node >= 18).

export const DEFAULT_API = "https://api.github.com";
export const DEFAULT_REPO = "ybvichi/open-design";

/**
 * Parse a repo input into `{ owner, repo, tag? }`.
 * Accepts "owner/repo", a bare GitHub URL, or a full releases URL
 * (optionally pointing at a specific tag: .../releases/tag/v1.2.3).
 */
export function normalizeRepoInput(input = DEFAULT_REPO) {
  let raw = String(input).trim();
  if (!raw) raw = DEFAULT_REPO;

  // https://github.com/<owner>/<repo>/releases/tag/<tag>  |  /releases  |  bare
  const urlMatch = raw.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/(?:releases(?:\/tag\/([^/?#]+))?|$))?/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/, ""),
      tag: urlMatch[3] || undefined,
    };
  }

  const parts = raw.split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
      tag: undefined,
    };
  }

  throw new Error(`Invalid repository "${input}". Expected "owner/repo" or a GitHub releases URL.`);
}

function requestHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "@iux/gtis",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghFetch(url) {
  let res;
  try {
    res = await fetch(url, { headers: requestHeaders(), redirect: "follow" });
  } catch (err) {
    throw new Error(`Network error while contacting GitHub: ${err.message}`);
  }
  if (!res.ok) {
    let message = `GitHub API ${res.status} ${res.statusText}`;
    const body = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(body);
      if (parsed.message) message = `${message}: ${parsed.message}`;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * Fetch the latest (non-draft, non-prerelease) release of a repo.
 */
export async function getLatestRelease({ owner, repo, apiBase = DEFAULT_API }) {
  const url = `${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`;
  return ghFetch(url);
}

/**
 * Fetch a release by its tag (e.g. "v0.16.3").
 */
export async function getReleaseByTag({ owner, repo, tag, apiBase = DEFAULT_API }) {
  const url = `${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/tags/${encodeURIComponent(tag)}`;
  return ghFetch(url);
}

/**
 * Locate the `metadata.json` asset inside a GitHub release object.
 * Returns the asset object or null.
 */
export function findMetadataAsset(release) {
  if (!release || !Array.isArray(release.assets)) return null;
  return release.assets.find((a) => String(a.name).toLowerCase() === "metadata.json") ?? null;
}

/**
 * Download and parse a release asset's body as JSON.
 * Tries the asset's public download URL first; falls back to the GitHub API
 * asset endpoint (api.github.com), which is often reachable when the github.com
 * redirect target is not.
 */
export async function downloadMetadata(asset, { apiBase = DEFAULT_API } = {}) {
  if (!asset) throw new Error("No release asset provided.");

  const attempts = [];
  if (asset.browser_download_url) {
    attempts.push({
      url: asset.browser_download_url,
      accept: "application/json, application/octet-stream;q=0.9",
    });
  }
  if (asset.url) {
    attempts.push({
      url: asset.url, // API asset endpoint, e.g. {apiBase}/repos/{owner}/{repo}/releases/assets/{id}
      accept: "application/octet-stream",
    });
  }
  if (attempts.length === 0) throw new Error("Release asset has no download URL.");

  let lastError = null;
  for (const { url, accept } of attempts) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "@iux/gtis", Accept: accept },
        redirect: "follow",
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
        continue;
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`metadata.json is not valid JSON (asset "${asset.name ?? "?"}").`);
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Failed to download metadata.json${lastError ? `: ${lastError.message}` : ""}.`);
}
