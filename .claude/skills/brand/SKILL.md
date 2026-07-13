---
name: brand
description: headlessengineer brand identity — name rules, vision, positioning, personality, voice/tone, logo, color philosophy, client/white-label stance. Use when writing copy, reviewing content for brand compliance, or designing any brand-facing asset.
argument-hint: "[voice|logo|color|applications]"
metadata:
  author: headlessengineer
  version: "1.0.0"
---

# headlessengineer — Brand

The "why" behind every visual and copy decision. For token values and component
specs, see the `design-system` skill — this skill is the brand argument; that one
is the implementation.

## When to Use

- Writing or reviewing any copy (headings, CTAs, error messages, meta descriptions)
- Checking logo usage, two-tone rules, or the Swap signature
- Applying or verifying the color philosophy (one accent, neutral-first)
- Adapting brand for a client / white-label context
- Designing any cross-media asset (slides, OG images, email, proposals)

---

## The Name

**headlessengineer** — one word. A headless system is a capable backend that
attaches to *any* front end. We apply that to engineering talent: a constant core
of rigor that adopts any technology, any stack, any domain.

- Running text: always **lowercase** (`headlessengineer`)
- Logo / wordmark: always **UPPERCASE** (`HEADLESSENGINEER`)
- Never two words, never camelCase, never abbreviated

---

## Vision & Mission

**Vision:** tech solutions for business problems.

**Mission:** translate real business needs into working software — choosing and
adopting whatever technology fits the problem, rather than forcing every problem
into one stack.

Lead with the **outcome** (the business problem solved), not the mechanism (the
framework used).

---

## Positioning

For founders, product owners, and engineering leaders who have a business problem
and want it solved well — headlessengineer is the adaptable engineering partner
that brings senior rigor to any stack, instead of a fixed toolset or a lecture on
frameworks.

| We are | We are not |
|---|---|
| Adaptable | Dogmatic about tools |
| Pragmatic | Hype-driven |
| Business-literate | Jargon-first |
| Senior / calm | Junior |
| Precise | Clever for its own sake |

---

## Brand Personality

- **Adaptable** — we fit the problem, not the other way around.
- **Pragmatic** — we optimise for outcomes shipped, not novelty.
- **Business-literate** — we speak ROI and timelines, not just tech.
- **Senior** — calm, experienced, "we've shipped this before."
- **Precise** — engineering discipline shows in everything, including the design.

Default rule when nothing else applies: **clarity first, outcomes first, never hype.**

---

## Voice & Tone

We sound like a senior engineer explaining clearly to a smart non-specialist.

**Rules:**
- Active voice, plain verbs, sentence case.
- Lead with the outcome, then the mechanism if needed.
- Name things by what the user controls, not by how the system is built.
- No hype, no filler. Specific beats clever. Cut adjectives that don't earn their place.
- Errors and empty states explain what happened and what to do next — without
  apologising or blaming.

**Sounds like us:**
> "We'll get your billing system live in six weeks."
> "Pick the stack that fits — we'll run it."
> "Deploy failed in us-west. Re-run the pipeline or roll back."

**Doesn't sound like us:**
> "Revolutionary, cutting-edge, next-gen synergy."
> "Leveraging best-in-class paradigms."
> "Oops! Something went wrong 😬."

---

## The Core Idea, Made Visual

The brand's central metaphor — *a constant core that adopts any context* — is
built into the visual system:

- **The neutral foundation never changes.** Black, white, and a fixed grey ramp
  carry all structure and text. This is engineering rigor: constant, disciplined.
- **One accent adapts.** A single accent color is the only hue. On our own
  properties it's teal (`#009999`). On client work, the accent adopts the client's
  brand color while everything else stays identical. The body stays; the head swaps.

This is not decoration — it's the brand argument expressed as a design rule.

---

## Logo

See `references/logo-wordmark.md` for the full spec. Summary:

- Wordmark only: **HEADLESSENGINEER** in Bitcount Grid Double, uppercase always.
- Two-tone: **HEADLESS** in `fg`, **ENGINEER** in the accent slot.
- Signature "The Swap": on hover, ENGINEER performs a 150ms character swap — used
  **once** per page, disabled under `prefers-reduced-motion`.
- On client work: full wordmark goes **monochrome**; teal appears only in a
  "built by headlessengineer" credit, never recolored to the client's accent.

---

## Color Philosophy

One accent over a strict neutral ramp — disciplined and "headless."

- **Foundation (never changes):** pure black, white, and greys.
- **Accent (adapts):** one hue. Ours is teal `#009999`; client work adopts the
  client's color in the same slot.
- **Rationed:** the accent punctuates — primary actions, the logo, links, key
  figures, focus, active state, one emphasis badge. Never body text, large fills,
  never status.
- **Status without color:** success / warning / error shown with icon + shape +
  text — so the system survives a swapped accent and color-blind users alike.

Exact token values and contrast ratios live in `design-system` skill.

---

## Client / White-Label Stance

In our **own** marketing and product: brand is fully present — teal accent,
two-tone wordmark.

In a **client's** product: adopt their brand color in the accent slot, keep our
neutral foundation, render our wordmark monochrome. Our presence is a quiet
"built by" credit, not a takeover.

This restraint is itself on-brand: a headless system serves the front end.

---

## Quick Reference

| Element | Value |
|---|---|
| Name | `headlessengineer` (text) / `HEADLESSENGINEER` (logo) |
| Vision | tech solutions for business problems |
| Accent | `#009999` (ours) / client's color on client work |
| Foundation | black + white + neutral grey ramp (never changes) |
| Wordmark | HEADLESS (fg) + ENGINEER (accent), Bitcount Grid Double |
| Fonts | Bitcount Grid Double (wordmark) · Inter (all UI) · JetBrains Mono (code) |
| Voice | adaptable, pragmatic, senior, outcome-first, no hype |

---

## References

| Topic | File |
|---|---|
| Logo & wordmark rules | `references/logo-wordmark.md` |
| Imagery & cross-media applications | `references/applications.md` |
