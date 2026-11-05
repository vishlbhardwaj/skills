/*
 * FIVE KITCHEN SUBJECTS — picked so no two share a CONSTRUCTION, the way
 * src/daily.js picks its five:
 *
 *   mixer    cantilever massing   a column + a head that reaches out over a bowl
 *   knife    flat-on-a-plane      a silhouette lying on a slab, seen from above
 *   skillet  disc at pitch        a short cylinder read as a circle + a bar
 *   moka     faceted frontal      an octagonal double cone, camera square-on
 *   whisk    pure wire            no solid body at all; tubes and one handle
 *
 * Class `object` on the retro toolkit. Ground y = 0, up is negative, x right,
 * z into the picture. The camera is per subject (CAM): the moka pot is the one
 * at yaw 0 — a frontal octagon has no visible top ellipse, and turning it would
 * only hide the facets that name it.
 *
 * LINE FIRST. Every value is carried twice. Dark materials (cast iron, the moka
 * handle) are hatched, not just filled; a round body's turn is a hatched
 * crescent; each subject's cast shadow is hatch with no outline. Hatching is
 * QUEUED (t.line), never a k.T tone, so later fills cut it.
 */
window.Kitchen = (function () {
  const { kit, rr, ell, circ, rect } = Retro._kit;
  const RAD = Math.PI / 180;
  const K = {
    cream: "#F2EDE3", creamD: "#DCD4C6", steel: "#C8CDD3", steelD: "#9BA3AB",
    iron: "#3B3C41", ironD: "#2A2B2F", wood: "#D4A96A", woodD: "#A8773F",
    alu: "#CFD4D8", aluD: "#A5ABB0", black: "#1E1E22", red: "#B8403A",
    bake: "#8E6A46", shadow: "#D8D4CC",
    tin: "#B9BDC3", tinD: "#8D9299", stone: "#CAC3B5", stoneD: "#A39B8B",
    glass: "#E6EEF3", glassD: "#B9C9D5", water: "#CDE1ED",
    mitt: "#C25640", mittD: "#97402E", copper: "#C98A52", copperD: "#9C6637",
    rug: "#C3B49C", rugD: "#8B6F56", cush: "#7E93A8", cushD: "#5F7286", throw: "#CBBBA2", throwD: "#A08E77",
    brass: "#C7A33F", brassD: "#95772A", gtr: "#D9A566", gtrD: "#A87B41", brick: "#A8705A", brickD: "#7E503E",
    fire: "#E8A33D", wick: "#C8A271", wickD: "#9A7847", fanb: "#6E8CA0", bookA: "#9C5A4C", bookB: "#4F6B7E", bookC: "#C8A44E",
  };
  const D = {};

  /* ── Hatch: scanline strokes clipped to a polygon, QUEUED as lines (LINE FIRST
        §3) so every fill authored after them cuts them cleanly. Plane-local. ── */
  function hatch(t, pl, poly, o) {
    o = o || {};
    const A = (o.ang == null ? 48 : o.ang), gap = o.gap || 1.8;
    const w = o.w == null ? t.k.TEX * 0.6 : o.w, inset = o.inset == null ? 0.3 : o.inset;
    const c = Math.cos(A * RAD), s = Math.sin(A * RAD);
    const R = poly.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
    let v0 = Infinity, v1 = -Infinity;
    R.forEach(([, v]) => { v0 = Math.min(v0, v); v1 = Math.max(v1, v); });
    const back = (u, v) => [u * c - v * s, u * s + v * c];
    for (let v = v0 + gap * 0.5; v < v1; v += gap) {
      const xs = [];
      for (let i = 0, j = R.length - 1; i < R.length; j = i++) {
        const [ui, vi] = R[i], [uj, vj] = R[j];
        if ((vi > v) !== (vj > v)) xs.push(ui + ((v - vi) / (vj - vi)) * (uj - ui));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = xs[i] + inset, b = xs[i + 1] - inset;
        if (b - a > 0.5) t.line(pl, [back(a, v), back(b, v)], w);
      }
    }
    if (o.cross) hatch(t, pl, poly, { ...o, ang: A + 84, cross: false });
  }

  /* the ground shadow: hatch with NO outline, on the floor plane, before the
     object, so the object's own fills cut it */
  const floorShade = (t, poly, o) =>
    hatch(t, t.TOP(-0.04), poly, { gap: 1.6, ang: 24, w: t.k.TEX * 0.5, inset: 0.2, ...(o || {}) });

  /* Perforations NAME a colander, so each one is an OUTLINED mark. `t.mesh` draws its
     dots with `t.dot` (w: 0), which Line only drops entirely — the bowl came back empty
     (LINE FIRST §1: a colour change that names the thing is never a w:0 fill). */
  function holes(t, pl, poly, gap, r, fill) {
    const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
    const a = Math.min(...xs), b = Math.min(...ys), c = Math.max(...xs), d = Math.max(...ys);
    const inside = (x, y) => {
      let w = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) w = !w;
      }
      return w;
    };
    for (let y = b + gap / 2, row = 0; y < d; y += gap * 0.87, row++)
      for (let x = a + gap / 2 + (row % 2) * gap / 2; x < c; x += gap)
        if (inside(x, y) && inside(x + r * 1.6, y) && inside(x - r * 1.6, y) && inside(x, y + r * 1.6) && inside(x, y - r * 1.6))
          t.flat(pl, circ(x, y, r, 10), fill, { w: t.k.TEX });
  }

  /* The turn of a CYLINDER, carried in line. A hatch on a tangent FR plane is wrong by
     construction — the plane touches the body along one line only, so the strokes land off
     the surface and run outside the silhouette (the measuring jug's did, badly). Ribs are
     placed by ANGLE on the real circle, so they bow with the body and bunch at the edge
     for free — which is what LINE FIRST asks a round body's turn to be. */
  function ribs(t, cx, cz, r, yTop, yBot, a0, a1, n, w) {
    for (let i = 0; i < n; i++) {
      const a = (a0 + ((a1 - a0) * i) / (n - 1)) * RAD;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      t.line3([[x, yTop, z], [x, yBot, z]], w == null ? t.k.TEX * 0.6 : w);
    }
  }

  /* a tapered wire sampled smooth — a load-bearing tube needs real weight, or
     steel reads as thread (SKILL: Products) */
  const wire = (t, pts, w) => t.line3(pts, w == null ? t.k.OUT * 1.15 : w);

  /* 1 · Stand mixer — the read is the CANTILEVER: a column at the back and a head
     that reaches out over a bowl it does not touch. */
  D.mixer = (t) => {
    const k = t.k;
    floorShade(t, ell(4, 6, 30, 15, 24));
    /* the foot: a footprint in (x, z) rising 7 */
    t.tower(rr(-22, -13, 16, 13, 5), 0, 7, K.cream);
    t.flat(t.FR(-13.02), rr(-21, -6.4, 15, -1.2, 1.2), K.creamD, { w: k.TEX });
    /* the column, at the back-left */
    t.tower(rr(-22, -10, -9, 10, 2.5), -7, 29, K.cream);
    /* the head: reaches from the column out to +x, over the bowl */
    t.box(-22, -42, -9, 19, -29, 9, K.cream, { r: 3.2 });
    const hf = t.FR(-9.02);
    t.flat(hf, rr(-20, -39.4, 17, -36.2, 1.2), K.steel, { w: k.TEX });
    hatch(t, t.FR(-9.03), rr(-20, -39.4, 17, -36.2, 1.2), { gap: 1.4, ang: 60, w: k.TEX * 0.5 });
    /* speed lever on the column's near face */
    t.flat(t.FR(-10.02), rr(-19, -24, -12, -22.4, 0.7), K.black, { w: k.TEX });
    t.flat(t.FR(-10.4), circ(-15.5, -19, 1.5, 12), K.steelD, { w: k.TEX });
    /* the beater, hanging from the head into the bowl */
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      wire(t, Array.from({ length: 9 }, (_, j) => {
        const s = j / 8, r = 5.2 * Math.sin(Math.PI * s * 0.92);
        return [6 + Math.cos(a) * r, -29 + 13 * s, Math.sin(a) * r];
      }), k.DET);
    }
    t.tower(circ(6, 0, 1.5, 12), -29, 2.4, K.steelD);
    /* the bowl, last, so its rim is clean and it covers the beater's foot */
    const BR = 12;
    t.tower(circ(6, 0, BR, 30), -7, 11.5, K.steel);
    t.flat(t.TOP(-18.52), circ(6, 0, BR - 0.8, 28), K.steelD, { w: k.DET });
    /* the turn of the bowl, carried in line as well as in the fill */
    hatch(t, t.FR(-6.02), [[14, -17.6], [18.4, -16.8], [18.4, -8.4], [14, -7.6]], { gap: 1.5, ang: 72, w: k.TEX * 0.55 });
    t.line3([[6 - BR, -18.1, 0], [6 - BR - 3.4, -15.2, 0], [6 - BR, -11.6, 0]], k.OUT);
  };

  /* 2 · Chef's knife on a board — the only subject with no mass: a silhouette
     lying FLAT on a slab, read from above. */
  D.knife = (t) => {
    const k = t.k;
    floorShade(t, rr(-34, -20, 36, 22, 2), { gap: 1.9 });
    t.box(-36, -3.4, -22, 36, 0, 22, K.wood, { r: 2.5 });
    const top = t.TOP(-3.42);
    [[-13.5, -30, 28], [4.5, -33, 24], [14.5, -26, 31]].forEach(([z, a, b]) =>
      t.line(top, [[a, z], [(a + b) / 2, z + 0.5], [b, z]], k.TEX * 0.5, { curve: true }));
    t.flat(top, circ(31, 0, 2.4, 14), K.woodD, { w: k.TEX });
    /* the knife's own shadow on the board, offset, hatched, no outline */
    const BL = [[-30, -2.2], [-8, -8], [6, -8.4], [10, -8.2], [10, -2.4], [0, 0.8], [-16, 1.4], [-30, -2.2]];
    hatch(t, t.TOP(-3.44), BL.map(([x, z]) => [x + 1.6, z + 1.8]), { gap: 1.3, ang: 18, w: k.TEX * 0.5, inset: 0.1 });
    /* blade · bolster · handle, all flats on the board's top */
    t.flat(top, BL, K.alu, { w: k.OUT });
    /* the bevel: a band along the edge, hatched — the one place steel reads dark */
    const BEV = [[-30, -2.2], [-16, 0.6], [0, 0.0], [10, -2.4], [10, -3.8], [-1, -1.6], [-17, -1.0], [-30, -3.0]];
    t.flat(top, BEV, K.aluD, { w: 0 });
    hatch(t, t.TOP(-3.43), BEV, { gap: 1.2, ang: 8, w: k.TEX * 0.5, inset: 0.15 });
    t.flat(top, rr(10, -8.4, 14.4, -2.2, 0.7), K.steelD, { w: k.DET });
    t.flat(top, rr(14.4, -8, 31.5, -2.6, 1.8), K.black, { w: k.OUT });
    hatch(t, t.TOP(-3.43), rr(14.4, -8, 31.5, -2.6, 1.8), { gap: 1.15, ang: 46, cross: true, w: k.TEX * 0.5 });
    [18.5, 23.5, 28.5].forEach((x) => t.flat(top, circ(x, -5.3, 1.1, 12), K.steelD, { w: k.TEX }));
    /* the spine, drawn over the blade so the blade is not one empty outline */
    t.line(top, [[-30, -2.2], [-8, -8], [10, -8.2]], k.DET);
  };

  /* 3 · Cast-iron skillet — a disc read at pitch. The darkest subject in the
     set, so it is the one that gets cross-hatch. */
  D.skillet = (t) => {
    const k = t.k;
    const R = 19;
    floorShade(t, ell(3, 3, 21, 9, 24), { gap: 1.8 });
    /* the handle, authored BEFORE the pan so the pan covers the joint */
    t.prism([[-R + 2, -5.6, -3.2], [-R + 2, -5.6, 3.2], [-43, -6, 2.2], [-43, -6, -2.2]], [0, -2.6, 0], K.iron);
    t.flat(t.TOP(-8.22), [[-R + 2, -3.2], [-R + 2, 3.2], [-43, 2.2], [-43, -2.2]], K.ironD, { w: 0 });
    hatch(t, t.TOP(-8.23), [[-R + 2, -3.2], [-R + 2, 3.2], [-43, 2.2], [-43, -2.2]], { gap: 1.3, ang: 70, w: k.TEX * 0.55 });
    t.flat(t.TOP(-8.24), circ(-39, 0, 1.7, 12), K.shadow, { w: k.TEX });
    /* the pan: a short cylinder standing on the ground */
    t.tower(circ(0, 0, R, 34), 0, 8, K.iron);
    /* the cooking surface, and its concentric turning rings */
    t.flat(t.TOP(-8.02), circ(0, 0, R - 2.4, 32), K.ironD, { w: k.DET });
    hatch(t, t.TOP(-8.03), circ(0, 0, R - 3.2, 32), { gap: 1.25, ang: 34, cross: true, w: k.TEX * 0.5 });
    for (let i = 1; i <= 3; i++) t.line(t.TOP(-8.04), circ(0, 0, (R - 3.6) * (i / 3.6), 30), k.TEX * 0.7, { closed: true, curve: true });
    /* the heat ring on the base, seen through the rim's near wall */
    t.line(t.TOP(-8.05), circ(0, 0, R - 5.6, 28), k.TEX * 0.8, { closed: true, curve: true });
  };

  /* 4 · Moka pot — a faceted double cone, camera SQUARE ON (yaw 0): a frontal
     octagon shows no top ellipse, and a turn would hide the facets. */
  D.moka = (t) => {
    const k = t.k;
    const fr = t.FR(0);
    floorShade(t, ell(0, 0, 17, 5, 22));
    const w0 = 13, w1 = 8.6, y0 = 0, y1 = -18;               /* lower cone */
    const w2 = 8.6, w3 = 12.4, y2 = -21.5, y3 = -35;         /* upper cone */
    const lower = [[-w0, y0], [w0, y0], [w1, y1], [-w1, y1]];
    const upper = [[-w2, y2], [w2, y2], [w3, y3], [-w3, y3]];
    /* handle, behind the body, authored first. Both ends sit on the LIVE half-width
       of the cone, or it floats off the body (it did, on the first render). */
    const hw = (y) => w0 + (w1 - w0) * (y / y1);
    const H = [[hw(-13) - 0.6, -13], [hw(-13) + 11, -16.6], [hw(-13) + 13.4, -23.4], [hw(-17) + 8.4, -26.6],
               [hw(-17) + 6.6, -24.2], [hw(-17) + 10, -22.2], [hw(-17) + 8.4, -18.4], [hw(-17) - 0.6, -17]];
    t.flat(fr, H, K.black, { w: k.OUT });
    hatch(t, t.FR(-0.02), H, { gap: 1.1, ang: 52, cross: true, w: k.TEX * 0.5 });
    /* the spout */
    const uw = (y) => w2 + (w3 - w2) * ((y - y2) / (y3 - y2));
    /* a beak, not a tab: it rises out of the body and tips UP, and its inner edge is
       buried in the cone so the body's own outline becomes its root */
    t.flat(fr, [[-uw(-27.5) + 1.4, -27.5], [-uw(-32.5) - 4.4, -34.6], [-uw(-33.4) - 1.2, -33.4], [-uw(-32) + 1.4, -32]], K.alu, { w: k.DET });
    t.flat(fr, lower, K.alu, { w: k.OUT });
    t.flat(fr, upper, K.alu, { w: k.OUT });
    /* the collar between them */
    t.flat(fr, [[-w1 - 1.1, y1], [w1 + 1.1, y1], [w2 + 1.1, y2], [-w2 - 1.1, y2]], K.aluD, { w: k.DET });
    hatch(t, t.FR(-0.03), [[-w1 - 1.1, y1], [w1 + 1.1, y1], [w2 + 1.1, y2], [-w2 - 1.1, y2]], { gap: 1.3, ang: 40, w: k.TEX * 0.5 });
    /* the FACETS — what names the octagon. Each edge is a line from base to
       waist at the same FRACTION of the live half-width, so it tapers with the
       cone instead of running straight. */
    const facet = (f, a, b, wa, wb) => t.line(fr, [[wa * f, a], [wb * f, b]], k.DET * 0.9);
    [-0.78, -0.38, 0.38, 0.78].forEach((f) => { facet(f, y0, y1, w0, w1); facet(f, y2, y3, w2, w3); });
    /* the right side is the turn: shade the outermost facet of each cone */
    const rl = [[w0 * 0.78, y0], [w0, y0], [w1, y1], [w1 * 0.78, y1]];
    const ru = [[w2 * 0.78, y2], [w2, y2], [w3, y3], [w3 * 0.78, y3]];
    t.flat(fr, rl, K.aluD, { w: 0 }); t.flat(fr, ru, K.aluD, { w: 0 });
    hatch(t, t.FR(-0.04), rl, { gap: 1.45, ang: 84, w: k.TEX * 0.55 });
    hatch(t, t.FR(-0.04), ru, { gap: 1.45, ang: 84, w: k.TEX * 0.55 });
    /* lid: a shallow faceted dome, and the knob */
    const dome = [[-w3, y3], [w3, y3], [w3 - 6.2, y3 - 4.4], [-w3 + 6.2, y3 - 4.4]];
    t.flat(fr, dome, K.alu, { w: k.OUT });
    /* the knob sits ON the dome — authored as one shape with its stem, or the three
       pieces float apart (they did, on the second render) */
    t.flat(fr, [[-1.9, y3 - 4.2], [1.9, y3 - 4.2], [2.6, y3 - 6.4], [4.1, y3 - 7.2], [4.1, y3 - 9.2],
                [2.4, y3 - 10.4], [-2.4, y3 - 10.4], [-4.1, y3 - 9.2], [-4.1, y3 - 7.2], [-2.6, y3 - 6.4]],
           K.black, { w: k.OUT });
    hatch(t, t.FR(-0.05), [[-4.1, y3 - 6.6], [4.1, y3 - 6.6], [4.1, y3 - 9.4], [-4.1, y3 - 9.4]], { gap: 1.15, ang: 54, cross: true, w: k.TEX * 0.5 });
    /* the safety valve on the lower cone */
    t.flat(fr, circ(-w0 * 0.55, -7.4, 1.5, 14), K.aluD, { w: k.DET });
  };

  /* 5 · Balloon whisk — PURE WIRE. No body at all below the ferrule, so this is
     the subject that proves the set reads in line: with colour off it loses
     almost nothing. */
  D.whisk = (t) => {
    const k = t.k;
    floorShade(t, ell(0, 1, 13, 5, 20), { gap: 1.9 });
    /* the handle: a cylinder, its turn hatched on the shadow side */
    t.tower(circ(0, 0, 3.4, 18), -17, 19, K.steel);
    t.flat(t.TOP(-36.02), circ(0, 0, 3.4, 18), K.steelD, { w: k.DET });
    hatch(t, t.FR(-3.42), [[1.1, -35], [3.5, -34.6], [3.5, -17.6], [1.1, -17.2]], { gap: 1.45, ang: 80, w: k.TEX * 0.55 });
    /* the hanging loop */
    wire(t, Array.from({ length: 13 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return [Math.cos(a) * 2.4, -39.4 + Math.sin(a) * 2.4, 0];
    }), k.DET * 1.2);
    t.tower(circ(0, 0, 3.9, 18), -16.4, 3.4, K.steelD);
    /* the balloon: four wires, each running ferrule → tip → ferrule through two
       opposite azimuths, so one wire is one unbroken line */
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      const arm = (az, down) => Array.from({ length: 11 }, (_, j) => {
        const s = down ? j / 10 : 1 - j / 10;
        const r = 13.6 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.74)), 0.62);
        return [Math.cos(az) * r, -16.4 + 16.4 * s, Math.sin(az) * r];
      });
      wire(t, arm(a + Math.PI, false).concat(arm(a, true).slice(1)));
    }
  };

  /* ── 6–15 ───────────────────────────────────────────────────────────────── */

  /* 6 · Stovetop kettle — a smooth TURNED DOME: a convex profile sampled and
     extruded, so the silhouette is the hull (the scooter pattern). */
  D.kettle = (t) => {
    const k = t.k;
    floorShade(t, ell(2, 3, 19, 8, 22));
    const half = [[16.2, 0], [16.6, -5.4], [15.6, -11.2], [13.0, -16.2], [9.2, -19.8], [4.8, -21.6], [0, -22.2]];
    const dome = half.concat(half.slice(0, -1).reverse().map(([x, y]) => [-x, y]));
    t.prism(dome.map(([x, y]) => [x, y, -13]), [0, 0, 26], K.copper);
    /* the spout: both ends buried in the shoulder, or it floats off (it did) */
    t.prism([[-13.2, -9.2, -3], [-14.4, -15.8, -3], [-26.2, -21.4, -3], [-23.6, -15.2, -3]], [0, 0, 6], K.copper);
    /* the lid, and its knob */
    t.tower(circ(1, 0, 6.6, 20), -21.4, 2.2, K.copperD);
    t.ball([1, -25.4, 0], 2.4, K.black);
    /* the handle: an arc over the top. A load-bearing tube needs real weight. */
    wire(t, Array.from({ length: 15 }, (_, i) => {
      const a = Math.PI * (i / 14);
      return [1 - 13.2 * Math.cos(a), -20.8 - 12.4 * Math.sin(a), 0];
    }), k.OUT * 2.1);
    /* the turn, carried in line */
    hatch(t, t.FR(-13.02), [[8.2, -19.2], [15.4, -11.2], [16.4, -1], [8.2, -1]], { gap: 1.5, ang: 74, w: k.TEX * 0.55 });
    t.line(t.FR(-13.03), [[-9, -19.6], [-1, -21.2]], k.TEX * 0.8, { curve: true });
  };

  /* 7 · Colander — the only subject built from PERFORATIONS (t.mesh). */
  D.colander = (t) => {
    const k = t.k;
    const R = 17;
    floorShade(t, ell(0, 2, 20, 8, 22));
    t.tower(circ(0, 0, R * 0.52, 20), 0, 4, K.aluD);
    t.tower(circ(0, 0, R, 30), -4, 12, K.alu);
    /* the bowl floor, its holes, and the ring they are set in */
    t.flat(t.TOP(-16.02), circ(0, 0, R - 1.6, 30), K.aluD, { w: k.DET });
    holes(t, t.TOP(-16.04), circ(0, 0, R - 4.2, 28), 4.6, 1.5, K.ironD);
    t.line(t.TOP(-16.05), circ(0, 0, R - 4.0, 28), k.TEX * 0.8, { closed: true, curve: true });
    /* holes on the near wall: a band of them, drawn on the tangent plane */
    const band = [[-12, -13.4], [12, -13.4], [12, -6.4], [-12, -6.4]];
    holes(t, t.FR(-R + 0.04), band, 5.4, 1.35, K.ironD);
    /* two lug handles on the rim */
    [-1, 1].forEach((s) => t.flat(t.TOP(-16.02), [[s * (R - 1), -3.4], [s * (R + 7), -2.4], [s * (R + 7), 2.4], [s * (R - 1), 3.4]], K.alu, { w: k.DET }));
    ribs(t, 0, 0, R - 0.08, -15.6, -4.2, 352, 382, 5, k.TEX * 0.6);
  };

  /* 8 · Mortar and pestle — a TWO-OBJECT composition: a heavy walled bowl with a
     rod lying across it. The wall thickness is the whole read. */
  D.mortar = (t) => {
    const k = t.k;
    floorShade(t, ell(2, 3, 19, 8, 22));
    t.tower(circ(0, 0, 9.4, 22), 0, 3.4, K.stoneD);
    t.tower(circ(0, 0, 14.6, 28), -3.4, 13.4, K.stone);
    /* the bore: a second ellipse well inside the rim — that gap IS the thickness */
    t.flat(t.TOP(-16.82), circ(0, 0, 10.4, 26), K.stoneD, { w: k.DET });
    hatch(t, t.TOP(-16.84), circ(0, 0, 9.6, 26), { gap: 1.35, ang: 36, w: k.TEX * 0.55 });
    t.line(t.TOP(-16.83), circ(0, 0, 14.0, 28), k.TEX * 0.8, { closed: true, curve: true });
    /* the pestle, lying across the rim: a circle extruded along a slanted vector */
    t.prism(circ(0, 0, 2.5, 16).map(([a, b]) => [-13 + a, -19.4 + b, -9]), [20, -5.6, 17], K.stone);
    t.ball([8.4, -25.6, 9.4], 3.6, K.stone);
    ribs(t, 0, 0, 14.52, -16.6, -3.4, 352, 382, 5, k.TEX * 0.6);
  };

  /* 9 · Rolling pin — a cylinder along X, the one subject lying on its side. */
  D.pin = (t) => {
    const k = t.k;
    floorShade(t, rr(-36, -7, 36, 7, 3), { gap: 1.9 });
    const tube = (x0, len, r, fill) =>
      t.prism(Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2;
        return [x0, -r + Math.cos(a) * r, Math.sin(a) * r];
      }), [len, 0, 0], fill);
    tube(-33, 11, 3.4, K.woodD);
    tube(22, 11, 3.4, K.woodD);
    tube(-22, 44, 7.4, K.wood);
    /* the grain, and the two turned collars that name it as a rolling pin */
    for (let i = -1; i <= 1; i++) t.line(t.FR(-7.42), [[-20, -7.4 + i * 3.2], [20, -7.4 + i * 3.2]], k.TEX * 0.55, { curve: true });
    [-22, 22].forEach((x) => t.line3(Array.from({ length: 16 }, (_, i) => {
      const a = (i / 15) * Math.PI - Math.PI / 2;
      return [x, -7.4 + Math.cos(a) * 7.4, -Math.sin(a) * 7.4];
    }), k.DET));
    hatch(t, t.FR(-7.43), [[-20, -3.4], [20, -3.4], [20, -0.4], [-20, -0.4]], { gap: 1.5, ang: 12, w: k.TEX * 0.5 });
  };

  /* 10 · Box grater — a TAPERED OPEN SHELL whose faces are punched. Three goes at
     tongs read as an easel every time: two arms splaying to two feet is a trestle,
     whatever the feet are shaped like. The grater keeps the slot a hinged pair would
     have filled and reads at a glance. */
  D.grater = (t) => {
    const k = t.k;
    floorShade(t, rr(-13, -10, 13, 10, 2), { gap: 1.9 });
    const FACE = [[-11.4, 0], [11.4, 0], [8.4, -34], [-8.4, -34]];
    t.prism(FACE.map(([x, y]) => [x, y, -9]), [0, 0, 18], K.tin);
    /* the punched face: each hole is an OUTLINED mark with the raised lip above it,
       so the teeth survive Line only */
    const fr = t.FR(-9.04);
    const inner = [[-9.2, -3.4], [9.2, -3.4], [7.0, -30], [-7.0, -30]];
    holes(t, fr, inner, 3.9, 1.0, K.tinD);
    for (let r = 0; r < 7; r++) for (let c = -3; c <= 3; c++) {
      const y = -5.6 - r * 3.6, hw = 8.8 + (y / 34) * 2.6;
      const x = c * 2.9 + (r % 2) * 1.45;
      if (Math.abs(x) < hw - 2.2) t.line(fr, [[x - 1.0, y - 1.3], [x, y - 2.3], [x + 1.0, y - 1.3]], k.TEX * 0.8);
    }
    /* the slicing face: long slots on the flank */
    const rt = t.RT(8.6);
    [-8, -16, -24].forEach((y) => t.flat(rt, rr(-5.4, y - 1.1, 5.4, y + 1.1, 1.0), K.tinD, { w: k.TEX }));
    /* the handle: a strap arch over the open top */
    t.flat(t.TOP(-34.02), rr(-8.2, -8.8, 8.2, 8.8, 1.5), K.tinD, { w: k.DET });
    wire(t, Array.from({ length: 13 }, (_, i) => {
      const a2 = Math.PI * (i / 12);
      return [-5.6 * Math.cos(a2), -34.6 - 7.4 * Math.sin(a2), 0];
    }), k.OUT * 2.4);
    hatch(t, t.FR(-9.03), [[5.0, -28], [8.0, -28], [10.6, -1], [7.0, -1]], { gap: 1.5, ang: 72, w: k.TEX * 0.5 });
  };

  /* 11 · Muffin tray — a GRID OF RECESSES in a slab. */
  D.tray = (t) => {
    const k = t.k;
    floorShade(t, rr(-28, -19, 28, 19, 2), { gap: 1.9 });
    t.box(-28, -5.4, -19, 28, 0, 19, K.tin, { r: 2.5 });
    const top = t.TOP(-5.42);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const cx = -16 + c * 16, cz = -8 + r * 16;
      t.flat(top, circ(cx, cz, 6.6, 20), K.tinD, { w: k.DET });
      t.flat(t.TOP(-3.9), circ(cx, cz, 4.6, 18), K.tinD, { w: k.TEX, sh: 0.82 });
      hatch(t, t.TOP(-3.92), circ(cx, cz, 4.2, 18), { gap: 1.5, ang: 40, w: k.TEX * 0.45 });
    }
    /* the rolled lip */
    t.line(top, rr(-26.4, -17.4, 26.4, 17.4, 2.2), k.TEX * 0.9, { closed: true, curve: true });
  };

  /* 12 · Cooling rack — a flat LATTICE on feet: crossing wires, nothing solid. */
  D.rack = (t) => {
    const k = t.k;
    floorShade(t, rr(-26, -17, 26, 17, 2), { gap: 2.0 });
    [[-22, -13], [22, -13], [-22, 13], [22, 13]].forEach(([x, z]) =>
      t.prism(circ(x, z, 1.5, 12).map(([a, b]) => [a, -5, b]), [0, 5, 0], K.tinD));
    const Y = -5.4;
    for (let z = -13; z <= 13; z += 4.3) t.line3([[-25, Y, z], [25, Y, z]], k.OUT * 1.15);
    for (let x = -22; x <= 22; x += 7.3) t.line3([[x, Y - 0.5, -15], [x, Y - 0.5, 15]], k.OUT * 1.15);
    /* the border wire, heavier: it is what holds the lattice together */
    t.line3(rr(-25, -15, 25, 15, 3).map(([x, z]) => [x, Y - 0.9, z]).concat([[-25, Y - 0.9, -12]]), k.OUT * 1.5);
  };

  /* 13 · Measuring jug — a cylinder whose GRADUATIONS are the landmark, with a
     level of liquid in it so the marks have something to measure. */
  D.jug = (t) => {
    const k = t.k;
    const R = 11.6;
    floorShade(t, ell(1, 2, 15, 6, 20));
    t.tower(circ(0, 0, R, 26), 0, 25, K.glass);
    /* the liquid: its own short cylinder, so its silhouette is the barrel's and its
       surface ellipse comes free as the cap */
    t.tower(circ(0, 0, R - 0.5, 26), -1.2, 10.6, K.water);
    /* the turn, as ribs on the real circle */
    ribs(t, 0, 0, R - 0.08, -24.2, -0.8, 352, 384, 6, k.TEX * 0.6);
    /* the graduations: short arcs ON the surface, not marks on a tangent plane */
    for (let i = 0; i < 6; i++) {
      const y = -4.2 - i * 3.3, lg = i % 2 === 0;
      const spread = lg ? 26 : 15;
      t.line3(Array.from({ length: 5 }, (_, j) => {
        const a = (288 + (spread * j) / 4) * RAD;
        return [Math.cos(a) * (R - 0.06), y, Math.sin(a) * (R - 0.06)];
      }), lg ? k.DET * 1.1 : k.TEX * 1.0);
    }
    t.flat(t.TOP(-25.02), circ(0, 0, R - 0.8, 24), K.glassD, { w: k.DET });
    /* the pouring lip: a prism off the rim, so it has thickness and is not a paper tab */
    t.prism([[-R + 1.6, -25.2, -3.0], [-R + 1.6, -25.2, 3.0], [-R - 5.6, -21.8, 2.0], [-R - 5.6, -21.8, -2.0]],
            [0, 2.0, 0], K.glassD);
    wire(t, [[R - 1, -21.4, 0], [R + 7.4, -19.4, 0], [R + 8.4, -11.4, 0], [R - 1, -8.4, 0]], k.OUT * 2.6);
  };

  /* 14 · Oven mitt — the SOFT one. A concave silhouette cannot be a prism
     (a prism's outline is a convex hull), so it is a flat with one offset
     copy behind it for thickness — daily.js's solidFromSil, by hand. */
  D.mitt = (t) => {
    const k = t.k;
    floorShade(t, ell(0, 2, 13, 5, 20), { gap: 2.0 });
    /* soft, so the outline is SAMPLED through its control points — t.flat draws with
       curve:false, and the first pass came back a 14-sided polygon */
    const CP = [[-9.4, -2.6], [-10.8, -16], [-9.6, -26.4], [-5.6, -32.6], [0.6, -34.4],
                [6.4, -31.6], [8.6, -25.0], [13.8, -22.6], [16.4, -18.0], [13.4, -14.2],
                [9.6, -14.6], [9.8, -6.0], [9.2, -2.6]];
    const SIL = [];
    for (let i = 0; i < CP.length; i++) {
      const p0 = CP[Math.max(0, i - 1)], p1 = CP[i], p2 = CP[Math.min(CP.length - 1, i + 1)], p3 = CP[Math.min(CP.length - 1, i + 2)];
      for (let j = 0; j < 6; j++) {
        const u = j / 6, u2 = u * u, u3 = u2 * u;
        SIL.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
        ]);
      }
    }
    /* the thickness. At yaw 0 / pitch 0 a z offset projects to NOTHING, so the padding is
       an offset in the PICTURE plane — daily.js's solidFromSil, by hand. */
    const fr = t.FR(0);
    /* the strap goes in FIRST, so the mitt covers its root and only the loop shows —
       drawn on top it read as a luggage tag stuck to the side */
    t.flat(fr, [[-6.0, -6.4], [-15.2, -9.0], [-16.6, -14.2], [-7.4, -11.6]], K.mittD, { w: k.DET });
    t.flat(fr, ell(-13.4, -11.2, 1.9, 2.1, 14), "#FFFFFF", { w: k.DET });
    /* the padding: a small offset in the PICTURE plane. 2.4 × 1.8 read as a shelf under
       the cuff rather than as thickness. */
    t.flat(fr, SIL.map(([x, y]) => [x + 1.3, y + 0.9]), K.mittD, { w: k.DET });
    t.flat(fr, SIL, K.mitt, { w: k.OUT });
    /* quilting, clipped well inside the edge so it never crosses the outline */
    const IN = SIL.map(([x, y]) => [x * 0.9, -2.6 + (y + 2.6) * 0.92]);
    hatch(t, t.FR(-0.02), IN, { gap: 5.0, ang: 58, w: k.TEX * 0.8, inset: 1.2 });
    hatch(t, t.FR(-0.02), IN, { gap: 5.0, ang: -58, w: k.TEX * 0.8, inset: 1.2 });
    /* the cuff */
    const CUFF = [[-8.9, -3.0], [8.7, -3.0], [9.0, -9.6], [-9.3, -9.6]];
    t.flat(t.FR(-0.03), CUFF, K.mittD, { w: k.DET });
    hatch(t, t.FR(-0.04), CUFF, { gap: 1.35, ang: 54, w: k.TEX * 0.5 });

  };

  /* 15 · Knife block — a SLANTED FACE with things inserted into it. Everything
     on the slope is authored on one t.plane, so the slots and the handles land
     in perspective for free. */
  D.block = (t) => {
    const k = t.k;
    floorShade(t, rr(-16, -12, 16, 12, 2), { gap: 1.9 });
    /* ONE wedge: a convex side profile extruded across z */
    const prof = [[-13, 0], [13, 0], [13, -16], [-13, -34]];
    t.prism(prof.map(([x, y]) => [x, y, -10]), [0, 0, 20], K.wood);
    /* the slope gets its own plane, so slots and handles land in perspective for free */
    const L = Math.hypot(26, 18);
    const slope = t.plane([-13, -34, -10], [26 / L, 18 / L, 0], [0, 0, 1]);
    t.flat(slope, [[0.4, 0.4], [L - 0.4, 0.4], [L - 0.4, 19.6], [0.4, 19.6]], K.woodD, { w: k.DET });
    for (let i = 0; i < 4; i++) {
      const u = 5.4 + i * 6.6;
      t.line(slope, [[u, 3.4], [u, 16.6]], k.DET * 1.1);
      t.raise(slope, [[u - 0.9, 4.6], [u + 0.9, 4.6], [u + 0.9, 15.4], [u - 0.9, 15.4]], 9 + (3 - i) * 2.6, K.black);
    }
    hatch(t, t.FR(-10.02), [[6.4, -15.4], [12.6, -15.4], [12.6, -1], [6.4, -1]], { gap: 1.5, ang: 72, w: k.TEX * 0.5 });
  };

  /* ── LIVING ROOM, 16–25 ─────────────────────────────────────────────────── */
  /* Same page, same toolkit, same hand. Picked against the 15 kitchen subjects AND
     against furniture/furniture2/chairs (sofa, armchair, coffee table, bookshelf,
     ottoman, TV unit, magazine rack and console are already drawn), so these are the
     living room's SMALL things and its soft ones. */

  const rot2 = (pts, deg, cx, cy) => {
    const c = Math.cos(deg * RAD), s2 = Math.sin(deg * RAD);
    return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s2, cy + (x - cx) * s2 + (y - cy) * c]);
  };

  /* 16 · Rug — the PLANE IS the subject: no mass at all, read from its border and
     its fringe. */
  D.rug = (t) => {
    const k = t.k;
    const top = t.TOP(-0.3);
    t.flat(top, rect(-34, -22, 34, 22), K.rug, { w: k.OUT });
    t.flat(t.TOP(-0.34), rect(-29.5, -18, 29.5, 18), K.rug, { w: k.DET, sh: 0.94 });
    t.line(t.TOP(-0.36), rect(-27, -15.6, 27, 15.6), k.TEX * 0.9, { closed: true });
    /* the field: a row of diamonds — what makes it a rug and not a grey mat */
    for (let c = -2; c <= 2; c++) for (let r = -1; r <= 1; r++) {
      const cx = c * 11.6, cz = r * 9.4;
      t.flat(t.TOP(-0.38), [[cx, cz - 4.2], [cx + 5.0, cz], [cx, cz + 4.2], [cx - 5.0, cz]], K.rugD, { w: k.TEX, sh: 0.96 });
      t.line(t.TOP(-0.4), [[cx, cz - 2.2], [cx + 2.6, cz], [cx, cz + 2.2], [cx - 2.6, cz]], k.TEX * 0.7, { closed: true });
    }
    /* fringe at the two short ends */
    [-1, 1].forEach((sx) => {
      for (let z = -20; z <= 20; z += 2.6)
        t.line3([[sx * 34, -0.3, z], [sx * 39.4, -0.3, z + sx * 0.8]], k.TEX * 0.9);
    });
  };

  /* 17 · Cushion — a SOFT BULGE: the corners are pulled out into ears and every edge
     swells. Nothing in the set is this shape. */
  D.cushion = (t) => {
    const k = t.k;
    floorShade(t, rr(-15, -8, 15, 8, 3), { gap: 2.0 });
    /* corners OUTSIDE the sides: the ears are what make it a cushion and not a loaf */
    const CP = [[0, -0.9], [9.0, -1.8], [15.8, -1.4], [13.0, -9.0], [13.0, -16.6], [15.8, -24.4],
                [9.0, -24.0], [0, -25.0], [-9.0, -24.0], [-15.8, -24.4], [-13.0, -16.6],
                [-13.0, -9.0], [-15.8, -1.4], [-9.0, -1.8]];
    const SIL = [];
    for (let i = 0; i < CP.length; i++) {
      const p0 = CP[(i - 1 + CP.length) % CP.length], p1 = CP[i], p2 = CP[(i + 1) % CP.length], p3 = CP[(i + 2) % CP.length];
      for (let j = 0; j < 6; j++) {
        const u = j / 6, u2 = u * u, u3 = u2 * u;
        SIL.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
                  0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    t.prism(SIL.map(([x, y]) => [x, y, -6]), [0, 0, 12], K.cush);
    const fr = t.FR(-6.02);
    t.line(fr, SIL.map(([x, y]) => [x * 0.88, -13 + (y + 13) * 0.87]), k.DET, { closed: true, curve: true });
    t.flat(t.FR(-6.04), ell(0, -13, 2.2, 1.7, 16), K.cushD, { w: k.TEX });
    hatch(t, t.FR(-6.06), [[7.6, -21], [13.6, -18], [13.6, -6], [7.6, -3.6]], { gap: 1.5, ang: 70, w: k.TEX * 0.55 });
  };

  /* 18 · Throw — a DRAPED CLOTH and nothing else: no rigid body, the folds are the
     whole drawing. */
  D.throwrug = (t) => {
    const k = t.k;
    floorShade(t, rr(-18, -8, 20, 8, 3), { gap: 2.0 });
    /* the rail it hangs on */
    t.prism(circ(0, 0, 1.8, 14).map(([a, b]) => [-19, -29 + b, a]), [38, 0, 0], K.woodD);
    /* two hanging panels, each with a wavy hem */
    const panel = (x0, x1, drop, z) => {
      const pts = [[x0, -29.4]];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push([x0 + (x1 - x0) * u, -29.4 + drop + 2.6 * Math.sin(u * Math.PI * 2.4)]);
      }
      pts.push([x1, -29.4]);
      t.prism(pts.map(([x, y]) => [x, y, z]), [0, 0, 3.0], K.throw);
      /* the folds: tapered creases down the cloth, inside the silhouette */
      const fr = t.FR(z - 0.02);
      for (let i = 1; i < 6; i++) {
        const u = i / 6, x = x0 + (x1 - x0) * u;
        t.line(fr, [[x, -28.4], [x + 0.9, -29.4 + drop * 0.52], [x - 0.4, -29.4 + drop * 0.88]], k.TEX * 0.85, { curve: true });
      }
      hatch(t, t.FR(z - 0.04), [[x1 - 5.4, -27], [x1, -26.4], [x1, -29.4 + drop * 0.86], [x1 - 5.4, -29.4 + drop * 0.82]], { gap: 1.6, ang: 76, w: k.TEX * 0.5 });
    };
    panel(-17, 17, 25, -6);
    panel(-13, 13, 17, -1.6);
    /* the fringe along the front hem */
    for (let x = -12.4; x <= 12.4; x += 2.2) t.line3([[x, -13.0, -1.6], [x + 0.5, -9.0, -1.6]], k.TEX * 0.9);
  };

  /* 19 · Sunburst clock — RADIAL SPOKES. Frontal (yaw 0): turning it would foreshorten
     the rays that are the whole point. */
  D.sunburst = (t) => {
    const k = t.k;
    const fr = t.FR(0), cy = -22;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 360 * RAD, L = 12.4 + (i % 2) * 7.6;
      const c = Math.cos(a), s2 = Math.sin(a), n = [-s2, c];
      t.flat(fr, [[c * 9 + n[0] * 0.9, cy + s2 * 9 + n[1] * 0.9], [c * (9 + L), cy + s2 * (9 + L)], [c * 9 - n[0] * 0.9, cy + s2 * 9 - n[1] * 0.9]], K.brass, { w: k.TEX });
      t.flat(fr, ell(c * (9 + L), cy + s2 * (9 + L), 1.25, 1.25, 10), K.brassD, { w: k.TEX });
    }
    t.flat(fr, ell(0, cy, 9.6, 9.6, 26), K.brassD, { w: k.OUT });
    t.flat(fr, ell(0, cy, 7.4, 7.4, 24), "#F4EFE4", { w: k.DET });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 360 * RAD;
      t.line(fr, [[Math.cos(a) * 5.4, cy + Math.sin(a) * 5.4], [Math.cos(a) * 6.6, cy + Math.sin(a) * 6.6]], i % 3 === 0 ? k.DET : k.TEX * 0.8);
    }
    t.line(fr, [[0, cy], [0.4, cy - 4.4]], k.DET * 1.3);
    t.line(fr, [[0, cy], [3.6, cy + 1.8]], k.DET * 1.1);
    t.flat(fr, ell(0, cy, 0.9, 0.9, 10), K.black, { w: 0 });
  };

  /* 20 · Candlesticks — a GROUP OF SIMILARS at three heights, which is a composition
     problem the set has not had: they must read as one object. */
  D.candles = (t) => {
    const k = t.k;
    floorShade(t, ell(0, 2, 17, 6, 20), { gap: 1.9 });
    const stick = (cx, h, r) => {
      t.tower(circ(cx, 0, r * 1.9, 18), 0, 1.6, K.brassD);
      t.tower(circ(cx, 0, r * 1.5, 16), -1.6, 1.2, K.brass);
      t.tower(circ(cx, 0, r * 0.52, 14), -2.8, h - 6, K.brass);
      t.tower(circ(cx, 0, r * 0.95, 16), -(h - 3.2), 1.3, K.brass);
      t.tower(circ(cx, 0, r * 1.25, 16), -(h - 1.6), 1.5, K.brassD);
      /* the candle and its flame */
      t.tower(circ(cx, 0, r * 0.66, 14), -(h + 0.2), 7.4, "#F0E7D4");
      t.line3([[cx, -(h + 7.6), 0], [cx, -(h + 8.6), 0]], k.TEX);
      t.flat(t.FR(-0.02), [[cx, -(h + 8.6)], [cx + 1.5, -(h + 10.6)], [cx, -(h + 13.6)], [cx - 1.5, -(h + 10.6)]], K.fire, { w: k.DET });
      ribs(t, cx, 0, r * 0.52 - 0.04, -(h - 3.4), -3.0, 352, 378, 3, k.TEX * 0.55);
    };
    stick(-10.4, 20, 3.4);
    stick(10.2, 15, 3.1);
    stick(0, 27, 3.8);
  };

  /* 21 · Guitar — a LEANING WAISTED SILHOUETTE. Frontal, then the whole thing is
     rotated as 2D points, which is the only way a lean keeps its shape. */
  D.guitar = (t) => {
    const k = t.k;
    const fr = t.FR(0);
    const CP = [[0, -1.2], [9.4, -3.4], [12.2, -11.4], [8.4, -18.2], [5.6, -24.2],
                [8.0, -30.4], [6.4, -36.2], [0, -38.2], [-6.4, -36.2], [-8.0, -30.4],
                [-5.6, -24.2], [-8.4, -18.2], [-12.2, -11.4], [-9.4, -3.4]];
    const SIL = [];
    for (let i = 0; i < CP.length; i++) {
      const p0 = CP[(i - 1 + CP.length) % CP.length], p1 = CP[i], p2 = CP[(i + 1) % CP.length], p3 = CP[(i + 2) % CP.length];
      for (let j = 0; j < 5; j++) {
        const u = j / 5, u2 = u * u, u3 = u2 * u;
        SIL.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
                  0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    const LEAN = -11, PX = 0, PY = -1.2;
    const R = (pts) => rot2(pts, LEAN, PX, PY);
    t.flat(fr, R([[-3.0, -36], [3.0, -36], [3.0, -74], [-3.0, -74]]), K.gtrD, { w: k.OUT });       /* neck */
    t.flat(fr, R([[-4.6, -74], [4.6, -74], [5.6, -83], [-5.6, -83]]), K.gtrD, { w: k.OUT });       /* headstock */
    t.flat(fr, R(SIL), K.gtr, { w: k.OUT });
    t.flat(fr, R(ell(0, -24.2, 5.0, 5.0, 22)), K.black, { w: k.DET });
    t.line(fr, R(ell(0, -24.2, 6.4, 6.4, 22)), k.TEX, { closed: true, curve: true });
    t.flat(fr, R([[-5.2, -13.4], [5.2, -13.4], [5.2, -16.0], [-5.2, -16.0]]), K.gtrD, { w: k.DET });
    for (let i = 0; i < 6; i++) {
      const x = -2.4 + i * 0.96;
      t.line(fr, R([[x, -14.0], [x * 1.5, -80]]), k.TEX * 0.6);
    }
    for (let i = 0; i < 5; i++) t.line(fr, R([[-3.0, -42 - i * 6.4], [3.0, -42 - i * 6.4]]), k.TEX * 0.8);
    [-1, 1].forEach((sx) => [0, 1, 2].forEach((i) =>
      t.flat(fr, R(ell(sx * 6.6, -76 - i * 2.6, 1.3, 0.8, 10)), K.brass, { w: k.TEX })));
    hatch(t, t.FR(-0.02), R([[6.4, -30.4], [10.4, -16], [7.4, -5.4], [4.4, -6.4]]), { gap: 1.6, ang: 64, w: k.TEX * 0.5 });
  };

  /* 22 · Stack of books — an OFFSET STACK, each slab turned a little off the one below,
     with the top one open. */
  D.books = (t) => {
    const k = t.k;
    floorShade(t, rr(-20, -14, 20, 14, 2), { gap: 1.9 });
    const cols = [K.bookA, K.bookB, K.bookC, K.bookA];
    let y = 0;
    [[16.4, 11.0, 4.6, -7], [15.2, 10.2, 3.4, 5], [16.0, 10.6, 3.9, -3], [14.2, 9.6, 3.0, 9]].forEach(([hw, hz, th, deg], i) => {
      const foot = rot2(rect(-hw, -hz, hw, hz), deg, 0, 0).map(([x, z]) => [x, z]);
      t.tower(foot, y, th, cols[i]);
      /* the pages: a thinner slab inset on three sides, so the spine stays proud */
      const pf = rot2(rect(-hw + 1.3, -hz + 1.3, hw - 0.2, hz - 1.3), deg, 0, 0);
      t.tower(pf, y - 0.45, th - 0.9, "#F2EDE1");
      y -= th;
    });
    /* the open one on top: two leaves in a shallow V */
    [-1, 1].forEach((sx) => {
      t.prism([[0, y, -9.6], [sx * 15.0, y - 3.4, -9.6], [sx * 15.0, y - 4.6, -9.6], [0, y - 1.1, -9.6]], [0, 0, 19.2], "#F6F1E6");
      const pf = t.FR(-9.62);
      for (let i = 1; i <= 4; i++) t.line(pf, [[sx * i * 2.9, y - i * 0.62], [sx * 15.0, y - 3.5 - i * 0.2]], k.TEX * 0.55);
    });
    hatch(t, t.FR(-9.64), [[9.4, -2], [16.4, -2], [16.4, 0], [9.4, 0]], { gap: 1.6, ang: 20, w: k.TEX * 0.5 });
  };

  /* 23 · Fireplace — an OPENING INTO A DARK INTERIOR. A prism cannot have a hole, so
     the surround is four masses built around a dark back panel. */
  D.fireplace = (t) => {
    const k = t.k;
    const BACK = -6;
    t.prism([[-16, 0, BACK], [16, 0, BACK], [16, -26, BACK], [-16, -26, BACK]], [0, 0, 0.1], K.black, { w: k.DET, wc: 0 });
    hatch(t, t.FR(BACK - 0.02), [[-15.4, -25.4], [15.4, -25.4], [15.4, -0.6], [-15.4, -0.6]], { gap: 1.15, ang: 48, cross: true, w: k.TEX * 0.55 });
    /* the logs and the fire, inside the opening */
    [[-5, -3.6, 9], [4, -4.4, 8], [-1, -8.2, 7]].forEach(([x, y, L]) =>
      t.prism(circ(0, 0, 2.3, 12).map(([a, b]) => [x + a, y + b, BACK + 1]), [L, 1.2, 0], K.woodD));
    [[-3, 5], [1.5, 7.4], [5, 4.6]].forEach(([x, h]) =>
      t.flat(t.FR(BACK + 1.6), [[x - 2.4, -9.4], [x, -9.4 - h], [x + 2.4, -9.4]], K.fire, { w: k.DET }));
    /* the surround: two piers, a lintel, a mantel and a hearth */
    [-1, 1].forEach((sx) => t.prism(rr(sx * 16, -5, sx * 25, 5, 1).map(([x, z]) => [x, 0, z]), [0, -31, 0], K.brick));
    t.prism(rr(-25, -5, 25, 5, 1).map(([x, z]) => [x, -31, z]), [0, -7, 0], K.brick);
    t.prism(rr(-28, -7, 28, 7, 1).map(([x, z]) => [x, -38, z]), [0, -3.2, 0], K.brickD);
    t.prism(rr(-24, -5, 24, 12, 1).map(([x, z]) => [x, 0, z]), [0, 1.8, 0], K.brickD);
    /* the courses, on the near faces only */
    const fr = t.FR(-5.02);
    for (let i = 1; i < 6; i++) { t.line(fr, [[-25, -5 * i], [-16, -5 * i]], k.TEX * 0.7); t.line(fr, [[16, -5 * i], [25, -5 * i]], k.TEX * 0.7); }
    hatch(t, fr, [[16.6, -30], [24.6, -30], [24.6, -0.6], [16.6, -0.6]], { gap: 1.6, ang: 72, w: k.TEX * 0.5 });
  };

  /* 24 · Wicker basket — a WOVEN surface: horizontal bands are NEAR-HALF ellipses on an
     opaque body (never whole ones) and the staves are ribs, both placed on the real
     circle rather than on a tangent plane. */
  D.basket = (t) => {
    const k = t.k;
    const R = 16;
    floorShade(t, ell(1, 2, 20, 8, 22), { gap: 1.9 });
    t.tower(circ(0, 0, R, 30), 0, 21, K.wick);
    t.flat(t.TOP(-21.02), circ(0, 0, R - 1.2, 28), K.wickD, { w: k.DET });
    /* the weave */
    for (let i = 1; i <= 5; i++) {
      const y = -2.6 - i * 3.3;
      t.line3(Array.from({ length: 19 }, (_, j) => {
        const a = (182 + (176 * j) / 18) * RAD;
        return [Math.cos(a) * (R - 0.06), y, Math.sin(a) * (R - 0.06)];
      }), k.TEX * 0.8);
    }
    for (let row = 0; row < 6; row++) {
      const y0 = -1.0 - row * 3.3, y1 = y0 - 3.3;
      for (let i = 0; i < 13; i++) {
        const a = (194 + (152 * i) / 12 + (row % 2) * 6.3) * RAD;
        t.line3([[Math.cos(a) * (R - 0.1), y0 - 0.5, Math.sin(a) * (R - 0.1)],
                 [Math.cos(a) * (R - 0.1), y1 + 0.5, Math.sin(a) * (R - 0.1)]], k.TEX * 0.6);
      }
    }
    /* the rolled rim, and a rolled blanket inside it */
    t.line3(Array.from({ length: 21 }, (_, j) => {
      const a = (180 + (180 * j) / 20) * RAD;
      return [Math.cos(a) * R, -20.2, Math.sin(a) * R];
    }), k.OUT * 1.2);
    t.prism(circ(0, 0, 3.9, 16).map(([a, b]) => [-6 + a, -22.6 + b, -4]), [12, 1.2, 6], K.throw);
    ribs(t, -6, -4, 3.8, -26.0, -19.4, 200, 340, 3, k.TEX * 0.6);
  };

  /* 25 · Pedestal fan — a RADIAL CAGE. The cage really is planar, so a plane is the
     right tool here (unlike a cylinder's turn). */
  D.fan = (t) => {
    const k = t.k;
    floorShade(t, ell(0, 2, 13, 5, 20), { gap: 2.0 });
    t.tower(circ(0, 0, 9.4, 22), 0, 1.8, K.tinD);
    t.tower(circ(0, 0, 2.2, 14), -1.8, 22, K.tin);
    const cy = -37, CR = 15.4, fr = t.FR(-3);
    t.tower(circ(0, 0, 3.4, 14), -23.8, 5.6, K.tinD);
    /* the blades, behind the cage */
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 360 + 18;
      t.flat(t.FR(1.2), rot2([[0.6, cy], [8.0, cy - 4.4], [9.8, cy + 0.4], [2.6, cy + 3.2]], a, 0, cy), K.fanb, { w: k.DET });
    }
    t.flat(t.FR(0.4), ell(0, cy, 3.6, 3.6, 16), K.tinD, { w: k.DET });
    /* the cage: concentric rings and radial spokes */
    [1, 0.66].forEach((f) => t.line(fr, ell(0, cy, CR * f, CR * f, 30), f === 1 ? k.OUT : k.TEX * 0.85, { closed: true, curve: true }));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 360 * RAD;
      t.line(fr, [[Math.cos(a) * 3.4, cy + Math.sin(a) * 3.4], [Math.cos(a) * CR, cy + Math.sin(a) * CR]], k.TEX * 0.55);
    }
    t.flat(t.FR(-3.4), ell(0, cy, 2.4, 2.4, 14), K.tinD, { w: k.DET });
    ribs(t, 0, 0, 2.14, -22.6, -2.2, 352, 378, 3, k.TEX * 0.55);
  };


  const CAM = {
    mixer: { yaw: 26, pitch: 12 }, knife: { yaw: 16, pitch: 38 }, skillet: { yaw: 22, pitch: 40 },
    moka: { yaw: 0, pitch: 0 }, whisk: { yaw: 20, pitch: 14 },
    kettle: { yaw: 24, pitch: 14 }, colander: { yaw: 22, pitch: 34 }, mortar: { yaw: 20, pitch: 22 },
    pin: { yaw: 18, pitch: 18 }, grater: { yaw: 24, pitch: 16 }, tray: { yaw: 16, pitch: 42 },
    rack: { yaw: 18, pitch: 40 }, jug: { yaw: 24, pitch: 12 }, mitt: { yaw: 0, pitch: 0 },
    block: { yaw: 26, pitch: 16 },
    rug: { yaw: 14, pitch: 48 }, cushion: { yaw: 22, pitch: 18 }, throwrug: { yaw: 20, pitch: 16 },
    sunburst: { yaw: 0, pitch: 0 }, candles: { yaw: 22, pitch: 12 }, guitar: { yaw: 0, pitch: 0 },
    books: { yaw: 24, pitch: 22 }, fireplace: { yaw: 18, pitch: 10 }, basket: { yaw: 20, pitch: 26 },
    fan: { yaw: 18, pitch: 12 },
  };
  const NAMES = {
    mixer: "Stand mixer", knife: "Chef's knife", skillet: "Cast-iron skillet", moka: "Moka pot", whisk: "Balloon whisk",
    kettle: "Stovetop kettle", colander: "Colander", mortar: "Mortar and pestle", pin: "Rolling pin", grater: "Box grater",
    tray: "Muffin tray", rack: "Cooling rack", jug: "Measuring jug", mitt: "Oven mitt", block: "Knife block",
    rug: "Rug", cushion: "Cushion", throwrug: "Draped throw", sunburst: "Sunburst clock", candles: "Candlesticks",
    guitar: "Guitar", books: "Stack of books", fireplace: "Fireplace", basket: "Wicker basket", fan: "Pedestal fan",
  };
  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
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
