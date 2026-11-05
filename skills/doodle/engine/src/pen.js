/*
 * PEN — the register the references are in, which this system did not have.
 *
 * Six hand-drawn pen references were put beside our still-life sheet and the
 * gap was not taste, it was structural. Three things every one of them does
 * that nothing in this repo could do:
 *
 *   1. THE PAPER IS THE OBJECT. Not one of them fills a shape with colour.
 *      Ours fill everything, so our line work only ever has to hold an
 *      outline — and an outline round a flat colour is a sticker.
 *
 *   2. TONE IS LINE. Hatch along the form, cross-hatch, a wobbled plaid, a
 *      scribble. NOT ONE of them uses a dot screen, and the dot screen is
 *      the signature of our still-life sheet. A halftone is a printing
 *      artefact; these are drawings.
 *
 *   3. THE PATTERN WRAPS. On the grid kettle and the ribbed cabinet the
 *      object is made almost entirely of pattern, and the pattern bows with
 *      the body. That bowing is the only thing saying the thing is round.
 *      A straight ruling clipped to a silhouette says the opposite.
 *
 * Point 3 needed engine work: `ribs` and `grid` in src/hand.js measure each
 * scanline across the shape and place a column at the same FRACTION of every
 * span, so the lines bow from the silhouette with nothing supplied. Points 1
 * and 2 are policy, and they live in the `ink` class in src/spec.js.
 *
 * And a fourth, which costs nothing and changes the whole page:
 *
 *   4. OBJECTS SIT ON A LINE, TOGETHER. The references put a bowl and a pot
 *      on one table line that runs off both edges of the picture. Ours each
 *      float on a private grey ellipse — the single most stock-vector thing
 *      on our sheet. A pooled shadow is banned in this class.
 *
 * Author in the tile: x right, y DOWN, table at GND.
 */
window.Pen = (function () {
  const RAD = Math.PI / 180;
  const GND = 78;
  const CX = 50;

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

  /* both of these now live in Kit — see `cut` and `ground` there. They were
     written here and moved the moment a second module in this register was
     wanted, which is the right time and not before. */
  const ground = (k, y) => k.ground(y);
  const cut = (pts, blockers, closed) => Kit.cut(pts, blockers, closed);

  /* a closed profile mirrored about the axis: [[y, r], …] top to bottom */
  function body(prof, cx) {
    const X = cx == null ? CX : cx;
    return prof.map(([y, r]) => [X + r, y])
      .concat(prof.map(([y, r]) => [X - r, y]).reverse());
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


  /*
   * A SPRIG. Leaves ALTERNATE down the stem; they do not come in matched
   * pairs. Paired at even spacing the whole thing reads as a fish bone, and
   * a dozen of them in a pot reads as a fan of fish bones — which is what
   * the first thyme in this kettle was. Real foliage is alternate, unevenly
   * spaced, and no two leaves the same length.
   */
  function sprig(k, x0, y0, x1, y1, n, scale, seed) {
    const S = scale || 1, sd = seed || 0;
    const noise = (i) => (((i + sd) * 2654435761) % 1000) / 1000;
    const stem = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      stem.push([lerp(x0, x1, t) + Math.sin(t * 2.2 + sd) * 1.8 * S, lerp(y0, y1, t)]);
    }
    k.M(stem, k.TEX * 1.35, { taper: [1.4, 0.45], s: sd });
    const a = Math.atan2(y1 - y0, x1 - x0);
    for (let i = 0; i < n; i++) {
      const t = 0.26 + (i / n) * 0.70 + (noise(i) - 0.5) * 0.07;
      const p = stem[Math.max(0, Math.min(14, Math.round(t * 14)))];
      const sgn = i % 2 ? 1 : -1;
      const th = a + sgn * (0.78 + noise(i + 3) * 0.42);
      const L = (2.6 + noise(i + 7) * 2.4) * S, W = L * 0.36;
      const tipx = p[0] + Math.cos(th) * L, tipy = p[1] + Math.sin(th) * L;
      const mx = (p[0] + tipx) / 2, my = (p[1] + tipy) / 2;
      const nx = -Math.sin(th) * W, ny = Math.cos(th) * W;
      k.M([p, [mx + nx, my + ny], [tipx, tipy], [mx - nx, my - ny], p],
          k.TEX * 1.1, { closed: true, s: sd + i * 7 });
    }
  }

  /* ── 1 · the grid kettle ──────────────────────────────────────────── */
  /*
   * The reference that forced the engine change. The kettle has no colour,
   * no shading and no outline weight hierarchy to speak of — it is a
   * silhouette and a PLAID, and the plaid is doing every bit of the work
   * that our halftone crescent was failing to do.
   *
   * Drawn with straight rulings it would be a flat grey tin. `grid` bows the
   * verticals out over the belly, so the body turns.
   */
  function kettle(k) {
    /* a BELLY. The plaid can only bow over a shape that bows — on the
       straight-sided tin this started as, `grid` and `hatch` draw the same
       picture and the primitive looks like it does not work */
    const prof = smooth([[34, 13.2], [37, 16.2], [44, 18.8], [52, 19.2],
                         [60, 17.4], [64, 15.0]]);
    const sil = body(prof);
    const CLOSED = sil.concat([sil[0]]);

    /* the plant first, so the leaves are behind the rim they come out of */
    const mouthY = 34, mouthR = 8.4;
    [[-10, -24, 5], [-4, -33, 7], [2, -37, 7], [8, -29, 6], [14, -20, 5],
     [-15, -17, 4], [-1, -27, 5], [6, -22, 4]].forEach(([dx, dy, nn], i) => {
      sprig(k, CX + dx * 0.2, mouthY + 1, CX + dx * 1.6, mouthY + dy, nn, 1.05, i * 13 + 1);
    });

    /*
     * THE PLAID. It is clipped to the body only — not to the handle and not
     * to the spout, because on the reference those two are the one place the
     * pattern is allowed to break and let the eye rest.
     */
    k.T(CLOSED, "grid", 0.42, { s: 3, curve: true, gap: 2.35 });
    k.M(sil, k.OUT, { closed: true });

    /* the mouth: a full ellipse, and the inside is the one solid on the page */
    k.T(ell(CX, mouthY, mouthR, mouthR * 0.34), "solid", 0.9,
        { fill: "cInk", s: 4, curve: true });
    k.M(ell(CX, mouthY, mouthR, mouthR * 0.34), k.DET * 1.2, { closed: true });

    /* the handle: a ribbon off the left shoulder, pattern running through it */
    const hx = [], hi = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18, a = lerp(258, 102, t) * RAD;
      hx.push([CX - 15.5 + Math.cos(a) * 13.0, 48 + Math.sin(a) * 9.6]);
      hi.push([CX - 15.5 + Math.cos(a) * 8.6, 48 + Math.sin(a) * 5.8]);
    }
    const handle = hx.concat(hi.reverse());
    k.T(handle.concat([handle[0]]), "grid", 0.38, { s: 5, curve: true, gap: 2.6 });
    k.M(handle, k.OUT * 0.82, { closed: true });

    /* the spout: it rises ABOVE the rim, which is the proportion that says
       kettle rather than jug */
    const sp = [], sb = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = lerp(CX + 16, CX + 31, t);
      const y = lerp(44, 36.5, Math.pow(t, 0.7));
      const w = lerp(5.0, 2.0, t);
      sp.push([x, y - w]); sb.push([x, y + w]);
    }
    const spout = sp.concat(sb.reverse());
    k.T(spout.concat([spout[0]]), "grid", 0.38, { s: 6, curve: true, gap: 2.6 });
    k.M(spout, k.OUT * 0.82, { closed: true });
    /* the lip, cut back: the one detail that stops a spout reading as a pipe */
    k.M([[CX + 31, 34.0], [CX + 28.6, 37.0], [CX + 31, 38.5]], k.DET);

    ground(k, 64.6);
  }

  /* ── 2 · the bowl of fruit ────────────────────────────────────────── */
  /*
   * Two things here that our still life gets wrong.
   *
   * First the hatching on the bowl FANS — it runs from the rim down to the
   * foot, following the way the bowl falls away, so it reads as the inside
   * of a curve. Our `hatch` rules in page space, which is why a hatched
   * facet in this repo always reads as a flat grey panel glued on.
   *
   * Second the fruit are drawn as ONE RUN of overlapping contours. A pear's
   * edge is also the apple's edge behind it, and the piece at the back is a
   * crescent of line and nothing else. Drawing each fruit as a closed
   * silhouette with its own outline is what makes a bowl of fruit read as a
   * bag of marbles.
   */
  function bowl(k) {
    /*
     * THREE THINGS WENT WRONG HERE AND ALL THREE ARE ABOUT SPANS.
     *
     * 1. The wall was swept to a POINT at the bottom, so every rib converged
     *    on the same couple of units and the bowl grew a solid black wedge.
     *    A bowl has a flat bottom; keep a floor under the spans and the fan
     *    stays a fan.
     * 2. The fruit sat level with the rim, so the near rim cut them at the
     *    waist and the back row was cut away entirely. A heap has to stand
     *    PROUD of the rim or there is no heap.
     * 3. Rim, back rim and the top of the ruled lens made three near-parallel
     *    curves a few units apart — the rope failure, again. The back rim is
     *    the one that goes.
     */
    const BX = 50, RY = 52.0, R = 29, RQ = 0.19;

    const rimF = ell(BX, RY, R, R * RQ, 34, 0, 180);
    /* the wall, as a profile with a FLOOR */
    const wprof = [[RY, R], [RY + 4.5, R * 0.94], [RY + 9.5, R * 0.80],
                   [RY + 14, R * 0.58], [RY + 17, R * 0.30]];
    const wallR = wprof.map(([y, r]) => [BX + r, y]);
    const wallL = wprof.map(([y, r]) => [BX - r, y]).reverse();
    const wall = wallR.concat(wallL);
    const outside = rimF.concat(wall.slice().reverse());

    /*
     * The fruit, back row first and standing well above the rim. Each is cut
     * by everything already laid down, so the pieces behind are crescents —
     * which is what makes a heap read as a heap rather than as a row.
     */
    const F = [
      [BX - 13, 35.4, 7.6, "apple"], [BX + 2, 32.8, 10.2, "pear"],
      [BX + 15, 36.6, 7.2, "apple"],
      [BX - 22, 43.0, 8.4, "pear"], [BX - 7, 42.4, 10.6, "apple"],
      [BX + 10, 43.2, 8.0, "apple"], [BX + 23, 44.4, 9.6, "pear"],
    ];
    const laid = [];
    F.forEach(([x, y, r, kind], i) => {
      const pts = [];
      for (let j = 0; j < 36; j++) {
        const a = (j / 36) * 360, sn = Math.sin(a * RAD);
        /* a pear is an apple whose lower half is pulled out and whose upper
           half is pinched: one number, two fruits */
        const w = kind === "pear" ? 1 - 0.30 * Math.max(0, -sn) : 1;
        pts.push([x + Math.cos(a * RAD) * r * w,
                  y + sn * r * (kind === "pear" ? 1.12 : 0.94)]);
      }
      cut(pts, laid.concat([outside]), true).forEach((run, n) =>
        k.M(run, k.DET * 1.2, { s: 20 + i * 4 + n }));
      for (let j = 0; j < 2; j++)
        cut([[x + r * 0.24, y - r * (0.34 - j * 0.34)],
             [x + r * 0.48, y + r * (0.10 + j * 0.24)]],
            laid.concat([outside])).forEach((run) =>
          k.M(run, k.TEX * 1.3, { s: 30 + i * 3 + j }));
      if (kind === "pear")
        cut([[x, y - r * 1.04], [x - 1.3, y - r * 1.6]], laid).forEach((run) =>
          k.M(run, k.TEX * 1.5, { s: 36 + i }));
      laid.push(pts);
    });

    /*
     * The bowl. Ruled ONLY on the lens between the near rim and the wall,
     * which is the only part of the outside we can see. `ribs` puts a line
     * at the same fraction of every span, so they splay under the rim and
     * gather at the foot without being told to.
     */
    k.T(outside.concat([outside[0]]), "ribs", 0.42, { s: 7, curve: true, gap: 3.6 });
    k.M(rimF, k.OUT);
    k.M(wall, k.OUT, { curve: true });
    /* a foot: small, heavy, the darkest thing here — a drawing in line still
       needs one place for the eye to land */
    const FY = RY + 16.6;
    const foot = [[BX - 5.4, FY], [BX + 5.4, FY], [BX + 4.4, FY + 4.4], [BX - 4.4, FY + 4.4]];
    k.T(foot, "solid", 0.9, { fill: "cInk", s: 8, curve: false });

    ground(k, FY + 4.4);
  }



  /* ── 3 · the ribbed pot ───────────────────────────────────────────── */
  /*
   * The daisy pot. The pot is nothing but a taper and a set of flutes, and
   * the flutes are `ribs` — which is the same primitive as the kettle's
   * plaid with the horizontals turned off. That is the point of building it
   * as one thing: a fluted pot, a panelled cabinet door and a basket are the
   * same drawing with a different gap.
   *
   * The daisies are a lesson of their own. Drawn as discs with petals round
   * them they read as cogs. A daisy is a HEART of solid black with five or
   * six petals that do not touch each other and do not all point outwards.
   */
  function pot(k) {
    const PX = 50, top = 50, bot = 74;
    const sil = [[PX - 16, top], [PX + 16, top], [PX + 12.4, bot], [PX - 12.4, bot]];

    /* the flowers, first, so their stems disappear into the pot's mouth */
    const B = [[-15, -30, 7.0], [-5, -40, 7.6], [7, -36, 7.2], [16, -26, 6.6],
               [1, -24, 6.0], [-20, -16, 5.4]];
    B.forEach(([dx, dy, r], i) => {
      const fx = PX + dx, fy = top + dy;
      k.M([[PX + dx * 0.2, top + 2], [PX + dx * 0.7, fy + 9], [fx, fy + r * 0.8]],
          k.TEX * 1.6, { taper: [1.2, 0.7] });
      const petals = 6;
      for (let j = 0; j < petals; j++) {
        const a = (j / petals) * 360 + i * 23;
        /* petals of unequal length, and one of them folded back — a flower
           with six matching petals is a gear */
        const L = r * (j === (i % petals) ? 0.62 : 0.86 + ((j * 7) % 3) * 0.12);
        const th = a * RAD, W = r * 0.30;
        const tipx = fx + Math.cos(th) * L, tipy = fy + Math.sin(th) * L;
        const mx = (fx + tipx) / 2, my = (fy + tipy) / 2;
        const nx = -Math.sin(th) * W, ny = Math.cos(th) * W;
        k.M([[fx, fy], [mx + nx, my + ny], [tipx, tipy], [mx - nx, my - ny], [fx, fy]],
            k.TEX * 1.25, { closed: true, s: i * 11 + j });
      }
      k.T(ell(fx, fy, r * 0.22, r * 0.22), "solid", 0.9,
          { fill: "cInk", s: 40 + i, curve: true });
    });
    /* two sprigs of foliage filling the gaps between the heads */
    sprig(k, PX + 2, top + 1, PX + 13, top - 34, 6, 1.1);
    sprig(k, PX - 2, top + 1, PX - 12, top - 36, 6, 1.0);

    k.T(sil.concat([sil[0]]), "ribs", 0.46, { s: 9, curve: false, gap: 2.4 });
    k.M(sil, k.OUT, { closed: true, curve: false });
    /* the rim, as a band — one heavy line above the flutes stops the pot
       reading as a bundle of sticks */
    k.M([[PX - 16.6, top + 4.0], [PX + 16.6, top + 4.0]], k.DET * 1.5, { curve: false });

    ground(k, bot);
  }

  /* ── 4 · two cups on a checked cloth ──────────────────────────────── */
  /*
   * Straight down onto the table — the one view in the references, and the
   * one this system has never drawn. Worth having because it removes the
   * camera argument entirely: from above, every circle is a circle.
   *
   * The cloth is the test of a different thing: a grid is only charming
   * because it is WRONG. Equal squares drawn true are graph paper. The
   * lines here are drawn one at a time by the hand with its wander on, and
   * the pitch itself is uneven, so no two squares match.
   */
  function cloth(k) {
    const X0 = 8, X1 = 92, Y0 = 16, Y1 = 84, N = 9;
    const CUPS = [[36, 62, 1], [66, 36, -1]];
    const SR = 15.5, CR = 10.2;
    /* the saucers are blockers before a single check is ruled: on a sheet
       with no fills the cloth runs straight through the china otherwise */
    const plates = CUPS.map(([cx, cy]) => ell(cx, cy, SR * 1.04, SR * 1.01, 40));
    const jit = (i) => ((i * 37) % 13) / 13 - 0.5;
    for (let i = 0; i <= N; i++) {
      const u = i / N + jit(i) * 0.035;
      cut([[lerp(X0, X1, u), Y0 - 1.5],
           [lerp(X0, X1, u) + jit(i + 5) * 2.2, Y1 + 1.5]], plates)
        .forEach((r, n) => k.M(r, k.TEX * 1.25, { curve: true, s: i * 3 + n }));
      const v = i / N + jit(i + 2) * 0.035;
      cut([[X0 - 1.5, lerp(Y0, Y1, v)],
           [X1 + 1.5, lerp(Y0, Y1, v) + jit(i + 9) * 2.2]], plates)
        .forEach((r, n) => k.M(r, k.TEX * 1.25, { curve: true, s: 100 + i * 3 + n }));
    }

    CUPS.forEach(([cx, cy, sgn], i) => {
      /* saucer, cup, and the coffee: a SOLID disc, which is the only black
         on the page and therefore the thing the eye lands on */
      /*
       * Saucer, cup, coffee — and NOT a fourth ring. Outer rim, inner rim,
       * cup rim and the coffee's edge put four concentric curves a few units
       * apart and the pair came out as two coils of rope, which is the exact
       * failure already logged against the pewter plate. The saucer's inner
       * ring goes; the ticks do its job and read as ticks, not as a curve.
       */
      k.M(ell(cx, cy, SR, SR * 0.97), k.OUT, { closed: true, s: 200 + i });
      for (let j = 0; j < 17; j++) {
        const a = (j / 17) * 360 + i * 9;
        k.M([ell(cx, cy, SR * 0.80, SR * 0.78, 1, a, a)[0],
             ell(cx, cy, SR * 0.93, SR * 0.91, 1, a, a)[0]], k.TEX, { s: 220 + j });
      }
      k.M(ell(cx, cy, CR, CR * 0.98), k.OUT * 0.9, { closed: true, s: 230 + i });
      k.T(ell(cx, cy, CR * 0.84, CR * 0.82), "solid", 0.9,
          { fill: "cInk", s: 240 + i, curve: true });
      /*
       * The handle from directly above is a small CLOSED loop standing off
       * the cup — drawn as a single arc it is one more concentric curve
       * between the cup and the saucer, which is how it disappeared.
       */
      const ha = sgn > 0 ? 200 : 20;
      const ho = [], hin = [];
      for (let j = 0; j <= 12; j++) {
        const a = (ha - 34 + (j / 12) * 68) * RAD;
        ho.push([cx + Math.cos(a) * CR * 1.32, cy + Math.sin(a) * CR * 1.28]);
        hin.push([cx + Math.cos(a) * CR * 1.04, cy + Math.sin(a) * CR * 1.01]);
      }
      k.M(ho.concat(hin.reverse()), k.DET * 1.25, { closed: true, s: 235 + i });

      /* the spoon, lying across the saucer and off it */
      const sa = (sgn > 0 ? -26 : -24) * RAD, dir = sgn > 0 ? 1 : 1;
      const sx = cx + Math.cos(sa) * SR * 1.02, sy = cy + Math.sin(sa) * SR * 1.02;
      const ex = sx + Math.cos(sa) * 21 * dir, ey = sy + Math.sin(sa) * 21 * dir;
      k.M([[sx, sy], [ex, ey]], k.DET * 1.5, { taper: [1.5, 0.7], curve: false });
      const bw = 2.5;
      k.T(ell(sx, sy, bw * 1.5, bw, 20, 0, 360).map(([x, y]) => {
        const dx = x - sx, dy = y - sy;
        return [sx + dx * Math.cos(sa) - dy * Math.sin(sa),
                sy + dx * Math.sin(sa) + dy * Math.cos(sa)];
      }), "solid", 0.9, { fill: "cInk", s: 250 + i, curve: true });

      /* the steam: two slow curves, and they must not match */
      [0, 1].forEach((n) => {
        const st = [];
        for (let j = 0; j <= 16; j++) {
          const t = j / 16;
          st.push([cx - CR * 0.5 + n * 4 + Math.sin(t * (3.0 + n) + n) * (2.5 + t * 3.5),
                   cy - CR * 0.9 - t * (17 + n * 4)]);
        }
        k.M(st, k.TEX * 1.5, { taper: [1.0, 0.25], s: 260 + i * 2 + n });
      });
    });
  }

  /* ── 5 · the bistro set ──────────────────────────────────────────── */
  /*
   * The reference that takes this register off the tabletop. Everything
   * before it is authored flat on the picture plane; a folding table and two
   * chairs are FURNITURE IN A SPACE, and they need a camera — which is the
   * real question this subject exists to answer: does `ink` survive one-point
   * perspective, or was it only ever a way of drawing jugs?
   *
   * Three things carry it, and none of them is the convergence:
   *
   *   SLATS. A café table top and a chair seat are a row of boards with gaps
   *   between them. The gaps are the drawing — they are what says the thing
   *   is made rather than moulded, and they are the only reason a flat top
   *   seen at this angle reads as a top at all.
   *
   *   X-FRAMES. A folding chair is two X's and a back. Drawn as four legs it
   *   is a stool; the cross is the whole identification.
   *
   *   THE FLOOR. One field of ruling, at an angle to everything standing on
   *   it, cut round every foot. In the reference it is what stops the set
   *   floating — and it is a far better ground than any line, because it has
   *   a near edge and a far one.
   */
  function bistro(k) {
    /*
     * EVERYTHING HERE HAS POSITIVE y, AND THAT IS NOT A DETAIL.
     *
     * y = 0 is the horizon — eye level. The first pass put the table top at
     * y = -26, which is ABOVE the eye, so the camera was looking UP at a café
     * table and the top came out as a sliver with its underside showing. To
     * see the top of a thing it has to be BELOW the horizon. The eye is
     * therefore above everything in the picture and every number is positive.
     */
    const V = k.V, FL = 58;                  /* the floor plane */
    const blockers = [];
    const put = (pts, w, o) =>
      k.cut(pts, blockers, (o || {}).closed).forEach((r, n) =>
        k.M(r, w, { ...(o || {}), closed: false, s: ((o || {}).s || 0) + n }));

    /*
     * THE FLOOR, AS A BOUNDED RUG.
     *
     * Ruled as long lines across the world it ran from x = -120 to x = +200
     * on the page, the bbox fit shrank the whole subject to a smear and the
     * near rulings converged into a black band. A floor in a drawing is never
     * the infinite plane; it is a PATCH with a near edge and a far one, and
     * the patch is what gets ruled. Same lesson as the ground line one subject
     * over: a subject is fitted to its own bounding box, so anything that
     * runs off the page takes the drawing with it.
     *
     * Ruled on the DIAGONAL, so it is never parallel to a leg or to the
     * table's edge — ruled square it reads as a tiled wall.
     */
    /* the rug has to reach IN FRONT of the nearest foot. At RZ0 = -6 the
     * near chair's legs ran off the bottom of it and the set was standing
     * half on the floor and half in the air. */
    const RX = 48, RZ0 = -24, RZ1 = 52;
    const fl = [];
    for (let i = -10; i <= 26; i++) {
      const run = [];
      for (let j = 0; j <= 18; j++) {
        const v = j / 18;
        const z = lerp(RZ0, RZ1, v);
        const x = -RX + i * 8.5 + v * 64;        /* the diagonal, in world x */
        if (x < -RX || x > RX) { if (run.length > 1) fl.push(run.slice()); run.length = 0; continue; }
        run.push(V.p(x, FL, z));
      }
      if (run.length > 1) fl.push(run);
    }

    /* ---- the table: a slatted top on an X of folding legs ---- */
    const TY = 24, TW = 21, TD = 14, TZ = 4;
    const topQ = V.quad([-TW, TY, TZ - TD], [TW, TY, TZ - TD],
                        [TW, TY, TZ + TD], [-TW, TY, TZ + TD]);
    const legs = [];
    [[-1], [1]].forEach(([sx]) => {
      legs.push(V.seg([sx * TW * 0.86, TY, TZ - TD * 0.8], [sx * TW * 0.5, FL, TZ + TD * 0.9]));
      legs.push(V.seg([sx * TW * 0.5, TY, TZ + TD * 0.8], [sx * TW * 0.86, FL, TZ - TD * 0.9]));
    });

    /* ---- the chairs: an X frame, a slatted seat, a ladder back ---- */
    function chair(cx, cz, turn, back) {
      /* 0.45 of the table's height off the floor. At 0.8 — which is where
         the first pass put it — the chairs tower over the table and the whole
         set reads as a lifeguard stand */
      const SY = FL - (FL - TY) * 0.45, W = 11, D = 10, t = turn * RAD;
      const at = (x, y, z) => {
        const X = cx + x * Math.cos(t) - z * Math.sin(t);
        const Z = cz + x * Math.sin(t) + z * Math.cos(t);
        return [X, y, Z];
      };
      const seat = V.quad(at(-W, SY, -D), at(W, SY, -D), at(W, SY, D), at(-W, SY, D));
      const fr = [];
      [[-1], [1]].forEach(([sx]) => {
        fr.push(V.seg(at(sx * W * 0.9, SY, -D * 0.85), at(sx * W * 0.55, FL, D * 0.95)));
        fr.push(V.seg(at(sx * W * 0.55, SY, D * 0.85), at(sx * W * 0.9, FL, -D * 0.95)));
      });
      /* the back: two uprights carried up from the REAR legs, not planted on
         the seat — a back that starts at seat level is a bench */
      const bk = [];
      if (back) {
        [[-1], [1]].forEach(([sx]) => {
          bk.push(V.seg(at(sx * W * 0.9, SY, -D * 0.85), at(sx * W * 0.78, SY - 21, -D * 1.05)));
        });
        [8, 16].forEach((h) => {
          bk.push(V.seg(at(-W * 0.86, SY - h, -D * 0.93), at(W * 0.86, SY - h, -D * 0.93)));
        });
      }
      return { seat, fr, bk, at, SY, W, D };
    }
    const chL = chair(-34, 16, 16, true);
    const chR = chair(31, -2, -150, true);

    /* ---- order. Everything is cut by what is nearer, so the nearer things
       become blockers as they are drawn: the left chair is in front of the
       table, the table in front of the right chair. ---- */
    const slats = (q, n, w, sd) => {
      /* a slatted top: author in the quad's own u, so it lands in perspective
         with the rest. The GAPS are the drawing */
      const out = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const a = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)];
        const b = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)];
        out.push([a, b]);
      }
      return out;
    };

    /* the right chair, furthest back */
    chR.bk.forEach((g, i) => put(g, k.OUT * 0.9, { s: 300 + i, curve: false }));
    put(chR.seat, k.OUT, { closed: true, s: 320, curve: false });
    slats(chR.seat, 5).forEach((g, i) => put(g, k.TEX * 1.6, { s: 330 + i, curve: false }));
    chR.fr.forEach((g, i) => put(g, k.OUT, { s: 340 + i, curve: false, taper: [1.2, 0.8] }));
    blockers.push(chR.seat);

    /* the table */
    put(topQ, k.OUT, { closed: true, s: 100, curve: false });
    slats(topQ, 7).forEach((g, i) => put(g, k.TEX * 1.7, { s: 110 + i, curve: false }));
    /* the apron, a sliver under the top — without it the top is a sheet */
    put([topQ[3], topQ[2]].concat([[topQ[2][0], topQ[2][1] + 2.4],
         [topQ[3][0], topQ[3][1] + 2.4]]), k.DET, { closed: true, s: 120, curve: false });
    legs.forEach((g, i) => put(g, k.OUT, { s: 130 + i, curve: false, taper: [1.2, 0.8] }));
    blockers.push(topQ.concat([[topQ[2][0], topQ[2][1] + 2.4],
                               [topQ[3][0], topQ[3][1] + 2.4]]));

    /* things ON the table, before the near chair cuts into them */
    const bot = [];
    const bprof = [[TY - 18, 3.0], [TY - 14, 3.2], [TY - 11, 5.4],
                   [TY - 2, 5.6], [TY - 0.5, 5.4]];
    bprof.forEach(([y, r]) => bot.push(V.p(-9 + r, y, TZ)));
    bprof.slice().reverse().forEach(([y, r]) => bot.push(V.p(-9 - r, y, TZ)));
    put(bot, k.OUT * 0.85, { closed: true, s: 150 });
    [[3, 3.6], [11, 3.4]].forEach(([x, r], i) => {
      const g = [V.p(x - r, TY - 8, TZ - 2), V.p(x + r, TY - 8, TZ - 2),
                 V.p(x + r * 0.86, TY - 0.5, TZ - 2), V.p(x - r * 0.86, TY - 0.5, TZ - 2)];
      put(g, k.OUT * 0.85, { closed: true, s: 160 + i, curve: false });
    });
    /* a pot of lavender: scribble, the one organic texture here */
    const pq = [V.p(18, TY - 6, TZ - 3), V.p(26, TY - 6, TZ - 3),
                V.p(25, TY - 0.5, TZ - 3), V.p(19, TY - 0.5, TZ - 3)];
    put(pq, k.OUT * 0.85, { closed: true, s: 170, curve: false });
    const lav = [];
    for (let i = 0; i <= 26; i++) {
      const a = (i / 26) * 360 * RAD;
      lav.push(V.p(22 + Math.cos(a) * 7.5, TY - 14 + Math.sin(a) * 6.5, TZ - 3));
    }
    k.T(lav, "scribble", 0.5, { fill: "cInk", s: 180, curve: true, gap: 2.0 });
    blockers.push(bot);

    /* the near chair, last and cut by nothing */
    chL.bk.forEach((g, i) => k.M(g, k.OUT * 0.95, { s: 400 + i, curve: false }));
    k.M(chL.seat, k.OUT, { closed: true, s: 420, curve: false });
    slats(chL.seat, 5).forEach((g, i) => k.M(g, k.TEX * 1.7, { s: 430 + i, curve: false }));
    chL.fr.forEach((g, i) => k.M(g, k.OUT, { s: 440 + i, curve: false, taper: [1.25, 0.8] }));
    blockers.push(chL.seat);

    /* ---- and the floor LAST in authoring, because every blocker has to
       exist before it is ruled. Marks render in authoring order among
       themselves, so this would draw over the furniture — which is exactly
       why it is cut by all of it rather than drawn first and hoped for. ---- */
    const feet = blockers.concat(legs.concat(chL.fr).concat(chR.fr).map((g) => {
      /* a leg is a line; a line blocks nothing. Give each one a width */
      const [a, b] = g, dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * 1.3, ny = (dx / L) * 1.3;
      return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny],
              [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
    }));
    fl.forEach((g, i) =>
      k.cut(g, feet).forEach((r, n) => k.M(r, k.TEX, { s: 500 + i * 3 + n, curve: false })));
    /*
     * The rug's own EDGES. Without them the diagonal ruling tapers away to
     * nothing and reads as a fan of light rays rather than as a floor: a
     * patch needs a border or it is just hatching that happened to stop.
     */
    k.M([V.p(-RX, FL, RZ0), V.p(RX, FL, RZ0)], k.DET, { curve: false });
    k.cut([V.p(-RX, FL, RZ1), V.p(RX, FL, RZ1)], feet)
      .forEach((r, n) => k.M(r, k.DET * 0.8, { curve: false, s: 600 + n }));
    [-RX, RX].forEach((sx, i) =>
      k.cut([V.p(sx, FL, RZ0), V.p(sx, FL, RZ1)], feet)
        .forEach((r, n) => k.M(r, k.DET * 0.8, { curve: false, s: 610 + i * 4 + n })));
  }

  const BUILD = { kettle, bowl, pot, cloth, bistro };
  const NAMES = {
    kettle: "Grid kettle with thyme", bowl: "Bowl of fruit",
    pot: "Fluted pot with daisies", cloth: "Two cups on a checked cloth",
    bistro: "Bistro set on a ruled floor",
  };

  const out = { _keys: Object.keys(BUILD), _names: NAMES, GND };
  for (const key of out._keys) {
    out[key] = Spec.wrap("ink", NAMES[key], () => {
      /* the bistro is the only subject here that uses the camera at all;
       everything else is authored on the picture plane, which is what the
       class says to do for a thing you could pick up */
      const k = Kit.rig({ gnd: GND, f: 120, vp: [50, 8] });
      /*
       * NEARLY BINARY. The references have a heavy contour and a fine
       * texture and almost nothing in between — measured off them the ratio
       * is about 4:1, where our still life ran 1.35/0.55/0.3 against a
       * heavier base pen. A middle weight is what makes a pen drawing look
       * like a plotter: three similar weights average into one.
       */
      k.OUT = 2.00; k.DET = 0.86; k.TEX = 0.46;
      BUILD[key](k);
      return k.done();
    });
  }
  return out;
})();
