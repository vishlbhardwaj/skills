/*
 * SCAPES — the landscape stress set, and the SCENE KIT it is built on.
 *
 * Ten scenes, each picked to break one thing scenes have failed at before:
 * terrain, water and reflection, foliage masses, rock, receding rows, smooth
 * forms with no edges, white-on-white, one near tree, falling water, objects
 * on water. Ten landscapes were rejected and switched off on 2026-10-29, so
 * this set exists to find out what still breaks, not to show off.
 *
 * Authored on the PICTURE PLANE (Retro._kit, square-on camera, x right /
 * y down) in a 160 × 100 frame, back to front, clipped. Depth is not a
 * camera here; it is a number d from 0 (nearest) to 1 (the far range), and
 * EVERYTHING that makes a drawing recede reads it:
 *   - the pen thins (a far ridge is a third of the bench's weight),
 *   - hatch opens up and lightens,
 *   - colour mixes toward the sky,
 *   - detail drops a rung (a near tree has limbs and clumps; a far one is a
 *     bump in a treeline).
 * A mountain drawn at the bench's weight is THE flat-landscape failure; the
 * kit makes that impossible to do by accident.
 *
 * LINE FIRST holds: every value is carried as a fill AND as line (hatch on
 * the shadow side, dashes on water, clumps in a crown), and the sky is paper.
 */
window.Scapes = (function () {
  const { kit } = Retro._kit;
  const { ov, rect, curve, ribbon } = StillLife._util;
  const RAD = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* seeded noise, reset per scene so a scene draws the same every time */
  let rs = 1;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
  const jit = (a) => (rnd() * 2 - 1) * a;

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], t)).toString(16).padStart(2, "0")).join("");

  /* Sutherland–Hodgman: keep the part of poly where nx·x + ny·y ≥ c */
  const half = (poly, nx, ny, c) => {
    const out = [], inside = (p) => nx * p[0] + ny * p[1] >= c;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        const da = nx * a[0] + ny * a[1] - c, db = nx * b[0] + ny * b[1] - c, t = da / (da - db);
        out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
      }
    }
    return out;
  };
  /* y of a polyline (sorted by x) at x */
  const yAt = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return lerp(y0, y1, (x - x0) / ((x1 - x0) || 1));
    }
    return pts[pts.length - 1][1];
  };
  /* midpoint displacement between control points: a broken, natural edge */
  const jag = (ctrl, rough, levels) => {
    let P = ctrl.slice();
    for (let l = 0; l < (levels || 4); l++) {
      const Q = [P[0]];
      for (let i = 1; i < P.length; i++) {
        const [x0, y0] = P[i - 1], [x1, y1] = P[i], L = Math.hypot(x1 - x0, y1 - y0);
        Q.push([(x0 + x1) / 2 + jit(L * rough * 0.25), (y0 + y1) / 2 + jit(L * rough)], P[i]);
      }
      P = Q;
    }
    return P;
  };

  /*
   * THE TERMINATOR. A shadow side bounded by a straight half-plane cut reads
   * as an object split in two. The shade is a CRESCENT: the silhouette on
   * the side away from the light, closed by an inner curve that bows the
   * same way. `m` is how far a point faces away from the light (upper left).
   */
  const crescent = (sil, cx, cy, depth, light) => {
    const L = light == null ? 225 : light, Dx = Math.cos((L + 180) * RAD), Dy = Math.sin((L + 180) * RAD);
    const outer = [], inner = [];
    let span = 0;
    for (const [x, y] of sil) span = Math.max(span, Math.hypot(x - cx, y - cy));
    for (const [x, y] of sil) {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) || 1, m = (dx * Dx + dy * Dy) / r;
      if (m < -0.05) continue;
      const f = 1 - (depth || 0.42) * Math.pow(m + 0.05, 0.7);
      outer.push([x, y]);
      inner.push([cx + dx * f + Dx * span * 0.06, cy + dy * f + Dy * span * 0.06]);
    }
    /* keep the run contiguous: rotate so it starts after the largest gap */
    return outer.concat(inner.reverse());
  };
  const runFrom = (sil, keep) => {
    const n = sil.length; let start = 0;
    for (let i = 0; i < n; i++) if (!keep(sil[i]) && keep(sil[(i + 1) % n])) { start = (i + 1) % n; break; }
    return sil.slice(start).concat(sil.slice(0, start));
  };

  /* a ground layer runs to the FRAME BOTTOM, whatever its nominal base:
     a back layer that stops short shows sky wherever a nearer one dips */
  const FOOT = (base) => Math.max(base, 104);

  /* ── the scene kit: StillLife's stage, plus depth ─────────────────────── */
  function scene(t, sky) {
    const S = StillLife._stage(t, 0.2), k = S.k;
    S.sky = sky;
    /* the pen by depth: silhouette, detail, hatch weight, hatch gap */
    S.W = (d) => k.OUT * lerp(1.15, 0.36, d);
    S.Wd = (d) => k.DET * lerp(1, 0.5, d);
    S.Wt = (d) => k.TEX * 0.62 * lerp(1, 0.5, d);
    S.G = (d, g) => g * lerp(1, 1.9, d);
    /* colour recedes into the sky */
    S.air = (c, d) => mix(c, sky, clamp(d, 0, 1) * 0.55);
    S.H = (poly, d, o) => S.hatch(poly, { w: S.Wt(d), ...(o || {}), gap: S.G(d, (o && o.gap) || 1.6) });

    /*
     * A MOUNTAIN RANGE from control points (peaks and valleys, left to
     * right). Light from the upper left, so each peak's RIGHT slope is a
     * diagonal facet down to the base — never a vertical band, which reads
     * as a pillar. Snow is the paper left above a jagged snowline, so the
     * facet hatch stops at it.
     */
    S.range = (ctrl, base, d, fill, o) => {
      o = o || {};
      const top = jag(ctrl, o.rough == null ? 0.22 : o.rough, o.levels || 4);
      const poly = top.concat([[top[top.length - 1][0], FOOT(base)], [top[0][0], FOOT(base)]]);
      S.F(poly, S.air(fill, d), { w: 0 });
      for (let i = 1; i < ctrl.length - 1; i++) {
        const [px, py] = ctrl[i];
        if (!(py < ctrl[i - 1][1] && py < ctrl[i + 1][1])) continue;
        const vx = ctrl[i + 1][0], fx = px + (vx - px) * (o.facet == null ? 0.3 : o.facet);
        const slope = top.filter(([x]) => x >= px && x <= vx);
        const face = [[px, py]].concat(slope, [[vx, base], [fx, base]]);
        S.F(face, S.air(fill, d), { w: 0, sh: 0.8 });
        S.H(face, d, { gap: o.gap || 1.5, ang: o.ang == null ? 64 : o.ang });
        if (d < 0.75) S.L(curve([[px, py], [lerp(px, fx, 0.45) + jit(1), lerp(py, base, 0.45)], [fx, base]], 4), S.Wd(d) * 0.8, { taper: [1, 0.3] });
      }
      if (o.snow != null) {
        let run = [];
        const runs = [];
        for (const p of top) { if (p[1] < o.snow) run.push(p); else { if (run.length > 1) runs.push(run); run = []; } }
        if (run.length > 1) runs.push(run);
        for (const r of runs) {
          const x0 = r[0][0], x1 = r[r.length - 1][0], n = Math.max(3, Math.round((x1 - x0) / 1.6)), low = [];
          for (let j = n; j >= 0; j--) {
            const x = lerp(x0, x1, j / n);
            const tongue = rnd() < 0.3 ? 2.4 + rnd() * 4.5 : rnd() * 1.4;
            low.push([x + jit(0.7), Math.max(yAt(top, x) + 0.6, o.snow + tongue)]);
          }
          S.F(r.concat(low), "#FFFFFF", { w: 0 });
          S.L(curve(low, 3), S.Wt(d) * 1.3, { taper: [0.2, 0.2] });
        }
      }
      S.L(top, S.W(d), { curve: false });
      return top;
    };

    /* rolling ground: a smooth crest, and 2–3 contour strokes under it */
    S.hill = (ctrl, base, d, fill, o) => {
      o = o || {};
      const top = curve(ctrl, 10);
      S.F(top.concat([[top[top.length - 1][0], FOOT(base)], [top[0][0], FOOT(base)]]), S.air(fill, d), { w: 0 });
      if (o.contours !== false) for (let i = 1; i <= (o.contours || 2); i++) {
        const a = lerp(0.12, 0.5, rnd()), b = clamp(a + 0.25 + rnd() * 0.25, 0, 0.95);
        const seg = top.filter((_, j) => j / top.length > a && j / top.length < b).map(([x, y]) => [x, y + i * (o.step || 2.2) + jit(0.4)]);
        if (seg.length > 2) S.L(seg, S.Wt(d), { taper: [0.3, 0.3] });
      }
      if (o.shade) S.H(top.concat([[top[top.length - 1][0], FOOT(base)], [top[0][0], FOOT(base)]]), d, o.shade);
      S.L(top, S.W(d));
      return top;
    };

    /*
     * A TREE CROWN is ONE mass: the union outline of overlapping lobes,
     * computed by rays from the centre, so it scallops where lobes meet and
     * never comes back as a ring of separate balls. The shade is a crescent
     * on the lower right (hatched) plus clump arcs on that side — the line
     * twin of the dark lobes.
     */
    const union = (cx, cy, lobes, N) => {
      const out = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        let best = 0.4;
        for (const [lx, ly, r] of lobes) {
          const dx = lx - cx, dy = ly - cy, along = dx * c + dy * s, perp2 = dx * dx + dy * dy - along * along;
          if (r * r >= perp2) best = Math.max(best, along + Math.sqrt(r * r - perp2));
        }
        out.push([cx + c * best, cy + s * best]);
      }
      return out;
    };
    S.crown = (cx, cy, rx, ry, d, fill, o) => {
      o = o || {};
      const n = o.lobes || Math.round(lerp(11, 6, d)), lobes = [[cx, cy, Math.min(rx, ry) * 0.62]];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + jit(0.25);
        const f = 0.6 + rnd() * 0.12, r = Math.min(rx, ry) * (0.34 + rnd() * 0.14);
        lobes.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f, r]);
      }
      const sil = union(cx, cy, lobes, 120);
      S.F(sil, S.air(fill, d), { w: 0 });
      const Dx = Math.cos(45 * RAD), Dy = Math.sin(45 * RAD);
      const cres = crescent(runFrom(sil, ([x, y]) => (x - cx) * Dx + (y - cy) * Dy > -0.05 * Math.hypot(x - cx, y - cy)), cx, cy, 0.5);
      S.F(cres, S.air(fill, d), { w: 0, sh: 0.78 });
      if (o.hatch !== false) S.H(cres, d, { gap: o.gap || 1.35, ang: 58 });
      /* clump arcs: the lower-right edge of the inner lobes */
      if (d < 0.7) for (const [lx, ly, r] of lobes.slice(1)) {
        if ((lx - cx) * 0.4 + (ly - cy) < -ry * 0.25) continue;
        S.L(ov(lx, ly, r * 0.86, r * 0.8, 20, 120, 10), S.Wt(d) * 1.4, { curve: true });
      }
      S.L(sil, o.w || S.W(d), { closed: true, curve: true });
      return sil;
    };
    /*
     * A DECIDUOUS TREE: a heavy tapered trunk with a lean, limbs that fork
     * BELOW the crown (a bare limb under the canopy is a pole), and the crown.
     */
    S.tree = (x, y, h, d, o) => {
      o = o || {};
      const C = { bark: o.bark || "#6E5440", leaf: o.leaf || "#6F8F4E" };
      const lean = o.lean == null ? 0 : o.lean, tw = o.tw || h * 0.075;
      const cx = x + lean * h, cy = y - h * (o.cy || 0.66), rx = h * (o.rx || 0.42), ry = h * (o.ry || 0.34);
      /* the fork sits just BELOW the crown so the limbs show as they spread */
      const fy = Math.max(cy + ry * (o.fork || 1.45), y - h * 0.62);
      const fork = [lerp(x, cx, (y - fy) / (y - cy)), Math.min(fy, y - h * 0.14)];
      const trunk = ribbon(curve([[x, y], [lerp(x, fork[0], 0.5) + jit(0.4), lerp(y, fork[1], 0.5)], fork, [cx, cy]], 6), tw, tw * 0.35);
      S.F(trunk, S.air(C.bark, d), { w: 0 });
      if (d < 0.6) S.H(half(trunk, 1, 0, x + lean * h * 0.2), d, { gap: 0.9, ang: 80 });
      S.L(trunk, S.Wd(d) * 1.1, { closed: true, curve: true });
      if (d < 0.7) for (const s of o.limbs || [-1, 1]) {
        const end = [cx + s * rx * 0.62, cy + ry * 0.55];
        const L = ribbon(curve([fork, [lerp(fork[0], end[0], 0.5), lerp(fork[1], end[1], 0.6)], end], 5), tw * 0.5, tw * 0.15);
        S.F(L, S.air(C.bark, d), { w: S.Wd(d) * 0.8 });
      }
      if (o.roots !== false && d < 0.5) for (const s of [-1, 1])
        S.L(curve([[x + s * tw * 0.3, y - tw * 0.6], [x + s * tw * 0.8, y - 0.1], [x + s * tw * 1.4, y + 0.3]], 4), S.Wd(d), { taper: [1, 0.2] });
      return S.crown(cx, cy, rx, ry, d, C.leaf, o);
    };
    /*
     * A CONIFER is a ragged stack of drooping branch tiers, not a triangle.
     * Each tier ends in a tip out and down and a notch back in, with the two
     * sides jittered separately.
     */
    S.pine = (x, y, h, d, o) => {
      o = o || {};
      const fill = o.fill || "#3F5F44", n = o.tiers || Math.round(lerp(9, 5, d)), wide = o.wide || 0.27;
      const top = [x + jit(0.2), y - h], side = (s) => {
        const pts = [];
        for (let i = 0; i < n; i++) {
          const f = (i + 1) / n, ty = y - h + h * 0.86 * f, hw = h * wide * Math.pow(f, 0.85) * (0.85 + rnd() * 0.3);
          pts.push([x + s * hw * 0.42, ty - h * 0.07], [x + s * hw, ty + h * 0.025 * (1 + rnd())]);
        }
        pts.push([x + s * h * 0.035, y - h * 0.1], [x + s * h * 0.035, y]);
        return pts;
      };
      const L = side(-1), R = side(1);
      const sil = [top].concat(L, R.reverse());
      S.F(sil, S.air(fill, d), { w: 0 });
      const shade = [top].concat(R.slice().reverse().slice(0, -2), [[x + h * 0.03, y - h * 0.12]]);
      S.F(shade, S.air(fill, d), { w: 0, sh: 0.78 });
      if (o.hatch !== false) S.H(shade, d, { gap: o.gap || 1.2, ang: 70 });
      S.L(sil, S.W(d) * (o.wk || 0.85), { closed: true });
      return sil;
    };
    /* a distant forest: one band whose top is many small spires */
    S.treeline = (x0, x1, y, h, d, o) => {
      o = o || {};
      const fill = o.fill || "#4F6E4E", top = [], step = o.step || 1.6;
      /* irregular: spires of mixed height and width, in clumps, never a saw */
      for (let x = x0; x <= x1 + step;) {
        const st = step * (0.6 + rnd() * 1.1);
        const tall = rnd() < 0.18 ? 1.35 : 0.55 + rnd() * 0.45;
        if (o.round) top.push([x, y - h * (0.55 + rnd() * 0.45)]);
        else top.push([x + st * 0.15, y - h * (0.62 * tall) + jit(0.3)], [x + st * 0.42, y - h * tall], [x + st * 0.7, y - h * (0.5 * tall)], [x + st, y - h * (0.2 + rnd() * 0.3)]);
        x += st;
      }
      const ln = o.round ? curve(top, 3) : top;
      const poly = ln.concat([[x1 + step, y + (o.foot || 1)], [x0, y + (o.foot || 1)]]);
      S.F(poly, S.air(fill, d), { w: 0 });
      /* tone HANGS from the silhouette in strokes of uneven length. An even
         band of verticals across the foot reads as a fence or a barcode. */
      if (o.hatch !== false) for (let x = x0 + rnd(); x < x1; x += S.G(d, 1.5) * (0.6 + rnd() * 0.8)) {
        const yt = yAt(ln, x) + 0.6, L = h * (0.25 + rnd() * 0.6);
        if (rnd() < 0.8) S.L([[x, yt], [x + jit(0.15), Math.min(yt + L, y + (o.foot || 1))]], S.Wt(d), { taper: [1, 0.2] });
      }
      /* a spired top is busy: it gets a lighter pen than a smooth crest */
      S.L(ln, S.W(d) * (o.round ? 0.9 : 0.6));
      return ln;
    };
    /* a hedgerow: one bumpy band along a line, never a string of beads */
    S.hedge = (a, b, hgt, d, fill) => {
      const n = Math.max(6, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.4)), top = [], bot = [];
      for (let i = 0; i <= n; i++) {
        const f = i / n, x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), hh = hgt * lerp(0.7, 1.3, f) * (0.75 + rnd() * 0.5);
        top.push([x, y - hh]); bot.push([x, y + 0.3]);
      }
      const ln = curve(top, 3), poly = ln.concat(bot.reverse());
      S.F(poly, S.air(fill, d), { w: 0 });
      S.H(poly, d, { gap: 1, ang: 75, rag: 0.6 });
      S.L(ln, S.W(d) * 0.85);
    };
    /*
     * WATER is horizontal dashes whose spacing and length grow toward the
     * viewer (it is a plane in perspective). A reflection is the same dashes,
     * denser, inside the mirrored shape — no outline, a reflection has none.
     */
    S.water = (poly, y0, y1, o) => {
      o = o || {};
      if (o.fill) S.F(poly, o.fill, { w: 0 });
      const g0 = o.g0 || 1.1, g1 = o.g1 || 3.4, l0 = o.l0 || 2, l1 = o.l1 || 9;
      for (let y = y0 + g0 * 0.6; y < y1;) {
        const f = (y - y0) / ((y1 - y0) || 1);
        const xs = [];
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i], [xj, yj] = poly[j];
          if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          let x = xs[i] + rnd() * 3;
          while (x < xs[i + 1] - 1) {
            const L = lerp(l0, l1, f) * (0.4 + rnd() * 0.9), e = Math.min(x + L, xs[i + 1] - 0.4);
            if (rnd() < (o.density || 0.62) && e - x > 0.6) S.L([[x, y + jit(0.08)], [e, y]], (o.w || S.Wt(0)) * lerp(0.6, 1.1, f), { taper: [0.5, 0.5] });
            x = e + lerp(1.6, 6, f) * (0.5 + rnd());
          }
        }
        y += lerp(g0, g1, f) * (0.8 + rnd() * 0.4);
      }
    };
    S.reflect = (pts, axis, squash) => pts.map(([x, y]) => [x, axis + (axis - y) * (squash || 0.9)]);

    /* a rock: jagged mass, shadow facet hatched, a crack or two */
    S.rock = (pts, d, fill, o) => {
      o = o || {};
      const sil = o.raw ? pts : jag(pts.concat([pts[0]]), 0.12, 2).slice(0, -1);
      S.F(sil, S.air(fill, d), { w: 0 });
      let cx = 0, cy = 0;
      for (const [x, y] of sil) { cx += x / sil.length; cy += y / sil.length; }
      const Ux = 0.86, Uy = 0.5;
      const sh = crescent(runFrom(sil, ([x, y]) => (x - cx) * Ux + (y - cy) * Uy > -0.05 * Math.hypot(x - cx, y - cy)), cx, cy, o.depth || 0.55, 210);
      S.F(sh, S.air(fill, d), { w: 0, sh: 0.74 });
      S.H(sh, d, { gap: o.gap || 1.15, ang: o.ang || 62, cross: o.cross });
      for (let i = 0; i < (o.cracks == null ? 2 : o.cracks); i++) {
        const p = sil[Math.floor(rnd() * sil.length * 0.5)];
        S.L(curve([p, [lerp(p[0], cx, 0.4) + jit(1.2), lerp(p[1], cy, 0.4) + jit(1)], [lerp(p[0], cx, 0.75), lerp(p[1], cy, 0.75)]], 3), S.Wt(d) * 1.4, { taper: [1, 0.2] });
      }
      S.L(sil, S.W(d), { closed: true });
      return sil;
    };
    /* grass in clumps: tapered blades fanning from one root */
    S.grass = (x, y, n, h, d) => {
      for (let i = 0; i < n; i++) {
        const a = (-42 + (84 * i) / Math.max(1, n - 1) + jit(8)) * RAD, hh = h * (0.7 + rnd() * 0.5);
        S.L([[x + (i - n / 2) * 0.25, y], [x + Math.sin(a) * hh * 0.45, y - hh * 0.6], [x + Math.sin(a) * hh, y - hh]], S.Wd(d), { taper: [1.2, 0.3] });
      }
    };
    /* a cloud is a scalloped TOP and a flat, broken base — never a full ring */
    S.cloud = (cx, cy, w, d, o) => {
      o = o || {};
      const n = Math.max(3, Math.round(w / 6)), top = [[cx - w / 2, cy]];
      for (let i = 0; i < n; i++) {
        const x0 = cx - w / 2 + (w * i) / n, x1 = cx - w / 2 + (w * (i + 1)) / n, r = (x1 - x0) / 2;
        const lift = Math.sin(Math.PI * (i + 0.5) / n) * w * 0.12;
        top.push(...ov((x0 + x1) / 2, cy - lift, r * 1.05, r * (0.9 + rnd() * 0.3), 180, 360, 8));
      }
      top.push([cx + w / 2, cy]);
      S.F(top, o.fill || "#FFFFFF", { w: 0 });
      S.L(top, S.Wd(d) * 0.9, { curve: true });
      S.L([[cx - w * 0.36, cy], [cx + w * 0.1, cy]], S.Wt(d), { taper: [0.3, 0.6] });
    };
    S.birds = (list, d) => list.forEach(([x, y, s]) =>
      S.L([[x - s, y - s * 0.2], [x - s * 0.45, y - s * 0.55], [x, y], [x + s * 0.45, y - s * 0.55], [x + s, y - s * 0.2]], S.Wt(d) * 1.5, { curve: true }));
    /* a house in oblique: front, side to the right, a pitched or flat roof */
    S.house = (x0, y1, w, h, d, o) => {
      o = o || {};
      const dx = o.dx == null ? w * 0.35 : o.dx, dy = -dx * 0.35, wall = S.air(o.wall || "#E8DCC6", d), roof = S.air(o.roof || "#A0523A", d);
      const y0 = y1 - h;
      const side = [[x0 + w, y0], [x0 + w + dx, y0 + dy], [x0 + w + dx, y1 + dy], [x0 + w, y1]];
      S.F(side, wall, { w: 0, sh: 0.8 });
      if (d < 0.8) S.H(side, d, { gap: 1.3, ang: 90 });
      S.F(rect(x0, y0, x0 + w, y1), wall, { w: 0 });
      let outline;
      if (o.flat) {
        S.F([[x0 - 0.3, y0 - h * 0.08], [x0 + w + 0.3, y0 - h * 0.08], [x0 + w + dx + 0.3, y0 + dy - h * 0.08], [x0 + w + dx, y0 + dy], [x0 + w, y0], [x0, y0]], mix(wall, "#000000", 0.08), { w: 0 });
        outline = [[x0, y1], [x0, y0 - h * 0.08], [x0 + w + 0.3, y0 - h * 0.08], [x0 + w + dx + 0.3, y0 + dy - h * 0.08], [x0 + w + dx, y1 + dy], [x0 + w, y1]];
        S.L([[x0, y0], [x0 + w, y0], [x0 + w + dx, y0 + dy]], S.Wt(d));
      } else {
        const rh = o.rh || w * 0.45, ov2 = w * 0.06;
        const gable = [[x0 - ov2, y0], [x0 + w / 2, y0 - rh], [x0 + w + ov2, y0]];
        const slope = [[x0 + w / 2, y0 - rh], [x0 + w / 2 + dx, y0 - rh + dy], [x0 + w + ov2 + dx, y0 + dy], [x0 + w + ov2, y0]];
        S.F(slope, roof, { w: 0 });
        if (d < 0.85) S.H(slope, d, { gap: 1.2, ang: 20 });
        S.F(gable, wall, { w: 0, sh: 0.94 });
        outline = [[x0, y1], [x0, y0], [x0 - ov2, y0], [x0 + w / 2, y0 - rh], [x0 + w / 2 + dx, y0 - rh + dy], [x0 + w + ov2 + dx, y0 + dy], [x0 + w + dx, y0 + dy], [x0 + w + dx, y1 + dy], [x0 + w, y1]];
        S.L([[x0 - ov2, y0], [x0 + w / 2, y0 - rh], [x0 + w + ov2, y0], [x0 + w + ov2 + dx, y0 + dy]], S.Wd(d));
      }
      S.L([[x0 + w, y0], [x0 + w, y1]], S.Wt(d) * 1.4);
      for (const [wx, wy, ww, wh] of o.windows || []) {
        const r = rect(x0 + wx, y1 - wy - wh, x0 + wx + ww, y1 - wy);
        S.F(r, o.lit ? "#F2C45A" : S.air("#3A3530", d), { w: 0 });
        if (!o.lit) S.H(r, d, { gap: 0.6, ang: 45, min: 0.2 });
        S.L(r, S.Wt(d) * 1.3, { closed: true });
      }
      S.L(outline, S.W(d) * 0.9, { closed: true });
    };
    return S;
  }

  const D = {};

  /* ── 1 · mountain lake: terrain + snow + reflection ───────────────────── */
  D.lake = (S) => {
    const C = { far: "#9FB1C8", mid: "#7C93A8", pine: "#3E5C47", shore: "#8FA86C", water: "#B7D0DE", rock: "#8C8478" };
    S.panel(0, 0, 160, 100, "#EAF2F7");
    S.cloud(122, 18, 26, 0.9);
    const far = S.range([[-2, 52], [14, 34], [26, 42], [44, 16], [58, 34], [72, 26], [86, 40], [104, 14], [120, 30], [138, 22], [162, 46]], 60, 0.85, C.far, { snow: 27 });
    const mid = S.range([[-2, 48], [18, 40], [36, 50], [60, 46], [82, 55], [112, 44], [132, 52], [162, 42]], 62, 0.6, C.mid, { rough: 0.16, gap: 1.4 });
    S.treeline(-2, 162, 61, 7, 0.5, { fill: C.pine });
    /* the lake: everything above the shore, mirrored and broken */
    const lake = [[-2, 62], [162, 62], [162, 82], [120, 84], [70, 80], [30, 85], [-2, 82]];
    S.F(lake, C.water, { w: 0 });
    for (const [line, c] of [[far, C.far], [mid, C.mid]]) {
      const r = S.reflect(line.filter((_, i) => i % 2 === 0), 62, 0.55);
      S.F(r.concat([[162, 62], [-2, 62]]), mix(S.air(c, 0.6), C.water, 0.55), { w: 0 });
    }
    S.water(lake, 62, 84, { g0: 0.9, g1: 2.6, density: 0.7 });
    S.L([[-2, 62], [162, 62]], S.Wt(0.4));
    /* the near shore: a rocky spit with three pines, our subject */
    const shore = curve([[-4, 86], [20, 80], [52, 82], [72, 86], [100, 88], [130, 84], [164, 86]], 8);
    S.F(shore.concat([[164, 104], [-4, 104]]), C.shore, { w: 0 });
    S.L(shore, S.W(0.1));
    S.pine(22, 84, 36, 0.12);
    S.pine(31, 83, 26, 0.18);
    S.pine(14, 85, 22, 0.2);
    S.rock([[96, 92], [100, 84], [108, 82], [116, 86], [118, 93]], 0, C.rock);
    S.rock([[112, 93], [116, 88], [123, 88], [126, 94]], 0.05, C.rock);
    for (const [x, y, n] of [[60, 92, 6], [72, 95, 5], [132, 94, 6], [44, 96, 5], [150, 92, 4]]) S.grass(x, y, n, 4, 0.05);
    S.birds([[70, 22, 1.6], [76, 25, 1.2]], 0.5);
  };

  /* ── 2 · Indian village lane: one-point perspective, buildings + organic ─ */
  D.village = (S) => {
    /*
     * One-point perspective by hand: P(X, Y, Z) with the eye 4 units up
     * (≈ 2 m) and the nearest wall at Z = 9, so no single wall eats the frame.
     */
    const F = 62, VX = 80, HOR = 42, GY = 4;
    const P = (X, Y, Z) => [VX + (X * F) / Z, HOR + (Y * F) / Z];
    const C = { sky: "#F3EBDD", lime: "#EFE3C8", ochre: "#E2B864", blue: "#9FBFCB", pink: "#E3A5A0", dust: "#E6D2B0", door: "#4E6E7A" };
    S.panel(0, 0, 160, 100, C.sky);
    S.F([[0, HOR], [160, HOR], [160, 100], [0, 100]], C.dust, { w: 0 });
    /* ruts and stones, sparse, and nearer = bigger */
    for (const x of [-1.4, 1.4]) S.L([P(x, GY, 70), P(x * 1.15, GY, 3.2)], S.Wt(0.2) * 1.3, { taper: [0.2, 1.4] });
    for (let i = 0; i < 26; i++) { const z = 3.5 + Math.pow(rnd(), 1.6) * 36, x = jit(4); const [a, b] = P(x, GY, z); S.L([[a, b], [a + 18 / z, b]], S.Wt(0.3) * 1.2); }
    /* a house on side s, from depth z0 (near) to z1 (far), h tall, d deep */
    const house = (s, z0, z1, h, fill, o) => {
      o = o || {};
      const X = s * 5, Xb = s * 11, d = clamp((z0 - 8) / 45, 0, 0.85);
      const wall = [P(X, GY - h, z1), P(X, GY - h, z0), P(X, GY, z0), P(X, GY, z1)];
      const end = [P(X, GY - h, z0), P(Xb, GY - h, z0), P(Xb, GY, z0), P(X, GY, z0)];
      S.F(end, S.air(fill, d), { w: 0, sh: 0.86 });
      if (z0 > 6) S.H(end, d, { gap: 1.8, ang: 90, rag: 1 });
      S.F(wall, S.air(fill, d), { w: 0 });
      /* parapet band + the chajja (sunshade) over the door */
      S.L([P(X, GY - h + 0.7, z1), P(X, GY - h + 0.7, z0)], S.Wt(d) * 1.3);
      /* openings are sized in WORLD units, not as a fraction of the wall:
         a door is a door wide however long the house is */
      const zm = lerp(z0, z1, 0.35), dz = 0.75, zw = Math.min(lerp(z0, z1, 0.72), zm + 3.2);
      const ch = GY - 3.3;
      S.F([P(X, ch, zm + dz * 1.6), P(X, ch, zm - dz * 1.6), P(X - s * 1.2, ch + 0.25, zm - dz * 1.6), P(X - s * 1.2, ch + 0.25, zm + dz * 1.6)], S.air("#8C8070", d), { w: S.Wd(d) });
      const door = [P(X, GY - 3, zm + dz), P(X, GY - 3, zm - dz), P(X, GY, zm - dz), P(X, GY, zm + dz)];
      S.F(door, S.air(C.door, d), { w: S.Wd(d) });
      S.H(door, d, { gap: 0.8, ang: 90 });
      if (h > 6) {
        const win = [P(X, GY - h + 2, zw + dz * 0.7), P(X, GY - h + 2, zw - dz * 0.7), P(X, GY - h + 4, zw - dz * 0.7), P(X, GY - h + 4, zw + dz * 0.7)];
        S.F(win, S.air("#3A3530", d), { w: S.Wd(d) });
        S.H(win, d, { gap: 0.6, ang: 45, min: 0.2 });
      }
      if (o.step) S.F([P(X, GY - 0.5, zm + dz * 1.3), P(X, GY - 0.5, zm - dz * 1.3), P(X - s * 0.9, GY, zm - dz * 1.3), P(X - s * 0.9, GY, zm + dz * 1.3)], S.air("#CBB892", d), { w: S.Wt(d) * 1.3 });
      /* a house whose near end is out of the picture has no end face to draw:
         its edges would rule a heavy line straight across the foreground */
      if (z0 >= 7) S.L([wall[0], wall[1], end[1], end[2], wall[2], wall[3]], S.W(d) * 0.9);
      else S.L([wall[0], wall[1]], S.W(d) * 0.9), S.L([wall[2], wall[3]], S.W(d) * 0.9);
      S.L([wall[1], wall[2]], S.Wd(d));
    };
    /* far to near on both sides, so nearer walls cover farther ones */
    const L = [[52, 70, 6, C.blue], [40, 52, 8, C.ochre], [30, 40, 6.5, C.lime], [21, 30, 9, C.pink], [14, 21, 7, C.lime], [2.6, 14, 8.5, C.ochre]];
    const Rr = [[50, 70, 7, C.lime], [38, 50, 6, C.pink], [28, 38, 9, C.blue], [19, 28, 6.5, C.ochre], [13, 19, 8, C.lime], [2.6, 13, 7, C.pink]];
    for (let i = 0; i < L.length; i++) { house(-1, ...L[i].slice(0, 3), L[i][3], { step: i % 2 }); house(1, ...Rr[i].slice(0, 3), Rr[i][3], { step: (i + 1) % 2 }); }
    /* the end of the lane: a small temple shikhara rising over the far roofs */
    const [tx, ty] = P(0, GY, 72), ts = F / 72;
    const shik = curve([[tx - 3 * ts, ty], [tx - 2.7 * ts, ty - 5 * ts], [tx - 1.2 * ts, ty - 10 * ts], [tx, ty - 11.5 * ts], [tx + 1.2 * ts, ty - 10 * ts], [tx + 2.7 * ts, ty - 5 * ts], [tx + 3 * ts, ty]], 4);
    S.F(shik, S.air("#E7B07A", 0.8), { w: S.W(0.8) });
    S.L([[tx, ty - 11.5 * ts], [tx, ty - 14 * ts], [tx + 2 * ts, ty - 13.3 * ts], [tx, ty - 12.6 * ts]], S.Wt(0.6) * 1.4);
    /* electric wires sagging across the lane */
    for (const [a, b] of [[[0, 16], [160, 12]], [[0, 19], [160, 16]]]) S.L(curve([a, [80, Math.max(a[1], b[1]) + 6], b], 10), S.Wt(0.2) * 1.2);
    /* a neem tree over the left houses, its crown overlapping the roofline */
    S.tree(22, 74, 64, 0.08, { lean: 0.18, rx: 0.32, ry: 0.24, cy: 0.78, leaf: "#6E9150" });
    /*
     * A ZEBU, side-on, facing right. What names it is the HUMP over the
     * shoulders, the DEWLAP under the neck and the HORNS — a long body on
     * four legs with a small head reads as a dog. Profile in units of
     * ~0.17 m, ground at 0.
     */
    const [cx, cy] = P(1.4, GY, 17), s = (0.36 * F) / 17;
    const cow = [[-6, -6.2], [-5.2, -6.6], [-1.2, -6.4], [1.6, -7.2], [2.6, -8.1], [3.6, -7.7], [4.4, -6.9], [5.4, -7.3], [6.3, -7.1], [7.5, -5.4], [7.8, -4.5], [7.1, -4.1], [6.1, -4.5], [5.1, -4.4], [4.3, -3.2], [3.7, -2.9],
      [3.6, 0], [3.0, 0], [2.8, -2.5], [2.3, -2.5], [2.2, 0], [1.6, 0], [1.5, -2.7], [-2, -2.9], [-3.4, -2.9], [-3.3, 0], [-3.9, 0], [-4.3, -2.3], [-4.6, -2.2], [-4.7, 0], [-5.3, 0], [-5.5, -3.4], [-6.1, -4.6]];
    const X = ([x, y]) => [cx + x * s, cy + y * s];
    const cs = curve(cow.map(X), 2, true);
    S.F(ov(cx, cy + 0.15, 6.4 * s, 0.6 * s), "#CDB58C", { w: 0 });
    S.H(ov(cx + s, cy + 0.15, 6.4 * s, 0.6 * s), 0.2, { gap: 0.8, ang: 10 });
    S.L(curve([[-6.1, -6], [-6.5, -4.4], [-6.4, -2.6]].map(X), 4), S.Wd(0.2));
    S.F(ov(...X([-6.4, -2.2]), 0.35 * s, 0.6 * s), "#3A3530", { w: 0 });
    S.F(cs, "#F4F0E6", { w: 0 });
    S.H(half(cs, 0, 1, cy - 3.6 * s), 0.2, { gap: 1, ang: 60 });
    S.L(cs, S.W(0.2) * 0.9, { closed: true });
    for (const h of [[[5.5, -7.2], [5.1, -8.4], [5.6, -9.3]], [[6.1, -7.1], [6.4, -8.3], [6.1, -9.1]]]) S.L(curve(h.map(X), 3), S.Wd(0.2) * 1.2, { taper: [1, 0.3] });
    S.F([X([5.2, -6.8]), X([4.1, -6.1]), X([5.0, -6.3])], "#E8DCC6", { w: S.Wt(0.2) * 1.3 });
    S.F(ov(...X([6.4, -6.2]), 0.22 * s, 0.22 * s), "#17171A", { w: 0 });
    S.L(curve([[-1, -2.9], [0.4, -2.6], [1.4, -2.8]].map(X), 3), S.Wt(0.2));
  };


  /* ── 3 · forest path: masses that overlap, light at the end ───────────── */
  D.forest = (S) => {
    const C = { far: "#88A08A", mid: "#5F7F5B", near: "#4F6E46", bark: "#5E4A3A", path: "#E3D3AE", moss: "#9BB277" };
    S.panel(0, 0, 160, 100, "#F2F3E8");
    S.treeline(-2, 162, 50, 16, 0.85, { fill: C.far, round: true, step: 3.2 });
    /* mid trees stand in GROUPS whose crowns overlap and sit low; a lone
       crown on a long bare stick is a lollipop */
    for (const [x, h, y] of [[30, 40, 56], [44, 46, 55], [56, 38, 56], [108, 42, 55], [122, 46, 56], [134, 38, 57]])
      S.tree(x, y, h, 0.55, { leaf: C.mid, tw: h * 0.06, cy: 0.55, rx: 0.36, ry: 0.36, roots: false });
    /* the path: a light wedge narrowing to the gap between the trees */
    const ground = [[-2, 52], [162, 52], [162, 102], [-2, 102]];
    S.F(ground, C.moss, { w: 0 });
    const path = curve([[60, 104], [66, 84], [74, 66], [80, 54], [84, 52]], 6).concat(curve([[90, 52], [92, 56], [100, 68], [112, 84], [128, 104]], 6));
    S.F(path, C.path, { w: 0 });
    S.L(path.slice(0, 25), S.Wd(0.2), { taper: [1, 0.3] });
    S.L(path.slice(25), S.Wd(0.2), { taper: [0.3, 1] });
    for (let i = 0; i < 9; i++) { const y = 60 + i * 4.5, w = 2 + i * 1.2, x = 84 + jit(4) - i * 0.6; S.L([[x, y], [x + w, y + 0.2]], S.Wt(0.2), { taper: [0.4, 0.4] }); }
    /* mossy ground: short strokes, more of them in front */
    for (let i = 0; i < 26; i++) { const y = 60 + rnd() * 40, x = rnd() * 160; if (Math.abs(x - (88 + (y - 52) * 0.2)) > 8 + (y - 52) * 0.6) S.L([[x, y], [x + 1 + (y - 52) * 0.08, y - 0.3]], S.Wt(0.2) * 1.2); }
    /* two big trunks framing the view, cut by the frame (repoussoir) */
    for (const [x, w, lean] of [[18, 11, 2], [146, 13, -3]]) {
      const tr = ribbon(curve([[x, 106], [x + lean * 0.4, 60], [x + lean, 10], [x + lean * 1.2, -6]], 6), w * 1.25, w * 0.75);
      S.F(tr, C.bark, { w: 0 });
      S.H(half(tr, 1, 0, x + lean * 0.6 + (lean < 0 ? -1 : 1) * w * 0.1), 0, { gap: 1, ang: 84 });
      for (let i = 0; i < 6; i++) { const y = 14 + i * 14 + jit(3); S.L(curve([[x + lean * (1 - y / 100) - w * 0.3, y], [x + lean * (1 - y / 100), y + 2 + jit(1)], [x + lean * (1 - y / 100) + w * 0.2, y + 4]], 3), S.Wt(0) * 1.4); }
      S.L(tr, S.W(0), { closed: true, curve: true });
    }
    S.crown(14, 4, 40, 18, 0.05, C.near, { lobes: 9 });
    S.crown(150, 2, 36, 16, 0.05, C.near, { lobes: 8 });
    /* ferns at the trunk feet */
    for (const [x, y, s] of [[30, 98, 1], [128, 99, -1], [40, 102, 1]]) for (let i = 0; i < 5; i++) {
      const a = (-70 + i * 30) * RAD, L = 12 - Math.abs(i - 2) * 2;
      const tip = [x + Math.sin(a) * L, y - Math.cos(a) * L * 0.7];
      const stem = curve([[x, y], [lerp(x, tip[0], 0.5), lerp(y, tip[1], 0.6) - 2], tip], 6);
      S.L(stem, S.Wd(0.05), { taper: [1, 0.3] });
      for (let j = 2; j < stem.length - 1; j += 2) {
        const [px, py] = stem[j], l = 3 * (1 - j / stem.length);
        S.L([[px, py], [px - l * 0.6, py - l]], S.Wt(0.05) * 1.3); S.L([[px, py], [px + l * 0.8, py - l * 0.5]], S.Wt(0.05) * 1.3);
      }
    }
  };

  /* ── 4 · rocky coast, lighthouse: rock, surf ──────────────────────────── */
  D.coast = (S) => {
    const C = { sea: "#9CC3D3", cliff: "#A79A86", grass: "#97AC6E", sand: "#EADFC4", rock: "#7F7568", red: "#C4553F" };
    S.panel(0, 0, 160, 100, "#EEF4F6");
    S.cloud(40, 20, 30, 0.85); S.cloud(70, 14, 18, 0.9);
    const sea = [[-2, 48], [162, 48], [162, 102], [-2, 102]];
    S.F(sea, C.sea, { w: 0 });
    S.L([[-2, 48], [162, 48]], S.Wt(0.9));
    S.water(sea, 48, 100, { g0: 1, g1: 4, l0: 2, l1: 12, density: 0.55 });
    /* the headland: a cliff whose face is strata, grass cap on top */
    const top = curve([[94, 40], [106, 36], [126, 34], [146, 36], [164, 35]], 6);
    /* the cliff stands IN the sea: its foot is on the waterline, with surf */
    const face = top.concat([[164, 66], [150, 64], [134, 60], [118, 58], [104, 54], [96, 50], [92, 46]]);
    S.F(face, C.cliff, { w: 0 });
    S.H(half(face, 1, -0.2, 112), 0.3, { gap: 1.4, ang: 72 });
    for (let i = 0; i < 4; i++) { const y = 42 + i * 4.6 + jit(1); S.L(jag([[96 + i * 2 + rnd() * 4, y], [118 + jit(4), y + 1.4 + jit(1)], [140 + rnd() * 20, y + jit(1.6)]], 0.14, 3), S.Wt(0.3) * 1.3); }
    for (let i = 0; i < 5; i++) { const x = 104 + i * 12 + jit(3), y0 = 40 + rnd() * 4; S.L(jag([[x, y0], [x + jit(1), y0 + 8 + rnd() * 10]], 0.15, 2), S.Wt(0.3) * 1.2); }
    S.L(curve([[92, 50], [104, 56.5], [122, 60], [140, 63], [164, 67]], 6), S.Wd(0.3), { taper: [0.4, 0.8] });
    const cap = top.concat(curve([[164, 38], [146, 39.5], [126, 37.4], [110, 39.6], [96, 43]], 4));
    S.F(cap, C.grass, { w: 0 });
    S.L(face, S.W(0.25), { closed: true });
    /* the lighthouse on the headland */
    const lx = 132, ly = 35.5;
    const tower = [[lx - 4, ly], [lx - 2.8, ly - 24], [lx + 2.8, ly - 24], [lx + 4, ly]];
    S.F(tower, "#F7F4EE", { w: 0 });
    for (const f of [0.18, 0.55]) {
      const a = lerp(ly, ly - 24, f), b = lerp(ly, ly - 24, f + 0.18), wa = lerp(4, 2.8, f), wb = lerp(4, 2.8, f + 0.18);
      const band = [[lx - wa, a], [lx - wb, b], [lx + wb, b], [lx + wa, a]];
      S.F(band, C.red, { w: 0 }); S.H(band, 0.2, { gap: 0.9, ang: 45 });
    }
    S.H(half(tower, 1, 0, lx + 1.2), 0.2, { gap: 1.1, ang: 80 });
    S.L(tower, S.W(0.25), { closed: true });
    S.F(rect(lx - 3.6, ly - 25.4, lx + 3.6, ly - 24), "#3A3530", { w: S.Wd(0.25) });
    S.F(rect(lx - 2.2, ly - 30, lx + 2.2, ly - 25.4), "#F2D27A", { w: S.Wd(0.25) });
    for (const x of [-0.8, 0.8]) S.L([[lx + x, ly - 30], [lx + x, ly - 25.4]], S.Wt(0.25));
    S.F([[lx - 2.8, ly - 30], [lx, ly - 33.6], [lx + 2.8, ly - 30]], C.red, { w: S.Wd(0.25) });
    S.F(rect(lx + 4.2, ly - 5, lx + 11, ly), "#F7F4EE", { w: S.Wd(0.3) });
    S.F([[lx + 3.8, ly - 5], [lx + 7.6, ly - 8], [lx + 11.4, ly - 5]], C.red, { w: S.Wd(0.3) });
    /* foreground: a sand cove and big wet rocks with surf breaking on them */
    const beach = curve([[-4, 78], [20, 80], [44, 86], [64, 96], [70, 104]], 6).concat([[-4, 104]]);
    S.F(beach, C.sand, { w: 0 });
    S.L(beach.slice(0, -1), S.W(0.05));
    for (let i = 0; i < 20; i++) { const x = rnd() * 50, y = 86 + rnd() * 14; if (y > 80 + x * 0.3) S.L([[x, y], [x + 0.4, y]], S.Wt(0) * 1.5); }
    const r1 = S.rock([[70, 100], [74, 84], [86, 76], [100, 78], [108, 88], [110, 102]], 0, C.rock, { gap: 1 });
    S.rock([[104, 102], [112, 90], [124, 88], [134, 94], [136, 104]], 0.05, C.rock);
    S.rock([[52, 84], [56, 78], [64, 77], [68, 84]], 0.15, C.rock);
    /* surf: curls that wrap the rock's foot, and broken foam lines */
    for (const [x, y, w] of [[70, 86, 10], [112, 90, 8], [44, 80, 14]]) {
      S.L(curve([[x - w, y], [x - w * 0.4, y - 2.2], [x, y - 1.6], [x + w * 0.3, y + 0.4]], 5), S.Wd(0.1), { taper: [0.3, 1] });
      S.L(curve([[x - w * 0.8, y + 1.8], [x - w * 0.2, y + 1.2], [x + w * 0.2, y + 2.4]], 4), S.Wt(0.1) * 1.4, { taper: [0.3, 0.3] });
    }
    S.birds([[60, 30, 1.8], [66, 34, 1.3], [54, 36, 1]], 0.4);
  };

  /* ── 5 · rolling fields + farmhouse: rows into the picture ────────────── */
  D.fields = (S) => {
    const C = { far: "#A5B78E", wheat: "#E1C877", green: "#9DBA6C", plough: "#B9946A", hedge: "#5D7A49" };
    S.panel(0, 0, 160, 100, "#F1F2EA");
    S.hill([[-4, 40], [30, 34], [70, 38], [110, 30], [164, 36]], 60, 0.85, C.far, { contours: 1 });
    S.treeline(-2, 70, 42, 4, 0.75, { fill: C.hedge, round: true, step: 2.2 });
    /* patchwork: each field a quad, its rows running to its own point */
    const field = (poly, fill, vp, n, d, o) => {
      S.F(poly, S.air(fill, d), { w: 0 });
      const ys = poly.map((p) => p[1]), y1 = Math.max(...ys);
      for (let i = 0; i <= n; i++) {
        const xb = lerp(Math.min(...poly.map((p) => p[0])) - 40, Math.max(...poly.map((p) => p[0])) + 40, i / n);
        const segs = [];
        const A = vp, B = [xb, y1 + 30];
        const dense = [];
        for (let j = 0; j <= 60; j++) dense.push([lerp(A[0], B[0], j / 60), lerp(A[1], B[1], j / 60)]);
        let run = [];
        for (const p of dense) { if (Kit.inPoly(poly, p[0], p[1])) run.push(p); else { if (run.length > 1) segs.push(run); run = []; } }
        if (run.length > 1) segs.push(run);
        for (const r of segs) S.L(r, S.Wt(d) * (o && o.w || 1), { taper: [0.3, 1] });
      }
      S.L(poly, S.Wd(d) * 0.8, { closed: true });
    };
    S.F([[-4, 44], [164, 40], [164, 104], [-4, 104]], C.green, { w: 0 });
    field([[-4, 46], [60, 42], [56, 54], [-4, 58]], C.wheat, [30, 30], 26, 0.6);
    field([[60, 42], [120, 38], [130, 50], [56, 54]], C.green, [95, 26], 22, 0.6);
    field([[120, 38], [164, 40], [164, 54], [130, 50]], C.plough, [140, 28], 18, 0.6);
    field([[-4, 58], [56, 54], [70, 72], [-4, 80]], C.green, [20, 40], 18, 0.35);
    /* the near pasture: the fence's field, grass in clumps rather than rows */
    const past = [[-4, 80], [70, 72], [80, 104], [-4, 104]];
    S.F(past, "#A9C27C", { w: 0 });
    S.L([[-4, 80], [70, 72]], S.Wd(0.3));
    field([[56, 54], [130, 50], [164, 54], [164, 104], [80, 104], [70, 72]], C.wheat, [100, 30], 40, 0.1, { w: 1.2 });
    /* hedgerows along the field edges */
    for (const [a, b, hh, d] of [[[60, 42], [56, 54], 3.2, 0.55], [[120, 38], [130, 50], 3.2, 0.55], [[56, 54], [70, 72], 5, 0.35]]) S.hedge(a, b, hh, d, C.hedge);
    /* the farmhouse + barn on the rise, a lone oak by them: the subject */
    S.house(78, 46, 12, 8, 0.45, { roof: "#9C4B36", windows: [[2, 2, 2, 2.4], [7.4, 2, 2, 2.4]] });
    S.house(94, 46, 9, 7, 0.45, { roof: "#6E6A64", wall: "#B8573F", dx: 5, windows: [] });
    S.tree(110, 47, 22, 0.42, { lean: 0.05 });
    /* the near fence: posts that shrink with depth, two rails */
    const posts = [];
    for (let i = 0; i < 9; i++) { const f = i / 8, x = lerp(4, 70, Math.pow(f, 0.8)), y = lerp(96, 70, Math.pow(f, 0.8)), h = lerp(16, 5, f); posts.push([x, y, h]); }
    for (const r of [0.25, 0.65]) S.L(posts.map(([x, y, h]) => [x, y - h * (1 - r)]), S.Wd(0.1), { curve: true });
    for (const [x, y, h] of posts) { const p = rect(x - h * 0.06, y - h, x + h * 0.06, y); S.F(p, "#8C6E50", { w: 0 }); S.L(p, S.Wd(0.1), { closed: true }); }
    for (const [x, y] of [[20, 99], [34, 92], [140, 96], [154, 90]]) S.grass(x, y, 5, 4, 0.05);
    S.birds([[40, 18, 1.6], [46, 21, 1.1]], 0.4);
  };

  /* ── 6 · desert dunes: smooth forms with NO edges, a caravan ──────────── */
  D.dunes = (S) => {
    const C = { far: "#EBCB9A", mid: "#E2B47A", near: "#D99E62", camel: "#8A6440" };
    S.panel(0, 0, 160, 100, "#F7EFE2");
    S.F(ov(118, 22, 7, 7, 0, 360, 36), "#F3D48A", { w: S.Wd(0.5) });
    /* a dune: the crest is sharp, the windward side lit, the lee side in shade */
    const dune = (crest, base, d, fill, leeTo) => {
      const top = curve(crest, 10);
      const body = top.concat([[top[top.length - 1][0], FOOT(base)], [top[0][0], FOOT(base)]]);
      S.F(body, S.air(fill, d), { w: 0 });
      /* lee: from the crest line down to a soft curve below it */
      const lee = top.filter((_, i) => i > top.length * leeTo[0] && i < top.length * leeTo[1]);
      if (lee.length > 3) {
        /* a lee is a CRESCENT under the crest: it meets the crest at both
           ends and bellies down between them (shifting the crest sideways
           made a floating parallelogram) */
        const low = lee.map(([x, y], i) => [x, y + Math.sin((i / (lee.length - 1)) * Math.PI) * 7]).reverse();
        const sh = lee.concat(low);
        S.F(sh, S.air(fill, d), { w: 0, sh: 0.8 });
        S.H(sh, d, { gap: 1.6, ang: 160, rag: 2 });
      }
      S.L(top, S.W(d));
      /* ripples: a few long curves following the windward slope */
      if (d < 0.8) for (let i = 0; i < 3; i++) {
        const seg = top.filter((_, j) => j > top.length * (0.1 + i * 0.08) && j < top.length * (0.45 + i * 0.06)).map(([x, y]) => [x + 2, y + 4 + i * 3.5]);
        if (seg.length > 2) S.L(seg, S.Wt(d), { taper: [0.2, 0.2] });
      }
      return top;
    };
    dune([[-4, 52], [24, 44], [60, 50], [96, 42], [130, 46], [164, 44]], 70, 0.85, C.far, [0.6, 0.8]);
    const mid = dune([[-4, 62], [30, 54], [50, 58], [84, 62], [120, 56], [164, 64]], 82, 0.5, C.mid, [0.15, 0.35]);
    /* the caravan walks the middle crest: camels, small, in single file */
    const camel = (x, y, s, flip) => {
      const pts = [[-4, 0], [-3.8, -3.4], [-4.4, -3.8], [-4.2, -4.6], [-3.2, -5], [-1.6, -6.8], [0, -5.6], [1.6, -5], [2.8, -5.6], [3.4, -7.6], [4.4, -8.4], [5.4, -8], [5.2, -7.4], [4.4, -7.2], [4.2, -5], [3.4, -3.4], [2.8, -3], [2.9, 0], [2.3, 0], [2.1, -2.8], [1.2, -2.8], [1.1, 0], [0.5, 0], [0.4, -2.8], [-2.2, -2.8], [-2.4, 0], [-3, 0], [-3.2, -2.8], [-3.5, -2.9], [-3.4, 0]];
      const sil = pts.map(([px, py]) => [x + px * s * (flip ? -1 : 1), y + py * s]);
      S.F(sil, S.air(C.camel, 0.45), { w: 0 });
      S.H(sil, 0.45, { gap: 1, ang: 60 });
      S.L(sil, S.W(0.45) * 0.9, { closed: true });
    };
    for (const [x, s] of [[88, 1.05], [100, 1.0], [111, 0.95]]) camel(x, yAt(mid, x) - 0.2, s);
    S.L(curve([[86, yAt(mid, 86) - 3], [96, yAt(mid, 96) - 2], [108, yAt(mid, 108) - 2.4]], 6), S.Wt(0.4));
    const near = dune([[-4, 80], [20, 72], [52, 76], [80, 86], [120, 80], [164, 88]], 104, 0.1, C.near, [0.05, 0.25]);
    /* footprints wandering into the picture */
    for (let i = 0; i < 9; i++) { const f = i / 8, x = lerp(110, 70, f) + (i % 2 ? 1.6 : -1.6) * (1 - f), y = lerp(100, 84, f); S.F(ov(x, y, lerp(1.2, 0.5, f), lerp(0.5, 0.25, f)), "#B98450", { w: 0 }); S.L(ov(x, y, lerp(1.2, 0.5, f), lerp(0.5, 0.25, f), 0, 180, 6), S.Wt(0.1)); }
    S.birds([[52, 26, 1.5]], 0.5);
  };

  /* ── 7 · snowy cabin at dusk: white-on-white, value from the darks ────── */
  D.snow = (S) => {
    const C = { sky: "#D9D6E8", far: "#B9BCD3", pine: "#2F4A3E", snowSh: "#DCE4EE", wood: "#6E4B34" };
    S.panel(0, 0, 160, 100, C.sky);
    S.range([[-2, 46], [22, 30], [40, 40], [64, 24], [90, 38], [116, 28], [140, 36], [162, 30]], 56, 0.8, C.far, { snow: 40, gap: 1.6 });
    S.treeline(-2, 162, 56, 9, 0.6, { fill: C.pine });
    /* snow ground: paper, with its shade only in the hollows */
    const g = curve([[-4, 58], [40, 60], [80, 62], [120, 58], [164, 60]], 8);
    S.F(g.concat([[164, 104], [-4, 104]]), "#FFFFFF", { w: 0 });
    S.L(g, S.Wt(0.5) * 1.4);
    const drift = curve([[-4, 84], [30, 80], [60, 86], [100, 82], [140, 88], [164, 84]], 8);
    S.F(drift.concat(drift.slice().reverse().map(([x, y]) => [x + 6, y + 6])), C.snowSh, { w: 0 });
    S.H(drift.concat(drift.slice().reverse().map(([x, y]) => [x + 6, y + 5])), 0.1, { gap: 1.8, ang: 10, rag: 3 });
    /* the cabin: log walls, a deep snow-loaded roof, two lit windows */
    const x0 = 62, y1 = 74, w = 30, h = 14, dx = 14, dy = -5;
    const side = [[x0 + w, y1 - h], [x0 + w + dx, y1 - h + dy], [x0 + w + dx, y1 + dy], [x0 + w, y1]];
    S.F(side, C.wood, { w: 0, sh: 0.8 }); S.H(side, 0.2, { gap: 0.9, ang: 90 });
    S.F(rect(x0, y1 - h, x0 + w, y1), C.wood, { w: 0 });
    for (let i = 1; i < 6; i++) S.L([[x0, y1 - h + i * (h / 6)], [x0 + w, y1 - h + i * (h / 6)]], S.Wt(0.2) * 1.2);
    for (let i = 1; i < 6; i++) S.L([[x0 + w, y1 - h + i * (h / 6)], [x0 + w + dx, y1 - h + i * (h / 6) + dy]], S.Wt(0.2));
    for (const [wx, ww] of [[4, 6], [19, 6]]) {
      const r = rect(x0 + wx, y1 - 9.5, x0 + wx + ww, y1 - 4.5);
      S.F(r, "#F2C45A", { w: S.Wd(0.2) });
      S.L([[x0 + wx + ww / 2, y1 - 9.5], [x0 + wx + ww / 2, y1 - 4.5]], S.Wt(0.2));
      /* the light thrown onto the snow */
      S.F([[x0 + wx - 1, y1 + 1], [x0 + wx + ww + 1, y1 + 1], [x0 + wx + ww + 4, y1 + 7], [x0 + wx - 3, y1 + 7]], "#FBE7AE", { w: 0 });
    }
    S.F(rect(x0 + 12, y1 - 10, x0 + 17, y1), "#3E2A1E", { w: S.Wd(0.2) });
    const roof = [[x0 - 3, y1 - h], [x0 + w / 2, y1 - h - 12], [x0 + w + 3, y1 - h]];
    const slope = [[x0 + w / 2, y1 - h - 12], [x0 + w / 2 + dx, y1 - h - 12 + dy], [x0 + w + 3 + dx, y1 - h + dy], [x0 + w + 3, y1 - h]];
    S.F(slope, "#FFFFFF", { w: 0 }); S.F(roof, C.wood, { w: 0, sh: 0.9 });
    S.H(roof, 0.2, { gap: 1, ang: 0 });
    /* the snow load: a thick white lip with a soft bulge over the eave */
    const lip = curve([[x0 - 4, y1 - h + 0.4], [x0 + 6, y1 - h + 1.8], [x0 + w / 2, y1 - h - 10.2], [x0 + w + 4, y1 - h + 1.6], [x0 + w + 4 + dx, y1 - h + dy + 1.4]], 6)
      .concat([[x0 + w / 2 + dx, y1 - h - 13 + dy], [x0 + w / 2, y1 - h - 13]]);
    S.F(lip, "#FFFFFF", { w: 0 });
    S.L(lip, S.W(0.2), { closed: true, curve: true });
    S.L([[x0, y1 - h], [x0, y1], [x0 + w, y1], [x0 + w + dx, y1 + dy], [x0 + w + dx, y1 - h + dy + 1]], S.W(0.2));
    S.L([[x0 + w, y1 - h + 1], [x0 + w, y1]], S.Wd(0.2));
    /* chimney + smoke */
    S.F(rect(x0 + w + 4, y1 - h - 14, x0 + w + 7, y1 - h - 6), "#8A5A44", { w: S.Wd(0.2) });
    S.L(curve([[x0 + w + 5.5, y1 - h - 15], [x0 + w + 3, y1 - h - 20], [x0 + w + 7, y1 - h - 25], [x0 + w + 4, y1 - h - 31]], 6), S.Wd(0.4), { taper: [1, 0.2] });
    /* near pines, deep in snow, framing the cabin */
    for (const [x, y, h] of [[30, 86, 40], [44, 80, 26], [124, 84, 34], [138, 88, 44], [10, 92, 30]]) {
      S.pine(x, y, h, 0.08, { fill: C.pine });
      /* snow rests on the TOP of each tier: a white lip, open below */
      for (let i = 2; i < 8; i++) { const ty = y - h + h * 0.86 * (i / 9), hw = h * 0.27 * Math.pow(i / 9, 0.85), sx = x - hw * 0.15;
        const lip = curve([[sx - hw * 0.75, ty + h * 0.03], [sx - hw * 0.2, ty - h * 0.012], [sx + hw * 0.5, ty + h * 0.02]], 4);
        S.F(lip.concat(lip.slice().reverse().map(([a, b]) => [a, b + h * 0.016])), "#FFFFFF", { w: 0 });
        S.L(lip, S.Wt(0.08) * 1.2); }
    }
    /* the path to the door, trodden */
    S.L(curve([[78, 76], [76, 84], [70, 92], [64, 104]], 6), S.Wt(0.1) * 1.4);
    S.L(curve([[84, 76], [86, 84], [88, 92], [92, 104]], 6), S.Wt(0.1) * 1.4);
    for (let i = 0; i < 40; i++) S.F(ov(rnd() * 160, rnd() * 50, 0.35, 0.35, 0, 360, 6), "#FFFFFF", { w: S.Wt(0.6) });
  };

  /* ── 8 · the big tree on a hill: one near tree at full fidelity ───────── */
  D.bigtree = (S) => {
    const C = { far: "#B6C4A6", hill: "#A9C27C", leaf: "#5F8446", bark: "#5E4634", bench: "#B07A48" };
    S.panel(0, 0, 160, 100, "#F2F5EC");
    S.hill([[-4, 60], [36, 52], [80, 58], [120, 50], [164, 56]], 80, 0.85, C.far, { contours: 1 });
    S.treeline(110, 162, 54, 4, 0.75, { round: true, step: 2 });
    S.cloud(30, 22, 22, 0.8);
    const hill = S.hill([[-4, 88], [30, 72], [74, 66], [116, 74], [164, 90]], 104, 0.1, C.hill, { contours: 3, step: 3 });
    /* the oak: huge, leaning, crown wider than tall, limbs reaching out */
    const tx = 70, ty = yAt(hill, 70) + 1;
    S.tree(tx, ty, 62, 0, { lean: 0.06, rx: 0.62, ry: 0.36, cy: 0.66, tw: 6.4, leaf: C.leaf, bark: C.bark, limbs: [-1.1, -0.4, 0.5, 1.1], lobes: 14 });
    /* cast shadow on the grass to the right (light from upper left) */
    const sh = ov(tx + 20, ty + 2.4, 30, 3.2, 0, 360, 30);
    S.F(sh, mix(C.hill, "#000000", 0.18), { w: 0 });
    S.H(sh, 0, { gap: 1.1, ang: 10 });
    /* a bench under it, mid-ground scale */
    const bx = 94, by = yAt(hill, 94) + 0.6;
    S.F(rect(bx, by - 4.4, bx + 12, by - 3.6), C.bench, { w: S.Wd(0.15) });
    S.F(rect(bx, by - 7.6, bx + 12, by - 6.6), C.bench, { w: S.Wd(0.15) });
    for (const x of [1, 11]) S.L([[bx + x, by - 7.6], [bx + x, by]], S.Wd(0.15));
    for (const [x, y, n] of [[20, 94, 6], [40, 86, 5], [128, 90, 6], [146, 96, 6], [110, 98, 4]]) S.grass(x, y, n, 4.4, 0.05);
    for (let i = 0; i < 12; i++) { const x = 20 + rnd() * 120, y = yAt(hill, x) + 4 + rnd() * 18; S.F(ov(x, y, 0.7, 0.5), "#FFFFFF", { w: S.Wt(0.1) }); }
    S.birds([[118, 26, 1.8], [126, 30, 1.2]], 0.5);
  };

  /* ── 9 · waterfall in a gorge: falling water + rock ───────────────────── */
  D.waterfall = (S) => {
    const C = { rock: "#8E8678", rockD: "#6F675C", fall: "#DCEBF0", pool: "#8FB9C4", moss: "#7F9B5C", pine: "#45624A" };
    S.panel(0, 0, 160, 100, "#EEF3F1");
    S.treeline(-2, 162, 22, 8, 0.8, { fill: C.pine });
    /* the lip the river comes over */
    const lip = [56, 22, 104, 22];
    /* the fall: a band narrowing slightly, white, ruled by long broken verticals */
    const fall = curve([[58, 22], [60, 50], [62, 76]], 6).concat(curve([[100, 76], [101, 50], [102, 22]], 6));
    S.F(fall, C.fall, { w: 0 });
    for (let i = 0; i < 26; i++) {
      const f = i / 25, xt = lerp(58, 102, f), xb = lerp(62, 100, f);
      let y = 22 + rnd() * 4;
      while (y < 74) { const L = 4 + rnd() * 10, e = Math.min(74, y + L); S.L([[lerp(xt, xb, (y - 22) / 54), y], [lerp(xt, xb, (e - 22) / 54), e]], S.Wt(0.3) * (0.8 + rnd() * 0.6), { taper: [0.3, 0.6] }); y = e + 1 + rnd() * 4; }
    }
    /* cliffs both sides: big blocky masses, stacked, darker at the back */
    const cliffL = [[-4, 14], [20, 12], [40, 16], [58, 22], [60, 50], [62, 78], [40, 84], [-4, 86]];
    const cliffR = [[102, 22], [124, 14], [146, 12], [164, 16], [164, 86], [124, 84], [100, 78], [101, 50]];
    for (const [cl, s] of [[cliffL, -1], [cliffR, 1]]) {
      S.F(cl, C.rock, { w: 0 });
      /* a cliff is JOINTED: tall slabs split by vertical joints, each with its
         own shaded side, broken by a few short horizontal cracks. Even rows of
         ledges read as a layer cake, short ledges with shade read as eyebrows */
      const xa = s < 0 ? -6 : 100, xb = s < 0 ? 62 : 166;
      for (let x = xa; x < xb;) {
        const w = rnd() < 0.3 ? 16 + rnd() * 8 : 5 + rnd() * 8, e = Math.min(x + w, xb), yt = (s < 0 ? lerp(14, 22, (x - xa) / (xb - xa)) : lerp(22, 13, (x - xa) / (xb - xa))) + rnd() * 3;
        const yb = 84 + rnd() * 3, step = rnd() < 0.4 ? 6 + rnd() * 10 : 0;
        /* tops are flat-ish and angular, some slabs stepped back (lower) */
        const T = yt + step;
        const slab = [[x, yb], [x + jit(1), lerp(T, yb, 0.5)], [x, T + 2], [x + w * 0.35, T + rnd() * 1.2], [x + w * 0.7, T + 0.6 + rnd() * 1.6], [e, T + 2.4 + rnd() * 2], [e + jit(0.8), lerp(T, yb, 0.55)], [e, yb]];
        S.rock(slab, 0.25, s < 0 ? C.rock : mix(C.rock, "#FFFFFF", 0.12), { cracks: 0, depth: 0.32, gap: 1.3, raw: true });
        for (let c = 0; c < 2; c++) { const cy = yt + 8 + rnd() * (yb - yt - 14), cx = x + rnd() * w * 0.5; S.L(jag([[cx, cy], [cx + w * (0.3 + rnd() * 0.3), cy + jit(1.4)]], 0.15, 2), S.Wt(0.25) * 1.3); }
        x = e;
      }
      /* the face turned from the light: a band of tone at the gorge edge */
      const gorge = s < 0 ? [[38, 16], [58, 22], [60, 50], [62, 78], [48, 82], [44, 50]] : [[102, 22], [114, 18], [112, 50], [112, 80], [100, 78], [101, 50]];
      S.H(gorge, 0.3, { gap: s < 0 ? 1.4 : 2.2, ang: 64, rag: 2 });
      S.L(cl, S.W(0.2), { closed: true });
      /* moss and small trees on top */
      for (const x of s < 0 ? [8, 20, 32] : [118, 134, 150]) S.pine(x, s < 0 ? 15 : 14, 12 + rnd() * 6, 0.45, { fill: C.pine });
    }
    S.L([[lip[0], lip[1]], [lip[2], lip[3]]], S.Wd(0.3));
    /* the pool: foam where the water lands, ripples spreading */
    const pool = [[-4, 80], [164, 80], [164, 104], [-4, 104]];
    S.F(pool, C.pool, { w: 0 });
    S.water(pool, 82, 104, { g0: 1.4, g1: 3.6, density: 0.6 });
    /* foam: one billowing mass where the water lands, not a row of bubbles */
    const foam = [[54, 82]];
    for (let x = 56; x < 106;) { const r = 2 + rnd() * 3.6; foam.push(...ov(x + r, 79.5 - rnd() * 1.5, r, r * (0.7 + rnd() * 0.5), 180, 360, 7)); x += r * (1.2 + rnd() * 0.6); }
    foam.push([108, 82]);
    S.F(foam, "#FFFFFF", { w: 0 });
    S.L(foam.slice(1, -1), S.Wd(0.2), { curve: true });
    for (let i = 0; i < 8; i++) { const x = 60 + rnd() * 40; S.L(ov(x, 77 - rnd() * 3, 1.2, 0.8, 200, 340, 5), S.Wt(0.2) * 1.3, { curve: true }); }
    /* boulders in the pool, front */
    S.rock([[20, 98], [24, 88], [36, 86], [44, 94], [42, 100]], 0, C.rockD);
    S.rock([[118, 100], [122, 90], [134, 90], [138, 99]], 0.05, C.rockD);
    for (const [x, y] of [[50, 86], [112, 87]]) S.L(ov(x, y, 7, 1.2, 0, 360, 20), S.Wt(0.1) * 1.3, { closed: true });
  };

  /* ── 10 · harbour: objects ON water, their reflections ────────────────── */
  D.harbour = (S) => {
    const C = { hill: "#9FB28E", water: "#A9C8D2", hullA: "#C9553F", hullB: "#3F6F8F", hullC: "#E8C25A", wood: "#7A5E46" };
    S.panel(0, 0, 160, 100, "#F2F2EC");
    const hill = S.hill([[-4, 40], [30, 30], [70, 34], [112, 26], [164, 34]], 54, 0.7, C.hill, { contours: 2 });
    /* the town climbing the hill: small houses, packed, a church tower */
    const homes = [[8, 44, 7, 5, "#E9DCC2"], [18, 46, 6, 5, "#E4B98C"], [27, 43, 8, 6, "#F0E6D2"], [38, 46, 6, 5, "#DDB0A0"], [47, 44, 7, 6, "#E9DCC2"], [60, 46, 6, 4, "#E4B98C"], [69, 42, 8, 7, "#F0E6D2"], [82, 45, 6, 5, "#DDB0A0"], [92, 43, 7, 6, "#E9DCC2"], [104, 46, 6, 5, "#F0E6D2"], [114, 44, 8, 6, "#E4B98C"], [126, 46, 6, 5, "#E9DCC2"], [136, 45, 7, 5, "#DDB0A0"], [147, 46, 6, 5, "#F0E6D2"]];
    S.F(rect(72, 26, 77, 42), S.air("#E9DCC2", 0.6), { w: S.Wd(0.6) });
    S.F([[71.4, 26], [74.5, 19], [77.6, 26]], S.air("#9C4B36", 0.6), { w: S.Wd(0.6) });
    /* the town climbs: a back row higher and smaller, a front row on the quay,
       each house its own size and roof — a row of equal tokens is a chart */
    const roofs = ["#9C4B36", "#B8623E", "#7E5A48", "#A9543C"];
    homes.forEach(([x, , w, h, c], i) => { const yy = yAt(hill, x + 3) + 8 + (i % 3) * 0.6; S.house(x + jit(1), yy, w * 0.75, h * 0.8, 0.72, { wall: c, roof: roofs[i % 4], dx: w * 0.22, rh: w * (0.25 + rnd() * 0.2), flat: i % 4 === 2, windows: [[w * 0.2, h * 0.3, w * 0.18, h * 0.25]] }); });
    homes.forEach(([x, , w, h, c], i) => { if (i % 2) return; S.house(x + 4 + jit(1.4), 46, w * (0.9 + rnd() * 0.3), h * (1 + rnd() * 0.5), 0.55, { wall: c, roof: roofs[(i + 1) % 4], dx: w * 0.3, rh: w * (0.3 + rnd() * 0.2), windows: [[w * 0.25, h * 0.35, w * 0.22, h * 0.3], [w * 0.6, h * 0.35, w * 0.22, h * 0.3]] }); });
    /* quay wall */
    const quay = [[-4, 46], [164, 46], [164, 52], [-4, 52]];
    S.F(quay, "#B9AE9C", { w: 0 });
    for (let x = -2; x < 164; x += 5) S.L([[x, 46.4], [x, 51.6]], S.Wt(0.5));
    S.L([[-4, 46], [164, 46]], S.Wd(0.5)); S.L([[-4, 52], [164, 52]], S.Wd(0.5));
    const sea = [[-4, 52], [164, 52], [164, 104], [-4, 104]];
    S.F(sea, C.water, { w: 0 });
    /* boats: hull profile + cabin + mast, each with its reflection under it */
    const boat = (x, y, L, hull, d, o) => {
      o = o || {};
      const s = L / 20;
      /* a hull is named by its SHEER: the deck line sweeps up to the bow */
      const sheer = curve([[-10, -3.4], [-3, -3], [5, -3.6], [11, -6]], 6);
      const keel = curve([[11, -6], [9.6, -2.6], [6, 0.8], [-2, 1.4], [-9, 0.6], [-10.4, -1.4]], 6);
      const hullP = sheer.concat(keel).map(([px, py]) => [x + px * s, y + py * s]);
      const refl = S.reflect(hullP, y, 0.8);
      S.F(refl, mix(hull, C.water, 0.45), { w: 0 });
      S.water(refl, y, y + 4 * s, { g0: 0.5, g1: 0.8, l0: 1.5, l1: 3, density: 0.9, w: S.Wt(d) * 1.2 });
      if (o.mast) {
        S.L([[x - s, y - 3 * s], [x - s, y - 22 * s]], S.Wd(d) * 1.1);
        S.L([[x - s, y - 22 * s], [x + 10 * s, y - 3.6 * s]], S.Wt(d));
        S.L([[x - s, y - 22 * s], [x - 9 * s, y - 3.4 * s]], S.Wt(d));
        S.L([[x - s, y + 2 * s], [x - s, y + 14 * s]], S.Wt(d), { taper: [1, 0.2] });
      }
      if (o.cabin) {
        const cab = rect(x - 4 * s, y - 7.4 * s, x + 2 * s, y - 3.2 * s);
        /* a wheelhouse: raked front, a roof that overhangs, a row of windows */
        const wh = [[x - 4.5 * s, y - 3.1 * s], [x - 4.5 * s, y - 7.4 * s], [x + 1.4 * s, y - 7.4 * s], [x + 2.8 * s, y - 3.3 * s]];
        S.F(wh, "#F4F0E6", { w: S.Wd(d) });
        S.F([[x - 5.2 * s, y - 7.4 * s], [x + 2 * s, y - 7.4 * s], [x + 2 * s, y - 8.2 * s], [x - 5.2 * s, y - 8.2 * s]], "#3F6F8F", { w: S.Wd(d) });
        for (const wx of [-3.8, -2, -0.2]) { const r = rect(x + wx * s, y - 6.6 * s, x + (wx + 1.3) * s, y - 5.2 * s); S.F(r, "#3A3530", { w: 0 }); S.H(r, d, { gap: 0.5, ang: 45, min: 0.2 }); S.L(r, S.Wt(d) * 1.2, { closed: true }); }
      }
      S.F(hullP, hull, { w: 0 });
      S.H(half(hullP, 0, 1, y - 1 * s), d, { gap: 1, ang: 30 });
      S.L(hullP, S.W(d) * 0.95, { closed: true, curve: false });
      S.L(curve([[-10, -2.2], [-3, -1.8], [5, -2.4], [10.6, -4.8]].map(([px, py]) => [x + px * s, y + py * s]), 4), S.Wt(d) * 1.4);
    };
    S.water(sea, 52, 104, { g0: 1, g1: 4.4, density: 0.45 });
    boat(36, 58, 16, C.hullB, 0.45, { mast: true });
    boat(118, 60, 18, C.hullC, 0.4, { cabin: true });
    /* the jetty: posts into the water, planks on top, running at us */
    for (let i = 0; i < 6; i++) {
      const f = i / 5, x = lerp(150, 120, f), y = lerp(102, 68, f), h = lerp(16, 6, f), w = lerp(2.2, 0.9, f);
      const p = rect(x - w / 2, y - h, x + w / 2, y + h * 0.35);
      S.F(p, C.wood, { w: S.Wd(f * 0.4) });
      S.water(rect(x - w * 1.6, y + h * 0.35, x + w * 1.6, y + h * 0.6), y + h * 0.35, y + h * 0.6, { g0: 0.5, g1: 0.6, l0: 1, l1: 1.6, density: 1 });
    }
    const deck = [[146, 88], [164, 88], [164, 92], [140, 104], [128, 104]];
    S.F([[120, 62], [124, 62], [164, 88], [164, 94], [140, 104], [128, 104]], C.wood, { w: 0 });
    for (let i = 0; i < 12; i++) { const f = i / 11; S.L([[lerp(121, 130, f), lerp(62, 104, f)], [lerp(124, 160, f), lerp(62, 92, f)]], S.Wt(0.2) * 1.2); }
    S.L([[120, 62], [124, 62], [164, 88]], S.Wd(0.2)); S.L([[120, 62], [128, 104]], S.W(0.2));
    /* the near boat, our subject: big, red, moored to the jetty */
    boat(70, 86, 46, C.hullA, 0, { cabin: true });
    S.L(curve([[92, 80], [104, 84], [126, 80]], 6), S.Wt(0) * 1.4);
    S.birds([[60, 16, 2], [68, 20, 1.4], [50, 22, 1.1]], 0.4);
  };

  const NAMES = { lake: "Mountain lake", village: "Village lane", forest: "Forest path", coast: "Lighthouse coast", fields: "Rolling fields",
    dunes: "Dunes and a caravan", snow: "Snowy cabin at dusk", bigtree: "The big tree", waterfall: "Waterfall gorge", harbour: "Harbour" };
  const SKY = { lake: "#EAF2F7", village: "#F3EBDD", forest: "#F2F3E8", coast: "#EEF4F6", fields: "#F1F2EA", dunes: "#F7EFE2", snow: "#D9D6E8",
    bigtree: "#F2F5EC", waterfall: "#EEF3F1", harbour: "#F2F2EC" };
  const SEED = { lake: 3, village: 7, forest: 11, coast: 5, fields: 13, dunes: 17, snow: 19, bigtree: 23, waterfall: 29, harbour: 31 };

  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("scene", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [80, 50], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
      const t = kit(k, { yaw: 0, pitch: 0 });
      rs = SEED[key];
      D[key](scene(t, SKY[key]));
      t.flush();
      const o = k.done();
      /* the frame is the sky panel's PROJECTED bounds: the kit maps picture
         coords through its own camera, so [0, 0, 160, 100] is not the frame.
         The panel is always the FIRST region. Not "the largest region": that
         picked a near wall running off the picture, and a far hill wider
         than the sky, as the frame. */
      const xs = o.regions[0].pts.map((p) => p[0]), ys = o.regions[0].pts.map((p) => p[1]);
      o.frame = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      return o;
    });
    out[key].clip = true;
  }
  out._keys = Object.keys(D);
  out._names = NAMES;
  out._aspect = 1.6;
  /* the scene kit itself, for other modules (src/trials.js) */
  out._scene = scene;
  out._util = { jag, crescent, runFrom, half, yAt, mix, FOOT, seed: (n) => { rs = n; } };
  return out;
})();
