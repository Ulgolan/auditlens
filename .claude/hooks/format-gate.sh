#!/usr/bin/env bash
# PreToolUse gate: refuses `git commit` while `prettier --check` is red.
#
# Fires on every Bash tool call. Only commands containing `git commit` are
# inspected; everything else passes through untouched (exit 0). Runs the
# repo's local prettier binary directly (never npx, never network) and
# never rewrites a file — it only checks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

REPO_GATE_ROOT="$REPO_ROOT" node -e '
const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const repoRoot = process.env.REPO_GATE_ROOT;

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const command = input && input.tool_input && input.tool_input.command;
  if (typeof command !== "string" || !command.includes("git commit")) {
    process.exit(0);
  }

  const prettierBin = path.join(repoRoot, "node_modules", ".bin", "prettier");
  if (!existsSync(prettierBin)) {
    process.exit(0);
  }

  const result = spawnSync(prettierBin, ["--check", "."], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.error || result.status === 0) {
    process.exit(0);
  }

  process.stderr.write(
    "format check red — run `./node_modules/.bin/prettier --write .`, then commit\n"
  );
  process.exit(2);
});
'
