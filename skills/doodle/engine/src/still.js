/*
 * TEN STILL LIFE ELEMENTS — stoneware jug, roemer glass, pewter plate and
 * herring, bread loaf, cut lemon, skull, hourglass, stack of books,
 * brass candlestick, bunch of grapes.
 *
 * The vocabulary is the Dutch seventeenth century: the breakfast piece (bread,
 * herring, the jug and the glass), the vanitas (skull, hourglass, the candle
 * just snuffed) and the pronk (the lemon — cut, not peeled: see LEARNINGS,
 * the spiralling peel is the motif those painters signed their skill with
 * and six rounds of it never read as anything but tape).
 * They are ten objects rather than one arrangement so each can be used on its
 * own, but they share a light, a ground line and a scale, so put any of them
 * beside any other and they sit on the same table.
 *
 * CLASS `object`, and the class says how to draw a round thing:
 *
 *   "a round object drawn as a prism turns every circle into a skewed egg —
 *    use flat profiles on the front plane with a crescent on the right"
 *
 * So there is no 3D camera in this file. Eight of the ten are solids of
 * revolution, and a solid of revolution is authored here the way an
 * illustrator actually draws one: a half profile mirrored about its axis for
 * the silhouette, an ellipse at every opening, and a crescent down the shaded
 * side for the turn. `Q` is the single number that makes them agree — how
 * squashed every ellipse is, which IS the height of the eye above the table.
 * One value for all ten or they stop sharing a viewpoint.
 *
 * Author in the tile: x right, y DOWN, the table at `GND`. Back to front,
 * because a later fill covers an earlier one.
 */
window.Still = (function () {
  const RAD = Math.PI / 180;

  /* the eye height, as the squash of every horizontal circle. 0.30 is a table
     seen from a seat at it — low enough that rims read as ellipses rather than
     as discs, high enough to see into an open mouth */
  const Q = 0.30;
  const GND = 86;       /* the table line every object stands on */
  const CX = 50;        /* the tile's vertical axis */

  /* ── primitives ───────────────────────────────────────────────────── */

  const ell = (cx, cy, rx, ry, n, a0, a1) => {
    const N = n || 40, A0 = a0 == null ? 0 : a0, A1 = a1 == null ? 360 : a1;
    const full = A1 - A0 >= 360, out = [];
    for (let i = 0; i < (full ? N : N + 1); i++) {
      const a = (A0 + ((A1 - A0) * i) / N) * RAD;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  };
  /* a ring at height y on the axis, as it reads from this eye */
  const ring = (cy, r, a0, a1, n) => ell(CX, cy, r, r * Q, n || 40, a0, a1);
  /* 0° is the RIGHT of a ring and angles run clockwise on screen, so the half
     nearest the viewer is 0 → 180 and the far half is 180 → 360 */
  const front = (cy, r, n) => ring(cy, r, 0, 180, n || 24);
  const back = (cy, r, n) => ring(cy, r, 180, 360, n || 24);

  const lerp = (a, b, t) => a + (b - a) * t;

  /* the profile's radius at any height, so a band sits ON the body it circles
     instead of at a radius guessed to match it */
  function radAt(prof, y) {
    for (let i = 0; i < prof.length - 1; i++) {
      const [y0, r0] = prof[i], [y1, r1] = prof[i + 1];
      if (y >= Math.min(y0, y1) && y <= Math.max(y0, y1) && y1 !== y0)
        return lerp(r0, r1, (y - y0) / (y1 - y0));
    }
    return prof[prof.length - 1][1];
  }

  /*
   * A BAND round an opaque body — the near half only.
   *
   * Drawn as a whole ellipse it is a whole ellipse: marks have no depth
   * occlusion here, so the far side of the band comes through the pot as a
   * loop over its own front. Every ring on a solid is a `band`; only the
   * MOUTH of an open vessel is a full ellipse, because there the far lip is
   * genuinely in view.
   */
  const band = (k, prof, y, w, grow) =>
    k.M(front(y, radAt(prof, y) * (grow == null ? 1 : grow)), w);

  /*
   * A solid of revolution from a half profile — [[y, r], …] top to bottom,
   * r measured from the axis. Returns the closed silhouette: down the right
   * side, round the front of the base, up the left side, and across the BACK
   * of the mouth, so an open vessel's outline is the shape the eye really
   * sees rather than a flat-topped bottle.
   */
  function body(prof, o) {
    const e = (o || {}).open;
    const top = prof[0], bot = prof[prof.length - 1];
    const right = prof.map(([y, r]) => [CX + r, y]);
    const left = prof.map(([y, r]) => [CX - r, y]).reverse();
    return right
      .concat(front(bot[0], bot[1], 20))        /* round the foot, towards us */
      .concat(left)
      /* NOT `.reverse()`: the path is at the LEFT lip and back() runs 180° →
         360°, which starts there. Reversed it started at the right lip, and
         the stroke jumped straight across the mouth — a bar over every open
         vessel, hidden by the fill and plain the moment colour went off. */
      .concat(e === false ? [] : back(top[0], top[1], 18));
  }

  /*
   * The crescent: the turn of a round body away from the light, which comes
   * from the upper left. It is a darker FILL, never hatch — the class is
   * explicit that an object's shadow is a fill on the facet.
   *
   * Built by walking the profile twice: once at r, once at r pulled in by
   * `k` of the radius, so the band is wide at the belly and closes to nothing
   * at the ends, exactly as the real terminator does.
   */
  function crescent(prof, k) {
    const kk = k == null ? 0.42 : k;
    const outer = prof.map(([y, r]) => [CX + r, y]);
    const inner = prof.map(([y, r]) => [CX + r * (1 - kk), y]).reverse();
    return outer.concat(inner);
  }

  /* resample a profile so a fill reads smooth without authoring 40 rows */
  function smooth(prof, n) {
    const out = [];
    const N = n || 4;
    for (let i = 0; i < prof.length - 1; i++) {
      const [y0, r0] = prof[i], [y1, r1] = prof[i + 1];
      for (let j = 0; j < N; j++) {
        const t = j / N, s = t * t * (3 - 2 * t);   /* ease, so corners round */
        out.push([lerp(y0, y1, t), lerp(r0, r1, s)]);
      }
    }
    out.push(prof[prof.length - 1]);
    return out;
  }

  /*
   * One vessel: fill, crescent, silhouette, and the rim as a full ellipse when
   * it is open. `sd` is the draw order seed — regions are painted in the order
   * authored, so every object hands out its own ascending numbers.
   */
  function vessel(k, prof, fill, sd, o) {
    const e = o || {};
    const P = smooth(prof, e.steps || 4);
    const sil = body(P, { open: e.open });
    k.R(sil, fill, sd, 1, true);
    if (e.shade !== false) {
      const cr = crescent(P, e.crescent);
      k.R(cr, fill, sd + 1, 0.72, true);
      /*
       * The SAME turn, again, as tone.
       *
       * `?outline=1` keeps tones and drops fills, so with the crescent held
       * only in a fill every round body here lost its volume the moment the
       * colour went off and came back as a bare wire loop. A drawing has to
       * read in line FIRST — the colour is the second pass, not the drawing.
       *
       * AND IT IS `ribs`, NOT A DOT SCREEN. This was a halftone for four
       * rounds and was rejected twice as mechanical, which is exactly what it
       * was: a dot screen is the mark of a printing process, and the same
       * screen on ten different objects reads as a filter laid over the
       * sheet rather than as light on a thing. `ribs` rules each scanline at
       * a fraction of its own span, so the shading lines bow with the body —
       * which on a LATHE-TURNED object is also literally what the surface
       * does. The class now enforces it: `Spec.of("object").tones`.
       */
      k.T(cr, "ribs", 0.42, { fill: "cInk", s: sd + 1, curve: true, gap: 2.2 });
    }
    k.M(sil, k.OUT, { closed: true });
    if (e.open !== false) {
      const [ty, tr] = P[0];
      /* the mouth: the whole ellipse, because we are above it and the far lip
         is the line that says the thing is hollow */
      k.M(ring(ty, tr), k.DET * 1.25, { closed: true });
      if (e.bore) k.R(ell(CX, ty, tr * 0.86, tr * 0.86 * Q), e.bore, sd + 2, 0.66, true);
    }
    return sil;
  }

  /*
   * A HOLE, as opposed to a shade.
   *
   * `?outline=1` skips every REGION and keeps every TONE. A socket, a nasal
   * aperture, an eye — these are not shading, they are holes, and they are
   * the whole read of the object they are in. Authored as fills alone the
   * skull loses its eyes the moment the colour is switched off and goes back
   * to being an egg. So a hole is a fill AND a solid tone over it.
   *
   * Shading stays a fill, per the class: "Shadow is a DARKER FILL on the
   * facet, not hatch."
   */
  function hole(k, pts, sd) {
    k.R(pts, "cInk", sd, 1, true);
    k.T(pts, "solid", 0.9, { fill: "cInk", s: sd, curve: true });
  }

  /* the pooled shadow every object casts on the table, to the lower right */
  function cast(k, r, o) {
    const e = o || {};
    k.R(ell(CX + (e.dx == null ? r * 0.30 : e.dx), GND + (e.dy || 1.5),
            r * (e.sx || 1.25), r * (e.sy || 0.26)), "cWash", e.sd == null ? 0 : e.sd, 1, true);
  }

  const C = {};   /* colour keys live on the PAGE; see still.html / canvas.html */

  /* ── 1 · the stoneware jug ────────────────────────────────────────── */
  /*
   * The breakfast piece's jug: salt-glazed grey stoneware, a belly that does
   * most of the work and a neck that does the rest. The handle is the tell —
   * it springs from the neck and lands on the belly, and it is a RIBBON (two
   * curves and two ends), never a single stroke, or it reads as wire.
   */
  function jug(k) {
    const prof = [[18, 11], [23, 8.5], [28, 11], [36, 19], [46, 23],
                  [58, 22.5], [70, 17], [78, 13.5], [82, 13]];
    cast(k, 23);
    /* handle first: it passes BEHIND the belly, so the body's fill must land
       on top of where it meets */
    const ho = [], hi = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      /* the strap: out from the neck, down, and back IN to the belly. The
         return is what makes it a handle — an arc that never comes back is a
         spout, and the first version of this read as exactly that */
      /* it has to spring CLEAR of the belly. Round 2 bowed it to 26 against a
         belly of 23 and the strap lay on the pot with no hole through it —
         and a handle is defined by the hole, not by the strap */
      const cx = CX + 10 + Math.sin(t * Math.PI) * 25;
      const cy = lerp(26, 57, t * t * (3 - 2 * t));
      const w = 3.6 - 1.2 * Math.abs(t - 0.5) * 2;
      /* thickness across the strap, not vertically: near the ends the strap
         runs nearly horizontally and a vertical offset collapses it */
      const nx = Math.cos(t * Math.PI) * 0.55, ny = 1;
      const m = Math.hypot(nx, ny);
      ho.push([cx + (ny / m) * w, cy - (nx / m) * w]);
      hi.push([cx - (ny / m) * w, cy + (nx / m) * w]);
    }
    k.R(ho.concat(hi.reverse()), "cStone", 1, 0.78, true);
    k.M(ho, k.OUT); k.M(hi, k.OUT);

    vessel(k, prof, "cStone", 3, { bore: "cStone" });
    /* the two incised bands every Westerwald jug carries round its belly —
       the NEAR half of each, or the far half loops back over the front */
    band(k, prof, 41, k.DET);
    band(k, prof, 53, k.DET);
    /* the rings the potter's fingers left on the shoulder, finer still */
    for (const y of [34, 37]) band(k, prof, y, k.TEX * 1.4);
    k.M(front(82, 13), k.DET);   /* the foot sits ON the table */
  }

  /* ── 2 · the roemer ───────────────────────────────────────────────── */
  /*
   * The green Rhenish wine glass. Three parts that must stay distinct or it
   * stops being a roemer: a round bowl, a hollow stem stuck with PRUNTS (the
   * blobs you grip with greasy fingers), and a foot wound from a trailed
   * coil. The glass is pale and the outline carries it — a transparent thing
   * drawn with a heavy fill goes to stone.
   */
  function roemer(k) {
    cast(k, 18, { sy: 0.22 });
    /*
     * The proportion IS the identification, and the first version got it
     * wrong: a small cup on a long stem is a chalice. A roemer is squat — the
     * bowl is the biggest thing in it, about half the total height, and the
     * foot is nearly as wide as the bowl. Drawn as a trophy it stops being
     * Dutch and starts being a prize.
     */
    const foot = [[62, 8.4], [67, 13.5], [72, 17.5], [75, 18.6], [77, 17.6]];
    vessel(k, foot, "cGlass", 1, { open: false, crescent: 0.30 });
    /* the wound coil: a trail of glass laid round the cone, tight at the
       bottom and only ever the near half */
    for (let i = 0; i < 5; i++) {
      const y = 75.5 - i * 2.9;
      k.M(front(y, radAt(foot, y) * 1.01, 16), k.TEX * 1.4);
    }
    const stem = [[42, 8.6], [50, 8.2], [57, 8.0], [62, 8.4]];
    vessel(k, stem, "cGlass", 4, { open: false, crescent: 0.30 });
    /*
     * The bowl is OVOID and its mouth is narrower than its belly. Round 2
     * opened the mouth almost to the full width and the glass became a cup on
     * a stand — the incurve above the belly is the whole difference between a
     * roemer and a goblet, and it is only three units of radius.
     */
    const bowl = [[11, 13.8], [15, 16.8], [21, 18.6], [28, 18.4], [35, 15.0],
                  [40, 10.6], [42, 8.6]];
    vessel(k, bowl, "cGlass", 7, { crescent: 0.30, steps: 6, bore: "cGlass" });
    /*
     * The wine. Round 3 set its radius from the bowl's belly and drew a disc
     * WIDER THAN THE MOUTH IT IS SEEN THROUGH — on an incurved vessel the
     * opening is the narrowest thing above the liquid, so it is the opening,
     * not the belly, that limits what is visible.
     */
    const wy = 18.0, wr = Math.min(radAt(bowl, wy), bowl[0][1]) * 0.90;
    k.R(ell(CX, wy, wr, wr * Q), "cWine", 10, 1, true);
    k.M(ring(wy, wr), k.DET);
    /*
     * Prunts, in two rows round the stem. Only the NEAR half is drawn: a
     * prunt on the far side is seen through two walls of glass and is a
     * different drawing — and drawn flat it just reads as a hole.
     */
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const a = 24 + i * 44, y = 48 + row * 7;
        const p = ring(y, radAt(stem, y), a, a, 1)[0];
        k.R(ell(p[0], p[1], 2.2, 2.2), "cGlass", 12 + row, 0.72, true);
        k.M(ell(p[0], p[1], 2.2, 2.2), k.TEX * 1.5, { closed: true });
      }
    }
  }

  /* ── 3 · the pewter plate and herring ─────────────────────────────── */
  /*
   * A plate is the one still-life object that is nearly all ellipse, so it is
   * where `Q` is most exposed: get the squash wrong and the whole set tips.
   * It has a THICKNESS — the near rim shows its edge as a second curve below
   * the first — and that edge is most of what says pewter rather than paper.
   */
  function plate(k) {
    /*
     * ROUND 3 PUT FIVE NESTED ELLIPSES HERE — rim, rim underside, well, and
     * two "mouldings" I added to give the line work something to do. Drawn a
     * few units apart by a hand with wander they cross each other, and the
     * whole thing read as coiled rope with a fish caught in it. Concentric
     * curves are the failure mode of this entire subject; the plate gets
     * TWO, and the fish gets the drawing.
     */
    const R = 34, RY = R * Q, W = 2.8, PY = GND - 6;
    cast(k, R, { sy: 0.16, dy: 2.0 });
    k.R(ell(CX, PY, R, RY).concat(ell(CX, PY + W, R, RY).reverse()),
        "cPewter", 1, 0.70, true);
    k.R(ell(CX, PY, R, RY), "cPewter", 2, 1, true);
    /*
     * The rim is drawn in THREE arcs, not as one ellipse. Marks have no depth
     * occlusion, so the far side of the rim ran straight across the herring
     * lying on it. The near half (0–180) is clear of the fish; the far half
     * is cut either side of where the fish covers it. Hand-clipped, the same
     * way the cottage's thatch combing had to be.
     */
    k.M(ell(CX, PY, R, RY, 30, 0, 180), k.OUT);
    k.M(ell(CX, PY, R, RY, 12, 180, 219), k.OUT);
    k.M(ell(CX, PY, R, RY, 12, 333, 360), k.OUT);
    k.M(front(PY + W, R, 26), k.DET);          /* the near edge of the metal */
    /*
     * The well is a FILL ONLY. Every mark and every tone renders after every
     * region — "a line authored first draws OVER a fill added later" — so a
     * well drawn as a curve runs straight through the fish standing on it,
     * whatever order it is authored in. The fish is almost as wide as the
     * well, so there is no arc left to draw anyway.
     */
    k.R(ell(CX, PY + 0.6, R * 0.66, RY * 0.66), "cPewter", 3, 0.90, true);

    /*
     * The herring, and it is now the subject rather than a garnish: it runs
     * most of the plate, and its silhouette is drawn clear of the rim so the
     * two forms never overlap as line.
     */
    const fy = PY - 7.5;
    const spine = (t) => [lerp(CX - 25, CX + 17, t),
                          fy + Math.sin(t * Math.PI) * 2.6 - t * 1.2];
    const up = [], dn = [];
    for (let i = 0; i <= 26; i++) {
      const t = i / 26, p = spine(t);
      const h = 9.4 * Math.sin(Math.pow(t, 0.60) * Math.PI) + 1.1;
      up.push([p[0], p[1] - h]); dn.push([p[0], p[1] + h * 0.84]);
    }
    const hull = up.concat(dn.reverse());
    k.R(hull, "cFish", 5, 1, true);
    k.M(up, k.OUT); k.M(dn, k.OUT);
    /* the dark back, as fill AND tone, bounded by a curve inside the flank */
    const back = up.concat(up.map(([x, y], i) =>
      [x, lerp(y, dn[i][1], 0.42)]).reverse());
    k.R(back, "cFish", 6, 0.60, true);
    k.T(back, "hatch", 0.40, { fill: "cInk", s: 6, curve: true, gap: 2.0, angle: 74 });

    /* tail: a deep notched fork, which is most of a herring's silhouette */
    const tp = spine(1);
    const tail = [[tp[0] - 1, tp[1] - 2.2], [tp[0] + 12, tp[1] - 9.5],
                  [tp[0] + 7.4, tp[1] - 0.6], [tp[0] + 12.5, tp[1] + 6.5],
                  [tp[0] - 1, tp[1] + 2.2]];
    k.R(tail, "cFish", 7, 0.84, true);
    k.M(tail, k.DET * 1.5, { closed: true });

    const hp = spine(0);
    /* head: the gill plate is ONE firm curve, not two; then mouth and eye */
    k.M([[hp[0] + 9.5, hp[1] - 7.0], [hp[0] + 7.6, hp[1] - 1.0],
         [hp[0] + 8.6, hp[1] + 4.6]], k.DET * 1.4);
    k.M([[hp[0] + 0.4, hp[1] + 0.4], [hp[0] + 5.2, hp[1] + 1.6]], k.DET);
    hole(k, ell(hp[0] + 4.6, hp[1] - 2.2, 1.6, 1.6), 8);
    /* the dorsal fin, and the two on the belly: a fish is known by its fins */
    const dor = spine(0.46);
    k.M([[dor[0] - 7, dor[1] - 9.4], [dor[0] - 1.5, dor[1] - 13.5],
         [dor[0] + 6, dor[1] - 8.8]], k.DET);
    [0.36, 0.66].forEach((t, fi) => {
      const q = spine(t);
      k.M([[q[0] - 4, q[1] + 6.0], [q[0], q[1] + 10.0], [q[0] + 4, q[1] + 5.6]],
          k.DET * 0.9, { s: 20 + fi });
    });
    /* the lateral line — the one mark that makes a fish shape THIS fish */
    k.M(up.map(([x, y], i) => [x, lerp(y, dn[i][1], 0.44)]).slice(3, 24), k.TEX * 1.8);
  }

  /* ── 4 · the loaf ─────────────────────────────────────────────────── */
  /*
   * Bread is the one object here with no straight line and no axis, so it is
   * authored as a closed outline with a little noise on it rather than from a
   * profile. The scores are what make it bread: three slashes across the
   * crown, each opening into a pale cut — a slash drawn as one line is a
   * scratch, so each is a narrow filled wedge.
   */
  function loaf(k) {
    cast(k, 30, { sy: 0.20 });
    const out = [];
    for (let i = 0; i <= 44; i++) {
      const a = (i / 44) * 360;
      const w = 1 + 0.035 * Math.sin(a * 3 * RAD + 0.7) + 0.022 * Math.sin(a * 5 * RAD);
      const p = ell(CX, GND - 15, 30 * w, 17 * w, 1, a, a)[0];
      out.push([p[0], Math.min(p[1], GND - 0.5)]);
    }
    k.R(out, "cCrust", 1, 1, true);
    k.M(out, k.OUT, { closed: true });
    /* the underside stays in shadow: the loaf sits in its own contact shade */
    /*
     * Closed along a CHORD, not left as an open arc. Filtering the outline
     * gives a run of points whose two ends are far apart, and a tone smoothed
     * with `curve: true` bows that closing chord outward — the loaf grew a
     * dotted band wider than the bread. The chord is authored, and the tone
     * is not curved.
     */
    const under = out.filter(([, y]) => y > GND - 13);
    k.R(under, "cCrust", 2, 0.74, true);
    if (under.length > 2)
      k.T(under.concat([[under[0][0], under[0][1]]]), "hatch", 0.42,
          { fill: "cInk", s: 2, curve: false, gap: 2.6, angle: 58 });
    for (let i = 0; i < 3; i++) {
      const cx = CX - 16 + i * 16, cy = GND - 22 + Math.abs(i - 1) * 2.6;
      const a = [], b = [];
      for (let j = 0; j <= 10; j++) {
        const t = j / 10, x = cx + lerp(-7, 9, t), y = cy + lerp(-4.5, 7.5, t);
        const h = 1.9 * Math.sin(t * Math.PI);
        a.push([x - h, y - h * 0.5]); b.push([x + h, y + h * 0.5]);
      }
      k.R(a.concat(b.reverse()), "cBread", 3 + i, 1, true);
      k.M(a, k.DET); k.M(b, k.DET);
    }
    /* flour: specks, which is the one place a texture mark belongs on bread */
    for (let i = 0; i < 26; i++) {
      const a = (i * 97) % 360, rr = 0.42 + ((i * 37) % 100) / 220;
      const p = ell(CX, GND - 15, 30 * rr, 17 * rr, 1, a, a)[0];
      if (p[1] > GND - 6) continue;
      k.M(ell(p[0], p[1], 0.55, 0.55, 7), k.TEX, { closed: true });
    }
  }

  /* ── 5 · the lemon ────────────────────────────────────────────────── */
  function lemon(k) {
    /*
     * SIX ROUNDS WENT INTO A HALF-PEELED LEMON AND NONE OF THEM READ.
     *
     * Every one of them failed in the peel, and every fix made the peel
     * harder: wind it tighter, drop it further, lead it in from the cut, give
     * it two faces. The last version came out as a strip of masking tape
     * standing on its edge beside an egg.
     *
     * The mistake was never the peel's geometry. It was the VIEW. A spiral
     * hanging in the air is the single hardest thing in this entire set to
     * draw — it is the motif those painters signed their skill with precisely
     * because it is hard — and it carries none of the identification. Nothing
     * about a yellow ribbon says lemon.
     *
     * One thing in a lemon says lemon and nothing else can: the ROSETTE on a
     * cut face. Eight segments round a pith core, inside a pith ring, inside
     * the rind. So the fruit is cut, not peeled, and the drawing is spent on
     * the face instead of on a helix. The peel is gone — a motif I cannot
     * draw is worth less than a lemon anyone can name.
     */
    const HX = 32, HY = GND - 13.2, HRX = 15, HRY = 13.2;   /* the cut half */
    const LX = 71, LY = GND - 11.0, LRX = 14.0, LRY = 11.4; /* the whole one */

    k.R(ell(LX + 3, GND + 1.2, LRX * 1.25, LRX * 0.24), "cWash", 0, 1, true);
    k.R(ell(HX + 3, GND + 1.4, HRX * 1.15, HRX * 0.24), "cWash", 1, 1, true);

    /*
     * The whole fruit, lying down. Round 5 drew it as a plain ellipse with a
     * nub of 0.21 at each end — smaller than the hand's own wander, so it
     * came out an egg. A lemon is an ellipse PINCHED towards both ends with a
     * hard little point standing off each one, and both have to be large
     * enough to survive the wobble of the pen that draws them.
     */
    const skin = (a, g) => {
      const c = Math.cos(a * RAD), s = Math.sin(a * RAD), G = g == null ? 1 : g;
      const pinch = 1 - 0.17 * Math.pow(c * c, 2);
      const nip = Math.pow(Math.abs(c), 10) * (c > 0 ? 3.4 : 2.4) * Math.sign(c);
      return [LX + LRX * c * G + nip * G, LY + LRY * s * pinch * G];
    };

    /* a leaf, springing clear of the top so its outline never has to be cut
       out of the fruit's fill — marks render after every region here */
    const a0 = [LX - 2.5, LY - 10.6], a1 = [LX - 16.5, LY - 22.5];
    /* the half-width goes ACROSS the axis. Offsetting it along a fixed
       direction that happened to be near-parallel to the axis is what made
       the first leaf a needle: a ribbon needs the PERPENDICULAR, derived */
    const ax = a1[0] - a0[0], ay = a1[1] - a0[1];
    const al = Math.hypot(ax, ay), nx = -ay / al, ny = ax / al;
    const rib = (t) => {
      const w = Math.pow(Math.sin(t * Math.PI), 0.62) * 5.4;
      const bow = Math.sin(t * Math.PI) * 2.6;      /* the leaf curls back */
      return [lerp(a0[0], a1[0], t) + nx * bow, lerp(a0[1], a1[1], t) + ny * bow, w];
    };
    const lf = [];
    for (let i = 0; i <= 22; i++) {
      const [px, py, w] = rib(i / 22); lf.push([px + nx * w, py + ny * w]);
    }
    for (let i = 22; i >= 0; i--) {
      const [px, py, w] = rib(i / 22); lf.push([px - nx * w, py - ny * w]);
    }
    k.R(lf, "cGreen", 2, 1, true);
    k.M(lf, k.DET * 1.3, { closed: true });
    k.M([0, 0.25, 0.5, 0.75, 1].map((t) => { const q = rib(t); return [q[0], q[1]]; }),
        k.TEX * 1.8);

    const sk = [];
    for (let i = 0; i <= 56; i++) sk.push(skin((i / 56) * 360));
    k.R(sk, "cLemon", 3, 1, true);
    /* the turn away from the light, as a fill AND the same shape as tone, so
       it is still there with the colour switched off */
    const lit = [], drk = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, a = -26 + t * 188;
      lit.push(skin(a));
      /* the terminator has to MEET the limb at both ends. Held at a constant
         inset it stops dead against the silhouette and the shade reads as a
         bite taken out of the fruit — the step was the whole fault */
      const g = lerp(1, 0.42, Math.pow(Math.sin(t * Math.PI), 0.55));
      const q = skin(a, g);
      drk.push([q[0] + (1 - g) * 6.0, q[1] + (1 - g) * 2.8]);
    }
    const turn = lit.concat(drk.reverse());
    k.R(turn, "cLemon", 4, 0.78, true);
    /* HATCH, not ribs. `ribs` follows the spans of the shape it is
       given, and a crescent's spans pinch to nothing at both ends — so the
       lines converged at the bottom and the lemon grew a scallop shell.
       `ribs` wants a body; a crescent wants a ruling across it. */
    k.T(turn, "hatch", 0.40, { fill: "cInk", s: 4, curve: true, gap: 2.2, angle: 66 });
    k.M(sk, k.OUT, { closed: true });
    /* the pitted rind, on the lit side only */
    for (let i = 0; i < 6; i++) {
      const a = 196 + i * 15;
      k.M([skin(a, 0.96), skin(a + 8, 0.96)], k.TEX, { s: 50 + i });
    }
    /* the stem scar on the left point */
    k.M([[LX - LRX - 2.4, LY - 0.9], [LX - LRX - 2.4, LY + 0.9]], k.DET * 0.9);

    /*
     * The cut half. Four concentric things, which is three more than this set
     * can usually carry — but here they are NOT evenly spaced rings of the
     * same weight (which is what turned the plate into rope). Rind, pith and
     * flesh step in by different amounts and are drawn at different weights,
     * and the eight segment walls cross all of them, so the eye reads a
     * rosette rather than a coil.
     */
    k.R(ell(HX, HY + 0.8, HRX, HRY), "cLemon", 10, 1, true);
    k.R(ell(HX, HY, HRX - 2.3, HRY - 2.3), "cPith", 11, 1, true);
    const FR = HRX - 4.8, FY = HRY - 4.8;
    k.R(ell(HX, HY, FR, FY), "cLemon", 12, 0.97, true);

    /*
     * Eight segments as ANNULAR wedges, not pie slices. Run to a point at the
     * centre, sixteen walls converge inside a couple of units of each other
     * and the middle of the fruit goes solid black — a dark olive disc with
     * a star in it, which is what the first cut face came out as. They stop
     * on a core, and the core is the pith column every citrus actually has.
     */
    const CORE = 0.17;
    for (let i = 0; i < 8; i++) {
      const s0 = i * 45 + 4.2, s1 = (i + 1) * 45 - 4.2;
      const seg = ell(HX, HY, FR * CORE, FY * CORE, 3, s0, s1)
        .concat(ell(HX, HY, FR * 0.97, FY * 0.97, 9, s1, s0));
      /* the fourth argument is a SHADE MULTIPLIER, not an opacity. Read as
         alpha it looks like "lighter"; it is the opposite, and the cut face
         spent three rounds a dark olive disc because of it */
      k.R(seg, "cLemon", 20 + i, 0.93, true);
      k.M(seg, k.DET * 0.9, { closed: true, s: 20 + i });
    }
    k.R(ell(HX, HY, FR * CORE, FY * CORE), "cPith", 19, 1, true);
    k.M(ell(HX, HY, FR * CORE, FY * CORE), k.DET * 0.8, { closed: true });
    /* two pips, lying in the pith core */
    [[-3.6, 1.2, -26], [2.8, -2.4, 20]].forEach(([dx, dy, rot], i) => {
      const p = [], r = rot * RAD;
      for (let j = 0; j <= 18; j++) {
        const a = (j / 18) * 360 * RAD;
        const px = Math.cos(a) * 2.6, py = Math.sin(a) * 1.55 * (1 - 0.3 * Math.cos(a));
        p.push([HX + dx + px * Math.cos(r) - py * Math.sin(r),
                HY + dy + px * Math.sin(r) + py * Math.cos(r)]);
      }
      k.R(p, "cPith", 40 + i, 1, true);
      k.M(p, k.DET, { closed: true, s: 40 + i });
    });
    /* the three rings, outermost heaviest — a hierarchy, not three same lines */
    k.M(ell(HX, HY + 0.8, HRX, HRY), k.OUT, { closed: true });
    k.M(ell(HX, HY, HRX - 2.3, HRY - 2.3), k.DET * 1.3, { closed: true });
    k.M(ell(HX, HY, FR, FY), k.DET * 0.8, { closed: true });
  }

  /* ── 6 · the skull ────────────────────────────────────────────────── */
  /*
   * The vanitas. A skull reads from four things and nothing else matters at
   * this size: the cranium's dome, the BROW as a shelf over the sockets, the
   * triangular nasal aperture, and the cheekbone's arch. The sockets are the
   * darkest thing in the set and are solid, because they are holes — a socket
   * drawn as an outline reads as an eye, which is the failure.
   */
  function skull(k) {
    cast(k, 24, { sy: 0.18, dy: 0 });
    const cy = GND - 34;
    /*
     * ROUND 1 TAPERED THE OUTLINE STRAIGHT FROM TEMPLE TO JAW and produced an
     * egg. A skull does not taper — it steps. Down the side there are three
     * separate widths: the cranium at its widest above the ear, a TUCK at the
     * temple just behind the eye, and then the cheekbone standing back out
     * almost as wide as the cranium before the jaw finally narrows. That tuck
     * and the flare after it are the entire difference between a skull and an
     * egg, so the outline is a traced half profile, not a formula.
     */
    const half = [
      [-27.5, 0], [-26.5, 7.5], [-23.5, 14], [-18, 19.5], [-11, 22.5],
      [-4, 23.5], [1.5, 22.5],            /* the cranium, widest above the ear */
      [5.5, 19.0],                        /* the temple tuck, behind the eye */
      [8.5, 20.5], [12, 20.0],            /* the cheekbone, standing back out */
      [15.5, 16.0], [18.5, 13.0],         /* and in, to the upper jaw */
      [22, 12.0], [26, 11.0], [28.5, 9.0], [29.5, 0],
    ];
    const out = half.map(([dy, r]) => [CX + r, cy + dy])
      .concat(half.map(([dy, r]) => [CX - r, cy + dy]).reverse());
    k.R(out, "cBone", 1, 1, true);
    k.M(out, k.OUT, { closed: true });
    /*
     * The turn of the cranium. Selecting the points right of a vertical line
     * cut a straight seam down the middle of the face — the shade has to
     * follow the FORM, so it is the same crescent every round body here gets,
     * run off the skull's own half profile.
     */
    k.R(crescent(half.map(([dy, r]) => [cy + dy, r]), 0.46), "cBone", 2, 0.80, true);
    /* the brow: one shelf across both sockets, overhanging them */
    k.M([[CX - 19.5, cy - 2], [CX - 10, cy - 6.5], [CX, cy - 4.0],
         [CX + 10, cy - 6.5], [CX + 19.5, cy - 2]], k.OUT * 0.9);
    /*
     * The sockets are SOLID, because they are holes. Drawn as outlines they
     * read as eyes, which is the one failure a skull cannot survive. They are
     * also not round: square-ish and overhung at the top where the brow sits
     * on them, open and soft at the bottom.
     */
    for (const sx of [-1, 1]) {
      const s = [];
      for (let i = 0; i <= 26; i++) {
        const ang = (i / 26) * 360;
        const c = Math.cos(ang * RAD), si = Math.sin(ang * RAD);
        const r = 7.0 * (1 + 0.14 * Math.pow(Math.abs(c), 3) * (si < 0 ? 1 : 0));
        s.push([CX + sx * 10.2 + c * r, cy + 3 + si * (si > 0 ? 6.0 : 7.4)]);
      }
      hole(k, s, 3);
    }
    /* nasal aperture: an inverted teardrop, also solid, also a hole */
    hole(k, [[CX, cy + 9], [CX + 4.0, cy + 17.5], [CX, cy + 19.5], [CX - 4.0, cy + 17.5]], 5);
    /* the zygomatic arch — the line from the cheekbone back under the temple,
       and the reason the outline stepped out where it did */
    for (const sx of [-1, 1]) {
      k.M([[CX + sx * 19.5, cy + 4], [CX + sx * 15.5, cy + 11], [CX + sx * 8.5, cy + 15]],
          k.DET * 1.3);
    }
    /* the upper jaw and its teeth: a band, then the gaps. Teeth drawn as
       separate little shapes read as a zip; drawn as gaps in a band they read
       as teeth */
    const jy = cy + 21.5;
    const jaw = [[CX - 10.5, jy], [CX + 10.5, jy], [CX + 9.0, jy + 6.5], [CX - 9.0, jy + 6.5]];
    k.R(jaw, "cBone", 6, 0.92, true);
    k.M(jaw, k.DET, { closed: true, curve: false });
    for (let i = 1; i < 6; i++) {
      const x = CX - 10.5 + (21 * i) / 6;
      k.M([[x, jy + 0.6], [x - (x - CX) * 0.08, jy + 6]], k.TEX * 1.5);
    }
    /* the suture over the crown — the detail that dates the drawing to an
       observed skull rather than a symbol */
    k.M([[CX - 20, cy - 14], [CX - 12, cy - 21], [CX - 2, cy - 24],
         [CX + 8, cy - 23]], k.TEX * 1.6);
  }

  /* ── 7 · the hourglass ────────────────────────────────────────────── */
  /*
   * Two cones meeting at a waist, held between two discs by three posts. The
   * sand is the point: the lower bulb has a CONE of it, the upper has a
   * crater, and a thread falls between. Equal sand in both bulbs reads as
   * stopped — this one is running, which is what a vanitas means by it.
   */
  function hourglass(k) {
    cast(k, 20, { sy: 0.22 });
    const TOP = GND - 62, BOT = GND - 2, MID = (TOP + BOT) / 2;
    const RD = 19;                     /* the end discs */
    /* back posts first, then the glass, then the near post */
    for (const a of [210, 330]) {
      const p0 = ring(TOP + 4, RD * 0.82, a, a, 1)[0];
      const p1 = ring(BOT - 4, RD * 0.82, a, a, 1)[0];
      k.R([[p0[0] - 1.8, p0[1]], [p0[0] + 1.8, p0[1]], [p1[0] + 1.8, p1[1]], [p1[0] - 1.8, p1[1]]],
          "cFrame", 1, 0.76, true);
      k.M([[p0[0] - 1.8, p0[1]], [p0[0] + 1.8, p0[1]], [p1[0] + 1.8, p1[1]], [p1[0] - 1.8, p1[1]]],
          k.DET, { closed: true, curve: false });
    }
    /* the glass: one closed outline through both bulbs */
    const upper = [[TOP + 5, 15.5], [TOP + 12, 15.0], [TOP + 20, 11.0], [MID - 1, 2.2]];
    const lower = [[MID + 1, 2.2], [BOT - 20, 11.0], [BOT - 12, 15.0], [BOT - 5, 15.5]];
    const gl = smooth(upper.concat(lower), 4);
    const sil = gl.map(([y, r]) => [CX + r, y])
      .concat(gl.map(([y, r]) => [CX - r, y]).reverse());
    k.R(sil, "cGlass", 3, 1, true);
    k.R(crescent(gl, 0.30), "cGlass", 4, 0.78, true);

    /*
     * The sand, before the outline so the glass's line draws over it. The
     * lower bulb holds a CONE — poured sand stands at its angle of repose and
     * never lies flat, and a flat-topped fill reads as a block of wood, which
     * is what round 2 produced.
     */
    const HY = BOT - 5.5, HR = radAt(gl, HY);
    const heap = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22, x = CX + lerp(-HR, HR, t);
      /* a cone, softened at the apex where the falling thread lands */
      const peak = 11.5 * (1 - Math.abs(t - 0.5) * 2);
      heap.push([x, HY - peak - 1.2 * Math.sin(t * Math.PI)]);
    }
    const sandLow = heap.concat(front(HY, HR, 20).reverse());
    k.R(sandLow, "cGrain", 5, 1, true);
    k.T(sandLow, "stipple", 0.5, { fill: "cInk", s: 5, curve: true, gap: 0.7 });
    k.M(heap, k.DET);
    /* and the upper bulb holds a FUNNEL — the sand has drained to a crater
       whose walls run down to the waist */
    const CY2 = TOP + 20, CR = radAt(gl, CY2);
    const cr = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22, x = CX + lerp(-CR, CR, t);
      cr.push([x, CY2 + 6.0 * Math.sin(t * Math.PI)]);
    }
    k.R(cr.concat([[CX + CR, CY2], [CX + 2.2, MID - 1], [CX - 2.2, MID - 1], [CX - CR, CY2]]),
        "cGrain", 6, 0.92, true);
    k.T(cr.concat([[CX + CR, CY2], [CX + 2.2, MID - 1], [CX - 2.2, MID - 1], [CX - CR, CY2]]),
        "stipple", 0.5, { fill: "cInk", s: 6, curve: true, gap: 0.8 });
    k.M(cr, k.DET);
    /* the thread */
    k.M([[CX, MID], [CX + 0.5, MID + 8], [CX - 0.3, MID + 16], [CX, BOT - 15]], k.TEX * 1.6);

    k.M(sil, k.OUT, { closed: true });
    /* the two discs */
    for (const y of [TOP, BOT]) {
      k.R(ell(CX, y, RD, RD * Q).concat(ell(CX, y + 4.5, RD, RD * Q).reverse()),
          "cFrame", 8, 0.74, true);
      k.R(ell(CX, y, RD, RD * Q), "cFrame", 9, y === TOP ? 1.04 : 0.96, true);
      k.M(ell(CX, y, RD, RD * Q), k.OUT, { closed: true });
      k.M(front(y + 4.5, RD, 22), k.DET);
    }
    const pf0 = ring(TOP + 4, RD * 0.82, 90, 90, 1)[0];
    const pf1 = ring(BOT - 4, RD * 0.82, 90, 90, 1)[0];
    k.R([[pf0[0] - 2.1, pf0[1]], [pf0[0] + 2.1, pf0[1]], [pf1[0] + 2.1, pf1[1]], [pf1[0] - 2.1, pf1[1]]],
        "cFrame", 10, 1, true);
    k.M([[pf0[0] - 2.1, pf0[1]], [pf0[0] + 2.1, pf0[1]], [pf1[0] + 2.1, pf1[1]], [pf1[0] - 2.1, pf1[1]]],
        k.OUT, { closed: true, curve: false });
  }

  /* ── 8 · the books ────────────────────────────────────────────────── */
  /*
   * The one object in the set with an axis of straight lines, which is why it
   * is here: ten round things in a row stop reading as a set and start
   * reading as one lathe. Three volumes, each turned a little off the one
   * below, seen from above the top board.
   *
   * The page block is NOT a flat colour — it is a stack of leaves, and a few
   * ruled lines across it at the right pitch is the entire illusion.
   */
  function books(k) {
    /*
     * ROUND 3 DREW THREE OPEN BOXES AND IT READ AS A CRATE. A book is not a
     * block — it is a BOARD that overhangs a page block on three sides, with
     * a spine that is round and stands proud on the fourth. That overhang is
     * the whole identification: without it there is no difference between a
     * stack of books and a stack of bricks.
     *
     * Seen from above the top board, so each volume shows: its top board, the
     * fore-edge of its pages set BACK under that board, and its spine.
     */
    cast(k, 34, { sy: 0.16, dy: 1 });
    /*
     * SHALLOW. Seen from this eye a deep top board is a big empty
     * quadrilateral, and in line an empty quadrilateral reads as an OPENING —
     * which is why three books came out as three open trays. Make the boards
     * shallow and the slab faces taller than the top, and the stack reads as
     * solid things seen nearly edge-on, which is how books sit in a still
     * life anyway.
     */
    const V = [{ w: 33, d: 11, h: 8.4, turn: -7, col: "cBookR" },
               { w: 28, d: 9.5, h: 6.6, turn: 6, col: "cBookB" },
               { w: 24, d: 8.5, h: 5.4, turn: -3, col: "cBookG" }];
    let y = GND;
    V.forEach((b, i) => {
      const t = b.turn * RAD, ct = Math.cos(t), st = Math.sin(t);
      const at = (x, z, dy) => [CX + (x * ct - z * st),
                                y - b.h + (x * st + z * ct) * Q + (dy || 0)];
      const tl = at(-b.w, -b.d), tr = at(b.w, -b.d);
      const br = at(b.w, b.d), bl = at(-b.w, b.d);
      const drop = (p, d) => [p[0], p[1] + (d == null ? b.h : d)];
      const sd = i * 9;

      /* the page block, inset under the board on the two visible sides and
         NOT inset on the spine side, because the spine wraps it */
      const IN = 1.9;
      const pbl = at(-b.w, b.d - IN, 0), pbr = at(b.w - IN, b.d - IN, 0);
      const ptr = at(b.w - IN, -b.d, 0);
      const pageF = [[pbl[0], pbl[1] + 0.9], [pbr[0], pbr[1] + 0.9],
                     [pbr[0], pbr[1] + b.h - 0.9], [pbl[0], pbl[1] + b.h - 0.9]];
      const pageR = [[pbr[0], pbr[1] + 0.9], [ptr[0], ptr[1] + 0.9],
                     [ptr[0], ptr[1] + b.h - 0.9], [pbr[0], pbr[1] + b.h - 0.9]];
      k.R(pageF, "cPage", sd + 1, 1, false);
      k.R(pageR, "cPage", sd + 2, 0.88, false);
      k.M(pageF, k.DET * 0.8, { closed: true, curve: false });
      k.M(pageR, k.DET * 0.8, { closed: true, curve: false });
      /* leaves: few, uneven, and stopping short of both ends — a ruled grid
         across the whole fore-edge is what made this read as slatted timber */
      for (let j = 0; j < 4; j++) {
        const f = 0.18 + j * 0.2 + (j % 2) * 0.04;
        const yy = 0.9 + f * (b.h - 1.8);
        k.M([[lerp(pbl[0], pbr[0], 0.06), lerp(pbl[1], pbr[1], 0.06) + yy],
             [lerp(pbl[0], pbr[0], 0.94), lerp(pbl[1], pbr[1], 0.94) + yy]],
            k.TEX * 1.3, { curve: false, s: sd + j });
      }

      /* the SPINE: a rounded slab standing proud on the left, with bands */
      const sbl = at(-b.w, b.d), sbt = at(-b.w, -b.d);
      const spine = [[sbl[0] - 1.6, sbl[1] + 0.4], [sbt[0] - 1.6, sbt[1] + 0.4],
                     [sbt[0] - 1.1, sbt[1] + b.h], [sbl[0] - 1.1, sbl[1] + b.h]];
      k.R(spine, b.col, sd + 3, 0.68, false);
      k.M(spine, k.DET * 1.2, { closed: true, curve: false });
      for (let j = 1; j <= 2; j++) {
        const f = j / 3;
        k.M([[lerp(spine[0][0], spine[1][0], f), lerp(spine[0][1], spine[1][1], f)],
             [lerp(spine[3][0], spine[2][0], f), lerp(spine[3][1], spine[2][1], f)]],
            k.TEX * 1.5, { curve: false, s: sd + 5 + j });
      }

      /* the boards: the front edge overhangs the pages, which is the line
         that says book. Drawn as a thin slab, not as a face of the block */
      const BO = 1.2;
      const front = [[bl[0], bl[1]], [br[0], br[1]],
                     [br[0], br[1] + BO], [bl[0], bl[1] + BO]];
      k.R(front, b.col, sd + 4, 0.80, false);
      k.R([tl, tr, br, bl], b.col, sd + 5, 1.06, false);
      k.M([tl, tr, br, bl], k.OUT, { closed: true, curve: false });
      /* a tooled rule inset from the board's edge: the one mark that tells an
         empty quadrilateral it is a COVER and not a hole */
      const inset = (p, q, f) => [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
      const ctr = [(tl[0] + br[0]) / 2, (tl[1] + br[1]) / 2];
      k.M([tl, tr, br, bl].map((p) => inset(p, ctr, 0.17)),
          k.TEX * 1.6, { closed: true, curve: false, s: sd + 8 });
      k.M(front, k.DET * 1.2, { closed: true, curve: false });
      /* and the same slab on the right, under the fore-edge board */
      const side = [[br[0], br[1]], [tr[0], tr[1]],
                    [tr[0], tr[1] + BO], [br[0], br[1] + BO]];
      k.R(side, b.col, sd + 6, 0.66, false);
      k.M(side, k.DET * 1.2, { closed: true, curve: false });
      /* the bottom board, seen as a sliver where it oversails the pages */
      k.M([drop(bl), drop(br)], k.DET, { curve: false });
      k.M([drop(br), drop(tr)], k.DET, { curve: false });
      y -= b.h;
    });
  }

  /* ── 9 · the candlestick ──────────────────────────────────────────── */
  /*
   * Brass, with the candle just put out — the thread of smoke is the subject,
   * and it is the only thing in these ten drawn as a line that fades. A
   * baluster stem is a sequence of swellings, and they must be UNEQUAL: a
   * stem of equal beads reads as a drill bit.
   */
  function candle(k) {
    /*
     * ROUND 3 STACKED SIX ELLIPSES AROUND THE SOCKET and the top of this read
     * as a hookah. The drip pan is ONE disc with a lip, the socket is ONE
     * cup, and the candle has to be TALL — a stub the height of its own
     * socket reads as another turned part of the stick, not as a candle.
     *
     * A baluster stem is a sequence of swellings and they must be UNEQUAL,
     * or the stem reads as a drill bit.
     */
    cast(k, 18, { sy: 0.24 });
    /* foot and stem, in one profile: broad foot, a long waist, one big knop */
    const prof = [[50, 4.6],
                  [53, 8.2], [57, 5.0],                 /* the knop */
                  [63, 6.0], [67, 4.2],                 /* the waist */
                  [71, 8.6], [77, 14.8], [82, 17.0], [84, 16.2]];
    vessel(k, prof, "cBrass", 1, { open: false, crescent: 0.38 });
    k.M(front(84, 16.2), k.DET);
    /* a single incised line round the foot's slope, near half only */
    band(k, prof, 78, k.TEX * 1.6);

    /* the drip pan: ONE disc with a turned-down lip */
    const PY = 46.5, PR = 12.5;
    k.R(ell(CX, PY, PR, PR * Q).concat(ell(CX, PY + 2.2, PR, PR * Q).reverse()),
        "cBrass", 7, 0.70, true);
    k.R(ell(CX, PY, PR, PR * Q), "cBrass", 8, 1.04, true);
    k.T(ell(CX, PY, PR, PR * Q, 40, 182, 358), "hatch", 0.34,
        { fill: "cInk", s: 8, curve: true, gap: 1.0 });
    k.M(ell(CX, PY, PR, PR * Q), k.OUT, { closed: true });
    k.M(front(PY + 2.2, PR, 20), k.DET);

    /* the socket: one short cup standing on the pan */
    const soc = [[38, 7.2], [42, 6.8], [46, 6.0], [50, 4.6]];
    vessel(k, soc, "cBrass", 4, { crescent: 0.38, bore: "cBrass" });

    /*
     * The candle. TALL — two and a half times the socket — because that is
     * the proportion that says candle. Burnt unevenly at the top, with one
     * run of wax down the near side.
     */
    const wax = [[13, 5.6], [18, 5.9], [28, 6.1], [36, 6.3], [40, 6.4]];
    vessel(k, wax, "cWax", 10, { crescent: 0.28, bore: "cWax" });
    k.M([[CX + 2.6, 16.5], [CX + 4.0, 23], [CX + 3.0, 30]], k.TEX * 1.8);
    k.M([[CX - 3.4, 19], [CX - 4.2, 26]], k.TEX * 1.4);
    /* the burnt rim: the top is not level, it has a lip on the lit side */
    k.M([[CX - 5.6, 13.4], [CX - 1.5, 11.6], [CX + 3.0, 12.6], [CX + 5.6, 14.2]],
        k.DET);
    /* the wick, spent: a short black hook, and the smoke still leaving */
    k.M([[CX - 0.4, 12.6], [CX + 0.4, 8.6], [CX + 2.0, 7.0]], k.DET * 1.8);
    const sm = [];
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      sm.push([CX + 2.0 + Math.sin(t * 5.2) * (2.0 + t * 6.0) + t * 3, 7.0 - t * 7.0]);
    }
    k.M(sm, k.TEX * 1.6, { taper: [1.0, 0.1] });
  }

  /* ── 10 · the grapes ──────────────────────────────────────────────── */
  /*
   * A bunch is a CLUSTER problem, not a shape problem: the silhouette is the
   * sum of many circles, so the work is in the packing. Three rules hold it
   * together — the bunch narrows to a point at the bottom, the berries behind
   * are smaller and darker, and each berry's highlight sits in the SAME place
   * on every one, because one light made them all.
   */
  function grapes(k) {
    /*
     * ROUND 3 GAVE EVERY BERRY THE SAME RADIUS, THE SAME OUTLINE WEIGHT AND
     * THE SAME CRESCENT, and the bunch came out as foam — a raft of identical
     * bubbles. A cluster reads from DIFFERENCE: berries in front are bigger,
     * outlined heavier and carry the light; berries behind are smaller, drawn
     * thinner and stay dark. Uniformity is what destroys depth, and no amount
     * of extra tone fixes it.
     */
    cast(k, 22, { sy: 0.22, dy: 0 });
    const top = GND - 56, bot = GND - 2;
    const bs = [];
    const rows = [4, 4, 3, 3, 2, 1];
    rows.forEach((n, r) => {
      const t = r / (rows.length - 1);
      const y = lerp(top + 7, bot - 5, t);
      const spread = lerp(19, 4.5, Math.pow(t, 0.85));
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const jx = ((r * 7 + i * 13) % 5 - 2) * 1.2;
        const jy = ((r * 11 + i * 5) % 5 - 2) * 0.9;
        /* depth is a real number per berry, not a flag: it drives size,
           weight and whether the berry gets any light at all */
        const dep = ((r * 5 + i * 7) % 7) / 6;
        bs.push({ x: CX + lerp(-spread, spread, u) + jx, y: y + jy, dep,
                  r: lerp(7.8, 5.0, t) * lerp(1.0, 0.76, dep) });
      }
    });
    bs.sort((p, q) => q.dep - p.dep);        /* furthest authored first */

    /* the stem, before the berries so they swallow its foot */
    k.M([[CX + 2, top + 9], [CX + 1, top - 2], [CX - 3, top - 9]], k.OUT,
        { taper: [0.8, 1.4] });

    bs.forEach((b, i) => {
      const far = b.dep > 0.55;
      const c = ell(b.x, b.y - b.dep * 2.2, b.r, b.r);
      k.R(c, "cGrape", 10 + i, far ? 0.66 : 1, true);
      k.M(c, (far ? k.TEX * 1.5 : k.DET * 1.4), { closed: true, s: 10 + i });
      if (far) {
        /* a berry at the back is a dark shape, nothing more */
        k.T(c, "ribs", 0.34, { fill: "cInk", s: 10 + i, curve: true, gap: 1.5 });
        return;
      }
      /* the front berries turn: crescent down the lower right, highlight up
         and left — one light made all of them, so it never moves */
      const cr = [];
      for (let j = 0; j <= 14; j++) {
        const a = -40 + (j / 14) * 185;
        cr.push(ell(b.x, b.y, b.r * 0.97, b.r * 0.97, 1, a, a)[0]);
      }
      for (let j = 14; j >= 0; j--) {
        const a = -40 + (j / 14) * 185;
        const q = ell(b.x, b.y, b.r * 0.45, b.r * 0.45, 1, a, a)[0];
        cr.push([q[0] + b.r * 0.24, q[1] + b.r * 0.18]);
      }
      k.R(cr, "cGrape", 60 + i, 0.74, true);
      k.T(cr, "ribs", 0.40, { fill: "cInk", s: 60 + i, curve: true, gap: 1.3 });
      const hl = ell(b.x - b.r * 0.34, b.y - b.r * 0.36, b.r * 0.24, b.r * 0.20);
      k.R(hl, "cBloom", 110 + i, 1, true);
      k.M(hl, k.TEX * 1.2, { closed: true, s: 110 + i });
    });

    /* a vine leaf behind the top, to stop the bunch floating */
    const lf = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, a = t * 360;
      const lob = 1 + 0.24 * Math.cos(a * 2.5 * RAD);
      lf.push([CX - 18 + Math.cos(a * RAD) * 13 * lob, top - 8 + Math.sin(a * RAD) * 9.5 * lob]);
    }
    k.R(lf, "cGreen", 200, 1, true);
    k.M(lf, k.DET * 1.2, { closed: true });
    for (let i = 0; i < 4; i++) {
      const a = 198 + i * 36;
      k.M([[CX - 18, top - 8], ell(CX - 18, top - 8, 11, 8, 1, a, a)[0]], k.TEX * 1.4);
    }
  }

  /* ── registration ─────────────────────────────────────────────────── */

  const BUILD = { jug, roemer, plate, loaf, lemon, skull, hourglass, books, candle, grapes };
  const NAMES = {
    jug: "Stoneware jug", roemer: "Roemer glass", plate: "Pewter plate and herring",
    loaf: "Bread loaf", lemon: "Cut lemon", skull: "Skull",
    hourglass: "Hourglass", books: "Stack of books", candle: "Brass candlestick",
    grapes: "Bunch of grapes",
  };

  const out = { _keys: Object.keys(BUILD), _names: NAMES, GND, Q, C };
  for (const key of out._keys) {
    /*
     * The class owns the hand: `object` is pen 0.30 on the FIRM nib at fit
     * .84/.84, and declaring it that way is what lets bin/check.sh catch this
     * module drifting off it later.
     *
     * The rig is made for its draw lists and its weight hierarchy only — the
     * camera goes unused, because everything here is authored on the picture
     * plane. That is the class's own instruction for round objects, not a
     * shortcut.
     */
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ gnd: GND });
      /* the house hierarchy, as retro.js and plants2.js measured it. The kit
         default puts OUT at 1.45 — a heavy silhouette round a thin interior,
         which is exactly what made the first version of this set read as a
         blob with a wire in it */
      /*
       * A REAL separation, not a nominal one. 1.0 / 0.72 is a 28% step, which
       * at this stroke width is invisible — every mark landed at the same
       * apparent weight and the drawings read as tangles of equal wire. The
       * silhouette has to dominate and the detail has to recede.
       */
      k.OUT = 1.35; k.DET = 0.55; k.TEX = 0.3;
      BUILD[key](k);
      return k.done();
    });
  }
  return out;
})();
