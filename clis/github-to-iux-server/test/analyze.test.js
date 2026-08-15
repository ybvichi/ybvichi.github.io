// Offline unit tests for @iux/gtis core logic (no network required).
import { test } from "node:test";
import assert from "node:assert/strict";

import { analyzeRelease, parseVersion, compareVersions } from "../src/analyze.js";
import { renderAnalysis, humanizeBytes } from "../src/format.js";
import { normalizeRepoInput, findMetadataAsset } from "../src/github.js";

const RELEASE = {
  tag_name: "v0.16.3",
  name: "Hi Design 0.16.3",
  html_url: "https://github.com/ybvichi/open-design/releases/tag/v0.16.3",
  published_at: "2026-08-15T09:58:12Z",
  prerelease: false,
  draft: false,
  author: { login: "github-actions[bot]" },
  assets: [
    {
      name: "metadata.json",
      browser_download_url: "https://github.com/ybvichi/open-design/releases/download/v0.16.3/metadata.json",
      size: 693,
      download_count: 1,
      digest: "sha256:c6d81806cbb506c7eeb22d1e387270f9884c4f522393279499d7aee24b7f909e",
    },
    {
      name: "Hi.Design-0.16.3-win-x64-setup.exe",
      browser_download_url: "https://github.com/ybvichi/open-design/releases/download/v0.16.3/Hi.Design-0.16.3-win-x64-setup.exe",
      size: 316_898_397,
      download_count: 13,
    },
  ],
};

const METADATA = {
  channel: "stable",
  stableVersion: "0.16.3",
  releaseDate: "2026-08-15T09:57:54Z",
  platforms: {
    win: {
      enabled: true,
      arch: "x64",
      artifacts: {
        installer: {
          url: "https://github.com/ybvichi/open-design/releases/download/v0.16.3/Hi.Design-0.16.3-win-x64-setup.exe",
          sha256: "a4c5347df4f5d427f7d5cac2ab4d4f42b561681bed628c6fa9d8e6b4d867c51f",
        },
      },
    },
  },
};

test("normalizeRepoInput handles owner/repo, URL, and tag URL", () => {
  assert.deepEqual(normalizeRepoInput("ybvichi/open-design"), { owner: "ybvichi", repo: "open-design", tag: undefined });
  assert.deepEqual(normalizeRepoInput("https://github.com/ybvichi/open-design/releases"), {
    owner: "ybvichi",
    repo: "open-design",
    tag: undefined,
  });
  assert.deepEqual(normalizeRepoInput("https://github.com/ybvichi/open-design/releases/tag/v0.16.2"), {
    owner: "ybvichi",
    repo: "open-design",
    tag: "v0.16.2",
  });
  assert.throws(() => normalizeRepoInput("not-a-repo"));
});

test("findMetadataAsset locates metadata.json", () => {
  const asset = findMetadataAsset(RELEASE);
  assert.ok(asset);
  assert.equal(asset.name, "metadata.json");
  assert.equal(findMetadataAsset({ assets: [{ name: "a.zip" }] }), null);
});

test("analyzeRelease cross-checks tag vs metadata and correlates assets", () => {
  const a = analyzeRelease({ release: RELEASE, metadata: METADATA });
  assert.equal(a.tag, "v0.16.3");
  assert.equal(a.metaVersion, "0.16.3");
  assert.equal(a.versionMatch, true);
  assert.equal(a.channel, "stable");
  assert.equal(a.totalDownloadCount, 14);
  assert.equal(a.platformRows.length, 1);
  const win = a.platformRows[0];
  assert.equal(win.platform, "win");
  assert.equal(win.arch, "x64");
  assert.equal(win.artifacts[0].kind, "installer");
  assert.equal(win.artifacts[0].name, "Hi.Design-0.16.3-win-x64-setup.exe");
  assert.equal(win.artifacts[0].sizeBytes, 316_898_397);
  assert.equal(win.artifacts[0].downloadCount, 13);
  assert.ok(a.ageDays != null);
});

test("analyzeRelease flags a tag/metadata mismatch", () => {
  const a = analyzeRelease({
    release: RELEASE,
    metadata: { ...METADATA, stableVersion: "9.9.9" },
  });
  assert.equal(a.versionMatch, false);
});

test("parseVersion + compareVersions", () => {
  assert.deepEqual(parseVersion("v0.16.3"), { major: 0, minor: 16, patch: 3, prerelease: "", raw: "v0.16.3" });
  assert.equal(parseVersion("0.16.3-beta.1").prerelease, "beta.1");
  assert.equal(compareVersions("0.16.2", "0.16.3"), -1);
  assert.equal(compareVersions("0.16.3", "0.16.3"), 0);
  assert.equal(compareVersions("0.17.0", "0.16.3"), 1);
  assert.equal(compareVersions("1.0.0", "1.0.0-beta.1"), 1); // stable beats prerelease
  assert.equal(compareVersions("1.0.0-beta.2", "1.0.0-beta.1"), 1);
});

test("renderAnalysis produces a readable report (no color)", () => {
  const a = analyzeRelease({ release: RELEASE, metadata: METADATA });
  const text = renderAnalysis(a, { color: false });
  assert.match(text, /Hi Design 0\.16\.3/);
  assert.match(text, /✓ matches tag/);
  assert.match(text, /setup\.exe/);
  assert.match(text, /sha256/);
});

test("humanizeBytes", () => {
  assert.equal(humanizeBytes(0), "0 B");
  assert.equal(humanizeBytes(1024), "1.0 KB");
  assert.equal(humanizeBytes(316_898_397), "302.2 MB");
  assert.equal(humanizeBytes(null), "—");
});
