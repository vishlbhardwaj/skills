# Animating: doodle → Rive

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## Animating — doodle → Rive

The pipeline that worked. **The Rive side (`gen.py`, which turns the exported JSON into RML) is
not bundled with this skill**; the export half (`bin/export-retro.sh`) is.

1. **Export the hand, don't redraw it.** `bin/export-retro.sh /abs/out.json`
   rebuilds every subject with `Retro.EXPORT` on and dumps the exact ribbon
   polygons (`Hand.region` / `Hand.mark`, M/L/Z only) in tile coords.
   `gen.py` writes them as Rive PointsPaths (RDP 0.12 px). Identical to the
   HTML on the first build; 15 devices ≈ 930 KB.
2. **Parts are tagged while drawing**: `t.part(name, o)` until `t.part(null)`:
   - `pivot` — a 3D point to turn/scale about;
   - `plane` + `at` — move IN that plane. The plane's 2×2 projection is kept
     and rebuilt in Rive as Outer(rotate+scale) > Mid(rotate) > Spin (its
     SVD); keying Spin spins a reel on a turned face as a reel, and slides a
     print or tape along its own axis;
   - `top` — the part MOVES: its fills cut no other part's lines (else the
     gaps show when it moves) and it is layered above all static line work;
   - `clip` / `clip3` — something passing through an opening is masked to the
     opening's mouth swept toward the viewer (a fixed screen region).
   `t.extra(fn)` draws export-only shapes (a second TV channel, static,
   notes, a flash, a light beam). The HTML is unchanged unless EXPORT.
3. **Layering in Rive**: static fills → static lines → each top part (its
   fills, then its lines). Rive paints the FIRST declared on top — emit reversed.
4. **A beat sheet per device** in `gen.py` (`BEATS`): one looping `Idle`
   timeline, 2–4 s, eased segments, holds for clicks/blinks; the device does
   the thing it is FOR — reels turn, the phone rings, the print ejects, the
   tape goes in. Loops close on the frame-0 value; symmetric spinners turn a
   multiple of their symmetry (3 cut-outs → 120°).
5. **Motion craft that bit**: secondary action needs a clear background (ink
   notes vanished over a black record) — start it on paper, above the subject,
   1.6–2× a detail. Extras must not change the fit (measure the bbox without
   them). A moving part needs room in its artboard — centre the travel on the
   rest pose; don't clip device artboards. A clip exists only in Rive — on
   the HTML page keep the part inside its window yourself (`t.EXPORT ? wide :
   inside`, the oscilloscope trace).
   A readout that changes (calculator LED, VCR clock, TV channel) is one part
   per STATE, swapped with opacity holds (`onoff` in gen.py) — not morphing.
6. **Viewing**: the native previewer crops a big gallery to its window. Many
   artboards are viewed on `canvas.html` — one window-sized canvas,
   `@rive-app/canvas-advanced`, per cell `renderer.align(Fit.contain,
   Alignment.center, cellOnScreen, artboard.bounds)`: an infinite pan/zoom
   canvas that stays vector-sharp. Serve over http (module + wasm); the
   module asks for `canvas_advanced.wasm` but the package ships `rive.wasm`.
7. **Scenes too**: `kit(k, {persp: View.two opts})` builds a two-point
   perspective scene with the same vocabulary (src/cafe.js). Add `t.layer()`
   between depth bands (buildings → walkers → kerb → road) and `track` for
   things that travel. Interaction = view model + one SM layer per touchable
   thing + listeners on transparent hit rects; see LEARNINGS "café street".
   For a whole-scene object, prefer a DIORAMA (`persp.lift`, a finite ground
   block, no frame) over a cropped street — see LEARNINGS "diorama".
8. `rive docs` reads `docs/` relative to the cwd — from ~ it prints Homebrew's
   docs. Read `~/.rive/versions/<v>/docs/*.md` directly.
