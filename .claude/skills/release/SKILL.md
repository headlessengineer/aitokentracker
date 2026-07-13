---
name: release
description: SDLC ship stage - verify Definition of Done, update changelog, bump version, and prepare a release. Use when the user asks to release, ship, cut a version, or prepare a deploy.
---
# Release (ship stage)

Prepare a release once work is complete and approved.

## Procedure
1. Verify **Definition of Done** for everything in the release: specs satisfied,
   tests pass (`pnpm test` + `test:e2e`), `lint` + `typecheck` clean, a11y AAA,
   and each iteration documented in `docs/iterations/`.
2. Update `CHANGELOG.md` (Keep a Changelog format) from the iteration logs.
3. Bump version (semver) based on the changes (feat → minor, fix → patch,
   breaking → major).
4. Summarize the release: included stories/tasks, notable decisions (link ADRs),
   and any migration notes.
5. Prepare the deploy checklist; do not deploy or push without explicit approval.

## Boundaries
- No deploy/push without approval. No version bump if DoD is unmet - report gaps.
