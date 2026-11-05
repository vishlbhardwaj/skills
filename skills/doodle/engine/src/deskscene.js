/*
 * DESKTOP STILL LIFE — pot, pens, books, lamp, notebook.
 *
 * A different camera problem from the furniture: those stand on a floor and
 * are seen roughly from eye level, this lies ON a plane and is seen from
 * above. Same projection, different placement — the table surface is put far
 * below the eye (y = 80) so it recedes steeply up the frame, and everything
 * else sits on it.
 *
 * Colour measured off the reference by SATURATION, not by lit face. On gloss
 * the brightest pixels are the specular highlight rather than the object: the
 * lit-face probe returned a cream pencil and a grey book. Weighted by
 * saturation instead, the pot is hue 207 at full chroma and the pencil hue 50.
 *
 *   pot      #0D6FBE        pencil  #F0C800
 *   pen      #E8504A        books   #96B4D2 over white
 *   oak      #C08A52        lamp    near-white
 */
window.DeskScene = (function () {

  function build() {
    const V = View.one({ f: 110, vp: [50, 6] });
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
    const OUT = 1.4, DET = 0.8, TEX = 0.46;
    const TOP = 80;                      // the table surface

    /* ── the table ────────────────────────────────────────────────── */
    solid(View.prism(V, View.rect(-50, -4, 84, 118), TOP, TOP + 6), "cWood", 11, OUT);
    /*
     * Grain only on the open part of the table.
     *
     * Every region paints before every mark, so a grain line authored first
     * still draws OVER a book's fill — it ran straight across the books, the
     * notebook and the pencil. Rather than fight the draw order, the grain
     * stays where nothing is standing.
     */
    for (let x = -46; x < 80; x += 11) {
      /* each line runs until it reaches whatever stands in its column */
      const stop = x < -42 ? 114 : x < -8 ? 36 : x < 76 ? 12 : 114;
      M(V.seg([x, TOP - 0.2, 4], [x, TOP - 0.2, stop]), TEX * 0.7);
    }

    /* ── books: two flat volumes, the lower one proud ─────────────── */
    solid(View.prism(V, View.rect(10, 62, 62, 100), TOP - 5, TOP), "cPaper", 21, DET);
    solid(View.prism(V, View.rect(14, 65, 58, 97), TOP - 10, TOP - 5), "cSky", 31, DET);
    /* spine lettering, as a rule rather than as letters */
    M(V.seg([16, TOP - 7.4, 64.5], [56, TOP - 7.4, 64.5]), TEX);
    M(V.seg([12, TOP - 2.4, 62.5], [60, TOP - 2.4, 62.5]), TEX);

    /* ── lamp, standing on the books ──────────────────────────────── */
    const LY = TOP - 10;                 // the lamp stands on the blue book
    const LX = 36, LZ = 82;
    solid(View.prism(V, View.disc(LX, LZ, 13, 20), LY - 3, LY), "cPaper", 41, DET);
    /* the stem: a drawn profile, because a prism cannot taper */
    const base = V.p(LX, LY - 3, LZ), s = V.s(LZ);
    const stem = [[-11, 0], [-4, -10], [-3.2, -22], [3.2, -22], [4, -10], [11, 0]];
    const stemPts = stem.map(([x, y]) => [base[0] + x * s, base[1] + y * s]);
    R(stemPts, "cPaper", 51, 1, true);
    M(stemPts, DET, { curve: true });
    /* the dome */
    const dome = [];
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI * (i / 18);
      dome.push([base[0] - Math.cos(a) * 22 * s, base[1] - 22 * s - Math.sin(a) * 17 * s]);
    }
    R(dome.concat([[base[0] + 22 * s, base[1] - 22 * s]]), "cPaper", 61, 1, true);
    M(dome, OUT, { curve: true });
    M([[base[0] - 22 * s, base[1] - 22 * s], [base[0] + 22 * s, base[1] - 22 * s]], DET);
    /* the little finial */
    M([[base[0] - 2.4 * s, base[1] - 38.6 * s], [base[0], base[1] - 41 * s],
       [base[0] + 2.4 * s, base[1] - 38.6 * s]], DET, { curve: true });

    /* ── pen pot: a tray, a cylinder, and what is in it ───────────── */
    const PX = -26, PZ = 54;
    solid(View.prism(V, View.disc(PX, PZ, 15, 22), TOP - 5, TOP), "cAzure", 71, DET);
    solid(View.prism(V, View.disc(PX, PZ, 10.5, 22), TOP - 27, TOP - 4), "cAzure", 91, OUT);
    /* the mouth: a second ring inside the rim is what makes it a pot */
    M(View.disc(PX, PZ, 8.6, 22).map(([x, z]) => V.p(x, TOP - 26, z)),
      DET, { closed: true, curve: true });

    /* three stationery items, at three angles */
    [[-6, -3, "cYellow", 30, 1], [0, 2, "cPaper", 27, 0], [6, -1, "cRed", 29, 1]]
      .forEach(([dx, dz, fill, len, pointed], i) => {
        const x0 = PX + dx, z0 = PZ + dz;
        const x1 = x0 + dx * 1.5, z1 = z0 + dz * 1.4;
        const topY = TOP - 26 - len;
        const a = V.p(x0, TOP - 24, z0), b = V.p(x1, topY, z1);
        const sc = V.s(z1), w = 2.2 * sc;
        const body = [[a[0] - w, a[1]], [b[0] - w, b[1]], [b[0] + w, b[1]], [a[0] + w, a[1]]];
        R(body, fill, 101 + i * 4, 1, false);
        M(body, DET, { closed: true, curve: false });
        if (pointed) {
          /* a sharpened point, and the graphite in it */
          const tip = [[b[0] - w, b[1]], [b[0], b[1] - 5 * sc], [b[0] + w, b[1]]];
          R(tip, "cWood", 103 + i * 4, 1, false);
          M(tip, DET, { closed: true, curve: false });
          M([[b[0], b[1] - 5 * sc], [b[0], b[1] - 2.6 * sc]], DET * 1.4);
        }
      });

    /* ── open notebook, lying flat and tented at the spine ────────── */
    const page = (x0, x1, lift) => V.quad(
      [x0, TOP - lift, 14], [x1, TOP - lift - 0.6, 14],
      [x1 + 4, TOP - 0.4, 46], [x0 + 4, TOP - 0.4, 46]);
    R(page(2, 36, 2.4), "cPaper", 121, 1, false);
    M(page(2, 36, 2.4), DET, { closed: true, curve: false });
    R(page(36, 70, 2.4), "cPaper", 125, 0.95, false);
    M(page(36, 70, 2.4), DET, { closed: true, curve: false });
    /* ruled lines on the right page only — both sides is a ledger */
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      M(V.seg([38 + t * 2, TOP - 2.2 + t * 1.6, 17 + t * 26],
              [68 + t * 2, TOP - 2.2 + t * 1.6, 17 + t * 26]), TEX * 0.8);
    }
    /* a folded blue card clipped to the page */
    R(V.quad([40, TOP - 3.1, 18], [66, TOP - 3.4, 18], [68, TOP - 2.6, 30], [42, TOP - 2.3, 30]),
      "cSky", 131, 1, false);
    M(V.quad([40, TOP - 3.1, 18], [66, TOP - 3.4, 18], [68, TOP - 2.6, 30], [42, TOP - 2.3, 30]),
      DET, { closed: true, curve: false });

    /* a pencil lying across the notebook */
    const pa = V.p(44, TOP - 3.2, 40), pb = V.p(76, TOP - 1.2, 24);
    const pw = 2.1 * V.s(30);
    const lie = [[pa[0], pa[1] - pw], [pb[0], pb[1] - pw], [pb[0], pb[1] + pw], [pa[0], pa[1] + pw]];
    R(lie, "cYellow", 141, 1, false);
    M(lie, DET, { closed: true, curve: false });

    /* ── a pushpin, and the corner of a sheet of paper ────────────── */
    const tx = V.p(-44, TOP, 18), ts = V.s(18);
    R(View.disc(-44, 18, 4.4, 14).map(([x, z]) => V.p(x, TOP - 4.6, z)), "cAzure", 151, 1, true);
    M(View.disc(-44, 18, 4.4, 14).map(([x, z]) => V.p(x, TOP - 4.6, z)), DET,
      { closed: true, curve: true });
    M([[tx[0], tx[1]], [tx[0] + 1.6 * ts, tx[1] - 4.6 * ts]], DET);
    R(V.quad([-62, TOP - 0.3, 6], [-38, TOP - 0.3, 10], [-40, TOP - 0.3, 26], [-62, TOP - 0.3, 22]),
      "cPaper", 161, 1, false);
    M(V.quad([-62, TOP - 0.3, 6], [-38, TOP - 0.3, 10], [-40, TOP - 0.3, 26], [-62, TOP - 0.3, 22]),
      DET, { closed: true, curve: false });

    return { marks, regions, tones };
  }

  return { label: "Desk scene", build,
           fit: { w: 0.92, h: 0.84 }, pen: 0.15,
           nib: { pressure: 0.1, wander: 0.07, boil: 0.12, overshoot: 0.2,
                  double: false, breaks: 0.03, blobs: 0, specks: 0 } };
})();
