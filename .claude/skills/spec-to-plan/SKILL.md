---
name: spec-to-plan
description: Decompose an APPROVED spec into a technical implementation plan with file-level design and a task breakdown. Use after a spec is approved and before coding, or when the user asks to plan, break down, or design an implementation.
---
# Spec → Implementation Plan

Translate an approved spec into a concrete, minimal technical plan. **No
production code** - design and task breakdown only.

## Preconditions
- The referenced spec exists in `docs/` and has `status: approved`. If it is not
  approved, stop and route back to `spec-authoring`.

## Procedure
1. Read the approved spec and restate the acceptance criteria you are planning to.
2. Produce a plan section in the spec (or a `docs/specs/SPEC-<id>-plan.md`) with:
   - **Module/file design** - which files, each with a single responsibility
     (SOLID-S) and the abstractions it depends on (SOLID-D).
   - **Component tree** (for UI) and **data flow**, with a Mermaid diagram.
   - **Public interfaces/types** - signatures only, no bodies.
   - **Test plan** - one entry per acceptance criterion mapped to a test.
   - **Task list** - ordered `docs/tasks/TASK-*` items, each small and shippable.
3. Apply KISS/YAGNI/Fit-for-Purpose: choose the simplest design that satisfies
   the spec; explicitly note rejected over-engineered options and why.
4. Flag risks, unknowns, and any new dependency (justify each dependency).
5. Ask for plan approval before implementation begins.

## Boundaries
- Do NOT implement. Do NOT install dependencies. Do NOT mark approved.
