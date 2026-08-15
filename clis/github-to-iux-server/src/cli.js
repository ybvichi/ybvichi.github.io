// CLI orchestration: argument parsing, fetch, analyze, render.
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import {
  DEFAULT_REPO,
  getLatestRelease,
  getReleaseByTag,
  findMetadataAsset,
  downloadMetadata,
  normalizeRepoInput,
} from "./github.js";
import { analyzeRelease, compareVersions } from "./analyze.js";
import { renderAnalysis } from "./format.js";

const require = createRequire(import.meta.url);
let PKG_VERSION = "0.0.0";
try {
  PKG_VERSION = require("../package.json").version;
} catch {
  /* package.json not resolvable when bundled; ignore */
}

const HELP = `@iux/gtis — analyze GitHub Releases metadata.json

Usage:
  npx @iux/gtis [options] [repo-or-url]

Analyzes the latest release of a GitHub repo (default: ${DEFAULT_REPO}),
downloads its metadata.json asset, and reports version, channel, platform
artifacts, checksums, and download stats.

Options:
  --repo <owner/repo>    Repository to analyze (default: ${DEFAULT_REPO})
  --tag <tag>            Analyze a specific release tag instead of the latest
  --api <base-url>       GitHub API base URL (default: https://api.github.com)
  --json                 Print the full analysis as JSON (machine-readable)
  --raw                  Print the raw metadata.json and exit
  --out <file>           Also write metadata.json to a file
  --check <version>      Compare a local version against the latest metadata
                         version. Exit 0 = up to date, 2 = outdated.
  --no-color             Disable ANSI colors
  -h, --help             Show this help
  -v, --version          Show package version

Positional:
  A "owner/repo" pair or a full GitHub releases URL is accepted as a shortcut
  for --repo. A releases URL that includes /tag/<tag> also selects --tag.

Exit codes:
  0  success (or up-to-date with --check)
  1  error (network, not found, bad JSON)
  2  outdated (only with --check)
  3  usage error

Environment:
  GITHUB_TOKEN / GH_TOKEN  Optional GitHub token (higher API rate limits).
  NO_COLOR                 Disables color output.
`;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = {
    repo: undefined,
    color: Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new UsageError(`Option "${arg}" requires a value.`);
      i += 1;
      return v;
    };
    switch (arg) {
      case "--repo":
        opts.repo = next();
        break;
      case "--tag":
        opts.tag = next();
        break;
      case "--api":
        opts.api = next();
        break;
      case "--json":
        opts.json = true;
        break;
      case "--raw":
        opts.raw = true;
        break;
      case "--out":
        opts.out = next();
        break;
      case "--check":
        opts.check = next();
        break;
      case "--no-color":
        opts.color = false;
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "-v":
      case "--version":
        opts.version = true;
        break;
      default:
        if (arg.startsWith("-")) throw new UsageError(`Unknown option "${arg}".`);
        if (opts.repo === undefined) opts.repo = arg;
        else throw new UsageError(`Unexpected argument "${arg}".`);
    }
  }
  return opts;
}

export async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`gtis: ${err.message}`);
    console.error("Run with --help for usage.");
    return 3;
  }

  if (opts.help) {
    console.log(HELP);
    return 0;
  }
  if (opts.version) {
    console.log(PKG_VERSION);
    return 0;
  }

  try {
    const { owner, repo, tag: urlTag } = normalizeRepoInput(opts.repo);
    const tag = opts.tag ?? urlTag;

    const release = tag
      ? await getReleaseByTag({ owner, repo, tag, apiBase: opts.api })
      : await getLatestRelease({ owner, repo, apiBase: opts.api });

    const asset = findMetadataAsset(release);
    if (!asset) {
      throw new Error(`No metadata.json asset in release "${release.tag_name}" of ${owner}/${repo}.`);
    }

    const metadata = await downloadMetadata(asset, { apiBase: opts.api });

    if (opts.out) {
      await writeFile(opts.out, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
    }

    if (opts.raw) {
      console.log(JSON.stringify(metadata, null, 2));
    } else {
      const analysis = analyzeRelease({ release, metadata });
      if (opts.json) {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log(renderAnalysis(analysis, { color: opts.color }));
      }
    }

    if (opts.check !== undefined) {
      const analysis = analyzeRelease({ release, metadata });
      const cmp = compareVersions(opts.check, analysis.metaVersion);
      if (cmp < 0) {
        console.error(`Outdated: local ${opts.check} < latest ${analysis.metaVersion}`);
        return 2;
      }
      console.log(`Up to date: local ${opts.check} == latest ${analysis.metaVersion}`);
    }
    return 0;
  } catch (err) {
    console.error(`gtis: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}
