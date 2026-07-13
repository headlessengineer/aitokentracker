# Icon Design

SVG icons for the headlessengineer design system. Write icons inline — no external scripts needed.

## headlessengineer Icon Conventions

- **Color:** `currentColor` — inherits from CSS `color` property. Never hardcode a hex.
  Exception: the one emphasized accent icon uses `var(--primary)` explicitly.
- **Stroke width:** `stroke-width="1.5"` for all outlined styles (matches the brand's precision aesthetic).
- **ViewBox:** `0 0 24 24` (standard). Use `0 0 16 16` for compact/badge contexts.
- **Accessibility:** Always include `<title>` element; set `aria-hidden="true"` on decorative icons.
- **Sizing:** Design at 24px; test at 16px and 48px. Use `--size-icon-sm` (16px), `--size-icon-md` (20px), `--size-icon-lg` (32px).
- **Fills:** Outlined style has `fill="none"`; filled style has `fill="currentColor"` and no stroke.

## Preferred Styles for This Project

| Style | When to Use |
|---|---|
| **outlined** (stroke 1.5, no fill) | Default UI — nav, actions, form controls |
| **sharp** (stroke 1.5, crisp corners) | Enterprise / technical content, code panels |
| **filled** (no stroke, solid fill) | Mobile nav, active states, small sizes (≤16px) |
| **thin** (stroke 1) | Luxury / editorial contexts |
| **bold** (stroke 2.5) | Hero sections, large display icons |

Avoid: gradient, glassmorphism, pixel/retro styles — these introduce hues or effects that violate design invariants.

## SVG Template (Outlined)

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24" height="24" viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <title>Icon description</title>
  <!-- paths here -->
</svg>
```

## SVG Template (Filled)

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24" height="24" viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <title>Icon description</title>
  <!-- paths here -->
</svg>
```

## Icon in CSS Module

```css
.icon {
  width: var(--size-icon-md);  /* 20px */
  height: var(--size-icon-md);
  color: var(--fg-secondary);
  flex-shrink: 0;
}

/* Accent emphasis — use for one highlighted icon only */
.icon--accent {
  color: var(--primary);
}
```

## Categories & Common Icons

| Category | Common Icons |
|---|---|
| Navigation | arrow-right, chevron-down, home, menu, x (close) |
| Action | edit, trash, save, download, upload, copy, external-link |
| Communication | mail, chat, phone, bell |
| Media | play, pause, volume-2, camera |
| File | file-text, folder, archive, cloud |
| User | user, users, settings, lock |
| Data | bar-chart-2, trending-up, pie-chart, activity |
| Development | code, terminal, git-branch, zap |
| Social | heart, star, bookmark, share-2 |

Use [Lucide icons](https://lucide.dev/) as the reference set — they match the outlined 1.5-stroke aesthetic.

## Best Practices

- Minimal path nodes; no redundant anchors
- No embedded fonts or raster images in SVGs
- Use `stroke-linecap="round"` + `stroke-linejoin="round"` for all outlined styles
- Ensure the icon reads clearly in monochrome (it will, since `currentColor` is neutral)
- For duotone feel: use `opacity: var(--opacity-muted)` on a second layer in the same `currentColor` — never introduce a second hue
