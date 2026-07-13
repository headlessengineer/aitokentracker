---
description: Testing conventions
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "e2e/**"
---
# Testing conventions
- Test-first: derive cases from the spec's acceptance criteria before implementing.
- Unit (Vitest + RTL) for logic/components; e2e (Playwright) for user flows.
- Test behavior, not implementation. One assertion theme per test.
- Cover happy path + each acceptance criterion + error/empty states.
- A feature is not done until tests pass and cover every acceptance criterion.
