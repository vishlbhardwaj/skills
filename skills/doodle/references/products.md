# Products: the retro toolkit

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## Products — the retro toolkit

`src/retro.js` `kit(k, {yaw, pitch})` is the reference for any object. It
drew all thirty-five devices right on the first render; use it, don't start over.

- **Orthographic camera with yaw + pitch**, not cabinet-oblique: oblique turns
  every circle on a receding plane (platter, joystick base, knob) into a
  skewed egg. A real rotation keeps verticals vertical, circles true ellipses.
  Per subject: face-on things yaw 14–22 / pitch 8–14; things read from above
  (turntable, keyboard) pitch 30–40.
- **One primitive does the solids**: `prism(convexBase3D, extrusion)` → fills
  visible sides + cap (shade from the normal: top 1.08, front 1.0, right
  flank 0.72), ONE hull outline, creases only where a visible side meets the
  cap or turns > ~35°. `box`, `tower`, `raise` are sugar over it. Detail is
  `flat`/`raise`/`line` on a `plane(o, du, dv)` — keys on a sloped deck,
  knobs on a front, posts on a plate are all the same call.
- **Deferred occlusion in 3D**: lines are queued and cut by later fills, but
  only when DEEP inside (edge distance > 0.22) — a band flush with an edge
  would otherwise chew that edge into dashes. Ink parts need none.
- **Composition**: a wide accessory beside the subject (headphones, joystick)
  shrinks it in its tile — put it in FRONT, overlapping. A part that sits on
  another (a carriage over keys) must be lifted clear.
- **Furniture is a product problem now.** New furniture uses class `object`
  on this kit, not the legacy `furniture` row; all ten in furniture3.js read
  on the first render. Two kit facts it relies on: a prism's outline is a
  convex HULL, so anything concave (rockers, an egg shell, a bean bag) is a
  `flat` shape on a plane; and `line3` through sparse control points draws a
  bent wire — sample a smooth curve (`smooth`) for any tube or arc, and give a
  load-bearing tube real weight (~3–4× OUT), or a steel stand reads as thread.
- **Things that sit IN a pattern are placed by the pattern's own equations.**
  Bottles on a guessed grid sat on the wine rack's bars; solving the cell
  centres from the two lattice families put each in its diamond — then size
  the contents to the cell (centre spacing), not to taste.
- **Vehicles: long axis along x, nose at +x.** The yawed camera sees the near
  side (FR plane, z NEGATIVE) and the nose (RT at +x). A wheel is a short
  cylinder — `prism(circle, [0,0,w])` — so the tread shows; rim/hub/lugs go
  on its near face. Author FAR wheels first, body, then each near fender and
  its near wheel LAST. Got backwards once: both tractor wheels on the far
  side, and the fender dome hid the wheel that IS the tractor.
- **A rounded body is a SAMPLED convex curve** (`ell(..., 180, 360)`), not a
  hand list of 8 points — that scooter read as cut from card.
- **Organic outlines are smoothed, never polygons**: continents drawn as 6
  points read as hexagons. Run the points through `smooth` closed.
- **Every new device is authored for motion from the start** (next section):
  tag its moving parts and write its beat sheet in the same change.
