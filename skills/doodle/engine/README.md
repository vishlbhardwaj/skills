# Doodle

Objects and scenes drawn in code. `open canvas.html`.

    canvas.html   THE CANVAS — everything is drawn here. Pan, zoom, colour off.
    doodle.html   the older one-at-a-time instrument (tabs, a sheet, a caption)
    raw.html      any geometry with no hand, control points numbered

## The canvas

One surface, not a page per piece. Subjects sit on a world grid and you move
around them:

    scroll      zoom, about the cursor
    drag        pan
    f or 0      fit everything
    + / −       zoom from the centre
    ?outline=1  line work only, no colour

Zoom is a transform on a `<g>`, never a re-render. The marks are vector and the
hand is seeded, so magnifying has to show you the same drawing closer — re-running
the hand per zoom level would re-roll every wobble and the drawing would crawl
as you scrolled.

**Colour off** skips the region fills and leaves the line work, which already
carries the drawing: every region in these subjects has an outline over it.
It is a dial (`view.outline`) and a URL param.

Adding a subject is one entry:

```js
const SUBJECTS = [
  { key: "desk",    mod: Desk,           col: 0, row: 0 },
  { key: "windsor", mod: Chairs.windsor, col: 1, row: 0 },
];
```

## Draw order, three ways it bites

Regions paint in authoring order, then tones, then marks. That one rule caused
three different-looking bugs:

- **A line authored first draws over a fill added later.** The desk grain ran
  straight across the books and the notebook.
- **A fill authored later covers one authored earlier.** The Macintosh's base
  laid its lit top face across the front of the machine; authored *before* the
  body, the body covers it.
- **A filled background is a panel, not a backdrop.** The workstation's wall
  came out narrower than the desk in front of it. The paper is the wall.

**A surface something stands on should not be drawn at all.** Authoring the
Macintosh's base before its body fixed the *fill* — the body's regions paint
over it. But a prism's top-face OUTLINE is a mark, and every mark paints after
every region, so it still drew straight across the finished machine as two
long diagonals. `solid(..., noTop)` suppresses both.

Also: **one broken subject must not take down the canvas.** A reference error
in a single module threw mid-loop, so every later subject was skipped AND the
view transform at the end of `draw()` never ran — the canvas silently showed
one tile at 1:1 and `?focus` looked broken, three files from the real fault.
`drawSubject` is wrapped now.

## Still life

`src/deskscene.js` — pot, pens, books, lamp, notebook. A different camera
problem from the furniture: those stand on a floor and are seen near eye
level, this lies ON a plane and is seen from above. Same projection, different
placement — the table surface goes far below the eye (y = 80) so it recedes
steeply up the frame.

**Measure a glossy subject by SATURATION, not by lit face.** On gloss the
brightest pixels are the specular highlight rather than the object: the
lit-face probe that worked on upholstery returned a cream pencil and a grey
book. Weighted by saturation, the pot is hue 207 at full chroma and the pencil
hue 50.

**Every region paints before every mark**, so a line authored first still
draws OVER a fill added later. The table grain ran straight across the books,
the notebook and the pencil. There is no per-object layering here, so the fix
is to stop each grain line at whatever stands in its column rather than to
fight the draw order.

## Furniture

`src/furniture.js` — sideboard, bookshelf, round table, bench, wardrobe,
coffee table. All carcass work: explicit boards and boxes, listed out, which
is both how furniture is actually made and the way that reads. Proportions are
real, at roughly 1 unit = 2 cm with the floor at y = 40.

One bug worth not repeating: **`part()` turns a footprint about `(CX, CZ)`, so
its coordinates must be ABSOLUTE**, in the same frame as the legs. Passed as
offsets, the carcass gets turned about a centre it is nowhere near and swings
away from its own legs — the bench and the coffee table both came apart that
way, while the pieces whose parts were *consistently* wrong still looked fine,
because every part swung together.

## Five chairs

`src/chairs.js` — chosen because each is a different structural idea rather
than a restyle of one: **Windsor** (a bow, filled with spindles), **Ladder-back**
(two posts, slats between them), **Wishbone** (one bent rail that is crest and
arms at once), **Bentwood** (a closed hoop braced by a circle), **Adirondack**
(flat sawn boards, reclined and fanned). Same camera, same scale, so the
differences read as joinery.

### Craft

**Trace a profile; do not generate one.** The two chairs that worked first time
(ladder-back, Adirondack) are built from explicit parts — rectangles, slats,
boards. The three that did not were built from sin/cos, and a parameterised
curve lands *nearly* right and reads wrong, over and over: the Windsor's bow
was a croquet hoop, then a Gothic arch; the Wishbone was a hat stand, then a
tangle. They only came good when the silhouette was written out as a list of
points — half of it, mirrored, so it is symmetrical by construction. A traced
profile can be judged against the real thing point by point. A formula can only
be re-tuned and looked at again.

**Marks need structural taper.** `taper: [a, b]` scales a mark's width from
one end to the other, separately from `pressure`, which is random. A chair leg
is thick where it meets the seat and thin at the floor; a spindle swells low
and narrows into the bow. Drawn at one width end to end every stick reads as
doweling and the whole chair reads as a diagram.

**Some features are depth, and depth needs turning.** A Wishbone's arms sweep
forward from the crest; seen near-front they project to a flat line and the
chair loses the thing it is named for. No amount of redrawing fixes that — the
fix is the camera angle.

Four more things that were wrong in the first pass and are worth not repeating:

- **A chair back rises about 0.9× the seat width above the seat.** Mine rose
  1.5×, uniformly, and every one of the five looked like a throne.
- **A leg rakes a little.** At the splay they first had they read as
  stepladders, and at detail weight they were thinner than the spindles they
  were holding up.
- **A slat is a board, not two lines with a gap.** Four slats drawn as line
  pairs read as a radiator grille.
- **A turn foreshortens width.** The Windsor's bow came out as a pointed
  Gothic arch at −14° purely because the rotation squeezed its span; the fix
  was less turn, not a different curve.
- **A mirrored half must be reversed before it is joined.** Concatenated the
  other way round, the bentwood hoop ran left-seat → crown and then jumped to
  the right side partway up — and the jump drew as a diagonal straight across
  the chair.

## The style, measured

Four frames of the reference (nickbakeddesign, Oct 2026) were measured rather
than eyeballed:

| | |
|---|---|
| paper | `#FBFAF8` — warm off-white, never pure white |
| ink | `#0A0A0A` — near-black, never pure black |
| accent | `#0A84F8` — ONE azure, flat fill, **never outlined** |
| stroke | median **1.8% of canvas width**, p25–p75 spanning 1.3%–2.9% |
| air | the frame is **82–90% empty** |

That stroke number is the finding that matters: a drawn line is not one width.
It runs roughly ±40% around its median *along its own length*, and that — not
jitter — is what reads as a pen rather than a plotter.

So a mark is built as a **ribbon**: a filled polygon walking up one side of the
path and back down the other. A stroked path has exactly one width by
definition, so no amount of wobble on its centreline will ever make it look
drawn.

## Two families, one engine

The marker reference and a later set of five pen references are **not the same
style**, and the measurement says so plainly:

| | line weight | ink |
|---|---|---|
| marker reference | **1.80%** of image width | 10–18% |
| DNTN village | 0.13% | 3.8% |
| Aube Blue train | 0.25% | 7.8% |
| Voyelles shopfront | 0.29% | 14.5% |
| Kuro Coffee | 0.42% | 7.3% |
| Paris café | 0.44% | 11.8% |

Four to fourteen times finer. But the real difference is **where the variation
lives**. A marker varies *within* a stroke, continuously, as pressure. A pen
holds one width along a run and varies *between* runs — two or three discrete
weights sorting outline from detail from texture. That hierarchy is most of
what reads as "pen", and no amount of wobble will fake it.

So an object declares a **nib**:

```js
SHOP.pen = 0.15;                 // weight multiplier
SHOP.nib = { pressure: 0.10, wander: 0.10, boil: 0.4,
             double: false, blobs: 0 };
```

And the second difference: **the marker carries tone as flat colour, the pen
carries it as texture.** That is most of what those five references are.

## The six tells

The reference uses all six, and `src/hand.js` exposes each as a dial.

1. **wander** — low-frequency drift off the true path. Low: high-frequency
   noise reads as fuzz or a shaky hand, which is a different and worse look.
2. **pressure** — width varying along the length (the measurement above).
3. **overshoot** — ends run past the corner. Nobody stops exactly on a vertex.
4. **double** — the same path drawn twice, different seed. The single biggest
   tell in the reference: the door frame and every globe meridian are drawn
   twice, slightly apart.
5. **breaks** — the mark skips. A dry marker lifts.
6. **blobs** — ink pools where the pen starts, stops and crosses.

Plus two composition rules worth as much as the hand: the accent sits **under**
the line work and slightly **out of register** with it, like a second colour
plate; and the drawing sits in the lower two-thirds under a serif headline,
with most of the sheet left empty.

## Colour, and why it is not the reference's

The scene palette is **not** the measured values. Sampling the reference
photograph object by object returns this:

| | lit face | hue |
|---|---|---|
| orange cushion | `#F4B96E` | 34° |
| yellow cushion | `#D28726` | 34° |
| **blue** cushion | `#B3AB87` | **49°** |
| green cushion | `#AEA25C` | 51° |
| wood, sofa, wall | — | 28–34° |

Everything in that photograph sits in a **27–51° hue band**. Even the blue
cushion reads hue 49 — yellow-green — on its lit face, because golden-hour
light has completely overwhelmed its local colour. The photograph works
because of *light*, and flat marker fills have no light. Copied literally the
samples give a brown smear.

So the doodle takes the reference's colour *relationships* — the warm bias, and
the orange → amber → blue → olive run along the sofa — and restores each
object's identity colour. The sun arrives instead as one pale shaft, drawn
first so everything sits inside it.

A first pass measured region means rather than lit faces and reported the blue
cushion as `#5A615F`, flat grey: an average mixes an object with its own
shadow. The lit face is the identity colour.

## Tone

Five fills, all region-clipped so ruling stops at the shape's edge rather than
its bounding box:

| | |
|---|---|
| `hatch` | parallel ruling — roofs, cast shadow, awnings |
| `halftone` | a regular dot grid — brick, mid greys |
| `stipple` | scattered dots — soft or granular tone |
| `scribble` | continuous loops — foliage, the one organic texture |
| `solid` | pure black — window panes, deep shadow |

```js
tones: [{ pts, kind: "hatch", angle: 52, gap: 1.3, w: 0.5 }]
```

Tone paints between the flat accent and the line work: it is shading, so it has
to read *under* an outline, never over it.

**`boil` is not `wander`.** Wander is low-frequency drift — a hand not quite
following a line, which is the marker's tell. Boil is a fast, tiny tremble
along an otherwise straight run, and it is what makes the long frame lines in
the pen references ripple without ever leaving their path. One is the arm, the
other is the fingers; a pen has the second and almost none of the first.

Two composition habits worth stealing, both from the references rather than
from any measurement: draw **some** of the bricks and let the rest be implied
(Kuro Coffee), or draw **every single twig** and let density be the subject
(Aube Blue). Both work. The middle — half the twigs — is the one that doesn't.

## The cameras

*(A third, `View.two`, came later — see **Two-point perspective, and
buildings** below.)*


`View.one` is one-point perspective: a floor recedes, side walls converge,
things shrink with distance. Right for interiors.

`View.axon` is parallel projection — no vanishing point at all. **One-point
perspective cannot draw a box turned to the camera**: such a box has two sets
of receding horizontals and a single vanishing point can only serve one of
them. Product renders are usually axonometric for exactly this reason.

Measured off the Macintosh reference: its screen's horizontal edges run at
**+24°** and its verticals at **93°**, i.e. vertical, with nothing converging.
Rebuilt with `View.axon({ ax: 24, az: -22 })` the drawing measures **+24.1° /
90.0°** against it.

```js
View.axon({ ax: 24, az: -22, origin: [50, 30] })
```

With an axonometric camera the scene must NOT also be turned — the camera's
own axes do the turning, and rotating the footprint as well twists the box off
its own projection.

## Perspective

Everything before `src/view.js` was a flat elevation — not because the geometry
was badly chosen but because **there was no projection step at all**. Objects
were authored as 2D `[x, y]` and drawn straight to the sheet, so a sofa could
only be a band, a table an ellipse, a floor a line, and depth could only ever
be faked by overlap.

Author in three numbers now:

    x   right, 0 at the centre of the room
    y   DOWN, 0 at eye level — the horizon is y = 0
    z   into the picture, 0 at the near edge

```js
const V = View.one({ f: 100, vp: [50, 60] });
V.p(x, y, z)                    // one point
V.quad(a, b, c, d)              // four [x,y,z] corners
V.seg(a, b)                     // a 3D segment as a 2-point path
View.box(V, x0,y0,z0, x1,y1,z1) // faces, back to front, each with a shade
View.boards(V, …)               // floorboards running INTO the picture
```

One-point perspective, which is what interior photographs are:

    s = f / (f + z)        screen = vp + (x, y) · s

`f` is focal length in author units — small is a wide lens and violent
convergence, large is a long lens and a nearly flat room. Output lands in the
same 0–100 × 0–125 space, so the hand, the tone fills and the sheet fitting all
work on it unchanged.

**Two things make it read, and either alone fails.** Convergence comes from the
camera. Value comes from `View.box`, which returns each face with a `shade`
lit from upper-left-front — a correctly projected box whose faces are all one
colour is still a flat slab. Faces are also returned back-to-front with the
away-facing ones dropped, so painter's order gives a convex solid its occlusion
for free.

The clearest tell of a drawing with no camera behind it is floorboards drawn as
parallel lines across the sheet. They have to run *into* the picture.

### Prisms

`box` can only make things square to the camera, so everything built with it
faces dead on. `prism` extrudes any footprint in the floor plane, which covers
what a box cannot: a round table, a hexagonal pot, and — with `turn` — a chair
sitting at an angle, which reads as furniture where a head-on one reads as a
diagram.

```js
View.prism(V, foot, yTop, yBot)   // faces back-to-front, each with a shade
View.turn(foot, deg, cx, cz)      // rotate a footprint about a vertical axis
View.rect / View.soft / View.disc // footprints
```

Two findings from building a chair with it:

- **A four-corner rect extrudes into a hard-edged block.** Right for a shelf,
  wrong for upholstery — the chair read as a filing cabinet until its
  footprint was rounded (`View.soft`).
- **Then outline the SILHOUETTE, not each face.** A rounded footprint has many
  narrow side faces, and outlining every one draws a line down each facet, so
  the chair came out covered in stripes. The visible sides form a contiguous
  run in footprint order, so their top and bottom edges chain into one closed
  boundary; `prism` returns it as `faces.silhouette`.

And one about anything hung on a 3D scene: **build it in 3D too.** The palm's
leaflets were screen-space offsets off a projected tip, so they ignored the
room entirely and lay flat against the right wall.

Still flat: `room`, `corner`, `nook`, `shop`. Still missing: two-point
perspective, for corner views rather than head-on ones.

## Adding an object

One entry in `src/objects.js`, authored in a 0–100 box:

```js
thing: { label: "Thing", build() { return {
  regions: [{ pts: [...], curve: false }],      // flat accent, painted first
  marks:   [{ pts: [...], closed: true, w: 1.15 }],
}; } }
```

`w` multiplies the global weight for that one mark — a sole gets to be heavier
than a lace without a second set of dials.

A **scene** needs more than a single object does, so it may also declare:

```js
ROOM.fit = { w: 0.88, h: 0.70 };   // fraction of the sheet
ROOM.pen = 0.38;                   // weight multiplier
```

One weight cannot serve both: at single-object settings the room came out small
with a stroke thick enough to swallow its own furniture. A region may carry
`fill` (a palette key) so a scene can use more than one accent.

**Check new geometry in `raw.html?o=thing` first.** It draws the clean path
with numbered control points. Three failed shoe attempts were all geometry, not
style, and the hand made them impossible to diagnose.

## Two-point perspective, and buildings

`View.one` cannot draw a box turned to the camera: such a box has two sets of
receding horizontals and one vanishing point can only serve one of them.
`View.axon` dodges that by dropping convergence, which is right for a product
render and wrong for a building.

`View.two({ f, yaw, dist, hor, cx })` yaws the world and projects with a LEVEL
image plane. Because x and y divide by the same depth, a vertical world edge
stays vertical on the sheet — the defining property of two-point perspective,
and the reason it reads as architecture rather than as a dramatic angle. Each
horizontal axis gets its own vanishing point. A negative yaw sends +x receding
right and +z receding left, so a building with its front along x and its flank
along z is seen from the left, front wall dominant.

**Author flat detail on a face.** `V.face(origin, du, dv)` takes u across and
v DOWN, so every window, band and door is written exactly as it would be in
elevation and lands in perspective for free. Writing each opening out in three
dimensions makes the file unreadable, and that helper is what makes a
perspective facade practical at all.

**The depth is carried by the things that PROJECT.** In elevation a cornice,
sill, balcony and awning are each two parallel lines. In perspective they are
solids: a cornice above eye level shows its underside, a sill its top, a
balcony the top of its slab, a window one jamb of its reveal. Those small
overhangs sell the depth far more than the convergence does — a box with no
overhangs still looks like a drawing of a box.

`src/arch.js` has five buildings and exports the toolkit as `Arch._kit`;
`src/arch2.js` has fifteen more built on it. Sharing one vocabulary is what
keeps a varied set looking like a set.

## The stage, and watching it draw

`src/stage.js` holds subject rendering and the replay engine, shared by
`canvas.html` and `buildings.html` — one copy of the hand, the masks and the
timing. It was extracted the moment a second page needed it, rather than
copied.

Press `d` on either page. A mark is a ribbon, so it has no stroke to animate,
but the centreline it was really drawn along is known at build time
(`Hand.beginTrace` / `endTrace`): a thick round-capped stroke along that
centreline, grown with `stroke-dashoffset`, is a mask that reveals the ribbon
in the direction the pen actually travelled. Mask with the raw control points
instead and the reveal front runs down a dead straight line while the ink it
is laying wanders up to four units off it.

Fills are scribbled in with a serpentine rather than wiped, the progress along
each stroke is warped so the pen surges and hesitates without ever running
backwards, and the hand visibly lifts and travels to the next start. There are
no construction lines: liveliness belongs in the movement, not in extra marks.

`buildings.html` is the presentation canvas — fifteen buildings, no chrome.
You arrive on the cafe and watch it drawn; one pinch reveals the other
fourteen, already finished, scaling and fading in staggered outward. Pinch
zooms (a trackpad pinch is a wheel event with `ctrlKey`), plain scroll pans.

## Classes — the guardrails

`src/spec.js` holds the drawing classes: `object`, `product`, `furniture`,
`plant`, `flower`, `elevation`, `interior`, `scene`, `diorama`, `panel`. Each
carries the pen, nib and fit it was approved at, plus its fill policy, tone
rule, detail budget, ink target and framing rule.

**A class owns the hand; a page owns the paper.** Before this existed, weight
and nib were decided per module and per page, and the same ten plants drew
4.5px on `canvas.html` and 7.8px on `plants.html` — 1.7× apart. `Spec.REF`
(26) is now the house weight every page starts at.

    Spec.brief("product")                        // the guardrail, as text
    out[key] = Spec.wrap("plant", NAMES[key], build);   // declare, do not retype

Declaring a class tags the module with `mod.cls`, and `bin/check.sh` audits
every tagged module on every page — a module that drifts off its class fails
the run. `furniture` and `interior` sit at half the house weight because they
predate the heavy register; they are recorded so the drift is visible, not so
it is copied.

## Storyboards

`src/board.js`, shown on `board.html`. A panel CROPS — every other subject in
this system is fitted to its own bounding box, which is the opposite of a
shot — and `k.shot(mod, opt)` places any existing subject module in that crop
at a chosen size and position. Nothing is redrawn to be boarded.

Shot size is quoted as the subject's height over the panel's height
(`ews` 0.20 … `ecu` 5.00) and decides the detail rung. `anchor: "feet"` plus
`k.ground(v)` puts two subjects on one ground line. Camera moves (`push`,
`pan-r`, `tilt-u`, `track-l`…) are drawn in the same ink, thinner; `k.action`
arrows — what the subject does — are heavier. Captions are lettered with
`src/letter.js`, a single-stroke alphabet drawn by the hand.

The crop is geometric, not an SVG clip-path: a panel's frame is only the top
of its card, so a clip large enough to show the caption lets the shot spill
out of the frame. `b` replays the whole board in read order.

## The underdrawing

`canvas.html?sketch=1`, then `d`. Three phases: the subject is roughed out in
pale pencil, the ink is drawn over it, and the pencil is erased.
`Live.sketch(g)` plays the pencil pass alone, as a loading state.

This was built once before and rejected, so it is built against both of the
reasons it failed:

- **Looseness is a LOW frequency, and that means few points.** The first
  version jittered every point of a dense centreline — about 45 over a short
  run — which is noise and reads as spikes. `loosen()` resamples to three to
  seven points far apart and moves those by under ~1.5 cycles across the
  whole stroke.
- **A ghost that stays is a halo.** Structural marks only (`w >= 0.9`), and
  the pencil leaves. That is the whole difference between an underdrawing and
  a scribble halo.

Scale the deviation to each stroke's own length (`min(amp, L × 0.13)`) or
every short mark becomes a knot. The rough-in CASCADES — strokes overlap and
the pass fits `roughMs` (1700 default) whatever the stroke count — and runs
with no nib, because a search has no single point of attention.

It is opt-in (`Q.ghost`) on a measurement: building it always added 2,416
paths and took a redraw from 372ms to 661ms. Tuning dials are `Q.ghostInk`
(the pencil colour, default `#A6BCD2`) and the `0.014` amplitude factor in
`Stage.build`.

Skeleton-loader libraries cannot do this job: they measure DOM leaves and
every one treats an `<svg>` as a single leaf, so the canvas would be one grey
box. And there is no wait to fill — the draw is 372ms and synchronous.

## Still life — solids of revolution

`src/still.js`, shown on `still.html`: a jug, a roemer, a pewter plate with a
herring, a loaf, a cut lemon, a skull, an hourglass, a stack of books,
a brass candlestick and a bunch of grapes.

There is **no camera in the file**. The `object` class says what to do with a
round thing — *use flat profiles on the front plane with a crescent on the
right* — so a solid of revolution is authored the way an illustrator draws
one: a half profile `[[y, r], …]` mirrored about its axis for the silhouette,
an ellipse at every opening, and a crescent down the shaded side for the turn.

One constant holds the set together. `Q = 0.30` is the squash of every
horizontal circle, which **is** the height of the eye above the table. One
value for all ten or they stop sharing a viewpoint, and the plate — which is
nearly all ellipse — is where that would show first.

    body(prof)              the closed silhouette, round the foot and across
                            the BACK of the mouth
    crescent(prof, k)       the turn away from the light, bounded by two
                            curves: the limb and the terminator inside it
    band(k, prof, y, w)     a ring on an opaque body — the NEAR HALF only
    radAt(prof, y)          the radius the body really has at that height
    vessel(k, prof, …)      fill + crescent + silhouette + rim
    cast(k, r, …)           the pooled shadow on the table

Three traps, each of which produced a wrong drawing first:

- **A band drawn as a full ellipse is a full ellipse.** Marks have no depth
  occlusion, so the far side of a throwing ring loops back over the front of
  the pot. Only an open mouth is a whole ellipse.
- **A liquid surface is clipped by the OPENING, not the belly.** On an
  incurved vessel the mouth is the narrowest thing above the wine.
- **A crescent selected with a straight cut is a seam.** The skull had a join
  down its face until the shade was bounded by a curve instead of a line.

`a` on `still.html` draws all ten in order on a sheet that starts empty — the
cells are all armed first, because a sheet that empties one tile at a time
reads as finished drawings being rubbed out.

## Rules learned by failing first

1. **Landmarks must be in the outline.** A shoe drawn as a smooth wedge reads
   as a doorstop however good the stroke is. The collar notch has to be cut
   into the silhouette, with the tongue rising out of it.
2. **Hierarchy decides what a shape says.** Heel taller than tongue reads as a
   sneaker; tongue taller than heel reads as a horn. Same points, different
   order of heights.
3. **Fit the drawing, not its coordinate box.** Scaling by the 0–100 box put a
   wide flat object on screen at a fraction of the size of a square one, so the
   shoe's collar notch came out finer than the stroke drawing it and the hand
   swallowed the very landmarks that made it a shoe.
4. **An accent region of 5 smoothed points is an ellipse.** The reference's
   accent shapes are faceted; set `curve: false`.
5. **A halftone is a print screen, not a hand mark.** Drawn with the same
   irregular blob function used for ink pooling, the dots came out lumpy and
   wildly uneven and the tone read as polka dots. Halftone and stipple dots
   are true circles now — only stipple varies, and only a little.
6. **A loop needs a whole turn.** Scribble built from two points per step — an
   offset and a centre — made an angular zigzag that read as scratchy wire.
   Foliage needs the line to come back on itself.
7. **Boil has a very small budget.** At 0.4 of a stroke width it stops reading
   as a pen and starts reading as a shaky hand; 0.14 is about the ceiling.
8. **Regions paint in authoring order.** The cushions were written before the
   sofa and vanished under its cream fill. In a scene, authoring order *is*
   the composition.
9. **A shell chair is two shapes, not one.** A closed blob with an inner line
   is an egg; the seat has to be a separate shape drawn over the back so its
   outline cuts across. That overlap is the whole chair.
10. **Marks paint after regions**, so a floorboard run across a rug's x-range
   draws straight over its colour. Stop the run, don't reorder it.
11. **Overlap is the only depth cue a flat doodle has.** The vase read as
   embedded in the sofa until the table moved forward of it; at the same
   height nothing says which is in front.
12. **A back must sit above what leans on it.** With the sofa's top edge at
   cushion height, the line ran straight through all four cushions.
13. `createDialKit` only *registers* a panel — the UI does not exist until
   `createDialRoot()` is called, and nothing errors if you forget. The page
   just renders with defaults and no dials.
