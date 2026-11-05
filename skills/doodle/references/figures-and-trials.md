# Figures and the trials set (src/trials.js, trials.html)

> Part of the `doodle` skill. Read this before drawing a PERSON, an ANIMAL, GLASS,
> a HEAP of round things, a LEAF WITH HOLES, a NIGHT scene, WEATHER, a SHOE, or
> anything with thin linkages (a bicycle, a chair frame).

## What the set is

After the landscapes (`src/scapes.js`), ten subjects that are deliberately NOT
landscapes, each picked to break one thing the system had not been asked to do
or had already failed at:

| key | breaks | class / stage |
|---|---|---|
| `person` | figure proportion, clothes on a body (no figure kit existed) | object / still-life stage |
| `reader` | a figure IN furniture: contact, overlap, soft (the armchair was broken) | object |
| `cat` | an animal: fur as line, organic mass | object |
| `bicycle` | thin linkages, circles, a hundred thin marks | object |
| `glass` | transparency: the back rim, liquid, refraction | object |
| `fruit` | a heap of round soft things in a bowl, cloth | object |
| `monstera` | split and holed leaves, overlapping (the monstera was broken) | plant |
| `night` | value INVERTED: dark sky in line, light as gaps | scene / scene kit |
| `rain` | weather over a scene, an umbrella, a reflection | scene / scene kit |
| `sneaker` | a shoe (three shoes failed before) | object |

`trials.html?s=<key>` (`&outline=1` line only, `&draw=1` live). Each subject has its
own aspect (`Trials._aspect`). In VDL: `vdl-tour / landscape-stress`, the block to the
RIGHT of the landscapes, rows T1–T10, line | colour.

Authored on the PICTURE PLANE (Retro._kit, square-on camera, x right / y down), back
to front, `clip = true`, and the frame is the FIRST region's bounds, so **the first
call is always `S.panel(...)` of the frame you want**. A panel that starts below 0
(`S.panel(0, 32, 130, 100)`) crops the picture to that strip; set `_aspect` to match.

## New figures: use `People.figure` (src/people.js, people.html)

**Full kit docs and every rule: `references/people.md`.** Summary below.

`Trials._figure` below was a flat 2D cut-out (always frontal, symmetric, square
shoulders, no neck, tube legs, lollipop hands, pebble feet, hatched face). The author:
"human figures are in a very bad state". `src/people.js` rebuilds it; draw every
NEW person with `People.figure(S, { x, gy, h, turn, pose, look })`. What makes a
drawn person read, in order (each was a failure of the old kit):
1. PROPORTION from the canon: 7.4 heads; shoulders at 18, hip joint 51, knee 73
   (height 100); wrist hangs at the crotch, elbow at the waist.
2. GESTURE: weight on one leg, hips tilt one way and shoulders the other
   (contrapposto), standing ankle under the neck. Symmetric = mannequin.
3. TURN: a 3/4 or side body is a different silhouette, not the front squashed:
   cross-section ellipses along the spine, limbs by forward kinematics, all
   projected through one turn angle.
4. ANATOMY in the silhouette: width PROFILES (neck → trapezius → shoulder cap →
   chest → waist → hip; thigh → knee → calf → thin ankle), never linear tapers.
5. HANDS and FEET at real size (hand ≈ face height, foot ≈ 1.1 heads), in 3D: a
   hanging hand from the front is edge-on; a front foot is a short toe toward you.
6. A clean FACE: no tone on skin; dot eyes, brows, a nose line, a mouth.

The trials subjects that draw people (person, reader, night, rain) are PORTED:
`trials.html` loads `src/people.js` and they call `People.figure`. Options beyond
the basics: `turn` (0 front, ±90 side, 180 back), `lookDown` (eyes as lowered
lids), `noFace` (distant figures), `tone` ({ gap, ang, cross, w, min }) hatches
every part as one silhouette (night, small figures), named poses in `People.POSES`
(stand, cup, walk, sit, sitSide, sitFront, wave, pockets, umbrella…), spread and
overridden per subject (`{ ...People.POSES.sitFront, handL: { hide: true } }`
hides a hand behind a held object), and `extras` to draw a held object at a joint.
`Trials._figure` is still exported but no subject calls it; do not use it.

## The old figure kit: `Trials._figure(S, x, gy, h, C, o)`

A body in units of its own height (head top 0, sole 100), seen from the front.

**The four ratios that make an adult** (get them wrong and no detail saves it):
head 13.5 (7.4 heads tall), shoulders at 18, hip joint at 51, knee at 73, the wrist
hangs at the hip line (50).

- `STAND` is the joint table: head, neck, shL/shR, elL/elR, wrL/wrR, hipL/hipR,
  knL/knR, anL/anR, each `[x, y]` in body units.
- **A pose is a set of joint overrides, `o.J`**; the parts draw themselves from the
  joints. Never redraw a body for a pose.
- `C` = colours: `skin top bottom shoe hair`, optional `sleeve`, `stripe`, `hairBack: false`.
- Options: `seated` (legs come from `o.lower`), `hem`, `hairLen` (>15 = long hair),
  `look` (eyes down, 0–1), `noFace`, `noHands`, `legW`, `tone` (hatch EVERY part:
  a silhouette), `skipArm: ["L"|"R"]`.
- Hooks, in draw order: `behind` (a bag, a chair back), `lower` (seated legs),
  `torso`, `arms` (furniture arms, a book), `front` (an umbrella). Each gets
  `(P, J)` where `P([bx, by])` maps body units to the picture.
- The face is minimal on purpose: two eye dashes, a nose tick, a mouth curve, an ear.
  It reads at frame size; more features read as a cartoon.

### Rules from the figure trials

1. **Limbs are ONE strip through their joints** (`S.limb([shoulder, elbow, wrist], w0, w1, …)`),
   never two strips meeting at the elbow. Outline only the two sides; the ends plug
   into something drawn later (torso, hand, shoe) that covers them.
2. **Long hair: outline its two SIDES only.** A closed outline round the back hair
   reads as a HOOD the moment the fill drops (line only).
3. **A figure IN furniture: size the furniture from the body, never the body to the
   furniture.** Seat width = hips plus a hand, arm tops at elbow height, back to the
   shoulder blades. A chair drawn first and filled with a figure afterwards
   swallowed it ("a child in a sofa", round 1).
4. **Seated, front view: thighs come at you.** Draw each thigh as a short round mass
   (foreshortened) ending in a knee, then shins drop from the knees. A long thigh
   strip in front view reads as standing.
5. **Draw order for a sitter:** chair back → seat → figure legs/lap → torso →
   furniture ARMS (they stand in front of the hips) → figure arms → held object →
   hands over the object. Hands that hold something are drawn AFTER it (`noHands`
   plus your own hands in the `arms` hook).
6. **A figure against light is a SILHOUETTE: `tone`** hatches every part. An outlined
   figure on a hatched night reads as a ghost.

## Holes are CUT, not painted: `keyhole(outer, hole)`, `holes(outer, list)`

The outer ring runs to the point nearest the hole, goes round the hole the OTHER way,
and comes back along the same seam. The fill then shows what is behind, hatch skips
it, occlusion uses the true shape. Painting a hole in the background colour lies the
moment anything stands behind it (a leaf behind a leaf, a moon behind a hatched sky).

- `keyhole` orients the hole automatically (it must wind AGAINST the outer ring or a
  nonzero SVG fill paints over it). **Do not pre-reverse holes.** Round 2's bug: the
  hole was reversed twice, so the hatch (even-odd scanline) looked right in line
  while the fill (nonzero) painted the tyres solid black in colour. If a hole shows
  in line but not in colour, it is the winding.
- Outline the outer edge and each hole SEPARATELY, never the keyhole polygon (that
  would draw the seam).
- Uses: a tyre (ring), a leaf with fenestrations, a night sky with a moon and a lamp
  glow, a road with a pool of light, a building with lit windows.

## Rules from the other trials

**Bicycle (thin linkages).** Every tube is one strip of constant width
(`S.limb([a, b], w, w, …, { shade: false })`); joints are where strips cross. A tyre is
a ring (keyhole). Spokes are the thinnest pen in the drawing (TEX × 0.55), or they
become a grey disc. Chain behind the frame, chainring and crank in front.

**Glass (transparency).** The FAR rim is a full ellipse (seen through the glass), the
near half heavier. The wall has thickness: a thin second contour just inside the
outline. Anything crossing behind is drawn THROUGH, and SHIFTED where it passes behind
water (that shift is what says "refraction"). The liquid is the one opaque value:
wine cross-hatched, water not. Highlights are white strips, not lines.

**A heap in a bowl.** Order: bowl INSIDE (dark ellipse) → the bowl's FAR rim line →
fruit back to front → the bowl's FRONT wall (its fill cuts the fruit's bottoms: that
cut is what says "in"). Two failures: the far rim drawn after the fruit runs straight
through it in line only; fruit whose bottoms sit ABOVE the front lip shows the bowl's
inside under it as a brown plate. Sink the fruit until its bottoms are below the lip.
And watch closed outlines built from two halves: concatenating a half-ellipse with a
REVERSED curve draws a straight chord across the bowl.

**Cloth.** A wavy edge, a hem dashed just inside it, folds that start at an edge and
die out. A gingham grid of straight lines read as a WIRE CRATE: a grid is only cloth
if every line bends with the folds; fewer, softer marks read better.

**Monstera (split and holed leaves).** A split is a NARROW slot with parallel sides,
running most of the way to the rib, slanting toward the tip, and each lobe between two
slots BULGES slightly. Wide wedge notches gave a sawtooth edge, and every leaf read as
a FIR TREE. Holes are ovals about a quarter of a lobe, keyholed. Tone: a light hatch on
the shaded half only (gap ~1.6), plus one vein per lobe. Stems ARC outward (a petiole
carries weight); straight converging stems read as a fan or a bouquet. No leaf points
straight up.

**Night (value inverted).** The sky is the darkest thing, so in line it is the densest
hatch on the page (cross-hatch), and every light is a place the hatch is NOT, carved
with keyholes: moon, lamp glow, the pool on the road, every lit window. In colour, a
glow must be a LIGHTER disc than the sky (mix sky toward the lamp colour); a bare hole
in the hatch shows the panel colour, which reads as a darker disc.

**Rain.** Rain is short slanted strokes drawn LAST over everything, thinner and denser
far away, and ABSENT under an umbrella (rain falling through a canopy says it isn't
one). A reflection in a puddle is the subject flipped and squashed, in broken
horizontal bands with no outline. The umbrella: a dome, a scalloped rim, ribs from the
crown to each point, alternate panels shaded and hatched.

**Animal (cat).** One pear for the body, a separate round for the haunch, front legs as
two straight columns, the tail wrapped round the paws and drawn LAST. Fur as line:
tabby stripes as curved bands ACROSS the form, ticks along the bib edge and the cheek
ruff, the forehead M. Almond eyes with slit pupils, a triangle nose, whiskers longer
than the head is wide.

**Shoe.** The fix was MEASUREMENT, not detail. A low-top's profile, as fractions of its
length L above the ground: toe tip .10, toe box (at .15 L) .17, vamp (at .35 L) .24,
top eyelet (at .55 L) .36, collar low point (at .70 L) .30, heel top (at .92 L) .34,
sole .06 (outsole a third of it). Then: the collar sits BELOW the top of the lacing
(level with it = a high-top, high at the back = a boot); toe cap and heel counter are
BANDS that follow the outline, not blobs; the tongue is a flap with a straight top
edge (a rounded tongue reads as a ball); the far eyelet row shows above the near one
(the eye is a little above). Round 1 was a puffy boot. Round 3 stretched the whole
drawing taller and became a clog on a platform, because the sole stretched too.
**Stretching a wrong shape keeps it wrong; author against measured proportions.**

## Helpers added in `_extend(S)`

| helper | what it is for |
|---|---|
| `S.limb(joints, w0, w1, fill, o)` | an arm, a leg, a tube, a stem: one strip through its joints; `o.shade`, `o.tone`, `o.cap`, `o.w` |
| `S.soft(pts, fill, o)` | any closed soft mass: fill + crescent shade + hatch + outline; `o.raw` (already dense), `o.tone`, `o.depth` |
| `S.fold(pts, w)` | a crease: short tapered curve |
| `S.pool(cx, cy, rx, ry, o)` | a contact shadow on the floor: hatch, no outline |
| `S.keyhole`, `S.holes` | cut holes (above) |
| `S.xf(fn)` | the same stage with every point mapped through an affine `fn`, for a whole-drawing shift or stretch. It cannot fix a wrong shape (see the shoe) |

## The method that found these breaks

Each round: render every subject in line AND colour (`trials.html?s=<key>[&outline=1]`
in headless Chrome, one `--user-data-dir` per parallel run), build a contact sheet AND
look at the large single frames, list every break, fix in the KIT where possible, then
re-render only the broken ones. Nine rounds here. Breaks per round:
- r1: reader dwarfed by its chair, feet out of frame; tyres solid; monstera pinecones;
  sneaker a boot; cloth a crate; night walker a ghost, glow darker than the sky.
- r2: tyres and monstera holes still filled (the winding bug); monstera fir trees.
- r3–r5: sneaker clog → measured profile.
- r6–r9: bowl far rim through the fruit; a chord across the bowl; the bowl's inside under the fruit.
