#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# Only run in remote Claude Code on the web environments
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  # Install npm dependencies
  npm install
fi

# Remind about any OpenSpec change whose tasks are all complete but hasn't
# been archived yet — easy to forget once a PR merges in a separate session.
if [ -x node_modules/.bin/openspec ] || command -v npx >/dev/null 2>&1; then
  pending="$(npx --no-install openspec list --json 2>/dev/null | node -e '
    let data = "";
    process.stdin.on("data", chunk => { data += chunk; });
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        const done = (parsed.changes || []).filter(
          c => c.totalTasks > 0 && c.completedTasks === c.totalTasks
        );
        if (done.length) console.log(done.map(c => c.name).join(", "));
      } catch {}
    });
  ' 2>/dev/null || true)"
  if [ -n "$pending" ]; then
    echo "⚠ OpenSpec: fully-implemented but not yet archived: $pending"
    echo "  If the code has merged and been verified, run: openspec archive <name> --yes (or /opsx:archive)"
  fi
fi
