/*
 * FIVE DAILY OBJECTS — a mug, a twin-bell alarm clock, a toaster, a table
 * lamp and a stapler.
 *
 * CLASS `object`: pen 0.30, FIRM nib, flat colour, a turn as a DARKER FILL
 * (which may carry `ribs`), and no dot screen anywhere.
 *
 * The set is chosen for CONSTRUCTION, not for theme. The still-life sheet
 * before this one was rejected twice and the cause, in the end, was that ten
 * objects had been drawn with ONE RECIPE — silhouette, nested ellipses,
 * crescent — so they came out as ten variations of a jug. Five everyday
 * things is a small enough set that each can be a different drawing problem,
 * and the toolkit below is deliberately in two halves because of it:
 *
 *   LATHE   mug, lamp          a half profile mirrored, ellipses at the
 *                              openings, `ribs` down the turn
 *   FACE    alarm clock        a frontal disc; the DIAL is the drawing
 *   EXTRUDE toaster, stapler   a flat silhouette pushed back along one
 *                              offset, faces shaded by their own normal
 *
 * Nothing shares a shape between the three. What they DO share is the eye:
 * `Q` is the squash of every horizontal circle and therefore the height of
 * the viewer above the table, and the same offset drives every extrusion.
 * One eye for the sheet, five constructions on it.
 *
 * Author in the tile: x right, y DOWN, table at GND. Back to front, because
 * a later fill covers an earlier one.
 */
window.Daily = (function () {
  const RAD = Math.PI / 180;

  /* the eye height, as the squash of every horizontal circle. The same 0.30
     the still life uses, so the two sheets sit at one table */
  const Q = 0.30;
  const GND = 84;
  const CX = 50;
  /* and the same eye, for anything extruded rather than turned: one unit of
     depth goes this far right and this far up the page */
  const OFF = [0.44, -0.30];

  const lerp = (a, b, t) => a + (b - a) * t;

  const ell = (cx, cy, rx, ry, n, a0, a1) => {
    const N = n || 40, A0 = a0 == null ? 0 : a0, A1 = a1 == null ? 360 : a1;
    const full = A1 - A0 >= 360, out = [];
    for (let i = 0; i < (full ? N : N + 1); i++) {
      const a = (A0 + ((A1 - A0) * i) / N) * RAD;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  };
  const ring = (cy, r, a0, a1, n, cx) =>
    ell(cx == null ? CX : cx, cy, r, r * Q, n || 40, a0, a1);
  /* 0° is the RIGHT of a ring and angles run clockwise on screen, so the half
     nearest the viewer is 0 → 180 and the far half is 180 → 360 */
  const front = (cy, r, n, cx) => ring(cy, r, 0, 180, n || 24, cx);
  const back = (cy, r, n, cx) => ring(cy, r, 180, 360, n || 24, cx);

  /* ── the LATHE half ───────────────────────────────────────────────── */

  function radAt(prof, y) {
    for (let i = 0; i < prof.length - 1; i++) {
      const [y0, r0] = prof[i], [y1, r1] = prof[i + 1];
      if (y >= Math.min(y0, y1) && y <= Math.max(y0, y1) && y1 !== y0)
        return lerp(r0, r1, (y - y0) / (y1 - y0));
    }
    return prof[prof.length - 1][1];
  }

  function smooth(prof, n) {
    const out = [], N = n || 5;
    for (let i = 0; i < prof.length - 1; i++) {
      const [y0, r0] = prof[i], [y1, r1] = prof[i + 1];
      for (let j = 0; j < N; j++) {
        const t = j / N, e = t * t * (3 - 2 * t);
        out.push([lerp(y0, y1, t), lerp(r0, r1, e)]);
      }
    }
    out.push(prof[prof.length - 1]);
    return out;
  }

  /* the silhouette: down the right, round the FRONT of the foot, up the left,
     and across the BACK of the mouth — so an open vessel's outline is what
     the eye really sees rather than a flat-topped bottle */
  function body(prof, cx, open) {
    const X = cx == null ? CX : cx;
    const top = prof[0], bot = prof[prof.length - 1];
    return prof.map(([y, r]) => [X + r, y])
      .concat(front(bot[0], bot[1], 20, X))
      .concat(prof.map(([y, r]) => [X - r, y]).reverse())
      /*
       * NOT `.reverse()`.
       *
       * The path has just climbed the LEFT side and is standing at the left
       * lip. `back()` runs 180° → 360°, which starts at that same left lip
       * and travels over the top to the right one — so it joins. Reversed,
       * it started at the RIGHT lip instead, and the stroke jumped the whole
       * width of the mouth in one straight segment: a heavy bar across the
       * opening that read as a lid clamped on the cup, and as a crease
       * across the top of every shade and jar. The fill closed over it, so
       * it was only ever visible with the colour off.
       */
      .concat(open === false ? [] : back(top[0], top[1], 18, X));
  }

  /* the turn away from the light, which comes from the upper left. Walked
     twice down the profile — once at r, once pulled in — so it is wide at
     the belly and closes to nothing at both ends, as a real terminator does */
  function crescent(prof, kk, cx) {
    const X = cx == null ? CX : cx, K = kk == null ? 0.40 : kk;
    return prof.map(([y, r]) => [X + r, y])
      .concat(prof.map(([y, r]) => [X + r * (1 - K), y]).reverse());
  }

  /*
   * A BAND round an opaque body — the NEAR HALF only.
   *
   * Drawn as a whole ellipse it is a whole ellipse: marks have no depth
   * occlusion, so the far side of the band comes back over the pot's own
   * front as a loop. Only the MOUTH of an open vessel is a full ellipse,
   * because there the far lip is genuinely in view.
   */
  const band = (k, prof, y, w, cx, grow) =>
    k.M(front(y, radAt(prof, y) * (grow == null ? 1 : grow), 24, cx), w);

  function vessel(k, prof, fill, sd, o) {
    const e = o || {}, X = e.cx == null ? CX : e.cx;
    const P = smooth(prof, e.steps || 5);
    const sil = body(P, X, e.open);
    k.R(sil, fill, sd, 1, true);
    if (e.shade !== false) {
      const cr = crescent(P, e.crescent, X);
      k.R(cr, fill, sd + 1, 0.74, true);
      /*
       * The SAME turn again as TONE, and as `ribs` rather than a screen.
       * `?outline=1` drops every region and keeps every tone, so a turn held
       * only in a fill leaves the body a bare wire loop the moment colour is
       * switched off — and `ribs` rules at a fraction of each span, so its
       * lines bow with the body, which on a lathe-turned thing is also what
       * the surface literally does.
       */
      k.T(cr, "ribs", 0.40, { fill: "cInk", s: sd + 1, curve: true,
                              gap: e.gap || 2.1 });
    }
    /*
     * AN OPEN VESSEL'S OUTLINE IS NOT A CLOSED LOOP.
     *
     * `body()` runs down the right, round the foot, up the left and then
     * across the BACK of the mouth — so its last point is the mouth's left
     * lip and its first is the mouth's right lip. Stroked `closed: true` the
     * hand ruled a STRAIGHT CHORD between them, at full silhouette weight,
     * straight across the opening. That bar is what made the mug read as a
     * sealed takeaway lid for two rounds, and it was never a rim, a lip or a
     * fill — it was the polygon closing itself.
     *
     * The fill still closes; only the stroke is left open.
     */
    k.M(sil, k.OUT, { closed: e.open === false });
    if (e.open !== false) {
      const [ty, tr] = P[0];
      /*
       * THE MOUTH IS THE NEAR HALF ONLY — because `body()` already closed the
       * silhouette across the FAR half of it.
       *
       * Drawn as a full ellipse the far arc was inked TWICE, once at k.OUT
       * and once again on top of it, and the extra weight read as a flat lid
       * clamped over the cup. Two heavy parallel arcs across an opening is a
       * lid; one heavy and one light is a rim.
       */
      k.M(front(ty, tr, 24, X), k.DET * 1.25);
    }
    return sil;
  }

  /* ── the EXTRUDE half ─────────────────────────────────────────────── */

  /*
   * A SOLID FROM A FLAT SILHOUETTE.
   *
   * The class warns that a round object drawn as a prism turns every circle
   * into a skewed egg — so anything turned is a profile, above. But a toaster
   * and a stapler are not turned: they are a PROFILE PUSHED BACK, and that is
   * a different and much more forgiving construction. Draw the shape you can
   * see, push every point by one shared offset, and the faces follow.
   *
   * Which faces are visible is not a guess: an edge shows its flank when its
   * outward normal points the same way as the offset. The normal is found by
   * stepping off the edge and asking whether that lands inside the shape,
   * which works for any silhouette including a concave one.
   *
   * CREASES ONLY WHERE IT TURNS. Outlining every face draws a line down every
   * facet and a rounded nose comes out striped — so a connecting edge is
   * drawn only at a vertex where a visible flank meets a hidden one, which is
   * exactly where the solid's own outline has a corner.
   */
  const LX = -0.45, LY = -0.89;     /* the light: upper left, for every face */

  function solidFromSil(k, sil, off, fill, sd, o) {
    const e = o || {}, O = off || OFF;
    const cur = !!e.curve;
    const shift = (p) => [p[0] + O[0], p[1] + O[1]];
    const n = sil.length;
    /*
     * WHAT STANDS IN FRONT OF THIS SOLID — because nothing else will hide it.
     *
     * Three solids authored back to front are three solids DRAWN in full:
     * fills occlude, and `?outline=1` drops every fill. The stapler was a
     * base, a magazine and an arm, each outlined all the way round, and the
     * result was three slabs floating apart with a wheel beside them instead
     * of one hinged machine. Pass the silhouettes of everything nearer and
     * each stroke is cut where it runs behind them.
     */
    const blockers = e.cut || [];
    const stroke = (pts, w, opt) => {
      if (!blockers.length) return k.M(pts, w, opt);
      k.cut(pts, blockers, !!(opt && opt.closed)).forEach((run, j) =>
        k.M(run, w, Object.assign({}, opt, { closed: false, s: (opt && opt.s || sd) + 500 + j })));
    };

    /* the far copy, which is the solid's back — it is covered by everything
       authored after it, so it never needs an outline of its own */
    k.R(sil.map(shift), fill, sd, e.topShade == null ? 1.08 : e.topShade, cur);

    const OL = Math.hypot(O[0], O[1]) || 1;
    const vis = [];
    for (let i = 0; i < n; i++) {
      const a = sil[i], b = sil[(i + 1) % n];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const L = Math.hypot(ex, ey);
      if (L < 1e-6) { vis.push(null); continue; }
      let nx = ey / L, ny = -ex / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (Kit.inPoly(sil, mx + nx * 0.35, my + ny * 0.35)) { nx = -nx; ny = -ny; }
      const d = (nx * O[0] + ny * O[1]) / OL;
      /* visible if it faces the way the solid is pushed; shaded by where the
         LIGHT is, which is a different question and was being answered with
         the same number */
      vis.push(d > 0.02 ? { a, b, d, lit: nx * LX + ny * LY } : null);
    }
    vis.forEach((f, i) => {
      if (!f) return;
      /*
       * SHADED BY THE LIGHT, which comes from the upper left — not by how
       * well the face lines up with the offset. Scored against the offset
       * (which points up-RIGHT) a flat top face landed at 0.57 and came out
       * DARKER than the front, so every extruded thing on the sheet was lit
       * from below. The class states the values: top 1.08, front 1.0, right
       * flank 0.72.
       */
      k.R([f.a, f.b, shift(f.b), shift(f.a)], fill, sd + 1 + i,
          lerp(0.72, 1.10, (f.lit + 1) / 2), cur);
    });

    /* the front face, nearest, so it covers every flank's inner edge */
    k.R(sil, fill, sd + 90, 1, cur);
    stroke(sil, k.OUT, { closed: true, curve: cur, s: sd + 110 });
    /* the solid's far outline: the offset copy of each visible flank */
    vis.forEach((f, i) => {
      if (!f) return;
      stroke([shift(f.a), shift(f.b)], k.OUT, { curve: cur, s: sd + 120 + i });
    });
    /* and the corners, where a visible flank meets a hidden one */
    for (let i = 0; i < n; i++) {
      const prev = vis[(i - 1 + n) % n], here = vis[i];
      if (!!prev !== !!here) stroke([sil[i], shift(sil[i])], k.OUT, { curve: false, s: sd + 160 + i });
    }
    return sil.map(shift);
  }

  /* a rounded rectangle as a point list — corners that survive `curve: false` */
  function roundRect(x0, y0, x1, y1, r, n) {
    const N = n || 5, out = [];
    const c = [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0],
               [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]];
    c.forEach(([cx, cy, a0]) => {
      for (let i = 0; i <= N; i++) {
        const a = (a0 + (i / N) * 90) * RAD;
        out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    });
    return out;
  }

  /* ── shared marks ─────────────────────────────────────────────────── */

  /*
   * A HOLE, as opposed to a shade. `?outline=1` skips every region and keeps
   * every tone, so a slot, a socket or a dial window authored as a fill alone
   * disappears the moment colour is switched off — and those are exactly the
   * marks that identify the object. A hole is a fill AND a solid tone.
   */
  function hole(k, pts, sd, curve) {
    k.R(pts, "cInk", sd, 1, curve !== false);
    k.T(pts, "solid", 0.9, { fill: "cInk", s: sd, curve: curve !== false });
  }

  /*
   * CONTACT, not a pooled ellipse.
   *
   * A soft grey ellipse under every object is the most stock-vector thing a
   * sheet can do, and the pen references share one table rule instead. These
   * get both: a tight sliver of shade where the thing actually touches, and
   * the sheet's own ground line, which reaches the frame and is the same
   * height under all five.
   */
  /*
   * THE TABLE RULE, AND HOW WIDE IT IS ALLOWED TO BE.
   *
   * `k.ground()` runs the full width of the tile, which is right on a sheet
   * where several objects share one table and wrong on a sheet of specimens.
   * Every subject here measured 98 units wide against a mug 47 wide and a
   * stapler 58 wide — the RULE was the bounding box, and bbox is what the
   * fit uses, so all five rendered at under half the size they should and
   * came back looking thin and bare.
   *
   * This is the third time this session: a subject is fitted to its own
   * bounding box, so anything that runs wider than the subject takes the
   * drawing down with it. Pass the width.
   */
  const table = (k, w) =>
    k.M([[CX - w, GND], [CX + w, GND]], k.DET * 1.1, { curve: false });

  function contact(k, cx, w, o) {
    const e = o || {};
    k.R(ell(cx + w * 0.16, GND + (e.dy || 0.4), w, e.h || 1.9), "cWash",
        e.sd == null ? 0 : e.sd, 1, true);
  }

  /* ── 1 · the mug ──────────────────────────────────────────────────── */
  /*
   * The lathe, at its simplest, plus the one part that is not turned.
   *
   * The handle is the whole identification and it is a RIBBON — two curves
   * and two ends with a HOLE through it — never a single stroke. Drawn as one
   * line it reads as a wire; drawn as a solid loop with no hole it reads as
   * an ear. It also has to bow WIDER than the belly it springs from, or the
   * eye cannot tell it from a shadow on the side.
   */
  function mug(k) {
    /*
     * REJECTED AS "TOO SCRAPPY" A SECOND TIME, AND THE CAUSE WAS NOT DETAIL.
     *
     * The mug stood 36 units tall in a tile that gives it 80, because the
     * STEAM was 34 units tall — as tall as the mug itself. A subject is
     * fitted to its own bounding box, so an appendage that matches the body
     * for height halves the body's size on the page. Everything then reads
     * thin, because it IS small.
     *
     * Two rules came out of it, and they are the sheet's now:
     *   - the BODY spans the tile, and an appendage is a fraction of it
     *   - a part authored "behind" another is only hidden if something fills
     *     the thing in front. `?outline=1` drops every fill, so the handle's
     *     back half ran straight across the mug. It is CUT, not covered.
     */
    const prof = [[38, 20.4], [44, 20.0], [60, 19.4], [76, 18.6], [GND - 0.6, 18.2]];
    const TW = 27;
    contact(k, CX, 19);

    /*
     * The handle, a ribbon with a hole, bowing well clear of the belly. It is
     * authored first so the body's fill covers the join — and then CUT by
     * the body's silhouette, so the join survives with the colour off too.
     */
    const ho = [], hi = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, a = lerp(-84, 84, t) * RAD;
      ho.push([CX + 14.5 + Math.cos(a) * 19.5, 60 + Math.sin(a) * 14.5]);
      hi.push([CX + 14.5 + Math.cos(a) * 12.0, 60 + Math.sin(a) * 8.0]);
    }
    const handle = ho.concat(hi.slice().reverse());
    k.R(handle, "cCeram", 1, 0.92, true);
    /* the handle's own turn, away from the same upper-left light. Filled at
       0.92 of the body's colour and nothing else, it was the same value as
       the wall behind it and read as a flat ring stuck on the side. */
    k.R(ho.slice(8).concat(hi.slice(8).reverse()), "cCeram", 2, 0.76, true);

    const sil = vessel(k, prof, "cCeram", 4, { crescent: 0.40, gap: 1.05 });
    /* the handle's outline, minus whatever the mug stands in front of */
    k.cut(handle, [sil], true).forEach((run, i) =>
      k.M(run, k.OUT, { s: 200 + i }));

    /*
     * THE OPENING IS ONE STRONG ELLIPSE AND ONE WEAK ONE — not five.
     *
     * The rim previously carried the mouth, an inner lip, the coffee's edge,
     * a crema ring and a highlight arc: five concentric ellipses of nearly
     * equal weight, which is the same fault that once turned a pewter plate
     * into coiled rope. Concentric lines only read as depth when their
     * weights step.
     */
    /*
      * THE COFFEE SITS WELL DOWN THE BORE, NOT LEVEL WITH THE RIM.
      *
      * Filled to within two units of the lip, its ellipse ran inside the
      * mouth's for its whole length and the two read as one doubled rim —
      * four arcs inside thirteen units of page. Dropping the surface eight
      * units opens the INNER WALL between them, which is the only thing in
      * the drawing that says the mug is hollow rather than capped.
      */
    k.R(ell(CX, 38, 18.4, 18.4 * Q), "cShade", 8, 1, true);
    k.R(ell(CX, 46, 15.0, 15.0 * Q), "cCoffee", 9, 1, true);
    k.M(ell(CX, 46, 15.0, 15.0 * Q), k.DET * 1.15, { closed: true });
    /* the far inner wall, between the lip and the coffee */
    k.M(back(42, 17.6, 20), k.TEX * 1.3);
    /* the light a window throws across the coffee, and two bubbles crowded
       against the far wall where the surface is still */
    k.M(ell(CX + 2, 47.0, 9.4, 9.4 * Q, 20, 14, 86), k.TEX * 1.6);
    [[-5.6, -1.2, 1.6], [-2.0, -1.9, 1.0]].forEach(([dx, dy, r], i) =>
      k.M(ell(CX + dx, 46 + dy, r, r * 0.62), k.TEX, { closed: true, s: 70 + i }));

    /* a stripe: a region between two NEAR-HALF arcs, because a band on an
       opaque body is only ever its near half */
    const y0 = 52, y1 = 61;
    const st = front(y0, radAt(prof, y0), 24).concat(front(y1, radAt(prof, y1), 24).reverse());
    k.R(st, "cStripe", 12, 1, true);
    k.R(crescent([[y0, radAt(prof, y0)], [y1, radAt(prof, y1)]], 0.34), "cStripe", 13, 0.74, true);
    band(k, prof, y0, k.DET);
    band(k, prof, y1, k.DET);

    /*
     * THROWING RINGS, GROUPED — not evenly spaced.
     *
     * Five parallel lines at one pitch down the lower body is corrugation,
     * and corrugation is what made this read as a paper cup. Potter's rings
     * come in a cluster where the wheel ran, and then nothing.
     */
    [69.5, 72.0].forEach((y, i) => band(k, prof, y, k.TEX * (i ? 1.5 : 1.0)));
    /* the foot: one incised line, so the mug has a base rather than fading
       into the table */
    band(k, prof, GND - 4.2, k.TEX * 1.8, null, 0.99);

    /*
     * STEAM — a THIRD of the mug's height, not all of it.
     *
     * Three curls, each a different height and period; matched, they read as
     * a decal. They start above the far lip: begun at the rim's centre
     * height they were inside the ellipse, and three lines ran down over the
     * coffee. Steam leaves a cup, it does not stand in it.
     */
    [[-7.0, 15, 2.2, 3.4], [-0.5, 19, 2.6, 2.6], [6.0, 13, 1.9, 4.1]]
      .forEach(([dx, h, amp, f], i) => {
        const s = [];
        for (let j = 0; j <= 16; j++) {
          const t = j / 16;
          s.push([CX + dx + Math.sin(t * f + i * 1.7) * (amp + t * amp), 33 - t * h]);
        }
        k.M(s, k.TEX * 1.4, { taper: [1.1, 0.15], s: 80 + i });
      });

    /* the handle's inner seam, and the swellings where it was luted on */
    k.cut(hi.slice(2, 23), [sil], false).forEach((run, i) =>
      k.M(run, k.TEX * 1.2, { s: 210 + i }));
    [[1, 1], [23, -1]].forEach(([j, sg], i) =>
      k.M([[ho[j][0] - 2.4 * sg, ho[j][1]], [hi[j][0] + 0.4 * sg, hi[j][1]]],
          k.TEX * 1.4, { curve: false, s: 90 + i }));
    /* the glaze highlight down the lit side */
    k.M([[CX - 15.2, 46], [CX - 16.6, 55], [CX - 16.2, 63]], k.TEX * 1.4);

    table(k, TW);
  }

  /* ── 2 · the twin-bell alarm clock ────────────────────────────────── */
  /*
   * The FACE, and nothing else, is what makes this a clock. Everything in the
   * drawing budget goes into the dial — twelve ticks of two lengths, two
   * hands of different weight and length, a centre boss — because a plain
   * disc between two bells is a handbag.
   *
   * The hands must NOT be at a symmetrical time. At ten-past-ten they make a
   * V and the clock reads as a logo; set them somewhere that looks observed.
   */
  function clock(k) {
    const TW = 33;   /* how far the table rule reaches: the SUBJECT's width, not the tile's */
    const cy = 45, R = 23;
    contact(k, CX, 19, { h: 1.7 });
    /*
     * THE CASE, AS A CUTTER, BEFORE ANYTHING IS DRAWN BEHIND IT.
     *
     * "Behind" is not a property a mark has here: every mark renders after
     * every region, and `?outline=1` drops the regions entirely. The bells
     * were authored first so the case's fill would cover their feet — and
     * with the colour off there was no fill, so each bell's far rim and its
     * hatching ran straight across the dial and the two of them read as
     * open mouths on either side of the face. A thing behind another thing
     * is CUT by it.
     */
    const caseC = ell(CX, cy, R, R);

    /* the bells. Each is a sphere, so each gets a crescent — and they are NOT
       mirror images: the light comes from one place, so both turn the same
       way */
    [[-20, 1], [20, -1]].forEach(([dx, sg], i) => {
      const bx = CX + dx, by = 16.5, br = 11.0;
      const b = ell(bx, by, br, br * 0.96);
      k.R(b, "cChrome", 1 + i * 4, 1, true);
      const cr = [];
      for (let j = 0; j <= 26; j++) {
        const a = -44 + (j / 26) * 190;
        cr.push(ell(bx, by, br * 0.99, br * 0.95, 1, a, a)[0]);
      }
      for (let j = 26; j >= 0; j--) {
        const a = -44 + (j / 26) * 190;
        /*
         * A WIDE TURN, OR THE BELL IS A RING.
         *
         * Pulled in to only 0.44 of the radius, the crescent was a sliver
         * that carried four hatch strokes, and two domes of polished metal
         * came back as two hollow circles stuck on the case like ears. The
         * terminator on a sphere lit from one side runs most of the way
         * across it; anything less reads as an outline with a smudge.
         */
        const t = j / 26, g = lerp(1, 0.22, Math.pow(Math.sin(t * Math.PI), 0.55));
        const q = ell(bx, by, br * g, br * 0.96 * g, 1, a, a)[0];
        cr.push([q[0] + (1 - g) * br * 0.46, q[1] + (1 - g) * br * 0.26]);
      }
      k.R(cr, "cChrome", 2 + i * 4, 0.72, true);
      /* HATCH, not ribs. `ribs` follows the spans of the shape it is
         handed, and a crescent's spans pinch to nothing at both ends — so
         the lines converged under each bell into a dense black wedge that
         read as an open mouth. A body wants ribs; a crescent wants a ruling
         laid across it */
      k.T(cr, "hatch", 0.38, { fill: "cInk", s: 2 + i * 4, curve: true,
                               gap: 1.3, angle: 62 });
      /* the highlight the window leaves on the polished crown, up and left */
      k.M(ell(bx - br * 0.34, by - br * 0.40, br * 0.26, br * 0.20, 14, 150, 330),
          k.TEX * 1.3, { s: 310 + i });
      k.cut(b, [caseC], true).forEach((run, j) =>
        k.M(run, k.OUT, { s: 300 + i * 10 + j }));
      /* the stud on top is the one mark that stops a sphere reading as a
         balloon. The RIM it used to have — a back-half arc below centre —
         read as an open mouth: a bell seen from outside has no visible rim */
      k.M([[bx - 1.6, by - br - 1.4], [bx + 1.6, by - br - 1.4]], k.DET * 1.5);
      void sg;
    });
    /* the hammer, between them, with its stem running down behind the case */
    /* the stem STARTS at the top of the case. Started inside it, the mark
       drew straight down across the dial — marks render after every region,
       so authoring order cannot hide a line behind a fill added later */
    /* SHORT. A long bent wire with a bead on the end is an antenna, and the
       clock came out an insect; the hammer on a twin-bell sits low between
       the domes and barely clears the case */
    k.M([[CX, cy - R - 0.5], [CX - 0.5, 15.5]], k.DET * 1.6,
        { taper: [1.4, 0.9], curve: false });
    k.R(ell(CX - 0.8, 13.6, 3.0, 2.6), "cChrome", 9, 1, true);
    k.M(ell(CX - 0.8, 13.6, 3.0, 2.6), k.DET * 1.2, { closed: true });

    /* the legs, also behind the case, splayed so the clock stands */
    [-1, 1].forEach((sg, i) => {
      /* short and thick. Thin legs twice this long made the clock an insect */
      k.cut([[CX + sg * 12, cy + R * 0.80], [CX + sg * 18.0, GND - 2.6]],
            [caseC], false)
        .forEach((run, j) => k.M(run, k.OUT * 1.45,
                                 { taper: [1.3, 1.0], s: 20 + i * 4 + j }));
      const f = [[CX + sg * 13.6, GND - 3.0], [CX + sg * 23.0, GND - 3.0],
                 [CX + sg * 22.4, GND], [CX + sg * 14.2, GND]];
      k.R(f, "cChrome", 21 + i, 0.86, false);
      k.M(f, k.DET * 1.3, { closed: true, curve: false });
    });

    /* the case: a bezel ring and the dial inside it. TWO concentric curves,
       not five — nested rings a few units apart cross each other under the
       hand's own wander and the whole thing reads as coiled rope */
    k.R(ell(CX, cy, R, R), "cRed", 30, 1, true);
    /* the case has depth, shown as a crescent of its own flank on the right */
    const fl = [];
    for (let j = 0; j <= 24; j++) {
      const a = -58 + (j / 24) * 150;
      fl.push(ell(CX, cy, R, R, 1, a, a)[0]);
    }
    for (let j = 24; j >= 0; j--) {
      const a = -58 + (j / 24) * 150;
      const t = j / 24, g = lerp(1, 0.86, Math.pow(Math.sin(t * Math.PI), 0.6));
      fl.push(ell(CX, cy, R * g, R * g, 1, a, a)[0]);
    }
    k.R(fl, "cRed", 31, 0.70, true);
    k.T(fl, "ribs", 0.36, { fill: "cInk", s: 31, curve: true, gap: 1.6 });
    k.M(ell(CX, cy, R, R), k.OUT, { closed: true });

    const DR = R * 0.84;
    k.R(ell(CX, cy, DR, DR), "cDial", 34, 1, true);
    k.M(ell(CX, cy, DR, DR), k.DET * 1.2, { closed: true });

    /* the dial: twelve ticks, four of them long. This is the drawing */
    for (let i = 0; i < 12; i++) {
      const a = -90 + i * 30;
      const long = i % 3 === 0;
      k.M([ell(CX, cy, DR * (long ? 0.74 : 0.82), DR * (long ? 0.74 : 0.82), 1, a, a)[0],
           ell(CX, cy, DR * 0.92, DR * 0.92, 1, a, a)[0]],
          long ? k.DET * 1.5 : k.TEX * 1.5, { s: 40 + i, curve: false });
    }
    /* the hands. NOT ten-past-ten — a symmetrical time reads as a logo */
    const hand = (deg, len, w, tail) => {
      const a = (deg - 90) * RAD;
      k.M([[CX - Math.cos(a) * (tail || 3), cy - Math.sin(a) * (tail || 3)],
           [CX + Math.cos(a) * len, cy + Math.sin(a) * len]], w,
          { taper: [1.5, 0.55], curve: false });
    };
    hand(58, DR * 0.52, k.OUT * 0.8);          /* the hour hand: short, fat */
    hand(196, DR * 0.80, k.DET * 1.25);        /* the minute hand: long, thin */
    k.R(ell(CX, cy, 2.2, 2.2), "cInk", 60, 1, true);
    k.T(ell(CX, cy, 2.2, 2.2), "solid", 0.9, { fill: "cInk", s: 60, curve: true });

    /*
     * THE DIAL IS THE DRAWING, and twelve ticks is not a dial.
     *
     * Sixty minute marks and four numerals are most of the fidelity on this
     * sheet, and they are what a clock face actually HAS. Twelve strokes and
     * two hands is a clock icon; it reads at twenty pixels and falls apart at
     * two hundred, which is the size anyone will actually look at it.
     */
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const a = -90 + i * 6;
      k.M([ell(CX, cy, DR * 0.855, DR * 0.855, 1, a, a)[0],
           ell(CX, cy, DR * 0.915, DR * 0.915, 1, a, a)[0]],
          k.TEX * 0.95, { s: 70 + i, curve: false });
    }
    /*
     * The numerals, drawn by the same hand as everything else — a typeset
     * label in a drawing where every line wobbles is a sticker.
     *
     * `Letter`'s `sc` is a multiple of its own 3 x 5 box, NOT a height in
     * tile units: at sc 5 a two-digit numeral is 37 units wide and 25 tall,
     * which is bigger than the dial it sits on. Width is `Letter.width(str,
     * 1)` x sc and cap height is 5 x sc, and `y` is the TOP of the cap, not
     * the baseline. Measure it before placing it.
     */
    [["12", 0], ["3", 90], ["6", 180], ["9", 270]].forEach(([n, deg]) => {
      const a = (deg - 90) * RAD, rr = DR * 0.60;
      Letter.write(k, n, CX + Math.cos(a) * rr, cy + Math.sin(a) * rr - 1.75,
                   0.70, k.DET * 1.0, { align: "centre" });
    });
    /* a maker's name under the twelve, small enough to be a texture */
    Letter.write(k, "RELIANCE", CX, cy - DR * 0.42, 0.42, k.TEX * 1.2,
                 { align: "centre" });
    /* the second hand: thin, long, with a counterweight past the boss — and
       set nowhere near the other two */
    const sa = (322 - 90) * RAD;
    k.M([[CX - Math.cos(sa) * 6.5, cy - Math.sin(sa) * 6.5],
         [CX + Math.cos(sa) * DR * 0.90, cy + Math.sin(sa) * DR * 0.90]],
        k.TEX * 1.7, { curve: false });
    /* the alarm hand: stubby, blunt, pointing at the hour it was set for */
    const aa = (138 - 90) * RAD;
    k.M([[CX, cy], [CX + Math.cos(aa) * DR * 0.40, cy + Math.sin(aa) * DR * 0.40]],
        k.DET * 1.5, { curve: false, taper: [1.0, 1.4] });
    /* the bezel's knurl, all the way round */
    for (let i = 0; i < 56; i++) {
      const a = (i / 56) * 360;
      k.M([ell(CX, cy, R * 0.90, R * 0.90, 1, a, a)[0],
           ell(CX, cy, R * 0.985, R * 0.985, 1, a, a)[0]],
          k.TEX * 0.8, { s: 140 + i, curve: false });
    }
    /* two winding keys behind the case, at its TOP corners. Placed by
       mirroring one angle about 180 they both came out on the LEFT, one of
       them hanging off the bottom of the case like a wart */
    [232, 308].forEach((deg, i) => {
      const a = deg * RAD;
      const px = CX + Math.cos(a) * R * 0.96, py = cy + Math.sin(a) * R * 0.96;
      k.M([[px, py], [px + Math.cos(a) * 4.6, py + Math.sin(a) * 4.6]],
          k.DET * 1.3, { curve: false, s: 210 + i });
      k.R(ell(px + Math.cos(a) * 6.4, py + Math.sin(a) * 6.4, 2.6, 2.6), "cChrome",
          212 + i, 0.9, true);
      k.M(ell(px + Math.cos(a) * 6.4, py + Math.sin(a) * 6.4, 2.6, 2.6),
          k.DET * 1.1, { closed: true, s: 214 + i });
    });

    table(k, TW);
  }

  /* ── 3 · the toaster ──────────────────────────────────────────────── */
  /*
   * The first of the two extrusions. A toaster is a profile pushed back, and
   * everything that identifies it is on a face: the SLOT on top, the lever in
   * its track, the browning dial.
   *
   * The slot is the one mark nothing else in this set has, so it is a HOLE —
   * region and solid tone both — and it is authored on the TOP face, which is
   * the parallelogram the offset creates. Put it on the front and the whole
   * thing is a radio.
   */
  function toaster(k) {
    const TW = 25;   /* how far the table rule reaches: the SUBJECT's width, not the tile's */
    const x0 = CX - 21, x1 = CX + 21, y0 = 50, y1 = GND - 3;
    contact(k, CX + 2, 23, { h: 1.6 });
    const D = 21;      /* deep enough that the top face is a FACE */
    const off = [OFF[0] * D, OFF[1] * D];

    /* the body: a rounded rect with a BOWED top, because a toaster's shell is
       a single pressing. Flat-topped it is a brick */
    const sil = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      sil.push([lerp(x0, x1, t), y0 - Math.sin(t * Math.PI) * 3.4]);
    }
    sil.push([x1, y1 - 3]); sil.push([x1 - 2.6, y1]);
    sil.push([x0 + 2.6, y1]); sil.push([x0, y1 - 3]);
    solidFromSil(k, sil, off, "cChrome", 1, { curve: true });

    /* the SLOT, on the top face. The top face is the band between the body's
       crown and that crown shifted by the offset */
    const slot = [];
    /* CENTRED on the top face and inset from both ends. Run from 0.34 to
       0.62 of the offset it straddled the crown and read as a shadow under
       the bread rather than as an opening in a surface */
    for (let i = 3; i <= 15; i++) {
      const t = i / 18;
      slot.push([lerp(x0, x1, t) + off[0] * 0.40,
                 y0 - Math.sin(t * Math.PI) * 3.4 + off[1] * 0.40]);
    }
    for (let i = 15; i >= 3; i--) {
      const t = i / 18;
      slot.push([lerp(x0, x1, t) + off[0] * 0.60,
                 y0 - Math.sin(t * Math.PI) * 3.4 + off[1] * 0.60]);
    }
    hole(k, slot, 200);
    /* a slice of bread standing in it, which is what a toaster is FOR */
    /*
     * A SLICE, NOT A CROWN.
     *
     * Eighteen units wide and standing thirteen proud of the shell with a
     * domed top, the bread read as the crown of a fedora — and the dark slot
     * beneath it finished the hat off as a brim. A slice waiting in a
     * toaster shows a hand's breadth of itself, square-shouldered, and it is
     * drawn LIGHTER than the machine: it is not the product.
     */
    const bx = CX + off[0] * 0.48 - 1, by = y0 + off[1] * 0.48 - 1.4;
    const br = [[bx - 6.5, by], [bx - 6.5, by - 4.2],
                [bx - 4.6, by - 6.0], [bx + 4.6, by - 6.0],
                [bx + 6.5, by - 4.2], [bx + 6.5, by]];
    k.R(br, "cBread", 210, 1, true);
    k.M(br, k.DET * 1.5, { closed: true });
    k.M([[bx - 6.5, by - 1.2], [bx + 6.5, by - 1.2]], k.TEX * 1.2, { curve: false });

    /* the lever in its track, and the browning dial — both on the FRONT, and
       both drawn as line as well as fill so they survive outline mode */
    const tx = x1 - 6.4;
    hole(k, [[tx - 0.8, y0 + 6], [tx + 0.8, y0 + 6],
             [tx + 0.8, y0 + 19], [tx - 0.8, y0 + 19]], 220, false);
    const lv = roundRect(tx - 5.2, y0 + 14.5, tx + 5.2, y0 + 21.0, 2.2);
    k.R(lv, "cNavy", 230, 1, false);
    k.M(lv, k.DET * 1.4, { closed: true, curve: false });

    const dx2 = x0 + 11, dy2 = y1 - 9.5;
    k.R(ell(dx2, dy2, 6.2, 6.2), "cNavy", 240, 1, true);
    k.M(ell(dx2, dy2, 6.2, 6.2), k.DET * 1.4, { closed: true });
    k.M([[dx2, dy2], [dx2 - 1.6, dy2 - 5.6]], k.DET * 1.2, { curve: false });
    for (let i = 0; i < 5; i++) {
      const a = -150 + i * 30;
      k.M([ell(dx2, dy2, 7.6, 7.6, 1, a, a)[0], ell(dx2, dy2, 9.4, 9.4, 1, a, a)[0]],
          k.TEX * 1.4, { s: 250 + i, curve: false });
    }
    /* the seam between shell and crumb tray, and two feet */
    k.M([[x0 + 1.6, y1 - 6.0], [x1 - 1.6, y1 - 6.0]], k.DET * 0.9, { curve: false });
    [[x0 + 5, 1], [x1 - 5, -1]].forEach(([fx, sg], i) => {
      k.M([[fx - 2.6 * sg, y1], [fx + 2.6 * sg, y1], [fx + 2.2 * sg, y1 + 2.4],
           [fx - 2.2 * sg, y1 + 2.4]], k.DET, { closed: true, curve: false, s: 260 + i });
    });

    /*
     * The controls were a dial and a lever. A toaster has a FLANK, and that
     * flank is where a product puts its louvres, its badge and its screws —
     * the three things that say manufactured rather than modelled.
     */
    /* the louvres, on the right flank, following the offset so they lie IN
       the face rather than across it */
    for (let i = 0; i < 7; i++) {
      const t = 0.18 + i * 0.105;
      const ax = x1 + off[0] * 0.18, ay = lerp(y0 + 4, y1 - 9, t) + off[1] * 0.18;
      k.M([[ax, ay], [ax + off[0] * 0.66, ay + off[1] * 0.66]],
          k.TEX * 1.2, { curve: false, s: 300 + i });
    }
    /* the badge, lettered by the same hand */
    /* ABOVE the dial, not across it. Set at 0.58 and centred on the shell it
       ran straight over the browning dial and neither could be read. */
    Letter.write(k, "SUNBEAM", CX + 1, y1 - 22.0, 0.48, k.TEX * 1.4, { align: "centre" });
    k.M([[CX - 8, y1 - 18.4], [CX + 10, y1 - 18.4]], k.TEX * 1.1, { curve: false });
    /* the dial's own numbers: light at one end, dark at the other */
    Letter.write(k, "1", dx2 - 10.8, dy2 - 1.2, 0.46, k.TEX * 1.2);
    Letter.write(k, "6", dx2 + 9.2, dy2 - 1.2, 0.46, k.TEX * 1.2);
    /* the lever's grip ribs */
    for (let i = 0; i < 3; i++)
      k.M([[tx - 3.6 + i * 3.6, y0 + 16.0], [tx - 3.6 + i * 3.6, y0 + 19.6]],
          k.TEX * 1.1, { curve: false, s: 320 + i });
    /* four screws round the shell, which is how the two pressings are held */
    [[x0 + 4.4, y1 - 3.2], [x1 - 4.4, y1 - 3.2],
     [x0 + 4.4, y0 + 7.0], [x1 - 4.4, y0 + 7.0]].forEach(([sx, sy], i) => {
      k.M(ell(sx, sy, 1.5, 1.5), k.TEX * 1.3, { closed: true, s: 330 + i });
      k.M([[sx - 1.1, sy], [sx + 1.1, sy]], k.TEX * 1.2, { curve: false, s: 336 + i });
    });
    /* the crumb tray's finger pull */
    k.M([[CX - 4, y1 - 3.0], [CX + 4, y1 - 3.0], [CX + 3.2, y1 - 1.2],
         [CX - 3.2, y1 - 1.2]], k.TEX * 1.4, { closed: true, curve: false });
    /* a chrome reflection: one band down the front, which is what makes a
       grey box read as polished metal */
    /* hard against the left edge, clear of the dial it used to cross */
    k.M([[x0 + 3.0, y0 + 3.0], [x0 + 2.2, y1 - 8.0]], k.TEX * 1.5);
    k.M([[x0 + 5.6, y0 + 3.6], [x0 + 4.8, y1 - 8.4]], k.TEX * 0.9);
    /* the cord, off the back left */
    /* SHORT. Run seventeen units past the shell it was the widest thing in
       the toaster's own drawing, and the fit uses the bounding box — so a
       piece of flex was setting how big the toaster got to be. */
    k.M([[x0 + 1.5, y1 - 4.0], [x0 - 4, y1 - 1.5], [x0 - 7.5, y1 - 2.6]],
        k.TEX * 1.6);

    table(k, TW);
  }

  /* ── 4 · the table lamp ───────────────────────────────────────────── */
  /*
   * A lathe again, but the opposite shape to the mug: a cone that widens
   * DOWNWARD, standing on a turned stem. Drawn with the mug's own profile
   * logic and nothing else it would be a mug upside down, so two things carry
   * it — the shade's pleats, which are `ribs` across the whole shade and not
   * just its turn, and the fact that we can see UP INSIDE it.
   *
   * The eye here sits above the shade's bottom rim and below its top, which
   * is where anyone sitting at a desk actually is: the bottom rim is a full
   * ellipse with the shade's dark interior showing through its far half, and
   * the top is a near-half arc only.
   */
  function lamp(k) {
    /*
     * REBUILT AFTER A SECOND "SCRAPPY".
     *
     * Three faults, and none of them was a shortage of marks:
     *
     *  1. THE CORD WAS THE WIDEST THING IN THE LAMP. It ran to CX+33 with a
     *     plug on the end, against a shade half-width of 22 — so the bbox,
     *     and therefore the fit, was set by a piece of flex. The lamp drew at
     *     two-thirds size and read thin. A trailing cord is allowed to leave
     *     the drawing; it is not allowed to be the drawing's widest part.
     *  2. THE PLEATS RAN OUTSIDE THE SHADE. `ribs` rules every scanline of
     *     the shape it is handed, and the shape handed over included the
     *     back arc of the top rim — so rows above the rim got spans, and a
     *     fan of lines burst out of the crown like a dandelion. Tone gets the
     *     CONE, not the silhouette.
     *  3. THE HEM WAS FOUR CONCENTRIC ELLIPSES — rim, two binding tapes and
     *     the far inner wall, all within four units and all near the same
     *     weight. Concentric lines read as depth only when their weights
     *     step; at equal weight they read as rope. Two now, and they differ.
     */
    const TOPY = 24, TOPR = 12.0, BOTY = 52, BOTR = 23.5;
    const TW = 20;
    contact(k, CX, 15, { h: 1.8 });

    /* the stem and base first, so the shade covers where the stem enters */
    const stem = [[BOTY - 2, 2.6], [60, 2.4], [64, 3.8], [68, 2.8],
                  [72, 4.2], [77, 9.4], [80, 13.0], [GND - 1, 13.4]];
    vessel(k, stem, "cBrass", 2, { open: false, crescent: 0.40, gap: 2.4 });

    /*
     * THE CONE — the shade's own two sides, with no rim arc on either end.
     * This is the shape the pleats are ruled across; the silhouette, which
     * does carry the back of the crown, is built from it afterwards.
     */
    const L = [], Rr = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const r = lerp(TOPR, BOTR, t) - Math.sin(t * Math.PI) * 1.8;
      const y = lerp(TOPY, BOTY, t);
      L.push([CX - r, y]); Rr.push([CX + r, y]);
    }
    const cone = Rr.concat(front(BOTY, BOTR, 24).reverse()).concat(L.slice().reverse());
    const shade = cone.concat(back(TOPY, TOPR, 18));

    /*
     * NOTHING IS SEEN UP INSIDE THE SHADE, AND THE HEM IS A NEAR HALF.
     *
     * `Q` puts the eye ABOVE every horizontal circle on this sheet — that is
     * what makes the crown show its top disc and the mug show its mouth. The
     * same eye cannot also look UP into the shade. Drawn with a lit interior
     * and a full hem ellipse, the far arc of the hem swung out in front of
     * the shade it belongs to and the lamp read as a flying saucer on a
     * stick. An opaque body shows the near half of its rings; only an open
     * mouth above the eye shows both.
     */

    k.R(shade, "cLinen", 8, 1, true);
    /* the turn, as a darker fill under the pleats — a fabric shade is the one
       thing here whose texture is its MATERIAL, so the pleats run edge to
       edge and the light is carried underneath them instead */
    k.R(Rr.concat(Rr.map(([x, y], i) => [lerp(x, L[i][0], 0.44), y]).reverse()),
        "cLinen", 9, 0.76, true);
    /* a cone's spans narrow towards the crown, so a gap tuned on the hem
       packs solid at the top. Opened until the NARROW end still reads */
    k.T(cone, "ribs", 0.36, { fill: "cInk", s: 8, curve: true, gap: 3.4 });

    k.M(Rr, k.OUT); k.M(L, k.OUT);
    k.M(back(TOPY, TOPR, 20), k.DET * 1.3);
    /* the hem, heavy, and the binding tape above it light — a weight step,
       because two concentric lines of equal weight read as rope */
    k.M(front(BOTY, BOTR, 28), k.OUT * 0.9);

    /*
     * THE FINIAL: a turned knob on a neck, not a ring on a wire.
     *
     * It was an open circle floating above a burst of radiating lines — the
     * burst being the pleats escaping the crown, fault 2 above — and between
     * them they read as a dandelion clock rather than as the brass nut that
     * holds a shade down.
     */
    k.M([[CX, TOPY - 0.6], [CX, TOPY - 2.6]], k.DET * 1.2, { curve: false });
    const knob = [[TOPY - 2.6, 1.2], [TOPY - 3.8, 2.7], [TOPY - 5.8, 2.6],
                  [TOPY - 7.0, 1.0]];
    k.R(body(smooth(knob, 4), CX, false), "cBrass", 20, 1, true);
    k.M(body(smooth(knob, 4), CX, false), k.DET * 1.15, { closed: true });

    /* the harp: the wire the shade sits on, caught either side of the stem */
    [-1, 1].forEach((sg, i) =>
      k.M([[CX + sg * 2.6, BOTY + 3.4], [CX + sg * 4.6, BOTY + 1.4]],
          k.TEX * 1.3, { curve: false, s: 30 + i }));
    /* the switch, on the stem below the shade */
    k.R(ell(CX + 3.6, 58, 2.1, 2.5), "cBrass", 34, 0.86, true);
    k.M(ell(CX + 3.6, 58, 2.1, 2.5), k.TEX * 1.5, { closed: true });
    /* the turned rings on the base, and the felt it stands on */
    [72, 78, 81.5].forEach((y, i) => band(k, stem, y, k.TEX * (i === 1 ? 1.5 : 1.1)));
    k.M(front(GND - 1.8, 12.8, 22), k.TEX * 1.2);

    /* the cord — leaving to the LEFT, and stopping short of the hem it hangs
       under, so the lamp and not the flex sets the bounding box */
    k.M([[CX - 11, GND - 1.4], [CX - 15, GND - 0.4], [CX - 19, GND - 1.8]],
        k.TEX * 1.5);

    table(k, TW);
  }

  /* ── 5 · the stapler ──────────────────────────────────────────────── */
  /*
   * The second extrusion, and the only thing here that is HINGED. A stapler
   * is read from its wedge: a long arm that tapers to a nose, a base that
   * runs past it at both ends, and the gap between them at the front. Close
   * that gap and it is a shoe.
   *
   * It is also the one object low enough that we look down ON it rather than
   * at it — which is exactly what the shared offset already does, so nothing
   * special is needed for it beyond a shallower silhouette.
   */
  function stapler(k) {
    const TW = 30;   /* how far the table rule reaches: the SUBJECT's width, not the tile's */
    const D = 16, off = [OFF[0] * D, OFF[1] * D];
    contact(k, CX, 24, { h: 1.5, dy: 0.2 });

    /* the base plate, first and lowest */
    /*
     * AUTHORED BACK TO FRONT, AND CUT BY WHAT STANDS IN FRONT.
     *
     * The arm and the magazine are declared before anything is drawn,
     * because the base has to know what covers it. With fills on, the order
     * alone was enough; with `?outline=1` the three solids drew through one
     * another and the machine came apart into slabs.
     */
    const arm = [[CX - 26, GND - 27.0], [CX - 21, GND - 29.5],
                 [CX + 17, GND - 22.2], [CX + 24, GND - 19.2],
                 [CX + 24, GND - 16.0], [CX + 16, GND - 16.6],
                 [CX - 20, GND - 20.2], [CX - 26, GND - 21.4]];
    const mag = [[CX - 20, GND - 14.6], [CX + 14, GND - 10.6],
                 [CX + 14, GND - 7.0], [CX - 20, GND - 8.2]];
    const armS = arm.map((p) => [p[0] + off[0], p[1] + off[1]]);
    const magS = mag.map((p) => [p[0] + off[0] * 0.72, p[1] + off[1] * 0.72]);

    const base = [[CX - 25, GND - 7.4], [CX + 24, GND - 6.0],
                  [CX + 25.5, GND - 3.4], [CX + 23, GND - 1.6],
                  [CX - 24, GND - 2.8], [CX - 26.5, GND - 5.0]];
    solidFromSil(k, base, off, "cSteel", 1,
                 { curve: false, cut: [mag, magS, arm, armS] });
    /* the anvil: the little bright plate the staple is bent against */
    const anv = [[CX + 13, GND - 7.2], [CX + 21, GND - 6.9],
                 [CX + 21 + off[0] * 0.8, GND - 6.9 + off[1] * 0.8],
                 [CX + 13 + off[0] * 0.8, GND - 7.2 + off[1] * 0.8]];
    k.R(anv, "cChrome", 60, 1, false);
    k.M(anv, k.DET * 1.2, { closed: true, curve: false });

    /* the arm: thick at the hinge, tapering to the nose, with its own top
       face. The GAP under its front half is the whole read */
    /*
     * THE TAPER RUNS THE OTHER WAY. The first arm was a parallel bar, deepest
     * at the nose, and the whole machine read as a slab. A stapler is deepest
     * where it is hinged and thins towards the nose — that wedge, and the gap
     * that opens under it at the front, are the entire silhouette.
     */
    solidFromSil(k, arm, off, "cNavy", 100, { curve: false });
    /* the seam along the arm's flank: a stapler's shell is two mouldings */
    k.M([[CX - 23.4, GND - 25.0], [CX + 20.6, GND - 18.8]], k.TEX * 1.7, { curve: false });

    /* the hinge: a barrel at the back, joining the two, drawn as a small
       solid of its own so the arm and base are clearly ONE machine */
    /* THE HINGE SITS INSIDE THE ARM IT HINGES. Centred at CX-28 against an
       arm that ended at CX-26, the barrel stood entirely clear of the body
       and read as a wheel parked beside the machine. It belongs under the
       arm's back corner, and it is cut by it. */
    const hy = GND - 19.8;
    k.R(ell(CX - 19, hy, 5.0, 5.0), "cNavy", 200, 0.86, true);
    k.cut(ell(CX - 19, hy, 5.0, 5.0), [arm], true).forEach((run, j) =>
      k.M(run, k.DET * 1.3, { s: 600 + j }));

    /* the magazine, seen in the gap: a dark slot with the staple strip in it */
    /*
     * THE MAGAZINE IS A PART, NOT A SHADOW.
     *
     * Drawn as a dark slot in the gap it came out as a single thin black
     * line — the gap was five units high and the slot was most of it, so
     * there was nothing to see but the gap itself. A stapler's magazine is a
     * slab that STANDS ON the base with the staple strip showing along its
     * flank, and the air above it is what reads as a hinged machine.
     */
    solidFromSil(k, mag, [off[0] * 0.72, off[1] * 0.72], "cNavy", 300,
                 { curve: false, cut: [arm, armS] });
    /* the staple strip, LIGHT against it. Ticks drawn in ink over an ink
       slot are ticks nobody can see */
    const strip = [[CX - 17, GND - 13.3], [CX + 11, GND - 10.3],
                   [CX + 11, GND - 8.7], [CX - 17, GND - 11.7]];
    k.R(strip, "cChrome", 360, 1, false);
    k.M(strip, k.DET * 0.9, { closed: true, curve: false });
    for (let i = 1; i < 11; i++) {
      const t = i / 11;
      k.M([[lerp(CX - 16, CX + 10, t), lerp(GND - 13.0, GND - 10.2, t)],
           [lerp(CX - 16, CX + 10, t), lerp(GND - 11.6, GND - 8.8, t)]],
          k.TEX * 0.8, { curve: false, s: 220 + i });
    }

    /*
     * A stapler is a moulding, and a moulding has a parting line, a badge, a
     * thumb pad and screws. Without them the arm is a wedge of colour.
     */
    /* the thumb pad on the arm's top face: an inset panel with ribs */
    const pad = [[CX - 10, GND - 25.4], [CX + 6, GND - 22.6],
                 [CX + 6 + off[0] * 0.62, GND - 22.6 + off[1] * 0.62],
                 [CX - 10 + off[0] * 0.62, GND - 25.4 + off[1] * 0.62]];
    k.R(pad, "cNavy", 400, 0.88, false);
    k.M(pad, k.TEX * 1.5, { closed: true, curve: false });
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      k.M([[lerp(pad[0][0], pad[1][0], t), lerp(pad[0][1], pad[1][1], t)],
           [lerp(pad[3][0], pad[2][0], t), lerp(pad[3][1], pad[2][1], t)]],
          k.TEX * 0.7, { curve: false, s: 410 + i });
    }
    /* the badge, on the FLANK and below the parting line. Centred on the
       arm it sat across the thumb pad's ribs and neither could be read */
    /* ON ITS OWN STRIP OF FLANK. Set at GND-19.6 the name sat exactly on the
       parting line and the two struck each other out. */
    Letter.write(k, "SWINGLINE", CX + 1, GND - 20.2, 0.36, k.TEX * 1.2,
                 { align: "centre" });
    /* the hinge screw, and the pin's keeper */
    k.M(ell(CX - 19, hy, 2.6, 2.6), k.TEX * 1.3, { closed: true });
    k.M([[CX - 20.8, hy - 1.1], [CX - 17.2, hy + 1.1]], k.TEX * 1.4, { curve: false });
    /* the two staple slots cut in the anvil */
    [[-3.4], [3.4]].forEach(([d], i) =>
      k.M([[CX + 18 + d, GND - 7.1], [CX + 18 + d, GND - 5.6]], k.TEX * 1.5,
          { curve: false, s: 430 + i }));
    /* the size window in the magazine's flank — the slot that tells you how
       many staples are left */
    const win = [[CX - 8, GND - 12.4], [CX + 2, GND - 11.4],
                 [CX + 2, GND - 9.6], [CX - 8, GND - 10.6]];
    k.M(win, k.TEX * 1.3, { closed: true, curve: false });
    /* rubber feet under the base */
    [[-22], [-2], [18]].forEach(([d], i) =>
      k.M([[CX + d - 3, GND - 1.4], [CX + d + 3, GND - 1.2], [CX + d + 2.6, GND],
           [CX + d - 2.6, GND - 0.2]], k.TEX * 1.4,
          { closed: true, curve: false, s: 440 + i }));

    table(k, TW);
  }

  const BUILD = { mug, clock, toaster, lamp, stapler };
  const NAMES = {
    mug: "Coffee mug", clock: "Alarm clock", toaster: "Toaster",
    lamp: "Table lamp", stapler: "Stapler",
  };

  const out = { _keys: Object.keys(BUILD), _names: NAMES, GND, Q, OFF };
  for (const key of out._keys) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      /* no camera: the class's own instruction for round things is to author
         flat profiles on the picture plane, and the two extrusions here share
         one offset rather than a projection */
      const k = Kit.rig({ gnd: GND });
      /* a REAL separation between the three weights. The still life ran
         1.0 / 0.72 for a while — a 28% step, invisible at this stroke width,
         and every mark landed at the same apparent weight */
      k.OUT = 1.45; k.DET = 0.62; k.TEX = 0.34;
      BUILD[key](k);
      return k.done();
    });
  }
  return out;
})();
