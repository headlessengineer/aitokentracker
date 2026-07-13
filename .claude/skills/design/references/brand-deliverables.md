# Brand Deliverables

Specifications for physical and digital brand assets — for headlessengineer's own
brand or when producing a deliverable set for a client.

All deliverables follow the headlessengineer system: neutral foundation + one accent
slot, Inter typography, no decorative borders. Client deliverables use the client's
accent in place of `#009999`; the neutral system is identical.

---

## Core Identity

### Wordmark / Logo Files
- SVG (primary — vector, scalable)
- PNG exports: 512×512, 1024×1024, transparent background
- Monochrome variants: `fg` (near-black) and `white` versions
- Two-tone variant: HEADLESS in `fg`, ENGINEER in `--primary`
- Minimum clear space: cap-height on all sides
- Never below 16px tall in Bitcount; use Inter uppercase below that

---

## Stationery

### Business Card
- Size: 85 × 55mm (standard) or 3.5 × 2in (US)
- Stock: 350gsm minimum; matte preferred (brand is precise, not flashy)
- Face: wordmark + name + role + contact; generous white space
- Back: optional — accent rule, wordmark only, or dark variant
- Color: near-black (`#0a0a0a`) or white stock; accent on one element
- Finish: matte; spot UV on wordmark optional

### Letterhead
- A4 / Letter; digital (RGB) and print (CMYK) versions
- Header: wordmark left-aligned; contact details right or below
- Footer: URL, minimal contact strip in `fg-secondary`
- Body area: 65ch max-width guidance for typed content
- No decorative borders; header/footer differentiated by spacing

### Envelope
- DL size (220 × 110mm) for standard letters
- Wordmark on flap or front-left; return address in `fg-secondary`
- Same stock/color as business card for consistency

### Email Signature
- HTML, max 600px wide, inline CSS only
- Structure: name (bold, `fg`) | role (`fg-secondary`) | accent rule (2px `--primary`) | contact + URL
- No images other than wordmark PNG (hosted); no background colors
- Dark/light compatible: avoid hardcoded background; let client render in their context

---

## Digital Assets

### Social Media Profile
- Profile picture: wordmark centered on `n-950` square, 800×800px minimum
- Fallback favicon: "HE" in Inter uppercase, or compact mark when defined
- Cover images: see `banner-design` skill

### OG / Share Image Template
- 1200×630px; dark theme (`n-950`)
- Article/page title in `display` weight Inter; section label in `fg-secondary`
- Wordmark bottom-right; accent rule or one accent element

### Favicon
- 32×32 and 16×16 PNG; `.ico` bundle
- Until a compact mark is defined: "HE" in Inter uppercase on `n-950`
- SVG favicon for modern browsers

---

## Office Environment

### Reception Signage
- Dimensional letters or backlit panel; wordmark only
- Materials: brushed metal or matte acrylic on neutral wall
- No color fill on dimensional letters; use natural metal tone or white

### Wayfinding
- Consistent with wordmark; directional arrows in `fg`; room labels in `fg-secondary`
- No decorative borders; panels differentiated by surface (lighter panel on neutral wall)

---

## Apparel

### Polo / T-shirt
- Embroidery preferred over print (more durable, premium)
- Placement: left chest for small wordmark; back center for larger
- Color: black or white garment; wordmark in contrasting neutral
- Accent: ENGINEER half in embroidery thread color closest to `#009999`

---

## Print / Events

### Roll-up Banner
- 850mm × 2000mm; design from bottom up (floor to eye level = key message)
- Safe area: top 200mm = wordmark; middle = headline + key message; bottom 400mm = often hidden
- 300 DPI; CMYK; 5mm bleed

### Trade Show Backdrop
- 8ft × 8ft or 3m × 3m; repeating wordmark pattern OR single large wordmark centered
- Neutral `n-900` or white background; one accent element
- UV-resistant print for outdoor; matte laminate for indoor

### Document / Proposal Template
- Light theme; Inter; generous margins (25mm+)
- Cover: large wordmark + project/client name + date
- Inside: section headers with accent rule; body at 65ch; code in JetBrains Mono
- Footer: page number + wordmark in `fg-muted`

---

## Print Color Reference

headlessengineer teal `#009999` in print-safe values:

| Mode | Value |
|---|---|
| Hex | `#009999` |
| RGB | `0, 153, 153` |
| CMYK (approximate) | `C:100 M:0 Y:0 K:40` |
| Pantone (nearest) | PMS 3145 C |

For client deliverables, replace with the client's Pantone/CMYK equivalent.
