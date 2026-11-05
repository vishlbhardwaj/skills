# Scenes and landscapes: fidelity by depth, the scene kit

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## Fidelity — what changes between an object and a scene

The classes in `src/spec.js` carry the per-class version of everything in
this section; what follows is the reasoning underneath them.

Measured off two reference drawings (a house over a lake, a canal with a
bicycle): **both sit at 3.6–4.2% ink coverage**, and **neither contains a
single fill.** That is the family constant. An object spends that ink on one
thing; a scene spreads the same ink across depth zones. Same hand, same
density, different distribution.

**0 · Mass, not wire.** Thin outline on white reads as nothing at any
density — "not even noticeable what these scenes are". Value is what makes a
shape legible, and value here is dense hatch inside a closed silhouette. Still
no flat fill. But **hatch only the shadow side**: hatching a shape edge to edge
gives a flat grey blob, and for a round form (a crown, a bale, a hull) the tone
belongs in a crescent on the lower-right. A plane — a roof, a wall — really is
one value, so that keeps full hatch.

**0b · A scene is ONE BIG RECOGNISABLE THING.** The subject spans roughly half
the frame height and straddles the horizon. A field of small tokens evenly
spread is a map, not a landscape. Name the scene after its subject and the
composition follows: *cottage in the hills*, not *hills*.

**1 · Tone is line density, not flat colour** — *in the line-only register.*
A landscape built from filled bands is a colour chart. Water is ripples that
converge with distance, a field is furrows running into the picture, foliage
is a scalloped outline.

> **Read "Landscapes — the scene kit" below before drawing any scene.** It is
> where the rules on this page became code, and it reconciles them with LINE
> FIRST: flat colour + heavy line for the colour pass, and every value ALSO in
> line (crescent hatch, water dashes, hanging treeline strokes).
>
> **Superseded for this user's work.** The ten landscapes built on rules 0–1
> (hatch, no fill) were rejected as "too scrapy" and are switched off. Every
> approval since — buildings, plants, flowers, the riverside scene — is the
> OTHER register: **heavy line (pen 0.3 × weight 26), flat colour, black for
> contrast, shadow as a darker FILL (diagonal facets, crescents), hatch only
> where nothing stands in front of it.** Default to that register for scenes
> too. Rules 0b, 2 and 3 (one subject, density peak, detail ladder) still
> hold in either register.

### THE SCENE KIT (src/scapes.js) — depth as a number, not a camera

The ten rejected landscapes were switched off on 2026-10-29. `src/scapes.js`
is the rebuild, and it exists **to find out what still breaks, not to show
off**: each of its ten scenes is picked to attack one thing scenes have failed
at before — terrain, water and reflection, foliage masses, rock, receding
rows, smooth forms with no edges, white-on-white, one near tree, falling
water, objects on water.

Scenes are authored **on the picture plane** (`Retro._kit`, square-on camera,
x right / y down) in a **160 × 100** frame, back to front, clipped.

**Depth is not a camera here. It is a number `d`, 0 at the nearest point and 1
at the far range, and EVERYTHING that makes a drawing recede reads it:**

| as `d` rises | what changes |
|---|---|
| pen | thins — a far ridge is about a THIRD of the bench's weight |
| hatch | opens up and lightens |
| colour | mixes toward the sky |
| detail | drops a rung on the ladder below |

**A mountain drawn at the bench's weight is THE flat-landscape failure**, and
the kit's whole point is to make that impossible to do by accident. If a scene
reads flat, check what is NOT reading `d` before redrawing anything.

LINE FIRST still holds: every value is carried as a fill AND as line — hatch
on the shadow side, dashes on water, clumps in a crown — and the sky is paper.

Module contract: `Scapes._keys` (the order), `Scapes._names`, `Scapes._aspect`
(1.6). Every scene sets `clip = true`, and its `frame` is derived from the sky
panel's **projected** bounds, because the kit maps picture coordinates through
its own camera — `[0, 0, 160, 100]` is NOT the frame. Noise is seeded and
reset per scene, so a scene draws the same every time.

**2 · Density peaks at the subject.** Measured in fifths, top to bottom:

    ref B   0.5%   2.9%   8.0%   5.4%   1.4%
    ref A   1.4%   5.1%   5.3%   6.0%   3.0%

Sky nearly empty, subject band roughly double the average, extreme foreground
falling off again. **A scene with even density has no subject.**

**3 · Detail is a ladder by depth, and every scene needs all three rungs:**

| | |
|---|---|
| foreground | ONE thing at full object fidelity — the bicycle has spokes and a chain |
| middle | characteristic features only — a tree has a trunk and a few branches |
| distance | a repeated token — lollipops, window slots, a ridge line |

A scene is not a smaller version of an object; it is an object plus two
coarser rungs behind it. Draw everything at object fidelity and it reads as a
diagram. Draw nothing at object fidelity and it reads as a map.

**The same ladder holds in a still life or any vignette with a backdrop**: focus,
then mid-ground (table, cloth), then background (wall). The background rung is the
lightest of all: paper plus the subject's own cast shadow. See LINE FIRST §2.

## Landscapes — the scene kit (src/scapes.js)

The ten 2026-10-29 landscapes were rejected and switched off, and until 2026-11-04 the only scene
that worked was the riverside reader. Scenes failed because objects had a toolkit that COMPUTES
form and scenes had none: every mountain was a zigzag, every pine a triangle, every crown a
lollipop, all drawn at the bench's pen weight. `src/scapes.js` is that toolkit, and the ten scenes
on `scapes.html` are its stress set. Each rule below is a break the stress loop found.

**Author on the picture plane, 160 × 100, back to front.** `scene(t, sky)` wraps StillLife's
stage (`StillLife._stage`, `_util`) on the retro kit square-on. The FIRST thing drawn is the sky
panel `S.panel(0, 0, 160, 100, sky)`; the module reads the frame from that region (see Framing).

**Depth is a number, and everything reads it.** Every element takes `d` from 0 (nearest) to 1
(the far range):

| helper | gives | 0 → 1 |
|---|---|---|
| `S.W(d)` | silhouette pen | 1.15 → 0.36 × OUT |
| `S.Wd(d)` / `S.Wt(d)` | detail / hatch pen | halves |
| `S.G(d, g)` | hatch gap | × 1 → 1.9 (lighter) |
| `S.air(c, d)` | fill | mixes 55% toward the sky |
| detail rung | clump arcs, limbs, gullies, roots | dropped past d ≈ 0.6–0.75 |

A far ridge at the bench's weight is THE flat-landscape failure; with `d` it cannot happen by
accident.

**The parts** (all line-first: each carries its value in line too):
`S.range` (mountains: midpoint-displaced ridge, diagonal shadow FACETS, snow left as paper above
an irregular snowline) · `S.hill` (smooth crest + 2–3 contour strokes) · `S.tree` / `S.crown`
(union-of-lobes crown, crescent shade, clump arcs) · `S.pine` (ragged drooping tiers) ·
`S.treeline` (spires or rounded, tone hanging from the edge) · `S.hedge` · `S.water` (dashes) +
`S.reflect` · `S.rock` · `S.house` (oblique) · `S.grass` · `S.cloud` · `S.birds`.

**What broke, and the rule each break became:**

1. **A straight terminator splits a form in two.** Hatching the shadow side of a half-plane cut
   made every crown and rock look sliced. Shade is a CRESCENT: `crescent()` takes the
   silhouette facing away from the light and closes it with an inner curve that bows the same way.
2. **Alternation is a saw.** Snowlines and treelines built tip-notch-tip-notch read as saw teeth.
   Natural edges are clumped and uneven: mixed heights and widths, the odd tall spire, tongues
   of snow running down gullies at random intervals.
3. **Distance tone hangs from the silhouette.** An even band of verticals across a treeline's
   foot read as a fence or a barcode. Strokes start at the top edge and run down to uneven lengths.
4. **A spired top is busy, so it gets a lighter pen** (0.6 × `S.W`) than a smooth crest.
5. **Every ground layer runs to the frame bottom** (`FOOT`). A back layer that stops at a
   nominal base shows sky wherever a nearer layer dips.
6. **Framing:** the kit projects picture coordinates, so `[0, 0, 160, 100]` is NOT the frame,
   and "the largest region" is not either: that picked a near wall and, elsewhere, a far hill
   wider than the sky. The frame is the sky panel's projected bounds, which is region 0.
   `Stage.build` now clips to the stated FRAME (it used to clip to the fit box, whose aspect
   differs, so wide layers spilled into the slack).
7. **Limbs fork BELOW the crown** (`fork` ≈ 1.45 × ry under its centre), so they show as they
   spread. Forked inside the crown, the tree is a ball on a pole.
8. **Mid-distance trees stand in groups with low, overlapping crowns.** One crown on a long
   bare stem is a lollipop.
9. **A hedgerow is one bumpy band** (`S.hedge`). Little crowns in a row read as beads.
10. **A cliff is jointed:** tall slabs split by vertical joints, flat-ish angular tops, some
    stepped back, each with its own crescent. Even horizontal strata read as a layer cake,
    and short ledges with shade under them read as eyebrows.
11. **A cliff stands IN the sea:** its foot is on the waterline with a surf stroke. A cliff
    whose base stops above the water floats.
12. **One-point lanes** (`P(X, Y, Z)` by hand): an eye about 2 m up; the nearest houses
    start off-frame (z ≈ 2.6) and draw NO end face, because its edges rule a heavy line across
    the foreground. **Size openings in world units**: a door is a door wide however long the
    house is, while a fraction of the wall gave the near house a garage door.
13. **An animal is named by its landmarks.** A long body on four legs with a small head is a
    dog. The zebu read once it had the hump, the dewlap and the horns.
14. **A hull is named by its sheer:** the deck line sweeps up to the bow. A wheelhouse has a
    raked front, an overhanging roof and a row of windows. A plain box on a hull is a tub.
15. **Water is dashes whose gap and length grow toward the viewer.** A reflection is the
    mirrored shape filled a little darker and laid with denser dashes, and has no outline.
16. **A town is staggered rows of houses that differ** in size, roof pitch and roof colour.
    Equal tokens in one row read as a chart.

**The loop that found these** (use it for any new scene): render all of them in line AND
colour as one contact sheet, fix what breaks in the KIT rather than in one scene, re-render,
then look at each line frame LARGE (`vdl shot`). The large view found four breaks the contact
sheet hid: the barcode treeline, the heavy treeline pen, the wall edges across the lane, and
the huge doors.
