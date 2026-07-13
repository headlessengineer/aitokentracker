#!/usr/bin/env bash
# PreToolUse hook for Bash. Blocks destructive commands.
set -euo pipefail
input="$(cat)"
cmd="$(printf '%s' "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -n1)"
case "$cmd" in
  *"rm -rf /"*|*"rm -rf ~"*|*":(){"*|*"mkfs"*|*"git push --force"*|*"git push -f"*|*"curl "*"| sh"*|*"chmod -R 777"*)
    echo "Blocked: potentially destructive command refused by guard-bash hook." >&2
    exit 2;;
esac
exit 0
