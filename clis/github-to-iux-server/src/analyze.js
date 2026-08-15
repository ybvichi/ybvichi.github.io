// Analysis of a GitHub release + its metadata.json payload.

/**
 * Build a normalized analysis object from a GitHub release and parsed metadata.json.
 * Cross-checks the metadata against the release (tag vs stableVersion, artifact
 * URLs vs actual assets with download counts).
 */
export function analyzeRelease({ release, metadata }) {
  const tag = release?.tag_name ?? "?";
  const tagVersion = tag.replace(/^v/, "");
  const metaVersion = String(metadata?.stableVersion ?? "").replace(/^v/, "");

  const assetsByName = new Map((release?.assets ?? []).map((a) => [a.name, a]));

  const platformRows = [];
  for (const [platform, info] of Object.entries(metadata?.platforms ?? {})) {
    const artifacts = [];
    for (const [kind, art] of Object.entries(info?.artifacts ?? {})) {
      const url = typeof art === "string" ? art : art?.url;
      const name = url ? String(url).split("/").pop() : "";
      const asset = name ? assetsByName.get(name) : undefined;
      artifacts.push({
        kind,
        name: name || "(inline)",
        url: url ?? null,
        sha256: (typeof art === "object" && art?.sha256) || null,
        sizeBytes: asset?.size ?? null,
        downloadCount: asset?.download_count ?? null,
        digest: asset?.digest ?? null,
      });
    }
    platformRows.push({
      platform,
      enabled: info?.enabled !== false,
      arch: info?.arch ?? null,
      artifacts,
    });
  }

  const published = release?.published_at ? new Date(release.published_at) : null;
  const ageDays =
    published && !Number.isNaN(published.getTime())
      ? Math.max(0, Math.floor((Date.now() - published.getTime()) / 86_400_000))
      : null;

  return {
    repository: release?.html_url
      ? String(release.html_url)
          .split("/tag/")[0]
          .replace(/^https?:\/\/github\.com\//, "")
          .replace(/\/releases$/, "")
      : null,
    releaseUrl: release?.html_url ?? null,
    tag,
    tagVersion,
    name: release?.name ?? null,
    metaVersion,
    versionMatch: tagVersion === metaVersion,
    channel: metadata?.channel ?? null,
    publishedAt: release?.published_at ?? null,
    metaReleaseDate: metadata?.releaseDate ?? null,
    ageDays,
    prerelease: release?.prerelease ?? false,
    draft: release?.draft ?? false,
    author: release?.author?.login ?? null,
    platformRows,
    totalDownloadCount: (release?.assets ?? []).reduce((n, a) => n + (a.download_count || 0), 0),
  };
}

/** Parse "1.2.3" / "v1.2.3-beta.1" into { major, minor, patch, prerelease }. */
export function parseVersion(v) {
  const raw = String(v ?? "").trim().replace(/^v/, "");
  const m = raw.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z][0-9A-Za-z.-]*))?$/);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? "",
    raw: String(v).trim(),
  };
}

/**
 * Compare two version strings.
 * Returns -1 if a < b, 0 if equal, +1 if a > b.
 * Stable beats prerelease; prereleases compare lexicographically among themselves.
 */
export function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  for (const key of ["major", "minor", "patch"]) {
    if (va[key] !== vb[key]) return va[key] < vb[key] ? -1 : 1;
  }
  const pa = va.prerelease;
  const pb = vb.prerelease;
  if (pa === pb) return 0;
  if (!pa) return 1; // stable > prerelease
  if (!pb) return -1;
  return pa < pb ? -1 : 1;
}
