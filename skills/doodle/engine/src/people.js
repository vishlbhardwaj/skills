/*
 * PEOPLE: the figure kit, rebuilt. Replaces Trials._figure, which was a flat 2D
 * cut-out: always frontal, perfectly symmetric, square shoulders, no neck, tube
 * legs, lollipop hands, pebble feet, a hatched face. The author: "human figures are
 * in a very bad state".
 *
 * What makes a drawn person read, in order of importance (each was a failure):
 *   1. PROPORTION, from the canon: 7.4 heads; shoulders at 18, hip joint at 51,
 *      knee at 73; the wrist hangs at the crotch; elbow at the waist.
 *   2. GESTURE: weight on one leg; the hips tilt one way, the shoulders the other
 *      (contrapposto); the standing ankle sits under the neck. Symmetric = mannequin.
 *   3. TURN: a body seen from 3/4 or the side is a different silhouette, not the
 *      front one squashed. So the body is 3D: cross-section ellipses along the
 *      spine, limbs by forward kinematics, all projected through one turn angle.
 *   4. ANATOMY in the silhouette: neck into a sloping trapezius, shoulder cap,
 *      chest, waist, hip; thigh → knee → calf → thin ankle; deltoid → elbow →
 *      forearm → thin wrist. Width PROFILES, never linear tapers.
 *   5. HANDS and FEET at real size (hand ≈ face height, foot ≈ 1.1 heads), built
 *      in 3D: a hanging hand from the front is seen EDGE-ON; a foot from the front
 *      is a short toe pointing at you.
 *   6. A clean FACE: no tone on skin. Dot eyes, brows, a nose line, a mouth.
 *
 * Coordinates: body units, height 100, y DOWN, x to the picture's right when the
 * figure faces us, z toward the viewer. Origin = pelvis centre (the hip-joint line).
 * The figure's own L/R are named by the picture at turn 0: "L" is picture-left.
 *
 * Usage: People.figure(S, { x, gy, h, turn, pose, look })
 *   S     a StillLife stage (or the scene kit), already extended by Trials._extend
 *   turn  degrees; 0 faces us, +90 faces picture-right, 180 shows the back
 *   pose  joint ANGLES (see POSES), never positions: bone lengths stay true
 *   look  { skin, hair, hairStyle, top, topStyle, bottom, bottomStyle, shoe, build }
 */
window.People = (function () {
  const { ov, curve } = StillLife._util;
  const RAD = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const norm = (a) => { const m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; };

  /* convex hull (monotone chain), for heads, hands, feet built as 3D point clouds */
  const hull = (P) => {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  /* Catmull-Rom over n-dimensional points (x, y, width ...) */
  const crN = (pts, per) => {
    if (pts.length < 3) return pts;
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [], N = per || 5;
    for (let i = 1; i < P.length - 2; i++) for (let j = 0; j < N; j++) {
      const t = j / N, a = P[i - 1], b = P[i], c = P[i + 1], d = P[i + 2];
      out.push(b.map((_, k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t)));
    }
    out.push(pts[pts.length - 1]);
    return out;
  };

  /* ── the body: measured widths (half-widths, body units) ───────────────── */
  /*
   * Torso stations at STANDING height y: [y, halfWidth, halfDepth, forwardOffset].
   * The shoulder cap is part of the torso; the arm takes over below the armpit.
   */
  const TORSO = {
    m: [[10.6, 2.5, 2.4, 0], [14, 2.8, 2.7, 0], [16.4, 5.0, 3.3, -0.4], [17.6, 7.6, 3.7, -0.2], [18.8, 9.6, 3.9, 0], [20.2, 10.5, 4.1, 0], [22, 10.4, 4.6, 0.3],
      [25, 9.4, 5.4, 0.6], [30, 9.0, 5.4, 0.6], [36, 7.6, 4.6, 0.3], [42, 8.0, 4.8, 0], [48, 8.8, 5.4, -0.3], [52, 8.6, 5.4, -0.6], [56, 6.8, 4.4, -0.4]],
    f: [[10.6, 2.3, 2.3, 0], [14, 2.6, 2.5, 0], [16.4, 4.6, 3.1, -0.4], [17.6, 6.8, 3.5, -0.2], [18.8, 8.4, 3.7, 0], [20.2, 9.2, 3.9, 0], [22, 9.0, 4.6, 0.4],
      [25, 8.4, 5.6, 0.9], [30, 7.8, 5.2, 0.6], [36, 6.6, 4.2, 0.3], [42, 7.8, 4.8, 0], [48, 9.6, 5.8, -0.4], [52, 9.4, 5.8, -0.7], [56, 7.4, 4.6, -0.4]],
  };
  /* limb profiles along each bone: [fraction, halfWidth] */
  const PROF = {
    upper: [[0, 3.2], [0.3, 2.9], [0.62, 2.45], [1, 2.0]],
    fore: [[0.18, 2.3], [0.5, 1.95], [1, 1.35]],
    thigh: [[0, 5.0], [0.3, 4.4], [0.7, 3.4], [1, 2.6]],
    shin: [[0.22, 2.9], [0.5, 2.35], [0.82, 1.75], [1, 1.6]],
  };
  const BONE = { upper: 17.4, fore: 14.2, thigh: 22.3, shin: 22.3, spine: 36 };

  /*
   * POSES are ANGLES in degrees, absolute (not relative to the parent bone):
   *   arm/leg bone: [abduct, swing]  abduct = out to the side, swing = forward
   *   hips / shoulders: front-plane tilt (+ = picture-right side DOWN)
   *   lean: torso forward; head: [tilt, turn]; toe: foot turned out
   *   hand: { wide 0..1 (edge-on .. flat), style "relaxed"|"fist"|"open" }
   * Bone lengths never change, so proportion survives every pose.
   */
  const POSES = {
    /* weight on L: L hip up, shoulders the other way, R knee eased, foot out */
    stand: { hips: 5, shoulders: -3.5, lean: 0, head: [-3, 0],
      armL: [[9, 2], [5, 8]], armR: [[7, 0], [3, 10]],
      legL: [[-2.5, 0], [-1, 0]], legR: [[7, 6], [2, -6]], toeL: 14, toeR: 26 },
    neutral: { hips: 0, shoulders: 0, lean: 0, head: [0, 0], armL: [[8, 0], [5, 8]], armR: [[8, 0], [5, 8]],
      legL: [[2, 0], [1, 0]], legR: [[2, 0], [1, 0]], toeL: 14, toeR: 14 },
    walk: { hips: 0, shoulders: 0, lean: 3, head: [0, 0],
      armL: [[4, 20], [3, 42]], armR: [[4, -22], [3, -8]],
      legL: [[0, -18], [0, -42]], legR: [[0, 22], [0, 4]], toeL: 6, toeR: 6, heelR: true },
    sitSide: { hips: 0, shoulders: 0, lean: 6, head: [8, 0],
      armL: [[6, 8], [4, 72]], armR: [[6, 12], [4, 78]],
      legL: [[2, 86], [0, 4]], legR: [[2, 92], [0, -6]], toeL: 4, toeR: 8 },
    sitFront: { hips: 0, shoulders: 0, lean: 4, head: [14, 0],
      armL: [[16, 14], [-26, 58]], armR: [[16, 14], [-26, 58]],
      legL: [[4, 84], [3, 2]], legR: [[4, 84], [3, 2]], toeL: 8, toeR: 8 },
    wave: { hips: -4, shoulders: 3, lean: 0, head: [-4, 0],
      armL: [[8, 0], [4, 8]], armR: [[62, 8], [166, 12]], handR: { wide: 1, style: "open" },
      legL: [[6, 2], [1, -4]], legR: [[-2, 0], [-1, 0]], toeL: 22, toeR: 12 },
    cup: { hips: 4, shoulders: -3, lean: 0, head: [4, 0],
      armL: [[6, 0], [3, 8]], armR: [[8, 4], [-14, 78]], handR: { wide: 0.6, style: "fist" },
      legL: [[-2, 0], [-1, 0]], legR: [[6, 5], [2, -5]], toeL: 14, toeR: 24 },
    pockets: { hips: 4, shoulders: -3, lean: -2, head: [-2, 0],
      armL: [[14, -6], [-10, -2]], armR: [[14, -6], [-10, -2]], handL: { hide: true }, handR: { hide: true },
      legL: [[-2, 0], [-1, 0]], legR: [[8, 6], [3, -6]], toeL: 16, toeR: 30 },
    umbrella: { hips: 3, shoulders: -2, lean: 0, head: [0, 0],
      armL: [[8, 0], [4, 8]], armR: [[10, 20], [-30, 100]], handR: { wide: 0.5, style: "fist" },
      legL: [[0, -8], [0, -14]], legR: [[0, 8], [0, 2]], toeL: 10, toeR: 10 },
  };

  /* bone direction from [abduct, swing] for side s (-1 picture-left, +1 right) */
  const dir = ([ab, sw], s) => norm([s * Math.sin(ab * RAD), Math.cos(ab * RAD) * Math.cos(sw * RAD), Math.cos(ab * RAD) * Math.sin(sw * RAD)]);

  function figure(S, opt) {
    const k = S.k;
    const o = { x: 50, gy: 95, h: 80, turn: 0, ...opt };
    const pose = { ...POSES.neutral, ...(typeof o.pose === "string" ? POSES[o.pose] : o.pose || {}) };
    const L = { skin: "#E2B48E", hair: "#3A2A22", hairStyle: "short", top: "#D9A23B", topStyle: "tee", bottom: "#4A6A93",
      bottomStyle: "trousers", shoe: "#F4F1EA", build: "m", ...(o.look || {}) };
    const F = L.build === "f", TOR = F ? TORSO.f : TORSO.m, sc = o.h / 100;
    const th = o.turn * RAD, ct = Math.cos(th), st = Math.sin(th);
    const tone = o.tone;             /* a silhouette: hatch every part */
    /* a PERSON's pen is lighter than an object's: limbs are thin forms, and a
       silhouette line a third of an arm's width read crude ("too scrappy") */
    const OUT = k.OUT * 0.62, DET = k.DET * 0.72, TEX = k.TEX * 0.8;

    /* ── skeleton (body units, pelvis at origin) ── */
    const leanR = pose.lean * RAD;
    const spineDir = norm([Math.sin(((pose.hips + pose.shoulders) * 0.15) * RAD), -Math.cos(leanR), Math.sin(leanR)]);
    const neckBase = mul(spineDir, BONE.spine);
    const across = (tilt) => [Math.cos(tilt * RAD), Math.sin(tilt * RAD), 0];
    const hipJ = F ? 4.9 : 4.6, shJ = F ? 7.9 : 8.9;
    const J = {};
    for (const s of [-1, 1]) {
      const n = s < 0 ? "L" : "R";
      J["hip" + n] = mul(across(pose.hips), s * hipJ);
      J["sh" + n] = add(add(neckBase, mul(across(pose.shoulders), s * shJ)), [0, 4.2, 0]);
      const leg = pose["leg" + n], arm = pose["arm" + n];
      J["kn" + n] = add(J["hip" + n], mul(dir(leg[0], s), BONE.thigh));
      J["an" + n] = add(J["kn" + n], mul(dir(leg[1], s), BONE.shin));
      J["el" + n] = add(J["sh" + n], mul(dir(arm[0], s), BONE.upper));
      J["wr" + n] = add(J["el" + n], mul(dir(arm[1], s), BONE.fore));
    }
    const headTilt = pose.head[0] * RAD;
    const neckTop = add(neckBase, mul(spineDir, 3.6));
    J.head = add(neckTop, [0, -4.6 * Math.cos(headTilt), 0.6 + 4.6 * Math.sin(headTilt)]);

    /* the ground: the lowest sole touches gy */
    const soleY = Math.max(J.anL[1], J.anR[1]) + 4.7;
    /* projection: turn about the vertical, scale, place */
    const P3 = (p) => [o.x + (p[0] * ct + p[2] * st) * sc, o.gy + (p[1] - soleY) * sc];
    const Z = (p) => -p[0] * st + p[2] * ct;

    /* ── shapes ── */
    const parts = [];               /* { z, draw } painted back to front */
    const fillLine = (poly, fill, o2) => {
      o2 = o2 || {};
      S.F(poly, fill, { w: 0, sh: o2.sh });
      if (tone) S.hatch(poly, tone);
      if (o2.shadeStrip && !tone) { S.F(o2.shadeStrip, fill, { w: 0, sh: 0.88 }); S.hatch(o2.shadeStrip, { gap: 0.95, ang: 62, w: TEX * 0.6 }); }
    };

    /* a limb: stations along its bones in 3D, projected, with a width at each */
    const limb = (chain, profs, ease) => {
      const st3 = [];
      for (let b = 0; b < chain.length - 1; b++) {
        const A = chain[b], B = chain[b + 1];
        for (const [f, w] of profs[b]) {
          if (b > 0 && f === 0) continue;
          const p = add(A, mul(add(B, mul(A, -1)), f));
          const q = P3(p);
          st3.push([q[0], q[1], (w + (ease || 0)) * sc, Z(p)]);
        }
      }
      return crN(st3, 4);
    };
    const stripOf = (pts) => {
      const Lf = [], R = [];
      pts.forEach((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy);
        if (m < 1e-3) { dx = 0; dy = 1; } else { dx /= m; dy /= m; }
        Lf.push([p[0] - dy * p[2], p[1] + dx * p[2]]); R.push([p[0] + dy * p[2], p[1] - dx * p[2]]);
      });
      return { L: Lf, R };
    };
    /* the shadow side of a strip: whichever edge faces picture-right/down */
    const shadeOf = (pts, E) => {
      const sideR = E.R.reduce((s, p, i) => s + (p[0] - pts[i][0]) + 0.3 * (p[1] - pts[i][1]), 0) > 0;
      const edge = sideR ? E.R : E.L;
      return edge.concat(pts.map((p, i) => [lerp(p[0], edge[i][0], 0.45), lerp(p[1], edge[i][1], 0.45)]).reverse());
    };
    const drawStrip = (pts, fill, o2) => {
      o2 = o2 || {};
      const E = stripOf(pts), poly = E.L.concat(E.R.slice().reverse());
      fillLine(poly, fill, { shadeStrip: o2.shade ? shadeOf(pts, E) : null });
      /* the INNER edge starts a little down (it disappears into the torso); the
         OUTER edge runs from the very top, or the shoulder loses its line */
      const from = o2.from || 0;
      if (o2.pit) {
        /* an arm from the shoulder: the OUTER edge (the one that starts higher, over
           the shoulder) runs whole, so the shoulder has one continuous line; the
           INNER edge only exists once the arm has left the body, at the armpit */
        const outerL = E.L[0][1] < E.R[0][1];
        const outer = outerL ? E.L : E.R, inner = outerL ? E.R : E.L;
        S.L(outer, o2.w || OUT, { curve: true });
        const k0 = inner.findIndex((q) => Math.hypot(q[0] - o2.pit[0], q[1] - o2.pit[1]) > o2.pit[2]);
        if (k0 >= 0 && k0 < inner.length - 2) S.L(inner.slice(k0), o2.w || OUT, { curve: true });
      } else {
        S.L(E.L.slice(Math.floor(from * E.L.length)), o2.w || OUT, { curve: true });
        S.L(E.R.slice(Math.floor(from * E.R.length)), o2.w || OUT, { curve: true });
      }
      if (o2.cap) S.L([E.L[E.L.length - 1], E.R[E.R.length - 1]], o2.capW || DET);
      return E;
    };

    /* the torso between two standing heights: section ellipses → a silhouette */
    const station = (y) => {
      let i = 0; while (i < TOR.length - 2 && TOR[i + 1][0] < y) i++;
      const a = TOR[i], b = TOR[i + 1], t = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
      return [y, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
    };
    const spineAt = (y) => {
      const f = (y - 15) / 36;              /* 0 neck base … 1 pelvis */
      const c = f <= 1 ? mul(neckBase, 1 - f) : mul(norm([0, 1, 0]), (f - 1) * 36);
      const tilt = lerp(pose.shoulders, pose.hips, clamp(f, 0, 1));
      return { c, tilt };
    };
    const torsoPiece = (y0, y1, ease, flare) => {
      const left = [], right = [], fronts = [];
      const n = Math.max(6, Math.round((y1 - y0) / 1.5));
      for (let i = 0; i <= n; i++) {
        const y = lerp(y0, y1, i / n);
        let [, w, d, c] = station(Math.min(y, 56));
        if (y > 56) { w = lerp(6.8, 6.8, 0); }
        w += ease || 0; d += (ease || 0) * 0.8;
        if (flare) { const f = clamp((y - flare[0]) / (flare[1] - flare[0]), 0, 1); w += f * flare[2]; d += f * flare[2] * 0.8; }
        const { c: C0, tilt } = spineAt(y);
        const C = add(C0, [0, 0, c]);
        const A = across(tilt), Fw = [0, -Math.sin(leanR) * 0.2, 1];
        const pts = [];
        for (let a = 0; a < 360; a += 15) pts.push(P3(add(C, add(mul(A, w * Math.cos(a * RAD)), mul(Fw, d * Math.sin(a * RAD))))));
        const cen = P3(C);
        const up = P3(spineAt(y - 1).c), dn = P3(spineAt(y + 1).c);
        let px = dn[1] - up[1], py = -(dn[0] - up[0]); const m = Math.hypot(px, py) || 1; px /= m; py /= m;
        let mn = Infinity, mx = -Infinity, pl = null, pr = null;
        for (const q of pts) { const v = (q[0] - cen[0]) * px + (q[1] - cen[1]) * py; if (v < mn) { mn = v; pl = q; } if (v > mx) { mx = v; pr = q; } }
        left.push(pl); right.push(pr);
        fronts.push({ p: P3(add(C, mul(Fw, d))), vis: Z(add(C, mul(Fw, d))) > Z(C) + 0.4 * d, y });
      }
      return { left, right, fronts };
    };

    /* ── HEAD: an egg with a jaw, rotated by turn + head turn and tilt ── */
    const hTurn = th + (pose.head[1] || 0) * RAD, hct = Math.cos(hTurn), hst = Math.sin(hTurn);
    const RX = F ? 4.7 : 5.0, RY = 6.7, RZ = 5.7;
    const headPt = (x, y, z) => {
      /* tilt about x (nod), then turn about y, relative to the head centre */
      const y1 = y * Math.cos(headTilt) - z * Math.sin(headTilt), z1 = y * Math.sin(headTilt) + z * Math.cos(headTilt);
      const X = x * hct + z1 * hst, Zh = -x * hst + z1 * hct;
      /* express in body coords so P3 can place it: undo the body turn for x/z */
      const bx = X * ct - Zh * st, bz = X * st + Zh * ct;
      return { p: P3(add(J.head, [bx, y1, bz])), z: Zh };
    };
    const skull = (x, y) => {  /* half-width of the face at height y (-1 top .. 1 chin) */
      const base = Math.sqrt(Math.max(0, 1 - y * y));
      return y > 0.15 ? base * lerp(1, 0.62, (y - 0.15) / 0.85) + (y > 0.85 ? 0 : 0) : base;
    };
    const headCloud = (ex, ey, ez, yMin, yMax, dy) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const v = lerp(yMin, yMax, i / 14), r = skull(0, v);
        for (let a = 0; a < 360; a += 20) {
          const x = Math.cos(a * RAD) * r * (RX + ex), z = Math.sin(a * RAD) * r * (RZ + ez);
          pts.push(headPt(x, v * (RY + ey) + (dy || 0), z).p);
        }
      }
      return pts;
    };

    const H = {};                                     /* hair geometry, used twice */
    const hairBackPoly = () => {
      const st = L.hairStyle;
      if (st === "none") return null;
      const pts = headCloud(0.8, 1.3, 0.9, -1, st === "short" ? 0.26 : 0.4, -0.7);
      H.cap = pts.slice();
      if (st === "bob" || st === "long") {
        const len = st === "bob" ? 9 : 19;
        for (const s of [-1, 1]) for (let i = 0; i <= 6; i++) {
          const y = lerp(0, len, i / 6), wx = (RX + 1.2 + (st === "long" ? i * 0.25 : 0.4)) * s;
          pts.push(headPt(wx, y, -1).p, headPt(wx * 0.9, y, -3.6).p);
        }
      }
      return hull(pts);
    };
    /* the hairline over the face: a curve on the expanded head across the visible front */
    const hairFrontPoly = (back) => {
      if (!back) return null;
      /* a hairline: high on the forehead, a little higher at the temples, then
         dropping steeply at the sideburn in front of the ear; a side parting
         sweeps the fringe lower on one side. A level hairline is a hat. */
      const st = L.hairStyle, fr = L.fringe ? -0.2 : -0.46, sb = st === "short" ? 0.12 : 0.3;
      const line = [];
      for (let az = -110; az <= 110; az += 6) {
        const a = Math.abs(az);
        let v = a < 72 ? fr + 0.05 * (a / 72) : a < 96 ? fr + 0.05 + (sb - fr - 0.05) * Math.pow((a - 72) / 24, 1.6) : sb;
        v += 0.1 * Math.max(0, Math.sin((az + 10) * RAD)) * (a < 60 ? 1 : 0);
        const r = skull(0, v);
        const q = headPt(Math.sin(az * RAD) * r * (RX + 0.75), v * (RY + 0.6) - 0.4, Math.cos(az * RAD) * r * (RZ + 0.8));
        if (q.z > -0.6) line.push(q.p);
      }
      if (line.length < 2) return null;
      /*
       * Close the hairline OVER THE TOP with a radial sweep about the head centre:
       * for each angle, the farthest cap point. Walking the convex hull between
       * the hairline's ends picked the wrong side in 3/4 views and laid the hair
       * over the face.
       */
      const cen = headPt(0, -0.6, 0).p, ang = (q) => Math.atan2(q[1] - cen[1], q[0] - cen[0]);
      const aE = ang(line[line.length - 1]), aS = ang(line[0]);
      const TOP = -Math.PI / 2;
      const norm2 = (x) => { while (x <= -Math.PI) x += 2 * Math.PI; while (x > Math.PI) x -= 2 * Math.PI; return x; };
      /* sweep from aE to aS in the direction that passes through the top */
      const ccw = norm2(aS - aE), cw = ccw > 0 ? ccw - 2 * Math.PI : ccw + 2 * Math.PI;
      const passes = (span) => { const t = norm2(TOP - aE); return span > 0 ? (t > 0 && t < span) : (t < 0 && t > span); };
      const span = passes(ccw) ? ccw : cw;
      const arc = [], N = 36;
      for (let i = 1; i < N; i++) {
        const a0 = aE + (span * i) / N;
        let r = 0;
        for (const q of H.cap) {
          const d = Math.abs(norm2(ang(q) - a0));
          if (d < 0.09) r = Math.max(r, Math.hypot(q[0] - cen[0], q[1] - cen[1]));
        }
        if (r > 0) arc.push([cen[0] + Math.cos(a0) * r, cen[1] + Math.sin(a0) * r]);
      }
      const poly = line.concat(arc); poly.nLine = line.length; return poly;
    };

    /*
     * HAIR TONE is STRANDS, not ruling: curves from the crown that follow the fall
     * of the hair. Parallel hatch on a cap read as a KNIT BEANIE (round 1).
     */
    const crown = () => headPt(L.part != null ? L.part : 1.6, -RY - 0.6, -0.4).p;
    const hairStrands = (poly, k2) => {
      const c = crown();
      let cx = 0, cy = 0; poly.forEach(([x, y]) => { cx += x / poly.length; cy += y / poly.length; });
      const n = Math.round(lerp(5, 9, k2));
      for (let i = 0; i < poly.length; i += Math.max(1, Math.floor(poly.length / n))) {
        const e = poly[i];
        if (e[1] < c[1] + 0.6 * sc) continue;
        const m = [lerp(c[0], e[0], 0.55) + (e[0] - cx) * 0.12, lerp(c[1], e[1], 0.5)];
        S.L(curve([[lerp(c[0], e[0], 0.12), lerp(c[1], e[1], 0.12)], m, [lerp(c[0], e[0], 0.9), lerp(c[1], e[1], 0.9)]], 4), TEX * 0.85, { curve: true, taper: [0.3, 1] });
      }
    };
    /* ── HANDS: built in 2D from the forearm's direction, sized to the face ── */
    const hand = (n) => {
      const hp = pose["hand" + n] || {};
      if (hp.hide) return;
      const s = n === "L" ? -1 : 1;
      const wr = P3(J["wr" + n]), el = P3(J["el" + n]);
      let dx = wr[0] - el[0], dy = wr[1] - el[1]; const m = Math.hypot(dx, dy);
      if (m < 2 * sc) { dx = 0; dy = 1; } else { dx /= m; dy /= m; }
      /* how flat the hand is to us: a hanging hand's palm faces the thigh, so from
         the front it is EDGE-ON; turned, it opens */
      /* never fully edge-on: a hand narrower than ~40% of its width reads as a fin */
      const wide = hp.wide != null ? hp.wide : clamp(Math.abs(Math.sin(th)) * 0.7 + 0.42, 0, 1);
      const style = hp.style || "relaxed";
      const len = (style === "fist" ? 6.4 : 9.6) * sc, pw = lerp(2.5, 4.2, wide) * sc;
      const nx = -dy, ny = dx;                       /* across the hand */
      const thumbSide = ((Z(J["wr" + n]) >= 0 ? 1 : -1) * (s * ct >= 0 ? 1 : -1) * (st > 0 ? -1 : 1)) || 1;
      const Q = (u, v) => [wr[0] + dx * u * len + nx * v * pw, wr[1] + dy * u * len + ny * v * pw];
      let pts;
      if (style === "open") {
        pts = [Q(0, -0.42), Q(0.42, -0.55), Q(0.95, -0.62), Q(1.05, -0.3), Q(1.08, 0.05), Q(1.02, 0.4), Q(0.62, 0.58), Q(0.55, 0.9), Q(0.38, 0.62), Q(0, 0.42)];
      } else if (style === "fist") {
        pts = [Q(0, -0.45), Q(0.55, -0.6), Q(1.0, -0.45), Q(1.05, 0.2), Q(0.8, 0.62), Q(0.3, 0.62), Q(0, 0.45)];
      } else {
        /* relaxed: palm, then fingers curling slightly toward the palm side */
        pts = [Q(0, -0.42), Q(0.5, -0.52), Q(0.86, -0.42), Q(1.0, -0.1), Q(0.96, 0.22), Q(0.7, 0.42), Q(0.5, 0.56 * thumbSide > 0 ? 0.56 : 0.5), Q(0.3, 0.5), Q(0, 0.42)];
      }
      const sh = curve(pts, 4, true);
      S.F(sh, L.skin, { w: 0 });
      if (tone) S.hatch(sh, tone);
      S.L(sh, DET, { closed: true, curve: true });
      /* the line that says HAND: finger divisions (open) or the thumb (otherwise) */
      if (style === "open") for (const v of [-0.3, 0.02, 0.32]) S.L([Q(0.62, v * 0.9), Q(0.98, v)], TEX * 0.9);
      else if (style === "fist") { for (const u of [0.62, 0.82]) S.L([Q(u, -0.2), Q(u + 0.02, 0.3)], TEX * 0.9); S.L(curve([Q(0.25, 0.4), Q(0.6, 0.15), Q(0.82, 0.05)], 3), TEX, { curve: true }); }
      else { S.L(curve([Q(0.22, 0.3), Q(0.5, 0.12), Q(0.7, 0.14)], 3), TEX * 0.9, { curve: true }); if (wide > 0.45) S.L([Q(0.62, -0.12), Q(0.92, -0.08)], TEX * 0.8); }
    };

    /* ── FEET: a shoe as a 3D point cloud from the ankle, turned out ── */
    const shoe = (n) => {
      const s = n === "L" ? -1 : 1, toe = (pose["toe" + n] || 0) * s * RAD;
      const an = J["an" + n];
      const fwd = [Math.sin(toe), 0, Math.cos(toe)], side = [Math.cos(toe), 0, -Math.sin(toe)];
      const heelUp = pose["heel" + n] ? 0 : 0;
      const at = (f, sd, y) => P3(add(an, add(add(mul(fwd, f), mul(side, sd)), [0, y + heelUp, 0])));
      const groundY = (soleY - an[1]);       /* the sole sits on the ground */
      const gy0 = Math.min(4.7, groundY);
      const pts = [];
      for (const [f, w] of [[-3.2, 1.7], [-2.6, 2.0], [2, 2.2], [7.5, 2.4], [10.5, 1.9], [12.2, 1.0], [12.6, 0]]) for (const sd of [-w, w]) {
        pts.push(at(f, sd, gy0), at(f, sd, gy0 - 1.3));
      }
      for (const [f, w, y] of [[-2.6, 1.8, -0.6], [1.8, 2.0, -0.2], [6, 2.3, 1.0], [10, 2.0, 1.9], [12, 1.0, 2.6]]) for (const sd of [-w, w]) pts.push(at(f, sd, y));
      const sil = hull(pts);
      const soleTop = [];
      for (const [f, w] of [[-3, 1.75], [2, 2.25], [7.5, 2.45], [10.5, 1.95], [12.3, 0.9], [12.6, 0]]) soleTop.push([f, w]);
      S.F(sil, L.shoe, { w: 0 });
      if (tone) S.hatch(sil, tone);
      /* the sole line: the visible near edge of the sole's top, a little above the ground */
      const sl = [];
      for (const [f, w] of soleTop) sl.push(at(f, Z(add(an, mul(side, w))) >= Z(add(an, mul(side, -w))) ? w : -w, gy0 - 1.3));
      S.L(sl, TEX * 1.1, { curve: true });
      S.L(sil, OUT, { closed: true, curve: true });
      /* the opening / lacing: a short line on the top, facing us */
      S.L([at(1.2, 0, 0.2), at(6.6, 0, 2.0)], TEX);
    };

    /* ── order: every part with a depth ── */
    const zMean = (...ps) => ps.reduce((s, p) => s + Z(p), 0) / ps.length;
    const sides = ["L", "R"];
    const trouserEase = L.bottomStyle === "wide" ? 1.6 : 0.9;
    const legColour = L.bottomStyle === "skirt" || L.bottomStyle === "shorts" ? L.skin : L.bottom;
    for (const n of sides) {
      const zLeg = zMean(J["hip" + n], J["kn" + n], J["an" + n]);
      parts.push({ z: Z(J["kn" + n]) > 8 ? Z(J["an" + n]) + 0.6 : Math.min(Z(J["an" + n]), 0) - 0.6, k: "shoe" + n, draw: () => shoe(n) });
      parts.push({ z: Z(J["kn" + n]) > 8 ? zLeg : Math.min(zLeg, 0) - 0.3, k: "leg" + n, draw: () => {
        const pts = limb([J["hip" + n], J["kn" + n], J["an" + n]], [PROF.thigh, PROF.shin], legColour === L.skin ? 0 : trouserEase);
        drawStrip(pts, legColour, { shade: legColour !== L.skin });
        const kn = P3(J["kn" + n]);
        const thighLen = Math.hypot(...[0, 1].map((i) => P3(J["hip" + n])[i] - kn[i]));
        if (thighLen < BONE.thigh * sc * 0.55) {
          /* foreshortened thigh (sitting, seen from the front): the knee is a cap */
          const cap = ov(kn[0], kn[1], 3.3 * sc, 3.0 * sc, 0, 360, 20);
          S.F(cap, legColour, { w: 0 }); if (tone) S.hatch(cap, tone);
          S.L(ov(kn[0], kn[1], 3.3 * sc, 3.0 * sc, 200, 340, 12), OUT, { curve: true });
        }
        if (L.bottomStyle === "shorts") {
          const sp = limb([J["hip" + n], J["kn" + n]], [[[0, 5.4], [0.55, 4.3]]], 1.2);
          drawStrip(sp.slice(0, Math.round(sp.length * 0.9)), L.bottom, { shade: true, cap: true });
        }
        /* folds: behind a bent knee, the break at the hem */
        const bend = Math.acos(clamp(dot3(norm(sub3(J["kn" + n], J["hip" + n])), norm(sub3(J["an" + n], J["kn" + n]))), -1, 1)) / RAD;
        if (legColour !== L.skin) {
          if (bend > 12) for (const f of [-1.2, 1.2]) S.fold([[kn[0] - 2 * sc, kn[1] + f * sc], [kn[0], kn[1] + (f + 0.8) * sc], [kn[0] + 2 * sc, kn[1] + f * sc]], TEX);
          const an = P3(J["an" + n]);
          S.fold([[an[0] - 2.2 * sc, an[1] - 2.4 * sc], [an[0], an[1] - 1.4 * sc], [an[0] + 2.2 * sc, an[1] - 2.6 * sc]], TEX);
        }
      } });
      const zArm = zMean(J["sh" + n], J["el" + n], J["wr" + n]);
      parts.push({ z: zArm + (Math.abs(st) < 0.3 ? 2.5 : 0), k: "arm" + n, draw: () => {
        const sleeve = L.topStyle === "tank" ? 0 : L.topStyle === "tee" ? 0.55 : 1;
        /* the arm's chain starts ON TOP OF THE TRAPEZIUS, so the strip's outer edge
           is the shoulder line itself, neck to deltoid to elbow, in one stroke */
        const s = n === "L" ? -1 : 1;
        const root = add(add(neckBase, mul(across(pose.shoulders), s * (F ? 4.0 : 4.4))), [0, 1.7, 0]);
        const pit = [...P3(J["sh" + n]), 5.4 * sc];
        const skinArm = limb([root, J["sh" + n], J["el" + n], J["wr" + n]], [[[0, 1.3], [1, 3.2]], PROF.upper.slice(1), PROF.fore], 0);
        /* bare skin only where a sleeve does not cover it (under a long sleeve it
           peeked out at the shoulder as a fleck) */
        if (sleeve < 1) { if (sleeve > 0) drawStrip(skinArm.slice(Math.round(skinArm.length * 0.45)), L.skin, {}); else drawStrip(skinArm, L.skin, { pit }); }
        /* (a separate shoulder cap poked out as a knob: the arm instead starts a
           little INSIDE the shoulder, so its round top merges with the torso) */
        if (sleeve > 0) {
          const sl = limb([root, J["sh" + n], J["el" + n], J["wr" + n]], [[[0, 1.6], [1, 4.0]], PROF.upper.slice(1).map(([f, w]) => [f, w + 0.9]), PROF.fore.map(([f, w]) => [f, w + 0.8])], 0);
          const cut = sleeve >= 1 ? sl.length : Math.round(sl.length * 0.5);
          /* no hatch on sleeves: on a form this narrow it is a row of loose ticks */
          drawStrip(sl.slice(0, cut), L.top, { pit, cap: sleeve < 1, capW: DET });
          const el = P3(J["el" + n]);
          const bend = Math.acos(clamp(dot3(norm(sub3(J["el" + n], J["sh" + n])), norm(sub3(J["wr" + n], J["el" + n]))), -1, 1)) / RAD;
          if (sleeve >= 1 && bend > 15) {
            for (const f of [-1, 0.6]) S.fold([[el[0] - 1.6 * sc, el[1] + f * sc], [el[0], el[1] + (f + 1) * sc], [el[0] + 1.4 * sc, el[1] + f * sc]], TEX);
          }
        }
      } });
      parts.push({ z: Z(J["wr" + n]) + (Math.abs(st) < 0.3 ? 2.6 : 0.2), k: "hand" + n, draw: () => hand(n) });
    }
    /* the torso: bottoms (pelvis) then the top over it */
    parts.push({ z: 0.1, k: "pelvis", draw: () => {
      if (L.bottomStyle === "skirt") {
        const T = torsoPiece(40, 76, 0.4, [48, 76, 6]);
        const poly = T.left.concat(T.right.slice().reverse());
        fillLine(poly, L.bottom, {});
        S.L(T.left, OUT, { curve: true }); S.L(T.right, OUT, { curve: true });
        S.L(curve([T.left[T.left.length - 1], [lerp(T.left[T.left.length - 1][0], T.right[T.right.length - 1][0], 0.5), T.left[T.left.length - 1][1] + 1.6 * sc], T.right[T.right.length - 1]], 5), OUT, { curve: true });
        for (const f of [0.3, 0.55, 0.78]) { const a = T.left[Math.round(T.left.length * 0.5)], b = T.right[Math.round(T.right.length * 0.5)]; const e = T.left[T.left.length - 1], g = T.right[T.right.length - 1]; S.fold([[lerp(a[0], b[0], f), a[1]], [lerp(e[0], g[0], f + (f - 0.5) * 0.2), e[1] - 0.4 * sc]], TEX); }
        return;
      }
      const T = torsoPiece(41, 56.5, L.bottomStyle === "skirt" ? 0 : 0.7);
      const bl = T.left[T.left.length - 1], br = T.right[T.right.length - 1];
      const crotch = [lerp(bl[0], br[0], 0.5), bl[1] + 2.2 * sc];
      const poly = T.left.concat([crotch], T.right.slice().reverse());
      fillLine(poly, L.bottom, {});
      S.L(T.left, OUT, { curve: true }); S.L(T.right, OUT, { curve: true });
      /* the fly and the crotch folds, on the front */
      const fr = T.fronts.filter((f) => f.vis);
      if (fr.length > 3 && Math.abs(st) < 0.4) {
        S.L(fr.slice(2).map((f) => f.p), TEX * 0.9, { curve: true });
        const c = fr[fr.length - 1].p;
        S.fold([[c[0] - 0.4 * sc, c[1]], [c[0] - 3 * sc, c[1] - 1.6 * sc]], TEX); S.fold([[c[0] + 0.4 * sc, c[1]], [c[0] + 3 * sc, c[1] - 1.6 * sc]], TEX);
      }
    } });
    parts.push({ z: 0.3, k: "torso", draw: () => {
      /* skin: the neck, under the collar */
      const N = torsoPiece(9, 18.5, 0);
      fillLine(N.left.concat(N.right.slice().reverse()), L.skin, {});
      S.L(N.left.slice(0, -2), OUT, { curve: true }); S.L(N.right.slice(0, -2), OUT, { curve: true });
      const coat = L.topStyle === "coat", hem = coat ? 74 : L.topStyle === "tucked" ? 45 : 53.5;
      const T = torsoPiece(16.2, hem, coat ? 1.2 : 0.55, coat ? [50, 74, 3.4] : null);
      const poly = T.left.concat(T.right.slice().reverse());
      /* the shadow side as a strip down the far edge */
      const shadeSide = st > 0.2 ? T.left : T.right;
      const strip = shadeSide.concat(shadeSide.map((p, i) => [lerp(p[0], (T.left[i][0] + T.right[i][0]) / 2, 0.24), lerp(p[1], (T.left[i][1] + T.right[i][1]) / 2, 0.24)]).reverse());
      fillLine(poly, L.top, { shadeStrip: strip });
      S.L(T.left, OUT, { curve: true }); S.L(T.right, OUT, { curve: true });
      S.L(curve([T.left[T.left.length - 1], [lerp(T.left[T.left.length - 1][0], T.right[T.right.length - 1][0], 0.5), Math.max(T.left[T.left.length - 1][1], T.right[T.right.length - 1][1]) + 0.9 * sc], T.right[T.right.length - 1]], 5), OUT, { curve: true });
      /* the neckline: a U on the front, or across the top seen from behind */
      const fv = T.fronts.filter((f) => f.vis);
      const nl = T.left[0], nr = T.right[0];
      if (Math.cos(th) > -0.2 && fv.length) {
        const fp = fv[0].p;
        const dip = L.topStyle === "vneck" ? 4.2 : 2.0;
        const cl = [nl, [fp[0], fp[1] + dip * sc], nr];
        S.F(curve([nl, [fp[0], fp[1] + dip * sc], nr, [fp[0], fp[1] - 1 * sc]], 4, true), L.skin, { w: 0 });
        S.L(curve(cl, 5), DET, { curve: true });
      } else S.L(curve([nl, [(nl[0] + nr[0]) / 2, nl[1] - 0.6 * sc], nr], 4), DET, { curve: true });
      /* front centre: buttons / a zip on a coat */
      if (coat && fv.length > 4) S.L(fv.slice(2).map((f) => f.p), DET, { curve: true });
      /* folds: from the armpit toward the waist, light */
      for (const side of [T.left, T.right]) {
        const a = side[Math.round(side.length * 0.22)], b = side[Math.round(side.length * 0.5)];
        const cx = (T.left[Math.round(T.left.length * 0.5)][0] + T.right[Math.round(T.right.length * 0.5)][0]) / 2;
        S.fold([[lerp(a[0], cx, 0.12), a[1]], [lerp(b[0], cx, 0.22), b[1]]], TEX * 0.85);
      }
    } });
    /* hair BEHIND the head is its own part, painted before the body: drawn with the
       head, long hair landed over the neck and chest like a beard */
    const back = hairBackPoly();
    parts.push({ z: -20, k: "hairBack", draw: () => {
      if (back) { S.F(back, L.hair, { w: 0 }); if (tone) S.hatch(back, tone); else hairStrands(back, 0.6); S.L(back, OUT, { closed: true, curve: true }); }
      /* a bun is its own ROUND at the back of the crown; folded into the hair hull it made a peak */
      if (L.hairStyle === "bun") {
        const c = headPt(0, -RY + 0.4, -RZ - 0.6).p, r = 2.8 * sc, b2 = ov(c[0], c[1], r, r * 0.92, 0, 360, 20);
        S.F(b2, L.hair, { w: 0 }); if (tone) S.hatch(b2, tone);
        S.L(b2, OUT, { closed: true, curve: true });
        S.L(ov(c[0] - 0.3 * sc, c[1], r * 0.55, r * 0.45, 200, 380, 10), TEX, { curve: true });
      }
    } });
    parts.push({ z: Z(J.head) + 0.5, k: "head", draw: () => {
      /* ears: visible on whichever side faces us */
      for (const s of [-1, 1]) {
        const q = headPt(s * RX * 0.96, 0.6, -0.4);
        if (q.z > -1.2) { const e = ov(q.p[0], q.p[1], Math.max(0.5, 1.15 * Math.abs(hst) + 0.55) * sc, 1.7 * sc, 0, 360, 14); S.F(e, L.skin, { w: 0 }); S.L(e, DET, { closed: true, curve: true }); }
      }
      /* the face: an egg with a jaw, the nose and chin added to the cloud for profiles */
      const pts = headCloud(0, 0, 0, -1, 1);
      pts.push(headPt(0, 1.9, RZ * 0.93 + 1.5).p, headPt(0, 5.9, RZ * 0.6).p);
      const face = hull(pts);
      S.F(face, L.skin, { w: 0 });
      if (tone) S.hatch(face, tone);
      S.L(face, OUT, { closed: true, curve: true });
      if (!o.noFace && hct > -0.25) {
        const vis = (q) => q.z > 0.6;
        for (const s of [-1, 1]) {
          const e = headPt(s * 1.95, -0.1 + (o.lookDown ? 0.5 : 0), RZ * 0.86);
          if (vis(e)) {
            const ew = Math.max(0.28, 0.5 * (e.z / RZ)) * sc;
            if (o.lookDown) S.L([[e.p[0] - ew * 1.6, e.p[1]], [e.p[0] + ew * 1.6, e.p[1] + 0.2 * sc]], DET * 1.1);
            else S.F(ov(e.p[0], e.p[1], ew, 0.62 * sc, 0, 360, 10), "#1C1A1A", { w: 0 });
            const b = headPt(s * 2.0, -1.55, RZ * 0.88);
            if (vis(b)) S.L([headPt(s * 1.1, -1.4, RZ * 0.9).p, b.p, headPt(s * 2.9, -1.2, RZ * 0.8).p].filter((p, i) => i !== 2 || headPt(s * 2.9, -1.2, RZ * 0.8).z > 0.4), TEX * 1.3, { curve: true });
          }
        }
        /* the nose: bridge → tip → the nostril's base, on the shadow side */
        const nb = headPt(0.2, -0.3, RZ * 0.98), nt = headPt(0.35, 1.9, RZ * 0.93 + 1.4), ns = headPt(-0.7, 2.25, RZ * 0.86);
        S.L([nb.p, nt.p, ns.p], TEX * 1.3, { curve: false });
        const m = [headPt(-1.25, 3.55, RZ * 0.72), headPt(0, 3.85, RZ * 0.78), headPt(1.25, 3.55, RZ * 0.72)].filter(vis);
        if (m.length >= 2) S.L(curve(m.map((q) => q.p), 3), TEX * 1.3, { curve: true });
      }
      /* the hair over the brow, and strands that say which way it falls */
      const front = hairFrontPoly(back);
      if (front) {
        S.F(front, L.hair, { w: 0 });
        if (tone) S.hatch(front, tone); else hairStrands(front, 1);
        /* the HAIRLINE is where hair meets skin, not a silhouette: a light line,
           broken into locks. At full outline weight it read as a headband. */
        const hl = front.slice(0, front.nLine), top = front.slice(front.nLine - 1).concat([front[0]]);
        S.L(top, OUT, { curve: true });
        for (let i = 0; i < hl.length - 1; i += 3) S.L(hl.slice(i, Math.min(hl.length, i + 4)), TEX * 1.25, { curve: true, taper: [0.5, 1] });
      }
    } });
    /* hooks: things held or carried, at a depth */
    for (const hk of o.extras || []) parts.push({ z: typeof hk.z === "function" ? hk.z(J, Z) : hk.z || 0, draw: () => hk.draw(J, P3, sc) });

    parts.sort((a, b) => a.z - b.z);
    for (const p of parts) p.draw();
    return { J, P3, Z, sc };
  }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /* ── the study set: one figure per tile, each attacking a pose ─────────── */
  const D = {}, NAMES = {}, ASPECT = {};
  const def = (key, name, asp, fn) => { D[key] = fn; NAMES[key] = name; ASPECT[key] = asp; };
  const floor = (S, W, y) => { S.L([[0, y], [W, y]], S.k.TEX * 0.8); };

  def("stand", "Standing, weight on one leg", 0.62, (S) => {
    S.panel(0, 0, 62, 100, "#FFFFFF"); floor(S, 62, 95);
    figure(S, { x: 31, gy: 95, h: 86, pose: "stand", look: { build: "f", hairStyle: "long", hair: "#3A2A22", top: "#D9A23B", topStyle: "long", bottom: "#4A6A93", shoe: "#F4F1EA" } });
  });
  def("threeq", "Three-quarter, holding a cup", 0.62, (S) => {
    S.panel(0, 0, 62, 100, "#FFFFFF"); floor(S, 62, 95);
    figure(S, { x: 31, gy: 95, h: 86, turn: 32, pose: "cup", look: { build: "m", hairStyle: "short", hair: "#2A1E18", skin: "#C98E68", top: "#5B7FA8", topStyle: "long", bottom: "#3F4756", shoe: "#2C2C30" },
      extras: [{ z: (J, Z) => Z(J.wrR) + 3, draw: (J, P3, sc) => {
        const w = P3(J.wrR), c = [w[0] + 1.2 * sc, w[1] - 3.2 * sc];
        const cup = [[c[0] - 2.2 * sc, c[1] - 3.2 * sc], [c[0] + 2.2 * sc, c[1] - 3.2 * sc], [c[0] + 1.7 * sc, c[1] + 2.6 * sc], [c[0] - 1.7 * sc, c[1] + 2.6 * sc]];
        S.F(cup, "#F2EEE6", { w: S.k.DET }); S.L(ov(c[0], c[1] - 3.2 * sc, 2.2 * sc, 0.6 * sc), S.k.TEX, { closed: true, curve: true });
        S.F([[c[0] - 2 * sc, c[1] - 0.6 * sc], [c[0] + 2 * sc, c[1] - 0.6 * sc], [c[0] + 1.9 * sc, c[1] + 0.8 * sc], [c[0] - 1.9 * sc, c[1] + 0.8 * sc]], "#9A5A3A", { w: 0 });
      } }] });
  });
  def("walk", "Walking, side on", 0.7, (S) => {
    S.panel(0, 0, 70, 100, "#FFFFFF"); floor(S, 70, 95);
    figure(S, { x: 34, gy: 95, h: 86, turn: 90, pose: "walk", look: { build: "f", hairStyle: "bun", hair: "#5A3A26", skin: "#E8BFA0", top: "#B8564A", topStyle: "tee", bottom: "#2F3542", shoe: "#F4F1EA" } });
  });
  def("sit", "Sitting on a stool, side on", 0.75, (S) => {
    const k = S.k;
    S.panel(0, 0, 75, 100, "#FFFFFF"); floor(S, 75, 95);
    /* the stool first; the sitter is placed so the seat meets the thighs */
    const sy = 66;
    S.F([[28, sy], [52, sy], [52, sy + 2.6], [28, sy + 2.6]], "#C9A06A", { w: k.OUT * 0.9 });
    for (const [a, b] of [[31, 29], [49, 51]]) S.limb([[a, sy + 2.6], [b, 95]], 1.6, 1.4, "#9C7448", { shade: false, w: k.DET });
    S.L([[30, 84], [50, 84]], k.DET);
    figure(S, { x: 38, gy: 95, h: 86, turn: 90, pose: "sitSide", lookDown: true, look: { build: "m", hairStyle: "short", hair: "#1F1A18", skin: "#B98060", top: "#6E8C7A", topStyle: "long", bottom: "#4A4036", shoe: "#2C2C30" },
      extras: [{ z: 30, draw: (J, P3, sc) => { const a = P3(J.wrL), b = P3(J.wrR); const c = [(a[0] + b[0]) / 2 + 1 * sc, (a[1] + b[1]) / 2 - 1 * sc];
        S.F([[c[0] - 0.6 * sc, c[1] - 4 * sc], [c[0] + 0.8 * sc, c[1] - 4.2 * sc], [c[0] + 0.6 * sc, c[1] + 3 * sc], [c[0] - 0.8 * sc, c[1] + 3.2 * sc]], "#2A2A2E", { w: S.k.DET }); } }] });
  });
  def("wave", "Waving", 0.7, (S) => {
    S.panel(0, 0, 70, 100, "#FFFFFF"); floor(S, 70, 95);
    figure(S, { x: 33, gy: 95, h: 86, pose: "wave", look: { build: "m", hairStyle: "short", hair: "#C9A36A", skin: "#F0C8A8", top: "#3E8E86", topStyle: "tee", bottom: "#C8B48A", bottomStyle: "shorts", shoe: "#3A3A3A" } });
  });
  def("pockets", "Hands in pockets, three-quarter", 0.62, (S) => {
    S.panel(0, 0, 62, 100, "#FFFFFF"); floor(S, 62, 95);
    figure(S, { x: 31, gy: 95, h: 86, turn: -35, pose: "pockets", look: { build: "f", hairStyle: "bob", hair: "#171414", skin: "#D9A47E", top: "#8C6BA8", topStyle: "long", bottom: "#2B2B30", shoe: "#C8462E" } });
  });
  def("dress", "Skirt and coat, the back turned a little", 0.62, (S) => {
    S.panel(0, 0, 62, 100, "#FFFFFF"); floor(S, 62, 95);
    figure(S, { x: 31, gy: 95, h: 86, turn: 18, pose: "stand", look: { build: "f", hairStyle: "long", hair: "#7A4A2A", skin: "#EDC4A4", top: "#C77D3E", topStyle: "coat", bottom: "#3F4756", bottomStyle: "skirt", shoe: "#2C2C30" } });
  });
  def("group", "Three people talking", 1.4, (S) => {
    S.panel(0, 0, 140, 100, "#FFFFFF"); floor(S, 140, 95);
    figure(S, { x: 34, gy: 95, h: 84, turn: 40, pose: "pockets", look: { build: "m", hairStyle: "short", hair: "#2A1E18", skin: "#C98E68", top: "#5B7FA8", topStyle: "long", bottom: "#3F4756", shoe: "#2C2C30" } });
    figure(S, { x: 72, gy: 95, h: 80, turn: 0, pose: "stand", look: { build: "f", hairStyle: "bun", hair: "#171414", skin: "#8E5B3E", top: "#E0B84A", topStyle: "tee", bottom: "#6E4A6E", bottomStyle: "skirt", shoe: "#2C2C30" } });
    figure(S, { x: 108, gy: 95, h: 88, turn: -50, pose: "cup", look: { build: "m", hairStyle: "short", hair: "#8A8A8A", skin: "#E8BFA0", top: "#7E9B5E", topStyle: "long", bottom: "#C8B48A", shoe: "#5A3A2A" } });
  });

  const out = { figure, POSES, _keys: Object.keys(D), _names: NAMES, _aspect: ASPECT };
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [80, 50], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
      const t = Retro._kit.kit(k, { yaw: 0, pitch: 0 });
      const S = Trials._extend(StillLife._stage(t, 0.2));
      D[key](S);
      t.flush();
      const o = k.done();
      const xs = o.regions[0].pts.map((p) => p[0]), ys = o.regions[0].pts.map((p) => p[1]);
      o.frame = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      return o;
    });
    out[key].clip = true;
  }
  return out;
})();
