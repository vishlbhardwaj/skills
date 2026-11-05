/*
 * SPEC — the drawing classes, and the guardrails each one draws under.
 *
 * WHY THIS EXISTS. Weight, nib, fit and tone policy were being decided per
 * MODULE and per PAGE, so the same subject drew differently depending on
 * where it was shown: Plants2 at 0.30 × 15 = 4.5px on canvas.html and
 * 0.30 × 26 = 7.8px on plants.html — the same ten plants, 1.7× apart. And a
 * coffee mug was inheriting a landscape's tone rule because there was only
 * one set of numbers in the system. A mug and a hillside are not the same
 * drawing problem and must not share a pen.
 *
 * So: the CLASS owns the hand. A page owns the paper and the dial's starting
 * point, nothing else. `Spec.REF` is the house weight every class's `pen` is
 * quoted against — a page that sets `weight` to anything else is scaling the
 * whole sheet on purpose, not re-deciding a class.
 *
 * Every number below was MEASURED out of an approved module, not chosen.
 * The source is named on each row. Nothing here is aspirational.
 */
window.Spec = (function () {

  const REF = 26;                      // the approved house weight

  /* the two nibs the system actually has */
  const FIRM = { pressure: 0.22, wander: 0.045, boil: 0.10, overshoot: 0.12,
                 double: false, breaks: 0.012, blobs: 0, specks: 0 };
  const PEN  = { pressure: 0.10, wander: 0.07,  boil: 0.12, overshoot: 0.22,
                 double: false, breaks: 0.03,  blobs: 0, specks: 0 };

  /*
   * A class row:
   *   pen/nib/fit  the hand — feed straight into Kit.wrap
   *   camera       which of the three, with the settings that worked
   *   fill         what colour is allowed to do
   *   tone         which textures belong, and where
   *   detail       how much surface detail the class owes
   *   ink          target ink coverage, where it was measured
   *   frame        bbox-fitted, or a stated frame + clip
   *   watch        the failure this class actually produced
   *   src          where the numbers came from
   */
  const CLASS = {

    object: {
      label: "Object — a thing you could pick up",
      pen: 0.30, nib: FIRM, fit: { w: 0.84, h: 0.84 },
      camera: "ortho yaw 14–22 / pitch 8–14 (retro.js kit); face-on things low, things read from above pitch 30–40",
      fill: "flat colour, one hue per material; faces shaded by normal (top 1.08, front 1.0, right flank 0.72)",
      tone: "no SCREEN. A halftone is a regular dot grid and therefore a printing artefact — the same screen on ten objects reads as a filter over the sheet, not as light on a thing. A turn is a DARKER FILL, and may carry `ribs` (which bows with the body, as a lathe-turned surface does). `stipple` is allowed only for granular MATERIAL — the sand in an hourglass — never as shade",
      tones: ["hatch", "cross", "ribs", "stipple", "scribble", "solid"],
      detail: "full — every control, seam, vent and label. An object is the one thing drawn at full fidelity",
      ink: "high; an object spends the whole budget in one silhouette",
      frame: "bbox",
      watch: "a round object drawn as a prism turns every circle into a skewed egg — use flat profiles on the front plane with a crescent on the right",
      src: "src/retro.js (35 devices)",
    },

    ink: {
      label: "Pen and ink — no colour at all, tone carried in LINE",
      pen: 0.26, nib: PEN, fit: { w: 0.90, h: 0.88 },
      camera: "none; author on the picture plane, or View.one for furniture seen in a room",
      fill: "NONE. The paper is the object. At most one flat accent on ONE element of a sheet",
      tone: "line only — hatch / cross / ribs / grid / scribble. A dot screen is forbidden: it is the mark of a printing process, and these are drawings",
      tones: ["hatch", "cross", "ribs", "grid", "scribble", "solid"],
      detail: "medium — every form gets a texture, no form gets a catalogue of parts",
      ink: "2.5–4%, nearly all of it in texture rather than in silhouette",
      frame: "a GROUND LINE that leaves both edges of the frame; never a pooled ellipse shadow",
      watch: "a straight ruling clipped to a shape is a flat grey and kills the form — use `ribs`/`grid`, whose lines bow with the silhouette",
      src: "measured as RATIOS off six pen references (see LEARNINGS, 'What the pen references do that we do not')",
    },

    product: {
      label: "Product / device — an object with a face of controls",
      pen: 0.30, nib: FIRM, fit: { w: 0.84, h: 0.84 },
      camera: "ortho yaw/pitch, `Retro._kit.kit(k, {yaw, pitch})`",
      fill: "flat colour; one material at several angles is ONE colour, let the shading differ",
      tone: "none; creases only where a visible side meets the cap or turns > ~35°",
      tones: ["hatch", "cross", "ribs", "solid"],
      detail: "full, plus seg7 readouts, knobs, keys — `flat`/`raise`/`line` on a `plane`",
      ink: "high",
      frame: "bbox",
      watch: "a wide accessory beside the subject shrinks it in its tile — put it in FRONT, overlapping",
      src: "src/retro.js",
    },

    furniture: {
      label: "Furniture — a thing you stand next to",
      pen: 0.16, nib: PEN, fit: { w: 0.84, h: 0.80 },
      camera: "View.one f 175, vp [50, 36]",
      fill: "flat colour + a pooled `cWash` shadow",
      tone: "none",
      tones: ["hatch", "ribs", "solid"],
      detail: "structural: joints, taper, a seat's thickness. `taper: [a, b]` on every leg or it reads as doweling",
      ink: "moderate",
      frame: "bbox",
      watch: "LEGACY WEIGHT. 0.16 predates the heavy register; it draws at 4.2px where a product draws at 7.8px. Match the product pen for new work unless the set is deliberately lighter",
      src: "src/furniture2.js",
    },

    plant: {
      label: "Plant — a potted, structural organic subject",
      pen: 0.30, nib: FIRM, fit: { w: 0.84, h: 0.88 },
      camera: "View.one f 260, vp [50, 26] — a long lens; a pot square to camera is a rectangle",
      fill: "flat colour; pale fills shade at 0.96, mid and dark at 0.84 (multiply a pale fill by 0.84 and it goes grey, not shadowed)",
      tone: "scribble for mass foliage only",
      tones: ["scribble", "hatch", "stipple", "solid"],
      detail: "every leaf gets a midrib; the pot gets a rim and a soil line",
      ink: "moderate",
      frame: "bbox",
      watch: "src/plants.js still sits at 0.15 — half this weight. Those ten are the legacy set",
      src: "src/plants2.js",
    },

    flower: {
      label: "Flower — a head on a stem, drawn as a set",
      pen: 0.26, nib: FIRM, fit: { w: 0.92, h: 0.90 },
      camera: "View.one f 260, vp [50, 26]; k.OUT 1.0 / DET 0.72 / TEX 0.64",
      nibNote: "FIRM, not PEN. The module shipped with Kit's default PEN nib, but plants.html — the page the fifty flowers were approved on — strips a module's nib so its own dials drive the panel, and those dials are FIRM. So the set was judged FIRM on one page and drawn PEN on the canvas. The class settles it.",
      fill: "flat; white and cream petals shade 0.96, everything else 0.84",
      tone: "stipple on a DISC FLORET only — a daisy's centre is seed, not shade. Nothing else",
      tones: ["stipple", "solid"],
      detail: "AUTOMATIC, in the toolkit: midrib + three vein pairs per leaf, a darker base and a crease per radial petal. Fifty hand edits is the wrong fix",
      ink: "moderate",
      frame: "ONE SHARED FRAME for the whole set — a snowdrop is short and a foxglove tall, and that height is information",
      watch: "head scale 1.2–1.55. A head an eighth of the drawing's height has nowhere to put detail and reads as a lollipop",
      src: "src/flowers.js (50 flowers)",
    },

    elevation: {
      label: "Elevation — a facade, flat and frontal",
      pen: 0.30, nib: FIRM, fit: { w: 0.86, h: 0.84 },
      camera: "none (true elevation) or View.two f 300, yaw -22, dist 150",
      fill: "SOLID BLACK IS THE SUBJECT — 55% of the ink is filled window panes. The glazing bar is the white gap BETWEEN black panes, never a line over them",
      tone: "hatch on roofs and the shadow side only",
      tones: ["hatch", "cross", "halftone", "stipple", "solid"],
      detail: "three near-equal bays; cornice, sill, lintel, reveal",
      ink: "16.0% of the bbox (measured, Sézane shopfront); ratio 0.743 w : h; stroke 0.65% of width",
      frame: "bbox",
      watch: "`curve` defaults to TRUE — every rectangle here must say `curve: false` or windows come back as rounded buttons",
      src: "src/arch.js, src/arch2.js (21 buildings)",
    },

    interior: {
      label: "Interior — a room from inside it",
      pen: 0.15, nib: PEN, fit: { w: 0.86, h: 0.74 },
      camera: "View.one, vanishing point inside the back wall",
      fill: "flat colour; warm light is the LIGHT, not the objects — restore each object's identity colour",
      tone: "none",
      tones: ["hatch", "ribs", "solid"],
      detail: "foreground furniture full, back wall characteristic only",
      ink: "moderate",
      frame: "bbox",
      watch: "LEGACY WEIGHT, and these are still flat elevations in src/objects.js. Treat as unfinished",
      src: "src/objects.js (room, shop, corner, nook)",
    },

    scene: {
      label: "Scene — one big recognisable thing, in a frame",
      pen: 0.30, nib: FIRM, fit: { w: 0.96, h: 0.94 },
      camera: "View.one; geometry runs past the frame and is CLIPPED",
      nibNote: "FIRM for the same reason as `flower` — scene.html strips the module nib and drives FIRM dials, canvas.html let the module's PEN default through.",
      fill: "flat colour; shadow is a darker FILL (diagonal facets, crescents), not hatch",
      tone: "hatch only where nothing stands in front of it",
      tones: ["hatch", "cross", "scribble", "stipple", "solid"],
      detail: "the three-rung ladder, all three: foreground ONE thing at object fidelity · middle characteristic features only · distance a repeated token",
      ink: "3.6–4.2% of frame in the line-only register; density peaks at the subject band, roughly double the average, sky near empty",
      frame: "STATED + clip. Derive it from the camera: ground at depth z lands at horizon + gnd·f/(f+z). A frame inferred from the bbox put every subject off-screen once already",
      watch: "a field of evenly spread small tokens is a map, not a landscape. Name the scene after its subject — *cottage in the hills*, not *hills*",
      src: "src/scenes.js (riverside reader), src/scapes.js (the scene kit + ten landscapes)",
    },

    diorama: {
      label: "Diorama — a scene on a block, nothing cropped",
      pen: 0.22, nib: FIRM, fit: { w: 0.94, h: 0.92 },
      camera: "ortho yaw/pitch (the product camera), with a soil block under the ground plane",
      fill: "flat colour throughout",
      tone: "none",
      tones: ["hatch", "solid"],
      detail: "the ladder still applies, but the near rung is a whole building",
      ink: "moderate across the block",
      frame: "bbox — the point of a diorama is that the edges are IN the picture",
      watch: "sky things must face the camera (`du = [cos yaw, 0, sin yaw]`), or the sun is an ellipse on a wall",
      src: "src/cafe.js (café street)",
    },

    panel: {
      label: "Storyboard panel — a shot, in a ruled frame",
      pen: 0.26, nib: FIRM, fit: { w: 0.94, h: 0.94 },
      camera: "whatever the shot needs; the panel crops, it does not fit",
      fill: "flat, and LESS of it than the same subject gets alone — a panel is read in two seconds",
      tone: "one value for the ground, one for the sky if either is needed; nothing finer",
      tones: ["hatch", "cross", "scribble", "stipple", "solid"],
      detail: "set by SHOT SIZE, not by the subject: a wide shot draws the distance rung for everything, a close-up draws the foreground rung for one thing",
      ink: "low — a board is read as a sequence, and even density across eight panels reads as noise",
      frame: "STATED + clip, at the panel's aspect. A panel is a crop, always",
      watch: "drawing every panel at object fidelity turns a board into eight separate illustrations and loses the sequence",
      src: "src/board.js",
    },
  };

  /* what Kit.wrap wants */
  const of = (name) => {
    const c = CLASS[name];
    if (!c) throw new Error("Spec: no class '" + name + "' — have " + Object.keys(CLASS).join(", "));
    return { fit: c.fit, pen: c.pen, nib: c.nib };
  };

  const wrap = (name, label, build) => {
    const c = of(name);
    const w = Kit.wrap(label, build, c.fit, c.pen, c.nib);
    w.cls = name;
    return w;
  };

  /* the stroke width a class draws at, in px, on a page at the house weight */
  const ink = (name) => of(name).pen * REF;

  /*
   * AUDIT — where a module has drifted off its class.
   *
   * A guardrail nobody can check is a paragraph. `Spec.audit(mod, cls)`
   * answers in numbers, and bin/check.js runs it over every registered
   * subject so drift shows up as a failing page, not as a drawing somebody
   * eventually notices looks wrong.
   */
  function audit(mod, name) {
    const c = of(name), out = [];
    if (mod.pen !== c.pen)
      out.push("pen " + mod.pen + " vs class " + c.pen +
               " (" + (mod.pen * REF).toFixed(1) + "px vs " + (c.pen * REF).toFixed(1) + "px)");
    const n = mod.nib || {};
    for (const k of Object.keys(c.nib))
      if (n[k] !== undefined && n[k] !== c.nib[k]) out.push("nib." + k + " " + n[k] + " vs " + c.nib[k]);
    if (mod.fit && (mod.fit.w !== c.fit.w || mod.fit.h !== c.fit.h))
      out.push("fit " + mod.fit.w + "/" + mod.fit.h + " vs " + c.fit.w + "/" + c.fit.h);

    /*
     * TONE POLICY, checked rather than written down.
     *
     * Every class row has carried a prose `tone:` line since the table was
     * built, and src/still.js spent its whole life in breach of its own —
     * `object` says "none as texture, shadow is a DARKER FILL" and the still
     * life put a halftone screen on seven subjects. Nobody noticed, because
     * the audit only ever looked at the hand. A guardrail nobody can check
     * is a paragraph; this is the same lesson a second time, one field over.
     *
     * The kinds a subject emits are only knowable by building it, so build
     * it. Every build here is pure geometry and runs in a millisecond.
     */
    const allow = CLASS[name].tones;
    if (allow && typeof mod.build === "function") {
      try {
        const kinds = new Set((mod.build().tones || []).map((t) => t.kind));
        for (const k of kinds)
          if (!allow.includes(k))
            out.push("tone '" + k + "' not allowed for " + name +
                     " (allowed: " + allow.join(", ") + ")");
      } catch (e) { out.push("build failed: " + e.message); }
    }
    return out;
  }

  /* the class as readable guardrails — for a person, or an agent, at runtime */
  function brief(name) {
    const c = of(name), C = CLASS[name];
    return [C.label,
      "  hand     pen " + c.pen + " (" + (c.pen * REF).toFixed(1) + "px at weight " + REF + "), fit " + c.fit.w + " × " + c.fit.h,
      "  camera   " + C.camera,
      "  fill     " + C.fill,
      "  tone     " + C.tone,
      "  tones    " + (C.tones ? C.tones.join(" ") : "(unenforced)"),
      "  detail   " + C.detail,
      "  ink      " + C.ink,
      "  frame    " + C.frame,
      "  watch    " + C.watch,
      "  source   " + C.src].join("\n");
  }

  return { REF, FIRM, PEN, CLASS, of, wrap, ink, audit, brief,
           keys: () => Object.keys(CLASS) };
})();
