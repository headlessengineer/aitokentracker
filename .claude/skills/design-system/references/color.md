# Color

## Neutral Ramp (Fixed — Tier 1)

`#ffffff` · `#fafafa` · `#f2f2f2` · `#e0e0e0` · `#b3b3b3` · `#808080` ·
`#4d4d4d` · `#2e2e2e` · `#1f1f1f` · `#141414` · `#0a0a0a` · `#000000`

Pick the nearest step; never introduce intermediate greys.

## Accent Slot

| Token | Default | Use |
|---|---|---|
| `primary` | `#009999` | The active accent — fills, icons, large bold text |
| `on-primary` | `#ffffff` | Label on an accent fill |
| `accent-brand` | `#009999` | Our fixed brand accent (logo, our own properties only) |

**Where accent may appear:** logo, one primary action per view, links, key
figures/metrics, focus rings, active nav item, at most one emphasis badge.

**Where accent must NOT appear:** body text, large fills, decorative areas, status.
The accent is fill/icon/large-bold only — never small body text.

## Accessibility (Verified, sRGB)

| Pair | Light | Dark |
|---|---|---|
| `fg` on `bg` | 19.8:1 AAA | 19.8:1 AAA |
| `fg-secondary` on `bg` | 8.5:1 AAA | 9.4:1 AAA |
| `fg-muted` on `bg` | 4.0:1 large only | 5.0:1 AA |
| `primary` (#009999) on `bg` | 3.5:1 large only | 5.7:1 AA / large |
| `on-primary` (white) on accent fill | 3.55:1 ⚠ | 3.55:1 ⚠ |

Body text uses `fg`; secondary uses `fg-secondary` (both AAA). `fg-muted` is
large/non-critical captions only. Accent is large/bold/fill only.

### Known Trade-offs

**`on-primary` (button label):** Primary buttons use `color: var(--white)` (white
on #009999 = 3.55:1). Passes the 3:1 UI component criterion but not 4.5:1 AA for
text. Accepted: visual consistency across themes — `var(--bg)` in dark mode
resolves to near-black on teal, which was visually broken.

**Hero tagline rotator:** The rotating taglines use `var(--primary)` at 14px/400
JetBrains Mono. Does not qualify as WCAG large text (threshold: 18.67px bold or
24px normal). Ratios 3.5:1 (light) / 5.8:1 (dark) fail WCAG AA on light and AAA
on both themes. Accepted: tagline content is supplementary — h1 and description
convey the same positioning. This is the sole documented deviation from the AAA
text rule.

## Client Theming (Headless Color)

The neutral ramp and all neutral semantics are fixed — only the **accent slot**
(`primary`, `on-primary`) is remapped to the customer's brand color.

**Procedure for a client project:**
1. Set `primary` to the customer's brand color; leave every neutral untouched.
2. Set `on-primary` to black or white — whichever clears AA (≥ 4.5:1, large/bold
   button labels) against the new accent. Verify with the linter.
3. Re-check the accent's contrast on `bg` and surfaces. If the client color is
   too light for large text on white, use it for fills only and keep text neutral.
4. Apply the same rationing rules — the client color punctuates; it never becomes
   body text or large fills.

**Our logo in client contexts:** renders **monochrome** (`fg`) in-product, or in
`accent-brand` (#009999) only in an explicit "built by headlessengineer" credit —
never recolored to the client's accent.

## Code & Syntax Highlighting

Monochrome syntax — differentiated by weight, italic, and grey-ramp steps.

| Token type | Treatment |
|---|---|
| Keywords | **accent** (`primary`) — the only colored element |
| Functions / types | `fg`, weight 600 |
| Strings | `fg`, italic |
| Numbers / constants | `fg` |
| Punctuation / operators | `fg-secondary` |
| Comments | `fg-muted`, italic |
| Background | `elevated`; selection uses accent at `opacity-dim` |

In a client context the accent keyword color follows the client's accent. Always
retain enough weight/italic differentiation that the code reads fully desaturated.

## Data Visualization

| Series | Treatment |
|---|---|
| Primary / highlighted | Accent (`primary`) |
| Other series | Neutral ramp steps (#4d4d4d, #808080, #b3b3b3) + line style (solid/dashed/dotted) or fill pattern |

- Never color alone: every series carries a direct label or non-color encoding.
- Gridlines `border`; axis labels `fg-muted`; values `fg`.
- In client context: series adopt the client's palette, but non-color-encoding
  rule still holds for accessibility.

## Imagery

- **Grayscale** — neutral, default for photography.
- **Duotone** — black → white (high-contrast, editorial).
- **Tritone** — black + accent + white; accent as midtone (or client's accent).
- Real product screenshots exempt; frame on neutral surfaces.
