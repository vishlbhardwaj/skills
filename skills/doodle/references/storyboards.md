# Storyboards

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## Storyboards — drawing a sequence rather than a picture

`src/board.js`, shown on `board.html`. A storyboard is not eight
illustrations in a row, and the three things that make it read were all
missing from this system until it was built:

- **A panel CROPS.** Every other subject here is fitted to its own bounding
  box, which is the exact opposite of a shot. A panel states its frame and
  clips to it, so a close-up can run off all four edges.
- **Shot size is the detail budget.** Not the subject's importance — the
  shot's. A wide shot draws the distance rung for everything in it; a
  close-up draws the foreground rung for one thing.
- **Staging is information.** A subject dead centre in every panel is what
  turns a board into a catalogue.

**Nothing is redrawn to be boarded.** `k.shot(mod, opt)` takes any subject
module already in the repo and places it in the panel:

    Board.sequence([
      { aspect: "wide", shot: "WS", secs: 3, caption: "The corner cafe",
        draw: (k) => {
          k.wash(0, 0.70, "#EAF0F4");                 // sky, edge to edge
          k.wash(0.70, 1, "#E6E2D8");                 // ground
          k.shot(Arch.cafe, { size: "ws", at: [0.34, 0.72], anchor: "feet" });
          k.shot(Arch2.brownstone, { size: 0.34, at: [0.76, 0.72], anchor: "feet" });
          k.ground(0.72, k.DET);
        } },
      …
    ])

Panel space is x 0 → `k.W`, y 0 → 100, y DOWN, where `k.W = 100 × aspect`.

**Shot sizes** are quoted as the subject's HEIGHT over the panel's height,
because that is what a shot size means — a close-up of a wide object still
fills the frame vertically. Above 1.0 the subject is cropped, which is the
point.

| key | size | rung it may draw |
|---|---|---|
| `ews` | 0.20 | distance — a token |
| `ws` | 0.42 | middle |
| `full` | 0.86 | middle |
| `ms` | 1.20 | foreground |
| `mcu` | 1.80 | foreground |
| `cu` | 2.80 | foreground |
| `ecu` | 5.00 | foreground |

> A diorama's bounding box is mostly ground, so a true `ews` fraction of its
> own height leaves a dot in the middle of the frame. Quote the size against
> what has to READ, with a number, when the subject's box is not the subject.

**Staging.** `at: [u, v]` in 0..1 is where the subject's centre lands; thirds
are 0.33 and 0.67. `anchor: "feet"` lands its BOTTOM at `v` instead, which is
what you want whenever two things share a ground line — and `k.ground(v)`
draws that line. `flip: true` mirrors, so a character can face into the cut.

**Camera moves are drawn in the same ink, thinner** — a board that annotates
its moves in a different medium stops being one drawing. `push`, `pull`,
`pan-l/r`, `tilt-u/d`, `track-l/r`. `k.action(pts)` is the other kind of
arrow: what the SUBJECT does, drawn heavier than what the camera does. Boards
distinguish these by weight, so never give them the same one.

**Captions are lettered, not typeset.** `src/letter.js` is a single-stroke
alphabet drawn by the hand like everything else, so a label wobbles with the
drawing around it. `k.text(str, x, y, sc, w, {align})` returns its own
advance width — measure the panel number and start the caption past it, or
you get `01THE STREET`, which is exactly what the first board printed.

**The crop is geometric, not an SVG clip-path.** Stage's `clip` crops to the
tile's fit box, which is the wrong rectangle: the frame is only the top of
the card and the caption strip is the rest, so a clip big enough to show the
caption lets the shot spill out of the frame — the first board drew a
four-storey café straight across its own rule and into the panel below.
Clipping the geometry (`clipPoly` / `clipLine`) is also the more honest crop:
the pen never travels off-panel, so the live replay draws what the panel
actually shows. A line crossing the edge comes back as two marks, the hand
puts a fresh overshoot on each new end, and the frame rule — drawn last —
covers them.

**One board, one aspect.** `Board.sequence` checks it and complains, because
a single panel left at the default while the rest are cine shows up only as
one card sitting at a different height in the row.

**Watch the board, not the panel.** `b` on `board.html` replays the panels in
READ ORDER, one after the next. All six at once tells you nothing about the
cut.

**A page that hosts subjects from several modules needs the UNION of their
palettes.** An unknown palette key falls through to the raw string, which is
not a colour, which renders black — the first board's armchair came out a
silhouette and looked like a deliberate choice.
