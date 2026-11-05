# The hand, measurement, craft, underdrawing, live replay

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## The hand

Measured off the references, a drawn line is **not one width** — it varies
about ±40% along its own length. So a mark is a **ribbon** (a filled polygon
up one side and back down the other), never a stroked path: a stroked path has
exactly one width by definition.

Six tells, each a dial: **wander** (low-frequency drift — high frequency reads
as a shaky hand), **pressure**, **overshoot**, **double** (the same path twice,
slightly apart), **breaks**, **blobs**.

- **`boil` is not `wander`.** Wander is the arm; boil is a fast tiny tremble,
  the fingers. A pen has the second and almost none of the first. Boil's
  budget is small — 0.14 of a stroke width is about the ceiling.
- **`taper: [a, b]` is structural**, separate from pressure which is random. A
  leg is thick at the seat and thin at the floor. Drawn at one width, every
  stick reads as doweling and the whole thing reads as a diagram.

## Measurement

**Never copy a photograph's colours literally.** Warm light collapses
everything into one hue band — in two interior references *every* object,
including a blue cushion and a green chair, measured inside 27–51°. Those
numbers describe the LIGHT, and a flat fill has none. Take the
*relationships*; restore each object's identity colour.

Pick the probe by material:

- **Matte** (upholstery, walls, wood): the **lit face** — average the
  brightest sixth. A whole-region average mixes an object with its own shadow
  and returns mud.
- **Glossy** (plastic, ceramic, pencils): the **most saturated** cluster. The
  brightest pixels are the specular highlight, not the object — the lit-face
  probe returned a cream pencil and a grey book.
- **One material at several angles is ONE colour.** The Macintosh's top, front
  and side measured #E8E2D8 / #D3CEC0 / #ADA79B — one plastic. Let the prism
  shading make the difference, not the palette.

**Measure proportion too.** A shoe in side elevation is 2.14 : 1; a Mac 128K
is 0.71 wide-to-tall; a chair back rises about 0.9× the seat width above the
seat. Getting this wrong is why things read as a loaf, a tower, a throne —
and no amount of detail fixes it.

## Craft

- **Trace a profile; do not generate one.** Subjects built from explicit point
  lists read; subjects built from sin/cos land *nearly* right and read wrong,
  over and over. Half the shape, mirrored, so it is symmetrical by
  construction — and **a mirrored half must be REVERSED before it is joined**,
  or the path jumps across the shape.
- **Landmarks must be in the outline.** A shoe drawn as a smooth wedge is a
  doorstop however good the stroke is; the collar notch has to be cut into the
  silhouette.
- **Hierarchy decides what a shape says.** Heel taller than tongue is a
  sneaker; tongue taller than heel is a horn. Same points.
- **Fit the drawing, not its coordinate box**, or a wide flat object arrives
  on screen at a fraction of a square one's size.
- **Some features are depth and need turning.** A wishbone chair's arms sweep
  forward; near-front they project to a flat line.
- **A turn foreshortens width.** A bow can come out a pointed arch purely
  because the rotation squeezed its span. Less turn, not a different curve.
- **Overlap is the only depth cue a flat doodle has.**
- **Draw some of the bricks and imply the rest, or draw every twig and let
  density be the subject.** The middle — half the twigs — is the one that
  doesn't work.

## The underdrawing — roughing out before inking

`?sketch=1` on the canvas, then `d`. Three phases: the subject is **roughed
out in pale pencil**, the ink is drawn over it, and the pencil is **erased**.
`Live.sketch(g)` plays the pencil pass alone, as a loading state.

**This was built once before and rejected.** Keeping it working means keeping
both of the reasons it failed in view (`LEARNINGS.md`, "scribbly MOVEMENT,
not scribbly lines"):

- **Looseness is a LOW frequency.** The first version jittered every point of
  an already dense centreline — about 45 points over a short run — which is
  noise, and reads as spikes and stars. `loosen()` throws the dense path
  away, resamples to **three to seven points far apart**, and moves those by
  a wave of under ~1.5 cycles across the whole stroke. Few points, long
  wavelength. That is the entire trick.
- **A ghost that stays is a halo.** The first version kept every searching
  line to the end and wrapped the subject in grey scribble unrelated to any
  line in it. This one is **structural marks only** (`w >= 0.9`, the same
  threshold `markWeight` uses for an outline) and it **leaves**.

Three more things the build taught:

- **Scale the deviation to the stroke's OWN length** (`min(amp, L × 0.13)`).
  One amplitude for the whole subject turns a 12px sill into a knot — the
  first render had exactly those little tangles wherever a short mark lived.
- **A rough-in CASCADES; it is not the ink loop sped up.** Strokes start a
  beat apart and overlap heavily, and the whole pass fits a fixed budget
  (`roughMs`, default 1700) however many strokes there are. Drawn one at a
  time at ink pace, 104 ghost strokes took five seconds and stopped being a
  rough-in.
- **No nib during the pencil pass.** The nib says "this is the line being
  committed". A search has no single point of attention, and showing one made
  it read as a slow start rather than a fast pass.

Tuning: **`Q.ghostInk`** is the pencil colour (default `#A6BCD2`, a
non-photo blue — it reads as construction rather than as a faint version of
the drawing), and the `0.014` factor in `Stage.build` sets how far the ghost
wanders from the real line. `roughMs` and `eraseMs` are the phase budgets.

**It is OPT-IN (`Q.ghost`), and that is a measurement, not caution.** Building
it unconditionally added 2,416 paths to the canvas and took a redraw from
372ms to 661ms — a 78% tax on every page for a layer that is hidden most of
the time.

> **Not a skeleton-loader job.** `skullet` and friends measure DOM leaves and
> draw grey boxes; every one of them treats an `<svg>` as a single leaf, so
> the whole canvas would come back as one grey rectangle. And there is no
> wait to fill: the draw is 372ms and **synchronous**, so a skeleton could
> not even animate through it. Skeletons are for network waits; this is a CPU
> burst. The drawing drawing itself is the loading state.

## Watch it draw

    canvas.html       press `d` — replays the subject nearest the middle of
                      the screen, stroke by stroke, with a nib
                      `?draw=<key>`  frames a subject and draws it live
                      `&speed=<n>`   tile units per second (default 2600)
                      shift-D        slow, for judging the sequence
    buildings.html    15 buildings, 5 × 3, the cafe in the middle. You
                      arrive on it and watch it drawn; ONE pinch reveals the
                      other 14, staggered outward. Pinch zooms (a trackpad
                      pinch is a wheel event with `ctrlKey`), plain scroll
                      pans. `?level=<n>`, `?auto=0`, `GRID` to rearrange.
    src/stage.js      subject rendering + the replay engine, shared by both
                      pages — one copy of the hand, the masks and the timing

`Live.play(g, opts)` — `solo: false` lets runs overlap (the default stops the
others, which is right when judging one form). `minMs`/`maxMs` bound a
stroke's duration.

**The stroke FLOOR sets a recording's length, not `speed`.** Most strokes in a
building are short and clamp to the minimum, so raising speed barely moves the
total: a 277-mark building took 51.2s at speed 2300 and 45.6s at 6000. At
`minMs: 60` the same drawing takes 34.8s, at 40 it takes 28.6s.

A mark is a ribbon, so it has no stroke to animate — but its **centreline** is
known at the moment it is built, and a thick round-capped stroke along that
centreline, grown with `stroke-dashoffset`, is a mask that reveals the ribbon
in the direction the pen actually travelled.

**Mask with the centreline the hand ACTUALLY drew**, not the control points.
`Hand.beginTrace()` / `endTrace()` return it — resampled, smoothed, wandered,
boiled. Masked with the control points the reveal front runs down a dead
straight line while the ink it is laying wanders up to four units off it, and
the whole thing reads as a plotter rather than a pen.

Liveliness goes in the MOVEMENT, never in extra lines:

- **Scribbly movement, not scribbly lines.** A pen surges and hesitates along
  its own path. The progress is warped by `u + A·sin(2πku)/(2πk)` — the
  integral of `1 + A·cos`, so for A < 1 it is strictly **monotonic** while its
  rate swings either side of average (down to 0.18× at the slowest). Monotonic
  matters: let the progress dip and the ink retreats, which reads as erasing
  rather than hesitating.
- **Do NOT draw construction lines.** An earlier version put two loose
  "searching" passes under every structural stroke and kept them to the end.
  Jittering each point of an already dense centreline independently gives
  high-frequency zigzag — spikes and stars, not a loose arc — and letting them
  accumulate wraps the subject in a grey scribble halo that has nothing to do
  with the drawing.
- **A fill is scribbled in, not wiped.** A downward wipe is a video edit. A
  hand blocks a dark in with a serpentine, back and forth, overshooting the
  edges — so the mask is a zigzag stroked wide enough for its rows to merge.
  The ragged ends are the point.
- **The nib rides a little off the line**, and the hand visibly **lifts and
  travels** to the next start. Repositioning is as much a part of drawing as
  the strokes are.

**Replay order is not render order.** The DOM must go regions → tones → marks
so fills sit under the line work. Replayed in that order a building starts as
eight black window panes floating in empty space. Fills are moved to the end
of the *timeline* while keeping their place in the *stack* — ink the drawing,
then go back and block in the darks.

This is a diagnostic, not a toy: **The authoring order is the drawing order**,
so the replay shows immediately whether a subject was built in a sensible
sequence or assembled at random — and it is how the Tudor's missing ground-
floor wall was spotted.
