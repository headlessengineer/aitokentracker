---
name: code-review
description: Review code against SOLID, KISS, YAGNI, Fit-for-Purpose, security, and the project conventions. Use after writing or modifying code, before committing, or when the user asks for a review. Reports issues; does not modify code.
---
# Code Review (principles + quality)

Review the current diff. **Report only - do not modify code.**

## Procedure
1. Run `git diff` (or review the named files); focus on changed lines.
2. Check against principles:
   - **SOLID** - single responsibility? depends on abstractions? interfaces small?
   - **KISS** - is this the simplest thing that works? any needless cleverness?
   - **YAGNI** - any speculative code, config, or abstraction not required by the
     spec? Flag it for removal.
   - **Fit-for-Purpose** - complexity matched to the problem? over/under-engineered?
3. Check correctness (edge cases, null/empty, async/races), security (input
   validation, no secret leakage, no injection), tests (cover each acceptance
   criterion?), and conventions (`.claude/rules/*`).
4. Confirm spec alignment: does the code do exactly what the approved spec says -
   no more, no less?

## Output (organized by priority)
- **Critical (must fix)** - correctness, security, spec violations, broken DoD.
- **Warnings (should fix)** - principle violations, missing tests, smells.
- **Suggestions (nice to have)** - clarity, naming, minor simplification.
Give file:line references and concrete fixes. Do not edit files.
