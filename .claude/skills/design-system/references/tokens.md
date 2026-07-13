# Design Tokens

## Machine-Readable Token Block (DESIGN.md v2 schema)

```yaml
version: alpha
name: headlessengineer
colors:
  # Tier 1 Primitives — neutral ramp (fixed base, never changes)
  white: "#ffffff"
  n-50: "#fafafa"
  n-100: "#f2f2f2"
  n-200: "#e0e0e0"
  n-300: "#b3b3b3"
  n-500: "#808080"
  n-600: "#4d4d4d"
  n-700: "#2e2e2e"
  n-800: "#1f1f1f"
  n-900: "#141414"
  n-950: "#0a0a0a"
  black: "#000000"

  # Tier 1 Primitive — brand accent (fixed; used on our own properties)
  accent-brand: "#009999"

  # Tier 2 Semantics — accent SLOT
  # Defaults to brand accent. On client work, remap `primary` to the
  # customer's color; the neutral ramp never changes.
  primary: "{colors.accent-brand}"
  on-primary: "{colors.white}"   # label on accent fill; 3.55:1 — known trade-off

  # Tier 2 Semantics — LIGHT (default)
  bg: "{colors.n-50}"
  surface: "{colors.n-50}"
  surface-card: "{colors.white}"
  elevated: "{colors.n-100}"
  border: "{colors.n-200}"
  fg: "{colors.n-950}"
  fg-secondary: "{colors.n-600}"
  fg-muted: "{colors.n-500}"

  # Tier 2 Semantics — DARK (overridden under body.dark-mode)
  dark-bg: "{colors.n-950}"
  dark-surface: "{colors.n-900}"
  dark-surface-card: "{colors.black}"
  dark-elevated: "{colors.n-800}"
  dark-border: "{colors.n-700}"
  dark-fg: "{colors.white}"
  dark-fg-secondary: "{colors.n-300}"
  dark-fg-muted: "{colors.n-500}"

typography:
  wordmark:
    fontFamily: "Bitcount Grid Double"
    fontSize: 28px
    fontWeight: 400
    letterSpacing: 0.04em
    textTransform: uppercase
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 900
    lineHeight: 1
    letterSpacing: 0.1em
    textTransform: uppercase
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
    textTransform: uppercase
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
  h4:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
  h5:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
    textTransform: uppercase
  h6:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
    textTransform: uppercase
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.08em
  code:
    fontFamily: "JetBrains Mono"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7

rounded:
  none: 0
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  none: 0
  "2xs": 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 40px
  "3xl": 48px
  "4xl": 64px
  "5xl": 80px

motion:
  duration-instant: 0ms
  duration-fast: 150ms
  duration-base: 200ms
  duration-slow: 300ms
  duration-slower: 400ms
  ease-out: ease-out
  ease-in-out: ease-in-out
  ease-spring: "cubic-bezier(0.16, 1, 0.3, 1)"

zindex:
  base: 0
  raised: 10
  overlay: 50
  drawer: 100
  modal: 200
  toast: 300

opacity:
  dim: 0.3
  muted: 0.6
  subtle: 0.8
  full: 1

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-primary-hover:
    opacity: 0.88
  button-primary-active:
    opacity: 0.76
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-ghost-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
  link:
    textColor: "inherit"
    textTransform: uppercase
    textDecoration: none
  link-prose:
    textColor: "{colors.primary}"
    textDecoration: none
    textTransform: none
    opacityHover: "{opacity.subtle}"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: 24px
    hoverBoxShadow: "0 4px 24px rgba(0,153,153,0.18)"
    hoverTransform: "translateY(-2px)"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  badge-accent:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  badge-neutral:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg-secondary}"
    rounded: "{rounded.sm}"
  nav:
    height: 64px
    backgroundColor: "{colors.bg}"
    itemColor: "{colors.fg-secondary}"
    itemActiveColor: "{colors.primary}"
```

---

## Semantic Mapping — Light / Dark

| Semantic | Light | Dark |
|---|---|---|
| `bg` | `#fafafa` | `#0a0a0a` |
| `surface` | `#fafafa` | `#141414` |
| `surface-card` | `#ffffff` | `#000000` |
| `elevated` | `#f2f2f2` | `#1f1f1f` |
| `border` | `#e0e0e0` | `#2e2e2e` |
| `fg` | `#0a0a0a` | `#ffffff` |
| `fg-secondary` | `#4d4d4d` | `#b3b3b3` |
| `fg-muted` | `#808080` | `#808080` |
| `primary` | `#009999` | `#009999` |
| `on-primary` | `#ffffff` | `#ffffff` |
