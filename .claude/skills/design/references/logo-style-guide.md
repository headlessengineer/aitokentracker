# Logo Style Guide

Reference for designing logos — primarily for client work. headlessengineer's own
wordmark is defined in `.claude/skills/brand/references/logo-wordmark.md` and
must not be redesigned.

## Logo Types

### Wordmark (Logotype)
Text-only logo using custom or distinctive typography.
- **Best for:** distinctive brand names; when the name is the asset
- **headlessengineer's approach:** our wordmark is this type — HEADLESSENGINEER in Bitcount Grid Double
- **Note:** font selection is everything; the letterforms must be ownable

### Lettermark (Monogram)
Initials or abbreviated letters, typically 2–3 characters.
- **Best for:** long company names, professional services
- **Design:** bold geometric sans or custom letterforms; high legibility at small sizes

### Pictorial Mark
Standalone icon or symbol; no text.
- **Best for:** global brands with established recognition
- **Caution:** requires significant brand equity to work without a name

### Abstract Mark
Non-representational geometric shape.
- **Best for:** tech companies, brands that want differentiation without literal iconography
- **Design:** unique shape that holds meaning through repetition, not illustration

### Combination Mark
Symbol + wordmark in a lockup.
- **Best for:** new brands that need both recognition and flexibility
- **Most versatile:** components can be separated as the brand matures

### Emblem
Symbol enclosed within a shape (badge, seal, crest).
- **Best for:** traditional brands, institutions, heritage positioning
- **Caution:** scalability challenges below ~40px

---

## Aesthetic Styles

| Style | Characteristics | Best For |
|---|---|---|
| **Minimalist** | Essential elements only; generous negative space; 1–2 weights | Tech, consulting, professional services |
| **Wordmark / Typographic** | Custom or distinctive letterforms; tracking and weight as the design | Any brand where the name is memorable |
| **Geometric** | Mathematical precision; circles, squares, triangles; symmetry | Architecture, engineering, finance, tech |
| **Line Art** | Single-weight strokes; outlined marks; no fills | Professional services, modern brands |
| **Luxury / Editorial** | Thin strokes or elegant serifs; refined spacing; restrained | Premium services, finance, law |
| **Vintage / Badge** | Heritage feel; enclosed forms; distressed-optional | Craft, food & beverage, artisan brands |
| **Organic / Hand-drawn** | Flowing imperfect lines; approachable feel | Wellness, eco, artisan, education |
| **Bold / Impact** | Heavy weights, condensed forms, high contrast | Sports, entertainment, launches |

---

## Style Selection by Context

| Client Type | Primary Style | Notes |
|---|---|---|
| Tech startup | Minimalist, Geometric | Avoid literal iconography; stay abstract |
| Consulting firm | Wordmark, Line Art | Name-forward; professional weight |
| Law / finance | Wordmark, Luxury | Understated; serif or refined sans |
| Healthcare | Line Art, Combination | Trustworthy; never aggressive colors |
| Craft / artisan | Vintage Badge, Organic | Texture and heritage signal |
| Creative agency | Abstract, Bold | Permission for more expressive treatment |

---

## Scalability Checklist

- [ ] Recognizable at 16×16px (favicon / app icon context)
- [ ] Clear at business card size (~30mm wide)
- [ ] Works in single color (the neutral `fg` of the target system)
- [ ] Readable in both light and dark contexts
- [ ] No fine details that disappear below 20px
- [ ] A stacked variant exists if horizontal is the primary lock-up

---

## Color for Client Logos

Client logos may use the client's own color system — they are not subject to
headlessengineer's single-accent constraint. However, when headlessengineer
implements or uses a client's logo within our system:

- In the client's own product: use the client's colors as designed
- In our marketing / case studies: reproduce faithfully or use the monochrome version
- In our own UI with the client's accent active: the logo renders as-designed;
  our wordmark goes monochrome

See `references/client-accent-selection.md` for how to choose a client's
accent when building a headlessengineer-powered product for them.
