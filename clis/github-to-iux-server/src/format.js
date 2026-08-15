// Human-readable rendering of the analysis. Optional ANSI colors.

const pad = (s, n) => String(s).padEnd(n);

export function humanizeBytes(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = Number(n);
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function paint(color, code, text) {
  return color ? `\u001b[${code}m${text}\u001b[0m` : text;
}

export function renderAnalysis(a, { color = false } = {}) {
  const bold = (s) => paint(color, 1, s);
  const dim = (s) => paint(color, 90, s);
  const cyan = (s) => paint(color, 36, s);
  const green = (s) => paint(color, 32, s);
  const red = (s) => paint(color, 31, s);
  const yellow = (s) => paint(color, 33, s);

  const lines = [];
  lines.push(bold(`${a.name || a.tag}  ·  ${a.channel ?? "?"}  ·  ${a.tag}`));
  lines.push(
    dim(
      `published ${a.publishedAt ?? "?"}${a.ageDays != null ? ` (${a.ageDays} day${a.ageDays === 1 ? "" : "s"} ago)` : ""}`
    )
  );
  lines.push("");

  const kv = (k, v) => `${pad(k, 18)} ${v}`;
  lines.push(kv("Latest tag", `${cyan(a.tag)}${a.prerelease ? yellow("  (prerelease)") : ""}${a.draft ? yellow("  (draft)") : ""}`));
  lines.push(kv("Metadata version", `${a.metaVersion}   ${a.versionMatch ? green("✓ matches tag") : red("✗ MISMATCH with tag")}`));
  lines.push(kv("Channel", a.channel ?? "?"));
  lines.push(kv("Repository", a.repository ?? "?"));
  lines.push(kv("Release URL", a.releaseUrl ?? "?"));
  lines.push(kv("Author", a.author ?? "?"));
  lines.push(kv("Total downloads", String(a.totalDownloadCount)));
  lines.push("");

  lines.push(bold("Platforms"));
  if (a.platformRows.length === 0) {
    lines.push("  (none declared in metadata.json)");
  }
  for (const row of a.platformRows) {
    const head = row.enabled ? `${row.platform}${row.arch ? ` · ${row.arch}` : ""}` : dim(`${row.platform} (disabled)`);
    lines.push(`  ${head}`);
    for (const art of row.artifacts) {
      const dl = art.downloadCount != null ? `${art.downloadCount} dl` : "—";
      lines.push(`    ${pad(art.kind, 10)} ${cyan(art.name)}  ${dim(humanizeBytes(art.sizeBytes))}  ${dim(dl)}`);
      if (art.sha256) lines.push(`      sha256 ${dim(art.sha256)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}
