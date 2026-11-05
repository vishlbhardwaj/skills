# Things: daily objects (src/things.js, things.html)

> Part of the `doodle` skill. Read this before drawing an everyday object, especially
> one that lies on a table, turns in space, is made of glass, cloth or thin metal, or
> has a repeat (keys, spirals, bristles, ticks). Start from the nearest subject here.

## The set (stress test, 2026-11-04)

Twenty daily objects, each picked so no two share a failure mode:

| key | what it stresses | how it is built |
|---|---|---|
| `phone` | a rounded slab from above, black glass | `cam` + `prism`; screen cross-hatched with ONE reflection band left out (keyhole) |
| `laptop` | two planes at a hinge, a foreshortened key grid | `prism` base, a lid prism rotated about the back edge; keys as quads ON the deck plane (`S.on`) |
| `headphones` | an arcing band, cushion RINGS, near/far cups | arc strip (`edges`); cushion = keyhole ring; far cup first |
| `scissors` | crossed blades, finger loops | each half rotated about the pivot; loops are keyhole rings; back half first |
| `glasses` | thin frames, transparency | rims as keyhole rings; lenses read as glass by two reflection strokes, not tint; the far temple drawn again lighter "through" the lens |
| `watch` | 60 ticks, hands, a strap receding | ticks by angle (every 5th heavy); straps narrow away from us; `S.dash` stitching |
| `toothbrush` | bristles, leaning things, a soft tube | cup mouth → brushes → cup front wall (cuts them); a FLAT tube widening to a crimped seal |
| `hairdryer` | compound product curves | handle under the barrel; intake grille as rings + slots |
| `keys` | overlapping small metal, bitting | keys with keyhole bows and toothed blades; the ring drawn after two keys, before the third (threaded) |
| `tshirts` | folded cloth | soft bulging faces, ONE fold roll on the front, the collar as a half-arc against the back edge |
| `soap` | amber glass, a label, a pump | lathe with `tone` (dark glass hatched) and a highlight; the label's edges are near-half ellipses |
| `iron` | a wedge soleplate, a handle loop | soleplate shows its thickness; body with a keyhole HOLE under the handle |
| `notebook` | a repeat (17 spiral rings), a pen | `prism` with `capTone`; one ring per hole, each a loop through the cover |
| `padlock` | a shackle into a body, a keyhole | U strip whose legs the body cuts; brass crescent |
| `teddy` | plush organic, fur as line | `S.soft` masses, fur ticks along contours, stitched seam and foot pads |
| `bottle` | brushed steel, wrapped decals | lathe + sparse vertical strokes; decals mapped by `x = r·sin(u)` so they wrap |
| `bulb` | glass, a screw thread, a filament | an ANALYTIC glass profile; diagonal thread bands; wires and filament seen through |
| `hanger` | wire, fabric hanging | shoulders follow the hanger, the body drops, sleeves fall and fold |
| `backpack` | a soft bag, zips, straps | zips as a line + dashed teeth + a pull; a soft pocket panel |
| `umbrella` | furled fabric, a J handle | helical folds edge to edge; strap and snap; wooden handle strip |

`things.html?s=<key>` (`&outline=1` line only). On VDL: `vdl-tour / landscape-stress`,
the fourth block (x ≈ 4500), two columns of ten, line | colour.

## Tools added (src/things.js `extend`, plus fixes in shared kits)

- **`cam(yaw, pitch, scale, ox, oy)`**: an orthographic camera in picture units. y is
  down and z is toward the viewer; positive pitch looks DOWN onto tops. It returns
  `{ P, Z, R }`.
- **`S.prism(C, base3D, e, sideFill, capFill, o)`**: a convex planar polygon extruded by
  `e`. The silhouette is the hull of both caps. Only the cap facing us is drawn.
  Corner edges are drawn only where two VISIBLE side faces meet (`o.sharp`), so a
  rounded slab stays one smooth body. Other options: `o.round`, `o.capTone`,
  `o.sideTone`.
- **`S.on(C, origin, u, v, pts2D)`**: a flat shape lying in a 3D plane (keys on a deck,
  a label on a cover, a screen on a lid).
- **`S.dash(pts, w, on, off)`**: dashed lines (stitching, zip teeth). **The engine has no
  dash option; `{ dash: true }` is silently ignored.**
- **Auto-frame.** Each subject's frame is the bounding box of everything except the
  panel, plus a 10% margin, grown to the tile's aspect. Placed by eye, half the objects
  sat at 40% of their tile.

## Engine bugs this set found (fixed in the shared kits)

- **`S.soft` crescent wrap (src/trials.js).** The shade crescent is built from the
  outline's points in order. An outline from `ov()` starts at angle 0, INSIDE the
  shaded run, so the run came out in two pieces and the crescent folded into a sliver
  across the whole shape. In line-only it showed as a stray dotted diagonal (teddy,
  padlock). The outline is now rotated to start outside the shade. **A long straight
  dotted line across a soft shape is this bug.**
- **Lathe lumps (src/stilllife.js `smooth`).** Each profile segment is eased with
  smoothstep, which is flat at every knot, so a curve through a few control points
  comes out WAVY. For organic profiles, pass a dense analytic profile with
  `steps: 1` (linear between dense samples). `steps: 1` now means truly linear.

## Rules from the breaks

- **Cloth vs book.** Folded fabric bulges on every face and has soft corners. Its front
  shows ONE fold roll that dies out at the ends, and the collar is an arc against the
  back edge. Ruled parallel layers and sharp corners make a stack of books.
- **Things IN a container:**
  1. the mouth (dark inside);
  2. the contents;
  3. the container's FRONT wall, which cuts them.
  The same order as the fruit bowl.
- **A flat tube is FLAT.** It widens from the round cap to a straight crimped seal. A
  rounded closed blob reads as a slipper.
- **Glass reads as glass by its HIGHLIGHTS and by what shows through it**, not by tint.
- **Repeats (ticks, spiral rings, keys, bristles) get the thinnest pen in the drawing**,
  with every Nth one heavier when there is a natural rhythm (watch: every 5th).
- **Wrapped graphics** (labels, decals) follow the body: their edges are near-half
  ellipses on a lathe, or `x = r·sin(u)` across a cylinder, never straight rectangles.
