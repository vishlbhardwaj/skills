/*
 * FURNITURE, IN PERSPECTIVE.
 *
 * All built the way the chairs that worked are built: explicit boards and
 * boxes, listed out, never generated from a formula. Furniture is carcass
 * work — rectangles joined at right angles — so this is the honest way to
 * describe it, and it is also the way that reads.
 *
 * Proportions are real, at roughly 1 unit = 2 cm with the floor at y = 40:
 *
 *   sideboard   180 × 75 × 45 cm      bookshelf  80 × 180 × 30
 *   round table 110 dia × 75          bench      120 × 45 × 35
 *   wardrobe    100 × 200 × 60        coffee     110 × 40 × 55
 *
 * Every leg tapers. A carcass sits on legs that are thick where they meet it
 * and thin at the floor, and drawn at one width they turn the whole piece
 * into a diagram — which is the single thing that separated the chairs that
 * read from the chairs that did not.
 */
window.Furniture = (function () {

  function rig(f, vp) {
    const V = View.one({ f: f || 190, vp: vp || [50, 44] });
    const marks = [], regions = [], tones = [];
    const api = {
      V, marks, regions, tones,
      FLOOR: 40, OUT: 1.5, DET: 0.85, TEX: 0.5,
      M: (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) }),
      T: (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) }),
      R: (pts, fill, sd, sh, curve) => {
        regions.push({ pts, fill, s: sd || 0, curve: !!curve });
        if (sh != null) regions[regions.length - 1].shade = sh;
      },
      solid(faces, fill, sd, w) {
        faces.forEach((f2, i) => api.R(f2.pts, fill, sd + i, f2.shade));
        if (faces.silhouette) api.M(faces.silhouette, w, { closed: true, curve: false });
        const top = faces[faces.length - 1];
        if (top && top.shade === 1) api.M(top.pts, w * 0.7, { closed: true, curve: false });
      },
      /*
       * A box from an axis-aligned footprint, optionally turned.
       *
       * x0/z0/x1/z1 are ABSOLUTE, in the same frame as the legs. Passed as
       * offsets they get turned about a centre they are nowhere near, and the
       * carcass swings away from its own legs — which is exactly how the
       * bench and the coffee table came apart.
       */
      part(x0, z0, x1, z1, yTop, yBot, fill, sd, w, turn, cx, cz) {
        let foot = View.rect(x0, z0, x1, z1);
        if (turn) foot = View.turn(foot, turn, cx, cz);
        api.solid(View.prism(V, foot, yTop, yBot), fill || "cWood", sd, w || api.OUT);
        return foot;
      },
      shadow(cx, cz, rx, rz) {
        const d = View.disc(0, 0, 1, 24).map(([x, z]) => [cx + x * rx, cz + z * (rz || rx)]);
        api.R(d.map(([x, z]) => V.p(x, api.FLOOR, z)), "cWash", 1, 1, true);
      },
      leg(x, z, dx, dz, yTop, w) {
        api.M(V.seg([x, yTop, z], [x + dx, api.FLOOR, z + dz]), w || api.OUT * 1.6,
              { taper: [1.3, 0.58] });
      },
      done() { return { marks, regions, tones }; },
    };
    return api;
  }

  /* ── 1 · SIDEBOARD — long, low, three doors on tapered legs ───────── */
  function sideboard() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const TURN = -17, CX = 0, CZ = 46;
    a.shadow(CX, CZ, 50, 18);
    /* carcass */
    const foot = a.part(CX - 45, CZ - 11, CX + 45, CZ + 11, 4, 29, "cWood", 11, OUT, TURN, CX, CZ);
    /* the front is the piece's face, so the doors are drawn ON it, not as
       boxes of their own — a box per door doubles every edge */
    const front = (x0, x1, y0, y1) => {
      const p0 = View.turn([[CX + x0, CZ - 11.2]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + x1, CZ - 11.2]], TURN, CX, CZ)[0];
      return [V.p(p0[0], y0, p0[1]), V.p(p1[0], y0, p1[1]),
              V.p(p1[0], y1, p1[1]), V.p(p0[0], y1, p0[1])];
    };
    [-43, -14.5, 14].forEach((x) => M(front(x, x + 29, 6, 27), DET, { closed: true, curve: false }));
    /* long slim pulls */
    [-43, -14.5, 14].forEach((x) => {
      const p0 = View.turn([[CX + x + 9, CZ - 11.6]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + x + 20, CZ - 11.6]], TURN, CX, CZ)[0];
      M([V.p(p0[0], 10.5, p0[1]), V.p(p1[0], 10.5, p1[1])], DET * 1.3);
    });
    [[-41, -9], [41, -9], [-41, 9], [41, 9]].forEach(([dx, dz]) => {
      const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
      a.leg(x, z, dx * 0.07, dz * 0.3, 29);
    });
    return a.done();
  }

  /* ── 2 · BOOKSHELF — a tall open frame, and what fills it ─────────── */
  function bookshelf() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const TURN = -15, CX = 0, CZ = 48, X = 20, D = 7.5;
    a.shadow(CX, CZ, 26, 13);
    let q = 3; const rnd = () => (q = (q * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    /* two uprights and a plinth */
    [-X, X].forEach((dx) =>
      a.part(CX + dx - 1.6, CZ - D, CX + dx + 1.6, CZ + D, -50, 38,
             "cWood", 11 + (dx > 0 ? 20 : 0), OUT, TURN, CX, CZ));
    a.part(CX - X, CZ - D, CX + X, CZ + D, 36, 40, "cWood", 51, DET, TURN, CX, CZ);

    /* five shelves, and books on four of them */
    [-44, -27, -10, 7, 24].forEach((y, s) => {
      a.part(CX - X, CZ - D, CX + X, CZ + D, y, y + 2.2, "cWood", 61 + s * 8, DET, TURN, CX, CZ);
      if (s === 4) return;
      let bx = -X + 2.5;
      while (bx < X - 3) {
        const w = 1.2 + rnd() * 2.1, h = 8 + rnd() * 4.5;
        if (bx + w > X - 2.5) break;
        const p0 = View.turn([[CX + bx, CZ - D + 1]], TURN, CX, CZ)[0];
        const p1 = View.turn([[CX + bx + w, CZ - D + 1]], TURN, CX, CZ)[0];
        const sp = [V.p(p0[0], y, p0[1]), V.p(p1[0], y, p1[1]),
                    V.p(p1[0], y - h, p1[1]), V.p(p0[0], y - h, p0[1])];
        M(sp, DET * 0.9, { closed: true, curve: false });
        const r = rnd();
        if (r < 0.2) a.T(sp, "solid", TEX, { s: 200 + s * 40 + bx });
        else if (r < 0.46) a.T(sp, "halftone", TEX, { s: 200 + s * 40 + bx, gap: 0.42 });
        bx += w + 0.35;
      }
    });
    return a.done();
  }

  /* ── 3 · ROUND TABLE — a disc on four splayed legs ────────────────── */
  function roundTable() {
    const a = rig(), { V, M, OUT, DET } = a;
    const CX = 0, CZ = 46, R = 27;
    a.shadow(CX, CZ, R + 5, 12);
    a.solid(View.prism(V, View.disc(CX, CZ, R, 26), 3, 6), "cWood", 11, OUT);
    /* the apron, set in from the edge, is what stops a disc reading as a lid */
    a.solid(View.prism(V, View.disc(CX, CZ, R - 5, 24), 6, 9.5), "cWood", 31, DET);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
      a.leg(CX + sx * 16, CZ + sz * 10, sx * 5, sz * 3.5, 9.5));
    return a.done();
  }

  /* ── 4 · BENCH — slats, and nothing else ──────────────────────────── */
  function bench() {
    const a = rig(), { V, M, OUT, DET } = a;
    const TURN = -22, CX = 0, CZ = 48, X = 30, D = 9;
    a.shadow(CX, CZ, X + 6, 14);
    /* five slats with gaps: a bench is a seat you can see through */
    /* four slats, not five: at five the gaps closed up and the seat read as
       a solid plank, which is the one thing a bench is not */
    for (let i = 0; i < 4; i++) {
      const z0 = -D + i * (2 * D / 4) + 0.6, z1 = z0 + (2 * D / 4) - 2.6;
      a.part(CX - X, CZ + z0, CX + X, CZ + z1, 18, 20.4, "cWood", 11 + i * 6, DET, TURN, CX, CZ);
    }
    /* end frames: a leg each side joined by a rail, not four loose sticks */
    [-1, 1].forEach((sd) => {
      [-D + 1, D - 1].forEach((dz) => {
        const [x, z] = View.turn([[CX + sd * (X - 3), CZ + dz]], TURN, CX, CZ)[0];
        a.leg(x, z, 0, 0, 20.4);
      });
      const p0 = View.turn([[CX + sd * (X - 3), CZ - D + 1]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + sd * (X - 3), CZ + D - 1]], TURN, CX, CZ)[0];
      M(V.seg([p0[0], 32, p0[1]], [p1[0], 32, p1[1]]), DET * 1.3);
    });
    return a.done();
  }

  /* ── 5 · WARDROBE — tall, two doors, a plinth ─────────────────────── */
  function wardrobe() {
    const a = rig(), { V, M, OUT, DET } = a;
    const TURN = -19, CX = 0, CZ = 46, X = 25, D = 14;
    a.shadow(CX, CZ, X + 8, 19);
    a.part(CX - X, CZ - D, CX + X, CZ + D, -60, 36, "cWood", 11, OUT, TURN, CX, CZ);
    a.part(CX - X - 1, CZ - D - 1, CX + X + 1, CZ + D + 1, 36, 40, "cWood", 31, DET, TURN, CX, CZ);
    /* the doors, drawn on the face */
    const face = (x0, x1, y0, y1) => {
      const p0 = View.turn([[CX + x0, CZ - D - 0.3]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + x1, CZ - D - 0.3]], TURN, CX, CZ)[0];
      return [V.p(p0[0], y0, p0[1]), V.p(p1[0], y0, p1[1]),
              V.p(p1[0], y1, p1[1]), V.p(p0[0], y1, p0[1])];
    };
    M(face(-X + 1.6, -0.6, -58, 34), DET, { closed: true, curve: false });
    M(face(0.6, X - 1.6, -58, 34), DET, { closed: true, curve: false });
    [-3.4, 3.4].forEach((dx) => {
      const p = View.turn([[CX + dx, CZ - D - 0.8]], TURN, CX, CZ)[0];
      M(V.seg([p[0], -16, p[1]], [p[0], -8, p[1]]), DET * 1.4);
    });
    return a.done();
  }

  /* ── 6 · COFFEE TABLE — a top, and a shelf under it ───────────────── */
  function coffee() {
    const a = rig(), { V, M, OUT, DET } = a;
    const TURN = -24, CX = 0, CZ = 46, X = 27, D = 13;
    a.shadow(CX, CZ, X + 6, 17);
    a.part(CX - X, CZ - D, CX + X, CZ + D, 19, 22, "cWood", 11, OUT, TURN, CX, CZ);
    /* the lower shelf is set in, so the legs stay visible past it */
    a.part(CX - X + 4, CZ - D + 3, CX + X - 4, CZ + D - 3, 31, 33, "cWood", 31, DET, TURN, CX, CZ);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const [x, z] = View.turn([[CX + sx * (X - 2.5), CZ + sz * (D - 2.5)]], TURN, CX, CZ)[0];
      a.leg(x, z, sx * 1.2, sz * 1.2, 22);
    });
    return a.done();
  }

  const wrap = (label, build, fit) => ({
    label, build,
    fit: fit || { w: 0.86, h: 0.8 }, pen: 0.16,
    nib: { pressure: 0.1, wander: 0.07, boil: 0.12, overshoot: 0.22,
           double: false, breaks: 0.03, blobs: 0, specks: 0 },
  });

  return {
    sideboard:  wrap("Sideboard", sideboard),
    bookshelf:  wrap("Bookshelf", bookshelf, { w: 0.62, h: 0.88 }),
    roundTable: wrap("Round table", roundTable),
    bench:      wrap("Bench", bench),
    wardrobe:   wrap("Wardrobe", wardrobe, { w: 0.64, h: 0.88 }),
    coffee:     wrap("Coffee table", coffee),
  };
})();
