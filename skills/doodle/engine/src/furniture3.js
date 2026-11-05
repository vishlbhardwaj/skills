/*
 * TEN MORE FURNITURE — picked by CONSTRUCTION so no two are built the same way
 * (curved rockers, a hung pod, two tiers, a keyboard, a tall case, hinged
 * panels, a cantilevered arc, a structureless mass, a strapped box, a
 * five-star base), and none repeats furniture.js / furniture2.js / chairs.js.
 *
 * Class `object`, not `furniture`: that row is legacy (half the house weight);
 * SKILL.md says new work in the family takes the object pen. Built on the retro
 * toolkit (Retro._kit) — orthographic yaw/pitch camera, convex prisms, faces,
 * deferred occlusion — so author back to front and lines are cut by later fills.
 * Ground is y = 0, up is negative y, no ground line (it would set the fit).
 * Concave silhouettes (rockers, egg shell, bean bag) are FLAT shapes on a plane:
 * a prism's outline is a convex hull.
 */
window.Furniture3 = (function () {
  const { kit, rr, ell, circ, rot, rect, C } = Retro._kit;
  const W = { oak: "#C08A55", oakD: "#94643A", walnut: "#7A5236", walnutD: "#5A3B26", ebony: "#2A2624",
    linen: "#E6DFD0", linenD: "#C9C0AE", sage: "#8FA88A", rust: "#C2683E", navy: "#2F4366", mustard: "#D8A93A",
    cane: "#D9B77A", brass: "#C9A043", steel: "#A9ADB3", leather: "#7B4A2E", marble: "#E7E3DC", cream: "#F4EEDF",
    teal: "#3F8A86", blush: "#E4B7A6", charcoal: "#3C3E44" };
  const D = {};
  /* a smooth tube along control points: sample a Catmull-Rom through them so the
     hand gets a dense, kink-free path (sparse points read as a bent wire) */
  const smooth = (pts, n) => {
    const out = [], P2 = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P2.length - 2; i++) for (let j = 0; j < (n || 8); j++) {
      const t = j / (n || 8), a = P2[i - 1], b = P2[i], c = P2[i + 1], d = P2[i + 2];
      out.push([0, 1, 2].map((k) => 0.5 * ((2 * b[k]) + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t)));
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: (n || 16) + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * (i / (n || 16))) * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  /* a band along a 2D curve (u,v on a plane), `w` thick: rockers, frames */
  const band = (pts, w) => {
    const L = [], R = [];
    pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
      L.push([p[0] - (dy / m) * w / 2, p[1] + (dx / m) * w / 2]); R.push([p[0] + (dy / m) * w / 2, p[1] - (dx / m) * w / 2]); });
    return L.concat(R.reverse());
  };
  /* a thin vertical-ish member: prism of a small square base, extruded along any vector */
  const stick = (t, base, e, s, fill) => t.prism([[base[0] - s, base[1], base[2] - s], [base[0] + s, base[1], base[2] - s], [base[0] + s, base[1], base[2] + s], [base[0] - s, base[1], base[2] + s]], e, fill);

  /* 1 · Rocking chair — the rockers are the identification, so the camera sees the side */
  D.rocker = (t) => {
    const XF = -9, XN = 9;
    const rocker = (x) => { const pl = t.RT(x); const curve = Array.from({ length: 17 }, (_, i) => { const z = -19 + (38 * i) / 16; return [z, -0.8 - (z * z) / 120]; }); t.flat(pl, band(curve, 2), W.walnut); };
    rocker(XF);
    [[XF, -9], [XF, 9]].forEach(([x, z]) => stick(t, [x, -3.4 - (z * z) / 120, z], z > 0 ? [0, -30, 4] : [0, -17, 0], 1, W.walnutD));
    t.box(XF - 1, -19.5, -11, XN + 1, -17, 11, W.walnut, { r: 0.6 });
    t.flat(t.TOP(-19.6), rr(XF + 1, -9, XN - 1, 9, 2), W.linen, { w: t.k.DET });
    [0, 1, 2, 3, 4].forEach((i) => stick(t, [XF + 2.5 + i * 3.25, -19.5, 10.5], [0, -24, 4.5], 0.55, W.walnut));
    t.prism(rect(XF - 1.5, -44, XN + 1.5, -40).map(([x, y]) => [x, y, 14.5]), [0, 0, 2.2], W.walnut);
    rocker(XN);
    [[XN, -9], [XN, 9]].forEach(([x, z]) => stick(t, [x, -3.4 - (z * z) / 120, z], z > 0 ? [0, -30, 4] : [0, -17, 0], 1, W.walnutD));
    [XF, XN].forEach((x) => { t.prism(rect(x - 1.2, -28.5, x + 1.2, -26.6).map(([u, y]) => [u, y, -11]), [0, -1, 21], W.walnut); stick(t, [x, -19.5, -9], [0, -8, 0], 0.7, W.walnut); });
    t.line(t.RT(XN + 1.01), [[-17, -2], [17, -2]], t.k.TEX);
  };

  /* 2 · Hanging egg chair — a cane pod hung from a C-stand; nothing touches the floor but the base */
  D.egg = (t) => {
    t.tower(circ(0, 0, 13, 28), 0, 2.2, W.charcoal);
    t.line3(smooth([[-2, -2.2, 8], [-2, -30, 8], [-1, -50, 6], [4, -60, 1], [12, -61, -2], [16, -55, -3], [16, -52, -3]]), t.k.OUT * 4.2);
    t.line3([[16, -52, -3], [16, -47, -3]], t.k.DET);
    const f = t.FR(-3), cx = 16, top = -47;
    const shell = [[0, 0], [7, 2], [12, 8], [14.5, 17], [14, 25], [11, 31.5], [5.5, 35.5], [0, 36.4]];
    const sil = shell.map(([x, y]) => [cx + x, top + y]).concat(shell.slice(1).reverse().map(([x, y]) => [cx - x, top + y]));
    t.flat(f, sil, W.cane, { w: t.k.OUT });
    for (let i = 1; i < 9; i++) { const y = top + 3 + i * 3.8, hw = Math.min(13.5, 3 + i * 2.4) * (i > 6 ? 1 - (i - 6) * 0.18 : 1); t.line(f, [[cx - hw, y], [cx + hw, y]], t.k.TEX * 0.8); }
    for (let i = -3; i <= 3; i++) t.line(f, [[cx + i * 3.2, top + 2 + Math.abs(i) * 1.6], [cx + i * 3.6, top + 34 - Math.abs(i) * 1.8]], t.k.TEX * 0.6);
    const open = [[0, 7], [6.6, 9], [10, 15], [10.6, 22], [8.4, 27], [3.6, 29.4], [0, 29.8]];
    const mouth = open.map(([x, y]) => [cx + x, top + y]).concat(open.slice(1).reverse().map(([x, y]) => [cx - x, top + y]));
    t.flat(t.FR(-3.6), mouth, W.ebony, { w: t.k.DET });
    t.flat(t.FR(-4), rr(cx - 9, top + 18, cx + 9, top + 28, 3.5), W.mustard, { w: t.k.DET });
    t.flat(t.FR(-4.2), ell(cx, top + 15, 6.5, 4.6, 18), W.mustard, { w: t.k.DET });
    t.line(t.FR(-4.3), [[cx - 8.4, top + 23], [cx + 8.4, top + 23]], t.k.TEX);
  };

  /* 3 · Bunk bed — two tiers, a guard rail, a ladder; the tiers must read as separate */
  D.bunk = (t) => {
    const X0 = -20, X1 = 20, Z0 = -9, Z1 = 9;
    [[X1, Z1], [X0, Z1]].forEach(([x, z]) => t.box(x - 1.3, -56, z - 1.3, x + 1.3, 0, z + 1.3, W.oakD));
    [-6, -33].forEach((y) => {
      t.box(X0, y - 3, Z0, X1, y, Z1, W.oak);
      t.tower(rr(X0 + 1, Z0 + 1, X1 - 1, Z1 - 1, 1.2), y - 3, 3.4, W.linen);
      t.tower(rr(X0 + 2, Z0 + 1.5, X0 + 11, Z1 - 1.5, 2.2), y - 6.4, 2.2, W.cream);
      t.tower(rr(X0 + 12.5, Z0 + 0.5, X1 - 0.5, Z1 - 0.5, 1.2), y - 6.4, 1.8, y < -20 ? W.sage : W.rust);
      const tp = t.TOP(y - 8.2);
      for (let i = 1; i < 4; i++) t.line(tp, [[X0 + 12.5 + i * 5.5, Z0 + 0.6], [X0 + 13 + i * 5.5, Z1 - 0.6]], t.k.TEX * 0.7);
      t.line(tp, [[X0 + 12.6, Z0 + 0.6], [X0 + 12.6, Z1 - 0.6]], t.k.TEX);
    });
    t.box(X0 + 10, -45, Z0 - 1, X1 - 1.4, -43, Z0 + 0.4, W.oak);
    [X0 + 10, X1 - 1.4].forEach((x) => t.box(x - 0.6, -43, Z0 - 0.8, x + 0.6, -36, Z0 + 0.2, W.oakD));
    [[X1, Z0], [X0, Z0]].forEach(([x, z]) => t.box(x - 1.3, -56, z - 1.3, x + 1.3, 0, z + 1.3, W.oakD));
    [X0 + 1.5, X0 + 7.5].forEach((x) => stick(t, [x, 0, Z0 - 3.5], [0, -38, 2.2], 0.6, W.oak));
    for (let i = 1; i < 7; i++) t.line3([[X0 + 1.5, -i * 5.4, Z0 - 3.5 + (i * 5.4) * 2.2 / 38], [X0 + 7.5, -i * 5.4, Z0 - 3.5 + (i * 5.4) * 2.2 / 38]], t.k.OUT, { curve: false });
  };

  /* 4 · Upright piano — the keyboard shelf, black keys raised over white, fallboard, music desk, pedals */
  D.piano = (t) => {
    const X0 = -24, X1 = 24;
    t.box(X0, -50, 0, X1, -2, 22, W.ebony, { r: 0.6 });
    t.box(X0 - 1, -51.6, -0.6, X1 + 1, -50, 22.6, W.ebony);
    t.box(X0 + 0.6, -20, -11, X0 + 3.2, -2, -1, W.ebony);
    t.box(X1 - 3.2, -20, -11, X1 - 0.6, -2, -1, W.ebony);
    t.box(X0 + 0.6, -21.6, -10, X1 - 0.6, -19.6, 0, W.ebony);
    const kb = t.TOP(-21.7);
    t.flat(kb, rect(X0 + 3.4, -9.6, X1 - 3.4, -4.4), "#FBFAF6", { w: t.k.DET });
    const n = 26, kw = (X1 - X0 - 6.8) / n;
    for (let i = 1; i < n; i++) t.line(kb, [[X0 + 3.4 + i * kw, -9.6], [X0 + 3.4 + i * kw, -4.4]], t.k.TEX * 0.6);
    for (let i = 0; i < n - 1; i++) if (![2, 6, 9, 13, 16, 20, 23].includes(i % 28) && i % 7 !== 2 && i % 7 !== 6)
      t.raise(kb, rect(X0 + 3.4 + (i + 0.68) * kw, -4.4 - 0.2, X0 + 3.4 + (i + 1.32) * kw, -7.2), 0.9, W.ebony, { w: t.k.TEX });
    t.box(X0 + 3.4, -26, -1.4, X1 - 3.4, -21.6, -0.2, W.ebony);
    t.flat(t.FR(-1.45), rect(-6, -25, 6, -23.4), W.brass, { w: 0 });
    t.prism(rect(-12, -37, 12, -27).map(([x, y]) => [x, y, -1.2]), [0, -1.6, 2.4], W.ebony);
    t.flat(t.FR(-1.3), rect(-9, -36, -1, -28), W.cream, { w: t.k.TEX });
    t.flat(t.FR(-1.3), rect(1, -36, 9, -28), W.cream, { w: t.k.TEX });
    [-3.2, 0, 3.2].forEach((x) => t.box(x - 0.9, -2, -4, x + 0.9, -1.2, -0.2, W.brass));
    const f = t.FR(0);
    [[-20, -48, -2, -30], [2, -48, 20, -30], [-20, -18, 20, -4]].forEach(([a, b, c, d]) => t.line(f, [[a, b], [c, b], [c, d], [a, d], [a, b]], t.k.TEX));
  };

  /* 5 · Grandfather clock — tall case: plinth, waist with glazed door and pendulum, hood, pediment, dial */
  D.clock = (t) => {
    t.box(-11, -14, -6, 11, 0, 8, W.walnut);
    t.box(-12, -15.4, -7, 12, -14, 9, W.walnutD);
    t.box(-8, -52, -4, 8, -15.4, 6, W.walnut);
    const wf = t.FR(-4.01);
    t.flat(wf, rr(-5.4, -49, 5.4, -19, [2.6, 2.6, 0.6, 0.6]), "#2B2A2E", { w: t.k.DET });
    t.line(wf, [[0, -48], [0, -28]], t.k.TEX);
    t.flat(wf, circ(0, -26, 2.8, 20), W.brass, { w: t.k.DET });
    t.flat(wf, circ(-0.9, -26.9, 0.8, 8), "#F6E7B5", { w: 0 });
    t.box(-12, -54, -7, 12, -52, 9, W.walnutD);
    t.box(-11, -76, -6, 11, -54, 8, W.walnut);
    t.prism([[-12.5, -76, -7], [12.5, -76, -7], [0, -84, -7]], [0, 0, 16], W.walnutD);
    t.ball([0, -86.6, -7], 1.5, W.brass);
    const d = t.FR(-6.01), cy = -65;
    t.flat(d, circ(0, cy, 8.2, 36), W.cream, { w: t.k.OUT });
    t.flat(d, circ(0, cy, 6.7, 36), null, { w: t.k.TEX });
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, r0 = i % 5 ? 6.7 : 6, r1 = 7.6; t.line(d, [[Math.cos(a) * r0, cy + Math.sin(a) * r0], [Math.cos(a) * r1, cy + Math.sin(a) * r1]], i % 5 ? t.k.TEX * 0.45 : t.k.TEX); }
    t.line(d, [[0, cy], [3.4, cy - 3.1]], t.k.OUT);
    t.line(d, [[0, cy], [-1.2, cy - 5.6]], t.k.DET);
    t.dot(d, 0, cy, 0.6, "ink");
    [[-8.8, -75], [8.8, -75]].forEach(([x, y]) => t.flat(d, arc(x, y + 9.5, 1.4, 0, 360, 10), W.brass, { w: 0 }));
  };

  /* 6 · Folding screen — four hinged panels in a zigzag, each framed with a lattice inset */
  D.screen = (t) => {
    const H = 46, pw = 13, ang = 32, th = 1.1;
    let x = -26, z = 0;
    for (let i = 0; i < 4; i++) {
      const a = (i % 2 ? ang : -ang) * Math.PI / 180, dx = Math.cos(a) * pw, dz = Math.sin(a) * pw;
      const nx = -Math.sin(a) * th / 2, nz = Math.cos(a) * th / 2;
      t.tower([[x - nx, z - nz], [x + dx - nx, z + dz - nz], [x + dx + nx, z + dz + nz], [x + nx, z + nz]], -2, H, W.oak);
      const pl = t.plane([x - nx * 1.05, -2, z - nz * 1.05], [Math.cos(a), 0, Math.sin(a)], [0, -1, 0]);
      t.flat(pl, rect(1.2, 1.4, pw - 1.2, H - 1.4), i % 2 ? W.linen : W.linenD, { w: t.k.DET });
      for (let k2 = 1; k2 < 4; k2++) t.line(pl, [[1.2 + (k2 * (pw - 2.4)) / 4, 1.4], [1.2 + (k2 * (pw - 2.4)) / 4, H - 1.4]], t.k.TEX * 0.7);
      for (let k2 = 1; k2 < 9; k2++) t.line(pl, [[1.2, 1.4 + (k2 * (H - 2.8)) / 9], [pw - 1.2, 1.4 + (k2 * (H - 2.8)) / 9]], t.k.TEX * 0.7);
      t.flat(pl, rect(3, H - 15, pw - 3, H - 5), W.sage, { w: t.k.TEX });
      [[0.4, 3], [pw - 0.4, 3]].forEach(([u]) => stick(t, [x + Math.cos(a) * u, 0, z + Math.sin(a) * u], [0, -2, 0], 0.7, W.oakD));
      x += dx; z += dz;
    }
  };

  /* 7 · Arc floor lamp — a heavy marble base, a steel arc over open space, a domed shade */
  D.arclamp = (t) => {
    t.tower(rr(-8, -6, 8, 6, 1.4), 0, 6.5, W.marble);
    t.line(t.FR(-6.02), [[-5, -1.6], [-2, -4.6], [1, -2.2], [4.5, -5]], t.k.TEX * 0.6);
    t.line3(smooth([[0, -6.5, 0], [0, -26, 0], [3, -48, 0], [13, -64, 0], [28, -71, 0], [40, -66, 0], [45.4, -57, 0], [46, -52, 0]]), t.k.OUT * 3.4);
    const sc = 46, sy = -52, f = t.FR(-2);
    const shade = [[sc - 3, sy - 1], [sc + 3, sy - 1], [sc + 8.6, sy + 7.6], [sc - 8.6, sy + 7.6]];
    t.flat(f, shade, W.brass, { w: t.k.OUT });
    t.flat(f, ell(sc, sy + 7.6, 8.6, 1.8, 20, 0, 180), "#2B2A2E", { w: t.k.DET });
    t.flat(f, circ(sc, sy + 8.4, 1.8, 12), "#FFF3C4", { w: t.k.TEX });
    for (let i = 0; i < 5; i++) t.line(f, [[sc - 2.2 + i * 1.1, sy], [sc - 7.6 + i * 3.8, sy + 7.2]], t.k.TEX * 0.45);
    t.line3([[0, -2, 6], [5, -0.4, 10], [14, 0, 12]], t.k.TEX, { curve: true });
  };

  /* 8 · Bean bag — no structure at all: a slumped mass, its seams, a sat-in dent */
  D.beanbag = (t) => {
    const f = t.FR(0);
    const half = [[0, -27], [6, -26.4], [11.6, -23.4], [15.6, -17.6], [18.6, -10.6], [20.6, -4.6], [20.8, -1.2], [16, 0], [0, 0.4]];
    const sil = half.map(([x, y]) => [x + 0.8, y]).concat(half.slice(1, -1).reverse().map(([x, y]) => [-x * 1.04 - 0.6, y + (y < -12 ? 1.4 : 0)]));
    t.flat(f, sil, W.teal, { w: t.k.OUT });
    t.flat(f, ell(-1, -21, 9.4, 3.2, 20), "#2F6D69", { w: t.k.DET });
    /* creases stay INSIDE the bag — one ran out past the bottom */
    [[-13, -4], [-6, -10], [3, -12], [12, -7]].forEach(([x, y], i) => t.line(f, [[x - 3, y - 6 - i], [x, y], [x + 2, Math.min(y + 4, -2)]], t.k.TEX, { curve: true }));
    t.line(f, [[-19.6, -7], [-12, -11.6], [-1, -13.2], [10, -11.4], [19.4, -6.4]], t.k.DET, { curve: true });
    t.line(f, [[-9.4, -24.6], [-14.6, -16], [-17.6, -6]], t.k.TEX, { curve: true });
    t.line(f, [[8.6, -24.6], [13.4, -16], [16.8, -6]], t.k.TEX, { curve: true });
    t.flat(f, rr(-2.6, -6.4, 3.4, -3, 0.8), W.mustard, { w: t.k.TEX });
  };

  /* 9 · Steamer trunk — slatted box, leather straps over lid and front, brass corners and latch */
  D.trunk = (t) => {
    const X0 = -22, X1 = 22, Z0 = -11, Z1 = 11;
    t.box(X0, -20, Z0, X1, 0, Z1, W.oak, { r: 0.4 });
    t.box(X0 - 0.5, -26, Z0 - 0.5, X1 + 0.5, -20, Z1 + 0.5, W.oak, { r: 0.4 });
    const fr = t.FR(Z0 - 0.01), lid = t.TOP(-26.01);
    [-16, -8].forEach((y) => t.line(fr, [[X0, y], [X1, y]], t.k.TEX * 0.7));
    [-14, 14].forEach((x) => {
      t.raise(fr, rect(x - 2.4, -25.6, x + 2.4, 0), 0.4, W.leather, { w: t.k.DET });
      t.raise(lid, rect(x - 2.4, Z0, x + 2.4, Z1), 0.4, W.leather, { w: t.k.DET });
      t.raise(fr, rr(x - 3, -15, x + 3, -11, 0.4), 0.6, W.brass, { w: t.k.TEX });
    });
    [[X0, -26], [X1, -26], [X0, 0], [X1, 0]].forEach(([x, y]) => t.flat(fr, [[x, y], [x + (x < 0 ? 4 : -4), y], [x, y + (y < -1 ? 4 : -4)]], W.brass, { w: t.k.TEX }));
    t.raise(fr, rr(-2.6, -24, 2.6, -17.6, 0.5), 0.7, W.brass, { w: t.k.DET });
    t.dot(fr, 0, -20, 0.5, "ink");
    t.raise(t.RT(X0 - 0.01), rr(-4, -16, 4, -12, 1.5), 1.2, W.leather, { w: t.k.DET });
    t.line(lid, [[X0 + 2, Z0 + 2], [X1 - 2, Z0 + 2]], t.k.TEX * 0.6);
  };

  /* 10 · Office chair — five-star base on casters, gas lift, seat, tilted back, armrests */
  D.office = (t) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4, ex = Math.cos(a) * 16, ez = Math.sin(a) * 16, nx = -Math.sin(a) * 1.3, nz = Math.cos(a) * 1.3;
      t.tower([[-nx, -nz], [ex - nx * 0.6, ez - nz * 0.6], [ex + nx * 0.6, ez + nz * 0.6], [nx, nz]], -3.4, 2, W.charcoal);
      t.ball([ex, -1.6, ez], 1.5, W.charcoal);
    }
    t.tower(circ(0, 0, 2.4, 16), -5, 4, W.charcoal);
    t.tower(circ(0, 0, 1.4, 14), -9, 10, W.steel);
    t.tower(rr(-3, -3, 3, 3, 0.8), -19, 1.6, W.charcoal);
    t.tower(rr(-12, -12, 12, 11, 4), -20.4, 4.4, W.navy);
    t.line(t.TOP(-24.81), [[-9, -2], [9, -2]], t.k.TEX * 0.6);
    t.prism(rr(-12, -55, 12, -27, [5, 5, 3, 3]).map(([x, y]) => [x, y, 12.5]), [0, 0, 3.2], W.navy, {});
    t.line(t.FR(12.49), [[-8, -38], [8, -38]], t.k.TEX * 0.6);
    stick(t, [0, -24, 13.6], [0, -5, 0.2], 0.9, W.charcoal);
    [-12.6, 12.6].forEach((x) => { stick(t, [x, -24.6, 1], [0, -8, 0], 0.7, W.charcoal); t.box(x - 1.5, -34, -6, x + 1.5, -32.4, 7, W.charcoal, { r: 0.6 }); });
  };

  /* ── set two: ten more, again one construction each ───────────────── */

  /* 11 · Director's chair — the X under each side is the identification; canvas seat and back */
  D.director = (t) => {
    const side = (x) => {
      stick(t, [x, 0, -8], [0, -17, 16], 0.75, W.oak);
      stick(t, [x, 0, 8], [0, -17, -16], 0.75, W.oak);
      stick(t, [x, -17, 8], [0, -22, 1.4], 0.8, W.oak);
      stick(t, [x, -17, -8], [0, -8, 0], 0.8, W.oak);
      t.box(x - 1.1, -26, -9.5, x + 1.1, -24.6, 9.5, W.oak, { r: 0.4 });
    };
    side(-11);
    t.box(-11, -17.6, -8.6, 11, -16.6, -7.4, W.oak);
    t.box(-11, -17.6, 7.4, 11, -16.6, 8.6, W.oak);
    t.flat(t.TOP(-17.7), rect(-10.4, -7.6, 10.4, 7.6), W.navy, { w: t.k.DET });
    t.prism(rect(-11, -38, 11, -30).map(([x, y]) => [x, y, 9.1 + (y + 30) * -0.06]), [0, 0, 0.6], W.navy);
    t.line(t.FR(8.9), [[-11, -34], [11, -34]], t.k.TEX * 0.6);
    side(11);
  };

  /* 12 · Hammock on a stand — a curved steel frame and a sagging striped sling */
  D.hammock = (t) => {
    const L = 34;
    t.box(-L + 6, -1.6, -1.2, L - 6, 0, 1.2, W.charcoal);
    [-1, 1].forEach((s) => { t.box(s * (L - 6) - 1, -1.8, -9, s * (L - 6) + 1, 0, 9, W.charcoal); });
    [-1, 1].forEach((s) => t.line3(smooth([[s * (L - 8), -1.6, 0], [s * (L - 4), -14, 0], [s * L, -30, 0], [s * (L - 1.5), -34, 0]]), t.k.OUT * 3.2));
    const f = t.FR(-0.5), x0 = -L + 6, x1 = L - 6;
    [-1, 1].forEach((s) => { t.line(f, [[s * (L - 1.5), -34], [s * (x1 - 2), -27]], t.k.DET); t.line(f, [[s * (L - 1.5), -34], [s * (x1 - 2), -21]], t.k.DET); });
    const top = Array.from({ length: 17 }, (_, i) => { const u = x0 + 2 + ((x1 - x0 - 4) * i) / 16; return [u, -27 + 7 * (1 - ((u / (x1 - 2)) ** 2))]; });
    const bot = Array.from({ length: 17 }, (_, i) => { const u = x1 - 2 - ((x1 - x0 - 4) * i) / 16; return [u, -21 + 9 * (1 - ((u / (x1 - 2)) ** 2))]; });
    t.flat(f, top.concat(bot), W.cream, { w: t.k.OUT });
    for (let j = 1; j < 4; j++) { const st = top.map(([u, v], i) => [u, v + ((bot[16 - i][1] - v) * j) / 4]); t.line(f, st, j === 2 ? t.k.DET * 1.6 : t.k.TEX, { curve: true }); }
    [-1, 1].forEach((s) => t.flat(f, rect(s * (x1 - 2) - 0.7, -28, s * (x1 - 2) + 0.7, -20), W.oak, { w: t.k.DET }));
    t.flat(t.FR(-0.8), rr(-6, -21, 4, -17.6, 1.6), W.rust, { w: t.k.DET });
  };

  /* 13 · Leaning ladder shelf — rails lean on the wall; shelves shrink toward the top */
  D.ladder = (t) => {
    const rail = (x) => stick(t, [x, 0, -10], [0, -62, 13], 1, W.oak);
    rail(-12);
    [[-8, 9.4], [-24, 7.6], [-40, 5.6], [-55, 3.8]].forEach(([y, d], i) => {
      const zf = -10 + (-y / 62) * 13 - 1;
      t.box(-12, y - 1.2, zf, 12, y, zf + d, W.oakD);
      const top = y - 1.2;
      if (i === 0) [[-10, 6, W.rust], [-4, 5, W.navy], [1, 7, W.mustard], [5, 4.6, W.sage]].forEach(([x, h, c], j) => t.box(x, top - h, zf + 1, x + 2.6 + (j % 2), top, zf + d - 1.2, c));
      if (i === 1) { t.tower(circ(-5, zf + d / 2, 2.6, 16), top, 4.6, W.rust); [-30, 0, 30].forEach((a) => t.line3([[-5, top - 4.6, zf + d / 2], [-5 + Math.sin(a * Math.PI / 180) * 5, top - 10, zf + d / 2]], t.k.DET)); t.box(3, top - 3, zf + 1, 9, top, zf + d - 1, W.linen); }
      if (i === 2) { t.tower(circ(0, zf + d / 2, 1.8, 14), top, 6, W.teal); t.tower(circ(0, zf + d / 2, 0.8, 10), top - 6, 2, W.teal); }
      if (i === 3) t.ball([4, top - 2, zf + d / 2], 1.9, W.blush);
    });
    rail(12);
  };

  /* 14 · Baby crib — a cage of slats round a mattress; the slats ARE the crib */
  D.crib = (t) => {
    const X0 = -20, X1 = 20, Z0 = -11, Z1 = 11, H = 34;
    [[X1, Z1], [X0, Z1]].forEach(([x, z]) => t.box(x - 1.3, -H - 2, z - 1.3, x + 1.3, 0, z + 1.3, W.cream));
    for (let x = X0 + 3; x < X1 - 1; x += 3) stick(t, [x, -6, Z1], [0, -H + 7, 0], 0.4, W.cream);
    t.box(X0, -9, Z0, X1, -5.6, Z1, W.cream);
    t.tower(rr(X0 + 1, Z0 + 1, X1 - 1, Z1 - 1, 1), -9, 3, W.linen);
    t.tower(rr(X0 + 2, Z0 + 2, X0 + 10, Z1 - 2, 2.4), -12, 2, W.blush);
    t.ball([6, -13.6, 0], 2.4, W.mustard);
    t.ball([4.6, -15.6, 0], 1, W.mustard); t.ball([7.4, -15.6, 0], 1, W.mustard);
    for (let z = Z0 + 3; z < Z1 - 1; z += 3) stick(t, [X0, -6, z], [0, -H + 7, 0], 0.4, W.cream);
    [[X1, Z0], [X0, Z0]].forEach(([x, z]) => t.box(x - 1.3, -H - 2, z - 1.3, x + 1.3, 0, z + 1.3, W.cream));
    for (let x = X0 + 3; x < X1 - 1; x += 3) stick(t, [x, -6, Z0], [0, -H + 7, 0], 0.4, W.cream);
    [Z0, Z1].forEach((z) => t.box(X0, -H, z - 0.8, X1, -H + 1.6, z + 0.8, W.cream));
    t.box(X0 - 0.8, -H, Z0, X0 + 0.8, -H + 1.6, Z1, W.cream);
    t.box(X0, -6.6, Z0 - 0.8, X1, -5.4, Z0 + 0.8, W.cream);
  };

  /* 15 · Drafting table — the board is TILTED; trestle legs, a parallel rule, a set square */
  D.drafting = (t) => {
    [-18, 18].forEach((x) => { stick(t, [x, 0, -9], [0, -30, 4], 0.8, W.steel); stick(t, [x, 0, 9], [0, -36, -2], 0.8, W.steel); t.box(x - 0.8, -1.4, -10, x + 0.8, 0, 10, W.steel); });
    t.box(-18, -16, -1, 18, -14.6, 1, W.steel);
    const a = 24 * Math.PI / 180, dv = [0, -Math.sin(a), Math.cos(a)];
    const o = [-24, -31, -10], c = (u, v) => [o[0] + u, o[1] + dv[1] * v, o[2] + dv[2] * v];
    t.prism([c(0, 0), c(48, 0), c(48, 26), c(0, 26)], [0, -1.2 * Math.cos(a), -1.2 * Math.sin(a)], W.oak);
    const pl = t.plane([o[0], o[1] - 1.25 * Math.cos(a), o[2] - 1.25 * Math.sin(a)], [1, 0, 0], dv);
    t.flat(pl, rect(8, 4, 40, 23), W.cream, { w: t.k.DET });
    [[12, 18, 26, 9], [14, 10, 34, 18]].forEach(([u0, v0, u1, v1]) => t.line(pl, [[u0, v0], [u1, v1]], t.k.TEX * 0.6));
    t.line(pl, [[22, 7], [33, 7], [33, 15]], t.k.TEX * 0.6);
    t.flat(pl, rect(2, 2.6, 46, 4.2), W.charcoal, { w: t.k.DET });
    t.flat(pl, [[30, 12], [42, 12], [30, 21]], "#C9E2E0", { w: t.k.DET });
    t.flat(pl, [[32.6, 13.4], [37, 13.4], [32.6, 17.6]], null, { w: t.k.TEX });
    t.line(pl, [[6, 20], [7.4, 9]], t.k.DET * 1.2);
  };

  /* 16 · Vanity — a slim dressing table, a round mirror above, small bottles, a stool */
  D.vanity = (t) => {
    [[-16, 9], [16, 9]].forEach(([x, z]) => stick(t, [x, 0, z], [0, -26, 0], 0.8, W.blush));
    t.box(-14, -60, 9.6, 14, -27, 10.4, W.blush, { r: 1 });
    const mf = t.FR(9.55);
    t.flat(mf, circ(0, -46, 11.5, 44), W.brass, { w: t.k.OUT });
    t.flat(mf, circ(0, -46, 10, 44), "#D7E3E8", { w: t.k.DET });
    t.line(mf, [[-6, -52], [-2, -56]], t.k.TEX); t.line(mf, [[-4, -48], [2, -54]], t.k.TEX);
    t.box(-18, -28, -8, 18, -26, 10, W.blush, { r: 0.6 });
    t.box(-16, -26, -7, 16, -21, 9, W.blush);
    t.line(t.FR(-7.01), [[0, -26], [0, -21]], t.k.TEX);
    [-8, 8].forEach((x) => t.raise(t.FR(-7.01), circ(x, -23.5, 0.8, 10), 0.6, W.brass));
    [[-16, -8], [16, -8]].forEach(([x, z]) => stick(t, [x, 0, z], [0, -26, 0], 0.8, W.blush));
    t.tower(circ(-9, 4, 1.6, 14), -28, 4.4, W.teal); t.tower(circ(-9, 4, 0.7, 10), -32.4, 1.6, W.brass);
    t.tower(circ(-4.6, 6, 1.2, 12), -28, 2.6, W.rust);
    t.tower(rr(6, 2, 11, 7, 0.6), -28, 1.4, W.cream);
    t.tower(circ(0, -16, 6.5, 22), -12, 3.4, W.sage);
    [[-4, -19], [4, -19], [-4, -13], [4, -13]].forEach(([x, z]) => stick(t, [x, 0, z], [0, -12, 0], 0.55, W.brass));
  };

  /* 17 · Wine rack — a diamond lattice; the bottle ends are the cells' contents */
  D.winerack = (t) => {
    const X0 = -18, X1 = 18, H = 44, D0 = -8, D1 = 8;
    t.box(X0, -H, D0, X1, 0, D1, W.walnut);
    const f = t.FR(D0 - 0.01);
    t.flat(f, rect(X0 + 1.6, -H + 1.6, X1 - 1.6, -1.6), W.walnutD, { w: t.k.DET });
    const s = 6.6;
    for (let k2 = -8; k2 <= 8; k2++) {
      const L1 = [], L2 = [];
      for (let x = X0 + 1.6; x <= X1 - 1.6; x += 0.5) { const y1 = -1.6 - (x - X0 - 1.6) - k2 * s, y2 = -1.6 - (X1 - 1.6 - x) - k2 * s; if (y1 <= -1.6 && y1 >= -H + 1.6) L1.push([x, y1]); if (y2 <= -1.6 && y2 >= -H + 1.6) L2.push([x, y2]); }
      if (L1.length > 1) t.line(f, L1, t.k.DET * 1.4); if (L2.length > 1) t.line(f, L2, t.k.DET * 1.4);
    }
    const r = (() => { let a = 5; return () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })();
    /* diamond centres SOLVED from the two line families (w - u = k·s, w + u - Wd = m·s,
       u across from the left, w down from the top): a guessed grid put bottles on the bars */
    const Wd = X1 - X0 - 3.2;
    for (let k2 = -8; k2 <= 8; k2++) for (let m = -2; m <= 10; m++) {
      const a = (k2 + 0.5) * s, b = (m + 0.5) * s, u = (b + Wd - a) / 2, w = (b + Wd + a) / 2;
      const x = X0 + 1.6 + u, y = -1.6 - w;
      if (x < X0 + 4 || x > X1 - 4 || y > -4 || y < -H + 4 || r() < 0.4) continue;
      /* a bottle end fits its cell: centres are s/sqrt(2) ≈ 4.7 apart, so r 1.6 leaves the bars clear */
      t.flat(f, circ(x, y, 1.6, 16), r() < 0.5 ? "#2E4A30" : "#5A2230", { w: t.k.DET });
      t.flat(f, circ(x, y, 0.6, 10), W.brass, { w: 0 });
    }
  };

  /* 18 · Rolltop desk — the tambour is a quarter-round hood: a convex profile extruded along x */
  D.rolltop = (t) => {
    const X0 = -24, X1 = 24, Z0 = -12, Z1 = 12;
    [[X0, X0 + 13], [X1 - 13, X1]].forEach(([a, b]) => {
      t.box(a, -28, Z0, b, 0, Z1, W.oak);
      const f = t.FR(Z0 - 0.01);
      [-21, -14, -7].forEach((y) => t.line(f, [[a + 1, y], [b - 1, y]], t.k.DET));
      [-24.5, -17.5, -10.5, -3.5].forEach((y) => t.raise(f, rr((a + b) / 2 - 2, y - 0.6, (a + b) / 2 + 2, y + 0.6, 0.5), 0.5, W.brass));
    });
    t.box(X0 - 1, -29.6, Z0 - 1.4, X1 + 1, -28, Z1, W.oakD);
    t.box(X0 + 13, -27.4, Z0 + 1, X1 - 13, -24, Z1, W.oak);
    t.line(t.FR(Z0 + 0.99), [[X0 + 15, -25.7], [X1 - 15, -25.7]], t.k.TEX);
    const R = 14, prof = [[Z1, -29.6]].concat(Array.from({ length: 10 }, (_, i) => { const a = (i / 9) * Math.PI / 2; return [Z1 - Math.sin(a) * R * 1.4, -29.6 - Math.cos(a) * R + (1 - Math.cos(a)) * 0]; })).concat([[Z1 - R * 1.4, -29.6]]);
    t.prism(prof.map(([z, y]) => [X0, y, z]), [X1 - X0, 0, 0], W.oak);
    for (let i = 1; i < 9; i++) { const a = (i / 9) * Math.PI / 2, z = Z1 - Math.sin(a) * R * 1.4, y = -29.6 - Math.cos(a) * R; t.line3([[X0 + 1, y, z], [X1 - 1, y, z]], t.k.TEX * 0.7, { curve: false }); }
    t.box(-3, -31.6, Z1 - R * 1.4 - 0.6, 3, -30.4, Z1 - R * 1.4 + 0.4, W.brass);
  };

  /* 19 · Cheval mirror — an oval glass tilting between two posts on splayed feet */
  D.cheval = (t) => {
    const post = (x) => { t.box(x - 1, -2, -9, x + 1, 0, 9, W.walnutD, { r: 0.6 }); stick(t, [x, -2, 0], [0, -48, 0], 1, W.walnut); t.ball([x, -51, 0], 1.6, W.walnut); };
    post(-14);
    const a = 9 * Math.PI / 180, pl = t.plane([0, -30, 0], [1, 0, 0], [0, -Math.cos(a), Math.sin(a)]);
    t.flat(pl, ell(0, 0, 11.6, 18.6, 40), W.walnut, { w: t.k.OUT });
    t.flat(pl, ell(0, 0, 10, 17, 40), "#D7E3E8", { w: t.k.DET });
    [[-5, 8, 1, 14], [-7, 2, 0, 11]].forEach(([u0, v0, u1, v1]) => t.line(pl, [[u0, v0], [u1, v1]], t.k.TEX));
    [-12.6, 12.6].forEach((x) => t.ball([x, -30, 0], 1.1, W.brass));
    post(14);
    t.box(-14, -6, -0.8, 14, -4.6, 0.8, W.walnut);
  };

  /* 20 · Globe bar — a sphere with continents and a brass meridian, on a four-legged stand */
  D.globe = (t) => {
    const cy = -34, R = 13;
    [[-9, -9], [9, -9], [9, 9], [-9, 9]].forEach(([x, z]) => t.line3(smooth([[x * 1.25, 0, z * 1.25], [x * 1.05, -10, z * 1.05], [x * 0.95, -22, z * 0.95]]), t.k.OUT * 1.8));
    t.tower(circ(0, 0, 9.5, 28), -10, 1.2, W.walnut);
    [[-4, -2, W.teal], [3, 2, "#5A2230"], [0, -5, W.brass]].forEach(([x, z, c]) => { t.tower(circ(x, z, 1.4, 12), -11.2, 6, c); t.tower(circ(x, z, 0.6, 8), -17.2, 2, c); });
    t.tower(circ(0, 0, 13.8, 32), -22, 1.6, W.walnut);
    t.ball([0, cy, 0], R, "#CFE0D6", t.k.OUT);
    const f = t.FR(-R * 0.2);
    /* continents: smoothed coastlines, not polygons — sample a closed Catmull-Rom */
    const coast = (pts) => smooth(pts.concat([pts[0]]).map(([x, y]) => [x, y, 0]), 6).map(([x, y]) => [x, y]);
    [[[-9, -40], [-5, -44], [-1, -42.6], [1.4, -39], [-0.6, -36.4], [-3.6, -34.2], [-6.4, -32.6], [-9.6, -35.4]],
     [[2.4, -35], [5.6, -37.4], [8.8, -35.8], [9.6, -31.4], [7.6, -27.4], [4.6, -26.4], [2.2, -29.6]],
     [[-7, -29.4], [-3.6, -28.2], [-2.6, -25.6], [-5.2, -23.4], [-7.6, -25.8]]].forEach((poly) => t.flat(f, coast(poly), W.oak, { w: t.k.TEX }));
    t.line(f, [[-12.6, cy + 1], [-6, cy + 2.4], [0, cy + 2.8], [6, cy + 2.4], [12.6, cy + 1]], t.k.TEX * 0.6, { curve: true });
    /* the meridian: a half ring on the near side, pinned at the poles */
    const mer = Array.from({ length: 25 }, (_, i) => { const a = -Math.PI / 2 + (i / 24) * Math.PI; return [Math.cos(a) * (R + 1.8), cy + Math.sin(a) * (R + 1.8), -1]; });
    t.line3(mer, t.k.OUT * 2.2, { curve: true });
    [[0, cy - R - 1.8], [0, cy + R + 1.8]].forEach(([x, y]) => t.ball([x, y, -1], 1, W.brass));
  };

  const CAM = { rocker: { yaw: 58, pitch: 12 }, egg: { yaw: 18, pitch: 8 }, bunk: { yaw: 30, pitch: 16 }, piano: { yaw: 24, pitch: 18 },
    clock: { yaw: 24, pitch: 8 }, screen: { yaw: 16, pitch: 10 }, arclamp: { yaw: 14, pitch: 8 }, beanbag: { yaw: 10, pitch: 14 },
    trunk: { yaw: 28, pitch: 26 }, office: { yaw: 30, pitch: 18 },
    director: { yaw: 34, pitch: 14 }, hammock: { yaw: 18, pitch: 16 }, ladder: { yaw: 32, pitch: 12 }, crib: { yaw: 28, pitch: 22 },
    drafting: { yaw: 26, pitch: 22 }, vanity: { yaw: 22, pitch: 14 }, winerack: { yaw: 22, pitch: 10 }, rolltop: { yaw: 30, pitch: 16 },
    cheval: { yaw: 18, pitch: 8 }, globe: { yaw: 16, pitch: 14 } };
  const NAMES = { rocker: "Rocking chair", egg: "Hanging egg chair", bunk: "Bunk bed", piano: "Upright piano", clock: "Grandfather clock",
    screen: "Folding screen", arclamp: "Arc floor lamp", beanbag: "Bean bag", trunk: "Steamer trunk", office: "Office chair",
    director: "Director's chair", hammock: "Hammock on a stand", ladder: "Leaning ladder shelf", crib: "Baby crib", drafting: "Drafting table",
    vanity: "Vanity", winerack: "Wine rack", rolltop: "Rolltop desk", cheval: "Cheval mirror", globe: "Globe bar" };

  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;          /* the retro set's hierarchy */
      const t = kit(k, CAM[key]);
      D[key](t);
      t.flush();
      return k.done();
    });
  }
  out._keys = Object.keys(D);
  out._names = NAMES;
  return out;
})();
