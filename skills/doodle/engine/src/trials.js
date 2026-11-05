/*
 * TRIALS: the second stress set (after src/scapes.js). These are ten subjects that are
 * NOT landscapes, each one picked to break one thing the system has not been asked
 * to do, or has failed at before:
 *
 *   person    figure proportion, clothes on a body           (no figure kit existed)
 *   reader    a figure IN furniture: contact, overlap, soft  (the armchair was broken)
 *   cat       an animal: fur as line, organic mass
 *   bicycle   thin linkages, circles, a hundred thin marks
 *   glass     transparency: the back rim, liquid, refraction
 *   fruit     a heap of round soft things in a bowl, cloth
 *   monstera  split and holed leaves, overlapping            (the monstera was broken)
 *   night     value INVERTED: dark sky in line, light as gaps
 *   rain      weather over a scene, an umbrella, reflections
 *   sneaker   a shoe                                        (three shoes failed before)
 *
 * Authored on the PICTURE PLANE like the still lifes and the scapes: Retro._kit with
 * a square-on camera, x right / y down, back to front, clipped to the first panel.
 * Things use StillLife's stage (lathe, ball, blade, hatch); the night and the rain
 * use the scene kit (depth number d). The figure kit lives here: `figure()`.
 */
window.Trials = (function () {
  const { kit } = Retro._kit;
  const { ov, rect, rot, curve } = StillLife._util;
  const { crescent, mix } = Scapes._util;
  const RAD = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;

  let rs = 5;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  const jit = (a) => (rnd() * 2 - 1) * a;

  /* both edges of a strip along a curve, w0 → w1 wide */
  const edges = (pts, w0, w1) => {
    const L = [], R = [], N = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1 == null ? w0 : w1, i / (pts.length - 1)) / 2;
      const nx = -dy / m, ny = dx / m;
      L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]); N.push([nx, ny]);
    });
    return { L, R, N };
  };

  /*
   * A HOLE in a fill: a keyhole. The outer ring runs to the point nearest the hole,
   * goes round the hole the other way, and comes back along the same seam. The fill
   * shows what is behind through the hole, the hatch skips it, and occlusion uses
   * the true shape. Painting the hole in the wall colour lies the moment anything
   * stands behind it: a leaf behind a leaf, a moon behind a hatched sky.
   */
  const area = (p) => p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0);
  const keyhole = (outer, hole) => {
    /* the hole must wind against the outer ring, or a nonzero fill paints it */
    if (Math.sign(area(hole)) === Math.sign(area(outer))) hole = hole.slice().reverse();
    let bi = 0, bj = 0, bd = Infinity;
    outer.forEach((p, i) => hole.forEach((h, j) => {
      const d = Math.hypot(p[0] - h[0], p[1] - h[1]); if (d < bd) { bd = d; bi = i; bj = j; }
    }));
    const H = hole.slice(bj).concat(hole.slice(0, bj + 1));
    return outer.slice(0, bi + 1).concat(H, outer.slice(bi));
  };
  const holes = (outer, list) => list.reduce((o, h) => keyhole(o, h), outer);

  /* the extra helpers every trial gets, on top of the still-life stage */
  function extend(S) {
    const k = S.k, HW = () => k.TEX * 0.62;
    /*
     * A LIMB: one strip through its joints (shoulder, elbow, wrist), never two strips
     * meeting at a joint, so the elbow cannot show a seam. Outlined along its two
     * sides only; the ends are covered by whatever they plug into (torso, hand, shoe).
     * The shadow side (away from the upper-left light) gets a darker strip AND hatch.
     */
    S.limb = (joints, w0, w1, fill, o) => {
      o = o || {};
      const C = curve(joints, 7), { L, R, N } = edges(C, w0, w1);
      S.F(L.concat(R.slice().reverse()), fill, { w: 0 });
      const nx = N.reduce((s, n) => s + n[0] + n[1] * 0.4, 0);
      const far = nx > 0 ? L : R;
      const mid = C.map((p, i) => [lerp(p[0], far[i][0], 0.3), lerp(p[1], far[i][1], 0.3)]);
      const strip = far.concat(mid.reverse());
      if (o.shade !== false) {
        S.F(strip, fill, { w: 0, sh: o.sh || 0.82 });
        S.hatch(strip, { gap: o.gap || 1.05, ang: o.ang == null ? 60 : o.ang, w: HW() * 0.9 });
      }
      if (o.tone) S.hatch(L.concat(R.slice().reverse()), o.tone);
      const w = o.w == null ? k.OUT * 0.9 : o.w;
      S.L(L, w, { curve: true }); S.L(R, w, { curve: true });
      if (o.cap) S.L([L[L.length - 1], R[R.length - 1]], k.DET);
      return { C, L, R };
    };
    /* a closed soft shape: fill, a crescent of shade + hatch, an outline */
    S.soft = (pts, fill, o) => {
      o = o || {};
      const sil = o.raw ? pts : curve(pts, o.n || 6, true);
      S.F(sil, fill, { w: 0, sh: o.base });
      if (o.shade !== false) {
        let cx = 0, cy = 0; sil.forEach(([x, y]) => { cx += x / sil.length; cy += y / sil.length; });
        /* start the outline OUTSIDE the shaded run, so the run is contiguous: an
           ellipse from ov() starts at angle 0, inside the shade, and the crescent
           folded into a sliver across the whole shape (a stray dotted diagonal) */
        const L0 = (o.light == null ? 225 : o.light) + 180, Dx = Math.cos(L0 * RAD), Dy = Math.sin(L0 * RAD);
        const lit = (q) => ((q[0] - cx) * Dx + (q[1] - cy) * Dy) / (Math.hypot(q[0] - cx, q[1] - cy) || 1) < -0.05;
        let st0 = sil.findIndex((q, i) => lit(q) && !lit(sil[(i + 1) % sil.length]));
        const silR = st0 < 0 ? sil : sil.slice(st0 + 1).concat(sil.slice(0, st0 + 1));
        const cr = crescent(silR, cx, cy, o.depth || 0.34, o.light);
        S.F(cr, fill, { w: 0, sh: o.sh || 0.8 });
        S.hatch(cr, { gap: o.gap || 1.15, ang: o.ang == null ? 60 : o.ang, cross: o.cross, w: HW() * 0.9 });
      }
      if (o.tone) S.hatch(sil, o.tone);
      S.L(sil, o.w == null ? k.OUT : o.w, { closed: true, curve: true });
      return sil;
    };
    /* a fold or crease: a short tapered curve */
    S.fold = (pts, w) => S.L(curve(pts, 4), w || k.TEX * 0.85, { curve: true, taper: [0.3, 1] });
    /* a soft contact shadow on the floor: hatch, no outline */
    S.pool = (cx, cy, rx, ry, o) => {
      const p = ov(cx, cy, rx, ry, 0, 360, 28);
      S.F(p, (o && o.fill) || "#00000014", { w: 0 });
      S.hatch(p, { gap: 1.1, ang: 20, w: HW() * 0.8, rag: 1.2, ...(o || {}) });
    };
    S.keyhole = keyhole; S.holes = holes;
    /*
     * S.xf(fn): the same stage with every point passed through fn (an affine map).
     * When the proportions are wrong (a shoe too long and too low), restretch the
     * whole drawing in one line instead of retyping a hundred coordinates.
     */
    S.xf = (fn) => {
      const T = (p) => p.map(fn), X = Object.create(S);
      X.F = (p, f, o) => S.F(T(p), f, o);
      X.L = (p, w, x) => S.L(T(p), w, x);
      X.hatch = (p, o) => S.hatch(T(p), o);
      X.soft = (p, f, o) => S.soft(T(p), f, o);
      X.fold = (p, w) => S.fold(T(p), w);
      X.limb = (j, a, b, f, o) => S.limb(T(j), a, b, f, o);
      X.pool = (cx, cy, rx, ry, o) => { const [a, b] = fn([cx, cy]); const [c] = fn([cx + rx, cy]); S.pool(a, b, Math.abs(c - a), ry, o); };
      return X;
    };
    return S;
  }

  /* ── THE FIGURE KIT ───────────────────────────────────────────────────── */
  /*
   * A body in units of its own height (head top 0, sole 100), seen from the front.
   * 7.4 heads tall: the head is 13.5, the shoulders at 18, the hip joint at 51,
   * the knee at 73, the wrist hangs at the hip line (50). Those four ratios are
   * what make a figure read as an adult. Get them wrong and no detail saves it.
   * A pose is a set of joint overrides; the parts draw themselves from the joints.
   */
  const STAND = {
    head: [0, 7.2], neck: [0, 14.6],
    shL: [-10.2, 18.6], shR: [10.2, 18.2], elL: [-12.6, 35], elR: [12.4, 35.4],
    wrL: [-13, 50], wrR: [13.6, 49.6], hipL: [-6.6, 51], hipR: [6.6, 51],
    knL: [-5.6, 73], knR: [5.2, 73], anL: [-5.2, 94.2], anR: [4.8, 94.4],
  };
  function figure(S, x, gy, h, C, o) {
    o = o || {};
    const k = S.k, J = { ...STAND, ...(o.J || {}) }, u = h / 100, TN = o.tone;
    const P = (p) => [x + p[0] * u, gy - h + p[1] * u];
    const j = (n) => P(J[n]);
    const W = (v) => v * u;
    if (o.behind) o.behind(P, J);
    /* legs: trousers or tights, hip → knee → ankle */
    const legW = o.legW || [8.4, 5.2];
    if (!o.seated) {
      for (const s of ["L", "R"]) {
        S.limb([j("hip" + s), j("kn" + s), j("an" + s)], W(legW[0]), W(legW[1]), C.bottom, { gap: 1.1, tone: TN });
        const kn = j("kn" + s), sg = s === "L" ? -1 : 1;
        S.fold([[kn[0] - W(2) * sg, kn[1] - W(1)], [kn[0], kn[1] + W(0.6)], [kn[0] + W(1.6) * sg, kn[1]]]);
        const an = j("an" + s);
        S.fold([[an[0] - W(2.4), an[1] - W(2.6)], [an[0], an[1] - W(1.8)], [an[0] + W(2.2), an[1] - W(2.8)]]);
      }
      /* the crotch: one patch so the legs read as one garment */
      S.F(curve([P([-8.6, 50]), P([8.6, 50]), P([7.6, 57]), P([0, 59.5]), P([-7.6, 57])], 4, true), C.bottom, { w: 0 });
      S.L(curve([P([0, 53]), P([0, 59.5]), P([0.6, 62])], 3), k.TEX, { curve: true });
    }
    if (o.lower) o.lower(P, J);
    /* shoes: a front-view shoe is wider than the ankle and sits ON the ground line */
    if (!o.noShoes) for (const s of ["L", "R"]) {
      const an = j("an" + s), sg = s === "L" ? -1 : 1, base = o.seated ? an[1] + W(5.6) : gy;
      const shoe = curve([[an[0] - W(3.2), an[1] - W(0.8)], [an[0] + W(3.2), an[1] - W(0.8)], [an[0] + W(3.8) + sg * W(1.4), base - W(1.4)],
        [an[0] + sg * W(1.2), base], [an[0] - W(3.6) + sg * W(1.4), base - W(1.2)]], 5, true);
      S.soft(shoe, C.shoe, { raw: true, depth: 0.3, w: k.OUT * 0.9, tone: TN });
      S.L([[an[0] - W(3.4) + sg * W(1), base - W(0.9)], [an[0] + W(3.4) + sg * W(1), base - W(0.9)]], k.TEX);
    }
    /* neck, then the top over it */
    S.limb([P([0, 11]), P([0, 17])], W(4.4), W(4.6), C.skin, { shade: false, w: k.DET });
    const tp = J.top || [
      J.shL, [-3.8, 15.4], [3.8, 15.4], J.shR, [9.4, 27], [8.2, 41], [9, o.hem || 55],
      [-9, o.hem || 55], [-8.2, 41], [-9.4, 27]];
    const torso = curve(tp.map(P), 4, true);
    S.soft(torso, C.top, { raw: true, depth: 0.28, gap: 1.1, tone: TN });
    S.L(curve([P([-3.8, 15.4]), P([0, 19]), P([3.8, 15.4])], 4), k.DET, { curve: true });
    S.fold([P([8.6, 27]), P([5.6, 33]), P([6, 39])]);
    S.fold([P([-8.6, 28]), P([-6, 32])]);
    if (C.stripe) for (let y = 24; y < (o.hem || 55) - 1; y += 4.2)
      S.L(curve([P([-9, y]), P([0, y + 1]), P([9, y])], 4), k.TEX * 0.9, { curve: true });
    if (o.torso) o.torso(P, J);
    /* arms: one sleeve each, then the hand */
    for (const s of ["L", "R"]) {
      if (o.skipArm && o.skipArm.includes(s)) continue;
      const arm = [j("sh" + s), j("el" + s), j("wr" + s)];
      const sl = S.limb(arm, W(5.8), W(4.2), C.sleeve || C.top, { gap: 1.0, tone: TN });
      const el = j("el" + s);
      S.fold([[el[0] - W(1.6), el[1] - W(1.4)], [el[0], el[1]], [el[0] + W(1.4), el[1] - W(1)]]);
      if (C.stripe) for (let f = 0.3; f < 0.95; f += 0.16) {
        const i = Math.round(f * (sl.L.length - 1));
        S.L([sl.L[i], sl.R[i]], k.TEX * 0.9);
      }
      const wr = j("wr" + s), el2 = j("el" + s), d = Math.atan2(wr[1] - el2[1], wr[0] - el2[0]);
      const hand = rot(curve([[wr[0] - W(0.5), wr[1] - W(2)], [wr[0] + W(4.8), wr[1] - W(2.2)], [wr[0] + W(6.6), wr[1]],
        [wr[0] + W(4.6), wr[1] + W(2.2)], [wr[0] - W(0.5), wr[1] + W(1.9)]], 4, true), wr[0], wr[1], d / RAD);
      if (!o.noHands) { S.F(hand, C.skin, { w: 0 }); S.L(hand, k.DET, { closed: true, curve: true }); }
      S.L(sl.L.slice(-2).concat([sl.R[sl.R.length - 1]]), k.DET);
    }
    if (o.arms) o.arms(P, J);
    /* head: hair behind, face, ear, hair in front */
    const hd = j("head"), tilt = o.headTilt || 0;
    const back = C.hairBack !== false && curve([P([-6.4, 3]), P([0, -1]), P([6.4, 3]), P([6.6, o.hairLen || 13]), P([-6.6, o.hairLen || 13])], 5, true);
    if (back) S.F(back, C.hair, { w: 0 });
    /* long hair: outline its two SIDES only. A closed outline round the back
       hair reads as a hood the moment the fill drops (line only). */
    if (back && o.hairLen > 15) for (const sg of [-1, 1]) S.L(curve([P([sg * 6.2, 4]), P([sg * 6.9, 10]), P([sg * 6.6, o.hairLen])], 4), k.OUT * 0.85, { curve: true });
    const face = rot(ov(hd[0], hd[1], W(5.1), W(6.7), 0, 360, 30), hd[0], hd[1], tilt);
    S.F(face, C.skin, { w: 0 });
    if (TN) S.hatch(face, TN);
    S.F(rot(crescent(face, hd[0], hd[1], 0.22), hd[0], hd[1], 0), C.skin, { w: 0, sh: 0.86 });
    S.L(face, k.OUT, { closed: true, curve: true });
    S.F(ov(hd[0] + W(5.1), hd[1] + W(0.6), W(1), W(1.7)), C.skin, { w: k.DET });
    if (!o.noFace) {
      const ey = hd[1] + W(0.6) + (o.look || 0) * W(1.4);
      S.L([[hd[0] - W(2.6), ey], [hd[0] - W(1.3), ey]], k.DET * 1.2);
      S.L([[hd[0] + W(1.3), ey], [hd[0] + W(2.6), ey]], k.DET * 1.2);
      S.L([[hd[0] - W(0.1), ey + W(0.7)], [hd[0] - W(0.6), ey + W(2.5)], [hd[0] + W(0.3), ey + W(2.7)]], k.TEX);
      S.L(curve([[hd[0] - W(1.2), ey + W(4.1)], [hd[0], ey + W(4.5)], [hd[0] + W(1.1), ey + W(4.1)]], 3), k.TEX, { curve: true });
    }
    /* the hair mass that sits over the brow: a shape, its parting, strand lines */
    const hairTop = curve([P([-5.8, 9]), P([-6, 3.4]), P([-2.6, -0.3]), P([2.8, -0.2]), P([6, 3.6]), P([5.8, 8]),
      P([4.4, 4.2]), P([1.6, 3]), P([-1.4, 4.4]), P([-4.2, 5])], 5, true);
    S.soft(hairTop, C.hair, { raw: true, depth: 0.3, gap: 0.9, tone: TN });
    for (const st of [[[-4.6, 3], [-1.6, 0.8], [1.6, 0.6]], [[-5.2, 6], [-4.4, 2.6], [-1.2, 1.2]], [[1.4, 1], [4.4, 2.2], [5.2, 6]]])
      S.fold(st.map(P), k.TEX);
    if (o.hairLen > 15) for (const sg of [-1, 1]) S.fold([P([sg * 5.8, 8]), P([sg * 6.3, 13]), P([sg * 5.6, o.hairLen - 1])], k.TEX);
    if (o.front) o.front(P, J);
  }

  const D = {}, NAMES = {}, ASPECT = {}, CLASS = {};
  const def = (key, name, asp, cls, fn) => { D[key] = fn; NAMES[key] = name; ASPECT[key] = asp; CLASS[key] = cls || "object"; };

  /* ── 1 · A person, standing ───────────────────────────────────────────── */
  def("person", "Person with a tote", 0.7, "object", (S) => {
    const W = 70;
    S.panel(0, 0, W, 100, "#FFFFFF");
    S.pool(36, 95, 16, 2.6);
    People.figure(S, { x: 35, gy: 95, h: 86, pose: "stand",
      look: { build: "f", skin: "#E2B48E", hair: "#3A2A22", hairStyle: "long", top: "#D9A23B", topStyle: "long", bottom: "#4A6A93", shoe: "#F4F1EA" },
      extras: [{ z: 0.5, draw: (J, P3, sc) => {
        /* the tote hangs from the right shoulder: after the torso, before the arm */
        const sh = P3(J.shR), hp = P3(J.hipR), x0 = hp[0] + 1 * sc, y0 = hp[1] - 13 * sc;
        const bag = [[x0, y0], [x0 + 14 * sc, y0 - 0.6 * sc], [x0 + 15 * sc, y0 + 22 * sc], [x0 + 0.4 * sc, y0 + 22.6 * sc]];
        S.soft(bag, "#E9DCC2", { raw: true, depth: 0.3, w: S.k.OUT * 0.9 });
        S.fold([[x0 + 4 * sc, y0 + 6 * sc], [x0 + 5 * sc, y0 + 14 * sc], [x0 + 4.4 * sc, y0 + 20 * sc]]);
        S.L(curve([[x0 + 2 * sc, y0], [sh[0] - 0.4 * sc, y0 - 10 * sc], [sh[0] - 3 * sc, sh[1] - 2 * sc]], 4), S.k.DET * 1.4, { curve: true });
        S.L(curve([[x0 + 12 * sc, y0 - 0.4 * sc], [sh[0] + 5 * sc, y0 - 10 * sc], [sh[0] - 1 * sc, sh[1] - 2.6 * sc]], 4), S.k.DET * 1.4, { curve: true });
      } }] });
  });

  /* ── 2 · Someone reading in an armchair ───────────────────────────────── */
  /*
   * A figure IN furniture, on the People kit. The chair is DERIVED from the
   * sitter's joints, drawn as `extras` at depths around the body:
   *   seat top = just under the hip joints; seat width = hips plus a hand each side;
   *   arm tops = elbow height; the back reaches the shoulder blades.
   * A chair drawn first and filled with a figure afterwards swallowed it (round 1).
   */
  def("reader", "Reading in an armchair", 1, "object", (S) => {
    const k = S.k, CH = "#6E8C7A", FLOOR = 95;
    S.panel(0, 0, 100, 100, "#FFFFFF");
    S.L([[0, FLOOR - 7], [100, FLOOR - 7]], k.TEX);
    S.pool(50, FLOOR + 0.6, 36, 2.4);
    const look = { build: "m", skin: "#C98E68", hair: "#1F1A18", hairStyle: "short", top: "#B8564A", topStyle: "long", bottom: "#3F4756", shoe: "#2C2C30" };
    const chair = (J, P3, sc) => {
      const hl = P3(J.hipL), hr = P3(J.hipR), el = P3(J.elL), cx = (hl[0] + hr[0]) / 2;
      const seatY = hl[1] + 3.6 * sc, armIn = (hr[0] - hl[0]) / 2 + 8.4 * sc, armOut = armIn + 9 * sc;
      return { cx, seatY, armIn, armOut, armTop: el[1] + 1.2 * sc, backTop: P3(J.head)[1] - 2 * sc, apron: seatY + 10 * sc };
    };
    People.figure(S, { x: 50, gy: FLOOR, h: 92, lookDown: true, look,
      /* hands that HOLD something are drawn by the thing held (thumbs over its edge) */
      pose: { ...People.POSES.sitFront, handL: { hide: true }, handR: { hide: true } },
      extras: [
        { z: -30, draw: (J, P3, sc) => {        /* back and seat: behind everything */
          const c = chair(J, P3, sc), X = (v) => c.cx + v;
          S.soft([[X(-c.armIn - 1), c.seatY], [X(-c.armIn - 2), c.backTop + 6], [X(-c.armIn * 0.6), c.backTop], [X(c.armIn * 0.6), c.backTop], [X(c.armIn + 2), c.backTop + 6], [X(c.armIn + 1), c.seatY]], CH, { depth: 0.16, n: 5 });
          S.fold([[X(-c.armIn * 0.5), c.backTop + 5], [c.cx, c.backTop + 3], [X(c.armIn * 0.5), c.backTop + 5]]);
          S.soft([[X(-c.armIn), c.seatY - 1.5], [X(c.armIn), c.seatY - 1.5], [X(c.armIn), c.seatY + 4], [X(-c.armIn), c.seatY + 4]], mix(CH, "#FFFFFF", 0.1), { depth: 0.2, n: 3 });
          const apron = curve([[X(-c.armOut), c.seatY + 4], [X(c.armOut), c.seatY + 4], [X(c.armOut), c.apron], [X(-c.armOut), c.apron]], 3, true);
          S.F(apron, mix(CH, "#000000", 0.1), { w: k.OUT }); S.hatch(apron, { gap: 1.2, ang: 70 });
          for (const x of [X(-c.armOut + 3), X(c.armOut - 3)]) S.F(rect(x - 1.3, c.apron, x + 1.3, FLOOR - 0.4), "#7A5A3C", { w: k.DET });
        } },
        { z: 6, draw: (J, P3, sc) => {          /* the chair's arms: in front of the hips, beside the thighs */
          const c = chair(J, P3, sc);
          for (const s of [-1, 1]) {
            const xa = c.cx + Math.min(s * c.armIn, s * c.armOut), xb = c.cx + Math.max(s * c.armIn, s * c.armOut), mx = (xa + xb) / 2, rx = (xb - xa) / 2;
            S.soft(curve([[xa, c.armTop + 2], [mx, c.armTop - 1.4], [xb, c.armTop + 2], [xb, c.apron], [xa, c.apron]], 3, true), CH, { raw: true, depth: 0.28 });
            S.L(ov(mx, c.armTop + 2, rx, 2.2, 180, 360, 12), k.DET, { curve: true });
          }
        } },
        { z: (J, Z) => Math.max(Z(J.wrL), Z(J.wrR)) + 1.2, draw: (J, P3, sc) => {   /* the open book, at the hands */
          const a = P3(J.wrL), b = P3(J.wrR), cx = (a[0] + b[0]) / 2, by = Math.min(a[1], b[1]) - 3 * sc, bw = Math.abs(b[0] - a[0]) / 2 + 2.6 * sc, bh = 11 * sc;
          S.F([[cx - bw - 1, by], [cx + bw + 1, by], [cx + bw + 0.2, by + bh + 0.6], [cx, by + bh + 2.6], [cx - bw - 0.2, by + bh + 0.6]], "#5C3E2E", { w: k.OUT });
          const pl = [[cx - bw, by - 1], [cx, by + 1.4], [cx, by + bh + 1.4], [cx - bw + 0.8, by + bh - 1]];
          const pr = [[cx, by + 1.4], [cx + bw, by - 1], [cx + bw - 0.8, by + bh - 1], [cx, by + bh + 1.4]];
          for (const pg of [pl, pr]) { S.F(pg, "#F6F1E6", { w: 0 }); S.L(pg, k.DET, { closed: true }); }
          for (let i = 0; i < 6; i++) {
            const f = 0.18 + i * 0.12, yl = lerp(by - 1, by + bh - 1, f) + 0.6, yr = lerp(by + 1.4, by + bh + 1.4, f);
            S.L([[cx - bw + 1.4, yl], [cx - 1.4, yr]], k.TEX * 0.7); S.L([[cx + 1.4, yr], [cx + bw - 1.4, yl]], k.TEX * 0.7);
          }
          S.L([[cx, by + 1.4], [cx, by + bh + 1.4]], k.DET);
          for (const sg of [-1, 1]) {
            const hx = cx + sg * (bw - 0.4), hy = by + bh * 0.55;
            const hand = curve([[hx + sg * 3.2, hy - 2.4], [hx - sg * 1.6, hy - 2.6], [hx - sg * 2, hy + 0.6], [hx + sg * 0.4, hy + 3], [hx + sg * 3.2, hy + 2.6]], 3, true);
            S.F(hand, look.skin, { w: 0 }); S.L(hand, k.DET, { closed: true, curve: true });
            S.L([[hx + sg * 0.6, hy - 0.8], [hx - sg * 1.2, hy - 0.6]], k.TEX * 0.8);
          }
        } },
      ] });
  });

  /* ── 3 · A cat, sitting ───────────────────────────────────────────────── */
  def("cat", "A sitting cat", 1, "object", (S) => {
    const k = S.k, FUR = "#D08A45", PALE = "#F4E6D2", STR = "#8E4E22";
    S.panel(0, 0, 100, 100, "#FFFFFF");
    S.pool(54, 89, 30, 3.4);
    /* the haunch and back: one pear, then the haunch as its own round */
    const body = S.soft([[48, 38], [62, 42], [72, 58], [75, 76], [70, 88], [52, 90], [36, 88], [32, 76], [35, 56], [41, 44]], FUR, { depth: 0.3 });
    S.soft([[60, 66], [70, 64], [77, 74], [74, 86], [62, 89], [55, 82], [55, 72]], FUR, { depth: 0.36 });
    /* tabby stripes: curved bands across the form, the line twin of the fur's value */
    for (const st of [[[56, 46], [62, 50], [66, 47]], [[62, 54], [68, 58], [71, 55]], [[66, 62], [72, 66], [74, 63]], [[62, 72], [68, 70], [72, 74]], [[60, 80], [66, 78], [70, 82]]])
      S.L(curve(st, 4), k.DET * 1.5, { curve: true, taper: [0.3, 0.3] });
    /* the chest bib, pale, with fur ticks along its edge */
    const bib = curve([[38, 46], [48, 44], [52, 56], [50, 72], [41, 74], [36, 62]], 5, true);
    S.F(bib, PALE, { w: 0 });
    for (let i = 0; i < 9; i++) { const y = 50 + i * 2.6, x = 39 + Math.sin(i) * 1.2; S.L([[x, y], [x + 1.6, y + 1.4]], k.TEX); }
    /* front legs: two straight columns, paws with toes */
    for (const lx of [41.5, 50]) {
      S.limb([[lx, 64], [lx - 0.4, 76], [lx - 0.2, 86]], 6.4, 5.6, lx < 45 ? PALE : FUR, { gap: 1.0 });
      const paw = ov(lx - 0.4, 87.4, 3.8, 2.2, 0, 360, 18);
      S.F(paw, lx < 45 ? PALE : FUR, { w: 0 }); S.L(paw, k.OUT * 0.9, { closed: true, curve: true });
      for (const dx of [-1.2, 1.2]) S.L([[lx - 0.4 + dx, 86.2], [lx - 0.4 + dx, 88.6]], k.TEX);
    }
    /* the tail wraps round the front of the paws: drawn last of the body */
    const tail = edges(curve([[70, 86], [64, 91], [50, 92.4], [38, 91], [31, 87]], 6), 5.6, 3.4);
    const tp = tail.L.concat(tail.R.slice().reverse());
    S.F(tp, FUR, { w: 0 }); S.L(tp, k.OUT * 0.9, { closed: true, curve: true });
    for (const x of [62, 54, 46, 39]) S.L([[x, 89.6], [x - 0.8, 93.8]], k.DET * 1.3);
    /* the head: a round, the cheek ruff as a jagged lower edge, ears */
    for (const [a, b, c] of [[[34.6, 24], [33, 8], [44, 18.4]], [[51, 18], [60, 8.6], [60.6, 25]]]) {
      S.F([a, b, c], FUR, { w: 0 }); S.L([a, b, c], k.OUT, { closed: true });
      const ia = [lerp(a[0], b[0], 0.2) + 1, lerp(a[1], b[1], 0.2)], ib = [lerp(b[0], c[0], 0.15), lerp(b[1], c[1], 0.15) + 2], ic = [lerp(c[0], a[0], 0.2), lerp(c[1], a[1], 0.2) - 1];
      S.F([ia, ib, ic], "#E9A79A", { w: 0 }); S.L([ia, ib, ic], k.TEX, { closed: true });
    }
    const head = [];
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * 360, r = a > 20 && a < 160 ? 1 + 0.06 * (i % 2) : 1;
      head.push([47.6 + Math.cos(a * RAD) * 14.4 * r, 28.4 + Math.sin(a * RAD) * 12 * r]);
    }
    S.F(head, FUR, { w: 0 });
    S.F(crescent(head, 47.6, 28.4, 0.24), FUR, { w: 0, sh: 0.82 });
    S.hatch(crescent(head, 47.6, 28.4, 0.24), { gap: 1.1, ang: 60, w: k.TEX * 0.55 });
    const muzzle = curve([[42, 33.6], [47.6, 31.4], [53.4, 33.6], [52.6, 38.6], [47.6, 40], [42.6, 38.6]], 4, true);
    S.F(muzzle, PALE, { w: 0 });
    S.L(head, k.OUT, { closed: true });
    /* the forehead M, the face: almond eyes with slit pupils, nose, mouth, whiskers */
    S.L([[42, 21], [44, 17], [46, 21], [48, 16], [50, 21], [52, 17], [54, 21]], k.DET * 1.2, { taper: [0.4, 0.4] });
    for (const ex of [41.4, 54]) {
      const eye = [[ex - 3.4, 28], [ex, 25.6], [ex + 3.4, 28], [ex, 30]];
      const e2 = curve(eye, 4, true);
      S.F(e2, "#C5C25A", { w: 0 }); S.L(e2, k.DET, { closed: true, curve: true });
      S.F(ov(ex, 27.9, 0.7, 2), "#1B1B1B", { w: 0 });
    }
    S.F([[46, 33.4], [49.2, 33.4], [47.6, 35.2]], "#C77B78", { w: k.TEX });
    S.L(curve([[44.8, 37.2], [46.4, 37.8], [47.6, 35.2]], 3), k.TEX, { curve: true });
    S.L(curve([[47.6, 35.2], [48.8, 37.8], [50.4, 37.2]], 3), k.TEX, { curve: true });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x0 = 47.6 + s * 5.2, y0 = 35.6 + i * 1.1;
      S.L(curve([[x0, y0], [x0 + s * 9, y0 - 1.4 + i * 1.3], [x0 + s * 16, y0 - 0.6 + i * 2.6]], 4), k.TEX * 0.7, { curve: true, taper: [1, 0.2] });
    }
    /* cheek fur: a few ticks breaking the jaw line */
    for (const [x, y, dx] of [[34, 32, -1.6], [34.6, 35, -1.6], [61, 32, 1.6], [60.4, 35, 1.6]]) S.L([[x, y], [x + dx, y + 1.4]], k.TEX);
    void body; void STR;
  });

  /* ── 4 · A bicycle ────────────────────────────────────────────────────── */
  def("bicycle", "Bicycle, side on", 1.5, "object", (S) => {
    const k = S.k, FR = "#2E7D74", TY = "#2A2A2A";
    S.panel(0, 0, 150, 100, "#FFFFFF");
    S.L([[0, 86], [150, 86]], k.TEX);
    const RH = [40, 66], FH = [110, 66], R = 20, BB = [70, 69], ST = [62, 38], HT = [100, 36], HB = [102.6, 46];
    S.pool(75, 86.6, 58, 1.8);
    /* WHEELS first: tyre (two rings), rim, spokes (thin, the hundred-mark test), hub */
    const wheel = ([cx, cy]) => {
      const tyre = ov(cx, cy, R, R, 0, 360, 48), rim = ov(cx, cy, R - 2.2, R - 2.2, 0, 360, 48);
      /* a tyre is a RING: a keyhole fill, so the wheel's inside stays open */
      S.F(holes(tyre, [rim]), TY, { w: 0 });
      S.L(tyre, k.OUT, { closed: true, curve: true });
      S.L(rim, k.DET, { closed: true, curve: true });
      S.L(ov(cx, cy, R - 3.2, R - 3.2, 0, 360, 48), k.TEX * 0.8, { closed: true, curve: true });
      S.hatch(holes(tyre, [rim.slice().reverse()]), { gap: 0.55, ang: 45, w: k.TEX * 0.7, min: 0.2 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2, off = (i % 2 ? 1 : -1) * 1.2;
        S.L([[cx + Math.cos(a + 0.1) * off, cy + Math.sin(a + 0.1) * off], [cx + Math.cos(a) * (R - 3.2), cy + Math.sin(a) * (R - 3.2)]], k.TEX * 0.55);
      }
      S.F(ov(cx, cy, 2, 2), "#BFC3C6", { w: k.DET });
    };
    wheel(RH); wheel(FH);
    /* the drive: chain from ring to cog, BEHIND the frame */
    S.L([[RH[0], RH[1] - 3], [BB[0], BB[1] - 6.6]], k.DET);
    S.L([[RH[0], RH[1] + 3], [BB[0], BB[1] + 6.6]], k.DET);
    S.F(ov(RH[0], RH[1], 3.2, 3.2), "#9A9EA2", { w: k.DET });
    /* FRAME: every tube one strip of constant width; joints are where strips cross */
    const tube = (a, b, w, c) => S.limb([a, b], w || 2.2, w || 2.2, c || FR, { shade: false, w: k.DET * 1.1 });
    tube(RH, ST, 1.7); tube(RH, BB, 1.8);
    tube(BB, ST, 2.6); tube(ST, HT, 2.4); tube(BB, HB, 2.8);
    tube(HT, HB, 3.4);
    S.limb(curve([HB, [106, 56], [109, 64], FH], 2), 2.2, 1.8, FR, { shade: false, w: k.DET * 1.1 });
    /* mudguard over the front wheel: an arc strip */
    const mg = edges(ov(FH[0], FH[1], R + 2.2, R + 2.2, 200, 330, 24), 1.6, 1.6);
    S.F(mg.L.concat(mg.R.slice().reverse()), "#D9D4C8", { w: k.DET });
    /* the chainring, crank and pedal, in front of the frame */
    S.F(ov(BB[0], BB[1], 7, 7, 0, 360, 30), "#B9BDC0", { w: k.DET });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; S.L([[BB[0], BB[1]], [BB[0] + Math.cos(a) * 5.6, BB[1] + Math.sin(a) * 5.6]], k.TEX); }
    S.L(ov(BB[0], BB[1], 7.8, 7.8, 0, 360, 36), k.TEX * 0.6, { closed: true, dash: true });
    tube(BB, [76, 81], 2, "#5C6064");
    S.F(rect(72.6, 80.4, 80.4, 83), "#2A2A2A", { w: k.DET });
    /* seatpost, saddle; stem, bars, grip; a basket on the front */
    tube(ST, [60.6, 30], 1.8, "#8E9296");
    const saddle = curve([[50, 27.6], [58, 26.4], [68, 27], [66.6, 30.2], [56, 31.2], [50.6, 30]], 4, true);
    S.soft(saddle, "#5A3A2A", { raw: true, depth: 0.3 });
    tube(HT, [99, 29], 2, "#8E9296");
    S.limb(curve([[99, 29.4], [93, 28], [88, 30.6]], 3), 2, 2, "#8E9296", { shade: false, w: k.DET });
    S.limb([[88, 30.6], [84.4, 32]], 3, 3, "#5A3A2A", { shade: false, w: k.DET, cap: true });
    const bk = [[104, 26], [124, 26], [122, 42], [106, 42]];
    S.F(bk, "#D7B47E", { w: 0 });
    for (let i = 1; i < 6; i++) S.L([[lerp(104, 106, i / 6) + i * 3.2, 26], [lerp(106, 104, 0) + i * 3.0, 42]], k.TEX);
    for (let y = 30; y < 42; y += 3.6) S.L([[104.4 + (y - 26) * 0.12, y], [123.6 - (y - 26) * 0.12, y]], k.TEX);
    S.L(bk, k.OUT * 0.9, { closed: true });
    S.L([[102.4, 34], [106, 35]], k.DET);
  });

  /* ── 5 · Glass: a wine glass and a carafe of water ────────────────────── */
  def("glass", "Wine glass and a carafe", 1.2, "object", (S) => {
    const k = S.k, q = 0.22;
    S.panel(0, 0, 120, 100, "#FFFFFF");
    S.F(rect(0, 72, 120, 100), "#E8D9C0", { w: 0 });
    S.L([[0, 72], [120, 72]], k.DET);
    for (const y of [80, 89, 97]) S.L([[0, y], [120, y + 0.6]], k.TEX * 0.6, { taper: [0.3, 0.3] });
    /*
     * TRANSPARENCY, in line:
     *   - the far rim is a FULL ellipse (you see it through the glass), the near
     *     half heavier than the far half;
     *   - the wall has a thickness: a second, thin contour just inside the outline;
     *   - whatever crosses behind (the table edge) is drawn THROUGH, shifted where
     *     it passes behind water, which is what says "refraction";
     *   - the liquid is the one opaque value: wine is cross-hatched, water is not.
     */
    const glassBody = (cx, gy, prof, o) => {
      const sil = prof.map(([h, r]) => [cx + r, gy - h]).concat(prof.slice().reverse().map(([h, r]) => [cx - r, gy - h]));
      S.F(sil, "#F2F6F6AA", { w: 0 });
      S.L(prof.map(([h, r]) => [cx + r, gy - h]), k.OUT, { curve: true });
      S.L(prof.map(([h, r]) => [cx - r, gy - h]), k.OUT, { curve: true });
      if (o.inner) {
        S.L(prof.filter(([h]) => h > o.inner[0] && h < o.inner[1]).map(([h, r]) => [cx + r - 0.9, gy - h]), k.TEX * 0.7, { curve: true });
        S.L(prof.filter(([h]) => h > o.inner[0] && h < o.inner[1]).map(([h, r]) => [cx - r + 0.9, gy - h]), k.TEX * 0.7, { curve: true });
      }
      const [th, tr] = prof[0];
      S.L(ov(cx, gy - th, tr, tr * q, 0, 180, 20), k.DET, { curve: true });
      S.L(ov(cx, gy - th, tr, tr * q, 180, 360, 20), k.TEX, { curve: true });
      return sil;
    };
    const fillTo = (cx, gy, prof, hl, fill, o) => {
      const sub = prof.filter(([h]) => h <= hl), r0 = (() => { for (let i = 0; i < prof.length - 1; i++) { const [h0, a] = prof[i], [h1, b] = prof[i + 1]; if (hl <= h0 && hl >= h1) return lerp(a, b, (hl - h0) / (h1 - h0)); } return prof[0][1]; })();
      const ins = 0.8;
      const body = [[cx + r0 - ins, gy - hl]].concat(sub.map(([h, r]) => [cx + r - ins, gy - h]), sub.slice().reverse().map(([h, r]) => [cx - r + ins, gy - h]), [[cx - r0 + ins, gy - hl]]);
      const front = ov(cx, gy - hl, r0 - ins, (r0 - ins) * q, 0, 180, 18);
      S.F(body.concat(front.slice().reverse()), fill, { w: 0 });
      const surf = ov(cx, gy - hl, r0 - ins, (r0 - ins) * q, 0, 360, 30);
      S.F(surf, mix(fill, "#FFFFFF", 0.3), { w: 0 });
      if (o.tone) S.hatch(body.concat(front.slice().reverse()), o.tone);
      S.L(surf, k.DET, { closed: true, curve: true });
      return { r0 };
    };
    /* the carafe, behind and right */
    const cf = [[56, 7.6], [55, 7.8], [46, 7.4], [38, 8.6], [30, 13], [20, 16.4], [8, 16], [1.6, 13.6], [0, 12]];
    const cx2 = 78, gy2 = 80;
    glassBody(cx2, gy2, cf, { inner: [2, 44] });
    fillTo(cx2, gy2, cf, 30, "#CFE3EAD0", {});
    /* the table edge, seen THROUGH the water, jumps down: refraction */
    S.L([[cx2 - 13.4, 74.4], [cx2 + 13.4, 74.4]], k.TEX);
    S.L(ov(cx2, gy2, 12, 12 * q, 0, 180, 20), k.DET, { curve: true });
    for (const [a, b] of [[44, 18], [24, 8]]) S.F([[cx2 - 10, gy2 - a], [cx2 - 7.4, gy2 - a], [cx2 - 7.6, gy2 - b], [cx2 - 10.6, gy2 - b]], "#FFFFFF", { w: 0 });
    /* the wine glass, in front and left */
    const wg = [[46, 12.6], [40, 13.4], [32, 12], [26, 8.4], [23.4, 3], [22.6, 1.2], [8, 1.1], [1, 1.3], [0, 10]];
    const cx1 = 40, gy1 = 84;
    const bowl = [[46, 12.6], [40, 13.4], [32, 12], [26, 8.4], [23, 2]];
    glassBody(cx1, gy1, bowl, { inner: [24, 42] });
    S.limb([[cx1, gy1 - 23], [cx1, gy1 - 1.4]], 1.6, 1.8, "#F2F6F6", { shade: false, w: k.DET });
    const foot = ov(cx1, gy1, 11, 11 * q, 0, 360, 30);
    S.F(foot, "#F2F6F6", { w: 0 }); S.L(foot, k.DET, { closed: true, curve: true });
    S.L(ov(cx1, gy1 + 0.8, 11, 11 * q, 0, 180, 20), k.OUT, { curve: true });
    fillTo(cx1, gy1, bowl, 33, "#7A1F2E", { tone: { gap: 0.9, ang: 45, cross: true, w: k.TEX * 0.55 } });
    S.F([[cx1 - 9.6, gy1 - 44], [cx1 - 7.6, gy1 - 44.6], [cx1 - 8.2, gy1 - 32], [cx1 - 10.2, gy1 - 33]], "#FFFFFF", { w: 0 });
    /* the lemon, cut: a ring of segments */
    const lc = [104, 82];
    S.soft([[96, 82], [100, 76.6], [108, 76.4], [112, 81.4], [108, 86], [100, 86]], "#E8C64A", { depth: 0.3 });
    const face = ov(lc[0] - 1.6, lc[1] - 0.6, 5.6, 4.2, 0, 360, 24);
    S.F(face, "#F4E7A4", { w: k.DET });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; S.L([[lc[0] - 1.6, lc[1] - 0.6], [lc[0] - 1.6 + Math.cos(a) * 4.6, lc[1] - 0.6 + Math.sin(a) * 3.4]], k.TEX * 0.8); }
    S.pool(40, 85.4, 13, 2, { gap: 0.9 });
  });

  /* ── 6 · A bowl of fruit and a loaf ───────────────────────────────────── */
  def("fruit", "Fruit bowl and a loaf", 1.9, "object", (S) => {
    const k = S.k, q = 0.26;
    /* frame from the panel: the wall above the table is a strip, not half the picture */
    S.panel(0, 32, 130, 100, "#FFFFFF");
    S.F(rect(0, 50, 130, 100), "#EDE3D2", { w: 0 });
    S.L([[0, 50], [130, 50]], k.DET);
    /*
     * A CLOTH lies flat and soft: a wavy edge, a hem drawn just inside it, and
     * folds that start at the edge and die out across it. The first render used a
     * gingham grid of straight lines and it read as a wire crate. A grid is only
     * cloth if every line bends with the folds; fewer, softer marks read better.
     */
    const cloth = curve([[10, 72], [40, 68.6], [76, 69.4], [84, 80], [80, 92], [46, 95], [14, 93], [6, 84]], 6, true);
    S.F(cloth, "#F4F1EC", { w: 0 });
    const hem = curve([[13, 74], [40, 71], [73.6, 71.8], [80.6, 80.6], [77.4, 90], [46, 92.6], [16, 90.8], [9.6, 84]], 6, true);
    S.L(hem, k.TEX * 0.8, { closed: true, curve: true, dash: true });
    for (const f of [[[22, 93], [26, 86], [30, 82]], [[62, 94], [58, 88], [60, 84]], [[82, 86], [76, 84], [72, 85]], [[8, 80], [14, 81], [18, 79]]]) S.fold(f);
    S.L(cloth, k.OUT * 0.9, { closed: true, curve: true });
    /* the bowl's INSIDE first (fruit sits in it), then the fruit, then the bowl's
       front wall, which cuts the bottoms of the fruit: that cut is the "in" */
    const bc = [44, 70], BR = 26;
    S.F(ov(bc[0], bc[1], BR, BR * q, 0, 360, 36), "#8C6C52", { w: 0 });
    S.hatch(ov(bc[0], bc[1], BR - 1, (BR - 1) * q, 180, 360, 20).concat([[bc[0] + BR, bc[1]]]), { gap: 1, ang: 60 });
    /* the FAR rim is behind the fruit: draw it now, so the fruit cuts it (drawn after
       the fruit, it ran straight through the orange in line only) */
    S.L(ov(bc[0], bc[1], BR, BR * q, 180, 360, 24), k.DET, { curve: true });
    /* the fruit sits IN the bowl: its bottoms below the front lip, so the wall hides them
       (sat on top, the bowl's inside showed under the fruit as a brown plate) */
    for (const [x, y] of [[22, 62], [18, 65], [24, 67], [14, 69], [20, 70], [26, 71], [17, 73]]) S.ball(x, y, 3, 3, "#6B3A6E", { arcs: 1, w: k.DET });
    S.L(curve([[22, 62], [21, 58], [23, 55]], 3), k.DET, { curve: true });
    S.ball(31, 66, 8, 7.6, "#C8402E", { arcs: 2 });
    S.L(curve([[31, 59], [31.6, 56], [33, 54.4]], 3), k.DET, { curve: true });
    S.ball(46, 63.4, 8.6, 8.2, "#E08A2C", { arcs: 3 });
    for (let i = 0; i < 18; i++) S.F(ov(46 + jit(6), 63.4 + jit(6), 0.25, 0.25), "#9A5A1E", { w: 0 });
    S.ball(61, 66, 7.2, 7, "#86A83E", { arcs: 2 });
    /* a banana lies ACROSS the front of the heap: a curved strip, flat ends, a ridge */
    const ban = curve([[30, 70], [42, 73.4], [56, 72.4], [66, 66]], 6);
    const be = edges(ban, 6, 4);
    const bp = be.L.concat(be.R.slice().reverse());
    S.soft(bp, "#ECCB4C", { raw: true, depth: 0.36 });
    S.L(ban.map(([x, y]) => [x, y - 0.6]), k.TEX, { curve: true });
    S.F(ov(66.6, 65.4, 1.2, 1.6), "#4A3A22", { w: k.TEX });
    /* front lip right → left along the near arc, then the belly left → right: no chord */
    const wall = ov(bc[0], bc[1], BR, BR * q, 0, 180, 24).concat(curve([[bc[0] - BR, bc[1]], [bc[0] - BR + 2, bc[1] + 8], [bc[0] - 12, bc[1] + 14], [bc[0] + 12, bc[1] + 14], [bc[0] + BR - 2, bc[1] + 8], [bc[0] + BR, bc[1]]], 5));
    S.soft(wall, "#E7E0D2", { raw: true, depth: 0.3 });
    S.L(curve([[bc[0] - BR + 0.8, bc[1] + 3], [bc[0], bc[1] + 7.6], [bc[0] + BR - 0.8, bc[1] + 3]], 6), k.DET * 1.2, { curve: true });
    /* the loaf on a board: a long dome, scored, the scores open (ears) */
    S.F([[84, 82], [124, 78], [126, 84], [86, 88]], "#B98A55", { w: k.OUT });
    S.L([[86, 88], [126, 84]], k.DET);
    S.hatch([[86, 85.4], [125.4, 81.4], [126, 84], [86, 88]], { gap: 0.8, ang: 80 });
    const loaf = [[88, 80], [92, 70], [104, 64], [118, 66], [124, 74], [122, 80], [104, 83]];
    S.soft(loaf, "#C98A46", { depth: 0.3 });
    for (const [x, y] of [[95, 72], [103, 68.4], [111, 67.4]]) {
      const sc = [[x, y + 4], [x + 2, y], [x + 6, y - 1.6], [x + 4.4, y + 1.6]];
      S.F(curve(sc, 3, true), "#ECCF98", { w: 0 });
      S.L(curve([[x, y + 4], [x + 2.2, y + 0.4], [x + 6, y - 1.6]], 4), k.DET, { curve: true });
    }
    for (let i = 0; i < 26; i++) S.F(ov(98 + rnd() * 22, 66 + rnd() * 6, 0.22, 0.22), "#FFFFFF", { w: 0 });
    S.pool(44, 85, 22, 2.4, { gap: 0.9 });
  });

  /* ── 7 · A monstera in a pot ──────────────────────────────────────────── */
  def("monstera", "Monstera", 1, "plant", (S) => {
    const k = S.k, LF = "#3F7A4E", WALL = "#FFFFFF";
    S.panel(0, 0, 100, 100, WALL);
    S.pool(50, 95, 20, 2);
    /*
     * The leaf: a heart with SPLITS from the edge toward the midrib, and HOLES
     * between the splits near the rib. The first render failed on all three marks
     * at once: slits a hair wide (invisible), holes the size of dots, and a hatch
     * over half the leaf so dense it read as a pinecone. So:
     *   - a split is an open WEDGE, wide at the edge (≈ a tenth of the leaf);
     *   - a hole is an oval a quarter of the lobe, a keyhole, so what is behind shows;
     *   - the tone is a light hatch on the shaded half only, and the lobes' veins.
     * Splits slant toward the tip, as a real leaf's do.
     */
    const leaf = (bx, by, len, ang, sq, o) => {
      o = o || {};
      const half = curve([[0, 0], [-0.1, 0.14], [-0.06, 0.34], [0.1, 0.48], [0.32, 0.53], [0.56, 0.46], [0.78, 0.3], [0.93, 0.12], [1, 0]], 9);
      const X = ([u, v]) => { const c = Math.cos(ang * RAD), s = Math.sin(ang * RAD), x = u * len, y = v * len * sq; return [bx + x * c - y * s, by + x * s + y * c]; };
      const slitAt = o.slits || [0.2, 0.33, 0.46, 0.6, 0.74];
      /*
       * A split is a NARROW slot with parallel sides that runs most of the way to
       * the rib, slanting toward the tip, and each lobe between two slots BULGES.
       * Round 2 cut open wedges (wide at the edge, a point inside) and every leaf
       * read as a fir tree: sawtooth edges say conifer, not monstera.
       */
      const side = (sg) => {
        const pts = half.map(([u, v]) => [u, v * sg]), n = pts.length, out = [];
        const marks = slitAt.map((f) => Math.round(f * (n - 1)));
        const bounds = [0].concat(marks, [n - 1]);
        for (let i = 0; i < n; i++) {
          const m = marks.indexOf(i);
          if (m >= 0) {
            const [u, v] = pts[i], deep = 0.74 - m * 0.06, w = 0.014;
            const iu = u + 0.12 * deep, iv = v * (1 - deep);
            out.push([u - w, v], [iu - w, iv], [iu + w * 0.6, iv + sg * 0.004], [u + w, v]);
            continue;
          }
          let b = 0; while (b < bounds.length - 1 && bounds[b + 1] <= i) b++;
          const a = bounds[b], z = bounds[b + 1], t = (i - a) / ((z - a) || 1);
          const bulge = marks.length && b > 0 && b < bounds.length - 1 ? 1 + 0.08 * Math.sin(Math.PI * t) : 1;
          const [u, v] = pts[i];
          out.push([u, v * bulge]);
        }
        return out;
      };
      const right = side(1), left = side(-1);
      const hl = [];
      if (o.holes !== false) for (const sg of [1, -1]) for (const f of [0.38, 0.52, 0.66]) {
        const hole = ov(0, 0, 0.045, 0.028, 0, 360, 12).map(([a, b]) => X([f + 0.03 + a, sg * 0.16 + b]));
        hl.push(hole);
      }
      const poly = holes(right.concat(left.slice().reverse()).map(X), hl);
      S.F(poly, o.fill || LF, { w: 0 });
      const shade = holes(right.concat(right.slice().reverse().map(([u]) => [u, 0])).map(X), hl.slice(0, 3));
      S.F(shade, o.fill || LF, { w: 0, sh: 0.82 });
      S.hatch(shade, { gap: 1.6, ang: ang + 70, w: k.TEX * 0.5 });
      /* the outline draws the leaf and each hole, never the keyhole seams */
      S.L(right.map(X), k.OUT * 0.9);
      S.L(left.map(X), k.OUT * 0.9);
      for (const h of hl) S.L(h, k.DET, { closed: true, curve: true });
      S.L(curve([[0, 0], [0.5, 0.01], [0.97, 0]].map(X), 4), k.DET, { curve: true });
      for (const sg of [1, -1]) {
        const mids = [0.08].concat(slitAt).concat([0.9]);
        for (let i = 0; i < mids.length - 1; i++) {
          const f = (mids[i] + mids[i + 1]) / 2;
          S.L(curve([[f - 0.04, 0], [f + 0.02, sg * 0.22], [f + 0.08, sg * 0.38]].map(X), 3), k.TEX * 0.8, { curve: true, taper: [1, 0.2] });
        }
      }
    };
    /* back to front: the upright leaf, the two high ones, the two low ones.
       Stems ARC outward (a petiole carries weight), never straight spokes. */
    const L = [
      [52, 34, 27, -64, 0.9, [4, -14]], [36, 38, 30, 198, 0.78, [-10, -6]], [64, 34, 30, -16, 0.82, [10, -10]],
      [32, 58, 22, 158, 0.72, [-12, 2]], [68, 58, 22, 22, 0.74, [12, 2]],
    ];
    for (const [bx, by, len, ang, sq, bend] of L) {
      const sx = 50 + (bx - 50) * 0.08, sy = 74;
      S.limb(curve([[sx, sy], [lerp(sx, bx, 0.5) + bend[0] * 0.4, lerp(sy, by, 0.5) + bend[1] * 0.3], [bx, by]], 5), 1.8, 1.2, "#5E8A4A", { shade: false, w: k.DET });
      leaf(bx, by, len, ang, sq);
    }
    /* the pot: a turned terracotta body with a rim band, soil showing */
    const pot = S.lathe(50, 94, [[22, 15], [19, 15.4], [18.6, 14], [0, 11]], "#C8794C", { bore: "#5A4636", boreTone: { gap: 0.9, ang: 30 }, ribN: 5 });
    S.band(50, 94, pot.P, 18.6, k.DET);
  });

  /* ── 8 · A street at night ────────────────────────────────────────────── */
  def("night", "A street at night", 1.6, "scene", (S0) => {
    const S = S0, k = S.k, SKY = "#1C2440";
    const moon = ov(30, 20, 7, 7, 0, 360, 28);
    S.panel(0, 0, 160, 100, SKY);
    /*
     * NIGHT inverts the value: the sky is the darkest thing, so in LINE it is the
     * densest hatch on the page, and every LIGHT is a place the hatch is not.
     * Light is carved out with keyholes (moon, lamp glow, the pool on the road),
     * never painted over the hatch in white.
     */
    const glow = ov(112, 30, 13, 13, 0, 360, 28);
    S.hatch(holes(rect(-2, -2, 162, 64), [moon.slice().reverse(), glow.slice().reverse()]), { gap: 1.25, ang: 60, cross: true, crossGap: 1.4, w: k.TEX * 0.55 });
    S.F(glow, mix(SKY, "#F6DE96", 0.22), { w: 0 });
    S.F(ov(112, 30, 8, 8, 0, 360, 24), mix(SKY, "#F6DE96", 0.45), { w: 0 });
    S.F(moon, "#F4EAC8", { w: k.DET });
    S.L(ov(31.6, 18.6, 1.4, 1.1), k.TEX, { closed: true, curve: true });
    for (const [x, y] of [[60, 10], [74, 22], [90, 8], [140, 12], [150, 30], [8, 36], [48, 30]]) {
      S.L([[x - 1, y], [x + 1, y]], k.TEX); S.L([[x, y - 1], [x, y + 1]], k.TEX);
    }
    /* the houses: dark masses, each window lit (no hatch, warm fill, a frame) */
    const block = (x0, x1, top, roof, fill) => {
      const poly = roof ? [[x0, 66], [x0, top], [(x0 + x1) / 2, top - roof], [x1, top], [x1, 66]] : [[x0, 66], [x0, top], [x1, top], [x1, 66]];
      S.F(poly, fill, { w: 0 });
      return poly;
    };
    const wins = [];
    const houses = [[0, 30, 34, 10, "#2C2A3A"], [30, 64, 26, 0, "#33303F"], [64, 94, 38, 12, "#2A2838"], [128, 162, 30, 0, "#2E2C3C"]];
    for (const [x0, x1, top, roof, fill] of houses) {
      const p = block(x0, x1, top, roof, fill);
      const ws = [];
      for (let wx = x0 + 4; wx < x1 - 6; wx += 9) for (let wy = top + 5; wy < 58; wy += 11) if (rnd() < 0.7) ws.push(rect(wx, wy, wx + 5, wy + 6.4));
      S.hatch(holes(p, ws.map((w) => w.slice().reverse())), { gap: 0.9, ang: 45, cross: true, w: k.TEX * 0.6 });
      for (const w of ws) {
        S.F(w, "#F2C45A", { w: 0 });
        S.L(w, k.DET, { closed: true });
        S.L([[(w[0][0] + w[1][0]) / 2, w[0][1]], [(w[0][0] + w[1][0]) / 2, w[2][1]]], k.TEX);
      }
      S.L(p, k.OUT * 0.9, { closed: false });
      wins.push(...ws);
    }
    /* the road: dark, hatched, except the pool under the lamp */
    const road = rect(-2, 66, 162, 102);
    S.F(road, "#2B2F3A", { w: 0 });
    const pool = ov(112, 84, 24, 6, 0, 360, 30);
    S.F(pool, "#C9B98A", { w: 0 });
    S.hatch(holes(road, [pool.slice().reverse()]), { gap: 1.0, ang: 20, w: k.TEX * 0.6 });
    S.L([[-2, 66], [162, 66]], k.DET);
    S.L([[-2, 74], [162, 74]], k.TEX);
    /* the lamp post and its glow */
    S.limb([[112, 92], [112, 34]], 2, 1.6, "#1A1A22", { shade: false, w: k.DET });
    S.F([[106, 34], [118, 34], [115, 27], [109, 27]], "#F6DE96", { w: k.DET });
    S.L([[105, 34.6], [119, 34.6]], k.DET * 1.4);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; S.L([[112 + Math.cos(a) * 8, 31 + Math.sin(a) * 8], [112 + Math.cos(a) * 11, 31 + Math.sin(a) * 11]], k.TEX * 0.7); }
    /* a walker, dark against the pool of light: a silhouette is a figure too */
    /* a walker against the light: a SILHOUETTE, so in line it is hatched solid.
       An outlined figure on a hatched night reads as a ghost (first render). */
    People.figure(S, { x: 128, gy: 86, h: 30, turn: -90, pose: "walk", noFace: true, tone: { gap: 0.55, ang: 45, cross: true, w: k.TEX * 0.6, min: 0.2 },
      look: { skin: "#3A3440", hair: "#141418", top: "#24222E", topStyle: "coat", bottom: "#1E1C26", shoe: "#141418" } });
    void wins;
  });

  /* ── 9 · Rain ─────────────────────────────────────────────────────────── */
  def("rain", "Walking in the rain", 1.6, "scene", (S) => {
    const k = S.k, SKY = "#D5DADF";
    S.panel(0, 0, 160, 100, SKY);
    S.hatch(rect(-2, -2, 162, 60), { gap: 2.6, ang: 75, w: k.TEX * 0.5 });
    /* a far row of buildings, flat and grey: rain flattens depth */
    for (const [x0, x1, top] of [[0, 24, 26], [24, 52, 34], [52, 70, 20], [70, 104, 30], [104, 130, 24], [130, 162, 36]]) {
      const p = rect(x0, top, x1, 60);
      S.F(p, mix("#8B95A0", SKY, 0.35), { w: 0 });
      for (let wx = x0 + 3; wx < x1 - 4; wx += 6) for (let wy = top + 4; wy < 56; wy += 7) S.L(rect(wx, wy, wx + 3, wy + 4), k.TEX * 0.7, { closed: true });
      S.L([[x0, 60], [x0, top], [x1, top], [x1, 60]], k.DET * 0.8);
    }
    /* the wet street: grey, streaked with the reflections of what stands on it */
    const st = rect(-2, 60, 162, 102);
    S.F(st, "#A9B0B6", { w: 0 });
    S.L([[-2, 60], [162, 60]], k.DET);
    for (let x = 2; x < 160; x += 6 + rnd() * 6) S.L([[x, 62], [x + jit(0.3), 62 + 3 + rnd() * 6]], k.TEX * 0.6, { taper: [1, 0.2] });
    /* the puddle, in front, mirrors the walker: same figure flipped, broken by rings */
    const pud = curve([[56, 88], [80, 84], [112, 86], [118, 92], [96, 97], [62, 96]], 6, true);
    S.F(pud, "#C4CDD4", { w: 0 });
    const C = { skin: "#E0B08C", top: "#D6463A", sleeve: "#D6463A", bottom: "#2F3542", shoe: "#2A2A2A", hair: "#2C2018" };
    S.F(pud, "#C4CDD4", { w: 0 });
    S.L(pud, k.DET, { closed: true, curve: true });
    for (const [x, y, r] of [[78, 90, 4], [96, 92, 3], [88, 88, 2.4]]) {
      S.L(ov(x, y, r, r * 0.3), k.TEX, { closed: true, curve: true });
      S.L(ov(x, y, r * 1.8, r * 0.54, 200, 340, 12), k.TEX * 0.6, { curve: true });
    }
    /* the REFLECTION: the walker flipped about the feet and squashed, in broken
       horizontal bands (a reflection has no outline, and water breaks it) */
    const rx = 88, ry = 84.6;
    for (let y = ry + 0.4, i = 0; y < 95.6; y += 0.9, i++) {
      const f = (y - ry) / 11, half = f < 0.42 ? 2.6 : 5.2 + (f - 0.42) * 2, col = f < 0.42 ? C.bottom : C.top;
      if (i % 3 === 2) continue;
      const x0 = rx - half + jit(0.6), x1 = rx + half + jit(0.6);
      S.F(rect(x0, y, x1, y + 0.62), mix(col, "#C4CDD4", 0.45), { w: 0 });
      S.L([[x0, y + 0.3], [x1, y + 0.3]], k.TEX * 0.7, { taper: [0.3, 0.3] });
    }
    /* the walker under an umbrella: a raincoat, the umbrella held in the right hand */
    People.figure(S, { x: 88, gy: 84, h: 50, pose: "umbrella",
      look: { build: "f", skin: C.skin, hair: C.hair, hairStyle: "bob", top: C.top, topStyle: "coat", bottom: C.bottom, shoe: C.shoe },
      extras: [{ z: 40, draw: (J, P3, sc) => {
        /* the umbrella: shaft from the hand straight up, a dome with a scalloped rim,
           ribs to each point, panels alternately shaded */
        const w = P3(J.wrR), cx = w[0], cy = P3(J.head)[1] - 16 * sc, R = 24;
        S.limb([[w[0], w[1] - 1], [cx, cy - 8]], 0.9, 0.9, "#3A3A3A", { shade: false, w: k.TEX });
        const n = 8, rim = [];
        for (let i = 0; i <= n; i++) {
          const a = Math.PI + (i / n) * Math.PI;
          rim.push([cx + Math.cos(a) * R, cy + 10 + Math.sin(a) * 1.8]);
        }
        const dome = [];
        for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; dome.push([cx + Math.cos(a) * R, cy + 10 + Math.sin(a) * 18]); }
        const scal = [];
        for (let i = 0; i < n; i++) {
          const a = rim[i], b = rim[i + 1];
          scal.push(...curve([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 2.4], b], 4).slice(0, -1));
        }
        scal.push(rim[n]);
        const can = dome.concat(scal.slice().reverse());
        S.F(can, "#2F5D8A", { w: 0 });
        for (let i = 0; i < n; i++) if (i % 2) {
          const top = [cx, cy - 8];
          const seg = [top].concat(scal.slice(i * 4, i * 4 + 5));
          S.F(seg, "#2F5D8A", { w: 0, sh: 0.8 });
          S.hatch(seg, { gap: 1.0, ang: 70, w: k.TEX * 0.6 });
        }
        for (let i = 1; i < n; i++) S.L(curve([[cx, cy - 8], [lerp(cx, rim[i][0], 0.5), cy - 8 + 10], rim[i]], 4), k.TEX, { curve: true });
        S.L(can, k.OUT, { closed: true });
        S.L([[cx, cy - 8], [cx, cy - 11]], k.DET);
      } }] });
    /* rain over everything: short slanted strokes, thinner and denser far away */
    /* ...except in the umbrella's shelter: rain that falls through a canopy says it isn't one */
    const ux = 90, uTop = 19, uR = 24;
    for (let i = 0; i < 260; i++) {
      const x = rnd() * 170 - 6, y = rnd() * 100, L = 2 + rnd() * 3 + (y / 100) * 2;
      if (x > ux - uR - 1 && x < ux + uR + 1 && y + L > uTop && y < 86) continue;
      S.L([[x, y], [x - L * 0.25, y + L]], k.TEX * (0.4 + (y / 100) * 0.4), { taper: [0.2, 1] });
    }
  });

  /* ── 10 · A sneaker ───────────────────────────────────────────────────── */
  /*
   * A shoe is a SOLE (a strip with toe spring, tread on its edge) with an UPPER
   * sewn onto it in PANELS, laced across a THROAT. Seen side on, the eye a little
   * above, so the collar opening and the far row of eyelets show.
   *
   * It took three renders, and the fix was MEASUREMENT, not detail. The profile
   * of a low-top, as fractions of its length L above the ground:
   *     toe tip .10   toe box (at .15 L) .17   vamp (at .35 L) .24
   *     top eyelet (at .55 L) .36   collar low point (at .70 L) .30
   *     heel top (at .92 L) .34    sole .06 of which outsole a third
   * Round 1 had no measured profile (a puffy boot), round 3 stretched the whole
   * drawing taller (a clog on a platform: the sole got taller too). Only the
   * profile above fixes it; stretching a wrong shape keeps it wrong.
   */
  def("sneaker", "A sneaker", 1.78, "object", (S) => {
    const k = S.k, UP = "#F1EEE6", ACC = "#C8462E", L = 120, X0 = 20, G = 80;
    const p = (fx, fh) => [X0 + fx * L, G - fh * L];
    S.panel(0, 10, 160, 100, "#FFFFFF");
    S.pool(80, G + 1, 62, 2.4);
    const topLine = [p(0, 0.1), p(0.02, 0.15), p(0.08, 0.175), p(0.2, 0.205), p(0.35, 0.245), p(0.46, 0.3), p(0.55, 0.36),
      p(0.6, 0.34), p(0.7, 0.3), p(0.8, 0.303), p(0.92, 0.34), p(0.97, 0.325), p(1.0, 0.27), p(1.01, 0.16), p(1.0, 0.1)];
    const seam = [p(1.0, 0.1), p(0.8, 0.075), p(0.4, 0.07), p(0.08, 0.078)];
    const upper = curve(topLine.concat(seam.slice(1)), 5, true);
    S.soft(upper, UP, { raw: true, depth: 0.16, gap: 1.4 });
    /* toe cap: a band along the toe, stitched */
    const toeOut = curve([p(0, 0.1), p(0.02, 0.15), p(0.08, 0.175), p(0.15, 0.19)], 5);
    const toeIn = curve([p(0.07, 0.075), p(0.075, 0.125), p(0.11, 0.15), p(0.16, 0.162)], 5);
    S.F(toeOut.concat(toeIn.slice().reverse()), mix(UP, "#000000", 0.06), { w: 0 });
    S.L(toeIn, k.DET, { curve: true });
    S.L(curve([p(0.09, 0.077), p(0.095, 0.118), p(0.125, 0.14), p(0.17, 0.152)], 5), k.TEX * 0.7, { curve: true, dash: true });
    /* mudguard: the band above the sole all along, stitched */
    S.L(curve([p(0.05, 0.11), p(0.35, 0.105), p(0.7, 0.105), p(0.92, 0.112), p(1.005, 0.14)], 6), k.DET, { curve: true });
    S.L(curve([p(0.06, 0.095), p(0.35, 0.09), p(0.7, 0.09), p(0.92, 0.097)], 6), k.TEX * 0.7, { curve: true, dash: true });
    /* heel counter: a band round the back, in the accent */
    const hcOut = curve([p(0.9, 0.338), p(0.97, 0.325), p(1.0, 0.27), p(1.01, 0.16), p(1.0, 0.105)], 5);
    const hcIn = curve([p(0.86, 0.315), p(0.9, 0.24), p(0.92, 0.16), p(0.93, 0.108)], 5);
    const hc = hcOut.concat(hcIn.slice().reverse());
    S.F(hc, ACC, { w: 0 }); S.hatch(hc, { gap: 1.3, ang: 60, w: k.TEX * 0.55 });
    S.L(hcIn, k.DET, { curve: true });
    /* the side stripe: one swept band from the mudguard up toward the throat */
    const stA = curve([p(0.38, 0.11), p(0.47, 0.18), p(0.58, 0.27)], 5), stB = curve([p(0.47, 0.11), p(0.55, 0.17), p(0.65, 0.255)], 5);
    const stripe = stA.concat(stB.slice().reverse());
    S.F(stripe, ACC, { w: 0 }); S.hatch(stripe, { gap: 1.3, ang: 60, w: k.TEX * 0.55 }); S.L(stripe, k.DET, { closed: true });
    /* the collar opening, from a little above: the far rim shows above the near one */
    const col = curve([p(0.6, 0.345), p(0.72, 0.33), p(0.84, 0.335), p(0.93, 0.355), p(0.92, 0.338), p(0.8, 0.31), p(0.7, 0.305)], 5, true);
    S.F(col, "#4A4642", { w: k.DET }); S.hatch(col, { gap: 0.6, ang: 30, w: k.TEX * 0.6, min: 0.2 });
    S.L(curve([p(0.66, 0.28), p(0.78, 0.282), p(0.88, 0.3)], 4), k.TEX, { curve: true });
    /* the tongue: a flap just proud of the top eyelet */
    /* (a tongue drawn as a rounded blob reads as a ball: give it a straight top edge) */
    S.soft([p(0.535, 0.335), p(0.548, 0.39), p(0.6, 0.402), p(0.618, 0.396), p(0.612, 0.345)], UP, { raw: true, depth: 0.24, w: k.DET });
    S.L([p(0.552, 0.384), p(0.604, 0.394)], k.TEX * 0.7, { dash: true });
    /* the throat: eyelet stay, two rows of eyelets, laces crossing between */
    const near = [], far = [];
    for (let i = 0; i < 6; i++) {
      const f = i / 5;
      near.push(p(lerp(0.33, 0.55, f), lerp(0.235, 0.34, f)));
      far.push(p(lerp(0.31, 0.525, f), lerp(0.262, 0.37, f)));
    }
    S.L(curve(near.map(([x, y]) => [x + 1.2, y + 2.4]), 3), k.DET, { curve: true });
    S.L(curve(near.map(([x, y]) => [x + 0.8, y + 1.4]), 3), k.TEX * 0.7, { curve: true, dash: true });
    for (let i = 0; i < 5; i++) { S.L([near[i], far[i + 1]], k.DET * 1.1); S.L([far[i], near[i + 1]], k.DET * 1.1); }
    for (const e of near.concat(far)) S.F(ov(e[0], e[1], 0.85, 0.65), "#FFFFFF", { w: k.TEX });
    const b = [near[5][0] - 1, near[5][1] - 1];
    S.L(curve([b, [b[0] - 6, b[1] - 3], [b[0] - 1.4, b[1] - 3], b], 4), k.DET, { curve: true });
    S.L(curve([b, [b[0] + 3.6, b[1] - 5.6], [b[0] + 1.6, b[1] - 1.8], b], 4), k.DET, { curve: true });
    S.L(curve([b, [b[0] - 3, b[1] + 5], [b[0] - 2, b[1] + 10]], 3), k.DET, { curve: true });
    S.L(curve([b, [b[0] + 2, b[1] + 5], [b[0] + 4.6, b[1] + 8.6]], 3), k.DET, { curve: true });
    /* the heel pull tab */
    S.F([p(0.962, 0.328), p(0.972, 0.372), p(0.992, 0.37), p(0.994, 0.322)], ACC, { w: k.DET });
    /* the sole, last: midsole with toe spring, outsole band, tread ticks */
    const sTop = curve([p(-0.01, 0.105), p(0.05, 0.07), p(0.35, 0.062), p(0.8, 0.062), p(0.97, 0.07), p(1.02, 0.1)], 6);
    const sBot = curve([p(0.0, 0.07), p(0.08, 0.012), p(0.4, 0), p(0.85, 0), p(0.99, 0.015), p(1.025, 0.06)], 6);
    const sole = sTop.concat(sBot.slice().reverse());
    S.F(sole, "#FBFAF6", { w: 0 }); S.L(sole, k.OUT, { closed: true, curve: true });
    const out = curve([p(0.03, 0.04), p(0.1, 0.022), p(0.4, 0.019), p(0.85, 0.019), p(0.99, 0.032), p(1.022, 0.07)], 6);
    S.F(out.concat(sBot.slice().reverse()), "#5A5652", { w: 0 }); S.L(out, k.DET, { curve: true });
    for (let x = 0.1; x < 0.97; x += 0.018) { const [a, c] = p(x, 0.018); S.L([[a, c], [a + 0.5, c + 1.8]], k.TEX * 0.8); }
    S.L(curve([p(0.04, 0.048), p(0.4, 0.04), p(0.85, 0.04), p(0.99, 0.052)], 6), k.TEX * 0.7, { curve: true });
  });

  /* ── wrap ─────────────────────────────────────────────────────────────── */
  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap(CLASS[key], NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [80, 50], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
      const t = kit(k, { yaw: 0, pitch: 0 });
      rs = 5 + key.length * 17;
      Scapes._util.seed(9 + key.length);
      const base = StillLife._stage(t, 0.2);
      const S = extend(CLASS[key] === "scene" ? Scapes._scene(t, "#E8EEF3") : base);
      D[key](S);
      t.flush();
      const o = k.done();
      const xs = o.regions[0].pts.map((p) => p[0]), ys = o.regions[0].pts.map((p) => p[1]);
      o.frame = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      return o;
    });
    out[key].clip = true;
  }
  out._keys = Object.keys(D);
  out._names = NAMES;
  out._aspect = ASPECT;
  out._figure = figure;
  out._extend = extend;
  out._util = { edges, keyhole, holes };
  return out;
})();
