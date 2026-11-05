---
name: doodle
description: "Draw anything as a code-generated, hand-drawn-looking line illustration with the doodle engine bundled in this skill (plain HTML + JS, no build). Line first: every doodle is a finished line drawing (?outline=1) before colour. Covers objects, products, people, animals, plants, flowers, buildings, interiors, landscapes, night and weather scenes, dioramas, storyboards and lettering, in marker or pen-and-ink with hatch, cross-hatch, ribs and stipple, in perspective or axonometric. Each form has a measured class (pen, nib, fill, tone, framing). Use whenever asked to doodle, sketch, illustrate, board or visualise a thing, a place, a sequence or a reference image. Triggers on doodle, sketch this, illustrate, line art, pen and ink, hatching, draw me a, watch it draw, storyboard, scene, landscape, building, interior, product, plant, person, character, animal, stress test."
---

# Doodle

A code-drawn illustration system. Subjects are authored as geometry, projected
through a camera, and rendered by a seeded "hand" that makes a mark look drawn.
Plain HTML + JS, no build, no dependencies: open a page in a browser.

## Setup: where you work

The engine ships inside this skill at `engine/` (next to this file). **Never edit
it there**; an update of the skill overwrites it.

1. If `LOCAL.md` exists next to this file, read it first: it names this machine's
   workspace and tools, and it overrides the default below.
2. Otherwise the workspace is `./doodle` in the current project. If it does not
   exist, create it: `cp -R "<this skill's folder>/engine" ./doodle`.
3. Every path below (`src/…`, `bin/…`, `*.html`) is relative to the workspace.
   Rendering and checks need Chrome or Chromium (`CHROME=/path` to override) and
   python3; nothing else.

**This file is the whole contract, and it is short on purpose so it loads
whole.** The detail lives in `references/` (moved there verbatim, nothing
dropped). The ROUTING table below says which reference to read for the job.
Reading it is part of the job, not optional: every rule in those files was paid
for with a rejected drawing.

## The procedure, every time

1. **Name the FORM and the CLASS** (tables below). The form decides the page,
   framing and detail budget; the class decides the pen, nib, fill and tone.
2. **Route.** Read the reference files the routing table names for your
   subject, and open the module it names as your starting point. Never start a
   subject from a blank file when a kit already exists for it.
3. **Measure before drawing.** From a reference image: proportions and
   palette, probed, never recalled. Without one: write the subject's
   proportions down as numbers in the module header (the shoe needed eight
   numbers; three renders without them failed). `references/hand-and-craft.md`
   § Measurement.
4. **Build LINE FIRST.** Judge `?outline=1` before colour. Every value is
   carried twice, as a fill and in line. Detail falls off from focus to
   mid-ground to paper. `references/line-first.md`.
5. **Render and LOOK, in line AND colour, at frame size.** Contact sheet for
   composition, the large single frame for line quality. Both, every round.
6. **Fix in the KIT, not the subject**, when the break is a helper's. Loop
   until every subject reads.
7. **`bin/check.sh`**: every page renders, the expected count, no NaN, no
   console errors, no class drift. Add a new page to its list.
8. **Fold what you learned into this skill IN THE SAME TURN** (§ Evolving).

## Routing: what to read, where to start

| Subject | Start from | Read |
|---|---|---|
| any doodle, first time in a session | n/a | `references/line-first.md`, `references/forms-and-classes.md` |
| an everyday object (phone, keys, bottle, cloth, glasses …) | `src/things.js` (nearest of 20; `cam`, `S.prism`, `S.on`, `S.dash`) | **`things.md`** |
| a product, device, gadget, appliance | `src/retro.js` (`Retro._kit`) | `products.md`, `geometry.md` |
| a round object (cup, vase, fruit, bottle) | `src/stilllife.js` stage (`lathe`, `ball`) or `src/still.js` | `still-life.md`, `geometry.md` (path construction) |
| a still life / arrangement / from a photo | `src/stilllife.js` | `still-life.md` |
| furniture | `src/furniture3.js`, `src/kitchen.js` | `products.md` |
| an everyday object (laptop, scissors, glasses, toothbrush, hairdryer, t-shirt, soap, notebook, padlock, teddy, hanger, backpack, bottle…) | `src/things.js` `def(...)` (`things.html`, "twenty daily objects") | `products.md`, `geometry.md` |
| a PERSON, people, anyone in a scene | `src/people.js` `People.figure` (`people.html`); never `Trials._figure` (dead) | **`people.md`** |
| an animal | `src/trials.js` (`cat`) | `figures-and-trials.md` |
| glass, liquid, transparency | `src/trials.js` (`glass`) | `figures-and-trials.md` |
| a bicycle, a frame, anything of thin tubes | `src/trials.js` (`bicycle`), `S.limb` | `figures-and-trials.md` |
| a shoe, a garment, cloth | `src/trials.js` (`sneaker`, `fruit` cloth) | `figures-and-trials.md` |
| plants, flowers, leaves | `src/plants3.js`, `src/flowers.js`; holed leaves: `trials.js` `monstera` | `plants.md`, `figures-and-trials.md` |
| a building, house, facade | `src/houses.js`, `src/arch.js`, `src/arch2.js` | `architecture.md`, `geometry.md` |
| a landscape, outdoor view | `src/scapes.js` (the scene kit) | **`landscapes.md`** |
| night, dark, weather, rain | `src/trials.js` (`night`, `rain`) on the scene kit | `figures-and-trials.md`, `landscapes.md` |
| a street, a diorama, a café | `src/cafe.js`, `src/scenes.js` | `landscapes.md`, `geometry.md` |
| a room / interior | `src/kitchen.js`, `src/deskscene.js` | `geometry.md`, `landscapes.md` (fidelity) |
| pen and ink, no colour | `src/pen.js`, `pen.html` | `line-first.md` (tone), `forms-and-classes.md` (`ink`) |
| a storyboard / sequence | `src/board.js`, `board.html` | `storyboards.md` |
| lettering, a sign | `src/letter.js` | `pages-and-files.md` |
| make it move (Rive) | the Rive exporter (not bundled; see the file) | `animation.md` |
| watch it draw, underdrawing | `?draw=<key>`, `?sketch=1` | `hand-and-craft.md` |
| clean / vector / not doodly | n/a | use the `clean-illustration` skill |
| a SET, a stress test | an existing set page as template | `checking.md` |
| which page / file does what | n/a | `references/pages-and-files.md` |

All `references/` paths are relative to this skill folder.

## Forms

| They said | Form | Goes on | Detail budget |
|---|---|---|---|
| "draw me a mug / a chair" | subject | `canvas.html` (one entry in `SUBJECTS`) or a set page | everything, one thing at full fidelity |
| "make me N of them" | set | its own page, `?s=<key>` per tile | one toolkit, detail lives in the toolkit |
| "a house / a shopfront" | elevation | `houses.html`, `buildings.html` | three bays, 55% solid black fill |
| "a street / a view / a landscape" | scene | its own page, stated frame + clip | the three-rung depth ladder |
| "the whole block / a little world" | diorama | its own page | the block's edges stay IN the picture |
| "a room" | interior | `canvas.html` | foreground full, back wall characteristic |
| "storyboard this" | board | `board.html` | set by SHOT SIZE, not the subject |
| "pen and ink / no colour" | register `ink` | `pen.html` | tone carried in line, no fill at all |

**A set is not a scene** (things on one page share nothing but a sheet), and **a
board is not a set** (equal fidelity loses the sequence). The tell: must the things
share the SAME SPACE? Then it is a scene.

## Classes (`src/spec.js`; full text in `references/forms-and-classes.md`)

| class | pen | nib | fit | fill | tone |
|---|---|---|---|---|---|
| `object` | 0.30 | firm | .84/.84 | flat, shaded by face normal | shadow is a darker FILL, plus its line twin |
| `ink` | 0.26 | pen | .90/.88 | NONE, the paper is the object | line only; a dot screen is forbidden |
| `product` | 0.30 | firm | .84/.84 | one material = one colour | creases > ~35° only |
| `elevation` | 0.30 | firm | .86/.84 | 55% solid black panes | hatch roofs, the shadow side |
| `plant` | 0.30 | firm | .84/.88 | flat; pale shade .96, others .84 | scribble for mass foliage only |
| `flower` | 0.26 | firm | .92/.90 | flat | none |
| `scene` | 0.30 | firm | .96/.94 | flat; shadow a darker fill | hatch only where nothing stands in front |
| `diorama` | 0.22 | firm | .94/.92 | flat | none |
| `panel` | 0.26 | firm | .94/.94 | flat, less than the subject alone | one value ground, one sky |
| `furniture`, `interior` | 0.16 / 0.15 | pen | — | LEGACY weights; new work takes `object` | — |

**Declare the class, never retype the numbers:** `Spec.wrap(cls, label, build)`.
`bin/check.sh` audits drift on every page. A class owns the hand; a page owns
the paper. Add a class only when the fill or tone policy genuinely differs.

## Hard rules (each one is a rejected drawing)

**Line first and fidelity**
- Line only (`?outline=1`) must be a FINISHED drawing. Every page honours
  `?outline=1`; check pages you copied (one hard-coded `outline: false`).
- Every value is carried twice: dark material = hatch; a turn = ribs that bow with
  the surface; a cast shadow = hatch with no outline; a mark that NAMES the thing =
  an outlined mark, never a `w: 0` fill. Audit every `w: 0`.
- Focus gets full detail, the mid-ground contour plus 2–3 lines, the background is
  PAPER (its only tone the shadow the subject throws). Squint: if the wall is as
  busy as the subject, cut the wall.
- Hatching is QUEUED as lines (`S.hatch`), never a `k.T` tone; later fills cut it.
  `gap` is the value: 2.4 light, 1.5 mid, 1.1 dark. Cross-hatch only the ONE darkest
  thing in the focus.
- A shadow side is a CRESCENT bounded by curves that bow with the form, never a
  straight half-plane cut (that reads as an object split in two).

**Geometry and path construction**
- A straight line you did not author is a path bug: a chord from concatenating two
  halves in the wrong direction, or an open shape stroked `closed`. Print the points.
- A band round an opaque body is its NEAR half only; only an open mouth is a full ellipse.
- **Holes are CUT (`keyhole`), never painted** in the background colour. Hole shows
  in line but not in colour = its winding.
- Thin things (limbs, tubes, stems) are ONE strip through their joints; outline the
  sides, let the ends plug into what is drawn later.
- Containers: inside → far rim → contents → front wall. Contents sink below the lip.
- **Measure proportions as numbers before drawing a known object.** Stretching a
  wrong shape keeps it wrong (the shoe).
- Size the furniture from the body that uses it, never the reverse.
- **People: `People.figure` only.** Gesture before detail (weight on one leg, hips and
  shoulders tilt opposite); poses are ANGLES so proportion is locked; furniture and held
  things are derived from the returned joints. Back hair paints before the body.
- A long straight dotted line across a soft shape = the crescent-wrap bug (fixed in `S.soft`);
  a wavy lathe = few knots + per-segment easing: use a dense profile with `steps: 1`.
- `{ dash: true }` does nothing: use `S.dash`. Frame objects to their content bbox, not by eye.
- "Scrappy" = construction, not detail: judge ONE subject at full size; outlines must JOIN
  (no open ends at joints), tone is tight and regular or absent, pen weight fits the form's width.

**Framing**
- The frame is DERIVED, never typed: on the picture-plane kits it is the FIRST
  region's bounds, so the first call is `S.panel(<the frame>)`; with a camera, from
  the projection. Something not visible? Check it is inside the frame before
  redrawing it bigger. `clip = true` clips to the stated frame.
- Every ground layer runs to the frame bottom (`FOOT`), or sky shows where a nearer
  layer dips. One ground rule reaches both edges of a sheet, not past them.

**Scenes, night, weather**
- Depth is a number `d` (0 near, 1 far) and pen, hatch gap, colour and detail all
  read it. A mountain at the bench's weight is THE flat-landscape failure.
- Night inverts value: the sky is the densest hatch, every light a keyholed gap; a
  glow is LIGHTER than the sky. A figure against light is a hatched silhouette.
- Rain is drawn last, absent under an umbrella; a reflection is the subject flipped,
  squashed, in broken bands, no outline.

**Pages and palettes**
- A page must declare every palette key its subjects use; an unknown key once
  rendered black silently.
- Parallel headless Chrome runs need a separate `--user-data-dir` each, or shots
  come back blank.

## Verify

```bash
cd <workspace>          # see Setup
bin/check.sh                                   # every page: count, NaN, console, class drift
bin/shot.sh "<page>.html?s=<key>&outline=1" out.png [1120x700]   # then drop &outline=1 for colour
# both find Chrome/Chromium via bin/chrome.sh (override: CHROME=/path); shot.sh adds nodial/reset
# and its own --user-data-dir, so parallel runs are safe
```

Look at every PNG (open it, or read it if you can see images). A passing
`check.sh` proves it rendered, not that it reads.

## Evolving this skill

When you fix a gap, write it down where a FRESH session will find it (if this
skill is installed read-only, keep these notes in the workspace and say so):

1. **The topic's reference file** (`references/<topic>.md`): the rule, with its
   symptom, stated as an instruction. Create a reference file for a new topic and
   add it to the ROUTING table.
2. **This file's Hard rules**, as one line, if it applies beyond one subject.
3. **New page, module or helper**: the routing table here and
   `references/pages-and-files.md`.
4. **`LEARNINGS.md`**: the dated history (symptom → cause → rule). It is a log,
   not the instructions: it is long, so `grep` it rather than read it whole. A rule
   that lives ONLY in LEARNINGS.md is lost to the next session; promote it. Older
   entries mention VDL (The author's private design canvas) and Rive projects that
   are not bundled; the rules in them still hold, skip those steps.

Keep this file short enough to load whole (target under ~300 lines). If it grows,
move detail into a reference file and leave a one-line rule here.
