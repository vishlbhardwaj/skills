# People: the figure kit (src/people.js, people.html)

> Part of the `doodle` skill. Read this before drawing ANY person: a portrait-less
> figure in a scene, a crowd, someone sitting, walking or holding something.
> Start from `People.figure`; never hand-author a body. `Trials._figure` is the old
> flat kit, dead code. Do not use it.

## Why it was rebuilt (2026-11-04)

The author: "need to improve human figures, it's in a very bad state." The old kit was a
2D cut-out, and it failed in seven ways:
1. **Mannequin:** always frontal and perfectly symmetric, arms hanging like posts.
2. **Box torso:** square shoulders with "pads", no trapezius slope, no waist.
3. **No neck:** the head sat on the shoulders.
4. **Lollipop hands:** round mittens on the ends of tubes.
5. **Tube legs:** no knee, no calf, pebble feet.
6. **Dirty face:** a hatched crescent on the skin, dash eyes that read asleep.
7. **No turn:** it could not draw 3/4 or profile, or foreshorten a thigh.

The fix was a model, not tuning.

## The model

- **A 3D skeleton driven by ANGLES.** The pelvis is at the origin, y is down, z is
  toward the viewer, and the body is 100 tall. Bone lengths are fixed (canon: 7.4
  heads; shoulder 18, hip joint 51, knee 73, wrist at the crotch, elbow at the
  waist), so no pose can break proportion.
- **One turn angle projects everything.** `turn` 0 faces us, +90 faces picture-right,
  -90 faces left, 180 shows the back. A 3/4 body is a different silhouette, not the
  front one squashed.
- **The torso is cross-section ELLIPSES along the spine.** Each station has a width,
  a depth and a forward offset (TORSO.m / TORSO.f). The silhouette at each station is
  the extreme of its projected ellipse. The front-centre line (fly, coat front,
  neckline) moves across the body as it turns.
- **Limbs are width PROFILES along their bones** (PROF): deltoid → elbow → forearm →
  thin wrist, and thigh → knee → calf → thin ankle. They are smoothed through the
  joints as ONE strip per limb.
- **Head, hands and feet are built in 3D.**
  - The head is an egg with a jaw (`skull()`), with nose and chin points that
    protrude for profiles; its outline is a hull.
  - A shoe is a point cloud from the ankle, turned out by `toe`; its outline is a hull.
  - A hand is shaped from the forearm direction, and its WIDTH follows the turn. A
    hanging hand from the front is EDGE-ON; that is correct, not a bug.
- **Parts are painted back to front by depth (Z).** The kit's deferred occlusion then
  cuts every hidden line. Order constraints that matter:
  - Legs and shoes go before the pelvis, unless the knee comes at you (sitting
    front-on); then they go after it.
  - Back hair is its own part at z = -20, before the body.
  - In near-front views the arms get +2.5, so they draw in front of the torso.

## Usage

```js
People.figure(S, {
  x, gy, h,                 // feet centre, ground y, height in picture units
  turn: 0,                  // degrees
  pose: "stand",            // a name in People.POSES, or an object (spread and override)
  look: { build: "f"|"m", skin, hair, hairStyle: "short"|"bob"|"long"|"bun"|"none", fringe,
          top, topStyle: "tee"|"long"|"tank"|"tucked"|"vneck"|"coat",
          bottom, bottomStyle: "trousers"|"wide"|"shorts"|"skirt", shoe },
  lookDown, noFace,         // eyes as lowered lids; no features (distance)
  tone: { gap, ang, cross, w, min },   // hatch every part: a SILHOUETTE (night, far)
  extras: [{ z, draw(J, P3, sc) }],    // held/carried things at a depth; z may be (J, Z) => …
});                         // returns { J, P3, Z, sc }
```

**Poses are absolute angles in degrees.** Each bone is `[abduct, swing]`: abduct is
out to the side, swing is forward. They are angles of the bone in the world, not
relative to its parent bone, so a forearm pointing UP is `[166, 12]` whatever the
upper arm does.
- `hips`, `shoulders`: tilt, where + = picture-right side DOWN. For weight on L, the
  L hip goes up, so `hips +`, `shoulders −`.
- `lean`: torso forward.
- `head`: `[tilt, turn]`.
- `toeL`/`toeR`: feet turned out.
- `handL`/`handR`: `{ wide, style: relaxed|fist|open, hide }`.

Named poses: `stand`, `neutral`, `walk`, `sitSide`, `sitFront`, `wave`, `cup`,
`pockets`, `umbrella`. Override per figure:
`{ ...People.POSES.sitFront, handL: { hide: true } }`.

## Rules (each one was a broken render)

**Gesture and proportion**
- Weight on one leg: the hips tilt up on the weight side, the shoulders tilt the
  other way, the free knee eases and its foot turns out. The tilt sign was
  backwards in round 1; check the convention above.
- Never hand-place a joint. If a pose looks wrong, change angles; proportion is
  locked in the bones.

**Silhouette**
- The arm grows OUT of the shoulder. The sleeve starts a little inside the shoulder
  (`root`, toward the neck), and its OUTER edge is outlined from the very top.
  - A sleeve butted at the joint left a square step ("shoulder pads").
  - A separate round cap poked out as a knob.
  - An outline starting partway down left the shoulder with no line in line only.
- No skin is drawn under a long sleeve; it peeked out at the shoulder as a fleck.
  Under a tee, skin starts below the sleeve.
- Legs paint BEFORE a skirt, coat or shirt hem whatever their depth: a forward
  swinging leg once painted over half a skirt.

**Head and hair**
- Hair behind the head is a separate part painted BEFORE the body. Drawn with the
  head, long hair landed over the neck and chest like a beard.
- The hairline is high on the forehead, a touch higher at the temples, then drops
  steeply at the sideburn (az 72–96°, behind the cheekbone). A level hairline reads
  as a HAT. A side fall that starts at the eye corner hides a 3/4 face.
- Close the front hair over the top with a RADIAL sweep about the head centre (the
  farthest cap point per angle). Walking the convex hull between the hairline's ends
  picked the wrong side in 3/4 and laid the hair over the face.
- Hair tone is STRANDS from the crown along the fall, never parallel hatch. Hatch on
  a cap read as a knit beanie.
- A bun is its own round at the back of the crown. Folded into the hair hull it made
  a peak.
- The nose and chin must protrude PAST the skull, or a profile has no face.
- No tone on skin, ever. Eyes are small solid dots (or lids when `lookDown`). Dashes
  read asleep.

**Sitting and holding**
- A seated body is SHORTER than the old faked lap suggested. Seat height is
  shin + foot, about 27 of 100. DERIVE furniture from the joints inside `extras`:
  - seat just under the hips, seat width = hips + a hand each side;
  - arm tops at elbow height;
  - an armchair back to the head.
  Hard-coded chair numbers from the old kit floated the sitter (a bench with cushions).
- Hands that HOLD something are drawn by the held thing. Hide the hand
  (`handL: { hide: true }`) and draw thumbs over the object's edge in its `extras`.
  Default hands under a book lay across the pages like carrots.
- Figures against the light, or far away: `tone` + `noFace`. An outlined figure on a
  hatched night reads as a ghost.

## "Too scrappy" (round 7) — what it was, measured at full size

The author: "characters feel too scrappy." Judged at 760 × 1220 on ONE figure, not on the sheet.
None of it was pose or proportion; all of it was construction and pen:
- **Broken outlines.** Every part drew its own open strokes and they did not meet: no line
  over the shoulders at all, hooks dangling at armpits and neck. Fix: the arm's chain starts
  ON TOP OF THE TRAPEZIUS (`root`, beside the neck), so the strip's OUTER edge is the
  shoulder line, neck → deltoid → elbow, in ONE stroke; the INNER edge is drawn only once
  the arm has left the body (`pit`: farther than 5.4 units from the shoulder joint).
- **Ragged ticks.** Shadow hatch at gap 1.7 with `rag` left a few loose dashes along each
  edge: fur, not tone. Fix: tight regular hatch (gap ~0.95, no rag) on torso and legs only;
  NONE on sleeves or arms (too narrow for a hatch to read as anything but ticks).
- **Pen too heavy for thin forms.** A person's pen is lighter than an object's: OUT × 0.62,
  DET × 0.72, TEX × 0.8 of the kit's. Face features at TEX × 1.3, never DET.
- **The hairline drawn as a silhouette** read as a headband. It is where hair meets skin:
  a light line broken into locks; only the hair's outer arc gets the outline weight.
- **Edge-on hands read as fins.** A hand is never shown narrower than ~40% of its width.

## The study set and where it lives

`people.html?s=<key>` (`&outline=1` line only): `stand` (weight shift, long hair),
`threeq` (3/4, cup), `walk` (profile, bun), `sit` (stool, profile, phone), `wave`
(shorts), `pockets` (3/4 away, bob), `dress` (coat over skirt), `group` (three turns
together). On VDL: `vdl-tour / landscape-stress`, the third block (x ≈ 3200), rows
P1–P8, line | colour. Trials `person`, `reader`, `night`, `rain` use this kit.

**Method:** six rounds. Render all poses in line and colour, then contact sheets plus
LARGE upper-body crops; faces and shoulders only show their faults large. When a
shape is wrong but the cause isn't visible, dump the polygons numerically instead of
guessing. A headless page with a stub `S` that records `S.F` calls found the hair
geometry in one pass.

**Still weak:** the hands are simple mitts (no fingers unless `open`); there are no
crossed arms, children, or close-up faces; and folds are generic.
