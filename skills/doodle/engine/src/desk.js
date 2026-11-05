/*
 * DESK · CHAIR · PITCHER — the three subjects, and nothing else.
 *
 * No room: no walls, no floorboards, no skirting. Just the objects, on a
 * contact shadow so they are standing rather than floating.
 *
 * The wood is ONE colour. Measured off the reference, every oak surface sits
 * at hue 26–28 and 41–53% saturation — top, drawer fronts and pedestal side
 * are the same timber at different angles to the light, so the difference
 * between them belongs to the shading, not to the palette.
 *
 * A long lens (f = 190) rather than a wide one: this is a product photograph,
 * nearly orthographic, and a short focal length would splay the desk legs
 * outward in a way no catalogue shot ever does.
 */
window.Desk = (function () {

  function build(P) {
    const V = View.one({ f: 190, vp: [50, 46] });
    const marks = [], regions = [], tones = [];
    const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
    const R = (pts, fill, sd, sh, curve) => {
      regions.push({ pts, fill, s: sd || 0, curve: !!curve });
      if (sh != null) regions[regions.length - 1].shade = sh;
    };
    const OUT = 1.5, DET = 0.85, TEX = 0.5;
    const FLOOR = 40;

    /* fill every face, outline the silhouette once — not once per facet */
    const solid = (faces, fill, sd, w) => {
      faces.forEach((f, i) => R(f.pts, fill, sd + i, f.shade));
      if (faces.silhouette) M(faces.silhouette, w, { closed: true, curve: false });
      const top = faces[faces.length - 1];
      if (top && top.shade === 1) M(top.pts, w * 0.7, { closed: true, curve: false });
    };

    /* ── contact shadow, so nothing floats ──────────────────────────── */
    /* Shadows POOL under the things that cast them. One rectangle across the
       whole drawing is a floor, and the brief said no room. */
    R(View.disc(-32, 22, 20, 22).map(([x, z]) => V.p(x, FLOOR, z)), "cWash", 1, 1, true);
    R(View.disc(2, 52, 17, 22).map(([x, z]) => V.p(x, FLOOR, z)), "cWash", 2, 1, true);
    R(View.disc(31, 22, 12, 22).map(([x, z]) => V.p(x, FLOOR, z)), "cWash", 3, 1, true);

    /* ── the desk ───────────────────────────────────────────────────── */
    /* top slab */
    solid(View.prism(V, View.rect(-46, 8, 36, 32), -3, 0), "cWood", 11, OUT);

    /* three-drawer pedestal, left */
    solid(View.prism(V, View.rect(-44, 10, -20, 30), 0, 33), "cWood", 21, OUT);
    /* drawer fronts are lines on the pedestal's front face, not separate boxes:
       a box per drawer would double every edge */
    [8.5, 19, 29.5].forEach((y, i) => {
      if (i) M(V.seg([-44, y - 10.5, 10], [-20, y - 10.5, 10]), DET);
      const cx = -32, hy = y - 5;
      M(V.seg([cx - 3, hy, 9.6], [cx + 3, hy, 9.6]), DET * 1.2);   // the pull
    });
    /* plinth */
    solid(View.prism(V, View.rect(-45, 9, -19, 31), 33, 38), "cWood", 31, DET);

    /* shallow centre drawer under the top */
    solid(View.prism(V, View.rect(-14, 10, 8, 30), 0, 4), "cWood", 41, DET);
    M(V.seg([-4, 2, 9.8], [2, 2, 9.8]), DET * 1.2);

    /* right end: two legs and the rail between them */
    solid(View.prism(V, View.rect(29, 10, 34, 15), 0, FLOOR), "cWood", 51, OUT);
    solid(View.prism(V, View.rect(29, 26, 34, 31), 0, FLOOR), "cWood", 61, OUT);
    solid(View.prism(V, View.rect(30.5, 15, 32.5, 26), 28, 32), "cWood", 71, DET);

    /* ── the chair, turned so it is not square to the camera ────────── */
    const CX = 2, CZ = 50, TURN = -14;
    const seatFoot = View.turn(View.soft(CX - 12, CZ - 11, CX + 12, CZ + 11, 5), TURN, CX, CZ);
    solid(View.prism(V, seatFoot, 17, 20), "cWood", 81, OUT);

    /* a saddle seat is dished — one line across it says so */
    M([V.p(CX - 8, 17, CZ - 2), V.p(CX, 16.4, CZ), V.p(CX + 8, 17, CZ - 2)], TEX, { curve: true });

    /*
     * The back: a crest rail bowed in PLAN, with spindles rising to it.
     * Drawn as a straight bar it reads as a bench back; the bow is what makes
     * it a Windsor.
     */
    const crest = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10 * 2 - 1;
      const p = View.turn([[CX + t * 11.5, CZ + 8 + 3.4 * (1 - t * t)]], TURN, CX, CZ)[0];
      crest.push([p[0], 0.5 + 1.2 * t * t, p[1]]);
    }
    /* Filled. Drawn as two lines with nothing between them the paper showed
       straight through the rail, which read as a gap in the chair. */
    const crestTop = crest.map((p) => V.p(p[0], p[1], p[2]));
    const crestBot = crest.map((p) => V.p(p[0], p[1] + 2.4, p[2]));
    R(crestTop.concat(crestBot.slice().reverse()), "cWood", 91, 0.88, false);
    M(crestTop, OUT, { curve: true });
    M(crestBot, OUT, { curve: true });
    M([V.p(crest[0][0], crest[0][1], crest[0][2]),
       V.p(crest[0][0], crest[0][1] + 2.4, crest[0][2])], DET);
    M([V.p(crest[10][0], crest[10][1], crest[10][2]),
       V.p(crest[10][0], crest[10][1] + 2.4, crest[10][2])], DET);

    for (let i = 1; i < 10; i++) {
      const c = crest[i];
      const foot = View.turn([[CX + (i / 10 * 2 - 1) * 10.5, CZ + 7]], TURN, CX, CZ)[0];
      M(V.seg([foot[0], 17, foot[1]], [c[0], c[1] + 2.2, c[2]]), DET);
    }

    /* turned legs, splayed — the near pair longer on screen than the far */
    [[-9, -8], [9, -8], [-9, 8], [9, 8]].forEach(([dx, dz]) => {
      const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
      M(V.seg([x, 20, z], [x + dx * 0.42, FLOOR, z + dz * 0.42]), OUT * 0.9);
    });

    /* ── the pitcher, standing on the desk top ──────────────────────── */
    /*
     * A drawn profile, not stacked prisms. A prism cannot taper, so body,
     * rim and foot came out as three cylinders of different diameters and the
     * thing read as a tin can. A pitcher is one silhouette: wide shoulders, a
     * waist, a flared lip.
     */
    const VX = -36, VZ = 20;
    const base = V.p(VX, 0, VZ), vs = V.s(VZ);
    const prof = [[-5.4, 0], [-6.2, -3.5], [-5.6, -8], [-6.4, -12.5], [-7, -15.5],
                  [7, -15.5], [6.4, -12.5], [5.6, -8], [6.2, -3.5], [5.4, 0]];
    const jug = prof.map(([x, y]) => [base[0] + x * vs, base[1] + y * vs]);
    R(jug, "cPot", 101, 1, true);
    M(jug, OUT, { closed: true, curve: true });
    /* the lip, and one facet line down the body */
    M([[base[0] - 6.8 * vs, base[1] - 14 * vs], [base[0] + 6.8 * vs, base[1] - 14 * vs]], DET);
    M([[base[0] - 1.6 * vs, base[1] - 14 * vs], [base[0] - 2.2 * vs, base[1] - 1 * vs]], TEX);

    /*
     * Pothos: vines falling over the LEFT edge of the desk — the only thing
     * that breaks the drawing's long horizontal. Four crossing vines read as
     * a tangle; three that do not cross read as a plant.
     */
    const VINES = [[-20, 30], [-15, 20], [-9, 36]];
    VINES.forEach(([dx, drop], v) => {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        pts.push([base[0] + (dx * t - 2 + v) * vs * (0.6 + 0.4 * t),
                  base[1] - 13 * vs + drop * t * t * vs]);
      }
      M(pts, TEX, { curve: true });
      for (let k = 2; k < pts.length; k += 2) {
        const c = pts[k], side = (k + v) % 2 ? 1 : -1, r = 3.4 * vs;
        const leaf = [[c[0], c[1] - r * 0.9],
                      [c[0] + side * r * 1.1, c[1] - r * 0.2],
                      [c[0] + side * r * 0.7, c[1] + r * 1.0],
                      [c[0] - side * r * 0.15, c[1] + r * 0.6]];
        R(leaf, "cLeaf", 131 + v * 10 + k, null, true);
        M(leaf, TEX * 0.8, { closed: true, curve: true });
      }
    });

    return { marks, regions, tones };
  }

  return { label: "Desk", build, fit: { w: 0.92, h: 0.84 }, pen: 0.17,
           nib: { pressure: 0.1, wander: 0.07, boil: 0.12, overshoot: 0.22,
                  double: false, breaks: 0.03, blobs: 0, specks: 0 } };
})();
