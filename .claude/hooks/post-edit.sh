#!/usr/bin/env bash
# PostToolUse hook for Write|Edit. Formats and type-checks. Non-blocking (informational).
set -uo pipefail
input="$(cat)"
fp="$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
case "$fp" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.json|*.md)
    command -v pnpm >/dev/null 2>&1 && pnpm exec prettier --write "$fp" >/dev/null 2>&1 || true
    case "$fp" in *.ts|*.tsx) command -v pnpm >/dev/null 2>&1 && pnpm typecheck >/dev/null 2>&1 || echo "Note: typecheck reported issues — review before done." >&2;; esac
    ;;
esac
exit 0
