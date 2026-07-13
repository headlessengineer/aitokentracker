# Typography

## Three Families, Each One Job

| Family | Role | Notes |
|---|---|---|
| **Bitcount Grid Double** | Wordmark only | Always uppercase. Illegible small — never UI text. Plain Inter fallback for tiny contexts. |
| **JetBrains Mono** | Code only | So listings/diffs column-align. |
| **Inter** | Everything else | Display, headings, body, labels, UI. |

## Heading Hierarchy

Headings are uppercase, wide tracking (+0.1em), tight line-height (1). Choose
heading elements by document semantics, not size.

| Element | Size | Weight | Uppercase | Letter Spacing |
|---|---|---|---|---|
| display | 48px / clamp | 700 | — | -0.02em |
| h1 | 32px | 900 | yes | 0.1em |
| h2 | 24px | 700 | yes | 0.1em |
| h3 | 24px | 700 | — | 0.1em |
| h4 | 16px | 700 | — | 0.1em |
| h5 | 16px | 700 | yes | 0.1em |
| h6 | 12px | 700 | yes | 0.1em |

## Body & UI

| Role | Size | Weight | Line Height | Notes |
|---|---|---|---|---|
| body-lg | 18px | 400 | 1.6 | Intro/lead paragraphs |
| body-md | 16px | 400 | 1.6 | Default `<p>`; `max-width: 65ch` |
| body-sm | 14px | 400 | 1.5 | Secondary prose |
| label / eyebrow | 12px | 600 | 1 | +0.08em tracking |
| code | 14px | 400 | 1.7 | JetBrains Mono |

## Wordmark

- Font: Bitcount Grid Double
- Size: 28px (nav/header context)
- Weight: 400
- Letter spacing: +0.04em
- Transform: uppercase always
- Never set below 16px tall; use Inter uppercase as fallback at tiny sizes
