# Logo & Wordmark

## Spec

- **Wordmark only.** There is no separate symbol or mark. Bitcount Grid Double is
  distinctive enough to be the ownable asset.
- Set as one word: **HEADLESSENGINEER** — no space, always uppercase, tracked `+0.04em`.
- Two-tone (standard): **HEADLESS** in `fg`, **ENGINEER** in the accent slot.
  ENGINEER is the adaptive half — it carries the accent and animates in The Swap.
  Reading order puts the high-contrast word first; the eye finishes on the accent.

## Color by Context

| Context | HEADLESS | ENGINEER |
|---|---|---|
| Our own properties (light) | `fg` (near-black) | teal `#009999` |
| Our own properties (dark) | `fg` (white) | teal `#009999` |
| Inside a client's product | `fg` (monochrome) | `fg` (monochrome) |
| "Built by" credit | `fg` | `accent-brand` (#009999) — never the client's accent |

## The Swap Signature

On hover (logo, and optionally one hero moment), the ENGINEER half performs a
quick **150ms** character/token swap — a nod to swapping the "head."

- Use it **once per page** at most; never scatter it.
- The wordmark in the nav header is the canonical location.
- Disabled entirely under `prefers-reduced-motion`.

## Clear Space & Sizing

- Minimum clear space: cap-height on all sides.
- Minimum size: **16px tall**. Below that (or in tight inline contexts) fall back
  to the name set in **Inter uppercase** — never tiny Bitcount.

## Compact Icon (Deferred)

A dedicated square mark for favicons/app icons/avatars is **TBD**. Until defined,
avoid contexts that strictly require a square mark, or use an Inter "HE" placeholder.

## Don'ts

- Don't lowercase it
- Don't add a space between HEADLESS and ENGINEER
- Don't reverse the two-tone order (ENGINEER is always the accent half)
- Don't recolor ENGINEER to a client's accent inside their product
- Don't stretch, skew, or add effects
- Don't set below 16px in Bitcount
