# Clean illustration — learnings

## 2026-10-30 · the register is born

- Asked: "turn the doodle skill into a clean illustration skill — lines not
  doodle-style, more clean and digitally crafted". Built as a MODE of the
  same engine, not a fork: geometry, cameras, parts and the Rive pipeline are
  shared; the hand is switched off.
- Three outline treatments rendered on the café diorama: tonal, ink, none.
  All read; tonal is the most "digitally illustrated", none the most "flat
  vector". Default tonal pending the author's pick.
- Symptom: hairline stripes on rounded flanks (toaster side, TV side) →
  cause: exact adjacent polygons, anti-aliased → fix: stroke each fill in its
  own colour (0.8 page / 0.7 Rive). The doodle register hid this by ragging.
- Tapered ends look hand-made; clean lines need full width + ROUND caps.
- Charcoal #26262E reads cleaner than near-black #17171A at an even weight.

## 2026-10-30 · stroke-weight controls

- Asked for options to increase stroke weight. Added a "Clean" dial folder +
  URL params: weight, outline ×, detail ×, lines, tone, ink, seam, caps.
- Outline vs detail are SEPARATE multipliers (a mark at w ≥ 0.9 is outline):
  fattening only the silhouette is the sticker look; fattening everything
  clogs grilles and tick marks first (visible at weight 36).
- The doodle flattener had to learn DialKit `select` controls (it recursed
  into {type, options, default} and polluted the params).
