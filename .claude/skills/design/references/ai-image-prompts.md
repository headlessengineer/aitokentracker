# AI Image Prompt Engineering

Prompt patterns for generating brand-aligned imagery and design mockups using
AI image generation (Claude, Gemini, or similar). All output must honor the
headlessengineer visual system: monochrome or one-accent, no stray hues.

---

## Brand Photography Prompts

### Grayscale / Monochrome (Default)

```
Professional [subject] photograph, converted to grayscale, high contrast,
clean neutral background, soft directional lighting, no color tints,
sharp focus, editorial quality
```

### Duotone (Black → White Treatment)

```
[Subject] photograph treated with duotone effect,
deep black shadows, pure white highlights, no midtone color,
high contrast editorial style, no background clutter
```

### Tritone (Black + Teal + White)

```
[Subject] photograph with tritone color treatment:
shadows map to near-black (#0a0a0a), midtones map to teal (#009999),
highlights map to white (#ffffff). Photographic quality, sharp, editorial.
No other colors present.
```

---

## Mockup Photography Prompts

Use these for brand deliverable mockups (business cards, screens, etc.).

### Business Card on Surface

```
Professional business card mockup photograph, card on [marble surface / dark wood /
neutral grey fabric], soft overhead lighting, minimal shadows, premium matte paper texture,
angle: [flat lay overhead / 45-degree / straight-on], no other objects, clean background,
photorealistic product photography, sharp focus, no text visible (we overlay text separately)
```

### Screen / Device Mockup

```
Laptop / iPhone / iPad mockup, screen blank [or: displaying minimal UI],
[near-black / white] device color, on [neutral desk / clean white surface],
professional product photography, soft studio lighting, no harsh reflections,
high resolution, no other accessories
```

### Office Environment Signage

```
Modern office reception signage photograph, wall-mounted sign with [metal / matte acrylic]
finish on a neutral grey wall, clean architectural interior, professional photography,
ambient lighting, no text on sign (we overlay separately), sharp focus
```

---

## Logo / Mark Generation Prompts

When generating a logo or mark for a client (not for headlessengineer itself):

### Minimalist / Geometric Mark

```
Minimalist logo mark for [brand name], [industry]:
clean geometric shapes, single color on white background,
vector-illustration style, no gradients, no textures,
high negative space, scalable at any size,
professional quality, centered composition
```

### Wordmark

```
Wordmark logo for "[brand name]", [industry]:
custom sans-serif typography, clean tracking, single color (#[hex]) on white,
no icons or symbols, just the name as the logo,
vector style, print-ready quality
```

### Combination Mark

```
Combination logo for "[brand name]":
[abstract / geometric] symbol + wordmark lockup,
single color (#[hex]), clean lines, no gradients or textures,
white background, horizontal layout, professional quality
```

---

## Negative Prompts (Always Include for Clean Output)

```
no gradients, no multiple colors, no rainbow effects, no realistic photos,
no watermarks, no text unless specified, no blurriness,
no low quality, no distorted shapes, no complex backgrounds
```

---

## Composition Guidance

| Composition | Prompt Addition |
|---|---|
| Flat lay | "overhead view, flat lay, objects arranged on surface" |
| Editorial portrait | "3/4 angle, depth of field, blurred background" |
| Hero / full-bleed | "centered subject, full frame, no cropping" |
| Isometric | "isometric perspective, 45-degree angle, equal sides" |
| Negative space | "subject in lower-third, large empty space above" |

## Lighting Guidance

| Mood | Prompt Addition |
|---|---|
| Clean / tech | "even studio lighting, no shadows, white background" |
| Premium / dark | "dramatic rim lighting, dark background, near-black surface" |
| Natural | "soft diffused natural light, window-lit, gentle shadows" |
| Editorial | "high contrast, directional side light, strong shadows" |
