---
name: clean-illustration
description: Make clean, digitally-crafted vector illustrations — crisp even line weights, exact geometry, flat colour with tonal or no outlines — of objects, products, devices, buildings, dioramas and scenes, using the doodle skill's bundled engine (the same geometry/camera/parts/Rive pipeline as the doodle skill, with the hand switched off). Use when asked for a clean, polished, crisp, vector, digital, flat, "not doodly", "more crafted", product-style or app-ready illustration, or to convert existing doodles to a clean style, or to animate clean illustrations in Rive. Triggers on — clean illustration, clean style, vector illustration, flat illustration, crisp lines, digital illustration, make it clean, less sketchy, polished illustration, tonal outlines, no outlines, isometric/diorama clean, clean Rive.
---

# Clean illustration

**Needs the `doodle` skill installed** (it carries the engine). Do its Setup step
first; `<workspace>` below is that workspace.

The sibling of `doodle`. **Same engine, same geometry, different register**:
the doodle hand (wander, pressure, boil, overshoot, breaks, ragged fills) is
switched off, and what remains is crafted vector illustration.

**Read the `doodle` skill for everything about building subjects** — cameras
(ortho products, `View.two` perspective, `persp.lift` dioramas), the product
toolkit (`prism / plane / flat / raise / tower / box`), deferred occlusion,
parts/tracks/layers, and the doodle → Rive pipeline. This skill covers only
what changes when the result must look clean.

## Switching it on

Any page that carries the CLEAN block (`retro.html`, `cafe.html` — copy the
block into a new page) takes:

    ?style=clean                 the clean register
    &weight=17                   base line weight (doodle pages use 26)
    &outline=1                   × weight for silhouettes / outer edges (OUT marks)
    &detail=1                    × weight for inner detail (DET/TEX marks)
    &lines=tonal | ink | none    outline treatment (default tonal)
    &tone=0.58                   how dark a tonal outline is (× its fill)
    &ink=26262E                  ink / detail colour (hex, no #)
    &seam=0.8                    seam-closing stroke on fills (0 = off)
    &caps=round | flat           line ends

Every one of these is ALSO a live dial in the page's **Clean** folder
(saved separately from the doodle dials). Tune by eye on the page, then put
the numbers in the URL / the export query so Rive gets the same.

Weight recipes (boombox, 1:1):
- 12 — fine, technical, airy. 17 — default, balanced. 26 — bold, friendly.
  36 — chunky; detail starts to clog (ticks, grilles).
- **Sticker look:** `weight=26&outline=1.8&detail=0.8` — fat silhouette,
  light interior. Push further with `&lines=ink&outline=1.5`.
- Raising `weight` thickens EVERYTHING; raise `outline` instead when only the
  silhouette should get heavier.

    file://<workspace>/cafe.html?style=clean&lines=tonal
    file://<workspace>/retro.html?style=clean&lines=none&focus=toaster

What the preset does (`CLEAN` in the page → merged into every draw):

| | doodle | clean |
|---|---|---|
| line | ribbon, ±40% pressure, wander, boil, overshoot, breaks, tapered ends | ONE even width, round caps (`Hand` `P.clean`), straight is straight |
| fill | hand-blocked, ragged edge, misregistered | exact geometry, a hairline stroke in its own colour closes seams |
| ink | #17171A | #26262E (charcoal, softer than black) |
| weight | 26 × pen | 17 × pen |

## The three outline treatments

Measured on the café diorama and devices — all three read; pick by use:

- **tonal** (default) — every outline is a darker shade (×0.58) of the fill
  it belongs to; detail lines stay charcoal. The "polished digital
  illustration" look: edges defined without a black cage. Best general default.
- **ink** — even charcoal outlines everywhere. Crisp, graphic, iconographic;
  closest to a clean vector of the doodle. Good for small sizes / icons.
- **none** — no outlines on filled shapes, only detail lines. Pure flat
  vector; form comes from face shading alone (top 1.08 / front 1.0 / right
  0.72). Best large, on product/marketing surfaces. Needs strong value
  contrast between adjacent faces — check it.

How it works: the toolkit tags every outline/crease with its shape's fill
(`tone`); `Stage.markColor(m, Q)` resolves the colour by `Q.lineMode`; the
Rive exporter uses the same function, so the .riv matches the page.

## Rules of the clean register

1. **Geometry is the drawing.** With no hand to hide behind, every wobble you
   authored is visible: rectangles stay `curve: false`, circles get enough
   points (≥ 5 per unit radius), mirrored halves are exact.
2. **Two line weights, decided — not three-ish.** Outer silhouette (OUT) and
   inner detail (DET/TEX). Doodle's weight jitter is gone, so the hierarchy
   has to come from the weights themselves.
3. **Consistent corner radii.** Pick 2–3 radii per subject (`rr`) and reuse
   them; mixed radii read as careless in clean, not as charm.
4. **Shading is planes, not texture.** Face shading from the normal does the
   work; add highlights as clean shapes (a white sliver, a sector glint), never
   as hatch or stipple — tone textures are doodle-register only.

   One exception is now worth knowing about. The doodle engine gained `ribs`
   and `grid` (src/hand.js): rulings placed at the same FRACTION of every
   scanline's span, so they bow with the silhouette instead of being ruled
   flat across the page. With the hand off they come out as an even,
   mechanically regular set of curves following the form — which is a
   legitimate clean treatment for a fluted, ribbed, knurled or woven surface,
   and the only way to draw one without a texture fill. It is geometry, not
   texture. `halftone` and `stipple` remain doodle-only.
5. **Colour discipline.** Flat identity colours (measure them — see doodle
   "Measurement"), one darker value per material for shadow faces, white
   highlights. With `tonal` the outline palette comes for free.
6. **Seams are bugs.** Exact polygons meeting edge to edge show anti-alias
   hairlines (stripes on a rounded flank). The clean preset strokes each fill
   in its own colour (0.8 on the page, 0.7 in Rive) — keep it.
7. **Small detail must survive.** Tiny lines that read as texture in doodle
   look like stray marks in clean: cut detail below ~1.5 units or make it a
   shape.

## Rive

    cd <workspace>
    bin/export-retro.sh /abs/out.json <page> <Module> <TILEVAR> "style=clean&lines=tonal&weight=26&outline=1.8"
    python3 <your-rive-project>/gen.py out.json scene.rml   # the Rive generator is NOT bundled
    rive . --verify && rive . --once

The generators read `clean` from the export and add the seam strokes.
The author's two clean Rive projects (retro devices, the café) are not bundled.

Clean files are SMALLER than doodle ones (cafe 21.7k vs 22.3k vertices,
retro 80k vs 113k): an even line simplifies to fewer points.

## Working method

1. Build or reuse the subject with the doodle toolkit (the geometry is shared;
   nothing is authored twice).
2. Render all three treatments side by side at 1:1 (`&focus=`) — tonal, ink,
   none — and look. Pick per brief; default tonal.
3. Check the clean-specific failures: seams on curved flanks, wobbly authored
   geometry, mixed corner radii, specks of detail, faces too close in value
   (`none`).
4. `bin/check.sh` (the doodle pages must still pass — clean is a mode).
5. Log lessons in `LEARNINGS.md` here.
