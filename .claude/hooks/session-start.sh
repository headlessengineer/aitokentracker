#!/usr/bin/env bash
# SessionStart hook. Injects a short reminder + current spec status.
echo "headlessengineer · Spec-Driven Development active."
echo "Workflow: spec(docs/) → approve → plan → test-first → implement → review → DOCUMENT iteration → ship."
approved=$(grep -rl 'status:[[:space:]]*approved' docs/ 2>/dev/null | wc -l | tr -d ' ')
drafts=$(grep -rl 'status:[[:space:]]*draft' docs/ 2>/dev/null | wc -l | tr -d ' ')
echo "Specs: ${approved} approved, ${drafts} draft. Code requires an approved spec. Document every approved iteration in docs/iterations/."
exit 0
