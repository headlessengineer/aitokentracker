---
description: TypeScript & code conventions
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
# TypeScript conventions
- `strict` mode; no `any` (use `unknown` + narrowing). No non-null `!` without a comment.
- Prefer pure functions and explicit return types on exported functions.
- One responsibility per file/module (SOLID-S). Extract when a file does two jobs.
- Depend on interfaces/types, not concrete implementations (SOLID-D).
- No premature abstraction (YAGNI): inline until the third repetition, then extract.
- Errors: typed Result or thrown `Error` subclasses; never swallow.
- Naming: `camelCase` vars/functions, `PascalCase` types/components, `SCREAMING_SNAKE` consts.
