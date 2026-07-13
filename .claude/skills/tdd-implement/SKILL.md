---
name: tdd-implement
description: Implement an approved, planned feature test-first. Use when the user asks to build, implement, or code a feature that already has an approved spec and plan. Enforces red-green-refactor and the architecture principles.
---
# TDD Implementation

Implement against an approved spec + plan, test-first.

## Preconditions
- Approved spec (`status: approved`) and an approved plan exist. If not, stop and
  route to `spec-authoring` / `spec-to-plan`.

## Procedure (red → green → refactor)
1. Restate the acceptance criteria you are implementing this iteration.
2. **Red:** write failing tests derived directly from the acceptance criteria
   (unit with Vitest/RTL; e2e with Playwright for user flows). Run them; confirm
   they fail for the right reason.
3. **Green:** write the minimal code to pass - nothing the spec doesn't require
   (YAGNI). Keep each module single-responsibility (SOLID).
4. **Refactor:** improve names/structure with tests green. Remove duplication
   only once it actually repeats (KISS).
5. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` (and `test:e2e` if flows
   changed). All must pass.
6. Map each acceptance criterion to a passing test; if any is unmet, continue.
7. Keep diffs small and commit per logical unit (conventional commits) - but do
   not commit without the user's approval.
8. When the iteration is complete and approved, hand off to the `documentation`
   skill to record it.

## Boundaries
- Don't exceed the spec's scope. If you discover missing requirements, stop and
  update the spec via `spec-authoring` rather than inventing behavior.
- Never touch `.env*` or `secrets/`.
