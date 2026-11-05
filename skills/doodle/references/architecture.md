# Architecture: buildings and house sets

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## Architecture — buildings and houses

`src/arch.js` exports the toolkit as `Arch._kit`; `src/arch2.js` builds on it and
exports its own helpers as `Arch2._kit`; `src/houses.js` uses both (counts:
`bin/check.sh`, never memory). **One vocabulary is what holds a varied set
together**: every window, sill, door, cornice and pot is the same object across
all twenty-one. The FORMS vary — gable, tier, taper, setback, turret, frame —
while the hand, the stroke hierarchy and the black-pane convention do not. Vary
both at once and you get twenty-one unrelated drawings.

    massing({ w, d, top, f, dist, yaw })  → { k, V, W, D, TOP, H, front, flank }
    slab(k, x0,x1, yTop,yBot, z0,z1)      box, camera-facing faces only
    windowF / doorF / bandF / rectF       flat detail in (u, v) on a face
    oculusF / awningF / chimney / pot / pavement
    drum / coneRoof / gableRoof / gableToStreet / hipRoof / columns / railing
    ridgeRoof (houses.js)                 ridge along x, VISIBLE edges only
    circleF / circleOut (houses.js)       a circle on a face → its perspective ellipse
    hull(revolve(V, cx, cz, prof))        the TRUE outline of a dome / saucer / any surface of revolution

**A cylinder hides half of each of its own rings.** Bottom ring: near half
only. Top ring above eye level: far half only; below eye level the whole
ellipse shows. This applies to EVERY ring, not just the ends — the
intermediate bands on a windmill, silo, tank and lighthouse all bypassed the
helper and drew their hidden back halves straight across the front.

**Two masses must not share an edge.** A tower straddling a nave's own corner
makes their roof lines cross and neither reads.

**`ArchOpts.fillPanes`** (default true) switches window panes between solid
black and drawn joinery — frame, sash, glazing bars, lintel. Filled is what
the measured reference does and what the canvas uses; drawn is for a live
recording, where a fill is one instant but joinery is a dozen watchable
strokes.

**Some forms are massing, not facade.** Adobe as a single extruded rectangle
with two windows is a shed in any language. Ask what the TYPE is made of
before drawing its elevation.

### Making a SET of house types (houses.js; count: bin/check.sh)

**Pick by FORM, not by name.** Every type earns its place by a form nothing
else in the set has: the roof IS the wall (A-frame), an asymmetric gable
(saltbox), round (yurt), lifted (stilt), floating (houseboat), carried by a tree,
buried in a mound, on wheels, stacked boxes. Two types sharing a form (two tiered
roofs, two round drums) is one type twice. Check arch / arch2 / houses first.

**Ask which FACE carries the type, then turn the camera to it.** The saltbox at
yaw −30 read as a plain gable; its identity is the long rear slope, which only
exists on the flank. At −40 it reads at a glance. Detail cannot fix the wrong face.

**Roof helpers draw hidden edges — draw a roof's VISIBLE edges.** `gableRoof`
draws both legs of the far gable; against a tall front wall the back leg lies
across the facade (machiya). Use `ridgeRoof`, or write the edges yourself.

**Texture stops at the profile, not at the wall's bounding box.** Clapboard run
the full height of a saltbox flank stood in the sky behind the long slope. Clip
each course to the profile at its own height.

**A second mass sits BELOW the main eave.** A porch gable whose ridge rises above
the main gable's base crosses it, and the house reads as clutter (bungalow).

**Occlusion against a nearer thing is done by hand — with a silhouette.**
Marks never occlude. When a big mass stands BEHIND a building (a tree canopy, a
hill), build the building's screen silhouette and `cut` the mass's lines
against it, so they stop where the building begins. A canopy is ONE mass: draw
the UNION outline of its clumps (drop each clump's points that fall inside
another, tested in world space), never each clump whole — whole clumps read as
cartoon clouds and fragments.

**Things that read wrong in perspective:** a cross on a dome turns a house into
a chapel; a helper stretched into an ornament (`windowF` at h ≈ 0) is a black
blot; small path stones smear into a black smudge. Leave them out.

**Water can be the ground**: a waterline plus ripple rows receding with z
(heavier near, finer far) instead of `pavement`.

**A curved solid's outline is COMPUTED, not drawn.** A dome or saucer seen from
off its axis has an outline no ring gives you. Sample the surface
(`revolve`), project it, take the convex `hull`, and draw that, plus the near
half of each ring. The igloo, the Futuro pod and their courses and seams all
came right on the first render this way.

**Polygon plans: draw the walls that face you.** For an octagon (or any n-gon),
test each wall's projected quad by signed area, author its windows on
`V.face(corner, unit(edge), down)`, and draw hips only from the eave corners of
visible walls.

**Natural mass is jagged and broken.** A cliff authored as a smooth,
symmetric `curve: true` outline with curved bedding lines read as a thatched
hangar. Rock is straight segments at irregular angles, asymmetric, with
bedding broken often, a few angular cracks, and boulders at the foot.
