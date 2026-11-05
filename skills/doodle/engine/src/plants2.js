/*
 * TEN MORE PLANTS — the ones the first twenty did not have: flowers, fruit,
 * pads and spikes.
 *
 * Same rig, same pots, same leaf profiles as plants.js, so the two sets read
 * as one family. What is new is that most of these are identified by a thing
 * that is NOT a leaf — the beak of a bird of paradise, the white spathe of a
 * peace lily, a lavender spike, a tulip cup — and every one of those is a
 * traced profile drawn WITHOUT a midrib. A midrib is what makes a shape read
 * as a leaf; on a petal it makes it read as a leaf too.
 */
window.Plants2 = (function () {
  const L = Kit.LEAF;
  const RAD = Math.PI / 180;

  /* extra traced profiles, half-shape, along 0 → 1, narrowing points kept */
  const PROF = {
    pad:    [[0,0],[0.08,0.02],[0.22,0.12],[0.36,0.36],[0.42,0.62],[0.34,0.86],[0.14,0.985],[0.03,0.999],[0,1]],
    lemon:  [[0,0],[0.05,0.02],[0.12,0.08],[0.30,0.25],[0.34,0.5],[0.30,0.75],[0.12,0.92],[0.05,0.98],[0,1]],
    agave:  [[0,0],[0.10,0.02],[0.20,0.12],[0.21,0.35],[0.16,0.65],[0.07,0.9],[0.015,0.99],[0,1]],
    spathe: [[0,0],[0.06,0.03],[0.26,0.2],[0.36,0.46],[0.30,0.72],[0.12,0.93],[0.02,0.995],[0,1]],
    petal:  [[0,0],[0.05,0.03],[0.13,0.2],[0.16,0.5],[0.12,0.8],[0.04,0.96],[0.01,0.995],[0,1]],
    beak:   [[0,0],[0.08,0.04],[0.13,0.3],[0.12,0.62],[0.07,0.88],[0.02,0.985],[0,1]],
    floret: [[0,0],[0.12,0.06],[0.3,0.3],[0.34,0.6],[0.22,0.9],[0.06,0.99],[0,1]],
  };

  const COL = {
    orange: "#EE8A2E", blue: "#3F5FA6", white: "#F7F5EE", cream: "#E8D27C",
    lilac: "#9A86C2", grey: "#A9B49A", yellow: "#F2C933", brown: "#6E4A2E",
    red: "#D9483B", pink: "#E99AB8", magenta: "#B8457A", jade: "#6F9C6B",
    agave: "#8FA9A0", fig: "#B34A6A", beak: "#748A6E",
  };

  function rnd(seed) {
    let a = seed | 0 || 1;
    return () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  }

  /* ── pots, as in plants.js ─────────────────────────────────────────── */
  function potTaper(k, cx, cz, rTop, rBot, top, fill) {
    const V = k.V, b = V.p(cx, k.GND, cz), s = V.s(cz), h = (k.GND - top);
    const prof = [[-rBot, 0], [-rTop, -h * 0.94], [-rTop * 1.06, -h],
                  [rTop * 1.06, -h], [rTop, -h * 0.94], [rBot, 0]];
    const pts = prof.map(([x, y]) => [b[0] + x * s, b[1] + y * s]);
    k.R(pts, fill || "cTerra", 5, 1, true);
    potShade(k, cx, cz, rTop, rBot, top);
    k.M(pts, k.OUT, { closed: true, curve: true });
    k.M([[b[0] - rTop * 1.06 * s, b[1] - h * 0.9 * s],
         [b[0] + rTop * 1.06 * s, b[1] - h * 0.9 * s]], k.DET);
    return top;
  }
  /* the shadow side, hatched — the building's contrast, borrowed: one
     lit side, one ruled side, and a black mouth */
  function potShade(k, cx, cz, rTop, rBot, top) {
    const V = k.V, b = V.p(cx, k.GND, cz), s = V.s(cz), h = k.GND - top;
    k.T([[b[0] + rTop * 0.42 * s, b[1] - h * 0.9 * s], [b[0] + rTop * 1.0 * s, b[1] - h * 0.9 * s],
         [b[0] + rBot * 1.0 * s, b[1]], [b[0] + rBot * 0.42 * s, b[1]]], "hatch", 0.42, { angle: 62, gap: 0.9, s: 3 });
  }
  function potCyl(k, cx, cz, r, top, fill, turn) {
    k.part(cx - r, cz - r, cx + r, cz + r, top, k.GND, fill || "cTerra", 5,
           k.OUT, turn || 0, cx, cz, r * 0.9);
    potShade(k, cx, cz, r, r, top);
    return top;
  }
  function soil(k, cx, cz, r, top) {
    k.T(View.disc(cx, cz, r * 0.86, 16).map(([x, z]) => k.V.p(x, top + 0.6, z)),
        "solid", 0.4, { fill: "ink", curve: true });
  }

  /*
   * A blade: Kit.leaf without the midrib unless asked. Petals, spathes, pads
   * and fruit are all this shape-on-an-axis, and none of them has a rib.
   */
  function blade(k, prof, base3, len, angDeg, fill, sd, wide, rib) {
    const V = k.V, b = V.p(base3[0], base3[1], base3[2]), s = V.s(base3[2]) * len;
    const a = angDeg * RAD;
    const dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
    const W = wide == null ? 1 : wide;
    const at = (u, t) => [b[0] + dx * t * s + px * u * s * W,
                          b[1] + dy * t * s + py * u * s * W];
    const pts = prof.map(([u, t]) => at(u, t))
      .concat(prof.slice(0, -1).reverse().map(([u, t]) => at(-u, t)));
    if (fill) k.R(pts, fill, sd, null, true);
    k.M(pts, k.TEX, { closed: true, curve: true });
    if (rib) k.M([at(0, 0.06), at(0, 0.94)], k.TEX * 0.7, { curve: false });
    return at;
  }

  /* a stalk in 3D, bowed, thick at the base */
  function stalk(k, from, to, bow, w) {
    const mid = [(from[0] + to[0]) / 2 + bow, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
    k.M([k.V.p(...from), k.V.p(...mid), k.V.p(...to)], w || k.DET,
        { curve: true, taper: [1.25, 0.75] });
  }

  /* the angle (deg, 0 = straight up, clockwise) from one 3D point to another */
  function aim(k, a, b) {
    const p = k.V.p(...a), q = k.V.p(...b);
    return Math.atan2(q[0] - p[0], -(q[1] - p[1])) / RAD;
  }

  const P = {};

  /* 1 · Bird of paradise — paddles on long stalks, and the beak flower that
     names it. The flower sits LOW and sideways; drawn upright it is a torch. */
  P.strelitzia = (k) => {
    const top = potTaper(k, 0, 0, 11, 8.5, 22, "cTerra");
    soil(k, 0, 0, 11, top);
    [[-26, 30, -3], [-8, 38, 2], [12, 34, -2], [30, 26, 3], [-40, 22, 0]]
      .forEach(([lean, h, bow], i) => {
        const tip = [Math.sin(lean * RAD) * h * 0.7, top - h, i * 0.3];
        stalk(k, [(i - 2) * 1.2, top, 0], tip, bow, k.DET * 1.1);
        const at = k.leaf(L.lance, tip, 19 - (i % 2) * 2, lean * 1.25, i % 2 ? "cLeafD" : "cLeaf",
                          11 + i * 3, 1.25);
        void at;
      });
    /* the flower: stalk, then the horizontal beak, then the crest on top */
    const head = [10, top - 24, 2];
    stalk(k, [2, top, 1], head, 3, k.DET);
    const s = k.V.s(2), h = k.V.p(...head);
    const bk = blade(k, PROF.beak, head, 18, 74, COL.beak, 61, 1, false);
    [[-6, 13], [8, 15], [20, 14], [-18, 11]].forEach(([ang, len], i) =>
      blade(k, PROF.petal, [head[0] + 2 + i * 0.6, head[1] - 0.6, 2], len, ang, COL.orange, 71 + i, 1.1, false));
    blade(k, PROF.petal, [head[0] + 3, head[1] - 0.4, 2], 10, 46, COL.blue, 81, 0.8, false);
    void s; void h; void bk;
  };

  /* 2 · Peace lily — dark glossy blades, white spathes held ABOVE them */
  P.peacelily = (k) => {
    const top = potCyl(k, 0, 0, 10, 26, "cPot", -12);
    soil(k, 0, 0, 10, top);
    [[-62, 19], [-40, 23], [-18, 25], [4, 24], [26, 24], [48, 21], [66, 17]]
      .forEach(([ang, len], i) =>
        k.leaf(L.spear, [(i - 3) * 1.1, top, 0], len, ang, i % 2 ? "cLeaf" : "cLeafD",
               11 + i * 2, 1.05));
    [[-12, 36, -2], [6, 40, 1], [20, 33, 2]].forEach(([x, h, bow], i) => {
      const base = [x * 0.15, top, 0.5], head = [x, top - h, 1];
      stalk(k, base, head, bow, k.TEX * 1.2);
      const at = blade(k, PROF.spathe, head, 12, x * 1.1, COL.white, 41 + i * 3, 1, false);
      /* the spadix: a fat cream finger standing in front of the spathe */
      const a = at(0, 0.12), b2 = at(0, 0.42);
      k.M([a, b2], k.OUT * 1.9, { taper: [1.1, 0.8], curve: false });
      k.R([[a[0] - 1, a[1]], [b2[0] - 1, b2[1]], [b2[0] + 1, b2[1]], [a[0] + 1, a[1]]], COL.cream, 49 + i, null, true);
      k.M([at(-0.1, 0.55), at(0, 0.88)], k.TEX * 0.6, { curve: true });
    });
  };

  /* 3 · Prickly pear — pads on pads. No stem, no leaves: each joint grows
     out of the rim of the last. Spines are areoles: tiny crosses, not lines. */
  P.opuntia = (k) => {
    const top = potTaper(k, 0, 0, 11, 8.5, 26, "cTerra");
    soil(k, 0, 0, 11, top);
    const pads = [
      { at: [0, top, 0],          len: 17, ang: -4 },
      { at: [-3.5, top - 14, 0.5], len: 13, ang: -38 },
      { at: [3.2, top - 15, 0.5], len: 14, ang: 30 },
      { at: [-10.5, top - 23, 1], len: 10, ang: -12 },
      { at: [10.5, top - 25, 1],  len: 10, ang: 52 },
    ];
    const r = rnd(5);
    pads.forEach((p, i) => {
      const at = blade(k, PROF.pad, p.at, p.len, p.ang, i % 2 ? "cCactus" : "cLeaf", 11 + i * 3, 1.05, false);
      for (let j = 0; j < 9; j++) {
        const u = (r() - 0.5) * 0.52, t = 0.16 + r() * 0.7;
        const c = at(u, t), d = 0.55;
        k.M([[c[0] - d, c[1] - d], [c[0] + d, c[1] + d]], k.TEX * 0.6, { curve: false });
        k.M([[c[0] + d, c[1] - d], [c[0] - d, c[1] + d]], k.TEX * 0.6, { curve: false });
      }
    });
    /* fruit on the rims of the top pads — the one accent */
    [[-12.5, top - 33, -18], [-8.6, top - 32.6, 12], [14.5, top - 33, 40], [18, top - 30, 70]]
      .forEach(([x, y, ang], i) => blade(k, PROF.lemon, [x, y, 1], 4.4, ang, COL.fig, 61 + i, 1.15, false));
  };

  /* 4 · Lavender — a grey mound of needles and a fan of bare stems, each
     ending in a spike of florets. The colour lives only in the spikes. */
  P.lavender = (k) => {
    const top = potTaper(k, 0, 0, 12, 9, 28, "cTerra");
    soil(k, 0, 0, 12, top);
    for (let i = 0; i < 15; i++) {
      const ang = -80 + i * (160 / 14);
      k.leaf(L.needle, [0, top, 0], 9 + (i % 3) * 2.5, ang, "cOlive", 11 + i, 1.6);
    }
    const r = rnd(17);
    for (let i = 0; i < 13; i++) {
      const lean = -42 + i * 7 + (r() - 0.5) * 4, h = 26 + r() * 10;
      const tip = [Math.sin(lean * RAD) * h * 0.85, top - h * Math.cos(lean * RAD * 0.6), (i % 3) * 0.6];
      const base = [(i - 6) * 0.35, top - 3, tip[2]];
      k.M(k.V.seg(base, tip), k.TEX * 1.1, { taper: [1.1, 0.8] });
      const ang = aim(k, base, tip);
      for (let j = 0; j < 12; j++) {
        const t = 0.74 + (j / 12) * 0.26, sd = j % 2 ? 1 : -1;
        const p = [base[0] + (tip[0] - base[0]) * t, base[1] + (tip[1] - base[1]) * t, tip[2]];
        blade(k, PROF.petal, p, 2.2 - j * 0.1, ang + sd * 26, COL.lilac, 31 + i * 13 + j, 1.6, false);
      }
    }
  };

  /* 5 · Sunflower — one tall stem, a few broad leaves, a head that faces you */
  P.sunflower = (k) => {
    const top = potCyl(k, 0, 0, 10, 28, "cPot", -14);
    soil(k, 0, 0, 10, top);
    const head = [2, top - 44, 0.5];
    k.M([k.V.p(0, top, 0), k.V.p(-1.5, top - 22, 0.3), k.V.p(...head)], k.OUT * 1.15,
        { curve: true, taper: [1.3, 0.85] });
    [[-1, top - 12, -64, 13], [-1.2, top - 20, 58, 14], [-0.8, top - 30, -54, 11], [0.6, top - 36, 50, 9]]
      .forEach(([x, y, ang, len], i) =>
        k.leaf(L.heart, [x, y, 0.3], len, ang, i % 2 ? "cLeafD" : "cLeaf", 11 + i * 2, 1.1));
    /* two rings of petals, back ring first and darker, offset half a step */
    for (let ring = 1; ring < 2; ring++)
      for (let i = 0; i < 13; i++) {
        const ang = i * (360 / 13);
        const c = k.V.p(...head), s = k.V.s(head[2]), a = ang * RAD;
        const r0 = 5.2 * s;
        const base = [head[0] + Math.sin(a) * 4.6, head[1] - Math.cos(a) * 4.6, head[2]];
        void c; void r0;
        blade(k, PROF.petal, base, 10, ang, COL.yellow, 31 + i, 2.1, false);
      }
    const disc = View.disc(0, 0, 1, 24).map(([x, y]) => k.V.p(head[0] + x * 5.6, head[1] + y * 5.6, head[2]));
    k.R(disc, COL.brown, 71, 1, true);
    k.T(disc, "stipple", 0.5, { s: 73, gap: 0.55 });
    k.M(disc, k.DET, { closed: true, curve: true });
    k.M(View.disc(0, 0, 1, 18).map(([x, y]) => k.V.p(head[0] + x * 3.2, head[1] + y * 3.2, head[2])),
        k.TEX * 0.7, { closed: true, curve: true });
  };

  /* 6 · Tulips — closed cups on bent stems, straps at the base. The cup is
     three petals: the outline carries the tips, two inner lines the overlap. */
  P.tulips = (k) => {
    const top = potTaper(k, 0, 0, 13, 10, 26, "cPot");
    soil(k, 0, 0, 13, top);
    [[-58, 20], [-34, 24], [-10, 18], [30, 22], [54, 19], [12, 15]].forEach(([ang, len], i) =>
      k.leaf(L.strap, [(i - 3) * 1.4, top, 0], len, ang, i % 2 ? "cOlive" : "cLeaf", 11 + i * 2, 1.25));
    const CUP = [[0,0],[-0.24,0.05],[-0.42,0.28],[-0.48,0.62],[-0.44,0.98],[-0.4,1.02],
                 [-0.3,0.86],[-0.04,1.08],[0.04,1.08],[0.3,0.86],[0.4,1.02],[0.44,0.98],
                 [0.48,0.62],[0.42,0.28],[0.24,0.05]];
    [[-11, 34, -14, COL.red], [-3, 41, -4, COL.pink], [5, 37, 8, COL.red], [12, 31, 18, COL.pink], [0, 30, 0, "#E3653A"]]
      .forEach(([x, h, tilt, col], i) => {
        const head = [x, top - h, 0.5 + (i % 2)];
        stalk(k, [x * 0.2, top, 0.5], head, -tilt * 0.12, k.DET);
        const s = k.V.s(head[2]) * 9, b = k.V.p(...head), a = tilt * RAD;
        const at = (u, v) => [b[0] + (u * Math.cos(a) + v * Math.sin(a)) * s,
                              b[1] + (u * Math.sin(a) - v * Math.cos(a)) * s];
        const pts = CUP.map(([u, v]) => at(u, v));
        k.R(pts, col, 41 + i * 3, null, true);
        k.M(pts, k.TEX * 1.2, { closed: true, curve: true });
        k.M([at(-0.3, 0.86), at(-0.14, 0.42), at(-0.06, 0.12)], k.TEX * 0.8, { curve: true });
        k.M([at(0.3, 0.86), at(0.14, 0.42), at(0.06, 0.12)], k.TEX * 0.8, { curve: true });
      });
  };

  /* 7 · Jade — a fat little tree: thick forked trunk, coin leaves in tufts */
  P.jade = (k) => {
    const top = potTaper(k, 0, 0, 14, 10, 30, "cTerra");
    soil(k, 0, 0, 14, top);
    const fork = [0.5, top - 8, 0.5];
    k.M([k.V.p(0, top, 0), k.V.p(...fork)], k.OUT * 2.4, { taper: [1.3, 0.95] });
    const ends = [[-13, top - 15, 0.5], [-7, top - 21, 1], [0, top - 24, 1], [7, top - 21, 1], [13, top - 16, 0.5]];
    ends.forEach((e) => k.M([k.V.p(...fork), k.V.p((fork[0] + e[0]) / 2, (fork[1] + e[1]) / 2 - 2, e[2]),
                             k.V.p(...e)], k.OUT * 1.4, { curve: true, taper: [1.25, 0.7] }));
    ends.forEach((e, c) => {
      for (let j = 0; j < 3; j++) {
        const ang = -44 + j * 44 + (c - 2) * 14;
        k.leaf(L.oval, e, 6.4 - (j % 2) * 0.6, ang, j === 1 ? "cLeafD" : COL.jade, 11 + c * 10 + j, 1.2);
      }
    });
  };

  /* 8 · Agave — a rosette of thick blades in a low bowl, each with a black
     tip spine and a toothed edge. The front blades droop toward you. */
  P.agave = (k) => {
    const top = potTaper(k, 0, 0, 15, 11, 31, "cPot");
    soil(k, 0, 0, 15, top);
    const order = [-24, 24, -8, 8, -46, 46, -66, 66, -88, 88, 0];
    order.forEach((ang, i) => {
      const len = 24 - Math.abs(ang) * 0.09 + (ang === 0 ? -3 : 0);
      const at = blade(k, PROF.agave, [ang * 0.03, top - 1, 0], len, ang, i < 4 ? COL.beak : COL.agave,
                       11 + i * 3, 1.15, true);
      k.M([at(0, 0.9), at(0, 1.08)], k.OUT * 0.9, { taper: [1.2, 0.4], curve: false });
      for (let t = 0.18; t < 0; t += 0.11)
        for (const sd of [-1, 1]) {
          const w = PROF.agave.reduce((m, [u, tt]) => (tt <= t ? u : m), 0.2) * 1.15;
          k.M([at(sd * w, t), at(sd * (w + 0.05), t + 0.025)], k.TEX * 0.7, { curve: false });
        }
    });
  };

  /* 9 · Orchid — broad leaves low and flat, a stake, and an arching spike
     of flat-faced flowers. The arch is the gesture; the stake explains it. */
  P.orchid = (k) => {
    const top = potCyl(k, 0, 0, 9, 22, COL.white, -12);
    soil(k, 0, 0, 9, top);
    k.M(k.V.seg([1.5, top, 0], [1.5, top - 30, 0]), k.DET, { taper: [1, 1], curve: false });
    [[-62, 13], [66, 12], [-96, 16], [98, 15]].forEach(([ang, len], i) =>
      k.leaf(L.oval, [0, top - 1, 0], len, ang, i % 2 ? "cLeaf" : "cLeafD", 11 + i * 2, 0.72));
    const arc = [];
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      arc.push([1.5 + t * 22, top - 30 - Math.sin(t * Math.PI * 0.8) * 7 + t * t * 12, 1]);
    }
    k.M(arc.map((p) => k.V.p(...p)), k.TEX * 1.1, { curve: true });
    k.M(k.V.seg([0.5, top, 0], [1.5, top - 30, 0]), k.TEX * 1.1, { curve: false });
    [3, 6, 8, 10].forEach((j, i) => {
      const c = arc[j], sz = 0.95 - i * 0.08;
      blade(k, L.oval, c, 5.4 * sz, 0, COL.white, 31 + i * 6, 1.2, false);
      blade(k, L.round, c, 6.2 * sz, 78, COL.pink, 34 + i * 6, 1.3, false);
      blade(k, L.round, c, 6.2 * sz, -78, COL.pink, 35 + i * 6, 1.3, false);
      blade(k, PROF.lemon, [c[0], c[1] + 0.4, c[2]], 3.4 * sz, 180, COL.magenta, 36 + i * 6, 1.1, false);
    });
  };

  /* 10 · Lemon tree — a standard: a square planter, a clean trunk, a dome of
     leaves, fruit hanging under the dome. Back leaves first, darker. */
  P.lemon = (k) => {
    const top = 22;
    k.part(-10, -10, 10, 10, top, k.GND, "cPot", 5, k.OUT, -14, 0, 0, 1.2);
    k.T(View.turn(View.rect(-8.8, -8.8, 8.8, 8.8), -14, 0, 0).map(([x, z]) => k.V.p(x, top + 0.6, z)),
        "solid", 0.4, { fill: "ink" });
    const crown = [0, top - 40, 1];
    k.M([k.V.p(0, top, 0), k.V.p(0.6, top - 16, 0.5), k.V.p(crown[0] + 0.4, crown[1] + 11, 1)], k.OUT * 1.5,
        { curve: true, taper: [1.25, 0.8] });
    /*
     * The crown is ONE scalloped silhouette, not a pile of leaves. Every
     * outline draws over every fill, so twenty overlapping leaves show all
     * twenty outlines — a tangle. Scallops: base points on the ellipse, only
     * each segment's midpoint pushed out.
     */
    const r = rnd(41), N = 11, edge = [];
    /* each scallop is a little arc of four points, so it bulges round
       instead of coming to a point */
    for (let i = 0; i < N; i++)
      for (let j = 0; j < 4; j++) {
        const t = j / 4, a = ((i + t) / N) * Math.PI * 2;
        const bump = 1 + Math.sin(t * Math.PI) * (0.12 + (i % 3) * 0.02);
        edge.push([Math.cos(a) * 15.5 * bump, Math.sin(a) * 11.5 * bump]);
      }
    const crownPts = edge.map(([x, y]) => k.V.p(crown[0] + x, crown[1] + y, 1));
    k.R(crownPts, "cLeaf", 9, 1, true);
    /* the shade side is a darker fill, not hatch: tones draw over every
       fill, so hatching here ran straight across the lemons */
    const arcPt = (deg, rx, ry, ox, oy) => k.V.p(crown[0] + ox + Math.cos(deg * RAD) * rx,
                                                crown[1] + oy + Math.sin(deg * RAD) * ry, 1);
    const shadeArc = [];
    for (let d = -40; d <= 150; d += 10) shadeArc.push(arcPt(d, 15.4, 11.6, 0, 0));
    for (let d = 150; d >= -40; d -= 10) shadeArc.push(arcPt(d, 13.4, 9.6, -3.2, -2.6));
    k.R(shadeArc, "cLeafD", 10, 1, true);
    k.M(crownPts, k.OUT, { closed: true, curve: true });
    /* leaf hints inside the mass: little V-ticks, the way a pen implies foliage */
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2, d = 0.25 + r() * 0.6;
      const x = crown[0] + Math.cos(a) * 14 * d, y = crown[1] + Math.sin(a) * 10 * d;
      k.M([k.V.p(x - 1.4, y - 1.1, 1), k.V.p(x, y, 1), k.V.p(x + 1.4, y - 1.1, 1)], k.TEX * 0.8, { curve: false });
    }
    [[-11, 8, -10], [-4, 11, 6], [6, 9, -4], [13, 5, 14], [1, 2, 0], [-14, -2, -20]]
      .forEach(([x, y, ang], i) =>
        blade(k, PROF.lemon, [crown[0] + x, crown[1] + y, 1], 6, 180 + ang, COL.yellow, 101 + i, 1.15, false));
  };

  const NAMES = {
    strelitzia: "Bird of paradise", peacelily: "Peace lily", opuntia: "Prickly pear",
    lavender: "Lavender", sunflower: "Sunflower", tulips: "Tulips", jade: "Jade plant",
    agave: "Agave", orchid: "Orchid", lemon: "Lemon tree",
  };

  /* the buildings' nib: more pressure, less wander */
  const NIB = Spec.FIRM;

  const out = {};
  for (const key of Object.keys(P)) {
    out[key] = Spec.wrap("plant", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      /* the buildings' hierarchy, not the kit default: leaf outlines were on
         TEX (0.48 of an already thin pen) and every plant read as hairline */
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.64;
      k.shadow(0, 0, 15, 5);
      P[key](k);
      return k.done();
    });
  }
  out._keys = Object.keys(P);
  out._names = NAMES;
  /* pots, soil, blades and stalks, shared with plants3.js — one family */
  out._kit = { PROF, COL, rnd, potTaper, potShade, potCyl, soil, blade, stalk, aim, NIB };
  return out;
})();
