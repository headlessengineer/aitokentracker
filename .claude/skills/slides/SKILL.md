---
name: slides
description: Create strategic HTML presentations for headlessengineer client work — layout patterns, copywriting formulas, slide strategies, and screenshot export.
argument-hint: "[topic] [slide-count]"
metadata:
  author: headlessengineer
  version: "1.0.0"
---

# Slides

Strategic HTML presentation design with data visualization.

## When to Use

- Marketing presentations and pitch decks
- Data-driven slides with Chart.js
- Strategic slide design with layout patterns
- Copywriting-optimized presentation content

## Subcommands

| Subcommand | Description | Reference |
|------------|-------------|-----------|
| `create` | Create strategic presentation slides | `references/create.md` |

## References (Knowledge Base)

| Topic | File |
|-------|------|
| **Slide Anatomy** | `references/slide-anatomy.md` — **read first** — zone model, header/body/footer, theme system, offcanvas CSS, scroll mode CSS, data attributes, keyboard shortcuts, token quick-reference |
| **HTML Template** | `references/html-template.md` — **read second** — base HTML with light/dark tokens, `presentation.js` integration, keyboard shortcuts |
| Layout Patterns | `references/layout-patterns.md` |
| Copywriting Formulas | `references/copywriting-formulas.md` |
| Slide Strategies | `references/slide-strategies.md` |

## Key Rules

- **No inline scripts.** All runtime lives in `presentation.js` (shared file, include once per deck).
- **No nav buttons.** Navigation is keyboard + click-to-advance + offcanvas menu.
- **Light/dark via CSS classes.** `:root` = light defaults; `body.dark-mode` = dark override. Match exact `globals.css` values.
- **`<body class="dark-mode">`** — decks default to dark in HTML; JS restores localStorage preference on load.
- **`data-slide-title` + `data-slide-section`** required on every `.slide` for the offcanvas navigator.

## Routing

1. Parse subcommand from `$ARGUMENTS` (first word)
2. Load corresponding `references/{subcommand}.md`
3. Execute with remaining arguments
