# Checking and working method

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## What `bin/check.sh` can now catch — and what it still cannot

    pen / nib / fit drift from the declared class
    tone kinds the class forbids          <- new
    palette keys the page never declared  <- new
    NaN / Infinity in the output, console errors, a page that drew nothing

**Tone policy is enforced, not described.** Every class row carries a
machine-readable `tones: [...]` beside its prose, and `Spec.audit` BUILDS the
subject and checks the kinds it emits. This existed as a paragraph for weeks
while `src/still.js` put a halftone screen on seven subjects in flat breach of
its own class — `object` has always said *"shadow is a DARKER FILL, not
hatch"*. Nobody noticed, because the audit only ever looked at the hand.

The line the table draws is between a SCREEN and a MATERIAL: `halftone` is a
regular dot grid and therefore a printing artefact, banned on anything drawn
by a hand. `stipple` is scattered grain and is allowed where the thing really
is granular — the sand in the hourglass, the disc florets of a daisy. The
prose carries the judgment the list cannot.

**A missing palette key used to render black, silently.** `Q[key] || key` fell
through to the raw string and the browser drew an unreadable colour as black —
which is how the board's armchair shipped as a slab. `Stage.swatch` now records
the key and renders a flagrant grey, and the checker reads the record.

> It reads the RECORD, not the console. The first version logged to
> `console.error` and relied on `bin/check.js` picking it up; that never fired,
> because check.js is injected at the end of the page and replaces
> `console.error` *after* every subject has already drawn. It reported a clean
> sheet on a page with a colour deliberately deleted. **A check that can only
> see things which happen later is not a check** — verify the checker by
> breaking the thing on purpose.

Still NOT caught, and all three produced a rejection this week:

- whether a subject is inside its frame
- whether it is legible at the size it will be looked at
- ink coverage — the old paths-per-subject proxy does not transfer to tone-
  heavy pages, where an entire hatch field is one path

## Working method

1. Measure the reference. Write the numbers down in the module header.
2. Geometry first, in `raw.html`. Judge it with no hand on it.
3. Add the hand. Render at the size it will be judged — `?focus=<key>`.
   **Judge `?outline=1` FIRST, then colour.** Line must be a finished drawing
   with a clear focus. Squint: if the background is as busy as the subject,
   strip the background back to paper + cast shadow.
4. **Look at it.** Every failure in this system's history was found by
   rendering and looking, never by reading the code.
5. One broken subject must not take the canvas down — `drawSubject` is
   wrapped, but check the console.
6. **Run `bin/check.sh`** (canvas, buildings, plants, scene, retro and cafe pages). It asserts that every subject in `SUBJECTS` or
   `CELLS` actually rendered, that no NaN reached the output, and that nothing
   hit the console — and exits non-zero if not.

   It also **audits class drift**: any module that declares `mod.cls` must
   draw at that class's pen, nib and fit, or the page fails. Add a subject
   with `Spec.wrap` and it is guarded from the first render.

   **A count is not a check.** For a whole session verification printed a tile
   count that nothing compared against anything, so a shortfall of ten
   subjects read as a plausible total and went unnoticed. Assert against the
   expected number, or do not bother measuring.
7. **New subject that should move?** Tag its parts, add its beats, re-export
   (absolute path), `python3 gen.py`, `rive . --verify`, screenshot at 2–3
   times, look at `canvas.html`.
8. **Append what you learned to `LEARNINGS.md` in this skill folder.** That
   file is the point: the skill is supposed to get better.
