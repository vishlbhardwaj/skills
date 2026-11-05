/*
 * TWENTY PLANTS.
 *
 * Each is a pot plus an arrangement of leaves. The leaf SHAPES are explicit
 * profiles in `Kit.LEAF` — traced, because a leaf generated from a formula
 * lands nearly right and reads wrong, the same way the chairs did. What
 * varies per plant is which profile, how many, how they are arranged, and
 * how the pot sits under them.
 *
 * Everything is placed in 3D and takes its scale from its own depth, so a
 * leaf reaching toward the viewer is genuinely larger than one behind it.
 * The pots are turned a few degrees off square for the same reason: a
 * cylinder square to the camera has no depth to show.
 */
window.Plants = (function () {
  const L = Kit.LEAF;
  const RAD = Math.PI / 180;

  /* a seeded wobble so every plant is reproducible but none is regular */
  function rnd(seed) {
    let a = seed | 0 || 1;
    return () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  }

  /* ── pots ──────────────────────────────────────────────────────────
   * Drawn as PROFILES where they taper, because a prism cannot taper.
   */
  function potTaper(k, cx, cz, rTop, rBot, top, fill) {
    const V = k.V, b = V.p(cx, k.GND, cz), s = V.s(cz), h = (k.GND - top);
    const prof = [[-rBot, 0], [-rTop, -h * 0.94], [-rTop * 1.06, -h],
                  [rTop * 1.06, -h], [rTop, -h * 0.94], [rBot, 0]];
    const pts = prof.map(([x, y]) => [b[0] + x * s, b[1] + y * s]);
    k.R(pts, fill || "cTerra", 5, 1, true);
    k.M(pts, k.OUT, { closed: true, curve: true });
    /* the rim: one line that turns a silhouette into a vessel */
    k.M([[b[0] - rTop * 1.06 * s, b[1] - h * 0.9 * s],
         [b[0] + rTop * 1.06 * s, b[1] - h * 0.9 * s]], k.DET);
    return top;
  }
  function potCyl(k, cx, cz, r, top, fill, turn) {
    k.part(cx - r, cz - r, cx + r, cz + r, top, k.GND, fill || "cTerra", 5,
           k.OUT, turn || 0, cx, cz, r * 0.9);
    return top;
  }

  /* a soil line, so the plant is planted rather than resting on the rim */
  function soil(k, cx, cz, r, top) {
    k.R(View.disc(cx, cz, r * 0.86, 16).map(([x, z]) => k.V.p(x, top + 0.6, z)),
        "cSoil", 7, 0.9, true);
  }

  /* ── the plants ───────────────────────────────────────────────────── */
  const P = {};

  /* 1 · Monstera — the splits are the plant; a plain oval is a rubber tree */
  P.monstera = (k) => {
    const top = potTaper(k, 0, 0, 11, 8.5, 22, "cTerra");
    soil(k, 0, 0, 11, top);
    const r = rnd(3);
    [[-52, 20], [-24, 26], [4, 28], [30, 24], [54, 18], [-10, 15], [18, 14]]
      .forEach(([ang, len], i) => {
        const at = k.leaf(L.round, [(i - 3) * 1.6, top, 0], len, ang, "cLeaf", 11 + i * 2, 1.15);
        /* the splits stop short of the edge: at |u| past the profile's own
           maximum they shoot out of the leaf as loose whiskers */
        for (let s = -1; s <= 1; s += 2)
          for (let j = 0; j < 3; j++)
            k.M([at(s * 0.08, 0.26 + j * 0.2), at(s * 0.38, 0.3 + j * 0.2)], k.TEX * 0.8);
      });
  };

  /* 2 · Snake plant — rigid, vertical, barely any spread */
  P.snake = (k) => {
    const top = potCyl(k, 0, 0, 9, 24, "cPot", -14);
    soil(k, 0, 0, 9, top);
    [-26, -16, -7, 0, 7, 15, 24].forEach((ang, i) =>
      k.leaf(L.strap, [(i - 3) * 1.2, top, 0], 34 + (i % 3) * 5, ang,
             i % 2 ? "cLeaf" : "cLeafD", 11 + i * 2, 0.8));
  };

  /* 3 · Fiddle-leaf fig — few huge leaves on a bare trunk */
  P.fiddle = (k) => {
    const top = potCyl(k, 0, 0, 11, 24, "cPot", -12);
    soil(k, 0, 0, 11, top);
    k.M(k.V.seg([0, top, 0], [-1.5, top - 26, 1]), k.OUT * 1.2, { taper: [1.3, 0.7] });
    [[-44, 17, 0.42], [36, 18, 0.55], [-30, 16, 0.72], [22, 15, 0.86], [-6, 14, 0.98]]
      .forEach(([ang, len, t], i) =>
        k.leaf(L.paddle, [-1.5 * t, top - 26 * t, t], len, ang, "cLeaf", 11 + i * 2, 1.05));
  };

  /* 4 · Pothos — a trailer: the vines leaving the pot are the subject */
  P.pothos = (k) => {
    const top = potTaper(k, 0, 0, 9, 7, 24, "cPot");
    soil(k, 0, 0, 9, top);
    const r = rnd(9);
    [[-1, 30], [-1, 20], [1, 26], [1, 16]].forEach(([sd, drop], v) => {
      const pts = [];
      for (let j = 0; j <= 7; j++) {
        const t = j / 7;
        pts.push(k.V.p(sd * (3 + t * 16), top - 4 + drop * t * t, t * 2));
      }
      k.M(pts, k.TEX, { curve: true });
      for (let j = 2; j < pts.length; j++)
        k.leaf(L.heart, [sd * (3 + (j / 7) * 16), top - 4 + drop * (j / 7) ** 2, (j / 7) * 2],
               6.5, sd * 120 + (j % 2 ? 24 : -24), "cLeaf", 21 + v * 9 + j, 1);
    });
    [[-18, 10], [16, 8], [0, 12]].forEach(([ang, len], i) =>
      k.leaf(L.heart, [0, top, 0], len, ang, "cLeaf", 61 + i * 2, 1));
  };

  /* 5 · Barrel cactus — ribs, not leaves */
  P.barrel = (k) => {
    const top = potTaper(k, 0, 0, 10, 8, 26, "cTerra");
    soil(k, 0, 0, 10, top);
    const V = k.V, b = V.p(0, top, 0), s = V.s(0);
    const body = [];
    for (let i = 0; i <= 22; i++) {
      const a = Math.PI * (i / 22);
      body.push([b[0] - Math.cos(a) * 8.4 * s, b[1] - Math.sin(a) * 13 * s]);
    }
    k.R(body.concat([[b[0] + 8.4 * s, b[1]]]), "cCactus", 11, 1, true);
    k.M(body, k.OUT, { curve: true });
    for (let i = 1; i < 7; i++) {
      const u = -1 + (i / 7) * 2;
      k.M([[b[0] + u * 9.4 * s, b[1]],
           [b[0] + u * 5.6 * s, b[1] - 11 * s * Math.sqrt(1 - u * u * 0.6)]], k.TEX, { curve: true });
    }
  };

  /* 6 · Column cactus — two arms off one trunk */
  P.column = (k) => {
    const top = potCyl(k, 0, 0, 10, 26, "cTerra", -10);
    soil(k, 0, 0, 10, top);
    k.part(-4, -4, 4, 4, top - 34, top, "cCactus", 11, k.OUT, 0, 0, 0, 3.4);
    /* arms as limbs: drawn as a wire the cactus read as a signpost */
    [[-1, 14, 11], [1, 22, 9]].forEach(([sd, h, up], i) => {
      k.part(sd > 0 ? 3 : -8.4, -2.6, sd > 0 ? 8.4 : -3, 2.6, top - h - 3, top - h + 2.6,
             "cCactus", 31 + i * 8, k.OUT, 0, 0, 0, 2.4);
      k.part(sd * 5.7 - 2.6, -2.6, sd * 5.7 + 2.6, 2.6, top - h - up - 3, top - h + 1,
             "cCactus", 51 + i * 8, k.OUT, 0, 0, 0, 2.4);
    });
  };

  /* 7 · Succulent rosette — tight, low, many short leaves */
  P.rosette = (k) => {
    const top = potCyl(k, 0, 0, 10, 32, "cPot", -16);
    soil(k, 0, 0, 10, top);
    for (let ring = 0; ring < 3; ring++)
      for (let i = 0; i < 7 - ring; i++) {
        const a = (i / (7 - ring)) * 360 + ring * 24;
        k.leaf(L.spear, [0, top - ring * 1.4, 0], 13 - ring * 3.2,
               (a > 180 ? a - 360 : a) * 0.52, ring ? "cLeaf" : "cLeafD",
               11 + ring * 20 + i * 2, 1.2);
      }
  };

  /* 8 · Aloe — fewer, longer, serrated */
  P.aloe = (k) => {
    const top = potTaper(k, 0, 0, 9, 7.5, 28, "cPot");
    soil(k, 0, 0, 9, top);
    [-58, -36, -14, 8, 30, 52].forEach((ang, i) => {
      const at = k.leaf(L.lance, [0, top, 0], 24 + (i % 3) * 4, ang, "cLeaf", 11 + i * 3, 1.4);
      for (let s = 1; s < 5; s++) k.M([at(0.10, s * 0.19), at(0.19, s * 0.19 + 0.03)], k.TEX * 0.7);
    });
  };

  /* 9 · Spider plant — arching strap leaves and a runner */
  P.spider = (k) => {
    const top = potCyl(k, 0, 0, 9, 22, "cPot", -14);
    soil(k, 0, 0, 9, top);
    [-70, -48, -26, -4, 18, 40, 64].forEach((ang, i) =>
      k.leaf(L.strap, [0, top, 0], 22 + (i % 2) * 5, ang, i % 2 ? "cLeaf" : "cLeafD", 11 + i * 2, 0.9));
    k.M([k.V.p(6, top - 10, 0), k.V.p(20, top - 2, 2), k.V.p(26, top + 8, 3)],
        k.TEX, { curve: true });
    for (let i = 0; i < 4; i++)
      k.leaf(L.strap, [26, top + 8, 3], 7, -40 + i * 28, "cLeaf", 61 + i * 2, 0.9);
  };

  /* 10 · ZZ plant — paired leaflets up a stiff stem */
  P.zz = (k) => {
    const top = potCyl(k, 0, 0, 9, 24, "cPot", -12);
    soil(k, 0, 0, 9, top);
    [-22, -7, 8, 23].forEach((lean, s) => {
      const h = 28 + (s % 2) * 5;
      const tip = [Math.sin(lean * RAD) * h * 0.5, top - h, s * 0.8];
      k.M([k.V.p(0, top, s * 0.4), k.V.p(tip[0] * 0.6, top - h * 0.55, s * 0.6), k.V.p(...tip)],
          k.DET * 1.2, { curve: true, taper: [1.2, 0.7] });
      for (let j = 1; j <= 5; j++) {
        const t = j / 6;
        const p = [tip[0] * t, top - h * t, s * 0.8 * t];
        k.leaf(L.oval, p, 7.5, lean - 68, "cLeafD", 11 + s * 14 + j, 1);
        k.leaf(L.oval, p, 7.5, lean + 68, "cLeaf", 12 + s * 14 + j, 1);
      }
    });
  };

  /* 11 · Rubber plant — broad glossy ovals, upright */
  P.rubber = (k) => {
    const top = potCyl(k, 0, 0, 11, 24, "cPot", -12);
    soil(k, 0, 0, 11, top);
    k.M(k.V.seg([0, top, 0], [2, top - 22, 1]), k.OUT * 1.2, { taper: [1.3, 0.8] });
    [[-40, 15], [34, 16], [-24, 14], [20, 13], [-4, 12]].forEach(([ang, len], i) =>
      k.leaf(L.oval, [2 * (i + 1) / 5, top - 22 * (i + 1) / 5, (i + 1) / 5], len, ang,
             i % 2 ? "cLeafD" : "cLeaf", 11 + i * 2, 1.1));
  };

  /* 12 · Parlour palm — many fronds from one crown */
  P.palm = (k) => {
    const top = potTaper(k, 0, 0, 10, 8, 26, "cTerra");
    soil(k, 0, 0, 10, top);
    for (let i = 0; i < 9; i++) {
      const ang = -72 + i * 18;
      const at = k.leaf(L.frond, [0, top - 4, 0], 26, ang, "cLeaf", 11 + i * 2, 1);
      for (let j = 1; j < 7; j++) {
        const t = j / 7;
        k.M([at(0, t), at(0.34, t + 0.07)], k.TEX * 0.7);
        k.M([at(0, t), at(-0.34, t + 0.07)], k.TEX * 0.7);
      }
    }
  };

  /* 13 · Fern — fronds that are all leaflet, no blade */
  P.fern = (k) => {
    const top = potTaper(k, 0, 0, 10, 8, 26, "cPot");
    soil(k, 0, 0, 10, top);
    for (let i = 0; i < 8; i++) {
      const ang = -66 + i * 19, len = 24 + (i % 3) * 4;
      const a = ang * RAD, b = k.V.p(0, top - 3, 0), s = k.V.s(0) * len;
      const dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
      const spine = [];
      for (let j = 0; j <= 8; j++) {
        const t = j / 8, bow = Math.sin(t * Math.PI) * 0.14;
        spine.push([b[0] + dx * t * s + px * bow * s, b[1] + dy * t * s + py * bow * s]);
      }
      k.M(spine, k.TEX, { curve: true });
      for (let j = 1; j < spine.length; j++) {
        const w = 0.34 * (1 - Math.abs(j / 8 - 0.42)) * s;
        k.M([spine[j], [spine[j][0] + (px * 0.8 + dx * 0.5) * w, spine[j][1] + (py * 0.8 + dy * 0.5) * w]], k.TEX * 1.5);
        k.M([spine[j], [spine[j][0] - (px * 0.8 - dx * 0.5) * w, spine[j][1] - (py * 0.8 - dy * 0.5) * w]], k.TEX * 1.5);
      }
    }
  };

  /* 14 · Bonsai — a thick trunk and two flat pads */
  P.bonsai = (k) => {
    const top = potCyl(k, 0, 0, 14, 34, "cTerra", -18);
    soil(k, 0, 0, 14, top);
    k.M([k.V.p(0, top, 0), k.V.p(-4, top - 9, 1), k.V.p(3, top - 17, 1)],
        k.OUT * 2.2, { curve: true, taper: [1.35, 0.6] });
    k.M([k.V.p(1, top - 13, 1), k.V.p(-9, top - 17, 1)], k.OUT * 1.4, { taper: [1.1, 0.7] });
    /* pads built from overlapping leaf clusters: two flat discs on a stick
       read as lily pads, not as foliage */
    [[-11, top - 19, 12], [5, top - 23, 14]].forEach(([x, y, w], i) => {
      for (let j = 0; j < 7; j++) {
        const u = (j / 6 - 0.5) * 2;
        k.leaf(L.oval, [x + u * w * 0.5, y + Math.abs(u) * 2.2, 0], 7.5,
               u * 52, j % 2 ? "cLeafD" : "cLeaf", 11 + i * 16 + j, 1.3);
      }
    });
  };

  /* 15 · Olive in a tall pot — fine grey leaves on many twigs */
  P.olive = (k) => {
    const top = potTaper(k, 0, 0, 11, 9, 20, "cPot");
    soil(k, 0, 0, 11, top);
    k.M(k.V.seg([0, top, 0], [1, top - 16, 0]), k.OUT * 1.5, { taper: [1.3, 0.8] });
    const r = rnd(21);
    for (let i = 0; i < 11; i++) {
      const ang = -74 + i * 15, len = 13 + r() * 7;
      const a = ang * RAD, b = k.V.p(1, top - 16, 0), s = k.V.s(0) * len;
      const tip = [b[0] + Math.sin(a) * s, b[1] - Math.cos(a) * s];
      k.M([b, tip], k.TEX, { taper: [1.2, 0.7] });
      for (let j = 1; j <= 3; j++) {
        const t = j / 3.4;
        k.leaf(L.lance, [1 + Math.sin(a) * len * t * 0.1, top - 16 - Math.cos(a) * len * t * 0.1, 0],
               5.5, ang + (j % 2 ? 54 : -54), "cOlive", 11 + i * 4 + j, 1.1);
      }
    }
  };

  /* 16 · String of pearls — beads on falling threads */
  P.pearls = (k) => {
    const top = potCyl(k, 0, 0, 8, 20, "cPot", -14);
    soil(k, 0, 0, 8, top);
    const r = rnd(33);
    for (let v = 0; v < 7; v++) {
      const sd = v % 2 ? 1 : -1, drop = 20 + r() * 20, off = 2 + (v % 4) * 2;
      const pts = [];
      for (let j = 0; j <= 7; j++) {
        const t = j / 7;
        pts.push(k.V.p(sd * (off + t * 5), top - 4 + drop * t * t, (v - 3) * 0.7));
      }
      k.M(pts, k.TEX * 0.8, { curve: true });
      for (let j = 1; j < pts.length; j++) {
        const s = k.V.s((v - 3) * 0.7);
        const c = View.disc(0, 0, 1, 10).map(([u, w]) => [pts[j][0] + u * 1.7 * s, pts[j][1] + w * 1.7 * s]);
        k.R(c, "cLeaf", 11 + v * 9 + j, 1, true);
        k.M(c, k.TEX * 0.7, { closed: true, curve: true });
      }
    }
  };

  /* 17 · Philodendron — big arrow leaves, loose */
  P.philo = (k) => {
    const top = potTaper(k, 0, 0, 11, 9, 24, "cTerra");
    soil(k, 0, 0, 11, top);
    [[-56, 19], [-28, 22], [0, 24], [26, 21], [52, 17], [-14, 14], [16, 13]]
      .forEach(([ang, len], i) =>
        k.leaf(L.spear, [(i - 3) * 1.4, top, (i - 3) * 0.5], len, ang,
               i % 3 ? "cLeaf" : "cLeafD", 11 + i * 2, 1.25));
  };

  /* 18 · Calathea — patterned ovals on long stalks */
  P.calathea = (k) => {
    const top = potCyl(k, 0, 0, 10, 26, "cPot", -12);
    soil(k, 0, 0, 10, top);
    [-48, -26, -6, 16, 38].forEach((ang, i) => {
      const h = 15 + (i % 3) * 3, a = ang * RAD;
      const bx = Math.sin(a) * h * 0.4, by = top - h;
      k.M([k.V.p(0, top, 0), k.V.p(bx, by, 0)], k.TEX, { taper: [1.2, 0.8] });
      const at = k.leaf(L.oval, [bx, by, 0], 15, ang, "cLeaf", 11 + i * 3, 1.05);
      for (let j = 1; j <= 4; j++)
        k.M([at(-0.3 * (1 - j / 6), 0.2 + j * 0.15), at(0.3 * (1 - j / 6), 0.2 + j * 0.15)], k.TEX * 0.6);
    });
  };

  /* 19 · Bamboo — canes with nodes, leaves only at the top */
  P.bamboo = (k) => {
    const top = potCyl(k, 0, 0, 9, 20, "cPot", -14);
    soil(k, 0, 0, 9, top);
    [[-4, 40, 0], [0, 48, 1.5], [4, 44, -1.2]].forEach(([x, h, z], c) => {
      k.M(k.V.seg([x, top, z], [x + (c - 1) * 2, top - h, z]), k.OUT * 1.3, { taper: [1.15, 0.9] });
      for (let n = 1; n < 5; n++) {
        const t = n / 5;
        k.M(k.V.seg([x + (c - 1) * 2 * t - 1.4, top - h * t, z], [x + (c - 1) * 2 * t + 1.4, top - h * t, z]), k.TEX);
      }
      for (let j = 0; j < 4; j++)
        k.leaf(L.lance, [x + (c - 1) * 2, top - h + j * 2, z], 11, -56 + j * 34, "cLeaf", 11 + c * 9 + j, 0.9);
    });
  };

  /* 20 · Air plant on a dish — no soil at all, which is the point */
  P.airplant = (k) => {
    const V = k.V, b = V.p(0, k.GND, 0), s = V.s(0);
    const dish = View.disc(0, 0, 11, 20).map(([x, z]) => V.p(x, k.GND - 2.5, z));
    k.R(dish, "cPot", 5, 1, true);
    k.M(dish, k.OUT, { closed: true, curve: true });
    k.M(View.disc(0, 0, 8.6, 20).map(([x, z]) => V.p(x, k.GND - 3.4, z)), k.DET,
        { closed: true, curve: true });
    for (let i = 0; i < 11; i++) {
      const a = -84 + i * 17;
      k.leaf(L.needle, [0, k.GND - 3.4, 0], 17 + (i % 3) * 4, a,
             i % 2 ? "cLeaf" : "cOlive", 11 + i * 2, 1.5);
    }
  };

  /* ── wrap them all ────────────────────────────────────────────────── */
  const NAMES = {
    monstera: "Monstera", snake: "Snake plant", fiddle: "Fiddle-leaf fig",
    pothos: "Pothos", barrel: "Barrel cactus", column: "Column cactus",
    rosette: "Echeveria", aloe: "Aloe", spider: "Spider plant", zz: "ZZ plant",
    rubber: "Rubber plant", palm: "Parlour palm", fern: "Fern", bonsai: "Bonsai",
    olive: "Olive", pearls: "String of pearls", philo: "Philodendron",
    calathea: "Calathea", bamboo: "Bamboo", airplant: "Air plant",
  };

  const out = {};
  for (const key of Object.keys(P)) {
    out[key] = Kit.wrap(NAMES[key], () => {
      /* a modest turn and a long lens: a pot square to the camera is a
         rectangle, and these want just enough depth to read as objects */
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.shadow(0, 0, 15, 5);
      P[key](k);
      return k.done();
    }, { w: 0.74, h: 0.86 }, 0.15);
  }
  out._keys = Object.keys(P);
  return out;
})();
