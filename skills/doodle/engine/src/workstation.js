/*
 * WORKSTATION — wall monitor, desk, mat, keyboard, mouse, and the small stuff.
 *
 * Two planes rather than one: the desk lying flat, and the wall standing
 * behind it with the monitor fixed to it. Everything else sits on the desk.
 *
 * Measured off the reference — this is a muted room, and that matters more
 * than usual because the only saturated thing in it is the screen:
 *
 *   wall   #B1B4A3   sat 10%     desk oak    #C08C50-ish, hue 32
 *   mat    #7B7865   sat 10%     keyboard    #212826   lum 14%
 *   screen #75ADAC   sat 25%     stream deck #1A2327   lum 13%
 *
 * Which gives the picture its structure: a pale wall, a warm desk, two very
 * dark masses on a grey mat, and one cool glowing rectangle. Nothing else
 * competes, so nothing else should be coloured.
 */
window.Workstation = (function () {

  function build() {
    const V = View.one({ f: 130, vp: [50, 26] });
    const marks = [], regions = [], tones = [];
    const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
    const T = (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) });
    const R = (pts, fill, sd, sh, curve) => {
      regions.push({ pts, fill, s: sd || 0, curve: !!curve });
      if (sh != null) regions[regions.length - 1].shade = sh;
    };
    const solid = (faces, fill, sd, w) => {
      faces.forEach((f, i) => R(f.pts, fill, sd + i, f.shade));
      if (faces.silhouette) M(faces.silhouette, w, { closed: true, curve: false });
      const top = faces[faces.length - 1];
      if (top && top.shade === 1) M(top.pts, w * 0.7, { closed: true, curve: false });
    };
    const OUT = 1.35, DET = 0.8, TEX = 0.45;
    const TOP = 80, WALL = 72;

    /* ── wall, then desk ──────────────────────────────────────────── */
    /* The paper IS the wall. Filled as a rectangle it came out narrower than
       the desk in front of it and read as a panel hung behind everything. Only
       the junction with the desk is drawn. */
    M(V.seg([-80, TOP, WALL], [88, TOP, WALL]), DET);
    solid(View.prism(V, View.rect(-64, -8, 74, WALL), TOP, TOP + 6), "cWood", 11, OUT);

    /* ── the monitor, fixed to the wall ───────────────────────────── */
    const BZ = [-46, 50, -40, 20];                      // x0 x1 yTop yBot
    const face = (x0, x1, y0, y1, z) => V.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
    solid(View.prism(V, View.rect(BZ[0], WALL - 3, BZ[1], WALL), BZ[2], BZ[3]), "cInk", 21, OUT);
    /* the screen: one cool rectangle, the only lit thing in the picture */
    R(face(BZ[0] + 1.6, BZ[1] - 1.6, BZ[2] + 1.6, BZ[3] - 3.4, WALL - 3.2), "cScreen", 31, 1, false);
    M(face(BZ[0] + 1.6, BZ[1] - 1.6, BZ[2] + 1.6, BZ[3] - 3.4, WALL - 3.2), DET,
      { closed: true, curve: false });
    /* what is ON it, as blocks — a drawing of a screen, not of its contents */
    M(V.seg([BZ[0] + 1.6, BZ[2] + 5, WALL - 3.3], [BZ[1] - 1.6, BZ[2] + 5, WALL - 3.3]), TEX);
    M(V.seg([BZ[0] + 11, BZ[2] + 5, WALL - 3.3], [BZ[0] + 11, BZ[3] - 3.4, WALL - 3.3]), TEX);
    M(V.seg([BZ[1] - 11, BZ[2] + 5, WALL - 3.3], [BZ[1] - 11, BZ[3] - 3.4, WALL - 3.3]), TEX);
    T(face(BZ[1] - 28, BZ[1] - 12, BZ[2] + 8, BZ[3] - 8, WALL - 3.4), "halftone", TEX,
      { s: 41, gap: 0.55 });
    [[-26, 8, 3], [-26, 12, 3], [-26, 16, 3], [-26, 20, 3]].forEach(([x, dy, len], i) =>
      M(V.seg([x, BZ[2] + 12 + i * 3.4, WALL - 3.3],
              [x + 14 - i * 1.6, BZ[2] + 12 + i * 3.4, WALL - 3.3]), TEX * 0.9));

    /* ── felt mat, and the two dark masses on it ──────────────────── */
    R(V.quad([-42, TOP - 0.4, 8], [40, TOP - 0.4, 8], [44, TOP - 0.4, 42], [-46, TOP - 0.4, 42]),
      "cFelt", 51, 1, false);
    M(V.quad([-42, TOP - 0.4, 8], [40, TOP - 0.4, 8], [44, TOP - 0.4, 42], [-46, TOP - 0.4, 42]),
      DET, { closed: true, curve: false });

    /* keyboard: a wedge, thicker at the back, with its key field ruled */
    const KB = View.rect(-40, 14, 6, 34);
    solid(View.prism(V, KB, TOP - 5, TOP - 0.6), "cInk", 61, OUT);
    for (let k = 1; k < 6; k++)
      M(V.seg([-40, TOP - 5.2, 14 + k * 3.3], [6, TOP - 5.2, 14 + k * 3.3]), TEX * 0.8);
    for (let x = -36; x < 6; x += 3.6)
      M(V.seg([x, TOP - 5.2, 14], [x, TOP - 5.2, 34]), TEX * 0.6);
    /* one red key — the only warm note on the whole desk */
    R(V.quad([-38.4, TOP - 5.3, 15], [-35.6, TOP - 5.3, 15],
             [-35.6, TOP - 5.3, 18], [-38.4, TOP - 5.3, 18]), "cRed", 71, 1, false);

    /* mouse: a drawn profile, because a prism cannot be a dome */
    const mb = V.p(20, TOP - 0.6, 24), ms = V.s(24);
    const mouse = [[-6, 0], [-6.4, -3.4], [-4, -6.6], [0, -7.6], [4, -6.4], [6.4, -3], [6, 0]];
    const mpts = mouse.map(([x, y]) => [mb[0] + x * ms, mb[1] + y * ms]);
    R(mpts, "cInk", 81, 0.92, true);
    M(mpts, OUT, { closed: true, curve: true });
    M([[mb[0], mb[1] - 7.6 * ms], [mb[0], mb[1] - 1 * ms]], TEX);

    /* ── pen pot, note stand, earbuds, stream deck ────────────────── */
    solid(View.prism(V, View.disc(-52, 54, 7.5, 16), TOP - 16, TOP), "cWood", 91, DET);
    [[-54, 0.6], [-51, 1], [-49, 0.4]].forEach(([x, lean], i) => {
      const a = V.p(x, TOP - 14, 54), b = V.p(x + lean * 2, TOP - 26 - i * 2, 54 + lean);
      M([a, b], DET * 1.1, { taper: [1.15, 0.9] });
    });

    /* the note stand: a wedge with a card leaning on it */
    solid(View.prism(V, View.rect(-38, 50, -20, 60), TOP - 5, TOP), "cWood", 101, DET);
    R(V.quad([-37, TOP - 5, 56], [-21, TOP - 5, 56], [-21, TOP - 22, 60], [-37, TOP - 22, 60]),
      "cPaper", 111, 1, false);
    M(V.quad([-37, TOP - 5, 56], [-21, TOP - 5, 56], [-21, TOP - 22, 60], [-37, TOP - 22, 60]),
      DET, { closed: true, curve: false });
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      M(V.seg([-35, TOP - 7 - t * 13, 56.5 + t * 3], [-24 + k * 0.6, TOP - 7 - t * 13, 56.5 + t * 3]),
        TEX * 0.8);
    }

    /* earbuds case */
    solid(View.prism(V, View.rect(24, 48, 33, 55), TOP - 4, TOP), "cPaper", 121, DET);
    M(V.seg([24, TOP - 2, 48], [33, TOP - 2, 48]), TEX);

    /* stream deck: tilted, with a grid of lit keys */
    solid(View.prism(V, View.rect(48, 44, 72, 62), TOP - 5, TOP), "cInk", 131, OUT);
    const KEY = ["cAzure", "cRed", "cYellow", "cSky", "cLeaf", "cAzure",
                 "cSky", "cYellow", "cLeaf", "cRed", "cAzure", "cSky"];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++) {
        const x0 = 50 + c * 5.4, z0 = 46 + r * 5.2;
        R(V.quad([x0, TOP - 5.2, z0], [x0 + 4, TOP - 5.2, z0],
                 [x0 + 4, TOP - 5.2, z0 + 3.8], [x0, TOP - 5.2, z0 + 3.8]),
          KEY[r * 4 + c], 141 + r * 8 + c, 1, false);
      }

    return { marks, regions, tones };
  }

  return { label: "Workstation", build,
           fit: { w: 0.94, h: 0.86 }, pen: 0.14,
           nib: { pressure: 0.1, wander: 0.07, boil: 0.11, overshoot: 0.2,
                  double: false, breaks: 0.03, blobs: 0, specks: 0 } };
})();
