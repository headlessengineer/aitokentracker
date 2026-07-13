---
name: nextjs-feature
description: House style for building a Next.js App Router feature (routes, server vs client components, data fetching, route handlers, metadata). Use when adding pages, routes, layouts, or API handlers to the Next.js site.
---
# Next.js Feature (App Router)

Build a feature the headlessengineer way. Follows `.claude/rules/nextjs.md`.

## Procedure
1. Confirm an approved spec + plan exist for the feature.
2. Place files: `app/<route>/page.tsx`, plus `layout.tsx` / `loading.tsx` /
   `error.tsx` as needed; co-locate `components/` and tests.
3. Default to **Server Components**. Add `"use client"` only where interactivity
   or state genuinely requires it (KISS/YAGNI).
4. Fetch data in Server Components or Route Handlers (`app/api/<n>/route.ts`);
   validate inputs at the boundary; never leak secrets to the client.
5. Styling via design tokens only (see `component-build` and `.claude/rules/styling.md`).
6. Add Metadata API entries, `next/image`, `next/font` as appropriate.
7. Write tests first per `tdd-implement`. Verify a11y per `a11y-audit`.

## Boundaries
- One responsibility per component/file. No data libraries or state managers
  unless the spec requires them (justify any dependency).
