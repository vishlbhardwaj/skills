# Line first, tone, detail

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

## LINE FIRST — the drawing is the line; colour is the second pass

**The author's standing rule (2026-11-02): doodles are line drawings first. Coloured versions are
secondary.** `outline` ("Line only", `?outline=1`) drops every FILL. What is left must be a
FINISHED drawing, not a set of empty contours, and it must not be a busy one either. Design it,
build it and judge it in line BEFORE colour. Colour is a pass laid over a drawing that already
works. These rules hold for every doodle, of any class or form.

### 1 · Every value is carried twice: as a fill AND in line

| In colour it is… | In line it must ALSO be… |
|---|---|
| a dark material (brown glass, enamel, black cloth) | hatch, gap ~1.5. Cross-hatch (gap ~1.1) only for the ONE darkest thing in the focus |
| the turn of a round body (a crescent fill) | ribs: near-half ellipses across the turn that bow with the surface (about 7 per body) |
| a cast shadow on the table | hatch with NO outline. Light through glass is the gap left in it |
| a colour change that NAMES the thing (seeds, drupelets, spots, a label, a hole) | an outlined mark (`w > 0`), never a `w: 0` fill |
| a fold, grain, petal, vein, engraving | drawn lines |
| a pattern that is only decoration (scarf stripes, a print) | NOTHING. Keep it `w: 0`, colour-only, on purpose |

### 2 · Fidelity falls off with depth (line-first is NOT "hatch everything")

The first line-first pass hatched wall, table, cloth and subject alike, and the author called it "too
detailed, busy and distracting". A picture has a focus, and the line budget follows it:

| Depth | Gets | Never gets |
|---|---|---|
| **Focus** (the subject: the cup, the books, the bouquet) | full detail, ribs, crescent hatch, one cross-hatched darkest object | n/a |
| **Mid-ground** (table top, cloth, a box, a lying book) | contour plus 2–3 tapered fold or grain lines; colour-only pattern stays `w: 0` | hatch over its whole area |
| **Background** (wall, backdrop, the table's front face) | **PAPER.** Its only tone is the shadow the subject throws on it (`S.wallShadow`): a narrow, tight-hatched shape hugging the far side of each object from the light. The table front gets at most a thin band of shade under its lip | full-bleed tone, cross-hatch, or even a light ragged "vignette" patch behind the arrangement (rejected as "still distracting") |

The one exception: when the reference's ground IS the picture (the orchid on black), a very
sparse ragged halo (`S.vignette`, gap ≥ 2.2, weight ≤ 0.4) is allowed. Nothing denser.

**Squint test:** blur your eyes at the frame. If the wall or the table is as busy as the
subject, cut the wall. The eye has to land on the focus first.

### 3 · Mechanics

- **Hatching is QUEUED as lines, never a `k.T` tone.** Tones render above every fill and are not
  occluded. On the retro kit, `t.line` queues, and `flush()` cuts each stroke by every fill
  authored AFTER it. So hatch a background or a shadow before the objects in front of it, and
  they cut it cleanly. `S.hatch(poly, { gap, ang, cross, w, rag })` in `src/stilllife.js` does
  this: scanline strokes clipped to a polygon. `gap` is the value (2.4 light, 1.5 mid, 1.1
  dark), and `rag` adds random end insets so a tone fades instead of stopping.
- **Audit every `w: 0` fill before shipping.** Each one is either deliberately colour-only, or it
  needs a line twin (from the table in 1). **`t.mesh` is one of these**: it draws its dots with
  `t.dot`, which is `w: 0`, so a perforated thing (a colander, a grater, a speaker grille) comes
  back as an EMPTY bowl in Line only. If the holes name the object, draw them as outlined marks —
  `holes()` in src/kitchen.js.
- **Every page honours `?outline=1`** (`outline: q.get("outline") === "1"`), so line and colour
  can be judged and placed side by side. **Check this on a page you copied**: `vehicles.html`
  hard-codes `outline: false`, so a page cloned from it silently renders colour when you ask for
  line, and the whole line-first pass gets judged on the wrong picture.
- **In VDL, lay a set out as reference · line · colour**, one row per subject. Line goes next to
  the reference, because it is the primary drawing.
- Gaps punched into a hatch (to suggest mottle) read as CLOUDS. Hatching a whole body that
  already has rings makes a basket grid. Hatch the crescent only. Hairline detail vanishes at
  frame size: features that name the thing (rose petal lips) need DET weight.

The older sections "It has to read in LINE first" (history of the still.js failure) and
"Fidelity" (the scene ladder) agree with this. Where they differ, this section wins.

## It has to read in LINE first

> Current rules: **LINE FIRST** at the top of this file (value twins, fidelity by depth,
> queued hatch). This section is the history that started it. Its `halftone` advice is
> superseded: a dot screen is forbidden for `object`; use ribs or hatch.

`?outline=1` **skips every region and keeps every tone.** That is not a
diagnostic curiosity — it is the test of whether a thing was drawn or merely
coloured in. The approved sets pass it: switch the colour off `retro.html` and
all thirty-five devices are still completely legible, because every control,
grille and seam is line work.

The still life failed it badly on its first pass. Its form lived in flat fills
and shaded regions, so with colour off the skull lost both eye sockets and
went back to being an egg, the hourglass lost its sand, and the grapes became
a pile of bare rings. The line work had been left holding nothing but a
silhouette — about 29 marks per subject against 148 for a retro device.

Two rules came out of it:

- **A HOLE is a fill AND a tone.** A socket, a nasal aperture, an eye — these
  are not shading, they are the read of the object. `Still.hole()` emits the
  region and a `solid` tone over it so it survives either way.
- **A TURN is a fill AND a tone.** Every crescent on a round body gets a
  matching `halftone`. Colour is the second pass, not the drawing.

Shading of a flat facet stays a fill, per the `object` class. The distinction
is whether the dark carries information or merely depth.

**Black fills that something sits on must be REGIONS (`fill: "ink"`), not
`solid` tones** — a tone renders above every region, so the poppy's black
blotch hid the green seed pod authored on top of it.

## Tone — and the one rule that decides whether a form turns

A tone is clipped line, not a filter. Six kinds:

    hatch     parallel ruling, in PAGE space
    cross     two rulings crossing; `angle` and `angle2`
    ribs      ONE family that BOWS WITH THE SILHOUETTE
    grid      ribs plus straight spans: the hand-drawn plaid
    halftone  a regular dot grid        stipple   scattered dots
    scribble  continuous loops          solid     hand-blocked black

> **A TANGENT PLANE IS NOT A SURFACE.** `t.FR(z)`, `t.TOP(y)` and `t.RT(x)` are flat planes. On a
> BOX a face really is one of them, so detail painted there lands on the object. On a CYLINDER or
> a dome the plane touches the body along a single LINE, so anything drawn on it away from that
> line lands **off the body** — it projects outside the silhouette and reads as a slab hanging in
> the air. The measuring jug's liquid was a rectangle on `FR(-R)` and came out as a pale box
> sticking out of the barrel; its crescent hatch ran past the left edge and below the base.
> On a round body: contents are their own SOLID (liquid in a jug is a shorter cylinder, and its
> surface ellipse comes free as the prism's cap), and the turn is **ribs placed by ANGLE on the
> real circle** (`ribs()` in src/kitchen.js) — which is what LINE FIRST asks a turn to be anyway,
> and they bunch towards the silhouette on their own. Which angles are at the edge is not
> reasonable-about: render and look (the first pass ruled the whole barrel like fluting).

**A straight ruling clipped to a shape is a flat grey.** It tells you the area
a shape covers and nothing about its form — put `hatch` on a jug and the jug
goes flat. That is why every hatched facet in this repo reads as a grey panel
glued on, and it is the single biggest gap between our sheets and any
hand-drawn pen reference.

`ribs` and `grid` do not rule in page space. They measure every scanline
across the shape and place a column at the same FRACTION of each span, so a
line is further out over a belly than over a neck and **bows on its own, from
the silhouette, with nothing for the caller to supply.** That bowing is the
only thing in a pattern-drawn object saying the object is round.

Three things to know before using them:

- **The shape has to bow.** On a straight-sided tin, `grid` and `hatch` draw
  the same picture and the primitive looks broken. Give the profile a belly.
- **Keep a floor under the spans.** A bowl swept to a point at the bottom made
  every rib converge inside two units and grew a solid black wedge.
- **`gap` is in PAGE PIXELS.** A multiplier of 1.2 against a page `hatchGap`
  of 9 is ~11px on a 900px tile — fifty columns. Judge it rendered.

Three craft notes that outlive any one kind:

- **A halftone is a print screen, not a hand mark.** Its dots must be
  mechanical; drawn with the ink-blob function they read as polka dots. (Which
  is a good reason to ask what it is doing in a hand drawing at all — see the
  ban below.)
- **A solid is blocked in by hand, so its edge is not the shape's edge.**
  Returning the geometry exactly gives four crisp corners — a printed
  rectangle in a drawing where every other line wobbles. `tone(…, "solid")`
  pushes the outline along its own normal by a LOW-frequency wave, zero-meaned
  so the fill frays without drifting off its own frame. `solidRag: 0` restores
  exact geometry.
- **A loop needs a whole turn.** Two points per step makes an angular zigzag
  that reads as scratchy wire, not foliage.

And a standing ban, which `Spec.of("ink")` enforces: **no dot screen in a pen
drawing.** A halftone is the mark of a printing process. Six hand references
were checked and not one of them uses one; our still-life sheet used one on
every round object and was rejected twice as mechanical.

## Draw order with nothing filled

Everywhere else occlusion is free: author back to front and a later FILL
covers what is behind it. In the `ink` class nothing is filled, so **nothing
covers anything** — a bowl of fruit authored back to front comes out as six
whole circles with a bowl drawn through them like a wireframe.

`Pen.cut(pts, blockers)` densifies a run, drops every point inside a nearer
silhouette and returns what survives as separate runs. Build each silhouette
as you go and pass the ones already laid down. It is also what a person
drawing this does, and it is why the fruit at the back of a reference is a
crescent of line and nothing else.

## Detail — what "scrappy" means

The author's word for a set that reads crude. On the flowers it was FOUR
separate things, and none of them was the pen:

> **Measure before you look, then look at ONE, at size.** Every time this
> verdict has come back, the cause was findable in seconds and not by
> staring at the sheet.
>
> First, a `node` probe over `mod.build()`: print each subject's BBOX and
> its element count. Five daily objects all measured 98 units wide (that was
> the ground rule, not the object, so every one was fitted at half size) and
> 17–67 elements against a retro device's ~148.
>
> Then render ONE subject alone at tile size and read it —
> `--screenshot --window-size=900,980 "…?focus=<key>&outline=1"`. A sheet
> shows each object 150px wide; the faults that make it scrappy are not
> visible there. One pass at 900px found a lid welded to the mug, two bells
> drawn as open rings, a slice of bread that was a fedora and a stapler in
> three unconnected pieces — none of which three rounds of sheet-watching had
> turned up.

> **An appendage may leave the drawing. It may not define it.** A subject is
> fitted to its own bounding box, so steam, a cord, a plug or a cast shadow
> that runs wider or taller than the BODY silently shrinks the whole drawing.
> This has now been the cause four times — ground rules twice, cords twice,
> steam once. Before concluding a drawing is thin, check that it is not
> merely small: compare the bbox to the body.


1. **Bare structural members** — black-stick stems, wire limbs. Give every
   structural part a body: a filled ribbon with an outline.
2. **The subject too small in its own frame** — no room for detail. Scale
   the part that carries identity (the head), not the whole drawing.
3. **Outlines crossing shapes in front of them** — the rose read as a smiley
   face. Occlusion, above.
4. **No surface detail** — no veins, creases, base shading. Make the detail
   a property of the TOOLKIT so all fifty get it, not fifty hand edits.

Diagnose at 1:1 on four representative subjects (`?focus=`) before fixing:
the overview hides all four.
