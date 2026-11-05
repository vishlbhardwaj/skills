/*
 * FIVE MORE PLANTS — each named by a landmark no plant in plants.js or
 * plants2.js has: a hanging pitcher with its lid, a toothed jaw, a round coin
 * leaf pinned at its centre, a braided trunk, a swollen bulb under a fountain.
 *
 * Same rig, pots, blades and stalks as plants2 (`Plants2._kit`), so the three
 * modules read as one family. Archetype × landmark, never a recolour.
 */
window.Plants3 = (function () {
  const L = Kit.LEAF, RAD = Math.PI / 180;
  const { PROF, rnd, potTaper, potCyl, soil, blade, stalk } = Plants2._kit;
  const COL = { pitcher: "#A9B85A", lip: "#B8433F", trap: "#C9473F", bark: "#8A6B4E", barkD: "#6E5340",
                bulb: "#A08466", white: "#F7F5EE", coin: "#79A35A", hair: "#6F9A55" };
  const P = {};

  /* a curved ribbon along a 3D polyline: a stem, a strand, a leaf that arcs */
  function ribbon(k, pts3, w0, w1, fill, sd, outline) {
    const pts = pts3.map((p) => k.V.p(...p)), n = pts.length, L2 = [], R2 = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) * k.V.s(pts3[i][2]) / 2;
      L2.push([pts[i][0] - (dy / m) * w, pts[i][1] + (dx / m) * w]);
      R2.push([pts[i][0] + (dy / m) * w, pts[i][1] - (dx / m) * w]);
    }
    const poly = L2.concat(R2.reverse());
    if (fill) k.R(poly, fill, sd, null, true);
    if (outline !== false) k.M(poly, k.TEX, { closed: true, curve: true });
    return poly;
  }
  /* points along a quadratic arc in 3D */
  const arc = (a, c, b, n) => Array.from({ length: (n || 12) + 1 }, (_, i) => {
    const t = i / (n || 12), u = 1 - t;
    return [0, 1, 2].map((j) => u * u * a[j] + 2 * u * t * c[j] + t * t * b[j]);
  });

  /* 1 · Pitcher plant — a hanging basket, strap leaves, and from each leaf tip
     a tendril down to a lidded pitcher. The pitcher (vessel + ribbed lip +
     lid) is the whole identification; the leaves are ordinary on purpose. */
  P.pitcher = (k) => {
    const V = k.V, Y = 6;                                   /* basket rim height */
    /* the hook and three chains, then the basket: a shallow bowl */
    k.M([V.p(0, Y - 34, 0), V.p(0, Y - 30, 0)], k.OUT);
    [[-12, 0], [12, -2], [1, 6]].forEach(([x, z]) => k.M([V.p(0, Y - 30, 0), V.p(x, Y, z)], k.DET));
    const bowl = [[-13, 0], [-12.4, 3], [-10, 7.4], [-5, 9.6], [5, 9.6], [10, 7.4], [12.4, 3], [13, 0]].map(([x, d]) => V.p(x, Y + d, 0));
    k.R(bowl, "cTerra", 5, null, true);
    k.M(bowl, k.OUT, { closed: true, curve: true });
    k.M([V.p(-13, Y + 1.6, 0), V.p(13, Y + 1.6, 0)], k.DET);
    k.T([V.p(4, Y + 1.6, 0), V.p(12.6, Y + 1.6, 0), V.p(9.6, Y + 7.6, 0), V.p(3, Y + 9.4, 0)], "hatch", 0.42, { angle: 62, gap: 0.9, s: 3 });
    /* strap leaves arching out of the basket */
    const leaves = [[-62, 21, -1], [-30, 19, 1], [-4, 17, 0], [24, 19, 1], [58, 21, -1], [84, 18, 0], [-88, 17, 0]];
    const tips = leaves.map(([ang, len, z], i) => {
      const at = k.leaf(L.lance, [(i - 3) * 1.5, Y - 0.5, z], len, ang, i % 2 ? "cLeafD" : "cLeaf", 11 + i * 3, 0.9);
      return at(0, 1);
    });
    /* pitchers hang from the outer leaves: tendril, vessel, ribbed peristome, lid */
    [[0, 26, 1.0], [4, 22, 0.85], [5, 30, 1.1], [6, 20, 0.8], [1, 24, 0.9]].forEach(([li, drop, sc], j) => {
      const t = tips[li], bx = t[0] + (j % 2 ? 3 : -3), by = t[1] + drop;
      k.M([t, [t[0] + (bx - t[0]) * 0.3 - 3, t[1] + drop * 0.35], [bx, by - 12 * sc]], k.DET * 0.8, { curve: true });
      const half = [[0, 0], [2.2, 0.6], [3.6, 2.6], [4.0, 5.4], [3.2, 8.4], [2.6, 10.4], [3.0, 12.2], [3.4, 13.6]];
      const pts = half.map(([x, y]) => [bx + x * sc, by - y * sc]).concat(half.slice().reverse().map(([x, y]) => [bx - x * sc, by - y * sc]));
      k.R(pts, COL.pitcher, 21 + j, null, true);
      k.M(pts, k.TEX, { closed: true, curve: true });
      /* the wings: two ribs down the front */
      [-0.9, 0.9].forEach((dx) => k.M([[bx + dx * sc, by - 11.6 * sc], [bx + dx * 0.7 * sc, by - 1.6 * sc]], k.TEX * 0.6));
      for (let i = 0; i < 4; i++) k.R([[bx - 2 + i * 1.3, by - 4 - (i % 2) * 2.4], [bx - 1.4 + i * 1.3, by - 4.3 - (i % 2) * 2.4], [bx - 1.6 + i * 1.3, by - 3.6 - (i % 2) * 2.4]].map(([x, y]) => [x * 1, y]), COL.lip, 30 + i, null, true);
      const my = by - 13.6 * sc, rx = 3.6 * sc, ry = 1.4 * sc;
      const lip = Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [bx + Math.cos(a) * rx, my + Math.sin(a) * ry]; });
      k.R(lip, COL.lip, 41 + j, null, true);
      k.M(lip, k.DET, { closed: true, curve: true });
      const hole = lip.map(([x, y]) => [bx + (x - bx) * 0.6, my + (y - my) * 0.5]);
      k.R(hole, "ink", 1, null, true);
      for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); k.M([[bx + Math.cos(a) * rx * 0.7, my + Math.sin(a) * ry * 0.6], [bx + Math.cos(a) * rx, my + Math.sin(a) * ry]], k.TEX * 0.5); }
      /* the lid, in SCREEN space like everything else here — passing (bx, my) to
         blade() as a world point flung every lid off across the tile */
      const la = (-24 + j * 9) * RAD, ld = 6 * sc, lw = 2.6 * sc;
      const lid = Array.from({ length: 15 }, (_, i) => { const t = (i / 14) * Math.PI * 2;
        const u = (Math.cos(t) + 1) / 2 * ld, w = Math.sin(t) * lw;
        return [bx - 2.4 * sc + Math.sin(la) * u + Math.cos(la) * w, my - 0.8 - Math.cos(la) * u + Math.sin(la) * w]; });
      k.R(lid, COL.pitcher, 51 + j, null, true);
      k.M(lid, k.DET, { closed: true, curve: true });
    });
  };

  /* 2 · Venus flytrap — a low rosette of hinged jaws, each lobe red inside,
     fringed with cilia; a tall bare scape with white flowers above it */
  P.flytrap = (k) => {
    const top = potCyl(k, 0, 0, 12, 33, "cPot", -10);
    soil(k, 0, 0, 12, top);
    const r = rnd(9);
    /* the scape first — it stands behind the traps */
    stalk(k, [1, top, 2], [3, top - 34, 2], 1.5, k.DET * 0.8);
    [[-3, -36], [4, -37], [0, -39], [6, -34]].forEach(([dx, dy], i) => {
      const c = k.V.p(3 + dx * 0.9, top + dy, 2);
      for (let p = 0; p < 5; p++) blade(k, PROF.petal, [3 + dx * 0.9, top + dy, 2], 2.6, p * 72 + i * 20, COL.white, 61 + i * 5 + p, 1.4, false);
      k.R([[c[0] - 0.5, c[1] - 0.5], [c[0] + 0.5, c[1] - 0.5], [c[0] + 0.5, c[1] + 0.5], [c[0] - 0.5, c[1] + 0.5]], "cLeaf", 70 + i, null, true);
    });
    /* traps: petiole blade, then the two lobes as half-discs hinged on a midrib */
    [[-74, 13], [-46, 16], [-18, 17], [10, 16], [38, 15], [66, 13], [-90, 10], [86, 10]].forEach(([ang, len], i) => {
      const at = blade(k, PROF.spathe, [(i - 3.5) * 0.9, top, 0], len * 0.55, ang, "cLeaf", 11 + i * 2, 0.55, false);
      const h = at(0, 1), a = ang * RAD, dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
      const L3 = len * 0.42 * k.V.s(0), open = 0.55 + r() * 0.25;
      const lobe = (sd, shrink) => Array.from({ length: 13 }, (_, i2) => {
        const t = i2 / 12, along = Math.sin(Math.PI * t) * L3 * 0.42 * open * shrink;
        return [h[0] + dx * t * L3 + px * sd * along, h[1] + dy * t * L3 + py * sd * along];
      });
      const back = lobe(1, 1), front = lobe(-1, 0.86);
      k.R(back, COL.trap, 31 + i, null, true);
      k.M(back, k.DET, { closed: true, curve: true });
      k.R(front, "cLeaf", 41 + i, null, true);
      k.M(front, k.DET, { closed: true, curve: true });
      const inner = back.map(([x, y], j) => { const m = [h[0] + dx * (j / 12) * L3, h[1] + dy * (j / 12) * L3]; return [m[0] + (x - m[0]) * 0.55, m[1] + (y - m[1]) * 0.55]; });
      k.M(inner, k.TEX * 0.5, { curve: true });
      /* cilia: the teeth along both rims, splaying outward */
      [[back, 1], [front, -1]].forEach(([rim, sd]) => rim.slice(1, -1).forEach(([x, y], j) => {
        const t = (j + 1) / 12, ox = px * sd * 1.6 + dx * (t - 0.5) * 0.8, oy = py * sd * 1.6 + dy * (t - 0.5) * 0.8;
        k.M([[x, y], [x + ox, y + oy]], k.TEX * 0.55);
      }));
    });
  };

  /* 3 · Chinese money plant — a single stem with leaf scars, long petioles,
     round coin leaves pinned at the CENTRE (peltate): the dot is the landmark */
  P.pilea = (k) => {
    const top = potTaper(k, 0, 0, 12, 9, 25, "cTerra");
    soil(k, 0, 0, 12, top);
    const V = k.V, crown = top - 22;
    ribbon(k, [[0, top, 0], [0.6, top - 11, 0], [0.2, crown, 0]], 2.2, 1.6, "cLeafD", 7);
    for (let y = top - 3; y > crown + 2; y -= 3.2) k.M([V.p(-1, y, 0), V.p(1, y - 0.4, 0)], k.TEX * 0.6);
    const r = rnd(13);
    /* deferred occlusion: each coin's line work is queued and cut by every coin
       authored after it (nearer), so back coins show as crescents, not rings */
    const discs = [], queue = [];
    const Q = (pts, w, o, i) => queue.push({ pts, w, o, i });
    const coins = [[-78, 22, 6.4], [-52, 26, 7], [-28, 24, 6.2], [-8, 21, 6.8], [14, 25, 7.2], [36, 23, 6.6], [58, 26, 6.8], [80, 20, 6],
                   [-40, 14, 5], [-14, 12, 4.6], [20, 13, 5], [46, 15, 5.2], [2, 8, 4]];
    coins.forEach(([ang, len, rr], i) => {
      const by = crown + 4 + (i % 4) * 2.2, a = ang * RAD;
      const tip = [Math.sin(a) * len, by - Math.cos(a) * len * 0.8, (i % 3) - 1];
      { const a3 = [0, by, 0], m3 = [(tip[0]) / 2 + (r() - 0.5) * 4, (by + tip[1]) / 2, tip[2] / 2];
        Q([V.p(...a3), V.p(...m3), V.p(...tip)], k.TEX * 0.9, { curve: true, taper: [1.25, 0.75] }, i - 0.5); }
      const c = V.p(...tip), s = V.s(tip[2]), sq = 0.62 + r() * 0.36, rot = (r() - 0.5) * 0.9;
      const disc = Array.from({ length: 21 }, (_, j) => {
        const t = (j / 20) * Math.PI * 2, x = Math.cos(t) * rr * s, y = Math.sin(t) * rr * s * sq;
        return [c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot)];
      });
      k.R(disc, i % 3 ? COL.coin : "cLeaf", 21 + i, null, true);
      discs.push({ i, disc });
      Q(disc.concat([disc[0]]), k.DET, { curve: true }, i);
      for (let v = 0; v < 5; v++) { const t = (v / 5) * Math.PI * 2 + rot; Q([[c[0] + Math.cos(t) * rr * s * 0.2, c[1] + Math.sin(t) * rr * s * sq * 0.2], [c[0] + Math.cos(t) * rr * s * 0.75, c[1] + Math.sin(t) * rr * s * sq * 0.75]], k.TEX * 0.5, {}, i); }
      Q(Array.from({ length: 9 }, (_, j) => { const t = (j / 8) * Math.PI * 2; return [c[0] + Math.cos(t) * 0.7, c[1] + Math.sin(t) * 0.6]; }), k.TEX * 1.4, { curve: true }, i);
    });
    queue.forEach(({ pts, w, o, i }) => {
      const nearer = discs.filter((d) => d.i > i).map((d) => d.disc);
      k.cut(pts, nearer).forEach((run) => run.length > 1 && k.M(run, w, o));
    });
    /* a pup at the base — Pilea's habit, and a reason to look twice */
    stalk(k, [6, top, -1], [9, top - 6, -1], 1, k.TEX);
    const pc = V.p(9, top - 6, -1);
    k.R(Array.from({ length: 13 }, (_, j) => { const t = (j / 12) * Math.PI * 2; return [pc[0] + Math.cos(t) * 2.4, pc[1] + Math.sin(t) * 1.8]; }), COL.coin, 99, null, true);
    k.M(Array.from({ length: 13 }, (_, j) => { const t = (j / 12) * Math.PI * 2; return [pc[0] + Math.cos(t) * 2.4, pc[1] + Math.sin(t) * 1.8]; }), k.DET, { closed: true, curve: true });
  };

  /* 4 · Money tree — three trunks braided, cut where one passes in front of
     another, then palmate clusters (5–7 leaflets) splayed above */
  P.money = (k) => {
    const top = potCyl(k, 0, 0, 12, 27, "cPot", -14);
    soil(k, 0, 0, 12, top);
    const V = k.V, H = 34, N = 20, strands = [0, 1, 2].map((s) => {
      const ph = (s * 2 * Math.PI) / 3;
      return Array.from({ length: N + 1 }, (_, i) => { const t = i / N, a = ph + t * Math.PI * 3.2; return { p: [Math.sin(a) * 2.6 * (1 - t * 0.3), top - t * H, Math.cos(a) * 2.6], z: Math.cos(a) }; });
    });
    /* draw segment by segment, back to front; each segment's outline is cut by the strands already drawn nearer */
    const segs = [];
    strands.forEach((st, s) => { for (let i = 0; i < N; i++) segs.push({ s, i, z: (st[i].z + st[i + 1].z) / 2, a: st[i].p, b: st[i + 1].p }); });
    segs.sort((x, y) => y.z - x.z);
    const drawn = [];
    segs.forEach((g) => {
      const w = 2.4 * (1 - (g.i / N) * 0.3);
      const poly = ribbon(k, [g.a, g.b], w, w * 0.96, g.s === 1 ? COL.barkD : COL.bark, 3 + g.s, false);
      const near = drawn.filter((d) => d.z < g.z - 0.05).map((d) => d.poly);
      const [l0, l1] = [[poly[0], poly[1]], [poly[2], poly[3]]];
      [l0, l1].forEach((ln) => k.cut(ln, near).forEach((run) => run.length > 1 && k.M(run, k.DET * 0.9, { curve: false })));
      drawn.push({ z: g.z, poly });
    });
    /* branches and the palmate crown */
    const cy = top - H, r = rnd(21);
    const clusters = [[-15, cy - 6, -1], [0, cy - 13, 0], [15, cy - 5, 1], [-7, cy - 2, 1], [9, cy - 1, -1]];
    clusters.forEach(([x, y, z], c) => {
      stalk(k, [0, cy + 3, 0], [x, y, z], (r() - 0.5) * 3, k.DET);
      const n = 5 + (c % 3);
      for (let i = 0; i < n; i++) {
        const ang = -90 + 180 * ((i + 0.5) / n) + (x * 1.2) + (r() - 0.5) * 10;
        k.leaf(L.lance, [x, y, z], 9 + r() * 3, ang, (c + i) % 2 ? "cLeaf" : "cLeafD", 31 + c * 9 + i, 1.05);
      }
    });
  };

  /* 5 · Ponytail palm — the swollen bulb is the plant; out of its narrow top
     a fountain of hair-thin leaves rises and spills back down past the pot */
  P.ponytail = (k) => {
    const top = potTaper(k, 0, 0, 13, 10, 33, "cPot");
    soil(k, 0, 0, 13, top);
    const V = k.V, b = V.p(0, top, 0), s = V.s(0);
    /* the bulb: a traced half-profile, mirrored — wide at the soil, a waist, a short trunk */
    const half = [[0, 0], [7.2, 0.2], [9.4, 2.6], [9.0, 6.4], [6.4, 9.6], [3.4, 11.6], [2.4, 14], [2.2, 21], [1.9, 24]];
    const bulb = half.map(([x, y]) => [b[0] + x * s, b[1] - y * s]).concat(half.slice().reverse().map(([x, y]) => [b[0] - x * s, b[1] - y * s]));
    k.R(bulb, COL.bulb, 5, null, true);
    k.M(bulb, k.OUT, { closed: true, curve: true });
    /* bark: cracked plates on the bulb, rings up the trunk */
    const r = rnd(3);
    for (let i = 0; i < 14; i++) { const y = 1.4 + r() * 8, w = (9 - Math.abs(y - 4) * 0.7) * (r() - 0.5) * 1.6; k.M([[b[0] + w * s, b[1] - y * s], [b[0] + (w + 1.4) * s, b[1] - (y + 1.2) * s]], k.TEX * 0.6); }
    for (let y = 13; y < 24; y += 1.6) k.M([[b[0] - 2.3 * s, b[1] - y * s], [b[0] + 2.3 * s, b[1] - (y + 0.4) * s]], k.TEX * 0.5, { curve: true });
    /* the fountain: arcs up from the crown and down, some past the rim */
    const cr = [0, top - 24.5, 0];
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1, reach = 10 + r() * 16, lift = 6 + r() * 10, fall = Math.min(6 + r() * 30, k.GND - 6 - cr[1]);
      const end = [side * reach, cr[1] + fall, (r() - 0.5) * 4], ctl = [side * reach * 0.45, cr[1] - lift * 1.6, end[2] / 2];
      if (r() < 0.25) { ribbon(k, arc(cr, ctl, end, 14), 1.4, 0.3, i % 3 ? "cLeaf" : "cLeafD", 41 + i, true); }
      else k.M(arc(cr, ctl, end, 14).map((p) => V.p(...p)), k.TEX * (0.8 + r() * 0.5), { curve: true, taper: [1.3, 0.4] });
    }
  };

  const NAMES = { pitcher: "Pitcher plant", flytrap: "Venus flytrap", pilea: "Chinese money plant",
                  money: "Money tree", ponytail: "Ponytail palm" };
  const out = {};
  for (const key of Object.keys(P)) {
    out[key] = Spec.wrap("plant", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.64;              /* plants2's hierarchy */
      if (key !== "pitcher") k.shadow(0, 0, 15, 5);         /* a hanging basket casts none here */
      P[key](k);
      return k.done();
    });
  }
  out._keys = Object.keys(P);
  out._names = NAMES;
  return out;
})();
