#!/usr/bin/env node
// @iux/gtis — CLI entry point.
// Usage: `npx @iux/gtis` — analyzes the latest GitHub release metadata.json.
import { main } from "../src/cli.js";

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(`gtis: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
);
