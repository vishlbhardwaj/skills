# Forms and classes (full text)

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## What are you being asked to make?

Answer this before anything else. The same request — "draw me a café" — is
five different jobs depending on the form, and each has a different page, a
different detail budget and a different way of failing.

| they said | form | class | goes on | the detail budget |
|---|---|---|---|---|
| "draw me a mug / a radio / a chair" | **subject** | `object`, `product`, `furniture` | `canvas.html`, one entry in `SUBJECTS` | everything. One thing at full fidelity |
| "make me twenty of them" | **set** | the subject's class | its own page (`retro.html`, `plants.html`) | one shared frame, one toolkit, detail in the TOOLKIT so all twenty get it |
| "draw a house / a shopfront" | **elevation** | `elevation` | `canvas.html`, `buildings.html`, `houses.html` | three bays, 55% solid black fill |
| "make me N kinds of house" | **set of types** | `elevation` | `houses.html` (+ VDL, below) | pick by FORM so no two share one; one vocabulary |
| "draw a street / a view / a landscape" | **scene** | `scene` | `src/scapes.js` + `scapes.html` (the scene kit) | the three-rung ladder, depth `d` on every element |
| "draw the whole block / a little world" | **diorama** | `diorama` | its own page | the block's edges stay IN the picture |
| "draw a room" | **interior** | `interior` | `canvas.html` | foreground full, back wall characteristic |
| "storyboard this / board it / previz" | **board** | `panel` | `board.html` | set by SHOT SIZE, not by the subject |
| "label it / put a sign on it" | **lettering** | the host's class | anywhere | `Letter.write(k, …)`, drawn by the hand |
| "watch it draw / record it" | **performance** | unchanged | `?draw=<key>`, `d`, `b` | unchanged — this is a replay, not a drawing |
| "make it move" | **animation** | unchanged | Rive (generator not bundled; see `animation.md`) | tag parts and write beats in the SAME change |
| "make it clean / crisp / vector" | **register change** | unchanged | `?style=clean` | hand off — use the `clean-illustration` skill |
| "pen and ink / no colour / just line / hatching" | **register change** | `ink` | `pen.html` | tone carried in LINE, no fill at all. See `src/pen.js` |

Two forms are frequently asked for as one and must not be: **a set is not a
scene** (twenty subjects side by side share nothing but a sheet), and **a
board is not a set** (eight panels drawn at equal fidelity lose the
sequence). If the brief is genuinely ambiguous, the tell is whether the
things in it have to be in the SAME SPACE. If they do, it is a scene; if they
merely have to be on the same page, it is a set; if they happen one after
another, it is a board.

## Classes — the guardrails, and why they are numbers

**A class owns the hand. A page owns the paper.** That is the rule the rest of
this section exists to enforce.

It was learned the expensive way. Stroke weight, nib, fit and tone policy were
being decided per module and per page, so the same ten plants drew at 4.5px on
`canvas.html` and 7.8px on `plants.html` — 1.7× apart, approved on one page and
quietly wrong on the other for a week. And with one set of numbers in the
system, a coffee mug inherited a landscape's tone rule. A mug and a hillside
are not the same drawing problem and must not share a pen.

`src/spec.js` is the executable table. Every number in it was measured out of
an approved module; nothing in it is aspirational. Read a class before drawing
it:

    Spec.brief("product")      // the whole guardrail, as text
    Spec.of("scene")           // { pen, nib, fit } — feed to Kit.wrap
    Spec.audit(mod, "plant")   // where a module has drifted off its class

| class | pen | px @ ref | nib | fit | fill | tone |
|---|---|---|---|---|---|---|
| `object` | 0.30 | 7.8 | firm | .84/.84 | flat, shaded by face normal | none — shadow is a darker FILL |
| `ink` | 0.26 | 6.8 | pen | .90/.88 | **NONE — the paper is the object** | line only: hatch / cross / **ribs** / **grid** / scribble. A dot screen is forbidden |
| `product` | 0.30 | 7.8 | firm | .84/.84 | flat, one material = one colour | creases only, > ~35° turns |
| `elevation` | 0.30 | 7.8 | firm | .86/.84 | **55% solid black** — the panes ARE the drawing | hatch on roofs and the shadow side |
| `plant` | 0.30 | 7.8 | firm | .84/.88 | flat; pale fills shade 0.96, others 0.84 | scribble for mass foliage only |
| `flower` | 0.26 | 6.8 | firm | .92/.90 | flat, same shade rule | none |
| `scene` | 0.30 | 7.8 | firm | .96/.94 | flat; shadow a darker fill | hatch only where nothing stands in front |
| `diorama` | 0.22 | 5.7 | firm | .94/.92 | flat throughout | none |
| `panel` | 0.26 | 6.8 | firm | .94/.94 | flat, and LESS than the subject gets alone | one value for ground, one for sky |
| `furniture` | 0.16 | 4.2 | pen | .84/.80 | flat + a pooled `cWash` shadow | none |
| `interior` | 0.15 | 3.9 | pen | .86/.74 | flat | none |

`px @ ref` is the stroke width at `Spec.REF` (26), the house weight every page
now starts at. A page that sets `weight` to anything else is scaling the whole
sheet deliberately; it is not re-deciding a class.

**The two nibs.** `Spec.FIRM` (pressure .22, wander .045, boil .10, overshoot
.12) is the approved hand — more pressure, less wander. `Spec.PEN` (pressure
.10, wander .07, boil .12, overshoot .22) is the lighter, older one. Firm is
the default for anything new.

**The bottom two rows are LEGACY, not a style.** `furniture` and `interior`
sit at half the house weight because they predate the heavy register. They are
recorded so the drift is visible, not so it is copied. Anything new in those
families should take the `object` pen unless the set is deliberately lighter.

**Declare the class, do not retype the numbers.** A module calls
`Spec.wrap(cls, label, build)` instead of `Kit.wrap(label, build, fit, pen,
nib)`, which tags it with `mod.cls`. `bin/check.sh` then audits every tagged
module on every page and fails on drift:

    FAIL canvas.html  {"drift":1,"fails":["drift plant 'Bird of paradise':
                       pen 0.15 vs class 0.3 (3.9px vs 7.8px)"]}

A guardrail nobody can check is a paragraph.

**Adding a class** is a real decision, not a convenience. Add one only when
the new thing's fill policy or tone rule genuinely differs from every existing
class — not because it is a new kind of object. A bicycle is an `object`. A
cathedral is an `elevation`. A new class needs its numbers measured off
something approved, the same as all the others.

## Before drawing anything

0. **Name the form and the class** (two tables above), then read
   `Spec.brief(cls)`. Everything after this inherits those numbers.
1. **Read `LEARNINGS.md` in this skill folder.** It is the accumulated taste.
2. If there is a reference image, **measure it** (see Measurement below). Never
   describe a reference from memory — the eye is wrong about colour constantly.
3. Check `raw.html?o=<key>` for new geometry *before* adding the hand. Three
   failed shoes and three failed chairs were all geometry, and the hand made
   them impossible to diagnose.
4. **Plan the LINE version and the depth tiers before any colour** (LINE FIRST,
   above): what is focus, mid-ground and background? Which values need hatch? What
   is colour-only? Where does the subject's shadow fall on the background?
