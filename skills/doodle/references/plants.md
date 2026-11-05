# Plants and flowers

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## Plants and flowers — the botanical toolkit

`src/flowers.js` (`kit(k)`) is the reference for anything organic. What it
learned, in the order the problems showed up:

- **One frame for a set** (`o.frame`), not fit-to-bbox: a snowdrop is short
  and a foxglove tall — that height is information.
- **Archetype × landmark, not palette.** Radial head, scalloped mass, nested
  annuli, cup, bell, trumpet, spike — then the landmark that names the
  species (notched cosmos, fringed cornflower, droop off a black dome). A
  recolour is not a new flower.
- **Layered heads are concentric ANNULI over a backing disc** (dahlia,
  camellia): each ring's petals live in their own band.
- **Stems are filled ribbons** (`t.stem`: ink underlay + green ribbon, both
  regions), never a black stick. A stick was most of every drawing and read
  as a lollipop; as regions, a head authored later covers the stem's end.
- **`t.head(cx, cy, S)` scales the head** (1.2–1.55). A head an eighth of the
  height has no room for detail; scale it, and the detail has somewhere to go.
- **Detail is automatic, so no species is bare:** every leaf gets a midrib
  and three pairs of veins (`serrate` adds teeth); every radial petal gets a
  darker base (same profile, 0.42 long, shade 0.84) and a crease.
- **A pale fill shaded by multiplying goes GREY** — dirty, not shadowed.
  White/cream petals get shade 0.96; mid and dark fills 0.84.
- **A toolkit's `at(u, v)` must answer in the same space its callers use**
  (world), or every detail placed off a petal lands 50 units away. Same bug,
  third time (plants3): screen coords passed to `blade()`, which wants a WORLD
  base — the pitcher lids flew across the tile AND, because the fit is the
  bbox, shrank the whole plant to a third. **A stray element is a size bug
  first**: if a subject renders small, look for what is far away.
- **Overlapping round leaves need deferred occlusion, or they read as rings.**
  Fills all paint under all marks, so on a Pilea every rear coin's outline
  showed through the front ones. Queue each leaf's line work with its index
  and `k.cut()` it by every leaf authored after it: rear leaves become
  crescents and the stalks stop at the blade.
- **A trailing or cascading part must stop above the ground**, or it runs
  past the pot base and reads as spilled on the floor (ponytail palm).
- **Pick plants by archetype x landmark the set lacks** — and the landmark
  is often NOT a leaf: a lidded pitcher, a toothed jaw, a coin pinned at its
  centre (the dot IS the species), a braided trunk, a swollen bulb.
