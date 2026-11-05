/*
 * SCENES — the first scene in the buildings/plants register.
 *
 * The old landscapes (land.js, switched off) used "tone is line density, no
 * fill" and read as scratchy. The author's approvals since — the buildings, the
 * plants, the flowers — are all the OTHER register: one heavy line, flat
 * colour, black for contrast, shadow as a darker FILL. So a scene here is
 * drawn the way the flowers are: layered flat shapes, outlined.
 *
 * The problem that register has in a scene is OCCLUSION. Every outline draws
 * over every fill, so a mountain ridge authored behind a tree still runs
 * straight across its canopy. `hide()` fixes that for marks: every line is
 * densified and cut wherever it passes inside a silhouette that stands in
 * front of it. Back layers are clipped by everything nearer.
 *
 * Composition, per the scene rules:
 *   ONE SUBJECT — a person on a bench reading a newspaper, on the near bank,
 *     straddling the band where the river and hills meet. Object fidelity:
 *     crossed legs, a folded broadsheet with a headline and a photo, eyes
 *     peeking over the top.
 *   MIDDLE — the river winding in from the hills, a few round trees, reeds.
 *   DISTANCE — two mountain ranges, faceted (lit / shadow fills), snowcaps,
 *     a line of pine tokens along the far bank.
 *   REPOUSSOIR — a heavy leaning tree on the left crossing the horizon, so
 *     the sky has something near in it and the view is framed.
 *
 * World units, x right, y DOWN, flat (z = 0). Frame x −80..80, y −50..52.
 */
window.Scenes = (function () {
  const RAD = Math.PI / 180;

  const C = {
    sky: "#FFFFFF", sun: "#F6E3A2",
    farLit: "#C9D3E0", farShade: "#A9B7CB", snow: "#FBFBF7",
    hill: "#93AE8C", hillShade: "#7D9978", pine: "#5E7A4A",
    meadow: "#CFDCA6", river: "#9CC3D3", riverDeep: "#86B3C6",
    leaf: "#7E9B5E", leafD: "#5E7A4A", bark: "#6B4E3A",
    sand: "#E9DDBE", wood: "#C98F55", woodD: "#A8713E",
    navy: "#3E4A66", navyD: "#2F3850", paper: "#F6F3EA", skin: "#E8B48E",
    cap: "#8B6B4A", reed: "#8A6A3E",
  };

  /* ── geometry helpers ─────────────────────────────────────────────── */
  function inPoly([x, y], poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function densify(pts, step, closed) {
    const P = closed ? pts.concat([pts[0]]) : pts, out = [];
    for (let i = 1; i < P.length; i++) {
      const [ax, ay] = P[i - 1], [bx, by] = P[i];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
      for (let j = 0; j < n; j++) out.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
    }
    out.push(P[P.length - 1]);
    return out;
  }
  /* a line, cut wherever it passes inside something in front of it */
  function hide(pts, occ, closed) {
    if (!occ || !occ.length) return [closed ? pts.concat([pts[0]]) : pts];
    const runs = [];
    let cur = [];
    for (const q of densify(pts, 0.5, closed)) {
      if (occ.some((o) => inPoly(q, o))) { if (cur.length > 1) runs.push(cur); cur = []; }
      else cur.push(q);
    }
    if (cur.length > 1) runs.push(cur);
    return runs;
  }
  const ell = (cx, cy, rx, ry, n) => {
    const o = [];
    for (let i = 0; i < (n || 24); i++) {
      const a = (i / (n || 24)) * Math.PI * 2;
      o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return o;
  };
  /* scallop any closed polygon: long edges subdivided, each piece bulged
     outward from the centroid as a four-point arc */
  function scallopPoly(base, size, bump) {
    const cx = base.reduce((s, p) => s + p[0], 0) / base.length;
    const cy = base.reduce((s, p) => s + p[1], 0) / base.length;
    const out = [];
    for (let i = 0; i < base.length; i++) {
      const a = base[i], b = base[(i + 1) % base.length];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / size));
      for (let j = 0; j < n; j++)
        for (let s = 0; s < 4; s++) {
          const f = (j + s / 4) / n;
          const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
          const d = Math.hypot(x - cx, y - cy) || 1;
          const push = Math.sin((s / 4) * Math.PI) * bump;
          out.push([x + ((x - cx) / d) * push, y + ((y - cy) / d) * push]);
        }
    }
    return out;
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  /* ── the riverside ─────────────────────────────────────────────────── */
  function riverside() {
    const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
    k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.64;
    const P = ([x, y]) => k.V.p(x, y, 0);
    let seed = 11;
    const sd = () => (seed += 3);
    const fill = (pts, col, curve) => k.R(pts.map(P), col, sd(), null, curve !== false);
    const line = (pts, w, occ, x) =>
      hide(pts, occ, x && x.closed).forEach((r) =>
        k.M(r.map(P), w, { curve: true, ...(x || {}), closed: false }));
    const solid = (pts, curve) => k.T(pts.map(P), "solid", 0.4, { fill: "ink", curve: curve !== false });

    /* ── silhouettes first, so every layer knows what stands in front ── */
    const canopyBase = [[-96, -34], [-84, -50], [-62, -54], [-44, -44], [-36, -30],
                        [-44, -16], [-58, -13], [-74, -17], [-94, -20]];
    const canopy = scallopPoly(canopyBase, 7, 2.6);
    const trunk = [[-76, 50], [-67, 50], [-62.6, 18], [-61, -8], [-64.6, -8], [-67, 18]];
    const TREE = [canopy, trunk];

    const lap = [[22, 21], [38, 21], [38.6, 26.4], [21.4, 26.4]];
    const pageL = [[18.8, 6.4], [30, 5.2], [30, 24.4], [19.4, 23.4]];
    const pageR = [[30, 5.2], [41.2, 6.4], [40.6, 23.4], [30, 24.4]];
    const paper = pageL.concat(pageR.slice(1, 3));
    const handL = ell(18.6, 15, 1.7, 2.3, 14), handR = ell(41.4, 14.6, 1.7, 2.3, 14);
    const shinL = [[23.8, 25.6], [28.4, 25.6], [28.6, 35.6], [24.4, 35.6]];
    const shinX = [[27.6, 23.8], [33.8, 23.8], [38.2, 30.4], [34.4, 32.4]];
    const PERSON = [paper, handL, handR, lap, shinL, shinX];
    const BENCH_BOX = [[7.6, 9], [52.4, 9], [52.4, 27.2], [7.6, 27.2]];

    const hills = [[-90, -4], [-70, -9], [-50, -6], [-30, -11], [-12, -5], [6, -8],
                   [24, -3], [44, -10], [64, -6], [90, -9]];
    const hillsPoly = hills.concat([[90, 14], [-90, 14]]);

    /* ── sky: sun and birds, almost nothing ─────────────────────────── */
    const sun = ell(52, -40, 6, 6);
    fill(sun, C.sun);

    /* ── far range: faceted, lit left / shadow right, snow on the tall ones */
    const ridge = [[-92, -14], [-70, -24], [-60, -17], [-48, -34], [-40, -25], [-30, -29],
                   [-20, -18], [-8, -40], [4, -24], [14, -30], [22, -20], [34, -37], [46, -22],
                   [58, -28], [70, -18], [82, -31], [94, -20]];
    fill(ridge.concat([[94, 6], [-92, 6]]), C.farLit, false);
    const peaks = [];
    for (let i = 1; i < ridge.length - 1; i++)
      if (ridge[i][1] < ridge[i - 1][1] && ridge[i][1] < ridge[i + 1][1]) peaks.push(i);
    peaks.forEach((i) => {
      const pk = ridge[i], v = ridge[i + 1];
      /* the shadow face is a diagonal facet, not a vertical band — a band reads as a pillar */
      fill([pk, v, [v[0] - 1, 6], [pk[0] + (v[0] - pk[0]) * 0.55, 6]], C.farShade, false);
    });
    const snowEdges = [];
    peaks.filter((i) => ridge[i][1] < -27).forEach((i) => {
      const pk = ridge[i], l = ridge[i - 1], r = ridge[i + 1], d = 8.5;
      const L = lerp(pk, l, Math.min(0.9, d / (l[1] - pk[1])));
      const R = lerp(pk, r, Math.min(0.9, d / (r[1] - pk[1])));
      const low = [[pk[0] - (pk[0] - L[0]) * 0.45, pk[1] + 5.4], [pk[0] - 0.6, pk[1] + 8.6],
                   [pk[0] + (R[0] - pk[0]) * 0.4, pk[1] + 5.8]];
      fill([L, pk, R].concat(low.slice().reverse()), C.snow, false);
      snowEdges.push([L].concat(low, [R]));
    });

    /* ── near hills, then the meadow in front of them ─────────────────── */
    fill(hillsPoly, C.hill);
    const meadowTop = [[-92, 8], [-50, 6.6], [-10, 7.4], [30, 6.2], [70, 7.6], [92, 6.8]];
    fill(meadowTop.concat([[92, 56], [-92, 56]]), C.meadow);

    /* pine tokens along the far bank — the distance rung */
    const pines = [];
    for (let i = 0; i < 17; i++) {
      const x = -46 + i * 7.4 + (i % 3) * 1.3;
      if ((x > -14 && x < 6) || (x > 20 && x < 40)) continue;
      const h = 4.6 + (i % 3) * 1.2, y = 7.6 - (i % 2) * 0.8;
      pines.push([[x - 1.6, y], [x, y - h], [x + 1.6, y]]);
    }
    pines.forEach((p) => fill(p, C.pine, false));

    /* ── the river: a centreline widening toward us ───────────────────── */
    const ctr = (t) => [-2 + 14 * Math.sin(t * 2.2) - 34 * t * t, 7 + 45 * Math.pow(t, 1.3)];
    const wid = (t) => 1.5 + 40 * Math.pow(t, 1.7);
    const bankL = [], bankR = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, c = ctr(t), w = wid(t);
      bankL.push([c[0] - w / 2, c[1]]); bankR.push([c[0] + w / 2, c[1]]);
    }
    const riverPoly = bankL.concat(bankR.slice().reverse());
    fill(riverPoly, C.river);
    const deep = [];
    for (let i = 8; i <= 30; i++) { const t = i / 30, c = ctr(t), w = wid(t); deep.push([c[0] + w * 0.08, c[1]]); }
    for (let i = 30; i >= 8; i--) { const t = i / 30, c = ctr(t), w = wid(t); deep.push([c[0] + w * 0.42, c[1]]); }
    fill(deep, C.riverDeep);

    /* middle-rung trees: trunk, one scalloped crown, a shade crescent */
    const midTrees = [[58, 5.6, 4.6], [66, 4.6, 5.6], [-33, 6.4, 5]];
    const midCrowns = midTrees.map(([x, y, r]) => scallopPoly(ell(x, y - r * 1.5, r, r * 0.92, 8), 3, 0.9));
    midTrees.forEach(([x, y, r], i) => {
      fill(midCrowns[i], C.leaf);
      fill(ell(x + r * 0.32, y - r * 1.3, r * 0.62, r * 0.6, 12), C.leafD);
    });

    /* sand pad under the bench */
    const pad = ell(32, 37.4, 21.5, 3.4, 28);
    fill(pad, C.sand);

    /* ── the near tree, left: trunk, then the canopy over it ──────────── */
    fill(trunk, C.bark, false);
    fill(canopy, C.leafD);
    const cx0 = -66, cy0 = -34;
    fill(scallopPoly(canopyBase.map(([x, y]) => [cx0 + (x - cx0) * 0.84 - 2.6, cy0 + (y - cy0) * 0.8 - 2.4]), 6, 2.2), C.leaf);

    /* ── the bench: back slats, seat, front board ─────────────────────── */
    [[12.2, 14.4], [15.6, 17.8], [19.0, 21.2]].forEach(([a, b]) =>
      fill([[14, a], [46, a], [46, b], [14, b]], C.wood, false));
    fill([[14.4, 22.6], [45.6, 22.6], [48, 25], [12, 25]], C.wood, false);
    fill([[12, 25], [48, 25], [48, 27], [12, 27]], C.woodD, false);

    /* ── the reader, back to front: lap, the leg behind, the crossed leg ─ */
    fill(lap, C.navyD, false);
    fill(shinL, C.navy, false);
    fill(shinX, C.navy, false);
    const head = ell(30, 2.4, 3.6, 3.9, 20);
    fill(head, C.skin);
    const cap = [[25.8, 1.6], [26.6, -0.8], [29.6, -1.8], [33.2, -0.9], [34.2, 0.9],
                 [36.6, 1.5], [36.4, 2.3], [33.4, 2.4], [26.2, 2.6]];
    fill(cap, C.cap);
    fill(pageL, C.paper, false);
    fill(pageR, "#ECE8DC", false);
    fill(handL, C.skin); fill(handR, C.skin);

    /* ── tones: the blacks. Nothing stands in front of any of these. ──── */
    solid([[23.2, 35.4], [28.9, 35.4], [29.6, 37], [28.8, 38.3], [22.8, 38.3], [22.6, 36.8]]);
    solid([[34, 30.6], [36.8, 29.6], [40.6, 31.6], [41, 33.2], [39.6, 33.6], [35, 32.6]]);
    solid([[21, 8.4], [28.6, 7.9], [28.6, 10.3], [21, 10.8]], false);
    k.T([[31.8, 8.2], [39, 8.8], [39, 14.6], [31.8, 14.2]].map(P), "hatch", 0.42, { angle: 62, gap: 0.7, s: 5 });

    /* ── marks, back to front, each cut by what stands in front of it ─── */
    const FRONT_OF_FAR = [hillsPoly, ...TREE, BENCH_BOX];
    line(sun, k.TEX, [...TREE], { closed: true });
    for (const [x, y] of [[8, -44], [14, -40.6], [19, -45.4]])
      line([[x - 2.2, y - 0.6], [x - 1, y - 0.2], [x, y + 0.6], [x + 1, y - 0.2], [x + 2.2, y - 0.6]], k.TEX * 0.8, [], { curve: true });
    line(ridge, k.DET * 0.85, FRONT_OF_FAR);
    snowEdges.forEach((e) => line(e, k.TEX * 0.7, FRONT_OF_FAR, { curve: false }));

    const FRONT_OF_HILLS = [...TREE, BENCH_BOX, ...midCrowns, head, cap, meadowTop.concat([[92, 56], [-92, 56]])];
    line(hills, k.DET, FRONT_OF_HILLS);
    pines.forEach((p) => line(p, k.TEX * 0.6, [...TREE, ...midCrowns, ...PERSON, head, cap], { closed: true, curve: false }));

    const FRONT_OF_RIVER = [...TREE, BENCH_BOX];
    line(bankL, k.DET, FRONT_OF_RIVER);
    line(bankR, k.DET, FRONT_OF_RIVER);
    for (let i = 0; i < 16; i++) {
      const t = 0.12 + (i / 16) * 0.86, c = ctr(t), w = wid(t);
      const off = ((i * 37) % 10) / 10 - 0.5, len = w * (0.16 + (i % 3) * 0.05);
      const x = c[0] + off * w * 0.5;
      line([[x - len / 2, c[1]], [x + len / 2, c[1]]], k.TEX * (0.5 + t * 0.4), FRONT_OF_RIVER, { curve: false });
    }
    midTrees.forEach(([x, y, r], i) => {
      line(midCrowns[i], k.TEX * 0.8, [...TREE], { closed: true });
      line([[x, y], [x, y - r * 0.7]], k.TEX, [...TREE, midCrowns[i]], { curve: false });
    });

    /* reeds at the near-left bank, with cattail heads */
    [[-46, 44, -6], [-43, 46, 4], [-49, 47, -12], [-40, 47.6, 10]].forEach(([x, y, lean], i) => {
      const top = [x + Math.sin(lean * RAD) * 14, y - 14 + i];
      line([[x, y], [(x + top[0]) / 2, y - 7], top], k.TEX, [], { taper: [1.2, 0.6] });
      if (i % 2 === 0) {
        const hd = ell(top[0] + Math.sin(lean * RAD) * 0.6, top[1] + 2.6, 0.9, 2.4, 12);
        fill(hd, C.reed); line(hd, k.TEX * 0.8, [], { closed: true });
      }
    });

    for (const [x, y] of [[-30, 22], [-44, 30], [-24, 33], [-52, 20], [-36, 40], [-58, 34], [44, 44], [64, 33]]) {
      const pet = ell(x, y, 1.1, 0.8, 10);
      fill(pet, "#FBFAF4"); line(pet, k.TEX * 0.6, [], { closed: true });
      fill(ell(x, y, 0.4, 0.35, 8), "#F2C933");
    }
    line(pad, k.TEX * 0.7, [BENCH_BOX], { closed: true });
    line(trunk, k.OUT, [canopy], { closed: true, curve: false });
    /* limbs fork just under the crown and vanish into it — a long bare limb
       below the canopy reads as a pole */
    line([[-62.6, -2], [-57, -10], [-54, -16]], k.OUT * 1.2, [canopy], { taper: [1.3, 0.8] });
    line([[-63.4, -5], [-69, -12], [-72, -17]], k.OUT * 1.1, [canopy], { taper: [1.3, 0.8] });
    line(canopy, k.OUT, [], { closed: true });
    for (const [x, y] of [[-78, -40], [-66, -44], [-56, -36], [-72, -30], [-60, -26], [-84, -28], [-50, -24]])
      line([[x - 1.6, y - 1.2], [x, y], [x + 1.6, y - 1.2]], k.TEX * 0.8, [], { curve: false });

    /* bench: slats and seat outlined, the iron ends as heavy black lines */
    [[12.2, 14.4], [15.6, 17.8], [19.0, 21.2]].forEach(([a, b]) =>
      line([[14, a], [46, a], [46, b], [14, b]], k.DET, PERSON, { closed: true, curve: false }));
    line([[14.4, 22.6], [45.6, 22.6], [48, 25], [48, 27], [12, 27], [12, 25]], k.DET, PERSON, { closed: true, curve: false });
    line([[12, 25], [48, 25]], k.TEX, PERSON, { curve: false });
    for (const m of [1, -1]) {
      const X = (x) => 30 + (x - 30) * m;
      line([[X(12.6), 10.6], [X(12.8), 25]], k.OUT * 1.6, [], { curve: false });
      line([[X(12.8), 19.2], [X(9.6), 19.4], [X(8), 21], [X(8.8), 23], [X(10.2), 23.2]], k.OUT * 1.3, [], { curve: true });
      line([[X(12.2), 27], [X(11), 36.6], [X(9.2), 37]], k.OUT * 1.5, [], { curve: true, taper: [1.2, 0.9] });
      line([[X(13.6), 27], [X(14.6), 34.4]], k.OUT * 1.1, [], { curve: false });
    }

    /* the reader */
    line(lap, k.DET, [paper, shinL, shinX], { closed: true, curve: false });
    line(shinL, k.OUT, [shinX], { closed: true, curve: false });
    line(shinX, k.OUT, [], { closed: true, curve: false });
    line([[30.6, 25.4], [33.6, 25.2]], k.TEX * 0.8, [], { curve: false });
    line(head, k.OUT, [paper, cap], { closed: true });
    line(cap, k.OUT, [], { closed: true });
    line([[28.4, 0.2], [32.6, 0.4]], k.TEX * 0.6, [], { curve: true });
    for (const x of [28.4, 31.6]) {
      const e = ell(x, 4.3, 0.5, 0.6, 10);
      solid(e);
    }
    line(pageL, k.OUT, [handL, handR], { closed: true, curve: false });
    line(pageR, k.OUT, [handL, handR], { closed: true, curve: false });
    line([[30, 5.2], [30, 24.4]], k.DET, [], { curve: false });
    for (let r = 0; r < 7; r++) {
      const y = 12.4 + r * 1.55;
      line([[21, y], [24.4, y - 0.05]], k.TEX * 0.55, [handL], { curve: false });
      line([[25.2, y - 0.08], [28.6, y - 0.12]], k.TEX * 0.55, [], { curve: false });
    }
    line([[31.8, 8.2], [39, 8.8], [39, 14.6], [31.8, 14.2]], k.TEX * 0.8, [], { closed: true, curve: false });
    for (let r = 0; r < 5; r++) {
      const y = 16.4 + r * 1.5;
      line([[31.8, y + 0.05], [39 - (r === 4 ? 3 : 0), y + 0.12]], k.TEX * 0.55, [handR], { curve: false });
    }
    line(handL, k.DET, [], { closed: true });
    line(handR, k.DET, [], { closed: true });

    /* foreground grass, in clumps — tapered blades fanning from one root */
    [[60, 46, 7], [70, 41, 5], [52, 50, 6], [-70, 52, 6], [-58, 45, 5], [20, 47, 5], [76, 50, 6]]
      .forEach(([x, y, n], c) => {
        for (let i = 0; i < n; i++) {
          const a = (-44 + (88 * i) / (n - 1) + ((c * 13) % 9) - 4) * RAD;
          const h = 3.4 + ((i * 7 + c) % 4) * 0.9;
          line([[x + (i - n / 2) * 0.35, y], [x + Math.sin(a) * h * 0.5, y - h * 0.6], [x + Math.sin(a) * h, y - h]],
               k.TEX * 0.9, [], { taper: [1.3, 0.4] });
        }
      });

    const o = k.done();
    o.frame = [-80 + 50, -50 + 26, 80 + 50, 52 + 26];
    return o;
  }

  const out = { riverside: Spec.wrap("scene", "Riverside reader", riverside) };
  out.riverside.clip = true;
  out._keys = ["riverside"];
  return out;
})();
