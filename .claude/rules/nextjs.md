---
description: Next.js App Router conventions
paths:
  - "app/**"
  - "src/app/**"
  - "**/*.tsx"
---
# Next.js (App Router) conventions
- Server Components by default; add `"use client"` only when interaction/state needs it (KISS/YAGNI).
- Data fetching in Server Components or Route Handlers; never expose secrets to client.
- File structure: `app/<route>/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, co-located `components/`.
- Route Handlers in `app/api/<name>/route.ts`; validate input at the boundary.
- Metadata via the Metadata API. Images via `next/image`. Fonts via `next/font`.
- Keep components small and composable; one component = one responsibility.
