#!/usr/bin/env bash
# PreToolUse hook for Write|Edit. Reads JSON on stdin.
# Blocks (exit 2) writes to sensitive paths and source code when no approved spec exists.
set -euo pipefail
input="$(cat)"
# extract target file path from tool input (best-effort; supports common shapes)
fp="$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
[ -z "$fp" ] && exit 0

# 1) never allow writing secrets
case "$fp" in
  *.env|*.env.*|*/secrets/*|*/.git/*)
    echo "Blocked: writing to sensitive path ($fp) is not allowed." >&2
    exit 2;;
esac

# 2) docs and config are always allowed
case "$fp" in
  *docs/*|*.claude/*|*.md|*.json|*.config.*|*README*) exit 0;;
esac

# 3) source code requires at least one approved spec in docs/
if printf '%s' "$fp" | grep -Eq '\.(ts|tsx|js|jsx|css)$'; then
  if ! grep -rql 'status:[[:space:]]*approved' docs/ 2>/dev/null; then
    echo "Blocked (Spec-Driven Development): no spec with 'status: approved' found in docs/. Author and approve a spec before writing source code." >&2
    exit 2
  fi
fi
exit 0
