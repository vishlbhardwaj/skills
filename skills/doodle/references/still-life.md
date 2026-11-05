# Still lifes from a photograph

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

### Still lifes from a photograph (stilllife.js; `stilllife.html?s=<key>`)

"Find N references on Pinterest and recreate them" is a **set of vignettes**. Each one is a
whole arrangement in class `object`: backdrop + table + objects, cropped like its photo.

1. **Find the references.** Search Pinterest, then pull each pin's image with
   `curl -sL -A "<desktop Chrome UA>" <pin>` and grep `og:image` for the `i.pinimg.com/736x/…jpg`.
   Save to the scratchpad. Pick photos, not paintings, and one construction per pick (glass in
   sun, flowers + fruit, a single stem, a cosy table, a vanitas). Keep the pin URLs: the answer
   ends with a Sources list.
2. **Measure.** Probe palettes with PIL (5×5 averages at lit faces) and read positions and
   sizes in reference pixels ÷ scale. **Size against the reference, not the sheet:** the first
   pass drew the bouquet and orchid at ~70% and they read "small" before they read "wrong".
3. **Author on the picture plane** (Retro._kit, camera yaw 0 / pitch 0, x right / y down, back
   to front). Coordinates span the photo's aspect, and the module exports `_aspect` so the
   page sizes its tile to it. Each scene has its OWN eye height `q` (0.42 seen from above …
   0.16 at table height). Helpers: `lathe`, `cast`, `ball`, `box`, `blade`, `ribbon`, `curve`,
   `hatch`, `wallShadow`, `vignette`.
4. **Build it line-first** (LINE FIRST): backdrop and table panels are colour fills (`w: 0`),
   and the wall gets only `wallShadow`s. Things placed by position must still CONNECT: a flower
   needs its pedicel back to the stem. Closed Catmull-Rom curves through a panel's corners
   overshoot past the frame, so curve only the soft edge and concat the hard corners.
5. **Render both registers and LOOK** (`?outline=1` first), at frame size and side by side with
   the photo.
6. **VDL:** reference frames are self-contained HTML (the jpg as a base64 data URI,
   `object-fit: cover`, a small "Pinterest ↗" link), added with `vdl add --from`, so they
   survive the pin disappearing. Layout is **reference · line · colour** per row, 24 apart,
   rows 720 apart. Doodle frames go in with `&draw=1`, then drop it once drawn.
7. `bin/check.sh` (stilllife.html is in it), then LEARNINGS.md.
