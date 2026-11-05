# Doodle — learnings

Appended after every session. **symptom → cause → rule.** Short and causal.
When something here is general enough to change how every drawing is made,
promote it into `SKILL.md` and leave a pointer.

---

## Taste — what the author kept and rejected

- **Rejected: forms built from trig.** Shown five chairs, he kept the two
  built from explicit parts (ladder-back, Adirondack) and rejected the three
  built from sin/cos (Windsor, Wishbone, bentwood) — "the forms are not
  good… need better craft". A parameterised curve lands nearly right and
  reads wrong. Trace a profile.
- **Rejected: flat elevation.** "we are not able to make things which are in
  perspective… so much gap there." Depth is not optional.
- **Rejected: the postcard.** No sheet, no border, no caption — the drawing
  is the whole surface.
- **Wants: one canvas.** Everything on `canvas.html`, with zoom and a
  colour-off toggle. Not a page per piece.
- **Wants: colour that is chosen, not sampled.** Measured palettes are the
  input, not the output.

---

## 2026-10-29 · shoes, chairs, interiors, the Macintosh

**Flat because there was no camera.**
Everything was authored as 2D `[x,y]` and drawn straight to the sheet, so a
sofa could only be a band and a floor a line. → Author in 3D and project.
`src/view.js`.

**A correctly projected box still read as a flat slab.**
All its faces were one colour. → Convergence comes from the camera, *value*
comes from the face normal. Either alone fails.

**A chair back twice as tall as it should be, across all five chairs.**
I invented the proportion. → A back rises about 0.9× the seat width above the
seat. Measure proportion, not just colour.

**A shoe that read as a loaf.**
Built at 3.4 : 1 when the reference measures 2.14 : 1. → Proportion first;
detail cannot rescue it.

**A blue cushion that measured grey.**
Averaged the whole region, mixing the object with its own shadow. → Matte:
average the brightest sixth. Glossy: take the most saturated cluster.

**A cream pencil and a grey book.**
Used the lit-face probe on gloss, where the brightest pixels are the specular
highlight. → Pick the probe by material.

**Every object in two interiors measured inside hue 27–51°.**
Including a blue cushion and a green chair. → That is the LIGHT, not the
objects. Take relationships, restore identity colours.

**Spindles that made a hand fan, then a spider's web.**
Scaled off the bow's spread, then sign-flipped. → A spindle is nearly
vertical, evenly spaced along the seat back.

**A bentwood hoop with a diagonal straight across it.**
Mirrored half concatenated in the wrong direction, so the path ran left-seat →
crown then jumped to the right side partway up. → A mirrored half must be
reversed before it is joined.

**A chair covered in stripes.**
Outlined every face of a rounded footprint. → Outline the silhouette once;
`prism` returns it.

**A bench and a coffee table that came apart.**
Footprints passed as offsets to a prism turned about a far-away centre. →
Absolute coordinates. Worse: three other pieces were *consistently* wrong and
looked fine, so the fault only showed where frames were mixed.

**Palm leaflets lying flat on a wall.**
Built as screen-space offsets off a projected tip. → Anything hung on a 3D
scene must be built in 3D too.

**The canvas showing one tile at 1:1 with `?focus` apparently broken.**
A temporal-dead-zone error in one module threw mid-loop, so later subjects
were skipped *and* the view transform at the end of `draw()` never ran. The
fault was three files from the symptom. → Wrap each subject; check the console.

**Four draw-order bugs from one rule.** Regions → tones → marks:
line over a later fill (desk grain across the books); later fill over an
earlier one (the Mac's base over its body); a filled background that is really
a panel (the workstation wall); the outline of a hidden surface (the Mac's
base lid, two long diagonals across the finished machine).

**A false positive worth remembering.**
A "jump detector" flagged the Mac's silhouette as broken. It was not — a
`soft` footprint only has points at its corner arcs, so its straight edges
*are* long steps. Check what a measurement means before trusting it.

**The reference was not perspective.**
Measured the Macintosh's screen quad: horizontals +24°, verticals 93°, nothing
converging. → One-point perspective cannot draw a box turned to the camera.
Added `View.axon`. Rebuilt, it measures +24.1° / 90.0°.

---

## 2026-10-29 (later) · 50 subjects — 20 plants, 20 furniture, 10 landscapes

**Every leaf came out an ellipse.**
A six-point profile closed with Catmull-Rom has both ends rounded off — the
neighbours pull the curve past the point. → Put a point very close to the base
and another very close to the tip. **A leaf is defined by the two places it
narrows**, and the same is true of any pointed form.

**Detail shot out of the shape it sat on.**
Monstera splits at |u| = 0.84 on a profile whose own maximum is 0.5; aloe
serrations at 0.26 on a 0.22 profile. → Surface detail must be inside the
profile's own width. Check the number against the profile, not by eye.

**A bench and a coffee table came apart, again.**
Footprint offsets passed to a prism turned about a far centre. Already in the
log; it recurred because the helper did not say so. → `Kit.part` documents
that its coordinates are absolute. Write the constraint where it is used.

**An armchair that read as a cubicle.**
Back, arms and seat as separate prisms each draw a silhouette — and a
silhouette is a MARK, so the back's outline paints over the arms that should
hide it. A fifth instance of the draw-order rule. → **Upholstery is one shell
with the seat scooped into it**, not a stack of boxes. Hard carcass work
(drawers, cabinets) is the opposite and wants separate parts.

**Landscapes that looked like dioramas.**
The ground plane's left and right edges were visible, converging, so every
scene sat on a plinth. A landscape's ground has to run off the picture. →
Added `clip` — a subject cropped to its own tile.

**Then everything shrank to a sliver.**
Clipping crops the drawing but the FIT still measured the bounding box, so
widening the ground made the scene shrink to keep its far corners in view. →
A clipped subject declares `frame` and is fitted to that. **Geometry larger
than the frame is the point; the frame must be stated, not inferred.**

**A white band between the ridges and the ground.**
Ridges were based at the horizon LINE. → They meet the ground at a DEPTH, not
at a height: base them at the ground plane and let the ground, authored after,
cover the overlap.

**What landscapes are made of.** Depth is layering, not a vanishing point: a
stack of silhouettes, each paler and higher than the one in front. A ridge
drawn at full strength in the distance flattens the picture instantly.
Anything standing ON the ground still scales by its own depth, so furrows and
paths must run INTO the picture.

---

## 2026-10-29 (later still) · fidelity

**"landscapes are super bad… we somehow need to define the fidelity. if we're
just building a single object, that has to be different than a scene while
looking like a family set."** — The author, and he was right.

**Symptom:** landscapes read as colour charts. **Cause:** they were built
almost entirely from filled bands with no line work, and at uniform density,
so there was no subject and no depth ladder.

Measured two reference drawings: both **3.6–4.2% ink**, both **zero fill**.
Density by fifths runs as a hump peaking in the subject band at roughly double
the average, with the sky nearly empty.

→ Promoted to `SKILL.md` as **Fidelity**: ink density is the family constant,
tone is line density not flat colour, and every scene needs all three rungs of
the detail ladder — one foreground thing at object fidelity, middle structures
with characteristic features only, distance as a repeated token.

**Rebuilding the landscapes on those rules — four more things:**

*A landscape's sky is not sky.* Both references fill their upper frame with
something NEAR and tall — a tree on the left, trees arching over. Without one
the composition is a horizontal strip with empty air above it, which is what
two attempts in a row produced. → Every scene gets a near element crossing the
horizon. It also frames the view, which is the oldest device in the genre.

*The foreground has to be at the FRONT.* At f = 150 with the nearest thing at
z = 14, the whole ground plane projected into a 14-unit band. The ground can
only ever span from the horizon to (horizon + ground height) — to use that
range, put the subject at z ≈ 4 and shorten the lens.

*Alternating a radius in and out gives a star, not foliage.* Five of them
overlapping is a scribble. A cumulus edge is SCALLOPS: keep the base points on
the circle and push only the midpoint of each segment outward.

*Ink is the check, not the eye.* First rebuild measured 0.36% against the
references' 3.6–4.2% — ten times too sparse, and it looked "clean" rather than
empty. Measure the density of what you have made against the thing you are
matching.

---

## 2026-10-29 (final) · the landscapes, and the bug underneath all of it

**"its not even noticable what these scenes are, not noticalbe at all, looks
super bad."** — The author, on the second fidelity rebuild.

**Symptom:** ten landscapes reading as a ruled fan with fragments floating in
it — a circle here, a scribble there, nothing identifiable.

**Cause:** the declared frame was `[2, HOR-46, 98, 76]`, i.e. screen y from
-22 to 54. The ground at z = 50 projects to y = 54. Every foreground subject —
every gate, boat, bench, jetty and bale — sat at z = 3..8, projecting to
y = 66..68. **None of them were ever on screen.** What showed was the far
field at z = 50..150. The "texture gone wrong" at the bottom was the distance
rung, and the mysterious circles were the tops of hay bales cropped at the knee.

→ Promoted to `SKILL.md` as **Framing**. Derive the frame from the camera.
When something you drew is not visible, check whether it is inside the frame
BEFORE redrawing it bigger.

**The expensive part of this is the method failure, not the arithmetic.**
I spent two rebuilds raising ink density from 0.36% to 2.24% toward a measured
3.6–4.2% target. The ink I was measuring was the backdrop. A measurement is
only evidence once you have confirmed it is measuring the thing you think —
and a density figure structurally cannot find a framing fault, because
everything it counts is already inside the frame. The whole time, looking
properly at one tile at 1:1 would have shown the subject was absent.

**The same arithmetic constrains x, and I got that wrong too.** First fix put
big subjects in, still authored out to x = ±260 on a 96-unit-wide frame, and
cropped them all in half. `|x| < 48/s`.

**Thin outline reads as nothing.** Raising density with more hairlines never
made the scenes legible; closing silhouettes and putting hatch inside them did
it in one pass. → Mass, not wire.

**A uniformly hatched shape is a grey blob.** Every crown, bank and bale was
toned edge to edge, so nothing had form and the whole picture sat at one value.
→ Tone the shadow side, leave the lit side white. Promoted.

**A thin pole with a ball on top is a lamppost, not a tree.** The repoussoir
needs a heavy tapered trunk, a real lean, limbs that fork BELOW the foliage,
and a canopy of overlapping lobes spread along those limbs.

**A uniform scatter of identical tufts reads as tally marks.** Grass grows in
clumps: cluster them, vary the blade count, taper each blade.

---

## 2026-10-29 (later) · five architectural elevations

**"too scrapy"** — on the landscapes, with an architectural reference instead.
Landscapes are now switched off in `canvas.html` (`SHOW_LAND = false`, the
module is intact).

**Measured the Sézane shopfront rather than describing it:** ratio 0.743,
stroke 0.65% of drawing width, ink 16% of bbox, **55% of that ink solid black
fill**, three near-equal bays (0.285 / 0.280 / 0.284), density even by fifths.

**The register decides the tone rule, and I had been generalising the wrong
one.** My landscapes were built on "tone is line density, no fill". An
elevation is the opposite: the filled black panes ARE the drawing. Promoted to
`SKILL.md` as **Two registers**.

**Every rectangle came back as a rounded button.** `canvas.html` draws marks
with `curve: m.curve !== false` — curve is ON by default. Nothing in the
subject said `curve: true`; it did not have to. → Check the default, not the
call site. Promoted.

**Flat is not always the failure.** The log already says "rejected: flat
elevation", from the furniture work. That was about furniture pretending to be
a scene. An architectural elevation is a drawing convention with its own
depth cues (cornice oversail, bay projection, awning). A rule learned in one
register is not a rule about drawing.

**Still open:** the mansard block measures 35% ink against the reference's 16%
— ten large black windows on a narrow facade. It reads, but it is the heaviest
of the five and would take either fewer openings or smaller panes.

---

## 2026-10-29 (later still) · the buildings get depth

**"add some perspective to these buildings. straight looks too flat, make them
have some depth."**

The flat elevations were right for the Sézane reference and wrong as the only
option. Built `View.two` — the two-point camera the log has been listing as
missing since the Macintosh. Promoted to `SKILL.md`.

**Validate a new camera on a bare box before building on it.** Four printed
corner coordinates confirmed all three properties in one step: verticals stay
vertical (front-left top and bottom both at sx = 11), the front wall converges
right (VP at sx = 793), the flank converges left (VP at −71). Writing 400
lines of facade first and *then* discovering the yaw sign was backwards would
have cost the whole session.

**`V.face(origin, du, dv)` is what makes a perspective facade writable.**
Detail is authored in (u, v) on the wall exactly as in elevation. The first
instinct — write each window as three-dimensional points — produces a file
nobody can read or edit.

**The convergence is not what sells the depth; the OVERHANGS are.** A cornice
above eye level showing its underside, a sill showing its top, a balcony slab,
a window reveal showing one jamb. In elevation each of those was two parallel
lines. Promoted.

**Five windows at 9 apart on a 46-wide wall merged into one black band.**
Two units of pier between big black panes is not enough separation to read as
separate windows. → A black pane needs generous white wall around it; that is
the contrast structure, not the pane alone.

**Two masses must not share an edge.** The chapel's bell tower straddled the
nave's own corner, so their roof lines crossed and neither read. Set it clear
of the nave and both became legible.

---

## 2026-10-29 · fifteen more buildings, packed tighter

Twenty buildings now, all two-point: shopfront, townhouse, chapel, mansard
block, café, Tudor, brownstone, pagoda, adobe, chalet, lighthouse, windmill,
Art Deco, temple, barn and silo, modernist villa, Victorian, town hall, riad,
water tower.

**One vocabulary is what holds a varied set together.** `Arch._kit` is shared
by both files, so every window, sill, door, cornice and pot is the same object
across all twenty. The FORMS differ — gable, tier, taper, setback, turret,
frame — while the hand, the stroke hierarchy and the black-pane convention do
not. Varying both at once gives twenty unrelated drawings.

**A cylinder hides half of each of its own rings.** Every round form —
lighthouse, silo, turret, water tank, column — had a stray ellipse lying on
the ground under it. Bottom ring: near half only, the far half is behind the
body. Top ring: above eye level you see its underside, so far half only; below
eye level you look down into it and the whole ellipse shows.

**Stack from the ground, not from fractions of the height.** The pagoda's
tiers were placed at 0.00 / 0.34 / 0.66 of the total, which left a gap under
every one — three stacked tables. Let each body start where the one below
ends.

**An eave wider than the body it sits on is a parasol.** Overhang came down
from 0.52 of the half-width to 0.34 before the pagoda read as a roof.

**One face per plane.** The adobe drew holes on `front` AND on a second
`V.face` at the same plane, so every opening came with a ghost beside it.

**Some forms are massing, not facade.** Adobe as a single extruded rectangle
with two windows is a shed in any language. It only read once it was two
blocks of different heights with one stepping forward, beams punching through
the wall, and openings deep enough to go black. Ask what the TYPE is made of
before drawing its elevation.

**A glazed wall must not become a hole.** The villa's ground floor was one
31 × 37 solid black rectangle. Glass reads from its mullions: divide it into
panes with white gaps, exactly like the window panes.

**Fractional col/row just works for tighter packing.** The layout multiplies
col and row by the tile pitch, so `col: (i % 5) * 0.58` closes the gaps with
no plumbing change. A tall narrow building fitted into a landscape tile leaves
wide margins; that is what to close.

---

## 2026-10-29 · live drawing, and what it immediately caught

**"possible to make the agent doodle live on the canvas? want to see how the
agent would perform, like a real illustrator or a sketch artist would."**

Built it. Press `d`, or `?draw=<key>`. Promoted to `SKILL.md` as **Watch it
draw**. Three mechanics worth keeping:

*A ribbon has no stroke to animate — but it has a centreline.* Recording the
centreline at build time makes a mask: a thick round-capped stroke along it,
grown with `stroke-dashoffset`, reveals the ribbon in the direction the pen
travelled. The nib is sampled off the same path with `getPointAtLength`, so it
sits exactly where the ink is appearing.

*A fill is wiped, not outlined.* A pen blocks a dark in; a downward wipe reads
as that.

*Replay order is not render order.* The DOM has to be regions → tones → marks
so fills sit under the lines. Replayed that way the drawing opens with eight
black panes floating in space. Move fills to the end of the TIMELINE, keep
their place in the STACK.

**Headless cannot test an animation, and knowing why mattered.** The first run
showed one stroke and froze. Instrumenting `requestAnimationFrame` gave
`raf: 1` — scheduled once, never fired, because headless has no frame loop.
Polyfilling rAF onto `setTimeout` exercised the identical code path and showed
1 → 3 → 7 → 13 strokes with exactly one masked at a time. **Distinguish a
broken instrument from broken work before changing the work.**

**The replay is a diagnostic.** Watching the Tudor build revealed its ground
floor had no front wall at all — only a jetty line above and a ground line
below. It had been on the canvas looking "a bit incomplete" without anyone
being able to say why. The authoring order IS the drawing order, so a replay
shows whether a subject was built in a sensible sequence.

**Two roofs at right angles.** Tudor and chalet each drew a gable triangle on
the front face AND called `gableRoof`, whose ridge runs along x — so its
gables faced left and right. Two roofs on one building reads as a wireframe
box. Added `gableToStreet` for a ridge running into the picture. → When a form
looks like a wireframe, check whether something has been drawn twice in two
orientations rather than adding more lines.

---

## 2026-10-29 · making the replay look drawn rather than revealed

**"make it feel like an actual illustrator… the lines are scribbly and I don't
want it to appear that the lines are being drawn as a straight line. Add the
texture, some shading, some unpolished scribbly texture."**

**The root fault was real, not stylistic.** The mask was built from `m.pts` —
the CONTROL POINTS — which are straight between vertices, while the ribbon is
smoothed and wandered. So the reveal front and the nib travelled in dead
straight lines while the ink appearing under them wobbled. Measured it: the
real centreline sits up to 4 units off the raw polyline on a 50-unit stroke.
→ `Hand.beginTrace()` / `endTrace()` now return the centreline each pass
actually drew. The mask could also be tightened from 3.2× the stroke width to
2.0×, because it no longer has to cover a path it does not follow.

**A ghost pass is most of the difference.** Two loose, wobblier passes before
each structural stroke. One tidy guess still reads as deliberate; two
overlapping searches read as working it out.

**Construction lines must PERSIST.** The first version faded each ghost as its
finished stroke landed, so the drawing tidied itself up continuously — the
opposite of a sketch. Let them accumulate, let the drawing visibly sit on top
of them, and lose them all at the end.

**A fill is scribbled, not wiped.** A downward wipe is a video transition. A
serpentine mask — back and forth, overshooting the edges by a random amount,
stroked wide enough for the rows to merge — is a hand blocking in a dark. The
ragged ends are why it does not look printed.

**Constant velocity is the tell.** Ease into and out of every stroke, vary
each duration deterministically, and animate the nib TRAVELLING to the next
start. The lift between strokes is as much a part of drawing as the strokes.

---

## 2026-10-29 · scribbly MOVEMENT, not scribbly lines

**"don't want that bg lines to be scribbly, just the strokes which are being
drawn should have a bit of scribbly movement."**

The construction-line idea from the previous entry was wrong twice over, and
it is worth recording as a reversal rather than quietly deleting:

*Independent jitter on a dense path gives spikes, not looseness.* The
centreline already has ~45 points over a short run. Offsetting each one by its
own random vector produces HIGH-FREQUENCY zigzag — stars and spikes. Looseness
is a LOW-frequency deviation; it needs few control points far apart, not noise
on many close ones. (Already in the log as "boil is not wander". Same mistake,
new place.)

*Accumulating them is a halo, not a sketch.* Keeping every ghost until the end
wrapped the building in grey scribble that had no relationship to any line in
the finished drawing.

→ Removed entirely. **The life belongs in the movement of the stroke being
drawn, not in lines around it.** Progress is warped by
`u + A·sin(2πku)/(2πk)` — the integral of `1 + A·cos`, strictly monotonic for
A < 1 while the rate swings either side of average. Verified across every
(k, A) actually used: monotonic, slowest moment 0.18× average. Monotonic is
the whole constraint — let the progress dip and the ink retreats, which reads
as erasing rather than hesitating.

**Adding is the easy answer and usually the wrong one.** The brief was "make
it feel hand-drawn" and the instinct was to add marks. The fix was to take
marks away and change the timing instead.

---

## 2026-10-29 · buildings.html — four at once

A second page that draws four buildings simultaneously, auto-playing on load.

**Extract before duplicating.** The second page needed the same ~250 lines of
subject rendering and replay. Copying them would have meant every later fix
made twice. Pulled both into `src/stage.js`; canvas.html now draws through it
and measured identical afterwards (76 tiles, 5,864 paths, replay still
stepping 1 → 2 → 5 → 9). **Verify the refactor against the old numbers, not
against whether it still looks fine.**

**A module-level token is a single-run assumption.** `Live` cancelled any
previous replay on `play()`, so four calls left only the last one running.
Each run now carries its own liveness flag and `play` only pre-empts others
when asked (`solo`, defaulting to true so the main canvas is unchanged).

**Desynchronise or it reads as a machine.** Four replays at identical speed
tick along in lockstep. A different speed and inter-stroke gap per building
(2300 + i·260) makes the page fill in like four hands working, not one clock.

---

## 2026-10-29 · buildings.html as an infinite canvas

All 21 on one sheet. You arrive close on the centre pair and watch them being
drawn; zooming out snaps ring by ring and the already-finished neighbours come
up with a scale and a fade.

**State the focus, do not derive it.** `ring()` measured distance from
`(COLS-1)/2`, which on an odd grid is a single column — so the centre held one
building, not two. Widening it with a half-unit fudge produced FRACTIONAL
rings (0, 0.5, 1, 1.5, 2.5), so "one level" meant half a ring. Naming the
focus cells outright and measuring distance from that BLOCK gave clean
integer rings and the pair that was asked for.

**Build every tile up front; reveal is opacity and scale, never a render.**
Drawing 21 buildings mid-gesture would stutter, and the premise is that the
neighbours were already there.

**Scale about the tile's own centre.** A group carrying its grid translate
cannot also carry the reveal scale — scaling it sends the tile flying toward
the origin. Wrapper holds the position, inner group does the animation.

**Snapping and free zoom fight each other.** The wheel accumulates toward a
step instead of zooming; otherwise you land between two framings with half a
ring faded in. One gesture, one level.

**Stagger outward or a ring just switches on.** Delay by ring then by distance
from the middle. Measured mid-transition the ten ring-1 tiles read 0, 0.02,
0.06, 0.12, 0.22, 0.37, 0.65, 0.79, 0.89, 0.95 — a wave, which is the
difference between "appearing" and "being found".

---

## 2026-10-29 · the fill, the gesture, and the grid

**A solid fill must be blocked in by the same hand as the outline.**
`tone(..., "solid")` returned `poly(src)` — the geometry exactly, four crisp
corners, a printed rectangle sitting in a drawing where every other line
wobbles. Now the outline is resampled and pushed along its own normal by a
LOW-frequency wave, so panes fray and overrun. `solidRag: 0` restores exact
geometry. Two details that mattered:

*Low frequency, again.* Per-point noise on a dense outline gives a sawtooth.
This is the third time that mistake has appeared in a new place (boil vs
wander; the construction lines). **Looseness is few control points far apart,
never noise on many close ones.**

*Zero-mean the offsets.* Four cycles of a wave around a closed loop do not
average out, so the whole fill drifted to one side — a pane that was ragged
AND visibly off its own frame. Fraying is wanted; shifting is not.

**One gesture, one level.** A `cooling` flag cleared when the animation
finished was not enough: a trackpad emits wheel events for about a second
after the fingers lift, so the momentum tail arrived after the cooldown and
stepped again — one long scroll travelled two rings in two visible phases. A
gesture is now defined by its SILENCE (events closer than 170ms are one
gesture) and once one has moved a level the rest of it is swallowed.

**A test that cannot fail is not a test.** The first sensitivity check set the
idle window to 0ms to simulate the old code — but a 0ms timer fires BETWEEN
wheel events and resets the accumulator, so it could not double-step either,
and the check passed for the wrong reason. Reconstructing the actual old
guard (busy-flag only) reproduced it: one flick → level 2, versus level 1
shipped. **Before trusting a passing test, make it fail on purpose.**

**Spread is `fit` and `gap`, not tile size.** Shrinking the tile changes
nothing — the drawing is fitted TO the tile, so the whitespace shrinks with it
and the picture is identical at a different zoom. Filling more of each tile
(0.86 → 0.97) and cutting the gutter is what closes the distance.

**21 has no good rectangle.** 7 x 3 is a strip at 2.5 : 1. 5 x 5 with the four
corners left empty is 1.04 : 1, and the gaps being SYMMETRIC is what stops
them reading as an accident.

---

## 2026-10-29 · making the zoom-out feel like one move

**Zoom is a RATIO, so interpolate it geometrically.** Lerping k linearly from
0.62 to 0.22 spends the first half of the tween covering most of the perceived
distance and the second half barely moving. `k = k0·(k1/k0)^u`, with the
world-space point under the screen centre carried linearly, pulls back at a
steady rate and settles. Measured per-frame ratio afterwards: 0.98 → 0.79 →
1.00, a clean symmetric ease.

**Time the reveal wave to LAND WITH the camera.** Finish the camera first and
the neighbours visibly catch up afterwards — the two-phase feeling again, in
miniature. Last tile starts at `STAGGER_IN + (n-1)·STAGGER` and runs for
`REVEAL_MS`; for 14 tiles that is 1206ms against a 1250ms camera.

**A step is not over until the last tile settles.** Resolving on the camera
alone let a second gesture land in the middle of the wave.

**Pinch is a wheel event with `ctrlKey`.** That flag is the only thing
distinguishing a trackpad pinch from a two-finger scroll. Treating every wheel
event as zoom means you cannot scroll past a canvas without changing its
state. Pinch zooms, plain scroll pans.

**Fifteen reads at one remove; twenty-one did not.** 5 × 3 with the subject in
the middle shows everything in a single move. Chosen for silhouette spread —
tiered, round, gabled, half-timbered, columned, crenellated, latticed, modern
— rather than for completeness.

---

## 2026-10-29 · a band on a drum is half visible too

**Rejected: barn and Tudor.** "These do not look good at all." Both swapped
out of `buildings.html` for the mansard block and the stepped-gable townhouse.
They remain on the main canvas; the Tudor's roof and the barn's gambrel still
want work.

**The half-ring rule applies to every ring on a cylinder, not just the ends.**
`drum()` already drew its top and bottom as half ellipses, but every
INTERMEDIATE band — the windmill's taper lines, the silo's hoops, the water
tank's seams, the lighthouse's band edges — was drawn as a full closed ellipse,
so each one's hidden back half ran straight across the front of the tower.
Fixing a rule in the helper does not fix the call sites that bypass it; grep
for the pattern, not just the function.

**`animate: false` must be instant for everything in the step.** `goTo(lv,
false)` jumped the camera but still ran the tiles' reveal tweens, so loading
straight to a level arrived mid-fade — and anywhere without a frame loop, blank.

**A screenshot of an animation needs the frame loop.** Rendered one capture
without the rAF polyfill and got a nearly empty page; the instinct was that
the swap had broken the grid. The page was fine. Second time this session the
harness has been the broken thing — check the instrument first.

---

## 2026-10-29 · the reveal needs real travel

**"too subtle, not visible at all."** The tiles grew from 0.9 to 1.0 — 11%,
and happening at the same moment the camera pulls back, which swamps it
entirely. Now 0.42 → 1.0, a 2.4× growth. **A motion that competes with a
camera move has to be large enough to be read as separate from it.**

**Scale and opacity want different curves off the same clock.** Opacity
settles early (easeOut) so the tile is legible while it is still travelling;
scale overshoots ~2% and settles (backOut) so it LANDS rather than creeps. One
curve for both reads as a dissolve, not an arrival.

Measured through a step: 0.47 → 0.51 → 0.69 → 0.87 → 0.98 → 1.02 → 1.00.

---

## 2026-10-29 · smoothness, and what actually costs time

**Kept: filled panes.** Tried replacing them with frame + sash + glazing bars
for a shorter recording; the author preferred the fills. The switch survives as
`ArchOpts.fillPanes`, default true. Three windows a row on the cafe front
instead of four — four crowded them, and a black pane needs white wall around
it to read.

**`visibility: hidden`, not opacity 0, for anything off-level.** A transparent
element is still rasterised. At level 0 that was fourteen finished buildings —
a couple of thousand paths — being painted every frame behind a drawing trying
to animate. Measured after: 1 of 15 tiles painted instead of 15. That is
exactly the state the live drawing runs in, so it is the one that has to be
cheap.

**`will-change` is a lie unless something is changing.** Set it when the tween
starts, clear it when the tween ends. Left on permanently it costs memory and
stops helping.

**A tween's promise resolves a frame before its cleanup runs.** The step
resolved on the scheduled `revealEnd`, but each tile drops its transform and
clears `will-change` on the frame AFTER reaching u = 1 — so exactly one tile
was always mid-cleanup when `busy` cleared, and a fast second gesture could
land in the tail of the wave. Measured: 1 tile unsettled at resolve, 0 at
+150ms. Two frames of margin closes it.

**The stroke FLOOR sets a recording's length, not `speed`.** Most strokes in a
building are short and clamp to the minimum, so raising speed does almost
nothing: 51.2s at 2300, 45.6s at 6000. 277 marks × a 110ms floor IS the
running time. `Live.play` now takes `minMs`/`maxMs` (defaults unchanged); at
minMs 60 the same drawing takes 34.8s, at 40 it takes 28.6s.

**I cannot measure frame rate headlessly.** rAF does not fire without a
compositor, and the polyfill ticks on setTimeout, so every "smoothness" claim
here is about work avoided per frame, not about measured fps.

---

## 2026-10-30 · ten more plants (src/plants2.js, plants.html)

**Flowers and fruit are blades WITHOUT a midrib.** `Kit.leaf` always draws a
rib; on a petal, spathe, pad or lemon that rib makes it read as a leaf.
`blade(..., rib=false)` in plants2.js is the generic shape-on-an-axis.

**Symptom → cause → rule, from the first render:**
- Lavender read as grapes → round florets at 2.6 units. → Spike = many small
  NARROW petals (12 × ~2 units) hugging the stem at ±26°.
- Bird of paradise leaves read as lollipops → `paddle` at length 17 is round.
  → An oblong leaf is `lance` widened, not `paddle`.
- Lemon crown read as a wreath → leaves scattered on a disc and aimed outward
  leave the middle empty. → Put a dark filled mass behind the crown first and
  aim the inner leaves at random.
- Orchid leaves read as discs → `oval` at wide 1.15. Splay them at ±60–100°,
  wide 0.72.
- A fan of 5–7 leaves from ONE point reads as an umbrella (jade still does,
  a little). Spread the leaf bases along the twig next time.

---

## 2026-10-30 · the skill was not up to date, and nor was my verification

Asked whether the skill was current. It was not, and checking properly turned
up something worse than stale docs.

**`SKILL.md` had drifted a generation.** The file map said "two cameras" when
there were three, claimed everything lived on one canvas, and listed neither
`stage.js`, `kit.js`, `arch.js`, `arch2.js` nor `buildings.html`. The whole
architecture layer — twenty-one buildings, `Arch._kit`, `massing`, `windowF`,
the half-ring rule, `ArchOpts` — was absent, so anyone picking the skill up
would have rebuilt it from nothing. The FRONTMATTER was stale too, which
matters most: it decides whether the skill fires at all, and it mentioned no
buildings, no two-point perspective and no live drawing.

**`README.md` was a generation behind** and still had a "Two cameras" heading
contradicting the three that exist.

**A COUNT IS NOT A CHECK.** All session my verification printed
`tiles: 76` — a number nothing was compared against. The canvas actually holds
86 subjects. Ten were missing from every figure I reported and I never noticed,
because the number looked plausible and no assertion existed to contradict it.
Re-running now gives 86 consistently; I could not reconstruct when it diverged,
and `the workspace` is not under git, so there is no history to consult.

→ `bin/check.sh` now ASSERTS: every subject in `SUBJECTS` / `CELLS` rendered,
no NaN in the output, nothing on the console, non-zero exit on failure. Run it
after any edit.

**And: do not report a repo listing from memory.** I stated the file list from
an earlier truncated `ls` and was wrong twice — `plants.html` and
`src/plants2.js` existed the whole time.

**"these doodles are terrible, no personality… the buildings' strokes and
stroke weights are better. plants are way thin."** — The author, 2026-10-30.
- Cause: plants ran pen 0.15 × weight 15 with leaf outlines on TEX 0.48 —
  about a third of the buildings' line (pen 0.3 × weight 26). → Plants now use
  the building scale (OUT 1.0 / DET .72 / TEX .64, building NIB).
- Personality came from the buildings' CONTRAST, not wobble: solid black soil
  and a hatched shadow side on every pot.
- A heavier pen needs FEWER, BIGGER parts. 26 overlapping crown leaves = 26
  outlines over every fill = a tangle. A crown is one scalloped silhouette
  (each scallop a 4-point arc, not a spike), a darker crescent FILL for shade
  (hatch tones draw over later fills — they ran across the lemons), V-ticks
  to imply leaves. Peace lily, agave and jade still show outlines through
  their overlaps; same fix applies if he flags them.

---

## 2026-10-30 · fifty flowers (src/flowers.js, band under the plants on plants.html)

- **One FRAME for the whole set** (`o.frame`), not fit-to-bbox: a snowdrop is
  short and a foxglove tall, and that height IS information. Fit each to its
  own box and all fifty come out the same size.
- **Archetype × landmark, not palette.** Seven archetypes (radial, scalloped
  mass, nested annuli, cup, bell, trumpet, spike) and per-species landmarks:
  notched cosmos, fringed cornflower, droop off a black dome (susan), corona
  ticks (passionflower). A recolour is not a new flower.
- **Layered heads = concentric ANNULI over a backing disc** (dahlia, mum,
  camellia, zinnia). Each ring's petals live in their own band, so no outline
  crosses a fill in front of it — the general fix for "outlines over fills".
- **A toolkit's `at(u,v)` must answer in the SAME space its callers use.**
  Blade returned screen coords while line/dot took world coords — every
  detail placed off a petal would have landed 50 units away. Make helpers
  round-trip.
- **Droop can't move a petal that points straight up** (sin 0 = 0) — it
  stays, poking out of the cone. Skip petals the raised centre hides.
- Ribs on overlapping petals (lotus) multiply the overlap scribble; petals
  that overlap get NO rib. Rows of tiny leaves read as beads — one leaf with
  ticks reads as a cut leaf.
- `bin/check.sh` now also checks plants.html (60 = 10 plants + 50 flowers).

---

## 2026-10-30 · the first scene that works — riverside reader (src/scenes.js, scene.html)

- **Scenes now use the APPROVED register** (flat colour + heavy line + black
  contrast + shadow-as-darker-fill), not "line density, no fill", which he
  rejected as scrapy. It read on the first render.
- **`hide(pts, occluders)` = occlusion for marks.** Densify the line, cut it
  wherever it is inside any silhouette in front. Build every foreground
  silhouette FIRST, then each back layer's lines are clipped by everything
  nearer. This removes the "outline over every fill" rule's worst case in a
  scene — ridges across trees, a pine down a face.
- Every layer's occluder list must include ALL nearer things, including small
  ones: a pine token's outline ran straight down the reader's face until the
  head was added to its list.
- **Shade faces must be diagonal facets** (peak → valley → foot part-way
  along). A shadow band with a vertical left edge reads as a pillar; flat
  colour hill shades with vertical edges read as blocks.
- **Limbs fork just under the crown.** A long bare limb below the canopy is a
  pole.
- **Check what overlaps the subject's head.** A mid-distance tree crown sat
  exactly behind it — tangency clutter. Move mid-rung things clear.
- Person-reading-newspaper legibility = open broadsheet covering the torso,
  black headline bar + hatched photo, hands at the edges, cap + two eyes
  peeking over the top, crossed legs below. The paper IS the subject.

---

## 2026-10-30 · "flowers too scrappy, lacking details" → promoted to SKILL.md

Diagnosed at 1:1 on daisy/rose/tulip/poppy before touching code. Scrappy was
four things: black-stick stems, heads ~1/8 of the height, outlines crossing
the petals in front (rose = smiley face), zero surface detail. Plus a bug:
the poppy's seed pod was invisible — black blotch was a TONE, which renders
over every region. Fixes, all in the toolkit so all 50 changed at once:
deferred occlusion (`flush()`), ribbon stems, `t.head()` scale, auto leaf
veins + petal base shading + creases, black fills as ink REGIONS, rose and
poppy rebuilt petal-by-petal. Then: white petals went grey under the base
shading → pale fills get 0.96. A head scaled about its centre detaches from
a stem that ends at its base (calla) → scale about the attachment point; and
`head()` must come AFTER anything that is not head (daffodil's sheath).
→ New SKILL.md sections: "Plants and flowers — the botanical toolkit",
"Detail — what 'scrappy' means"; Draw order now names the two occlusion
patterns; Fidelity rule 1 marked superseded by the approved register.

---

## 2026-10-30 · ten retro devices (src/retro.js, retro.html)

- **Products = orthographic camera with yaw + pitch** (`kit(k, {yaw, pitch})`),
  not cabinet-oblique: oblique leaves the front face crisp but turns every
  circle on a receding plane (platter, record, joystick base) into a skewed
  egg. A real rotation keeps verticals vertical and circles true ellipses.
- **The flowers' deferred occlusion generalises to 3D** with one primitive:
  `prism(convexBase3D, extrusionVec)` → fills visible sides + visible cap,
  one hull outline, creases only where a visible side meets the cap or turns
  > ~35°. Everything else is `flat`/`raise` on a `plane(o, du, dv)`. Keys on
  a sloped deck, knobs on a front, a tonearm post on a plate — same call.
  Worked first render for all ten.
- **Cut a line only when it is DEEP inside a later fill** (edge distance >
  0.22). A band flush with a body's edge otherwise chews that edge to dashes.
- **Ink parts need no occlusion** (d-pad as two crossed ink bars).
- A wide accessory beside the subject (joystick, headphones) shrinks the
  subject in its tile — put it IN FRONT, overlapping, not alongside.
- Shade >1 is allowed (`Stage.shade` multiplies and clamps): tops 1.08,
  fronts 1.0, right flanks 0.72 keeps the identity colour on the face that
  carries the detail.

## 2026-10-30 · retro devices → Rive (~/Projects/retro-rive)

- **Export the hand, don't redraw.** `bin/export-retro.sh` rebuilds each
  subject with `Retro.EXPORT` on and dumps the exact ribbon polygons
  (`Hand.region`/`Hand.mark`, M/L/Z only) in tile coords; `gen.py` writes them
  as Rive PointsPaths. Rive file looked identical to retro.html first build.
- **Parts are a toolkit feature**: `t.part(name, {pivot | plane+at, top, clip})`
  tags fills and queued lines; `t.extra(fn)` draws export-only things (second
  TV channel, static, notes, flash). HTML untouched unless EXPORT.
- **Spin in the plane, not on the sheet**: store the plane's 2×2 projection,
  invert it for the vertices, rebuild it in Rive as R(a)·S·R(b) (SVD) nodes.
  Reels and the record label rotate correctly on foreshortened faces.
- **Moving parts vs baked occlusion**: a part that moves must not cut other
  parts' lines (they'd show gaps when it moves) → `top` parts skip occluding
  others and are layered above all static lines in the export. A part that
  slides out from behind something (the print) gets a clip instead.
- Layering in Rive = static fills → static lines → each top part; Rive paints
  the FIRST declared on top, so emit reversed.
- **Viewing many Rive artboards = one canvas, many `align`s.** The native
  previewer's layout fit cropped the 5×2 gallery ("looks broken"). The fix is
  an infinite canvas on @rive-app/canvas-advanced: one window-sized canvas,
  per device `renderer.save(); renderer.align(Fit.contain, Alignment.center,
  screenRectOfCell, artboard.bounds); artboard.draw(); restore()`. Vector-sharp
  at any zoom; captions/grid drawn on the same 2D context around flush().
- `bin/export-retro.sh` cds into the workspace — always pass an ABSOLUTE out
  path, or the json silently lands in the doodle folder and nothing changes.
- Five more devices (typewriter, projector, alarm clock, transistor radio, VCR):
  a VHS tape sliding INTO a slot is clipped to the slot's mouth swept toward
  the viewer (`clip3`: hull of the slot rect at z=0 and z=-90) — the visible
  part of anything passing through an opening is that fixed screen region.
- **Secondary action needs a clear background.** Ink music notes vanished
  over the black record and read as clutter over the boombox's dial — start
  them on paper, above the subject, and make them big (1.6–2× a detail).
- **Export-only extras must not change the fit**: the exporter measures the
  bbox WITHOUT extra parts, or a flash/notes/beam shrinks the device.
- **Anything that moves needs room to move inside its artboard**: the
  typewriter carriage's travel was keyed from the rest pose and slid off the
  edge — centre the travel on the rest pose; don't clip device artboards.
- A machine part that sits ON another (typewriter carriage over the keys)
  must be lifted clear in y, or it covers the top rows.
- `rive docs` reads a `docs/` folder relative to where it runs; from ~ it
  printed Homebrew's docs. Read ~/.rive/versions/<v>/docs/*.md directly.

→ Promoted 2026-10-30: the retro/product + Rive entries above now live in SKILL.md as "Products — the retro toolkit" and "Animating — doodle → Rive"; Working method gained step 7 (new subject that should move).

## 2026-10-30 · five more devices (jukebox, camcorder, synth, oscilloscope, calculator)

- Built straight through the skill's "new subject that should move" path:
  draw with parts tagged → beats → export (absolute path) → gen → verify →
  frames. All five worked first export; only two drawing fixes.
- A clip only exists in Rive: the scope trace spilled out of the tube on the
  HTML page. Branch on `t.EXPORT` (wide trace for the clip, short in-tube
  trace for the page).
- Readouts are STATES: one part per value ("0", "7", "78", "789", "2",
  "1578"), opacity holds via `onoff()`. The base state (the one the page
  shows) is a normal part; the rest are `extra`.
- Flat devices read from above need pitch ~50 or they arrive tiny (synth).
- Negative yaw is fine — it shows the LEFT flank (camcorder lens face).

## 2026-10-30 · the café street — a perspective scene, interactive in Rive

- **The product toolkit takes `cam.persp`** (View.two options): P is the
  perspective projection, visibility is tested against the real EYE
  position (`[d·sin yaw, 0, -d·cos yaw]`), a plane part's affine is the local
  slope. Scenes can now be built with the same prism/plane/part vocabulary
  as products, and they export to Rive.
- **Eye at a storey (GND 26), camera close (dist 120, f 210)**: at true eye
  height and distance the pavement collapses to a sliver.
- **A cornice is a thin strip, not a full-depth slab**: above eye level the
  slab's whole underside shows as a giant parallelogram. And a wall hidden by
  a neighbour (the café's flank) must not be drawn — front-only `flat`.
- **Walkers rest MID-STRIDE** (legs apart, arms opposite) so the page reads
  as walking; Rive swings the limbs about that pose. Tracks
  (`track: [[f, dx, dy, dz]]`) carry perspective scale. Rest positions can be
  off the page — extra walkers that only exist in motion.
- **Layers matter in an animated scene**: `t.layer()`; walkers between the
  café and the kerb trees. Moving parts' lines are cut only by their own fills.
- **Night = two overlays**: a strong dusk + glows just above the buildings and
  BELOW the people; a light dusk over everything at the end. One overlay with
  glows on top paints the window over anyone walking past it.
- **Interaction recipe that worked first time**: view model (bools for
  toggles, triggers for one-shots); one SM layer per touchable thing
  (toggle: two hold states + both transitions; one-shot: idle → go with
  `reset`, exit-time back); listeners on TRANSPARENT hit rects (alpha-0 fill
  hit-tests fine); a moving target's hit rect lives inside its moving node.
  Verify with `rive . --pointer=click@x,y --data-dump=-` — it reads back the
  toggled values; screenshots after a click show the one-shots.
- `bin/export-retro.sh /abs/out.json <page> <Module> <tileVar>` exports any page.

## 2026-10-30 · "don't crop the edges — make it a diorama"

- **Diorama = raised eye + finite block + no frame.** `persp.lift` raises the
  eye (level camera, verticals stay vertical) so roofs show; the ground is a
  box with soil sides; buildings are whole boxes with rooftop clutter; no
  `frame`/`clip`, fit to the bbox. Rejected: a street cropped by the frame.
- **Pull the camera BACK for a diorama** (dist 380, f 600, lift 150 ≈ 22°
  down). At dist 150 the near road ballooned and the buildings shrank away.
- **Painter's order across neighbours**: with the eye to the left, draw the
  right building, then the café, then the left building LAST — it covers the
  café's side wall, which it really hides.
- **Things that travel fade at the block's edges** (opacity keys around each
  track wrap) instead of walking off into the paper.
- **Camera-facing sky plane** (`du = [cos yaw, 0, sin yaw]`): on a wall plane
  the sun is an ellipse.
- **A dusk overlay is an artboard-wide rectangle in the GENERATOR**, not a
  wall in perspective (it left the corner lit). The web page reads `night`
  from the view model and fades its own background to the composited dusk
  colour, so the artboard never shows as a box.
- Web taps: map client → artboard (`(x - tx) / k`), `sm.pointerDown/Up`; guard
  `setPointerCapture` (throws for synthetic events). Headless Chrome barely
  advances rAF time — read the view model (title) to verify, not pixels.

## 2026-10-30 · devices 21–25 (lava lamp, fan, beige PC, slide projector, console)

- Straight through the pipeline again; first export worked. Used the
  principles we'd skipped: ANTICIPATION (carousel winds back 0.05 rad before
  each click), OVERSHOOT (floppy and cartridge seat past their stop, settle),
  SQUASH (lava blobs alternate wide/tall as they travel).
- A round object on the sheet (lava lamp) = flat profiles on the front plane
  with a darker crescent strip on the right — no prism.
- Don't put a spinning part's scale/oscillation on its Spin node: T·R·S
  squashes in the ROTATING frame. Sway the fan head by translating instead.
- Export-only extras that leave the device's bbox (fan "wind" lines) spill
  into the neighbouring cell on the gallery canvas and read as belonging to
  it. Keep extras inside the subject's own footprint.
- A carousel loop must turn a multiple of its visual symmetry (4 red slots →
  90° = 5 clicks of 18°) or the loop jumps.

## 2026-10-30 · devices 26–35 (pinball … vending machine)

- Ten in one pass, first export clean. Gravity (ease-IN fall) + a squash on
  landing reads instantly (vending can, toaster pop).
- **Things that live INSIDE a box on the page need the box drawn after them**
  (cash-register drawer tray first, cabinet, then the drawer front) — the Rive
  clip only exists in Rive; on the page painter's order has to hide them.
- Readouts and flags that rise out of a box get a clip ABOVE the box's lid.
- At 35 devices the .riv is ~2 MB (113k vertices) — the next size lever is
  RDP tolerance per device, then key thinning.

## 2026-10-31 · classes, and the drift nobody could see

The author: the skill had one set of hand parameters for everything, so "a water
bottle or a coffee mug would have very different doodle properties compared
to a whole landscape scene or a building" — and there was nowhere to say so.
Also: the skill should cover any form a user arrives with, storyboards
included, not just "draw me a subject".

- **A class owns the hand; a page owns the paper.** Weight, nib and fit were
  being decided per MODULE and per PAGE. The same ten plants drew at
  0.30 × 15 = 4.5px on canvas.html and 0.30 × 26 = 7.8px on plants.html —
  approved on one page, 1.7× lighter on the other, for a week. canvas.html
  was the only page not at the house weight; it is now `Spec.REF`.
- **The same bug a second way: a module's own nib silently overrides the
  page.** `plants.html` and `scene.html` work around it by passing
  `nib: null`, so the flowers and the riverside scene were judged FIRM on
  their own pages and drawn with Kit's default PEN on the canvas. Whichever
  nib a set was APPROVED under is the class's nib.
- **Three copies of the same nib object** were living in arch.js, retro.js
  and plants2.js, and had already started to disagree. One table, imported.
- **A guardrail nobody can check is a paragraph.** `Spec.audit(mod, cls)` +
  `bin/check.js` now fail any page carrying a module that has drifted off
  its declared class. Proven with a red/green cycle before being believed —
  the previous verification lesson was that a number nothing compares
  against is not a measurement.
- **Legacy weights are recorded, not copied.** `furniture` (0.16) and
  `interior` (0.15) sit at half the house weight because they predate the
  heavy register. The table says so out loud rather than pretending they are
  a deliberate lighter class.

### Storyboards (src/board.js, board.html)

- **A panel CROPS; every other subject here is fitted to its own bbox**,
  which is the exact opposite of a shot. That one difference is most of what
  had to be built.
- **Shot size is the detail budget**, quoted as subject height ÷ panel
  height so a close-up of a wide object still fills the frame. But a
  diorama's bbox is mostly ground, so a true `ews` of its own height left a
  dot — quote the size against what has to read.
- **Clip the geometry, not the SVG.** Stage's clip-path is the tile's fit
  box, and a panel's frame is only the top of its card; a clip big enough to
  show the caption let a four-storey café draw straight across its own rule
  into the panel below. Geometric clipping also means the pen never travels
  off-panel, so the live replay draws what the panel shows.
- **Measure the caption's own start.** A guessed 6.5 units printed
  `01THE STREET`. `Letter.write` returns its advance width.
- **A page hosting several modules needs the UNION of their palettes.** An
  unknown key falls through to the raw string, which is not a colour, which
  renders black — the armchair came out a silhouette and looked deliberate.
- Camera moves and ACTION arrows must differ in weight, or a board stops
  saying which one it means.
- `b` replays the board in read order. Six panels at once tells you nothing
  about the cut.

### Still open

Two subjects are broken independently of any of this. Both were found by
rendering `?focus=<key>` while checking the weight change, and both render
identically at the old weight — so neither is a regression:

- `Furniture2.armchair` — the legs float clear of the body, and the
  upholstery fill shows vertical banding.
- `Plants.monstera` (the LEGACY ten in `src/plants.js`, superseded by
  `plants2.js`) — the leaves come out as one green blob with stray lines
  across it; no leaf shapes survive. Worth checking the other nine before
  trusting that set.

## 2026-11-01 · the underdrawing, and the reversal of a reversal

The author asked for a pre-doodle state that "looks like doodling itself". That is
close to the construction-line idea rejected on 2026-10-29, so the first job
was to find out exactly WHY that failed before rebuilding it. Both causes were
in this log, and both were designed against.

- **Looseness is a LOW frequency, and that means FEW POINTS.** The failed
  version jittered each point of a dense centreline (~45 points over a short
  run) — noise, read as spikes. `loosen()` resamples to 3–7 points far apart
  and moves those by under ~1.5 cycles across the whole stroke. Same rule as
  "boil is not wander", third time it has bitten.
- **A ghost that stays is a halo; this one leaves.** Structural marks only
  (`w >= 0.9`), and the pencil is erased once the ink is down. The difference
  between an underdrawing and a halo is entirely whether it goes away.
- **Scale the deviation to each stroke's OWN length** (`min(amp, L × 0.13)`).
  One amplitude for the subject turned every short mark into a knot. Caught by
  rendering the ghost alone and looking at it — invisible in the composite.
- **A rough-in CASCADES.** Strokes overlap and the pass fits a fixed budget
  (`roughMs`) whatever the count; at ink pace 104 ghost strokes took 5s and
  stopped being a rough-in. **No nib** during it: a search has no single point
  of attention.
- **Opt-in on a measurement.** Always-building the ghost added 2,416 paths and
  took redraw 372ms → 661ms (+78%). Gated on `Q.ghost`, re-measured at 374ms.

### Measuring anything in headless Chrome

`--virtual-time-budget` FREEZES the clock, so `performance.now()` and
`Date.now()` both returned 0 around a 13,458-path redraw and three runs read
`[0,0,0]`. Not coarsening — virtual time. Real numbers needed real Chrome
driven by playwright. Related to the known "headless barely advances rAF":
**any timing or animation measurement here needs playwright, not `--dump-dom`.**

- `cp -R src /tmp/` when `/tmp/src` exists creates `/tmp/src/src`, so a test
  page silently loads the OLD module and the fix "has no effect". Two renders
  were compared before the md5s showed the first pair was stale. `rm -rf` the
  destination first, or `cp -R src/. /tmp/src/`.

### Skeleton-loader libraries do not apply here (skullet, evaluated)

Its leaf walk stops at `localName === "svg"`, and every rule is guarded
`:not(svg *)` — our canvas would be ONE grey rectangle. And there is no wait:
372ms, synchronous, so a skeleton could not animate through it. **Skeletons
are for network waits; a doodle is a CPU burst.** The drawing drawing itself
is the loading state.

## 2026-11-01 · the thatched cottage (arch2, #21)

A traditional UK countryside house. Four render-and-look rounds, every fault
found by looking, none by reading the code.

- **The type is the ROOF, and the roof is a mass.** Thatch has 300–400mm of
  depth, so its eave is a cut band you see the end of, never one line; it is
  hipped and rounded with no verge or barge board; and the eave SWEEPS UP
  over each dormer. That sweep is the eyebrow and it is the whole
  identification. Windows and door do no work here at all.
- **Proportion first: wide and low**, walls a third of the height. Drawn at a
  townhouse's proportions it is a cottage-roofed villa and no amount of
  thatch texture rescues it.
- **`eave()` answered in WORLD y and was passed to a face whose v runs down
  from TOP.** Every dormer landed at a height nobody chose, with the sweep
  running UNDER the windows instead of arching over them, so they read as
  floating on the roof. Same lesson as the flowers' `at(u, v)`: *a helper
  must answer in the space its callers use.* Convert once, explicitly.
- **Bell width is the whole eyebrow.** Narrow tall bells returned the eave to
  the baseline between dormers and the roof hung in swags like bunting;
  fattened until the tails overlapped, all three merged into one bow and the
  house read as two storeys under a sagging eave. Separate bells, valleys
  reaching the base eave, and the window STRADDLING each arch — head under
  the crown, sill below the base eave — is what makes it a dormer rather
  than a first-floor window.
- **Half-drawn texture is the one option that never works** (already in the
  log as bricks-vs-twigs; new place). Short ticks near the eave left the
  slope a blank triangle half the drawing tall. Thatch IS a combed surface,
  so draw the whole rake at the finest weight and let density be the subject.
- **Marks have no occlusion, so texture must be clipped by hand.** The
  combing ran past the hips and stood in the sky beyond the roof's own edge,
  and drew straight through the brick stack. Range-limit it and skip the
  stack's x-span.
- **A stack is buried against the roof surface AT ITS OWN z, not the ridge.**
  Based relative to the ridge, the shaft hung in mid-slope as a stray
  vertical. At the stack's front face the slope is ridge + 0.318 of the drop
  to the eave; the base goes just under that.

**`raw.html` is wired only to `objects.js`**, so the skill's "geometry first,
no hand" step is not available for architecture. Worth fixing; the loop used
here was `canvas.html?focus=` with the hand on.

---

## 2026-11-01 · ten still life elements (still.js, still.html)

Jug, roemer, pewter plate and herring, loaf, half-peeled lemon, skull,
hourglass, books, candlestick, grapes. Class `object`. Four render rounds; the
lemon took four by itself and was rewritten rather than patched.

**No camera.** The `object` class says it outright — *"a round object drawn as
a prism turns every circle into a skewed egg — use flat profiles on the front
plane with a crescent on the right"* — and eight of these ten are solids of
revolution. So the whole module is authored on the picture plane: a half
profile mirrored for the silhouette, an ellipse at every opening, a crescent
down the shaded side. One constant, `Q = 0.30`, is the squash of every
horizontal circle, and it IS the height of the eye above the table. One value
for all ten or they stop sharing a viewpoint.

**A band round an opaque body is the NEAR HALF only.** Drawn as a full ellipse
it is a full ellipse — marks have no depth occlusion — so the far side of
every throwing ring came back over the front of the jug as a loop. Only the
MOUTH of an open vessel is a whole ellipse, because there the far lip really
is in view. New helper: `band(k, prof, y, w)`, which also reads the radius off
the profile instead of trusting a guessed one.

**A liquid surface is limited by the opening, not by the belly.** The roemer's
wine was sized from the bowl's widest point and drew a disc wider than the
mouth it is seen through. On any incurved vessel the opening is the narrowest
thing above the liquid, so it is the opening that clips it.

**A crescent needs two curves.** Selecting the silhouette points right of a
vertical line cuts a straight seam down the middle of the form — the skull got
a visible join down its face. A terminator is a curve running *inside* the
limb, so the shade is bounded by the limb and by that curve. And the inner
curve must not inherit the outline's features: run through the lemon's own
`skin()` it picked up the two nubs and the shade grew a thumb.

**A skull does not taper, it steps.** Round 1 ran the outline straight from
temple to jaw and produced an egg. Down the side there are three widths: the
cranium at its widest above the ear, a TUCK at the temple behind the eye, and
the cheekbone standing back out almost as wide before the jaw narrows. That
tuck and the flare after it are the whole difference. Traced half profile, not
a formula. Sockets are solid — drawn as outlines they read as eyes.

**A helix must be narrower than its fall.** The lemon peel opened to a radius
of 14 over a drop of 22 and the coils collapsed into each other: a helix wider
than it is tall is a flat spiral seen from above, which reads as scribble. The
fruit's height caps the drop, so the radius is what has to give.

**The lemon's real lesson is composition, and it cost three rounds:**
  1. the coil was wound round the fruit → a ball in a cage;
  2. fruit and coil were placed against the PICTURE instead of the TABLE, so
     neither touched the table nor each other — both floating;
  3. the coil's axis sat inside the fruit, so two thirds of it drew behind the
     lemon and what survived read as disconnected arcs.
Each fix exposed the next fault. What they share: the peel was authored as
decoration rather than as a thing with a start, a path and an end. It now has
all three — it begins at the cut (via an explicit lead-in; without one the
coil starts in mid-air however close you put it), falls on an axis clear of
the fruit, and lands on the table.

**A contact shadow is the cheapest weight there is.** The herring hovered over
its plate until one darker ellipse was put under it. Also: a fish seen from
directly above is its own thinnest view — on a plate already squashed to 0.30
there was nothing left to read, so it lies on its side.

**Sand stands at its angle of repose.** A flat-topped fill in the lower bulb
read as a block of wood. Poured sand is a cone; a drained upper bulb is a
funnel.

**A handle is defined by the HOLE, not by the strap.** The jug's handle bowed
to 26 against a belly of 23, so it lay on the pot with no gap through it and
read as an ear.

**Give a set its own colour keys.** The hourglass frame started as `cWood` and
the sand as `cSand` — both shared with furniture and the landscapes, so either
page could re-tune this set without touching it. Renamed to `cFrame` and
`cGrain`. And every key a module names must exist on EVERY page that loads it:
unknown keys fall through to the raw string and paint black. Asserted with a
one-liner over both pages rather than trusted.

**The still life read as scribbles, and the cause was measurable.** the author
looked at it with `?outline=1` — a view I had never rendered — and the forms
fell apart. Ink budget: 29 marks per subject against 148 for a retro device
and 154 for a building. I had put the drawing in the FILLS and left the line
work holding a silhouette and two rings, so with colour off the skull had no
eye sockets, the hourglass no sand, the grapes no front or back.

`?outline=1` skips regions and keeps tones, which makes it the test of whether
a thing was drawn or coloured in. Fixes, all systemic rather than per-object:
`hole()` emits a dark as a region AND a `solid` tone (a socket is not shading,
it is the read of the object); `vessel()` emits every crescent as a region AND
a `halftone`, so a turned body keeps its volume in line; the kit's default
`OUT 1.45` was dropped to the house `1.0 / 0.72 / 0.5` that retro and plants2
both measured — a heavy silhouette round a thin interior is exactly what reads
as a blob with a wire in it. Promoted to SKILL.md as "It has to read in LINE
first".

Also: a tone closed over an open arc with `curve: true` bows the closing chord
OUTWARD — the loaf grew a dotted band wider than the bread. Author the chord
and set `curve: false`.

**Render every view the page offers before calling it done.** Colour was the
only mode I checked.

**Round 2 of the same failure: zoomed in, the objects were unidentifiable.**
The author viewed them at full size — which I had still never done, having judged
every round on a 5×2 contact sheet at ~180px a tile. At thumbnail size
anything with a plausible silhouette reads; the fault only exists at the size
the thing is actually looked at.

The cause was that I had **one recipe applied to ten objects**: silhouette →
nested ellipses → halftone crescent. That is a template, not drawing, and two
of its three moves destroy legibility:

- **Concentric curves become rope.** The plate carried FIVE closed ellipses a
  few units apart; drawn by a hand with wander they cross and read as coiled
  cord. I had *added* two of them the round before, trying to give the line
  work something to do. Nested curves are the failure mode of a turned
  object — the plate now has two, and the fish carries the drawing.
- **The same crescent on everything** reads as a mechanical screen, not light:
  ten objects each with an identical grey D on the right.
- **1.0 / 0.72 is not a hierarchy.** A 28% step is invisible at this stroke
  width, so every mark landed at one apparent weight — a tangle of equal wire.
  Now 1.35 / 0.55 / 0.3.

Per-object causes, each the same shape of error — *a generic solid instead of
the thing's own structure*:
  - **books**: three outlined boxes read as open crates. An empty quadrilateral
    IS an opening in line. Fixed by making the boards SHALLOW so the slab
    faces dominate, and by giving the cover a tooled inset rule — the mark
    that tells a rectangle it is a surface.
  - **candlestick**: six stacked ellipses at the top read as a hookah. One
    drip pan, one socket, and a candle **two and a half times** the socket's
    height, because that proportion is what says candle.
  - **grapes**: every berry the same radius, outline weight and crescent read
    as foam. A cluster reads from DIFFERENCE — one depth value per berry now
    drives size, weight, and whether it gets light at all.
  - **lemon peel**: at 1.45 turns it was three thin passes reading as a flick
    of hatching. A curl has to be a SHAPE: one big turn, wide ribbon.
  - **herring**: it only became a fish once it got fins, a forked tail, a gill
    curve and a lateral line. Fins are not detail on a fish, they are the
    silhouette.

And twice more, the oldest rule in the file: **every mark and tone renders
after every region**, so authoring order cannot hide a line behind a later
fill. The plate's well ran through the herring; the plate's rim did too and
had to be cut into three arcs by hand.

**Judge a drawing at the size it will be looked at.** A contact sheet proves
composition and nothing else.

## The lemon: when six rounds fail, the VIEW is wrong, not the geometry

The half-peeled lemon was redrawn six times. Every round fixed the peel —
wind it tighter, drop it further, lead it in from the cut, give it two faces —
and every round came back as a strip of tape standing on edge beside an egg.

The peel was never the bug. The **view** was. A spiral hanging in the air is
the hardest thing in a still-life set to draw, and it carries none of the
identification: nothing about a yellow ribbon says lemon. One thing in a lemon
says lemon and nothing else can — the **rosette on a cut face**. Cut the fruit
instead of peeling it and the drawing is readable in one round.

> When a subject fails more than twice, stop improving the drawing and ask
> what view of this thing a person would recognise instantly. Draw that. A
> motif you cannot draw is worth less than an object anyone can name.

Three more specifics that came out of it:

- **The fourth argument of `k.R` is a SHADE MULTIPLIER, not an opacity.** Read
  as alpha, `0.48` looks like "lighter"; it is the opposite. The cut face spent
  three rounds as a dark olive disc because of it. Lower = darker, always.
- **A pie slice run to a point goes black in the middle.** Eight segments means
  sixteen walls converging within a couple of units of each other. Segments are
  ANNULAR wedges standing on a core — and the core is the pith column a citrus
  actually has, so the fix is also the truer drawing.
- **A crescent's terminator must MEET the limb at both ends.** Held at a
  constant inset it stops dead against the silhouette and the shade reads as a
  bite taken out of the fruit. Taper the inset to zero at both ends.
- **A ribbon's half-width goes across its axis, derived.** Offsetting along a
  hand-picked direction that happens to be near-parallel to the axis collapses
  the leaf into a needle. Compute the perpendicular from the axis; never type
  one in.

## What the pen references do that we could not

Six hand-drawn pen references were put beside our still-life sheet. The gap
was not taste. Four things every one of them does, three of which this system
had no way to do at all:

**1. The paper is the object.** Not one of them fills a shape with colour.
Ours fill everything — which means our line work has only ever had to hold an
outline, and an outline round a flat colour is a sticker. Take the fill away
and the line has to carry the form, the material and the light.

**2. Tone is LINE.** Hatch along the form, cross-hatch, a wobbled plaid, a
scribble. **Not one of the six uses a dot screen** — and the halftone dot
crescent is the signature of our still-life sheet, the thing that was rejected
twice as "mechanical". A halftone is a printing artefact. These are drawings.

**3. The pattern WRAPS.** On the grid kettle and the ribbed cabinet the object
is made almost entirely of pattern, and the pattern bows with the body. That
bowing is the only thing saying the thing is round.

> **A straight ruling clipped to a shape is a flat grey.** It tells you the
> area a shape covers and nothing about its form. Our `hatch` rules in page
> space, which is why every hatched facet in this repo reads as a grey panel
> glued on.

The fix is cheap and general: **do not rule in page space, rule in SPAN
space.** Measure each scanline across the shape and put a column at the same
*fraction* of every span. 0.2 of the way across a belly is further out in page
units than 0.2 of the way across a neck, so the line bows on its own, from the
silhouette, with nothing for the caller to supply. That is `ribs` (one family)
and `grid` (plus straight spans) in `src/hand.js`.

Two things that only showed up once they were built:

- **Keep a FLOOR under the spans.** A bowl swept to a point at the bottom made
  every rib converge inside a couple of units and the bowl grew a solid black
  wedge. A bowl has a flat bottom; so does the span table.
- **`gap` lands in PAGE PIXELS, not tile units.** A multiplier of 1.2 against
  a page `hatchGap` of 9 is ~11px on a 900px tile — about fifty columns. The
  kettle wanted 2.4, the bowl 3.6. Judge it rendered; the number is not
  intuitive from the tile's coordinates.

**4. Objects sit on a LINE, together.** The references put a bowl and a pot on
one table rule that reaches both edges of the picture. Ours each float on a
private grey ellipse — the single most stock-vector thing on our sheet.

> A pooled elliptical shadow under every object is a tell. One ground line,
> shared, reaching the frame edges, is a table. But **not past** the edges: a
> subject is fitted to its own bounding box, so a rule running to x=114 made
> the ground line the widest thing in the drawing and every object on the
> sheet came out two-thirds size.

### No fills means occlusion is no longer free

This is the one that costs real work. Everywhere else in this repo, occlusion
is a side effect of draw order: author back to front and a later fill covers
what is behind it. With nothing filled, nothing covers anything — a bowl of
fruit authored back to front came out as six whole circles with a bowl drawn
through them like a wireframe.

So `src/pen.js` carries `cut(pts, blockers)`: densify a run, drop every point
inside a nearer silhouette, emit what survives as separate runs. It is also
what a person drawing this does, and it is why the fruit at the back of the
reference is a crescent of line and nothing else.

### And the same old failure, in a new place

Saucer rim, saucer inner ring, cup rim and the coffee's edge put four
concentric curves a few units apart, and the pair of cups came out as two
coils of rope — the exact failure already logged against the pewter plate.
Radial ticks replaced the inner ring: they do the same job and cannot be
mistaken for a curve.

New class **`ink`** in `src/spec.js` and the worked sheet at `pen.html` /
`src/pen.js` (grid kettle, bowl of fruit, fluted pot, two cups on a cloth).

## Enforcing the class, and the checker that could not see

The dot screen came off the still life — all seven of them. The jug, roemer,
candlestick and hourglass are solids of revolution and now carry `ribs` on
their shaded crescent, which on a lathe-turned object is also literally what
the surface does. The loaf and the herring took `hatch`.

That part was easy. The part worth writing down is **why it was still there**.

`Spec.of("object")` has said *"tone: none as texture. Shadow is a DARKER FILL
on the facet, not hatch"* since the class table was written. I wrote it. And
then I shipped ten objects in flat breach of it, got rejected twice for
exactly the thing the rule forbids, and spent four rounds redrawing silhouettes.

> A guardrail nobody can check is a paragraph — logged months ago, about pen
> weights. The same lesson applies one field over and it was not transferred.
> `Spec.audit` only ever looked at pen, nib and fit, so the class's prose
> about tone, fill and framing was decoration.

Every class row now carries a machine-readable `tones: [...]`, and the audit
**builds the subject** and checks the kinds it emits. It found eight drifts on
the first run. Two of them were the rule being wrong rather than the drawing:
a daisy's disc florets and an hourglass's sand are both `stipple`, and both
are correct — so the enforceable line is between a SCREEN and a MATERIAL.
`halftone` is a regular dot grid, a printing artefact, banned. `stipple` is
scattered grain and is allowed where the thing is granular. The prose carries
the judgment the list cannot.

### Verify the checker by breaking the thing on purpose

The palette fall-through was fixed the same session: `Q[key] || key` renders
an unknown colour as BLACK, silently, which is how the board's armchair
shipped as a slab. `Stage.swatch` now records the key, draws a flagrant grey,
and calls `console.error`.

Then I deleted `cLemon` from `still.html` to watch the page fail. **It passed.**

`bin/check.js` is injected at the END of the page, so it replaces
`console.error` *after* every subject has already been drawn. It could only
ever see errors that happen later. It reported a clean sheet on a page with a
colour deliberately removed.

> **A check that can only see things which happen later is not a check.** The
> fix is to record the fault on a module (`Stage.missingColours()`) and have
> the checker read the record. The lesson is the step before that: a new check
> is not done when it is written. It is done when you have broken the thing it
> watches and seen it go red.

## Does the register survive a camera?

Four `ink` subjects were tabletop, authored flat on the picture plane. The
bistro set is the fifth and exists to answer one question: is this a way of
drawing, or just a way of drawing jugs?

It survives, and three things carry it — none of them the convergence:

- **Slats.** A café table top and a chair seat are boards with gaps between
  them. The gaps are the drawing; they are the only reason a flat top at this
  angle reads as a top at all.
- **X-frames.** A folding chair is two X's and a back. Drawn as four legs it
  is a stool.
- **The floor**, as one field of ruling on the diagonal — never parallel to a
  leg or a table edge, or it reads as a tiled wall.

Two failures, both already in this log in a different costume:

**Everything in the picture must be BELOW the horizon to be seen from above.**
`y = 0` is eye level. The first pass put the table top at `y = -26`, above the
eye, so the camera was looking *up* at a café table: the top came out as a
sliver with its underside showing. Every number in the subject is positive.

**A floor is a PATCH, never the plane.** Ruled as long lines across the world
it ran from x = -120 to x = +200 on the page; the bbox fit shrank the whole
subject to a smear. This is the ground-line failure one subject over and it
cost the same hour twice: *a subject is fitted to its own bounding box, so
anything that runs off the page takes the drawing with it.* A rug also needs
its own edges, or the ruling tapers away and reads as a fan of light rays.

And a proportion: **a bistro seat sits at about 0.45 of the table's height.**
At 0.8 the chairs tower over the table and the set reads as a lifeguard stand.

## Five daily objects — picking the set by CONSTRUCTION

Mug, twin-bell alarm clock, toaster, table lamp, stapler. The brief was "five
daily life objects"; the only decision that mattered was made before any
geometry, and it was not which five.

The still life was rejected twice and the cause was one recipe for ten
objects. So this set was chosen so that no two share a construction:

    LATHE    mug, lamp          half profile mirrored, ellipses at the
                                openings, `ribs` down the turn
    FACE     alarm clock        a frontal disc; the DIAL is the drawing
    EXTRUDE  toaster, stapler   a flat silhouette pushed back along one
                                shared offset

They still share an eye — `Q` is the squash of every horizontal circle, and
one `OFF` drives every extrusion — so the five sit at one table without being
one drawing. **One eye for a set; as many constructions as it has objects.**

`solidFromSil(sil, off)` is the new third way, and it is worth keeping: a
silhouette plus one offset gives the visible flanks for free (an edge shows
its flank when its outward normal points the way the solid is pushed, found by
stepping off the edge and asking whether that lands inside the shape). Creases
are drawn only where a visible flank meets a hidden one, which is exactly
where the solid's outline has a corner — outline every face and a rounded nose
comes out striped.

### Visible and LIT are two different questions

The first version shaded each flank by how well it lined up with the offset.
The offset points up-and-RIGHT, so a flat top face scored 0.57 and came out
**darker than the front**: every extruded object on the sheet was lit from
below, and the toaster read as a grey lump.

> Which faces you can SEE is a question about the camera. How bright they are
> is a question about the light. One number cannot answer both. Score the
> normal against a light direction — the class already states the answer, top
> 1.08 / front 1.0 / right flank 0.72.

### `ribs` wants a body; a crescent wants a ruling

Already logged against the lemon, and it cost the same hour again on the
clock's bells: a crescent's spans pinch to nothing at both ends, so `ribs`
converged under each bell into a dense black wedge that read as an open mouth.
`hatch` across it instead. **`ribs` is for a shape with a belly and a floor.**

### Three proportion failures, each unfixable by detail

- **A mug is about as wide as it is tall.** At 30 wide and 41 high it read as
  a takeaway cup, and a better handle did not touch it.
- **A handle needs a HOLE, and the hole has to be big.** Inner radius 7 against
  a mug wall at 15 put the opening behind the body: a filled crescent, an ear.
- **A stapler's taper runs backwards from the obvious.** Deepest at the hinge,
  thinning to the nose. Drawn as a parallel bar it is a slab.

And one that is about parts, not proportion: **the magazine is a part, not a
shadow.** Drawn as a dark slot in a five-unit gap it came out as one thin black
line — there was nothing to see but the gap. It is a slab that stands on the
base with the staple strip light against it, and the air above it is what reads
as a hinged machine. A corollary: **ticks drawn in ink over an ink fill are
ticks nobody can see.**

## "Scrappy" again — and it was the ground line, for the third time

Five daily objects came back as "too scrapy". The word has a definition in
SKILL.md with four causes, and two of them were present. Measured, not guessed:

    mug       bbox  98 x  45    17 elements
    clock     bbox  98 x  82    43
    toaster   bbox  98 x  53    67
    lamp      bbox  98 x  60    17
    stapler   bbox  98 x  35    54

**Every bounding box was 98 units wide.** That is not any of the objects —
it is `k.ground()`, which runs the full width of the tile. The fit uses the
bbox, so a mug 47 units wide was being fitted as though it were 98, and all
five rendered at under half the size they should. Thin, small and bare.

> This is the THIRD time this session. The pen sheet's ground rule ran to
> x = 114 and shrank every subject to two thirds. The bistro's floor ran to
> x = 200 and shrank the set to a smear. Each time it was fixed locally and
> the rule was written down, and each time the next sheet did it again.
>
> **A subject is fitted to its own bounding box.** Anything in a drawing that
> is wider than the subject takes the drawing down with it — a ground line, a
> cord, a cast shadow, a floor. The fix is not to remember: it is to pass the
> width (`table(k, TW)` here), and to PRINT THE BBOX before judging a sheet.
> One `node` probe over `mod.build()` found in ten seconds what three rounds
> of looking did not.

The second cause was real too: **seventeen elements is not an `object`.** The
class asks for "every control, seam, vent and label" and the measured
benchmark is a retro device at ~148 paths. What closed the gap was not more
outline — it was surface:

    clock    43 -> 175   sixty minute ticks, four numerals, a maker's name,
                         a second hand with a counterweight, an alarm hand,
                         a knurled bezel, two winding keys
    toaster  67 -> 103   louvres on the flank, a badge, four screws, a crumb
                         tray pull, a chrome reflection, the cord
    stapler  54 ->  85   thumb pad with ribs, badge, parting line, hinge
                         screw, size window, rubber feet

A dial with twelve ticks and two hands is a clock ICON. It reads at twenty
pixels and falls apart at two hundred, which is the size anyone looks at it.

### `Letter`'s `sc` is a multiple of its own box, not a height

`Letter.write(k, str, x, y, sc, w)` — `sc` scales a **3 × 5 glyph box**, so
width is `Letter.width(str, 1) × sc` and cap height is `5 × sc`, and `y` is
the TOP of the cap, not the baseline. Read as a height in tile units, a
two-digit numeral at `sc: 5` came out 37 units wide across a dial 40 wide, and
three of the five objects had a brand name sprawled across the whole tile.
Measure a string before placing it:

    Letter.width("SWINGLINE", 1)   // 38.2  -> sc 0.5 for a 19-unit badge

## "Scrappy" a fourth time — and twice it was the engine, not the drawing

Five daily objects came back as *"too scrapy... not good doodles, they should
be delightful to look at."* The previous round had already chased detail
counts and ground-line widths. This time I rendered each subject on its own
at tile size and looked at it, instead of judging a 2000px sheet where every
object is 150px wide. Five minutes of that found faults three rounds of
looking at the sheet had not.

**Two were bugs in the shared toolkit, and they had been shipping on every
open vessel in the system.**

### `body()` jumped straight across the mouth, mid-stroke

    .concat(open === false ? [] : back(top[0], top[1], 18).reverse())

The path runs down the right side, round the foot, up the LEFT side — so it
is standing at the left lip. `back()` runs 180° → 360°, which *starts* at the
left lip and travels over the top to the right one. It joins. Reversed, it
started at the RIGHT lip, so the stroke leapt the full width of the opening
in one straight segment.

That segment is a heavy horizontal bar across the mouth of everything open.
On the mug it read as a sealed takeaway lid, for two whole rounds, and I
"fixed" it twice by changing things that were not it: first the mouth
ellipse's weight, then the coffee's radius. The fill closed over the bar, so
it was only ever visible with the colour off — which is exactly the view that
had been rejected.

Deleting one `.reverse()` fixed the mug, and `still.js` had the same line.

> A straight line you did not author is a path, not a mark. Before retuning
> the marks near it, print the point list and look for the jump.

### An open vessel's outline is not a closed loop

Even with the path correct, `k.M(sil, k.OUT, { closed: true })` rules the
chord from the last point back to the first — across the mouth again. The
FILL closes; the STROKE must not. `closed: e.open === false`.

### `?outline=1` means nothing is behind anything

Three subjects were authored "behind" something whose fill would cover them.
With every region dropped, the clock's bells and their hatching ran across
the dial (two open mouths either side of the face), the stapler's base,
magazine and arm drew through each other into three floating slabs, and the
mug's handle crossed its own wall. The cure already existed — `Kit.cut` — and
`solidFromSil` now takes `o.cut: [polys]` so an extruded solid can be told
what stands in front of it.

> "Authored back to front" is a statement about FILLS. It buys you nothing in
> the register the sheet is actually judged in.

### And a fourth ground-line, wearing a different hat

The table rule was fixed last round. This round the widest thing in the
toaster's drawing was its **cord** (17 units past the shell), and in the
lamp's drawing its **cord and plug** (to CX+33 against a shade half-width of
22). In the mug it was the **steam**, 34 units tall against a 36-unit body.

It is the same fault for the fourth time and it is worth stating generally
rather than as three more fixes:

> **An appendage may leave the drawing. It may not define it.** The fit uses
> the bounding box, so flex, steam, cords and shadows silently set how large
> the object gets to be. Measure the bbox against the BODY before judging
> that a drawing looks thin — three times out of four it is not thin, it is
> small.

### What "delightful" turned out to mean, concretely

Nothing in the fix list was about charm, and the charm arrived anyway:

- a bell drawn with a 0.44-radius crescent is a ring with a smudge; at 0.22
  with a highlight it is a dome of polished metal
- a slice of bread 18 wide and 13 proud of the shell is a fedora, and the
  slot beneath it is the brim — 13 × 6, drawn at DET not OUT, is toast
- a 3-unit lever track filled solid is a hole punched in the front panel
- a badge and a parting line at the same height strike each other out; so do
  a brand name and a dial
- five evenly pitched rings down a cylinder is corrugation. Potter's rings
  come in a cluster where the wheel ran, and then nothing
- four concentric ellipses within four units is rope, whatever they depict.
  Two, at different weights, is a hem

---

## 2026-11-02 · five houses (src/houses.js, houses.html) — on VDL

A set of five house TYPES none of arch/arch2 has: A-frame cabin, saltbox, Craftsman bungalow,
Kerala house, stilt house. Picked by FORM (roof-is-wall, asymmetric gable, porch gable, two-tier
hip, lifted), one vocabulary (Arch._kit + Arch2._kit, now exported). Two render-and-look rounds.

- **A type's landmark is often on the FLANK, so the yaw has to show it.** The saltbox at yaw -30
  read as a plain two-storey gable; its identity is the long rear slope, which only appears on
  the side wall. At -40, with the rear eave dropped to one storey, it reads at a glance.
  → Before tuning detail, ask WHICH FACE carries the type, and turn the camera to it.
- **Texture must stop at the profile, not the bounding wall.** Clapboard ran the full wall height
  across the saltbox flank and stood in the sky behind the long slope (the cottage's lesson in a
  new place). Clip each course to the profile at its own height.
- **A porch is a second mass: its gable must sit BELOW the main eave.** With the porch ridge
  above the main gable's base, the two roofs crossed and the bungalow read as clutter. And the
  porch columns had landed on the front windows. Columns at the ends, windows between.
- **A glazed triangle needs panes cut to the rake, bay by bay.** Fixed-height panes in a triangle
  read as a bar chart. Each bay's top follows the rake at both of its edges.
- **A lean-to wraps the corner.** The Kerala verandah roof drawn only on the front left a lone
  eave line running back into space. Draw the side slope and its back edge.
- **VDL:** `~/VDL/vdl.config.json` mounts this repo at `/lib/doodle`, so frames are URL frames
  `houses.html?h=<key>` (`&draw=1` draws live). Skullet does not apply to SVG drawings (see
  2026-11-01); the live draw IS the building state. `bin/check.sh` now covers houses.html
  (5/5, drift 0). Its injector needs the page to END `</script>\n</html>`, with no `</body>`.

### Five more (houses 6–10): yurt, butterfly roof, machiya, Cycladic, houseboat

- **Shared roof helpers draw hidden edges.** `gableRoof` draws BOTH legs of the far gable, and on
  the machiya the back leg ran diagonally across the upper floor. When a roof sits close to a
  tall front wall, draw its VISIBLE edges yourself: near gable, ridge, front eave and soffit, and
  only the front leg of the far gable.
- **Lattice on a drum needs a hole for the door** (no occlusion). Skip the pattern where a
  flat thing stands on the curve.
- **A cross makes a dome a chapel.** On a house the dome takes a plain finial.
- **A fake "fanlight" from `windowF(h ≈ 0)` renders as a black blob.** Don't stretch a window
  helper into an ornament.
- **Water is a ground, too:** the houseboat swaps the pavement for a waterline plus ripples in
  rows receding with z (heavier near, finer far) and a broken reflection tick-line under the hull.

### Houses 11–15: haveli, treehouse, earth-sheltered, tiny house on wheels, container house

- **The treehouse read as a lollipop twice.** First the canopy was a cartoon cloud floating
  above and the trunk was lost behind the ladder. Then the canopy was drawn clump by clump and
  came back as fragments and stray boughs. What worked was ONE mass: the union outline of the
  clumps (each drops its points inside another, tested in world space), cut against the cabin's
  screen silhouette, boughs removed (they would be hidden in the leaves), a thick flared trunk
  behind the cabin, and the ladder moved clear of it. → Promoted to SKILL.md ("Occlusion against
  a nearer thing…").
- **Two failure rules became helpers** so they cannot be forgotten: `ridgeRoof` (visible edges
  only) and `circleF`/`circleOut`. A rule that is a function is a rule that holds.
- **Promoted this session**: "Making a SET of house types" and "Putting a set on VDL" in
  SKILL.md (pick by form, the landmark face drives the yaw, visible-edge roofs, texture clipped
  to the profile, second mass below the main eave, union-outline masses, perspective blots, water
  as ground, the add-as-it-passes VDL loop).

### Houses 16–20: igloo, octagon house, Futuro pod, tower house, cave house

- **Four of five were right on the first render**, which has not happened before in this repo. The
  reason was the new `hull(revolve(...))` helper: the igloo and pod outlines were COMPUTED from
  the surface instead of drawn. Polygon walls culled by signed area (octagon) did the same for a
  faceted plan. → Promoted ("A curved solid's outline is computed…", "Polygon plans…").
- **The cave read as a thatched hangar.** It had a smooth, symmetric outline with curved strata,
  which is the roof vocabulary. Jagged straight-segment rock, broken bedding, cracks and boulders
  fixed it in one round. → Promoted ("Natural mass is jagged and broken").
- **A turret on a keep's corner is a deliberate straddle**, unlike "two masses must not share an
  edge". Stop the wall's corner line where the turret's corbels begin, so it does not run through
  the drum.

---

## 2026-11-02 · five plants (src/plants3.js, plants3.html) — on VDL "Plants"

Pitcher plant, Venus flytrap, Chinese money plant (Pilea), money tree, ponytail palm, chosen
because each one's identity is a landmark no plant in plants/plants2 has. Built on
`Plants2._kit` (now exported), so all three plant modules share pots, soil and blades.

- **First render, three faults, one round to fix:**
  - Pitcher lids flew across the tile: screen coords passed to `blade()`, which takes a world
    base. The stray lids ALSO made the plant tiny, because the fit is the bbox.
  - Pilea's rear coins showed as full rings through the front ones: fills sit under all marks.
    Deferred occlusion (queue the line work, `k.cut` by later discs) made them crescents.
  - Ponytail leaves fell below the ground line: cap the fall above the pot base.
  → All three promoted to SKILL.md "Plants and flowers".
- **Braids work with segment-sorted ribbons**: three phase-shifted strands, cut into segments,
  sorted back to front by z, each segment's outline `k.cut` by nearer segments. It read as a weave
  on the first render.
- **The flytrap's jaws are two half-discs hinged on a midrib**, the back one red (its inner face)
  and the front one green (its outer face), with cilia splaying off both rims. The colour split
  between the lobes is what makes it a jaw rather than a leaf.

## 2026-11-02 · VDL's Randomise for drawings — the hand, not the box

The author: the randomiser should differ for UI elements and for doodles. Built the doodle tweak
protocol (`src/vdl-tweak.js`, `P.__hand` in stage.js), exposed by houses.html and plants3.html.

- **Hand dials did nothing at first, and two separate things hid it.** (1) The class nib is merged
  OVER the page's P (`{...P, ...mod.nib}`), so writing wander into P was overwritten. Fixed with an
  explicit `P.__hand` layer applied after the nib. (2) After that fix the values DID apply (232 of 292
  paths changed) but looked identical, because wander and overshoot are fractions of the stroke width.
  I had taken the dial ranges from the class band. → Measure the path data, not the screenshot,
  before concluding a dial is broken. Then set the range by what visibly changes a drawing.
- **A palette roll is one shared hue shift** (25–70°, never near 0) over every palette key, so the
  colours stay a set (K-20 again). Per-key random hues would make a drawing look like clip art.

## 2026-11-02 · ten furniture pieces (src/furniture3.js) — on VDL "Furniture"

Rocking chair, hanging egg chair, bunk bed, upright piano, grandfather clock, folding screen, arc
floor lamp, bean bag, steamer trunk, office chair. Picked by CONSTRUCTION against the 31 existing
pieces (furniture, furniture2, chairs).

- **Class `object` on the retro kit, not the legacy `furniture` row.** All ten read on the first
  render. The product toolkit's prisms, faces and deferred occlusion carry furniture as well as
  they carried devices.
- **Only three faults**, all promoted to SKILL.md (Products):
  - Tubes drawn through sparse `line3` points kinked like a bent wire. Sample a smooth curve.
  - At OUT × 2 a steel stand read as thread. Load-bearing tubes need ~3–4× OUT.
  - A crease ran out past the bean bag's bottom. Detail lines on a soft mass stay inside the
    silhouette, so clamp them.
- **Each frame on the furniture page speaks the VDL tweak protocol** (palette [] since this set
  fills with literal hexes), so Randomise shows hand dials for it, not UI dials.

### Furniture 11–20: director's chair, hammock, ladder shelf, crib, drafting table, vanity, wine rack, rolltop desk, cheval mirror, globe bar

- **Eight of ten read on the first render**, again on the retro kit. The constructions it handled
  without help: an X-frame from two tilted `stick`s per side, a tilted board as a prism whose base
  sits in the tilted plane with a matching `plane` for the paper on it, a rolltop hood as a CONVEX
  quarter-round profile extruded along x, and a cheval mirror as an ellipse on a plane tilted back 9°.
- **The two that failed both had shapes placed BY EYE**, and both are promoted to SKILL.md:
  - Wine-rack bottles sat on a guessed grid. Solve the lattice cell centres from the line equations,
    then size each bottle end to the cell spacing.
  - Globe continents as 6-point polygons read as hexagons. Smooth them as closed Catmull-Rom curves.
  The globe's meridian, a hand-placed arc, was also wrong. A half ring pinned at the poles was right.

## 2026-11-02 · five vehicles (src/vehicles.js) — on VDL "Vehicles"

Retro scooter, auto-rickshaw, camper van, double-decker bus, tractor. Class `product` on the retro kit.

- **Three of five were right on the first render** (rickshaw, camper, bus). The pattern that
  carried them: wheels as short cylinders, the body as a rounded-rect profile extruded across the
  width, windows and two-tone paint as flats on the side and nose planes.
- **Tractor**: both wheels were on the FAR side (z > 0). The red fender dome then hid the wheel that
  defines the type. The fix is the draw order far wheels, body, near fender, near wheel. → Promoted.
- **Scooter**: an 8-point "bulbous" body looked cut from card. A sampled half-ellipse profile is a
  dome. → Promoted.
- A drawbar authored after the near wheel ran straight across its hub. Anything hidden behind the
  near wheel should simply not be drawn.

## 2026-11-02 · five still lifes from Pinterest photos (src/stilllife.js) — on VDL "Still life"

Glass bottles in hard sun, roses + fruit on a drape, an orchid on black, tea by a window, a vanitas.
Class `object`, with the retro kit's occlusion and the camera square-on.

- **A still life from a photo is a vignette, not a cut-out.** The backdrop and table are flat
  panels (w:0), cropped to the photo's aspect. Half the mood of each reference was its ground
  (black, dark wall + pink drape, green wall + wood). Put the reference beside the doodle.
- **The eye height is per scene.** q runs from 0.42 (bottles, from above) to 0.16 (vanitas, from
  table height). One squash for all five would put them all at the same camera.
- **A long cast shadow is the profile laid down:** foot at the base, mouth at the tip. The
  light focused through the glass is the same shape at about 0.4 of the width, in a paler tint.
- Closed Catmull-Rom curves through a panel's corners overshoot past the frame. Curve only the
  soft edge, then concat the hard corners.
- **Size against the reference, not the sheet.** The first pass drew the bouquet and the orchid
  flowers at about 70%. They read as "small" before they read as "wrong".
- Flowers placed by position must still CONNECT. Each one needs its pedicel back to the stem.

## 2026-11-02 · LINE FIRST (The author, on the still lifes) → promoted to SKILL.md

"Doodles are usually line only. That is the first way. Coloured ones are secondary."

The first still-life pass carried all its value in fills: crescents, shadows, the dark wall,
drupelets and seeds were all `w: 0` regions. In Line only the roses scene became bare circles on
white. The rebuild carries every value in line as well. Hatch strokes are queued (cut by later
fills), ribs sit across each turn, the walls are cross-hatched first, and marks are outlined.
The colour version improved too, because the hatching gives the flat fills texture.
- Gaps punched in a hatch read as CLOUDS. A wall's mottle has to be lines over the hatch.
- Hatching a whole turned body plus its throwing rings made a basket grid. Hatch only the
  crescent when the body already has rings.
- At frame size, a rose's petals need DET-weight lips concave to the centre, two rings of
  them. Hairline arcs vanish.

## 2026-11-02 · fidelity by depth (The author: "too detailed, busy and distracting")

The line-first pass over-corrected: wall, table, scarf and subject all got full cross-hatch, and
the vanitas read as one grey texture. → Promoted to SKILL.md (LINE FIRST, fidelity bullet).
- Background → `S.vignette`: a curve-bounded patch, single direction, gap ~2.4, weight 0.6 ×
  hatch, `rag` random end-insets so it fades. It sits only behind the arrangement.
- Mid-ground: contour + 2–3 tapered fold or grain lines; no hatch. Colour-only pattern stays `w: 0`.
- Focus: ribs (7, not 11), crescent hatch, one cross-hatched darkest object.
- Restore value where it carries the read. The dark book went white with the lighter hatch, so it
  needs gap ~1.15.
- Follow-up, same day: even a light ragged vignette patch behind the vanitas was "still
  distracting". The background's only tone is now the subject's own wall shadow (`S.wallShadow`:
  a narrow tight hatch beside each object, away from the light), plus a thin band under the table
  lip. A dark-ground reference (the orchid) keeps a very sparse halo. That is the exception.

- 2026-11-03 kitchen.html (src/kitchen.js) — new five-subject page in the houses.html shape,
  listed in SKILL.md's page index. Rule it follows: pick a set's subjects so no two share a
  CONSTRUCTION (daily.js precedent), and give a frontal faceted subject yaw 0 — turning it
  only hides the facets that name it. No new rule beyond that.
- 2026-11-03 11:44 src/kitchen.js — further in-progress drawing tweaks by another session; no new page, file or rule (header contract unchanged), covered by the kitchen.html entry above.

## 2026-11-03 · five kitchen subjects (src/kitchen.js) — on VDL "kitchen"

Stand mixer, chef's knife on a board, cast-iron skillet, moka pot, balloon whisk. Class `object`
on the retro kit, picked the way daily.js picks: **no two share a construction** — cantilever
massing, flat-on-a-plane, disc at pitch, faceted frontal, pure wire.

- **A page cloned from `vehicles.html` does not honour `?outline=1`.** It hard-codes
  `outline: false`, so the first "line-first" render came back in full colour and I judged the
  wrong picture for a round. → Promoted to SKILL.md (LINE FIRST §3). Check the query wiring of any
  page you copy before you trust its line render.
- **One camera per subject, and yaw 0 is a legitimate camera.** The moka pot is a frontal octagon:
  turning it hides the facets that name it, and at pitch 0 there is no top ellipse to miss. CAM is
  per key, so a set can mix a yawed product view with a square-on one.
- **A taper cannot be a prism, but it can be a frontal flat.** The moka's two truncated cones are
  flats on FR with the facet lines drawn at a FRACTION of the live half-width, so each edge tapers
  with the cone instead of running straight.
- **Anything hung off a tapered body must be anchored to the LIVE half-width.** The moka handle was
  pinned to the waist width and floated a unit and a half off the body; same arithmetic fixed the
  spout. Compute `hw(y)` and attach to it.
- **A detail made of three pieces that merely touch will float apart.** The lid dome, its stem and
  the knob were three flats and read as a chimney with an egg on it. Authored as ONE polygon
  (stem + knob in a single outline) they read as a knob.
- **`sin(π·s)` draws a lens, not a balloon.** The whisk's wires went to zero radius at the tip, so
  the balloon came out pointed and symmetrical. `sin(π·s^0.74)^0.62` moves the widest point down
  and rounds the bottom.
- **Mid-ground ruled edge to edge is the "busy" failure again.** The chopping board had 16 even
  grain lines and read as a striped mat that out-competed the knife. Three short tapered strokes
  was the whole fix (LINE FIRST §2: mid-ground gets contour + 2–3 grain lines, never hatch).
- **A floor shadow wider than the object reads as a halo of rays.** The skillet's was an ellipse
  half again the pan's width; tightened to just past the silhouette it reads as shadow.
- **Two pour lips authored by eye came out as black triangles across the pan.** A polygon whose
  points are guessed against a circle is a coin toss — the heat ring (one circle, concentric with
  the one already there) carries the same "this is a skillet" read with no geometry risk.
- The set's darkest object is the skillet's interior, so it is the one thing that gets cross-hatch;
  everything else is single-direction. 480 paths over five subjects, `bin/check.sh` clean.
- 2026-11-03 11:56 kitchen.html — set grew 5 → 15 subjects (kettle colander mortar pin tongs tray rack jug mitt block) and the page reads ?outline=1; SKILL.md page entry updated. Same construction rule, no new rule.

### Kitchen 6–15: kettle, colander, mortar + pestle, rolling pin, box grater, muffin tray, cooling rack, measuring jug, oven mitt, knife block

Nine of ten read within two rounds. The faults, and what they taught:

- **`t.mesh` vanishes in Line only.** The colander came back as an empty bowl, because `t.mesh`
  draws its dots with `t.dot`, which is a `w: 0` fill — and `?outline=1` drops every fill. Holes
  are the one thing that names a colander, so they are a value that MUST be carried in line.
  New `holes()` helper: the same grid, each hole an outlined mark. → Promoted to SKILL.md
  (LINE FIRST §3, the `w: 0` audit bullet).
- **Generated profiles land *nearly* right, again.** The kettle's dome came from
  `sin(a)·sin(a)^0.18` and rendered as a tent. Seven traced points and a mirror gave a kettle on
  the next render. (SKILL Craft has said this for months; it is still the fastest thing to get
  wrong.)
- **Anything hung off a body must have BOTH ends buried in it.** The kettle spout and the jug's
  pouring lip were each authored on their own plane, a unit clear of the body, and both read as
  detached tabs. The jug's lip only worked once it grew off the rim ellipse on `TOP`, not off a
  separate `FR`.
- **Two arms splaying to two feet is a trestle, whatever the feet are.** Tongs failed three times
  — wide V, narrow V, scalloped scoops — and read as an easel every time. Swapped for a box
  grater, which reads at a glance and keeps a construction the set lacked (a tapered punched
  shell). *A subject that will not read is a subject to replace, not to keep tuning.*
- **Stacked prisms make a double wedge.** The knife block was three prisms (body, cap, slope) and
  came out as two overlapping wedges. ONE convex side profile extruded across z, with the slope as
  its own `t.plane`, put the slots and the handles in perspective for free.
- **Free-ruled detail runs out of a soft silhouette.** The oven mitt's quilting ran past the thumb.
  `hatch()` already clips to a polygon, so quilting at a 5.2 gap is a seam grid for nothing — use
  the clipper you have rather than ruling lines and hoping.
- **The graduations ARE the measuring jug.** At hairline weight they disappeared and it was a mug.
  Long marks at `DET`, short at `TEX`, and a liquid level for them to measure.
- 15 subjects, 1257 paths, `bin/check.sh` clean, drift 0.

## 2026-11-03 · "these 2 are completely breaking" — the measuring jug and the oven mitt

Both were one mistake each, and the jug's is general enough that it went into SKILL.md (Tone).

- **A tangent plane is not a surface.** I built the jug's liquid as a RECTANGLE on `t.FR(-R)` and
  its turn as a hatch on the same plane. That plane touches the cylinder along one line only, so
  everything drawn away from that line landed off the body: the liquid projected as a pale slab
  hanging out of the barrel, and the hatch ran past the left edge and below the base. The fix is
  not to nudge the rectangle — it is to stop using a plane for a round thing:
  **contents are their own solid** (the liquid is a shorter cylinder; its surface ellipse comes
  free as the prism's cap) and **the turn is ribs placed by ANGLE on the real circle** (`ribs()`).
  Same bug, smaller, on the colander and the mortar; both converted.
- **Then: ribs are placed in ANGLE space, and the eye reads SCREEN space.** My first range (284°
  → 348°) ruled the whole barrel like fluting. The right-hand silhouette edge was near 10–25°.
  Render and look; do not reason about which angles are at the edge.
- **At yaw 0 / pitch 0 a z offset projects to nothing.** The oven mitt's "thickness" was a second
  copy at `FR(3.2)`, which under a square-on camera lands exactly behind the first, so the mitt
  read as a flat sign. A frontal subject's thickness is an offset in the PICTURE plane
  (daily.js's `solidFromSil`, by hand) — and keep it small: 2.4 × 1.8 read as a shelf under the
  cuff, 1.3 × 0.9 reads as padding.
- **`t.flat` draws with `curve: false`.** A 14-point outline for a soft object came back a
  polygon. Sample the control points through a Catmull-Rom yourself before handing them over.
- **A thing that hangs off an object goes in FIRST.** The mitt's hanging strap, drawn on top, read
  as a luggage tag stuck to the side; authored before the mitt, its root is covered and only the
  loop shows — which is what a hanging loop looks like.
- 2026-11-03 12:34 src/kitchen.js — more in-progress subject drawing by another session; no new page, file or rule beyond the kitchen.html entries. (A second kitchen.html entry in SKILL.md, added by that session, duplicates mine — dedupe pending.)
- 2026-11-03 12:35 src/kitchen.js — further in-progress subject drawing by the other kitchen session (not this SwiftExperiments session); no new page, file, helper or rule beyond the existing kitchen.html entries. Note for that session: the file header still says "FIVE KITCHEN SUBJECTS" though the set is 15.

## 2026-11-03 · ten living-room elements, same page (src/kitchen.js 16–25)

Rug, cushion, draped throw, sunburst clock, candlesticks, guitar, stack of books, fireplace,
wicker basket, pedestal fan. Nine of ten read on the first render.

- **Check what the repo already draws before picking a set.** furniture/furniture2/chairs already
  hold the sofa, armchair, coffee table, bookshelf, ottoman, TV unit, magazine rack and console —
  every obvious living-room answer. Picking against that list is what pushed the set towards the
  room's SMALL and SOFT things, which is where the constructions the repo lacked were hiding.
- **A soft object is named by what sticks OUT, not by being rounded.** The cushion was a rounded
  rectangle with a seam and read as a loaf of bread. A cushion's **corners sit further out than
  its sides** — put the control points there and the ears appear on their own. (Same family as
  "landmarks must be in the outline".)
- **A regular grid is a mesh bin; a weave is STAGGERED and BROKEN.** The basket's continuous
  horizontal bands crossed by full-height staves read as a wire bin. Short staves that live
  between one band and the next, offset half a step each row, read as wicker.
- **Count the line families before adding another.** The fan had three cage rings, sixteen spokes
  and three blades over one hub — six families fighting in one disc. Two rings, ten spokes and
  blades small enough to stay inside the guard, and it reads.
- **An opening is four masses, not a hole.** A prism cannot have a hole, so the fireplace is a dark
  back panel with two piers, a lintel, a mantel and a hearth built around it — and the dark is
  cross-hatched, which makes it the one place in the set with that value.
- **A lean is a 2D rotation of the points, not a camera turn.** The guitar is authored upright and
  frontal, then every point goes through `rot2` — turning the camera instead would have
  foreshortened the waist that names it.
- 25 subjects, 2404 paths, `bin/check.sh` clean, drift 0.

## 2026-11-03 · reel overlays (faucet.html, src/faucet.js)

Three concept beats for the creativity-faucet reel: tap pouring mud, the same tap pouring clean
water, a pipe in section with crumpled bad ideas jammed in front of a lightbulb.

- **An overlay is a BEAT, not an object.** Pick the 2–3 lines of the script that carry the idea
  and draw only those. Two that crossfade must share one drawing function and one export crop,
  or the eye reads two different taps instead of the water changing.
- **Four creases through the centre of a paper ball read as a pinwheel.** Creases start at the
  edge and die out inside, bent once, never crossing the middle.
- **Transparent export:** a page class `clear` (body background transparent) + Chrome
  `--default-background-color=00000000`, then crop to the alpha bbox with PIL.
- **Black line vanishes on dark video.** On footage, use the colour version (the fills carry the
  silhouette) or put the overlay on a paper card; Line only is for light backgrounds.
- **`backed` (the whole metaphor in one frame):** a section pipe running into the tap. Two bugs on
  the first render: the mud region was joined bottom-to-top then to a bottom corner (a bow-tie
  fill: build both halves of a split region from the SAME ordered boundary), and the mud's
  scribble ran under the tap body and was drawn ON it, because tones render above every fill. Stop
  a tone at the edge of whatever stands in front of it.
- **Crossfade pairs need one crop for the CARD too**, not just the transparent PNG: the white-card
  pass re-cropped each to its own alpha bbox and mud/clean came out 11px apart.

## 2026-11-04 · the sync check fired on ANOTHER SESSION's work

No doodle work happened in this session (it was motion-studio throughout), but the skill-sync Stop
hook flagged `src/stilllife.js`, and then four minutes later `src/scapes.js` and `scapes.html`,
as newer than SKILL.md. `ListAgents` shows five peer sessions on this machine, two of them busy.
The timestamps (13:50, 13:54:29, 13:54:39) are a session actively editing doodle while this one
rendered video.

**Nothing is folded in from here, deliberately.** Writing a rule about work I did not do and
cannot see would put a guess into the skill, which is worse than leaving the gap. The change still
needs writing up by the session that made it.

Two things worth knowing next time this fires:

- **The check is mtime-only, and the doodle tree is gitignored** (`~/.gitignore`, `/*`), so there
  is no history to diff a flagged file against. An editor save, a `touch`, and an hour of real
  work are indistinguishable to it. If a flag ever needs settling properly, `cp -R src` to the
  scratchpad before a run so there is something to compare afterwards.
- **It is per-machine, not per-session.** With concurrent sessions open, the hook can block a
  session that never went near the repo. Check `ListAgents` and the mtimes before assuming the
  work is yours — and do not "resolve" it by inventing an entry.

## scapes.html was in the repo but not in the skill's page list (2026-11-04)

**Symptom.** `scapes.html` changed, and the page list in SKILL.md — which carries
`buildings.html`, `pen.html`, `stilllife.html`, `faucet.html`, `raw.html` — had no entry
for it. Anyone reading the skill would not know the landscape stress set existed, what its
ten keys are, or that `?s=<key>` is what VDL frames point at.

**Cause.** The page was added to the repo without the same-turn skill edit. The skill's
*description* mentions landscapes, which is enough to make the skill match the request but
not enough to tell you how to run the page — a description is a trigger, not documentation.

**Rule.** A new `*.html` in the workspace is not finished until it has a page-list entry
carrying its source module, its URL parameters, its keys and anything a caller must know to
re-render it. Two things in this page are worth generalising:
- **A page must declare every palette key its subjects use.** scapes.html carries the plants
  palette (cLeaf, cLeafD, cOlive, cCactus, cTerra, cPot, cSoil) because a landscape borrows
  plant subjects; without those keys the borrowed parts render black.
- **Keep `render()` re-callable.** VDL's Randomise tab rebuilds the page with new hand and
  palette values, so page setup that only runs once at load will not survive it.

## The scene kit rebuilt landscapes on depth, and the skill still described the rejected set (2026-11-04)

**Symptom.** `src/scapes.js` changed. SKILL.md's landscape material still ended at the
"Superseded for this user's work" note — the ten hatch-no-fill landscapes rejected as
"too scrapy" on 2026-10-29. Nothing in the skill described the thing that replaced them,
so the only landscape guidance on offer was for an approach that had been switched off.

**Cause.** The module was rebuilt on a genuinely different mechanism without the same-turn
skill edit. A "superseded" note tells you what NOT to do; it is not a substitute for
documenting what came after.

**Rule.** Depth in a scene is a NUMBER, not a camera. `d` runs 0 (nearest) to 1 (far range)
and every receding property reads it: the pen thins to about a third of the bench's weight
at the far ridge, hatch opens and lightens, colour mixes toward the sky, and detail drops a
rung. A mountain drawn at the bench's weight is the flat-landscape failure — so when a
scene reads flat, find the property that is not reading `d` before redrawing anything.

Two contract details that bite: a scene's `frame` must come from the sky panel's PROJECTED
bounds, because the kit maps picture coordinates through its own camera and `[0,0,160,100]`
is not the frame; and noise is seeded and reset per scene so a scene draws identically
every time — do not add an unseeded random or the set stops being a regression test.

## 2026-11-04 · the landscape STRESS LOOP (src/scapes.js, scapes.html) — VDL vdl-tour/landscape-stress

The author: the gaps are mostly in landscapes and scenes; make sets on one VDL page, stress-test,
loop on what breaks, and fold every fix into the skill. Ten scenes were picked so each one
exercises a known failure (terrain, a one-point lane plus an animal, overlapping masses, cliff
and surf, rows into the picture, forms with no edges, white on white, one near tree, falling
water, things on water). Seven render-and-look rounds; all ten read in line and colour at the end.

Per round, what broke (→ the rule, now in SKILL.md "Landscapes — the scene kit"):
- r1 Every scene offset and cropped: the kit projects picture coords, so a literal frame is wrong.
- r2 Straight half-plane terminators split crowns and rocks → `crescent()`. Snowline and
  treeline as saw teeth → irregular clumped edges. The village's nearest wall ate half the
  frame. Mid trees were lollipops, hedgerows beads, cliff strata a layer cake, hulls tubs.
- r3 Cliff ledges with shade under them read as eyebrows → jointed slabs. Tree limbs hidden
  inside the crown → fork below it.
- r4 "Largest region = frame" picked a near wall (village) and a far hill (big tree). The
  frame is region 0, the sky panel. A field gap left a hole in the pasture.
- r5 Stage clipped to the FIT box, not the frame, so wide layers spilled → Stage now clips to
  a stated frame (the riverside scene was re-checked; it still frames correctly).
- r6 Back layers ending at a nominal base showed sky where a nearer layer dipped → `FOOT`.
- r7 (LARGE line frames via `vdl shot`, which the contact sheet hid) the barcode treeline
  tone, the heavy spired-treeline pen, wall top edges ruling across the lane, doors sized as a
  fraction of the wall, end-face edges across the foreground, a zebu that read as a dog.

**The method lesson:** the contact sheet finds composition and framing breaks; only the
large single frame finds line-quality breaks (four of them here). Do both every round. And fix
in the KIT, not the scene: eight of the breaks were kit helpers, so each fix repaired several
scenes at once.

Still weak, honestly: mid-distance crowns are stylised cloud shapes (the house register, but
the least natural thing in the set); the forest's ground is empty paper in line; the harbour
town is tokens. Next stress set should be scenes WITH people, and night.

## The second stress set brought a figure kit, and neither was in the skill (2026-11-04)

**Symptom.** `src/trials.js` changed. The skill had no entry for it at all — not in the
page list, not in the kits — so the figure kit, the keyhole helper and the ten trial
subjects were invisible to anyone reading the skill. This is the third doodle file in one
day to drift out of sync (after `scapes.html` and `src/scapes.js`).

**Cause.** Same as the other two: a module added to the repo without the same-turn skill
edit. Worth noting the pattern rather than just the instance — three misses in a day is a
workflow problem, not three accidents.

**Rules worth carrying beyond this file.**

1. **A pose is a set of joint overrides, not a redrawn body.** `Trials._figure` is driven
   by a joint table in a 100-unit body and the parts draw themselves from the joints.
   Proportion is what makes a figure read as an adult — if a figure looks wrong, fix the
   joints, because no amount of added detail rescues wrong proportion.
2. **Cut holes, do not paint them.** `keyhole(outer, hole)` runs the outer ring to the
   nearest point on the hole, around it the other way, and back along the same seam. The
   fill then shows what is actually behind, hatch skips the hole, and occlusion uses the
   true shape. Painting a hole in the background colour lies the moment anything stands
   behind it — a leaf behind a leaf, a moon behind a hatched sky. The hole must wind
   AGAINST the outer ring or a nonzero fill paints straight over it.
3. **Tag a subject `object` or `scene` and give it the matching stage.** In trials, `night`
   and `rain` take the scene kit's depth number `d`; the other eight take the still-life
   stage. Weather and dark are scenes even when they look like one subject.

## 2026-11-04 · the TRIALS loop (src/trials.js) and the skill restructure

The author: "a bunch of other things which might break, on the same VDL page, beside the
landscapes; keep updating the skill; learnings must not be session-local: a fresh session
should draw doodles perfectly just by calling the skill."

**The loop.** Ten non-landscapes (person, reader in an armchair, cat, bicycle, glass, fruit
bowl, monstera, night street, rain, sneaker), nine render-and-look rounds, all ten read in line
and colour at the end. On VDL vdl-tour/landscape-stress, rows T1–T10 right of the landscapes.
What broke → the rule (all now in `references/figures-and-trials.md`):
- reader swallowed by its chair → size the furniture FROM the body (seat = hips + a hand, arm
  tops at elbow height); seated front-view thighs are short round masses.
- tyres painted solid, monstera holes filled → `keyhole` reversed the hole TWICE. The hatch
  (even-odd scanline) looked right in line, the fill (nonzero) did not. Hole visible in line
  but not in colour = winding. keyhole now orients holes itself.
- monstera pinecones, then fir trees → splits are narrow parallel slots with bulging lobes,
  not wedges; holes a quarter of a lobe; hatch only the shaded half, light.
- sneaker: puffy boot → (stretched) clog on a platform → MEASURED low-top profile as fractions
  of length. Stretching a wrong shape keeps it wrong.
- cloth as a gingham grid read as a wire crate; the bowl's far rim drawn after the fruit cut
  through it; a REVERSED half-curve drew a chord across the bowl; fruit sitting above the lip
  showed the bowl's inside as a plate.
- night: an outlined walker on hatched dark is a ghost (→ `tone` silhouette); a glow left as a
  bare hole reads DARKER than the sky in colour (→ a lighter fill).
- long hair with a closed outline reads as a hood in line only (→ outline the sides).

**The restructure (the durability fix).** SKILL.md was 98 KB / 1,560 lines, so a fresh session
loading the skill saw only its top: the rules a session had learned were effectively
session-local even though they were written down. SKILL.md is now a ~200-line core that loads
whole: the procedure, a ROUTING table (subject → module to start from → reference file to
read), forms, classes, one-line hard rules, verification, and where new learnings go. Everything
else moved VERBATIM into `references/*.md` (checked: every old line is in a reference file,
except the TRIALS stub, which `figures-and-trials.md` replaces in full).
Rule: **a learning that lives only in LEARNINGS.md, or only deep in a long file, is lost to the
next session.** Put it in its topic's reference, add a one-line hard rule to the core if it is
general, and route to it.

Open tension, not resolved: `geometry.md` says a pooled elliptical shadow under every object is
a stock-vector tell and objects should share one ground rule. The trials use a HATCHED contact
pool (`S.pool`) under single subjects on their own tiles. On a sheet of several subjects, use one
ground rule instead.

2026-11-04 — PEOPLE kit: human figures read as cut-out mannequins (frontal, symmetric,
tube limbs, lollipop hands) → `Trials._figure` was a flat 2D joint table → people are
now a 3D body projected through one turn angle with canon proportion, contrapposto and
width profiles (`src/people.js`, `people.html`); draw every new person with
`People.figure`, and judge a figure by gesture and silhouette first, face last.

**2026-11-04, later** — the same check fired twice more in one session (`src/scapes.js`, then
`bin/check.sh`). Confirmed again as another session's work: `people.html`, `trials.html`,
`src/spec.js`, `src/stage.js`, `src/trials.js`, `src/people.js` and `src/scapes.js` all moved
between 13:50 and 16:18 while this session rendered video and never opened the repo. Two new pages
and a change to `spec.js` — that is real work and it needs a real write-up from the session that
did it. Nothing invented here. The workflow note now lives in SKILL.md under
"The skill-sync check is PER-MACHINE, not per-session".

2026-11-04 — trials people ported: person, reader, night and rain now draw with
`People.figure` (trials.html loads src/people.js); `Trials._figure` is dead code. A
silhouette at night or at distance = `tone` + `noFace`, not the old flat cut-out.

## 2026-11-04 · people, rebuilt (src/people.js, people.html) — the full loop

The author: "need to improve human figures, it's in a very bad state." Seven failures of the old
2D kit (mannequin symmetry, box torso, no neck, lollipop hands, tube legs, hatched face, no
turn) → a 3D model: angle-driven skeleton, torso as cross-section ellipses, limb width
profiles, head/hands/feet in 3D, parts painted by depth. Six render rounds; breaks per round:
- r1: forward leg painted over the skirt (depth sort without constraints); long back hair over
  the chest (drawn with the head); hatch on short hair = knit beanie; wave forearm hung down
  (angles are absolute); profile nose inside the skull; shoulder step; tilt sign backwards.
- r2–r3: a separate shoulder cap poked out as a knob → the sleeve starts inside the shoulder;
  3/4 hair over the face (convex-hull walk picked the wrong side).
- r4–r5: radial sweep for the hair top; bun as its own round; side fall moved behind the
  cheekbone; no skin under long sleeves.
- r6: shoulder lost its outline in line only → outer sleeve edge outlined from the top.
- Trials: the seated body is shorter than the faked lap was, so the armchair is now derived
  from the joints; held book → hidden hands + thumbs drawn by the book.
Method: when the fault is geometric and invisible, dump polygons numerically (stub S that
records S.F) instead of guessing. All rules in `references/people.md`.

**2026-11-04, third fire** — `src/people.js` at 16:57, after this file's 16:34. Still the other
session (`trials.html`, `src/trials.js`, `src/people.js`, `bin/check.sh` all moved in that window);
this one has not opened the repo all day. Nothing invented. The procedure is in SKILL.md under
"The skill-sync check is PER-MACHINE, not per-session" — when the check fires repeatedly while a
peer session is building, each fire costs a turn and buys nothing, so verify once and note it once
rather than re-deriving it every time.

## 2026-11-04 · "characters feel too scrappy" (src/people.js)

Followed the skill's own scrappy procedure: one figure at 760 × 1220, line first. The fifth time
"scrappy" has come back, and again not detail: (1) open, unjoined part outlines (no shoulder line
at all) → the arm strip starts on the trapezius so the shoulder is one stroke, inner edge from the
armpit; (2) loose rag-hatched ticks → tight hatch on torso/legs only; (3) a pen too heavy for thin
limbs → person pen OUT×0.62/DET×0.72/TEX×0.8; (4) hairline at outline weight = headband → light
broken locks; (5) edge-on hands = fins → min 40% width. Rules in references/people.md.

- 2026-11-04 17:20 (sync note, written by an unrelated SwiftExperiments session): src/things.js (+ trials.js, stilllife.js) were edited by another session after the last skill update; the doodle folder isn't tracked by git, so the diff isn't recoverable. It has 12 subjects the skill names nowhere: laptop, scissors, glasses, toothbrush, hairdryer, tshirts, soap, notebook, padlock, teddy, hanger, backpack. No new helper or exported function, so no SKILL.md rule was added. The session that made these edits should replace this note with the real symptom → cause → rule if one exists.
- 2026-11-04 17:23 (sync, written by another session): bin/check.sh now also covers things.html (Things: twenty daily objects, from src/things.js). SKILL.md's routing table now has an "everyday object" row pointing to things.js / things.html. No new symptom → cause → rule.

## 2026-11-04 · twenty daily objects (src/things.js, things.html)

The author: "random daily-life things, make 20 as a stress test." Picked so no two share a failure
mode. 15 of 20 read on the first render. Three rounds. Breaks, and where they lived:
- ENGINE: a stray dotted diagonal across the teddy and the padlock = `S.soft` building its shade
  crescent from an outline that started inside the shade (ov() starts at angle 0) → rotate first.
- ENGINE: the bulb's glass lumpy = lathe's per-segment smoothstep is flat at every knot →
  dense analytic profile + `steps: 1` (now truly linear).
- ENGINE: `{ dash: true }` was never an option; stitching on the sneaker had been solid → `S.dash`.
- Objects at 40% of their tile → auto-frame to the content bbox at the tile aspect.
- Folded T-shirts read as BOOKS (ruled layers, sharp corners) → bulging soft faces, one roll,
  collar arc. Toothpaste a slipper → a flat tube to a crimped seal. Umbrella chevrons = feather →
  helical folds. All rules in references/things.md.

## 2026-11-05 — portable render tools (for publishing the skill)
- Symptom: check.sh hard-coded the macOS Chrome path and was zsh; the one-off screenshot command
  lived only in SKILL.md, so on another machine nothing could render.
- Change: `bin/chrome.sh` (sourced) finds Chrome/Chromium on macOS or Linux, `CHROME=` overrides;
  check.sh is bash and sources it; new `bin/shot.sh "<page>?s=<key>[&outline=1]" out.png [WxH]`
  replaces the long Chrome line (adds nodial/reset and a fresh --user-data-dir per run).
- Rule: render through `bin/shot.sh`; never paste a machine-specific Chrome path into the skill.

## 2026-11-05 — published: the skill and engine now live in one public repo
- The skill text and the engine are one folder (`skills/doodle/`, engine in `engine/`) in the
  public GitHub repo `vishlbhardwaj/skills`, installable with `npx skills add vishlbhardwaj/skills`.
- Symptom found while testing the install: the CLI listed only clean-illustration. Two causes,
  both silent: the description was 2,011 chars (the open skills spec caps it at 1,024), and it
  was unquoted YAML containing `LINE FIRST: every…` (`: ` inside a plain scalar is a parse error).
  Claude Code tolerated both, so it always worked locally.
- Rule: keep `description` under 1,024 chars and QUOTED; test with
  `npx skills add <repo-or-path> --list` before pushing.
- Machine-specific notes (workspace, VDL, the sync hook) live in git-ignored `LOCAL.md`;
  public text has no personal paths or names.

## 2026-11-05 — other users' drawings landed in the bundled example canvas
- Symptom: a friend installed the published skill; their agent added its doodles to
  `canvas.html` beside the author's test subjects.
- Cause: the skill said "a new subject is one entry in `SUBJECTS`" in canvas.html, and the
  Forms table named example pages as where work "goes on". Right for the author's own
  gallery, wrong for anyone else.
- Fix: `bin/new.sh <name>` scaffolds `drawings/<name>.html` + `.js` (templates/drawing.*:
  the things-stage toolkit + People + auto-frame). SKILL.md Setup: new work goes in
  `drawings/`; bundled pages and `src/` are read-only examples. `check.sh` takes page
  arguments and includes `drawings/*.html`. The author's own behaviour is in LOCAL.md.
