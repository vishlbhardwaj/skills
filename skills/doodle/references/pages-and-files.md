# Pages, files and modules (the index)


> **Public installs ship no `*.html` pages.** The pages below are the author's demo
> galleries and stay on their machine; what ships is `src/` (the modules named beside
> each page), `bin/` and `templates/`. Read this file for which MODULE holds what.

> Part of the `doodle` skill. Moved verbatim out of SKILL.md on 2026-11-04 so the core
> loads whole; SKILL.md says when to read this file.

**Most things live on one canvas.** `canvas.html` holds every
general subject — pan, zoom, colour on/off. It is the author's gallery (their new
subject = one entry in `SUBJECTS`). Anyone else's drawing goes in `drawings/` via
`bin/new.sh`, never here. The presentation pages (`buildings.html`, `plants.html`,
`scene.html`) are the exceptions: a chosen subset shown large on white, not a
place to author. Never state these counts from memory — `bin/check.sh` prints
the real ones.

    canvas.html       the canvas. scroll=zoom, drag=pan, f=fit, d=draw live
                      ?sketch=1     rough it out in pencil first, then ink
                      ?focus=<key>  frame one subject
                      ?draw=<key>   frame it and draw it live
                      ?outline=1    line work only, no colour
                      ?nodial=1     hide the dial panel
                      ?reset=1      clear saved dial state
    buildings.html    presentation canvas: 15 buildings, no chrome. See
                      "Watch it draw".
    plants.html       10 potted plants + 50 flowers (10 × 5 band below) on
                      white, with the dial panel. ?focus=<key> works for both.
    scene.html        the riverside reader, one scene large, dial panel
    cafe.html         the café street DIORAMA (src/cafe.js); interactive Rive
                      version + web.html live viewer in ~/Projects/cafe-rive
    retro.html        35 retro devices, 5 × 7, dial panel (Rive version:
                      ~/Projects/retro-rive, canvas.html)
    board.html        a STORYBOARD: six panels, one sequence, 16:9. Nothing in
                      it was redrawn — every panel is an existing subject
                      shot at a size. d = draw one panel, b = draw the board
                      in read order.
    still.html        TEN STILL LIFE elements, 5 x 2 on white, numbered.
    daily.html        FIVE DAILY OBJECTS on white — mug, alarm clock,
                      toaster, table lamp, stapler. The set is chosen so no
                      two share a CONSTRUCTION (lathe / frontal face /
                      extruded silhouette); see src/daily.js.
    pen.html          THE `ink` REGISTER: no colour at all, tone carried in
                      LINE. Five subjects (src/pen.js), four flat on the
                      picture plane and one — the bistro set — in one-point
                      perspective, which is the proof the register survives
                      a camera. Read this before drawing anything from a
                      hand-drawn pen reference.
                      s = rough one in, d = draw one, a = draw ALL TEN in
                      order on a sheet that starts empty. ?draw=all does the
                      same from a link.
    houses.html       THE HOUSE SET (src/houses.js): house TYPES the
                      buildings don't have, one vocabulary. No query = all in
                      a row; ?h=<key> = one house fitted to the window (what
                      VDL frames load); &draw=1 draws it live. d = redraw.
    plants3.html      PLANTS, SET THREE (src/plants3.js) — same shape as
                      houses.html: ?p=<key> one plant (VDL frames), &draw=1
                      live. Pitcher plant, flytrap, Pilea, money tree,
                      ponytail palm.
    furniture3.html   FURNITURE, SET THREE (src/furniture3.js): ?f=<key>,
                      &draw=1. Pieces picked by construction, class
                      `object` on the retro toolkit (count: bin/check.sh).
    vehicles.html     VEHICLES (src/vehicles.js): ?v=<key>, &draw=1. Scooter,
                      auto-rickshaw, camper van, double-decker, tractor.
    kitchen.html      HOME OBJECTS, 25 (src/kitchen.js): ?k=<key>, &draw=1. Two
                      groups on one page — the KITCHEN (15) and the LIVING ROOM
                      (10: rug, cushion, draped throw, sunburst clock,
                      candlesticks, guitar, stack of books, fireplace, wicker
                      basket, pedestal fan). The living-room ten are picked
                      against furniture/furniture2/chairs, which already hold the
                      sofa, armchair, coffee table, bookshelf, ottoman, TV unit,
                      magazine rack and console — so they are the room's SMALL
                      and SOFT things, plus constructions the repo lacked (the
                      plane as subject, a soft bulge, a drape, radial spokes, a
                      group of similars, a leaning waisted silhouette, an offset
                      stack, an opening into a dark interior, a woven surface, a
                      radial cage). Still named kitchen.html so the VDL frames
                      keep resolving. The kitchen 15 are picked so
                      no two share a construction either — cantilever massing (mixer),
                      flat-on-a-plane (knife on a board), disc at pitch
                      (skillet), faceted frontal (moka), pure wire (whisk),
                      turned dome (kettle), perforated shell (colander),
                      two-object composition (mortar + pestle), cylinder along
                      x (rolling pin), tapered punched shell (box grater), grid
                      of recesses (muffin tray), lattice (cooling rack),
                      graduated vessel (measuring jug), soft concave silhouette
                      + offset (oven mitt), slanted face with things inserted
                      (knife block). Carries two helpers worth stealing:
                      `hatch()` (plane-local scanline strokes, QUEUED as lines)
                      and `holes()` (perforations as OUTLINED marks). In VDL
                      ("kitchen") each row is line · colour.
    scapes.html       LANDSCAPES on the SCENE KIT (src/scapes.js): ?s=<key>,
                      &outline=1, &draw=1, 16:10. Ten scenes picked as a STRESS
                      SET — each one exercises a thing scenes broke at before:
                      lake (terrain, snow, reflection), village (one-point lane,
                      an animal), forest (overlapping masses), coast (cliff,
                      surf), fields (rows into the picture), dunes (forms with
                      no edges), snow (white on white), bigtree (one near tree),
                      waterfall (falling water, rock), harbour (things ON
                      water). Start any landscape here. VDL: vdl-tour /
                      landscape-stress, one row per scene, line · colour.
                      No query = all ten in a row. The page declares the plants
                      palette too: a page must declare every palette key its
                      subjects use, or a borrowed subject draws black.
    trials.html       THE SECOND STRESS SET (src/trials.js): ?s=<key>, &outline=1,
                      &draw=1; each tile at its own aspect. Ten NON-landscapes, each
                      picked to break one thing: person, reader (figure in an
                      armchair), cat, bicycle, glass, fruit, monstera, night,
                      rain, sneaker. Its people now use People.figure (loads src/people.js);
                      home of `keyhole`/`holes` (cut holes in fills), `S.limb`,
                      `S.soft`, `S.xf`. Start any animal, glass or night subject
                      here; people start in people.html. VDL: vdl-tour / landscape-stress, the block to the
                      RIGHT of the landscapes, rows T1–T10, line · colour.
    things.html       TWENTY DAILY OBJECTS (src/things.js): ?s=<key>, &outline=1;
                      phone laptop headphones scissors glasses watch toothbrush
                      hairdryer keys tshirts soap iron notebook padlock teddy
                      bottle bulb hanger backpack umbrella. Start any everyday
                      object from the nearest one. VDL landscape-stress, 4th block.
    people.html       THE FIGURE KIT, REBUILT (src/people.js): ?s=<key>, &outline=1,
                      &draw=1; one pose per tile at its own aspect. Keys: stand,
                      threeq, walk, sit, wave, pockets, dress, group. Same hand
                      and weight as buildings.html, plants palette declared.
                      Start ANY person here, not in trials.html.
    stilllife.html    STILL LIFES FROM PHOTOS (src/stilllife.js): ?s=<key>,
                      &draw=1; the tile takes the photo's aspect. Each is a
                      whole vignette (backdrop + table + arrangement). In VDL
                      ("Still life") every doodle sits beside its reference.
    faucet.html       REEL OVERLAYS (src/faucet.js): concept beats drawn to sit on
                      top of a talking-head video, not a set of objects. ?f=<key>
                      (backed mud clean pipe), &outline=1, **&bg=none = transparent paper**
                      for PNG export (Chrome --default-background-color=00000000),
                      &draw=1 to screen-record a drawn-on overlay. Exports live in
                      the reel project's overlays folder. Beats that crossfade (mud → clean)
                      share ONE drawing function and ONE crop box, so only the
                      changing part moves. White-card cutouts (`*-card.png`) are
                      composited in PIL: alpha bbox → 9% pad → white rounded rect.
    raw.html          any geometry with no hand, control points numbered
    doodle.html       the earliest page; flat elevations, superseded

    src/hand.js       the mark: wander, pressure, taper, overshoot, double,
                      breaks, blobs — plus hatch/halftone/stipple/scribble and
                      a hand-blocked solid. `beginTrace`/`endTrace` give back
                      the centreline a mark was really drawn along.
    src/view.js       THREE cameras (one, two, axon), prisms, footprints
    src/kit.js        rig(), shared helpers, leaf profiles, `wrap`, and the
                      two the no-fill register needs: `k.cut` (hand
                      occlusion) and `k.ground` (a table rule, not a shadow)
    src/spec.js       THE CLASSES. Every class's measured pen/nib/fit plus its
                      fill, tone, detail, ink and framing policy. `Spec.wrap`,
                      `Spec.brief(cls)`, `Spec.audit(mod, cls)`
    src/board.js      storyboards: shot sizes, staging, camera moves, the
                      geometric crop, `Board.panel` / `Board.sequence`
    src/letter.js     a single-stroke alphabet (A–Z, 0–9, punctuation) drawn
                      by the hand — signage, labels, panel captions
    src/stage.js      subject rendering + the live replay engine, shared by
                      canvas.html and buildings.html
    src/still.js      10 still life elements + the SOLID-OF-REVOLUTION kit:
                      `body` (half profile mirrored), `crescent` (the turn,
                      bounded by two curves), `band` (the NEAR half of a ring
                      on an opaque body), `radAt`, `vessel`, `cast`. One
                      constant `Q` is the squash of every horizontal circle
                      and therefore the eye height. No camera — the `object`
                      class's own instruction for round things.
    src/arch.js       5 buildings + the architecture toolkit (`Arch._kit`)
    src/arch2.js      more buildings on that toolkit; exports its roof,
                      drum, railing and porch helpers as `Arch2._kit`
    src/houses.js     house TYPES picked by FORM (A-frame, saltbox, yurt,
                      machiya, treehouse, tiny house, …) on both kits, plus
                      `ridgeRoof` (visible edges only), `circleF`/`circleOut`
                      (round things on a face) and a cabin-silhouette `cut`
    src/stilllife.js  still lifes from photos on Retro._kit, camera square-on,
                      all on the picture plane; THE LINE-FIRST TOOLKIT:
                      `hatch` (queued scanline strokes, gap/cross/rag),
                      `wallShadow` (the background's only tone), `vignette`
                      (sparse halo, dark-ground refs only), `lathe` (turned
                      body: ribs, `tone`, `crescTone`, `boreTone`, highlight
                      cut out of the hatch), `cast` (long shadow = profile
                      laid down, hatched, caustic gap), `ball` (contour arcs,
                      `tone`), `box` (oblique, flank hatched), `blade`
                      (petal/leaf: `veins`, hatched `shade`, `rib`),
                      `ribbon`, `curve`
    src/scapes.js     THE SCENE KIT (depth number d drives pen, hatch, colour,
                      detail): range, hill, crown/tree, pine, treeline, hedge,
                      water/reflect, rock, house, grass, cloud, birds. Exports
                      `_scene(t, sky)` and `_util` (jag, crescent, runFrom,
                      half, yAt, mix, FOOT, seed) for other modules.
    src/things.js     20 daily objects + `cam` (ortho yaw/pitch), `S.prism`
                      (convex extrusion: hull silhouette, visible cap, visible
                      corners), `S.on` (2D shape in a 3D plane), `S.dash`, and
                      auto-framing to the content bbox.
    src/people.js     THE FIGURE KIT (replaces Trials._figure). `People.figure(S,
                      { x, gy, h, turn, pose, look, extras })`: a 3D body (spine
                      cross-sections, limbs by forward kinematics) projected
                      through one `turn` angle; poses are joint ANGLES (POSES),
                      never positions; `look` = { skin, hair, hairStyle, top,
                      topStyle, bottom, bottomStyle, shoe, build }. S must be a
                      StillLife stage already extended by Trials._extend.
                      Exports figure, POSES, _keys, _names, _aspect.
    src/trials.js     trial subjects (people via People.figure) + the OLD figure kit, unused. `_figure(S, x, gy, h, C, o)`
                      (joint table, poses as overrides, seated, tone, noHands,
                      behind/lower/torso/arms/front hooks), `_extend(S)` adds
                      `limb` (one strip through its joints), `soft` (closed
                      shape + crescent shade + hatch), `fold`, `pool` (contact
                      shadow), `keyhole`/`holes`, `xf` (affine restretch);
                      `_util` = { edges, keyhole, holes }.
    src/plants3.js    plants named by a NON-leaf landmark (pitcher + lid,
                      jaws, peltate coin, braid, bulb) on `Plants2._kit`
                      (pots, soil, blade, stalk), plus `ribbon` (a curved
                      filled strand) and per-plant deferred occlusion
    src/furniture3.js 10 furniture pieces on `Retro._kit` (prism / plane /
                      flat / raise / ball, deferred occlusion), class
                      `object`; adds `band` (a curve as a flat strip) and
                      `smooth` (Catmull-Rom sampling for tubes)
    src/kitchen.js    15 kitchen subjects on `Retro._kit`, class `object`, one
                      CAMERA PER SUBJECT (moka and mitt are at yaw 0); its
                      `hatch(t, pl, poly, o)` is the queued-line tone any
                      retro-kit module can copy, `holes(t, pl, poly, gap, r)`
                      punches perforations that survive Line only, and
                      `floorShade` is a cast shadow as hatch with no outline
    src/flowers.js    50 flowers + the botanical toolkit (deferred occlusion,
                      ribbon stems, head scale, auto petal/leaf detail)
    src/scenes.js     scenes in the approved register + `hide()` occlusion
    src/retro.js      35 retro devices + the PRODUCT toolkit: ortho yaw/pitch
                      camera, prism/plane/flat/raise, 3D deferred occlusion.
                      Start here for any object/product.
    src/daily.js      5 daily objects + the THIRD construction this repo
                      has: `solidFromSil(sil, off)` — a flat silhouette
                      pushed back along one offset, visible flanks derived
                      from each edge's own normal, creases only where a
                      visible flank meets a hidden one.
    src/pen.js        the five `ink` subjects + sprig(). No fills in it.
                      `k.cut` and `k.ground` live in Kit, not here.
    src/*.js          the rest are subject modules — chairs, desk, furniture,
                      furniture2, plants, plants2, land (OFF), macintosh,
                      objects, deskscene, workstation
    bin/check.sh      headless check of every page; run it after any edit
    bin/new.sh        a new drawing of your own: drawings/<name>.html + .js from
                      templates/drawing.*; your work lives in drawings/, never in
                      the example pages
    bin/shot.sh       one page → PNG: bin/shot.sh "<page>?s=<key>&outline=1" out.png [WxH]
    bin/chrome.sh     sourced by both; finds Chrome/Chromium (override CHROME=)
    bin/export-retro.sh  retro.html -> JSON for Rive (ABSOLUTE out path!)
    (not bundled) a Rive project: gen.py (JSON -> scene.rml),
                      canvas.html (infinite pan/zoom viewer), README.md
    README.md         the long-form version of everything below

> **Sibling skill: `clean-illustration`.** Same engine with the hand switched
> off — even round-capped lines, exact fills, tonal / ink / no outlines
> (`?style=clean&lines=tonal`). Use it when the brief wants clean, crisp,
> vector or "digitally crafted" rather than doodled.
