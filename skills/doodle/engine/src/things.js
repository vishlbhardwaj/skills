/*
 * THINGS: the object stress set. Twenty daily-life objects, each picked so no two
 * share a failure mode:
 *   phone (rounded slab from above, black glass)    laptop (two planes at a hinge, a key grid)
 *   headphones (arcing band, cushion rings)         scissors (crossed blades, finger loops)
 *   glasses (thin frames, transparency)             watch (dial ticks, strap receding)
 *   toothbrush (bristles, leaning, a soft tube)     hairdryer (compound product curves)
 *   keys (overlapping small metal, bitting)         tshirts (stacked folded fabric)
 *   soap (amber glass, label, pump)                 iron (wedge soleplate, handle hole)
 *   notebook (repeating spiral rings)               padlock (shackle, keyhole, brass)
 *   teddy (plush organic, fur as line)              bottle (brushed steel, wrapped decals)
 *   bulb (glass, screw thread, filament)            hanger (wire, fabric hanging)
 *   backpack (soft bag, zips, straps)               umbrella (spiral folds, J handle)
 *
 * Picture plane (Retro._kit square-on), the still-life stage + Trials._extend, plus
 * a small 3D helper here: `cam` (orthographic yaw/pitch) and `prism` (a convex
 * planar shape extruded; silhouette = hull, the visible cap and the visible
 * corner edges drawn), for things that lie on a table or turn in space.
 */
window.Things = (function () {
  const { ov, rect, rot, curve } = StillLife._util;
  const { mix } = Scapes._util;
  const { edges, holes } = Trials._util;
  const RAD = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  let rs = 3;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };

  const hull = (P) => {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /* a rounded rectangle, as 2D points */
  const rr = (w, h, r, n) => {
    const o = [], N = n || 5;
    for (const [cx, cy, a0] of [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]])
      for (let i = 0; i <= N; i++) { const a = (a0 + (90 * i) / N) * RAD; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return o;
  };

  /*
   * The camera: y DOWN, z toward the viewer; yaw about the vertical, then pitch so
   * that positive pitch looks DOWN onto tops (a top's normal (0,-1,0) faces us).
   */
  const cam = (yaw, pitch, s, ox, oy) => {
    const cy = Math.cos(yaw * RAD), sy = Math.sin(yaw * RAD), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD);
    const R = ([x, y, z]) => { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; return [x1, y * cp + z1 * sp, -y * sp + z1 * cp]; };
    return { R, P: (p) => { const r = R(p); return [ox + r[0] * s, oy + r[1] * s]; }, Z: (p) => R(p)[2] };
  };

  function extend(S) {
    const k = S.k, OUT = k.OUT, DET = k.DET, TEX = k.TEX;
    /* a dashed line (stitching, perforation): the engine has no dash option */
    S.dash = (pts, w, on, off) => {
      const C = curve(pts, 6);
      let acc = 0, cur = [C[0]], drawing = true;
      for (let i = 1; i < C.length; i++) {
        const d = Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]);
        acc += d;
        if (drawing) cur.push(C[i]);
        if (acc >= (drawing ? on : off)) {
          if (drawing && cur.length > 1) S.L(cur, w || TEX);
          drawing = !drawing; acc = 0; cur = [C[i]];
        }
      }
      if (drawing && cur.length > 1) S.L(cur, w || TEX);
    };
    /*
     * PRISM: a convex planar polygon `base` (3D) extruded by `e`. The silhouette is
     * the hull of both caps; the cap facing us gets its own fill and line; a corner
     * edge is drawn only where two VISIBLE side faces meet (o.sharp), so a rounded
     * slab stays one smooth body and a box shows its corners.
     */
    S.prism = (C, base, e, side, cap, o) => {
      o = o || {};
      const top = base.map((p) => add(p, e));
      const Pb = base.map(C.P), Pt = top.map(C.P), H = hull(Pb.concat(Pt));
      const capOut = C.R(e)[2] > 0;
      S.F(H, side, { w: 0, sh: o.sideSh == null ? 0.8 : o.sideSh });
      if (o.sideTone) S.hatch(H, o.sideTone);
      const cp = capOut ? Pt : Pb, cp3 = capOut ? top : base;
      S.F(cp, cap || side, { w: 0, sh: o.capSh });
      if (o.capTone) S.hatch(cp, o.capTone);
      if (o.sharp) {
        let cx = [0, 0, 0]; base.forEach((p) => { cx = add(cx, p.map((v) => v / base.length)); });
        const vis = base.map((p, i) => {
          const q = base[(i + 1) % base.length];
          let n = cross(sub(q, p), e); const mid = add(p, sub(q, p).map((v) => v / 2));
          if ((n[0] * (mid[0] - cx[0]) + n[1] * (mid[1] - cx[1]) + n[2] * (mid[2] - cx[2])) < 0) n = n.map((v) => -v);
          return C.R(n)[2] > 0;
        });
        base.forEach((p, i) => { if (vis[i] && vis[(i - 1 + base.length) % base.length]) S.L([Pb[i], Pt[i]], DET); });
      }
      S.L(cp, o.capW || DET, { closed: true, curve: !!o.round });
      S.L(H, OUT, { closed: true, curve: !!o.round });
      return { cap: cp, cap3: cp3, H, Pb, Pt };
    };
    /* a flat shape lying in a 3D plane: origin + u + v axes, 2D points */
    S.on = (C, o3, u, v, pts) => pts.map(([a, b]) => C.P(add(o3, add(u.map((x) => x * a), v.map((x) => x * b)))));
    return S;
  }

  const D = {}, NAMES = {}, ASPECT = {}, QQ = {};
  const def = (key, name, asp, q, fn) => { D[key] = fn; NAMES[key] = name; ASPECT[key] = asp; QQ[key] = q; };
  const tile = (S, W) => S.panel(0, 0, W, 100, "#FFFFFF");

  /* 1 · a phone lying on the table, seen from above at an angle */
  def("phone", "Phone on a table", 1.2, 0.3, (S) => {
    const k = S.k; tile(S, 120);
    const C = cam(-28, 58, 1, 60, 54);
    const sh = rr(36, 74, 6, 6).map(([x, z]) => [x, 0, z]);
    S.F(hull(sh.map((p) => C.P(add(p, [2.6, 3.6, 2])))), "#00000016", { w: 0 });
    S.hatch(hull(sh.map((p) => C.P(add(p, [2.6, 3.6, 2])))), { gap: 1.1, ang: 20, w: k.TEX * 0.6 });
    const ph = S.prism(C, sh, [0, -3.4, 0], "#9AA0A6", "#2A2C30", { round: true });
    /* the screen: black glass, cross-hatched, with ONE reflection band left as paper */
    const scr = S.on(C, [0, -3.4, 0], [1, 0, 0], [0, 0, 1], rr(32.4, 70.4, 4.4, 6));
    S.F(scr, "#15171A", { w: 0 });
    const band = S.on(C, [0, -3.4, 0], [1, 0, 0], [0, 0, 1], [[-16, -6], [-16, 10], [16, -18], [16, -34]]);
    S.hatch(holes(scr, [band]), { gap: 0.8, ang: 35, cross: true, w: k.TEX * 0.55 });
    S.F(band, "#3A3E44", { w: 0 });
    S.L(scr, k.DET, { closed: true, curve: true });
    S.F(S.on(C, [0, -3.4, 0], [1, 0, 0], [0, 0, 1], rr(10, 3, 1.5, 3).map(([a, b]) => [a, b - 31.4])), "#000000", { w: k.TEX });
    for (const [z0, z1] of [[-20, -12], [-8, -2]]) S.L([C.P([18.2, -1.6, z0]), C.P([18.2, -1.6, z1])], k.DET * 1.4);
  });

  /* 2 · an open laptop: base slab, lid at 110°, a foreshortened key grid */
  def("laptop", "Open laptop", 1.4, 0.3, (S) => {
    const k = S.k; tile(S, 140);
    const C = cam(-24, 24, 1.05, 70, 66);
    const W = 64, Dp = 44;
    S.F(hull([[-W / 2, 0, -Dp / 2], [W / 2, 0, -Dp / 2], [W / 2, 0, Dp / 2], [-W / 2, 0, Dp / 2]].map((p) => C.P(add(p, [3, 2.6, 3])))), "#00000014", { w: 0 });
    const base = S.prism(C, rr(W, Dp, 2.4, 3).map(([x, z]) => [x, 0, z]), [0, -2.4, 0], "#A9AEB4", "#C9CDD2", { round: true });
    /* keys: a grid in the plane of the deck, rows foreshortened by the camera */
    const deck = (a, b) => S.on(C, [0, -2.4, 0], [1, 0, 0], [0, 0, 1], [[a, b]])[0];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
      const x0 = -27 + c * 4.6, z0 = -18 + r * 4.4;
      if (r === 4 && c > 3 && c < 9) { if (c === 4) S.L([deck(x0, z0), deck(x0 + 4.6 * 5 - 0.8, z0), deck(x0 + 4.6 * 5 - 0.8, z0 + 3.6), deck(x0, z0 + 3.6)], k.TEX * 0.8, { closed: true }); continue; }
      const q = [deck(x0, z0), deck(x0 + 3.8, z0), deck(x0 + 3.8, z0 + 3.6), deck(x0, z0 + 3.6)];
      S.F(q, "#3A3D42", { w: 0 }); S.L(q, k.TEX * 0.7, { closed: true });
    }
    const tp = [deck(-10, 6), deck(10, 6), deck(10, 19), deck(-10, 19)];
    S.L(tp, k.TEX, { closed: true });
    /* the lid: hinged at the back edge, tilted back 20° past vertical */
    const a = 110 * RAD, hz = -Dp / 2;
    const lidPt = ([x, t]) => [x, -2.4 - Math.sin(a) * t, hz - Math.cos(a) * -t];
    const lidBase = rr(W, Dp - 2, 2.4, 3).map(([x, z]) => lidPt([x, z + (Dp - 2) / 2]));
    const n = [0, Math.cos(a), Math.sin(a) * -1];
    const lid = S.prism(C, lidBase, n.map((v) => v * 1.6), "#A9AEB4", "#1C1E22", { round: true });
    const scr = rr(W - 6, Dp - 9, 1.6, 3).map(([x, z]) => C.P(add(lidPt([x, z + (Dp - 2) / 2 + 1.2]), n.map((v) => v * 1.7))));
    S.F(scr, "#2B3A4A", { w: 0 });
    const win = [[-20, 8], [16, 8], [16, 30], [-20, 30]].map(([x, z]) => C.P(add(lidPt([x, z]), n.map((v) => v * 1.8))));
    S.F(win, "#DCE6EE", { w: 0 }); S.L(win, k.TEX, { closed: true });
    for (let i = 0; i < 4; i++) S.L([[-17, 12 + i * 4], [6 - i * 4, 12 + i * 4]].map(([x, z]) => C.P(add(lidPt([x, z]), n.map((v) => v * 1.9)))), k.TEX * 0.7);
    S.hatch(holes(scr, [win]), { gap: 0.9, ang: 40, w: k.TEX * 0.5 });
    S.L(scr, k.DET, { closed: true });
    void base; void lid;
  });

  /* 3 · headphones, three-quarter */
  def("headphones", "Headphones", 1, 0.3, (S) => {
    const k = S.k; tile(S, 100);
    S.pool(50, 88, 30, 2.4);
    /* the far cup first, then the band (an arc strip), then the near cup */
    const farC = [68, 66];
    S.soft(ov(farC[0], farC[1], 6.4, 12.4, 0, 360, 24), "#2E3136", { raw: true, depth: 0.2 });
    const arc = ov(48, 58, 24, 40, 196, 344, 30);
    const band = edges(arc, 5, 5);
    const bp = band.L.concat(band.R.slice().reverse());
    S.F(bp, "#2E3136", { w: 0 }); S.hatch(bp, { gap: 0.8, ang: 80, w: k.TEX * 0.55 });
    S.L(band.L, k.OUT, { curve: true }); S.L(band.R, k.OUT, { curve: true });
    const pad = edges(ov(48, 58, 24, 40, 230, 310, 20), 3.2, 3.2);
    const pp = pad.L.concat(pad.R.slice().reverse());
    S.F(pp, "#7A6A5E", { w: 0 }); S.L(pp, k.DET, { closed: true });
    for (let i = 0; i < 8; i++) { const q = ov(48, 58, 24 + 1.6, 40 + 1.6, 236 + i * 9.4, 236 + i * 9.4, 1)[0]; const q2 = ov(48, 58, 24 - 1.6, 40 - 1.6, 236 + i * 9.4, 236 + i * 9.4, 1)[0]; S.L([q, q2], k.TEX * 0.7); }
    /* sliders: thin rails down into each yoke */
    for (const [x0, y0, x1, y1] of [[25, 52, 27, 62], [71, 52, 69, 60]]) S.limb([[x0, y0], [x1, y1]], 1.4, 1.4, "#B9BEC4", { shade: false, w: k.DET });
    /* the near cup: shell, then the CUSHION as a ring (keyhole), then the speaker cloth */
    const nc = [29, 68];
    S.soft(ov(nc[0], nc[1], 11, 14, 0, 360, 30), "#2E3136", { raw: true, depth: 0.28 });
    const cush = holes(ov(nc[0] + 2.4, nc[1], 9.4, 12.6, 0, 360, 30), [ov(nc[0] + 3, nc[1], 5.2, 7.6, 0, 360, 24)]);
    S.F(cush, "#7A6A5E", { w: 0 }); S.hatch(cush, { gap: 1, ang: 60, w: k.TEX * 0.55 });
    S.L(ov(nc[0] + 2.4, nc[1], 9.4, 12.6, 0, 360, 30), k.DET, { closed: true, curve: true });
    S.F(ov(nc[0] + 3, nc[1], 5.2, 7.6, 0, 360, 24), "#45484E", { w: k.DET });
    for (let i = -2; i <= 2; i++) S.L([[nc[0] + 3 + i * 1.6, nc[1] - 6], [nc[0] + 3 + i * 1.6, nc[1] + 6]].map(([x, y]) => [x, lerp(y, nc[1], Math.abs(i) * 0.2)]), k.TEX * 0.5);
    S.L(ov(nc[0] - 2, nc[1], 11, 14, 100, 260, 16), k.TEX, { curve: true });
  });

  /* 4 · scissors, open, lying flat */
  def("scissors", "Scissors", 1.3, 0.3, (S) => {
    const k = S.k; tile(S, 130);
    const piv = [62, 50];
    /* each half: a loop handle (a ring, keyholed) and a blade tapering to a point,
       rotated about the pivot. Back half first. */
    const half = (ang, front) => {
      const R = (pts) => rot(pts, piv[0], piv[1], ang);
      const blade = R([[piv[0] - 3, piv[1] - 1.6], [piv[0] + 48, piv[1] - 0.8], [piv[0] + 52, piv[1] + 0.6], [piv[0] - 3, piv[1] + 3.2]]);
      S.F(blade, "#C9CED3", { w: 0 });
      S.F(R([[piv[0], piv[1] + 0.4], [piv[0] + 50, piv[1] + 0.3], [piv[0] + 52, piv[1] + 0.6], [piv[0], piv[1] + 3.2]]), "#C9CED3", { w: 0, sh: 0.82 });
      S.hatch(R([[piv[0], piv[1] + 0.8], [piv[0] + 48, piv[1] + 0.4], [piv[0], piv[1] + 3.1]]), { gap: 0.7, ang: ang + 80, w: k.TEX * 0.5 });
      S.L(blade, k.OUT * 0.9, { closed: true });
      S.L(R([[piv[0] + 2, piv[1] + 0.4], [piv[0] + 46, piv[1] + 0.2]]), k.TEX);
      const lc = R([[piv[0] - 26, piv[1] + 3]])[0];
      const outer = rot(ov(lc[0], lc[1], 12, 8, 0, 360, 30), lc[0], lc[1], ang);
      const inner = rot(ov(lc[0] + 0.6, lc[1], 8, 4.6, 0, 360, 24), lc[0], lc[1], ang);
      const neck = R([[piv[0] - 16, piv[1] - 1], [piv[0] - 1, piv[1] - 1.8], [piv[0] - 1, piv[1] + 3.6], [piv[0] - 16, piv[1] + 6]]);
      S.F(neck, front ? "#C8462E" : "#B23D28", { w: 0 }); S.L(neck, k.OUT * 0.9, { closed: true });
      const ring = holes(outer, [inner]);
      S.F(ring, front ? "#C8462E" : "#B23D28", { w: 0 });
      if (!front) S.hatch(ring, { gap: 1, ang: 60, w: k.TEX * 0.55 });
      S.L(outer, k.OUT * 0.9, { closed: true, curve: true }); S.L(inner, k.DET, { closed: true, curve: true });
    };
    half(14, false); half(-14, true);
    S.F(ov(piv[0], piv[1] + 1, 2, 2), "#8A9096", { w: k.DET });
    S.L([[piv[0] - 1, piv[1] + 1], [piv[0] + 1, piv[1] + 1]], k.TEX);
  });

  /* 5 · glasses, three-quarter: thin frames, transparent lenses */
  def("glasses", "Glasses", 1.4, 0.3, (S) => {
    const k = S.k; tile(S, 140);
    const C = cam(-32, 14, 1, 70, 48);
    const F = "#2A2420";
    const rim = (cx) => rr(26, 19, 7, 5).map(([x, y]) => [cx + x, y, 0]);
    /* the far temple, behind; seen THROUGH the near lens later */
    const temple = (sx) => [[sx, -4, 0], [sx + 0.6, -4.4, -46], [sx + 0.6, 0, -54]];
    S.limb(temple(30).map(C.P), 1.4, 1.2, F, { shade: false, w: k.DET });
    S.limb(temple(-30).map(C.P), 1.4, 1.2, F, { shade: false, w: k.DET });
    for (const cx of [15, -15]) {
      const o = rim(cx).map(C.P), inr = rr(22, 15, 5.4, 5).map(([x, y]) => C.P([cx + x, y, 0.3]));
      S.F(holes(o, [inr]), F, { w: 0 });
      S.F(inr, "#DDE9EE", { w: 0 });
      S.L(o, k.OUT * 0.9, { closed: true, curve: true }); S.L(inr, k.DET * 0.8, { closed: true, curve: true });
      /* the lens reads as glass by two reflection strokes, not by tint */
      const g = (x, y) => C.P([cx + x, y, 0.4]);
      S.L([g(-7, -3), g(-2, -7)], k.TEX * 1.2); S.L([g(-6, 1), g(1, -6)], k.TEX * 0.8);
    }
    /* what shows through the near lens: the far temple, lighter */
    S.L(temple(30).map(C.P).slice(0, 2), k.TEX * 0.8);
    S.limb(curve([[2.6, -2, 0], [0, -5, 1.4], [-2.6, -2, 0]].map(C.P), 4), 1.6, 1.6, F, { shade: false, w: k.DET });
    for (const x of [28, -28]) S.F(ov(...C.P([x, -4, 0]), 1.4, 1.1), "#B9AE98", { w: k.TEX });
    S.pool(70, 76, 34, 2);
  });

  /* 6 · a wristwatch: dial, ticks, hands, a strap receding top and bottom */
  def("watch", "Wristwatch", 0.8, 0.3, (S) => {
    const k = S.k; tile(S, 80);
    const c = [40, 50];
    /* straps first: they narrow and bend AWAY from us, so they foreshorten */
    for (const sg of [-1, 1]) {
      const strap = [[c[0] - 9, c[1] + sg * 10], [c[0] + 9, c[1] + sg * 10], [c[0] + 7.6, c[1] + sg * 44], [c[0] - 7.6, c[1] + sg * 44]];
      S.F(strap, "#7A4A2E", { w: 0 }); S.hatch(strap, { gap: 1.3, ang: 70, w: k.TEX * 0.5 });
      S.L(strap, k.OUT * 0.9, { closed: true });
      S.dash([[c[0] - 7.2, c[1] + sg * 12], [c[0] - 6.2, c[1] + sg * 42]], k.TEX, 1.2, 1);
      S.dash([[c[0] + 7.2, c[1] + sg * 12], [c[0] + 6.2, c[1] + sg * 42]], k.TEX, 1.2, 1);
      if (sg > 0) for (const y of [26, 31, 36]) S.F(ov(c[0], c[1] + y, 1, 0.8), "#2A1A10", { w: k.TEX });
    }
    /* buckle on the top strap's end */
    S.L([[c[0] - 9.6, c[1] - 30], [c[0] + 9.6, c[1] - 30], [c[0] + 9, c[1] - 37], [c[0] - 9, c[1] - 37]], k.DET * 1.2, { closed: true });
    S.L([[c[0], c[1] - 30], [c[0], c[1] - 37]], k.DET);
    /* lugs, case, bezel, dial */
    for (const [x, y] of [[-8, -12], [5, -12], [-8, 9], [5, 9]]) S.F(rect(c[0] + x, c[1] + y, c[0] + x + 3, c[1] + y + 3), "#BFC4C9", { w: k.DET });
    S.ball(c[0], c[1], 15, 15, "#BFC4C9", { arcs: 2, glint: false });
    S.F(ov(c[0] + 15.6, c[1], 1.8, 2.6), "#BFC4C9", { w: k.DET });
    const dial = ov(c[0], c[1], 12.4, 12.4, 0, 360, 40);
    S.F(dial, "#F4F0E6", { w: k.DET });
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, r0 = i % 5 ? 11.2 : 9.6;
      S.L([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * 11.9, c[1] + Math.sin(a) * 11.9]], i % 5 ? k.TEX * 0.5 : k.TEX * 1.1);
    }
    const hand = (deg, len, w) => { const a = (deg - 90) * RAD; S.limb([[c[0] - Math.cos(a) * 2, c[1] - Math.sin(a) * 2], [c[0] + Math.cos(a) * len, c[1] + Math.sin(a) * len]], w, w * 0.5, "#1C1C1C", { shade: false, w: k.TEX }); };
    hand(305, 6.6, 1.4); hand(62, 9.4, 1.0);
    S.L([[c[0], c[1]], [c[0] + Math.cos(160 * RAD) * 10.6, c[1] + Math.sin(160 * RAD) * 10.6]], k.TEX * 0.8);
    S.F(ov(c[0], c[1], 0.9, 0.9), "#C8462E", { w: 0 });
    S.L([[c[0] - 3, c[1] + 5], [c[0] + 3, c[1] + 5]], k.TEX * 0.7);
  });

  /* 7 · toothbrushes and toothpaste in a cup */
  def("toothbrush", "Toothbrushes in a cup", 0.8, 0.26, (S) => {
    const k = S.k; tile(S, 80);
    S.pool(40, 90, 18, 2);
    /* things IN a cup: the cup's mouth first (dark inside), then the brushes, then
       the cup's front wall, which cuts them */
    const cx = 40, gy = 90, prof = [[30, 13], [2, 11.4], [0, 10]];
    S.F(ov(cx, gy - 30, 13, 13 * 0.26, 0, 360, 30), "#4A5258", { w: 0 });
    const brush = (base, tip, col) => {
      S.limb([base, tip], 2.6, 2.2, col, { shade: false, w: k.DET });
      const d = [tip[0] - base[0], tip[1] - base[1]], m = Math.hypot(...d), u = [d[0] / m, d[1] / m], nx = [-u[1], u[0]];
      const h0 = [tip[0] - u[0] * 0.5, tip[1] - u[1] * 0.5], h1 = [tip[0] + u[0] * 9, tip[1] + u[1] * 9];
      const head = [[h0[0] + nx[0] * 1.4, h0[1] + nx[1] * 1.4], [h1[0] + nx[0] * 1.4, h1[1] + nx[1] * 1.4], [h1[0] - nx[0] * 1.2, h1[1] - nx[1] * 1.2], [h0[0] - nx[0] * 1.2, h0[1] - nx[1] * 1.2]];
      S.F(head, col, { w: k.DET });
      /* bristles: tufts as short parallel strokes standing off the head */
      for (let i = 0; i < 9; i++) {
        const t = 0.06 + i * 0.11, p = [lerp(h0[0], h1[0], t) + nx[0] * 1.4, lerp(h0[1], h1[1], t) + nx[1] * 1.4];
        S.L([p, [p[0] + nx[0] * 4, p[1] + nx[1] * 4]], k.TEX * 0.7);
      }
      S.L([[h0[0] + nx[0] * 5.4, h0[1] + nx[1] * 5.4], [h1[0] + nx[0] * 5.4, h1[1] + nx[1] * 5.4]], k.TEX * 0.9);
    };
    brush([36, 80], [24, 14], "#3E8E86");
    brush([44, 82], [50, 10], "#E0B84A");
    /* the toothpaste: a soft tube, crimped end UP, cap down in the cup */
    /* the toothpaste: a FLAT tube, round at the cap (down in the cup), widening to a
       straight crimped seal at the top; a rounded blob read as a slipper */
    const tb = edges([[52, 80], [56, 50], [60, 24]], 5.4, 12);
    const tube = tb.L.concat(tb.R.slice().reverse());
    S.soft(tube, "#F4F1EA", { raw: true, depth: 0.3 });
    const ta = tb.L[tb.L.length - 1], tz = tb.R[tb.R.length - 1];
    S.F([ta, tz, [tz[0] + 0.4, tz[1] + 3], [ta[0] + 0.4, ta[1] + 3]], "#E9E6DF", { w: k.TEX });
    for (let i = 1; i < 8; i++) S.L([[lerp(ta[0], tz[0], i / 8), lerp(ta[1], tz[1], i / 8)], [lerp(ta[0], tz[0], i / 8) + 0.3, lerp(ta[1], tz[1], i / 8) + 2.8]], k.TEX * 0.6);
    S.F([[53.4, 46], [60, 45], [60.6, 58], [53.8, 59]], "#3A6EA8", { w: k.TEX });
    const wall = S.lathe(cx, gy, prof, "#C9E0E4", { open: true, ribN: 4 });
    void wall;
  });

  /* 8 · a hairdryer, side on */
  def("hairdryer", "Hairdryer", 1.2, 0.3, (S) => {
    const k = S.k; tile(S, 120);
    const B = "#D96A84";
    /* the cord first (behind), then the handle, then the barrel over it */
    S.L(curve([[50, 82], [54, 92], [70, 94], [90, 90], [104, 94]], 6), k.DET * 1.3, { curve: true });
    const handle = [[40, 44], [58, 44], [56, 82], [44, 84]];
    S.soft(curve(handle, 3, true), B, { raw: true, depth: 0.3 });
    S.F(curve([[44.8, 58], [49.6, 57.6], [49.4, 66], [45, 66.4]], 2, true), "#F4F1EA", { w: k.DET });
    S.F(ov(48, 70, 1.4, 1.4), "#2A2A2A", { w: 0 });
    S.limb([[50, 82], [50, 86]], 3.4, 2.6, "#2A2A2A", { shade: false, w: k.DET });
    /* the barrel: a long rounded body, the nozzle narrowing to the front */
    const barrel = curve([[22, 20], [72, 20], [96, 25], [104, 27], [104, 41], [96, 43], [72, 48], [22, 48], [14, 34]], 4, true);
    S.soft(barrel, B, { raw: true, depth: 0.22 });
    S.L(curve([[72, 20], [74, 34], [72, 48]], 3), k.DET, { curve: true });
    S.F(ov(104, 34, 2.4, 7), "#2A2A2A", { w: k.DET });
    /* the back: a round intake with a grille of rings and slots */
    const intake = ov(20, 34, 9, 13, 0, 360, 30);
    S.F(intake, mix(B, "#000000", 0.18), { w: k.OUT });
    for (const r of [0.7, 0.42]) S.L(ov(20, 34, 9 * r, 13 * r, 0, 360, 24), k.TEX, { closed: true, curve: true });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; S.L([[20 + Math.cos(a) * 4, 34 + Math.sin(a) * 5.8], [20 + Math.cos(a) * 6.2, 34 + Math.sin(a) * 9]], k.TEX * 0.8); }
    S.F([[36, 22.6], [52, 22.6], [52, 25], [36, 25]], "#FFFFFF", { w: 0 });
    S.pool(60, 96, 40, 1.8);
  });

  /* 9 · keys on a ring */
  def("keys", "Keys on a ring", 1, 0.3, (S) => {
    const k = S.k; tile(S, 100);
    S.pool(50, 82, 34, 2.2);
    /* each key: a bow with a hole (keyhole), a shoulder, a blade with BITTING (the
       cut teeth); turned about the ring */
    const key = (ang, col, len, seed) => {
      rs = seed;
      const R = (pts) => rot(pts, 40, 34, ang);
      const bow = R(ov(40, 44, 7.4, 6.2, 0, 360, 24)), hole = R(ov(40, 41, 1.8, 1.8, 0, 360, 12));
      const blade = [[37.6, 49], [42.4, 49], [42.4, 50 + len]];
      const teeth = [];
      for (let i = 0; i < 6; i++) teeth.push([42.4 - (i % 2 ? 0 : 1.6 + rnd() * 1.4), 52 + (i / 6) * len]);
      const bl = R([[37.6, 49], [42.4, 49], ...teeth, [40.8, 50 + len + 1.6], [37.6, 50 + len]]);
      S.F(bl, col, { w: 0 }); S.hatch(bl, { gap: 1.1, ang: ang + 60, w: k.TEX * 0.5 });
      S.L(bl, k.OUT * 0.85, { closed: true });
      S.L(R([[39, 51], [39, 48 + len]]), k.TEX * 0.8);
      S.F(holes(bow, [hole]), col, { w: 0 });
      S.L(bow, k.OUT * 0.85, { closed: true, curve: true }); S.L(hole, k.DET, { closed: true, curve: true });
      void blade;
    };
    key(-38, "#C9A55A", 24, 7);
    key(8, "#BFC4C9", 28, 11);
    /* the ring: a split ring as a keyhole circle, passing THROUGH the bows: drawn
       last on the near side, so it reads as threaded */
    const ring = holes(ov(40, 34, 12, 12, 0, 360, 40), [ov(40, 34, 10.4, 10.4, 0, 360, 40)]);
    S.F(ring, "#9AA0A6", { w: 0 });
    S.L(ov(40, 34, 12, 12, 0, 360, 40), k.DET, { closed: true, curve: true });
    S.L(ov(40, 34, 10.4, 10.4, 0, 360, 40), k.TEX, { closed: true, curve: true });
    key(46, "#B87333", 20, 19);
    /* a leather fob */
    const fob = rot([[52, 28], [66, 28], [70, 34], [66, 40], [52, 40]], 52, 34, -12);
    S.F(fob, "#5A3A2A", { w: k.OUT * 0.85 }); S.hatch(fob, { gap: 1.2, ang: 50, w: k.TEX * 0.5 });
    S.dash(rot([[54, 30], [65, 30], [68, 34], [65, 38], [54, 38]], 52, 34, -12), k.TEX, 1, 0.8);
  });

  /* 10 · a stack of folded T-shirts */
  def("tshirts", "Folded T-shirts", 1.2, 0.3, (S) => {
    const k = S.k; tile(S, 120);
    S.pool(60, 90, 40, 2.2);
    /* each one: a soft slab (oblique), the FRONT shows the folded layers as curves,
       the TOP shows a sleeve fold; the top shirt shows its collar */
    const shirt = (y, col, o) => {
      /*
       * Folded CLOTH, not a book: every edge bulges, corners are soft, the front shows
       * the fold as ONE rounded roll (not ruled pages), and the top shows the collar
       * as a half-arc against the BACK edge, with the shoulder seams running from it.
       * Ruled layers and sharp corners read as a stack of books (round 1).
       */
      const x0 = 28, x1 = 92, h = 12, d = 11, dx = 9;
      const top = curve([[x0 + 1, y], [x0 + dx, y - d + 0.6], [lerp(x0, x1, 0.5) + dx, y - d - 0.4], [x1 + dx - 1, y - d + 0.4], [x1 + 0.4, y - 0.4], [lerp(x0, x1, 0.5), y + 0.8]], 4, true);
      const front = curve([[x0 + 1, y], [lerp(x0, x1, 0.5), y + 0.8], [x1 + 0.4, y - 0.4], [x1 + 1.6, y + h * 0.5], [x1, y + h], [lerp(x0, x1, 0.5), y + h + 0.6], [x0 - 0.4, y + h], [x0 - 1.4, y + h * 0.5]], 4, true);
      const side = curve([[x1 + 0.4, y - 0.4], [x1 + dx - 1, y - d + 0.4], [x1 + dx + 0.6, y - d + h * 0.5], [x1 + dx - 0.6, y - d + h], [x1, y + h], [x1 + 1.6, y + h * 0.5]], 4, true);
      S.F(side, col, { w: 0, sh: 0.78 }); S.hatch(side, { gap: 1.0, ang: 75, w: k.TEX * 0.55 });
      S.L(side, k.OUT * 0.9, { closed: true, curve: true });
      S.F(front, col, { w: 0 });
      if (o.stripe) for (const f of [0.3, 0.62]) S.L(curve([[x0 - 1, y + h * f], [lerp(x0, x1, 0.5), y + h * f + 0.8], [x1 + 1.4, y + h * f]], 4), k.DET * 1.5, { curve: true });
      /* the roll of the fold: one soft line low on the front, dying out at the ends */
      S.L(curve([[x0 + 6, y + h * 0.78], [lerp(x0, x1, 0.5), y + h * 0.86], [x1 - 6, y + h * 0.76]], 5), k.TEX, { curve: true, taper: [0.2, 0.2] });
      S.L(front, k.OUT * 0.9, { closed: true, curve: true });
      S.F(top, col, { w: 0, sh: 1.05 });
      S.L(top, k.OUT * 0.9, { closed: true, curve: true });
      if (o.collar) {
        const cc = [lerp(x0, x1, 0.5) + dx * 0.9, y - d + 0.2];
        S.F(ov(cc[0], cc[1], 8.6, 3.6, 0, 180, 16), mix(col, "#000000", 0.3), { w: 0 });
        S.L(ov(cc[0], cc[1], 8.6, 3.6, 0, 180, 16), k.DET, { curve: true });
        S.L(ov(cc[0], cc[1], 10.4, 5, 0, 180, 16), k.TEX, { curve: true });
        S.fold([[cc[0] - 10, cc[1] + 1], [cc[0] - 22, cc[1] + 3.4]], k.TEX); S.fold([[cc[0] + 10, cc[1] + 1], [cc[0] + 20, cc[1] + 2.6]], k.TEX);
      } else S.fold([[x0 + 10, y - 2], [x0 + 24, y - d * 0.6]], k.TEX);
    };
    shirt(74, "#3F5C7E", {}); shirt(60, "#F4F1EA", { stripe: true }); shirt(46, "#C8462E", { collar: true });
  });

  /* 11 · a soap pump bottle: amber glass, label, pump */
  def("soap", "Soap pump", 0.8, 0.24, (S) => {
    const k = S.k; tile(S, 80);
    S.pool(40, 90, 18, 2);
    const cx = 40, gy = 90;
    /* pump first (it sits in the neck), then the body */
    S.limb([[cx, 34], [cx, 26]], 2.4, 2.4, "#E9E6DF", { shade: false, w: k.DET });
    const head = curve([[cx - 5, 26], [cx + 4, 26], [cx + 5, 22], [cx + 16, 21.4], [cx + 16.6, 23.6], [cx + 6, 24.6], [cx + 5, 28.6], [cx - 5, 28.6]], 2, true);
    S.soft(head, "#E9E6DF", { raw: true, depth: 0.3, w: k.OUT * 0.9 });
    S.lathe(cx, 40, [[6, 6.4], [0, 7.4]], "#E9E6DF", { ribs: false, open: false });
    const body = S.lathe(cx, gy, [[50, 6.6], [46, 7], [42, 14], [36, 17], [4, 17], [0, 15.6]], "#A8642A",
      { open: false, ribN: 6, tone: { gap: 1.1, ang: 45, w: k.TEX * 0.55 }, hi: [40, 8], hiFill: "#E8C9A0" });
    /* the label wraps the body: its edges are near-half ellipses, not lines */
    const lt = 30, lb = 14, r = 17.1;
    const label = ov(cx, gy - lt, r, r * 0.24, 0, 180, 20).concat(ov(cx, gy - lb, r, r * 0.24, 180, 0, 20));
    S.F(label, "#F4F1EA", { w: 0 });
    S.L(ov(cx, gy - lt, r, r * 0.24, 4, 176, 20), k.DET, { curve: true }); S.L(ov(cx, gy - lb, r, r * 0.24, 4, 176, 20), k.DET, { curve: true });
    for (const [y, w] of [[23.6, 8], [20.4, 11], [17.8, 7]]) S.L(ov(cx, gy - y, w, w * 0.12, 30, 150, 10), k.TEX * (y === 23.6 ? 1.6 : 0.7), { curve: true });
    void body;
  });

  /* 12 · a clothes iron, side on */
  def("iron", "Clothes iron", 1.3, 0.3, (S) => {
    const k = S.k; tile(S, 130);
    S.pool(66, 84, 46, 2);
    /* the soleplate: a steel WEDGE with a pointed front, its thickness showing */
    const sole = [[16, 74], [24, 70.4], [110, 70.4], [112, 76], [26, 78]];
    S.F(sole, "#C9CED3", { w: 0 }); S.F([[24, 74.6], [110, 74.4], [112, 76], [26, 78]], "#9AA0A6", { w: 0 });
    S.L(sole, k.OUT, { closed: true }); S.L([[22, 74.4], [111, 74.2]], k.TEX);
    /* the body over it, the handle making a LOOP with the body: a hole you can see through */
    const outer = curve([[20, 70], [40, 50], [70, 42], [96, 40], [104, 32], [92, 20], [60, 20], [52, 26], [86, 28], [96, 34], [90, 42], [104, 46], [112, 70]], 4, true);
    const hole = curve([[60, 28], [84, 30], [88, 36], [66, 38], [56, 34]], 4, true);
    const body = holes(outer, [hole]);
    S.F(body, "#2E7D74", { w: 0 });
    const cr = curve([[40, 62], [70, 50], [100, 48], [108, 66], [60, 68]], 4, true);
    S.F(cr, "#2E7D74", { w: 0, sh: 0.82 }); S.hatch(cr, { gap: 1.1, ang: 60, w: k.TEX * 0.55 });
    S.L(outer, k.OUT, { closed: true, curve: true }); S.L(hole, k.DET, { closed: true, curve: true });
    /* the water window, translucent, with its level */
    const win = curve([[32, 62], [46, 52], [62, 50], [60, 62]], 3, true);
    S.F(win, "#BFE0EA", { w: k.DET }); S.L([[38, 58], [61, 56]], k.TEX);
    /* temperature dial on top, steam button, the cord at the back */
    S.F(ov(76, 46, 6, 2.6), "#E9E6DF", { w: k.DET }); S.L([[76, 46], [79, 44.6]], k.TEX);
    S.F(ov(64, 25, 2.2, 1.4), "#E9E6DF", { w: k.TEX });
    S.L(curve([[110, 60], [120, 66], [124, 80], [128, 90]], 4), k.DET * 1.3, { curve: true });
    for (let i = 0; i < 9; i++) S.F(ov(36 + i * 8, 76.4, 0.7, 0.4), "#555", { w: 0 });
  });

  /* 13 · a spiral notebook with a pen, lying on the table */
  def("notebook", "Spiral notebook and pen", 1.2, 0.3, (S) => {
    const k = S.k; tile(S, 120);
    const C = cam(-18, 56, 1, 60, 52);
    const W = 56, Dp = 76;
    S.F(hull(rr(W, Dp, 2, 3).map(([x, z]) => C.P([x + 3, 3.4, z + 2]))), "#00000014", { w: 0 });
    S.prism(C, rr(W, Dp, 2, 3).map(([x, z]) => [x, 0, z]), [0, -2.6, 0], "#F4F1EA", "#3E6EA0", { round: true, capTone: { gap: 1.3, ang: 30, w: k.TEX * 0.5 } });
    for (let i = 1; i < 6; i++) S.L([C.P([-W / 2 + 6, -1.3 + 0.2, -Dp / 2]), C.P([W / 2 - 1, -1.3 + 0.2, -Dp / 2])].map(([x, y]) => [x, y + i * 0.4]), k.TEX * 0.4);
    /* the spiral: one ring per hole, each a loop through the cover — the REPEAT test */
    for (let i = 0; i < 17; i++) {
      const z = -Dp / 2 + 4 + i * 4.2, x = -W / 2 + 3.6;
      S.F(ov(...C.P([x, -2.7, z]), 0.8, 0.6), "#1C1C1C", { w: 0 });
      S.L(curve([C.P([x, -2.8, z]), C.P([x - 3, -5.4, z + 0.6]), C.P([x - 4.6, -1.4, z + 0.8]), C.P([x - 3.2, 0.4, z + 0.8])], 4), k.DET * 0.9, { curve: true });
    }
    /* the elastic band down the right, and a label */
    S.limb([C.P([W / 2 - 8, -2.7, -Dp / 2]), C.P([W / 2 - 8, -2.7, Dp / 2])], 2, 2, "#C8462E", { shade: false, w: k.TEX });
    const lab = S.on(C, [0, -2.7, -12], [1, 0, 0], [0, 0, 1], rr(26, 12, 1.4, 2));
    S.F(lab, "#F4F1EA", { w: k.DET });
    for (const [a, b] of [[-9, -1.6], [-9, 1.6]]) S.L(S.on(C, [0, -2.8, -12], [1, 0, 0], [0, 0, 1], [[a, b], [a + 14, b]]), k.TEX * 0.8);
    /* the pen across it: a long thin cylinder with a clip and a tip */
    const p0 = C.P([-30, -4.6, 34]), p1 = C.P([34, -4.6, -6]);
    S.limb([p0, p1], 3.4, 3.4, "#1C1C1C", { shade: false, w: k.DET });
    S.L([[lerp(p0[0], p1[0], 0.62), lerp(p0[1], p1[1], 0.62) - 1.4], [lerp(p0[0], p1[0], 0.9), lerp(p0[1], p1[1], 0.9) - 1.4]], k.DET);
    S.F([[p0[0] - 0.4, p0[1] - 1.7], [p0[0] - 4, p0[1] + 1], [p0[0] + 0.4, p0[1] + 1.7]], "#C9A55A", { w: k.TEX });
  });

  /* 14 · a padlock */
  def("padlock", "Padlock", 0.8, 0.3, (S) => {
    const k = S.k; tile(S, 80);
    S.pool(40, 88, 20, 2);
    /* the shackle: a thick U strip, its legs going INTO the body (the body cuts them) */
    const u = ov(40, 40, 12, 14, 180, 360, 24);
    const sh = edges([[28, 54]].concat(u, [[52, 54]]), 4.4, 4.4);
    const sp = sh.L.concat(sh.R.slice().reverse());
    S.F(sp, "#BFC4C9", { w: 0 }); S.hatch(edges([[28, 54]].concat(u, [[52, 54]]).map(([x, y]) => [x + 1.2, y + 0.6]), 1.6, 1.6).L.concat(edges([[28, 54]].concat(u, [[52, 54]]).map(([x, y]) => [x + 1.2, y + 0.6]), 1.6, 1.6).R.reverse()), { gap: 0.6, ang: 30, w: k.TEX * 0.5 });
    S.L(sh.L, k.OUT * 0.9, { curve: true }); S.L(sh.R, k.OUT * 0.9, { curve: true });
    /* the body: brass, a rounded block with a crescent of shade, a keyhole, a stamp */
    const body = S.soft(rr(36, 30, 5, 5).map(([x, y]) => [40 + x, 66 + y]), "#C9A24A", { raw: true, depth: 0.26 });
    S.L([[23, 54.6], [57, 54.6]], k.DET); S.L([[23, 77.6], [57, 77.6]], k.DET);
    const kh = ov(40, 63, 2.4, 2.4, 0, 360, 16).slice(4, 13).concat([[41.2, 72], [38.8, 72]]);
    S.F(kh, "#2A2016", { w: k.DET });
    S.L([[30, 58], [38, 58]], k.TEX * 0.8); S.L([[42, 58], [50, 58]], k.TEX * 0.8);
    void body;
  });

  /* 15 · a teddy bear, sitting */
  def("teddy", "Teddy bear", 1, 0.3, (S) => {
    const k = S.k, FUR = "#B9824A", PALE = "#E8CFA8"; tile(S, 100);
    S.pool(50, 90, 30, 2.6);
    /* fur is LINE: short ticks along every contour, a seam down the front */
    const fuzz = (sil, n) => { for (let i = 0; i < sil.length; i += Math.max(1, Math.floor(sil.length / n))) { const [x, y] = sil[i]; const nx = sil[(i + 1) % sil.length][1] - y, ny = -(sil[(i + 1) % sil.length][0] - x), m = Math.hypot(nx, ny) || 1; S.L([[x, y], [x - (nx / m) * 1.4, y - (ny / m) * 1.4]], k.TEX * 0.8); } };
    const body = S.soft([[36, 50], [64, 50], [70, 68], [64, 86], [36, 86], [30, 68]], FUR, { depth: 0.28 });
    fuzz(body, 26);
    S.soft([[42, 58], [58, 58], [60, 74], [50, 82], [40, 74]], PALE, { depth: 0.2, gap: 1.6 });
    for (const s of [-1, 1]) {
      /* arms: one soft limb each, paws round */
      S.limb(curve([[50 + s * 13, 54], [50 + s * 20, 64], [50 + s * 18, 74]], 4), 9, 7.4, FUR, { gap: 1.1 });
      /* legs: come AT us, so a short mass ending in a big round foot pad */
      S.soft(ov(50 + s * 11, 84, 8, 6.4, 0, 360, 20), FUR, { raw: true, depth: 0.3 });
      const pad = ov(50 + s * 13, 86, 5.4, 4.6, 0, 360, 18);
      S.F(pad, PALE, { w: k.DET }); S.dash(ov(50 + s * 13, 86, 4, 3.2, 0, 360, 18).concat([ov(50 + s * 13, 86, 4, 3.2, 0, 1, 1)[0]]), k.TEX * 0.8, 0.8, 0.7);
    }
    /* head: ears behind, a round head, a muzzle, button eyes, a stitched nose and mouth */
    for (const s of [-1, 1]) { S.ball(50 + s * 14, 20, 7, 7, FUR, { arcs: 1, glint: false }); S.F(ov(50 + s * 14, 21, 3.8, 3.8), PALE, { w: k.TEX }); }
    const head = S.soft(ov(50, 34, 19, 17, 0, 360, 36), FUR, { raw: true, depth: 0.26 });
    fuzz(head, 30);
    S.soft(ov(50, 41, 8.6, 6.4, 0, 360, 24), PALE, { raw: true, depth: 0.2 });
    S.F([[46.6, 38], [53.4, 38], [50, 41.4]], "#2A1A10", { w: k.TEX });
    S.L([[50, 41.4], [50, 43.6]], k.TEX); S.L(curve([[46.6, 44.6], [48.4, 45.6], [50, 43.6], [51.6, 45.6], [53.4, 44.6]], 3), k.TEX, { curve: true });
    for (const s of [-1, 1]) { S.F(ov(50 + s * 7.6, 31, 1.6, 1.8), "#1C1410", { w: 0 }); S.F(ov(50 + s * 7.6 - 0.5, 30.4, 0.4, 0.4), "#FFFFFF", { w: 0 }); }
    S.dash([[50, 52], [50, 84]], k.TEX * 0.7, 1, 0.9);
    /* a bow at the neck */
    S.F([[50, 51], [41, 47], [41, 55]], "#C8462E", { w: k.DET }); S.F([[50, 51], [59, 47], [59, 55]], "#C8462E", { w: k.DET });
    S.F(ov(50, 51, 2, 2), "#A83A26", { w: k.DET });
  });

  /* 16 · a steel water bottle */
  def("bottle", "Water bottle", 0.62, 0.22, (S) => {
    const k = S.k; tile(S, 62);
    S.pool(31, 92, 14, 1.8);
    const cx = 31, gy = 92;
    /* the carry loop on the lid: a RING (keyhole) standing up */
    const loop = holes(ov(cx, 15, 6, 5, 0, 360, 24), [ov(cx, 15, 4, 3, 0, 360, 20)]);
    S.F(loop, "#2A2A2A", { w: 0 }); S.L(ov(cx, 15, 6, 5, 0, 360, 24), k.DET, { closed: true, curve: true }); S.L(ov(cx, 15, 4, 3, 0, 360, 20), k.TEX, { closed: true, curve: true });
    S.lathe(cx, 30, [[12, 8.4], [0, 8.8]], "#2A2A2A", { open: false, ribN: 3, tone: { gap: 0.8, ang: 45, w: k.TEX * 0.5 } });
    const body = S.lathe(cx, gy, [[62, 8.6], [56, 11.6], [50, 12.6], [4, 12.6], [0, 11.6]], "#C9CED3", { open: false, ribN: 7, hi: [46, 10] });
    /* brushed steel: fine vertical strokes, sparse */
    for (let x = -10; x <= 10; x += 2.6) S.L([[cx + x, gy - 46], [cx + x, gy - 8]], k.TEX * 0.35);
    /* decals WRAP the body: their outlines follow the curvature (squashed toward the edge) */
    const wrap = (u, v) => [cx + 12.6 * Math.sin(u), gy - v];
    const dec = []; for (let i = 0; i <= 10; i++) dec.push(wrap(-0.8 + i * 0.07, 36)); for (let i = 10; i >= 0; i--) dec.push(wrap(-0.8 + i * 0.07, 26));
    S.F(dec, "#E0B84A", { w: k.DET });
    const d2 = ov(0, 0, 0.28, 5, 0, 360, 20).map(([a, b]) => wrap(0.25 + a, 16 + b));
    S.F(d2, "#3E8E86", { w: k.DET });
    void body;
  });

  /* 17 · a light bulb */
  def("bulb", "Light bulb", 0.7, 0.24, (S) => {
    const k = S.k; tile(S, 70);
    const cx = 35, gy = 94;
    /* the screw base: threads are DIAGONAL bands round a cylinder */
    S.lathe(cx, gy, [[22, 8.4], [2, 8.4], [0, 4]], "#C9CED3", { open: false, ribs: false });
    for (let i = 0; i < 5; i++) S.L(curve([[cx - 8.4, gy - 4 - i * 3.6], [cx, gy - 5.6 - i * 3.6], [cx + 8.4, gy - 6.6 - i * 3.6]], 4), k.DET, { curve: true });
    S.F(ov(cx, gy, 3.4, 1.6), "#2A2A2A", { w: k.TEX });
    /* the glass: a pear, almost no fill; the filament and its wires seen THROUGH */
    /* the glass profile is ANALYTIC and dense (a sphere, and a neck easing into it);
       a few knots through lathe's per-segment smoothstep came out lumpy */
    const prof = []; const Rg = 21.6, hc = 41;
    for (let h = 62.6; h >= 0; h -= 1.2) {
      let r;
      if (h >= hc - 10) r = Math.sqrt(Math.max(0, Rg * Rg - (h - hc) * (h - hc)));
      else { const t = h / (hc - 10), rEnd = Math.sqrt(Rg * Rg - 100); r = lerp(8.6, rEnd, t * t * (3 - 2 * t)); }
      prof.push([h, Math.max(r, h > 60 ? 0 : 1)]);
    }
    const glass = S.lathe(cx, gy - 22, prof, "#F6F4EC", { open: false, ribs: false, shade: false, steps: 1 });
    for (const s of [-1, 1]) S.L([[cx + s * 2, gy - 22], [cx + s * 3, gy - 46], [cx + s * 6, gy - 58]], k.TEX);
    S.L([[cx, gy - 22], [cx, gy - 48]], k.TEX * 0.8);
    const fil = []; for (let i = 0; i <= 40; i++) { const t = i / 40; fil.push([cx - 6 + t * 12 + Math.cos(t * 30) * 0.8, gy - 58 - Math.sin(t * 30) * 1.2 - Math.sin(t * Math.PI) * 3]); }
    S.L(fil, k.TEX * 0.9);
    /* glass reads as glass by its highlights: a long one and a small one */
    S.L(curve([[cx - 15, gy - 64], [cx - 18, gy - 56], [cx - 17, gy - 48]], 4), k.DET * 1.2, { curve: true, taper: [0.3, 0.3] });
    S.L([[cx + 12, gy - 68], [cx + 14, gy - 64]], k.TEX);
    void glass;
  });

  /* 18 · a shirt on a hanger */
  def("hanger", "Shirt on a hanger", 0.9, 0.3, (S) => {
    const k = S.k, SH = "#8FB1CF"; tile(S, 90);
    /* the hook and the wire triangle (behind the shirt except its top) */
    S.L(curve([[45, 16], [45, 9], [49, 6], [52, 9], [50, 12]], 4), k.DET * 1.2, { curve: true });
    S.L([[45, 16], [16, 30], [74, 30], [45, 16]], k.DET * 1.1);
    /* the shirt HANGS: shoulders follow the hanger, the body drops straight, sleeves
       fall from the shoulders and fold at the elbow, the hem curves */
    const body = curve([[34, 22], [45, 25], [56, 22], [70, 29], [68, 52], [66, 88], [45, 91], [24, 88], [22, 52], [20, 29]], 4, true);
    for (const s of [-1, 1]) {
      const sl = s < 0 ? [[20, 30], [12, 52], [14, 70]] : [[70, 30], [78, 52], [76, 70]];
      S.limb(curve(sl, 4), 11, 8.4, SH, { gap: 1.1 });
      S.fold([[sl[1][0] - 3, sl[1][1]], [sl[1][0] + 3, sl[1][1] + 1]]);
      S.L([[sl[2][0] - 4, sl[2][1] - 1], [sl[2][0] + 4, sl[2][1] + 1]], k.DET);
    }
    S.soft(body, SH, { raw: true, depth: 0.2, gap: 1.3 });
    /* collar, placket with buttons, a pocket, drape folds from the shoulders */
    const col = [[34, 22], [45, 31], [56, 22], [52, 20], [45, 24], [38, 20]];
    S.F(col, mix(SH, "#FFFFFF", 0.3), { w: k.DET });
    S.L([[45, 31], [45, 90]], k.DET); S.L([[48, 31], [48, 90]], k.TEX);
    for (let y = 38; y < 88; y += 9) S.F(ov(46.5, y, 0.9, 0.9), "#F4F1EA", { w: k.TEX });
    S.L([[54, 40], [62, 40], [62, 49], [58, 50.4], [54, 49]], k.TEX, { closed: true });
    for (const f of [[[28, 34], [30, 60], [28, 84]], [[64, 36], [60, 62], [62, 84]], [[38, 60], [36, 86]]]) S.fold(f);
  });

  /* 19 · a backpack */
  def("backpack", "Backpack", 0.85, 0.3, (S) => {
    const k = S.k, BG = "#D9A23B"; tile(S, 85);
    S.pool(42, 92, 26, 2.4);
    /* straps behind, then the soft body, the front pocket, zips with pulls */
    for (const s of [-1, 1]) S.limb(curve([[42 + s * 9, 18], [42 + s * 24, 34], [42 + s * 25, 70]], 4), 5, 4, mix(BG, "#000000", 0.25), { gap: 1 });
    S.L(curve([[36, 16], [42, 8], [48, 16]], 4), k.DET * 1.5, { curve: true });
    const body = S.soft([[24, 22], [42, 14], [60, 22], [66, 56], [64, 90], [20, 90], [18, 56]], BG, { depth: 0.24 });
    /* the main zip: an arc over the top, dashed teeth beside it */
    const zip = curve([[22, 46], [28, 24], [42, 18], [56, 24], [62, 46]], 6);
    S.L(zip, k.DET, { curve: true }); S.dash(zip.map(([x, y]) => [x, y + 1.2]), k.TEX * 0.8, 0.5, 0.5);
    const pull = [[56, 24], [58, 30]]; S.L(pull, k.DET); S.F(ov(58.4, 31.4, 1.2, 1.8), "#2A2A2A", { w: k.TEX });
    /* the front pocket: a soft panel, its own zip, a logo patch */
    const pk = S.soft([[28, 58], [56, 58], [58, 84], [26, 84]], mix(BG, "#000000", 0.08), { depth: 0.2, n: 3 });
    S.L([[29, 62], [55, 62]], k.DET); S.dash([[29, 63.2], [55, 63.2]], k.TEX * 0.8, 0.5, 0.5);
    S.L([[52, 62], [53, 68]], k.DET); S.F(ov(53.2, 69.4, 1, 1.6), "#2A2A2A", { w: k.TEX });
    S.F(rect(36, 70, 48, 76), "#3E6EA0", { w: k.DET });
    /* fabric: folds where the bag slumps */
    for (const f of [[[24, 52], [28, 56]], [[62, 52], [58, 57]], [[30, 88], [34, 84]]]) S.fold(f);
    void body; void pk;
  });

  /* 20 · a closed umbrella, leaning */
  def("umbrella", "Closed umbrella", 0.6, 0.3, (S) => {
    const k = S.k, U = "#2F5D8A"; tile(S, 60);
    S.L([[0, 94], [60, 94]], k.TEX * 0.8);
    const R = (pts) => rot(pts, 30, 50, 12);
    /* the furled canopy: a long taper, wider below the handle, with HELICAL folds */
    const can = R([[30, 22], [36.4, 30], [37.6, 60], [32, 82], [28, 82], [22.4, 60], [23.6, 30]]);
    const cs = S.soft(can, U, { raw: false, depth: 0.3, n: 4 });
    /* furled fabric wraps in a HELIX: long diagonal folds that run edge to edge,
       each curving round the bundle (chevrons read as a feather) */
    const wAt = (y) => y < 30 ? lerp(0.6, 6.4, (y - 22) / 8) : y < 60 ? lerp(6.4, 7.6, (y - 30) / 30) : lerp(7.6, 2, (y - 60) / 22);
    for (let y = 28; y < 76; y += 7) S.L(curve(R([[30 - wAt(y), y], [30, y + 3.4], [30 + wAt(y + 7), y + 7.4]]), 4), k.DET, { curve: true });
    /* the strap with its snap, around the middle */
    const st = R([[22.6, 56], [37.4, 52], [37.4, 56], [22.6, 60]]);
    S.F(st, mix(U, "#000000", 0.2), { w: k.DET }); S.F(ov(...R([[33, 55]])[0], 1.2, 1.2), "#C9CED3", { w: k.TEX });
    /* the shaft above, the J handle in wood below, the ferrule tip */
    S.limb(R([[30, 6], [30, 22]]), 1.4, 1.4, "#3A3A3A", { shade: false, w: k.DET });
    S.F(R([[29, 2], [31, 2], [30, 7]]), "#C9CED3", { w: k.TEX });
    S.limb(curve(R([[30, 82], [30, 90], [32, 96], [38, 96], [40, 90]]), 4), 3.4, 3.4, "#8A5A34", { gap: 1 });
    void cs;
  });

  /* ── wrap ── */
  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [80, 50], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
      const t = Retro._kit.kit(k, { yaw: 0, pitch: 0 });
      rs = 3 + key.length * 13;
      const S = extend(Trials._extend(StillLife._stage(t, QQ[key])));
      D[key](S);
      t.flush();
      const o = k.done();
      /*
       * FRAME TO THE OBJECT, not to the authored tile: the frame is the bounding box
       * of everything but the panel, grown by a margin to the tile's aspect. Placed
       * by eye, half the objects sat at 40% of their tile.
       */
      const pts = o.regions.slice(1).flatMap((r) => r.pts).concat((o.marks || []).flatMap((m) => m.pts));
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const m = 0.1 * Math.max(x1 - x0, y1 - y0), A = ASPECT[key];
      x0 -= m; x1 += m; y0 -= m; y1 += m;
      const w = x1 - x0, h = y1 - y0;
      if (w / h < A) { const d = (h * A - w) / 2; x0 -= d; x1 += d; } else { const d = (w / A - h) / 2; y0 -= d; y1 += d; }
      o.frame = [x0, y0, x1, y1];
      o.regions[0].pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      return o;
    });
    out[key].clip = true;
  }
  out._keys = Object.keys(D); out._names = NAMES; out._aspect = ASPECT;
  out._cam = cam; out._extend = extend;
  return out;
})();
