---
name: refactor
description: Behavior-preserving refactor guarded by tests. Use when improving structure, removing duplication, or simplifying code without changing behavior. Never changes functionality.
---
# Refactor (safe, test-guarded)

Improve internal structure without changing observable behavior.

## Procedure
1. Ensure tests exist and pass first. If coverage is missing for the area, add
   characterization tests before refactoring.
2. Make one small structural change at a time; run tests after each.
3. Targets: extract single-responsibility units (SOLID), remove real duplication
   (not speculative), simplify (KISS), delete dead/speculative code (YAGNI).
4. Keep public interfaces stable unless the spec/plan changed.
5. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` - all green before done.

## Boundaries
- No behavior changes. No new features. If behavior must change, route to
  `spec-authoring` first.
