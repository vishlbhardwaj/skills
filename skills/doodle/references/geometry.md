# Cameras, framing, solids, draw order, registers

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## The three cameras

`View.one({ f, vp })` — one-point perspective. Floors recede, side walls
converge, things shrink with distance. For interiors and anything seen from
roughly eye level.

`View.axon({ ax, az, origin })` — parallel projection, no vanishing point.
**One-point perspective cannot draw a box turned to the camera**: such a box
has two sets of receding horizontals and one vanishing point can only serve
one of them. Product renders are axonometric for exactly this reason. True
isometric is ax/az = ±30; shallower (±22–24) reads more like a render.

With an axonometric camera the object must **not** also be turned — the
camera's axes do the turning, and rotating the footprint as well twists the
box off its own projection.

`View.two({ f, yaw, dist, hor, cx })` — **two-point perspective**: a level
pinhole camera with the world yawed. Because x and y divide by the same depth,
**a vertical world edge stays vertical on the sheet** — that is the defining
property of two-point perspective and the reason it reads as architecture
rather than as a dramatic camera angle. Each horizontal axis gets its own
vanishing point, left and right on the horizon. A NEGATIVE yaw sends +x
receding right and +z receding left, so a building with its front along x and
its flank along z is seen from the left with the front wall dominant.

Use it for buildings and anything else that must read as a mass rather than a
face. `axon` dodges the two-vanishing-point problem by dropping convergence
altogether, which is right for a product render and wrong for a building.

**Author flat detail on a `V.face(origin, du, dv)`** — u across, v DOWN — and
every window, band and door is written exactly as it would be in elevation,
then lands in perspective for free. Writing each opening out in three
dimensions makes the file unreadable; that helper is what makes a perspective
facade practical at all.

**The depth is carried by the things that PROJECT.** In elevation a cornice,
a sill, a balcony and an awning are each two parallel lines. In perspective
they are solids: a cornice above eye level shows its *underside*, a sill shows
its *top*, a balcony shows the top of its slab, a window reveal shows one
jamb. Those small projections sell the depth far more than the convergence
does — a box with no overhangs still looks like a drawing of a box.

Author in three numbers: **x** right, **y** DOWN (horizon at y=0), **z** into
the picture. Pick a ground plane (the scenes use 40) and build on it.

## Framing — check the subject is IN the picture before redrawing it

A clipped subject declares a `frame`, and **the frame must be derived from the
camera, not chosen.** The ground at depth z lands at `horizon + gnd · f/(f+z)`,
so a frame's bottom edge *is* a nearest-visible depth. Ten landscapes declared
a frame bottom equal to z = 50 while every foreground subject sat at z = 3–8 —
all of them projected below the frame and none were ever on screen.

Two whole rebuilds were spent adding foreground and measuring ink. **The ink
being measured was the backdrop.** A measurement only means something once you
have confirmed it is measuring the thing you think it is; it cannot find a
fault in the frame, because everything it reports is already inside one.

The same arithmetic constrains **x**. A frame 96 units wide holds `|x| < 48/s`
— about ±49 at z = 6, ±94 at z = 100. Distant ridges may run wide; near work
may not, or it is cropped at the knee.

> When something you drew is not visible, check whether it is inside the frame
> **before** you redraw it bigger. Print the projected bounds.

## Solids

    View.prism(V, foot, yTop, yBot)    extrude a footprint; faces back-to-front
    View.turn(foot, deg, cx, cz)       rotate a footprint about a vertical axis
    View.rect / soft / disc            footprints
    View.boards / joints               floorboards running INTO the picture

`prism` returns each face with a `shade` lit from upper-left-front, and
`faces.silhouette` — one outline round the whole solid.

- **Fill every face, outline the SILHOUETTE once.** Outlining each face draws
  a line down every facet; a rounded footprint comes out striped.
- **A four-corner rect extrudes into a hard-edged block.** Right for a shelf,
  wrong for upholstery — use `View.soft`.
- **A footprint passed to a turned prism must be in ABSOLUTE coordinates**, the
  same frame as everything else. Offsets get turned about a centre they are
  nowhere near.
- **A prism cannot taper.** Anything that narrows — a vase, a lamp stem, a
  pitcher, a mouse — is a drawn profile, not a stack of prisms.

## Draw order — regions, then tones, then marks

One rule, four different-looking bugs. Check all four on any layered scene:

1. **A line authored first draws OVER a fill added later.** Stop the line, or
   move it; there is no per-object layering.
2. **A later fill covers an earlier one.** Author what is behind, first.
3. **A filled background is a panel, not a backdrop.** The paper is the wall.
4. **An outline of a hidden surface still draws.** A surface something stands
   on should not be drawn at all — `solid(..., noTop)`.

And: **marks have no depth occlusion** in the renderer. A cable that passes
behind an object in 3D draws straight across its front.

The commonest form of this on a round object: **a band round an opaque body is
the NEAR HALF only.** Drawn as a whole ellipse it IS a whole ellipse, and the
far side of every throwing ring comes back over the front of the pot as a
loop. Only the MOUTH of an open vessel is a full ellipse, because there the
far lip is genuinely in view. See `Still.band`.

**Two faults that look like bad drawing and are actually path construction:**

- **A silhouette that closes across an opening.** A lathe `body()` runs down
  the right, round the foot, up the LEFT side — so it ends at the mouth's
  left lip. The arc that closes it over the top must START there too
  (`back()` is 180° → 360°, which does). Reversed, the stroke jumps the whole
  width of the mouth in one straight segment: a heavy bar that reads as a lid
  on a cup and a crease across a lampshade. The fill closes over it, so it is
  invisible until `?outline=1` — which is the view that gets rejected.
- **An OPEN vessel stroked `closed: true`.** The hand then rules the chord
  from the last point back to the first, across the mouth, for the same
  result. The fill closes; the stroke does not.

If a drawing has a straight line in it you did not author, print the point
list and look for the jump before retuning anything near it.

**Solve it in the subject, not by hand-routing.** Two working patterns:

- `Scenes` — `hide(pts, occluders)`: build every foreground silhouette FIRST,
  then each back layer's lines are densified and cut wherever they fall
  inside anything nearer. Every nearer thing must be in the list — a pine
  token's outline ran down the reader's face until the head was added.
- `Flowers` — **deferred occlusion**: fills are emitted immediately in
  authoring order; every outline and detail line is QUEUED with its position,
  and `flush()` cuts each by every filled shape authored after it. Author
  back to front and occlusion is automatic. Use this for any new toolkit.

## Objects sit on a line, together

A pooled elliptical shadow under every object is a tell — it is the most
stock-vector thing a sheet can do. The references share **one ground rule**
that reaches both edges of the picture.

But not PAST them: a subject is fitted to its own bounding box, so a rule
running from -14 to 114 made the ground line the widest thing in the drawing
and every object on the sheet came out two-thirds size. The frame is the
overrun.

## Two families

| | marker | pen |
|---|---|---|
| width | ~1.8% of canvas | 0.13–0.44% |
| variation | *within* a stroke (pressure) | *between* runs (2–3 discrete weights) |
| tone | flat colour | hatch, halftone, stipple, scribble, solid |

A pen holds one width along a run; the hierarchy is between runs. That is most
of what reads as "pen", and no amount of wobble fakes it. An object declares
which it is — but it declares it by naming its CLASS, not by retyping the
numbers:

    out[key] = Spec.wrap("product", NAMES[key], build);   // pen, nib, fit
    out[key] = Kit.wrap(label, build, fit, pen, nib);     // only if no class fits

Nothing outside `src/spec.js` should contain a literal pen value. Three copies
of the same nib object were living in three modules when the table was
written, and they had already started to disagree.

## Two registers — scene and elevation

Not every drawing wants a camera. The architectural references are **flat
frontal elevations**, and flat is a convention there, not a failure to find a
perspective: depth comes from small projections drawn flat — a cornice
oversailing the wall, a bay box, an awning. Measured off the Sézane shopfront:

    ratio      0.743 w : h            stroke   0.65% of the drawing's width
    ink        16.0% of its bbox      bays     three, near-equal
    density    even by fifths — an elevation is an OBJECT, so no scene hump
    ink split  55% SOLID BLACK FILL, 45% line

(The `elevation` class in `src/spec.js` carries these numbers.)

**In this register solid black is the subject.** More than half the ink is
filled window panes, and a black pane on a white wall is the whole contrast
structure. "Tone is line density, never fill" is a LANDSCAPE rule — applied to
an elevation it deletes the one thing that makes it read. Decide the register
first, then the tone rule follows from it.

The glazing bar is the **white gap between black panes**, not a line drawn over
them. Author the panes as separate filled rectangles.

> **`curve` defaults to TRUE.** `canvas.html` draws a mark with
> `curve: m.curve !== false`. Every rectangle in the first elevation pass came
> back Catmull-Rom smoothed — windows as rounded buttons, the cornice as a
> lens. Anything with corners must say `curve: false`.
