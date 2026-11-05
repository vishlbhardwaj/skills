/*
 * FIVE STILL LIFES, each recreated from a photograph (Pinterest; references
 * live beside the doodles in VDL). A still life is an ARRANGEMENT — one
 * class (`object`), one light, one table — so each is a whole vignette: the
 * backdrop and the table are part of the drawing, cropped like the photo.
 *
 * LINE FIRST. `?outline=1` drops every fill, and a doodle is a line drawing
 * before it is anything else — colour is the second pass. So every value in
 * these scenes is carried TWICE: once as a fill, and once in line —
 *   - a dark material (brown glass, the mug, a black ground) is HATCHED, and
 *     cross-hatched when it is darker still;
 *   - the turn of a round body is RIBS: near-half ellipses across the
 *     crescent, so the shading bows with the surface;
 *   - a cast shadow is hatching with no outline; light through glass is the
 *     gap left in it;
 *   - surface detail (petals, seeds, drupelets, grain, folds, engraving) is
 *     drawn, never left to a colour change.
 * Hatching is QUEUED like any line, so the kit's deferred occlusion cuts it
 * by every fill authored after it: a wall hatched first stops at the drape.
 *
 * Built on Retro._kit with the camera square-on (yaw 0, pitch 0): every shape
 * is on the picture plane, x right / y down, back to front. Round things are
 * lathe profiles squashed by the scene's own `q` (its eye height).
 * Palettes are measured off each reference (lit-face probes), not recalled.
 */
window.StillLife = (function () {
  const { kit } = Retro._kit;
  const RAD = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;

  const ov = (cx, cy, rx, ry, a0, a1, n) => {
    const A0 = a0 == null ? 0 : a0, A1 = a1 == null ? 360 : a1;
    const full = Math.abs(A1 - A0) >= 360;
    const N = n || Math.max(14, Math.round(Math.abs(A1 - A0) / 7.5));
    const o = [];
    for (let i = 0; i <= (full ? N - 1 : N); i++) {
      const a = (A0 + (A1 - A0) * (i / N)) * RAD;
      o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return o;
  };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const rot = (pts, cx, cy, deg) => {
    const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
    return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  };
  /* Catmull-Rom through sparse points, so a hand path is dense and kink-free */
  const curve = (pts, n, closed) => {
    const N = n || 8, out = [];
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P.length - 2; i++) for (let j = 0; j < N; j++) {
      const t = j / N, a = P[i - 1], b = P[i], c = P[i + 1], d = P[i + 2];
      out.push([0, 1].map((k) => 0.5 * ((2 * b[k]) + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t
        + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t)));
    }
    if (!closed) out.push(pts[pts.length - 1]);
    return out;
  };
  /* a strip along a curve, w0 → w1 thick: handles, stems, pencils */
  const ribbon = (pts, w0, w1) => {
    const L = [], R = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1 == null ? w0 : w1, i / (pts.length - 1)) / 2;
      L.push([p[0] - (dy / m) * w, p[1] + (dx / m) * w]); R.push([p[0] + (dy / m) * w, p[1] - (dx / m) * w]);
    });
    return L.concat(R.reverse());
  };
  const smooth = (prof, n) => {
    const out = [], N = n || 4;
    for (let i = 0; i < prof.length - 1; i++) {
      const [h0, r0] = prof[i], [h1, r1] = prof[i + 1];
      for (let j = 0; j < N; j++) { const t = j / N, s = N === 1 ? t : t * t * (3 - 2 * t); out.push([lerp(h0, h1, t), lerp(r0, r1, s)]); }
    }
    out.push(prof[prof.length - 1]);
    return out;
  };
  const radAt = (P, h) => {
    for (let i = 0; i < P.length - 1; i++) {
      const [h0, r0] = P[i], [h1, r1] = P[i + 1];
      if ((h <= h0 && h >= h1) || (h >= h0 && h <= h1)) return lerp(r0, r1, (h - h0) / ((h1 - h0) || 1));
    }
    return P[P.length - 1][1];
  };
  /* a tiny seeded noise so repeated marks (seeds, specks) don't tile */
  let rs = 11;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };

  /* the scene: helpers bound to one rig and one eye height */
  function stage(t, q) {
    const k = t.k, pl = t.FR(0);
    const S = { t, k, q };
    const HW = () => k.TEX * 0.62;                 /* the hatch weight: under every detail */
    S.F = (pts, fill, o) => t.flat(pl, pts, fill, o);
    S.L = (pts, w, x) => t.line(pl, pts, w == null ? k.DET : w, x);
    S.panel = (x0, y0, x1, y1, fill, o) => S.F(rect(x0, y0, x1, y1), fill, { w: 0, ...(o || {}) });

    /*
     * HATCH: parallel strokes clipped to a polygon, queued as lines so later
     * fills cut them. `gap` is the value — 2.4 is a light tone, 1.2 is dark,
     * `cross` adds the second direction for the darkest things. Each stroke
     * stops a hair short of the edge, the way a pen lifts before the line.
     */
    S.hatch = (poly, o) => {
      o = o || {};
      const A = o.ang == null ? 45 : o.ang, ang = A * RAD, gap = o.gap || 1.8;
      const w = o.w == null ? HW() : o.w, inset = o.inset == null ? 0.25 : o.inset;
      const c = Math.cos(ang), s = Math.sin(ang);
      const R = poly.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
      let v0 = Infinity, v1 = -Infinity;
      for (const [, v] of R) { if (v < v0) v0 = v; if (v > v1) v1 = v; }
      const back = (u, v) => [u * c - v * s, u * s + v * c];
      for (let v = v0 + gap * 0.5; v < v1; v += gap) {
        const xs = [];
        for (let i = 0, j = R.length - 1; i < R.length; j = i++) {
          const [ui, vi] = R[i], [uj, vj] = R[j];
          if ((vi > v) !== (vj > v)) xs.push(ui + ((v - vi) * (uj - ui)) / (vj - vi));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          const ra = o.rag ? rnd() * o.rag : 0, rb = o.rag ? rnd() * o.rag : 0;
          const a = xs[i] + inset + ra, b = xs[i + 1] - inset - rb;
          if (b - a > (o.min || 0.6)) S.L([back(a, v), back(b, v)], w);
        }
      }
      if (o.cross) S.hatch(poly, { ...o, cross: false, ang: A - 90, gap: gap * (o.crossGap || 1.2) });
    };
    /*
     * FIDELITY. A picture has a focus: the subject gets the detail, the
     * mid-ground (table, cloth, a box) gets contour plus a few telling lines,
     * and the BACKGROUND gets the least — never a full-bleed tone. A wall is
     * a loose PATCH of light single-direction hatch behind the arrangement,
     * ragged at its ends so it fades instead of stopping, and it is there
     * only to throw the subject forward. Detail everywhere is noise.
     */
    S.vignette = (pts, o) => S.hatch(curve(pts, 8, true), { gap: 3.4, ang: 58, w: HW() * 0.45, rag: 10, inset: 0, ...(o || {}) });
    /*
     * The background's ONLY tone: the shadow the subject throws on it. A
     * narrow shape hugging the far side of an object from the light, hatched
     * tight — it says "wall, here, behind" and points at the subject. The
     * rest of the wall is paper.
     */
    S.wallShadow = (pts, o) => S.hatch(pts, { gap: 1.25, ang: 62, w: HW() * 0.6, rag: 1.2, inset: 0.4, ...(o || {}) });

    /*
     * A turned body from [[h, r]] (h above the foot at gy), top first.
     *   o.cres   width of the turn, as a fraction of the radius
     *   o.ribs   false to skip the rib arcs across the turn
     *   o.tone   { gap, ang, cross } — hatch the whole body (a dark material)
     *   o.hi     [hTop, hBot] the window highlight; it is cut OUT of any hatch
     *   o.bore   the inside of the mouth; o.boreTone hatches it
     */
    S.lathe = (cx, gy, prof, fill, o) => {
      o = o || {};
      const qq = o.q != null ? o.q : q;
      const P = smooth(prof, o.steps || 5);
      const top = P[0], bot = P[P.length - 1];
      const R = P.map(([h, r]) => [cx + r, gy - h]);
      const Lf = P.map(([h, r]) => [cx - r, gy - h]).reverse();
      const foot = ov(cx, gy - bot[0], bot[1], bot[1] * qq, 0, 180, 20).slice(1, -1);
      const back = o.open === false ? [] : ov(cx, gy - top[0], top[1], top[1] * qq, 180, 360, 18).slice(1, -1);
      const sil = R.concat(foot, Lf, back);
      const kk = o.cres == null ? 0.36 : o.cres;
      S.F(sil, fill, { w: 0 });
      const cres = P.map(([h, r]) => [cx + r, gy - h]).concat(P.map(([h, r]) => [cx + r * (1 - kk), gy - h]).reverse());
      if (o.shade !== false) S.F(cres, fill, { w: 0, sh: o.sh == null ? 0.74 : o.sh });
      if (o.crescTone) S.hatch(cres, o.crescTone);
      if (o.tone) S.hatch(sil, o.tone);
      /* ribs: the turn as near-half ellipses that bow with the body */
      if (o.ribs !== false) {
        const n = o.ribN || 7, a0 = Math.acos(1 - kk * 1.1) / RAD;
        for (let i = 1; i < n; i++) {
          const h = lerp(bot[0], top[0], i / n), r = radAt(P, h);
          if (r < 1.6) continue;
          S.L(ov(cx, gy - h, r, r * qq, 4, a0, 7), HW(), { curve: true });
        }
      }
      if (o.hi) {
        const [a, b] = o.hi, seg = P.filter(([h]) => h <= a && h >= b);
        if (seg.length > 2) S.F(seg.map(([h, r]) => [cx - r * 0.72, gy - h]).concat(seg.map(([h, r]) => [cx - r * 0.5, gy - h]).reverse()),
          o.hiFill || "#FFFFFF", { w: k.TEX * 0.7 });
      }
      S.L(sil, k.OUT, { closed: true, curve: true });
      if (o.open !== false) {
        const [th, tr] = P[0];
        if (o.bore) {
          const bp = ov(cx, gy - th, tr * 0.8, tr * 0.8 * qq);
          S.F(bp, o.bore, { w: k.TEX });
          if (o.boreTone) S.hatch(bp, o.boreTone);
        }
        S.L(ov(cx, gy - th, tr, tr * qq), k.DET, { closed: true, curve: true });
      }
      return { sil, P };
    };
    /* the near half of a ring round a turned body at height h */
    S.band = (cx, gy, P, h, w, qq) => {
      const r = radAt(P, h), Q = qq || q;
      S.L(ov(cx, gy - h, r, r * Q, 8, 172, 18), w == null ? k.TEX : w, { curve: true });
    };
    /*
     * A long cast shadow: the profile laid down along `dir`, the width kept
     * across it — foot at the base, mouth at the tip. In line it is HATCH
     * with no outline; the light a glass focuses is the gap left in it.
     */
    S.cast = (cx, gy, prof, fill, o) => {
      o = o || {};
      const P = smooth(prof, 4), d = o.dir || [-0.95, 0.3], Lk = o.len || 1.7, pp = o.perp || [0.3, 0.8];
      const at = (h, r) => [cx + d[0] * h * Lk + pp[0] * r, gy + d[1] * h * Lk + pp[1] * r];
      const shape = P.map(([h, r]) => at(h, r)).reverse().concat(P.map(([h, r]) => at(h, -r)));
      S.F(shape, fill, { w: 0 });
      S.hatch(shape, { gap: o.gap || 1.5, ang: o.ang == null ? 62 : o.ang, cross: o.cross });
      if (o.caustic) {
        const inner = P.filter(([h]) => h > 2 && h < P[0][0] * 0.82);
        S.F(inner.map(([h, r]) => at(h, r * 0.42)).reverse().concat(inner.map(([h, r]) => at(h, -r * 0.42))), o.caustic, { w: 0 });
      }
    };
    /*
     * A round thing: fill, the turn to lower right as a crescent AND as
     * contour arcs (the line version of the same shade), a glint.
     *   o.tone  hatch the whole body for a dark skin; the glint stays white
     */
    S.ball = (cx, cy, rx, ry, fill, o) => {
      o = o || {};
      const sil = o.sil || ov(cx, cy, rx, ry, 0, 360, 36);
      S.F(sil, fill, { w: 0 });
      if (o.shade !== false) {
        const a0 = -55, a1 = 150, n = 24, outer = [], inner = [];
        for (let i = 0; i <= n; i++) {
          const a = (a0 + (a1 - a0) * (i / n)) * RAD, f = 1 - 0.34 * Math.sin(Math.PI * i / n);
          outer.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
          inner.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
        }
        S.F(outer.concat(inner.reverse()), fill, { w: 0, sh: o.sh == null ? 0.76 : o.sh });
      }
      if (o.tone) S.hatch(sil, o.tone);
      if (o.arcs !== false && rx > 2.2) {
        const N = o.arcs || (rx > 6 ? 3 : 2);
        for (let i = 0; i < N; i++) {
          const f = 0.9 - i * 0.1, sp = 62 - i * 16;
          S.L(ov(cx, cy, rx * f, ry * f, 48 - sp, 48 + sp, 12), HW(), { curve: true });
        }
      }
      if (o.glint !== false && rx > 1.6)
        S.F(ov(cx - rx * 0.4, cy - ry * 0.42, rx * 0.16, ry * 0.12), "#FFFFFF", { w: rx > 4 ? k.TEX * 0.6 : 0 });
      S.L(sil, o.w == null ? k.OUT : o.w, { closed: true, curve: true });
      return sil;
    };
    /* a box in oblique: front, lid from above, right flank hatched */
    S.box = (x0, y0, x1, y1, dx, dy, fill, o) => {
      o = o || {};
      const front = rect(x0, y0, x1, y1);
      const top = [[x0, y0], [x1, y0], [x1 + dx, y0 + dy], [x0 + dx, y0 + dy]];
      const side = [[x1, y0], [x1 + dx, y0 + dy], [x1 + dx, y1 + dy], [x1, y1]];
      if (dy < 0) S.F(top, o.top || fill, { w: 0, sh: o.topSh == null ? 1.06 : o.topSh });
      if (dx > 0) { S.F(side, o.side || fill, { w: 0, sh: o.sideSh == null ? 0.72 : o.sideSh }); S.hatch(side, { gap: 0.9, ang: 90 }); }
      S.F(front, fill, { w: 0, sh: o.sh == null ? 1 : o.sh });
      if (o.tone) S.hatch(front, o.tone);
      const hull = dx > 0
        ? [[x0, y1], [x0, y0], [x0 + dx, y0 + dy], [x1 + dx, y0 + dy], [x1 + dx, y1 + dy], [x1, y1]]
        : [[x0, y1], [x0, y0], [x0 + dx, y0 + dy], [x1 + dx, y0 + dy], [x1, y0], [x1, y1]];
      S.L(hull, k.OUT, { closed: true });
      if (dy < 0) S.L([[x0, y0], [x1, y0]], k.DET);
      if (dx > 0) S.L([[x1, y0], [x1, y1]], k.DET);
      return front;
    };
    /*
     * A petal or leaf from its base along `ang`.
     *   o.veins  n veins fanning from the base — the line that says "petal"
     *   o.shade  a darker fill on one half, HATCHED as well
     *   o.rib    a midrib — the line that says "leaf"
     */
    S.blade = (bx, by, len, wid, ang, fill, o) => {
      o = o || {};
      const pts = [], n = 22, tip = o.tip == null ? 0.5 : o.tip;
      for (let i = 0; i <= n; i++) {
        const u = i / n, w = Math.pow(Math.sin(Math.PI * Math.pow(u, tip / 0.5 * 0.7 + 0.3)), 0.8) * wid / 2;
        pts.push([u * len, w]);
      }
      const c = Math.cos(ang * RAD), s = Math.sin(ang * RAD);
      const X = ([x, y]) => [bx + x * c - y * s, by + x * s + y * c];
      const sh = pts.concat(pts.slice(1, -1).reverse().map(([x, y]) => [x, -y])).map(X);
      S.F(sh, fill, { w: 0, sh: o.sh });
      if (o.shade) {
        const lo = pts.concat(pts.slice().reverse().map(([x, y]) => [x, y * 0.35])).map(X);
        S.F(lo, fill, { w: 0, sh: o.shade });
        S.hatch(lo, { gap: o.hatchGap || 1.1, ang: ang + 60 });
      }
      if (o.veins) {
        for (let i = 0; i < o.veins; i++) {
          const f = (i / (o.veins - 1)) * 2 - 1;
          S.L(curve([[len * 0.06, 0], [len * 0.4, f * wid * 0.22], [len * 0.74, f * wid * 0.3]].map(X), 4), HW(), { curve: true });
        }
      }
      S.L(sh, o.w == null ? k.DET : o.w, { closed: true, curve: true });
      if (o.rib) S.L([X([len * 0.06, 0]), X([len * 0.88, 0])], k.TEX * 0.7);
      return sh;
    };
    return S;
  }

  const D = {};

  /* ── 1 · sun through glass bottles ───────────────────────────────────── */
  /*
   * Four bottles on a pale table in hard low sun, seen from above. The tone
   * ladder in line: green flask light (ribs only), clear bottle white, amber
   * jar hatched, brown bottle cross-hatched. The shadows are the drawing.
   */
  D.bottles = (S) => {
    const C = { table: "#DCE6E6", green: "#8FC598", greenD: "#3F7D55", clear: "#DCE8DE", amber: "#B8692C",
      amberIn: "#E7A962", brown: "#3B2016", brownIn: "#7A4426",
      shG: "#9FB2AC", shC: "#AEBBBA", shA: "#C9A27A", shB: "#8E817A", caA: "#F2D6A8", caG: "#C9E2CF" };
    const k = S.k;
    S.panel(0, 0, 100, 100, C.table);
    const flask = [[31.5, 3.3], [30.2, 3.4], [29.6, 2.6], [26, 2.5], [23.5, 4.2], [20, 9.6], [16, 13.2], [11, 14], [6, 12.6], [2, 9.2], [0, 7]];
    const clear = [[28.5, 4.6], [27.3, 4.6], [26.8, 3.3], [24, 3.0], [21, 3.6], [18.5, 6.2], [15.5, 7], [2, 7], [0, 6.6]];
    const jar = [[28, 9.8], [26.4, 10], [25.8, 9], [24.4, 9.8], [22.4, 12.2], [19, 12.8], [3, 12.6], [0, 11.6]];
    const small = [[16, 5.8], [14.8, 6], [14.2, 4.8], [12.6, 5.4], [10.6, 7.1], [2, 7.1], [0, 6.6]];
    S.cast(41, 37, flask, C.shG, { len: 1.15, caustic: C.caG, gap: 1.7 });
    S.cast(60.5, 48.5, clear, C.shC, { len: 1.7, gap: 1.7 });
    S.cast(75.5, 64.5, jar, C.shA, { len: 1.8, caustic: C.caA, gap: 1.6 });
    S.cast(89, 76.5, small, C.shB, { len: 1.9, gap: 1.2, cross: true });
    /* the flask's handle springs from the neck and lands on the shoulder */
    const h = ribbon(curve([[39.2, 9.4], [34.5, 8.6], [32.6, 11.4], [33.6, 15.2], [36.4, 17.6]], 6), 2.0, 2.4);
    S.F(h, C.green, { w: k.OUT });
    S.L(curve([[38.6, 10.4], [35, 10], [34, 12.4], [35.2, 15.4]], 5), k.TEX * 0.6);
    const g = S.lathe(41, 37, flask, C.green, { hi: [22, 6], bore: C.greenD, cres: 0.32 });
    /* the interior: the far wall seen through the near one, darker */
    const inner = curve([[38, 28.5], [46, 24.6], [52.4, 25.6], [51.6, 30.6], [45, 33.4]], 6, true);
    S.F(inner, C.greenD, { w: 0, sh: 1.25 });
    S.hatch(inner, { gap: 1.3, ang: 30 });
    S.L(curve([[38, 28.5], [46, 24.6], [52.4, 25.6]], 6), k.TEX);
    /* the glass's thickness at the neck: two reflections running down it */
    S.L([[39.6, 9.6], [39.8, 13.4]], k.TEX * 0.7); S.L([[42.6, 9.6], [42.4, 13]], k.TEX * 0.7);
    S.band(41, 37, g.P, 29.6, k.DET);
    const c = S.lathe(60.5, 48.5, clear, C.clear, { sh: 0.86, bore: "#C3D3C6", hi: [15, 2], cres: 0.22, ribN: 8 });
    for (const f of [-0.75, -0.4, 0, 0.4, 0.75]) S.L([[60.5 + f * 7, 48.5 - 15], [60.5 + f * 7, 48.5 - 1.6 + Math.sqrt(1 - f * f) * 7 * S.q * 0.9]], k.TEX);
    S.band(60.5, 48.5, c.P, 26.8, k.DET);
    S.band(60.5, 48.5, c.P, 15.5, k.TEX);
    const j = S.lathe(75.5, 64.5, jar, C.amber, { sh: 0.72, bore: C.amberIn, hi: [20, 4], cres: 0.3, tone: { gap: 2.0, ang: 78 } });
    S.band(75.5, 64.5, j.P, 25.8, k.DET);
    S.band(75.5, 64.5, j.P, 22.4, k.TEX);
    const b = S.lathe(89, 76.5, small, C.brown, { sh: 0.8, bore: C.brownIn, hi: [10, 2], hiFill: "#C9A08C",
      tone: { gap: 1.1, ang: 70, cross: true }, ribs: false });
    S.band(89, 76.5, b.P, 14.2, k.DET);
  };

  /* ── 2 · roses, fruit and a tipped glass on a pink drape ─────────────── */
  D.roses = (S) => {
    const C = { wall: "#4A4251", drape: "#E59D95", leaf: "#8FA290",
      pink: "#F0A39A", deep: "#E07C74", cream: "#F4D9C8", pale: "#F5BFB6", vase: "#E2CDAA",
      apple: "#CC443F", pear: "#F1B251", blush: "#E58B3A", rind: "#EE8A2E", flesh: "#F7B04A",
      black: "#2B2232", drup: "#5A4A63", blue: "#4B4E66", straw: "#D5532F", calyx: "#5E7A4A", bowl: "#E9C7BE" };
    const k = S.k;
    /* the dark wall: the darkest value in the picture, so cross-hatched;
       the drape laid over it afterwards cuts the hatching off at its edge */
    S.panel(0, 0, 100, 150, C.wall);
    S.wallShadow(curve([[29, 52], [34, 44], [41, 40], [44, 50], [42, 64], [36, 70], [30, 66]], 6, true));
    const edge = curve([[0, 97], [22, 92], [44, 86], [58, 70], [64, 40], [67, 0]], 8);
    S.F(edge.concat([[100, 0], [100, 150], [0, 150]]), C.drape, { w: 0 });
    S.L(edge, k.DET);
    /* the hanging fold, a shade darker, and the table fold in front */
    const hang = curve([[74, 0], [80, 30], [86, 60], [92, 84]], 8).concat(curve([[98, 80], [94, 50], [90, 20], [88, 0]], 8));
    S.F(hang, C.drape, { w: 0, sh: 0.93 });
    S.L(curve([[74, 0], [80, 30], [86, 60], [92, 84]], 8), k.TEX);
    S.L(curve([[88, 0], [90, 20], [94, 50], [98, 80]], 8), k.TEX);
    const low = curve([[0, 122], [30, 118], [60, 128], [100, 124]], 8);
    S.F(low.concat([[100, 150], [0, 150]]), C.drape, { w: 0, sh: 0.9 });
    S.L(low, k.TEX);
    /* the satin's folds: long, tapering, running with the fall of the cloth */
    for (const f of [[[2, 104], [20, 108], [36, 118], [44, 126]], [[52, 136], [72, 130], [96, 134]], [[78, 2], [83, 26], [90, 52]]])
      S.L(curve(f, 8), k.TEX * 0.6, { curve: true, taper: [1, 0.3] });
    /* eucalyptus behind the heads: coin leaves paired up a wiry stem */
    const sprig = (pts, n, r) => {
      const s = curve(pts, 10);
      S.L(s, k.TEX);
      for (let i = 1; i <= n; i++) {
        const p = s[Math.round((i / (n + 1)) * (s.length - 1))];
        const sgn = i % 2 ? 1 : -1, x = p[0] + sgn * r * 0.9, y = p[1] - r * 0.2;
        S.ball(x, y, r, r * 0.7, C.leaf, { w: k.DET, glint: false, sh: 0.8, arcs: 1, tone: i % 3 === 0 ? { gap: 0.9, ang: 30 } : null });
        S.L([[x - r * 0.75 * sgn, y + r * 0.1], [x + r * 0.6 * sgn, y - r * 0.15]], k.TEX * 0.6);
      }
    };
    sprig([[50, 46], [49, 36], [50, 26], [52, 20]], 5, 3.0);
    sprig([[40, 52], [37, 44], [35, 38]], 3, 2.4);
    sprig([[82, 40], [86, 30], [91, 22], [94, 18]], 5, 3.0);
    sprig([[66, 64], [76, 66], [88, 62]], 3, 2.8);
    /* the vase: faceted glass; the stems show through it, and the water */
    const vp = [[26, 5.4], [24.5, 5.8], [20, 6.6], [10, 8], [2, 9.2], [0, 9.0]];
    const v = S.lathe(62, 95, vp, C.vase, { q: 0.28, sh: 0.82, hi: [22, 3], cres: 0.3, ribN: 7 });
    for (const f of [-0.6, -0.2, 0.2, 0.6]) S.L([[62 + f * 6, 95 - 24], [62 + f * 9, 95 - 0.5]], k.TEX);
    for (const [x0, x1] of [[60, 57.4], [63, 64.6], [61.4, 62]]) S.L(curve([[x0, 95 - 25], [lerp(x0, x1, 0.5), 95 - 14], [x1, 95 - 3]], 4), k.TEX * 0.8);
    S.band(62, 95, v.P, 15, k.TEX, 0.28);
    S.L([[62 - 5, 95 - 26], [64, 52]], k.DET * 1.1); S.L([[62 + 3, 95 - 26], [70, 54]], k.DET * 1.1);
    /*
     * A garden rose: a scalloped ball; round it the open outer petals, each
     * its own cupped lip; inside, the tight centre spiralling in. The petals
     * are the drawing — without them it is a cabbage, or a circle.
     */
    const rose = (cx, cy, r, fill) => {
      const sil = [], ph = r * 1.7;
      for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; const rr = r * (1 + 0.07 * Math.sin(a * 6 + ph)); sil.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86]); }
      S.ball(cx, cy, r, r * 0.86, fill, { sil, glint: false, sh: 0.82, arcs: 2 });
      /* outer petals: six cupped lips, alternating in and out */
      for (let ring = 0; ring < 2; ring++) {
        const n = ring ? 4 : 5, R0 = ring ? 0.56 : 0.8;
        for (let i = 0; i < n; i++) {
          const a = (i * 360) / n + ph * 20 + ring * 36;
          /* a petal lip: an arc concave to the centre, its ends tucked in */
          const pts = [];
          for (let j = 0; j <= 10; j++) {
            const u = j / 10, aa = (a - 34 + u * 68) * RAD, rr = r * R0 * (1 - 0.16 * Math.pow(2 * u - 1, 2));
            pts.push([cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr * 0.86]);
          }
          S.L(pts, k.DET * 0.8, { curve: true });
        }
      }
      /* the cup and its spiral */
      S.L(ov(cx + r * 0.04, cy - r * 0.06, r * 0.46, r * 0.34, 200, 520, 26), k.DET * 0.9, { curve: true });
      const sp = [];
      for (let i = 0; i <= 30; i++) { const a = (i / 30) * 4.2 * Math.PI + ph, rr = r * 0.36 * (1 - i / 34); sp.push([cx + r * 0.05 + Math.cos(a) * rr, cy - r * 0.08 + Math.sin(a) * rr * 0.72]); }
      S.L(sp, k.TEX, { curve: true });
      /* the shadowed throat of the cup */
      S.hatch(ov(cx + r * 0.06, cy - r * 0.02, r * 0.2, r * 0.13), { gap: 0.55, ang: 40, w: k.TEX * 0.5, min: 0.2 });
    };
    rose(76, 41, 6.6, C.pale); rose(48, 45, 6.8, C.deep); rose(62, 41, 8.8, C.cream);
    rose(87, 47, 9.2, C.pale); rose(37, 57, 7.6, C.pale); rose(48, 57, 7, C.pink);
    rose(79, 59, 6.4, C.pink); rose(64, 58, 11.4, C.pink);
    rose(92, 94, 8.2, C.pale);
    /* the apple: red is a mid-dark, so hatched; the stem in its cavity */
    S.ball(76, 82, 7.6, 7.2, C.apple, { sh: 0.72, tone: { gap: 1.7, ang: 72 } });
    S.L(ov(75.6, 76.2, 2.4, 0.9, 200, 340, 8), k.TEX, { curve: true });
    S.L(curve([[75.6, 76], [75, 72.5], [74.2, 70.6]], 4), k.DET * 1.2);
    /* the pear: a long neck to a round seat, freckled */
    const pear = curve([[62.5, 89], [66.4, 86.6], [72, 92], [76.6, 101], [72.6, 108], [63.6, 107.4], [59.4, 100], [61, 93]], 6, true);
    S.ball(68.4, 100, 8, 8, C.pear, { sil: pear, sh: 0.82 });
    S.F(curve([[66.6, 101], [71, 98], [75, 103], [71.6, 106.4], [67.4, 105.6]], 5, true), C.blush, { w: 0, sh: 0.92 });
    S.hatch(curve([[66.6, 101], [71, 98], [75, 103], [71.6, 106.4], [67.4, 105.6]], 5, true), { gap: 1.3, ang: 20 });
    for (let i = 0; i < 16; i++) {
      const x = 61.5 + rnd() * 12, y = 90 + rnd() * 15;
      S.L([[x, y], [x + 0.35, y + 0.15]], k.TEX * 0.7);
    }
    S.L(curve([[63.6, 88], [61.4, 85], [59.4, 83.4]], 4), k.DET * 1.2);
    /* the orange half: rind, pith, ten segments, two pips */
    S.F(ov(83, 104, 8.6, 8.2), C.rind, { w: k.OUT });
    S.hatch(ov(83, 104, 8.6, 8.2, 270, 450).concat([[83, 112.2]]), { gap: 1.0, ang: 90, w: k.TEX * 0.5 });
    S.F(ov(82.6, 104, 7.4, 7.1), C.flesh, { w: k.DET });
    for (let i = 0; i < 10; i++) {
      const a0 = (i * 36 + 4) * RAD, a1 = (i * 36 + 32) * RAD;
      S.L([[82.6 + Math.cos(a0) * 1.1, 104 + Math.sin(a0) * 1.1], [82.6 + Math.cos(a0) * 6.3, 104 + Math.sin(a0) * 6.1],
        [82.6 + Math.cos(a1) * 6.3, 104 + Math.sin(a1) * 6.1], [82.6 + Math.cos(a1) * 1.1, 104 + Math.sin(a1) * 1.1]], k.TEX * 0.7, { curve: true });
    }
    for (const [x, y, a] of [[80.4, 106.6, 30], [85, 101.4, -40]]) S.blade(x, y, 1.6, 0.8, a, "#FBEBC6", { w: k.TEX * 0.7 });
    /* the tipped glass bowl: cut glass, a diamond lattice; its rim the open mouth */
    const bowl = ov(36, 96, 9.6, 7.4);
    S.F(bowl, C.bowl, { w: k.OUT, sh: 0.98 });
    S.hatch(bowl, { gap: 3, ang: 50, w: k.TEX * 0.45 });
    S.F(ov(45, 97, 3.4, 7.6), C.bowl, { w: k.DET, sh: 0.86 });
    S.L(ov(45, 97, 2.2, 5.4), k.TEX, { closed: true, curve: true });
    S.L(ov(30.4, 95.4, 2.2, 6.6, 100, 260, 10), k.DET, { curve: true });
    /* berries: blackberries are drupelets, blueberries a crowned dimple,
       strawberries seeded — each the mark that names it */
    const bb = (x, y, r) => {
      S.ball(x, y, r, r, C.black, { sh: 0.7, glint: false, arcs: false });
      for (const [dx, dy] of [[-0.42, -0.34], [0.12, -0.5], [0.5, -0.12], [-0.5, 0.18], [0, 0.04], [0.42, 0.4], [-0.16, 0.52]])
        S.F(ov(x + dx * r, y + dy * r, r * 0.27, r * 0.27, 0, 360, 10), C.drup, { w: k.TEX * 0.7 });
    };
    const blue = (x, y, r) => {
      S.ball(x, y, r, r * 0.92, C.blue, { sh: 0.72, arcs: false, tone: { gap: 0.75, ang: 60, min: 0.2 } });
      const cy = y - r * 0.42;
      S.F(ov(x, cy, r * 0.32, r * 0.2), "#7E809A", { w: k.TEX * 0.7 });
    };
    const straw = (x, y, s, ang) => {
      const sh = rot(curve([[x - 4 * s, y - 2.6 * s], [x + 4 * s, y - 2.6 * s], [x + 2.6 * s, y + 2.6 * s], [x, y + 5 * s], [x - 2.6 * s, y + 2.6 * s]], 5, true), x, y, ang);
      S.ball(x, y, 4 * s, 4 * s, C.straw, { sil: sh, sh: 0.78, arcs: false });
      for (const [dx, dy] of [[-2.2, -1], [-0.6, -1.2], [1, -1.4], [2.4, -0.8], [-1.6, 0.6], [0.2, 0.4], [1.8, 0.6], [-0.8, 2], [0.8, 2.2], [0, 3.6]]) {
        const [px, py] = rot([[x + dx * s, y + dy * s]], x, y, ang)[0];
        S.F(ov(px, py, 0.28 * s, 0.42 * s, 0, 360, 8), "#F4D27A", { w: k.TEX * 0.5 });
      }
      const top = rot([[x, y - 2.8 * s]], x, y, ang)[0];
      for (const a of [-160, -120, -80, -40, -10]) S.blade(top[0], top[1], 3.2 * s, 1.4 * s, a + ang, C.calyx, { w: k.TEX, rib: true });
    };
    bb(31.6, 92.4, 3.2); straw(38.6, 96.6, 0.85, -20); bb(33, 99.4, 3.4); blue(27.6, 99.6, 1.8); blue(29.4, 104, 1.7);
    bb(38.6, 102.6, 3.2); blue(44, 102, 1.6);
    straw(19, 110, 1, 15);
    bb(56, 99, 3.0); bb(60.6, 102.6, 2.6); blue(50.6, 107, 1.8);
    blue(62.6, 109.6, 1.7); blue(72.6, 110.6, 1.7); blue(64.6, 116.4, 1.8); blue(73, 116, 1.8);
    blue(39.4, 122, 1.8); blue(63, 123, 1.8);
    straw(69, 110.8, 0.45, 40);
    /* where each loose berry meets the satin: a short shadow tick */
    for (const [x, y] of [[62.6, 111.6], [72.6, 112.6], [64.6, 118.4], [73, 118], [39.4, 124], [63, 125], [50.6, 109]])
      S.L([[x - 1.2, y + 0.2], [x + 2, y + 0.2]], k.TEX * 0.8);
  };

  /* ── 3 · a single orchid in a bud vase, on black ─────────────────────── */
  D.orchid = (S) => {
    const C = { bg: "#0D0D0D", petal: "#EDEDED", vase: "#ABABAB", stem: "#8C8C8C", lip: "#F2F2F2", spot: "#3A3A3A" };
    const k = S.k;
    /* black ground: in line it is a dense cross-hatch, cut away by the
       flowers and the vase as they are laid over it */
    S.panel(0, 0, 68, 104, C.bg);
    S.vignette([[10, 8], [40, 2], [62, 10], [58, 50], [56, 96], [36, 102], [16, 96], [12, 60], [4, 34]], { gap: 2.2, w: k.TEX * 0.4, rag: 12 });
    const stem = curve([[33.4, 63], [32.6, 54], [31.8, 44], [31.6, 36], [33, 28], [36, 22]], 8);
    S.F(ribbon(stem, 1.3, 1.0), C.stem, { w: k.TEX });
    S.F(ribbon(curve([[33.4, 30], [40, 22], [46, 15], [50, 10]], 6), 0.9, 0.7), C.stem, { w: k.TEX });
    /* the node where the stem was cut back — a small sheath */
    S.blade(32.4, 50, 3.2, 1.8, -100, C.stem, { w: k.TEX });
    S.ball(50.4, 9.8, 4.2, 3.4, C.vase, { sh: 0.64, glint: false, arcs: 2 });
    S.L(curve([[48, 7.6], [50.4, 8.8], [52.8, 7.4]], 4), k.TEX * 0.7);
    S.ball(46.8, 5.4, 2.0, 1.6, C.vase, { sh: 0.7, glint: false });
    S.ball(53.8, 4.4, 1.6, 1.4, C.vase, { sh: 0.7, glint: false });
    S.F(ribbon(curve([[33.2, 28], [36, 23], [39, 18]], 5), 0.9, 0.7), C.stem, { w: k.TEX });
    S.F(ribbon(curve([[31.7, 42], [27, 41.4], [21, 38]], 5), 0.9, 0.7), C.stem, { w: k.TEX });
    /*
     * A moth orchid: three sepals (top, two below), two broad round petals
     * to the sides, the lip folded in the middle, spotted. In line, each
     * petal is its veins plus a hatched half where it turns away.
     */
    const flower = (cx, cy, s, ang) => {
      const B = (a, len, wid, o) => S.blade(cx, cy, len * s, wid * s, a + ang, C.petal, { shade: 0.8, tip: 0.6, veins: 5, ...(o || {}) });
      B(-95, 11, 8.5); B(55, 10.5, 6.5); B(125, 10.5, 6.5);
      B(-20, 11, 11, { tip: 0.42, veins: 7 }); B(200, 11, 11, { tip: 0.42, veins: 7 });
      const lip = curve([[cx - 2.2 * s, cy - 1.2 * s], [cx + 2.2 * s, cy - 1.2 * s], [cx + 2.8 * s, cy + 2.6 * s], [cx, cy + 4.6 * s], [cx - 2.8 * s, cy + 2.6 * s]], 5, true);
      S.F(rot(lip, cx, cy, ang), C.lip, { w: k.DET });
      /* the lip's two side lobes curl up: a crease each side */
      S.L(rot(curve([[cx - 1.8 * s, cy], [cx - 1 * s, cy + 2 * s], [cx, cy + 3.6 * s]], 4), cx, cy, ang), k.TEX * 0.7);
      S.L(rot(curve([[cx + 1.8 * s, cy], [cx + 1 * s, cy + 2 * s], [cx, cy + 3.6 * s]], 4), cx, cy, ang), k.TEX * 0.7);
      for (const [dx, dy] of [[-1.2, 0.4], [0.6, 0.2], [1.4, 1.4], [-0.6, 1.8], [0.2, 3], [-1.6, 2.6], [1, 2.6], [-0.2, 1], [0.6, 3.8], [-1, 3.4]]) {
        const [px, py] = rot([[cx + dx * s, cy + dy * s]], cx, cy, ang)[0];
        S.F(ov(px, py, 0.3 * s, 0.26 * s, 0, 360, 8), C.spot, { w: k.TEX * 0.6 });
      }
      S.F(ov(cx, cy - 1.6 * s, 1.1 * s, 0.9 * s), C.vase, { w: k.TEX });
    };
    flower(39, 18, 1.4, 8);
    flower(21, 38, 1.5, -14);
    /* the vase: thrown, narrow neck to a low belly; throwing rings round it */
    const vp = [[38.5, 6.2], [37.6, 6.3], [36.4, 5.2], [31, 4.5], [24, 6.2], [15, 10.6], [7, 13.2], [2, 12.8], [0, 12]];
    const v = S.lathe(36, 101.5, vp, C.vase, { q: 0.2, sh: 0.62, cres: 0.42, bore: "#5E5E5E", boreTone: { gap: 0.7, ang: 0 },
      hi: [26, 6], hiFill: "#D6D6D6", crescTone: { gap: 1.1, ang: 70 } });
    for (let h = 4; h < 34; h += 3.2) S.band(36, 101.5, v.P, h, k.TEX * 0.8, 0.2);
  };

  /* ── 4 · tea by the window: mug, books, candles, reading glasses ─────── */
  D.tea = (S) => {
    const C = { glow: "#F7DCC4", sill: "#F2E6DA", wall: "#C9A08A", table: "#34444C",
      mug: "#33505E", bookA: "#8D766C", pages: "#EEE6DA", bookB: "#B9A08E", pot: "#3E3B3D",
      wax: "#F1E2CC", flame: "#F6C35A", glass: "#E6D2BE", tag: "#FBF8F2", cover: "#4F6F7A" };
    const k = S.k;
    /* the window: bright, so almost no line — just the mullion */
    S.panel(0, 0, 67, 42, C.glow);
    S.L([[22, 0], [22, 41]], k.TEX * 0.6); S.L([[23.2, 0], [23.2, 41]], k.TEX * 0.6);
    S.panel(0, 41, 67, 43.6, C.sill);
    S.L([[0, 41], [67, 41]], k.DET); S.L([[0, 43.6], [67, 43.6]], k.DET);
    /* the wall under the sill: a light, warm half-tone */
    S.panel(0, 43.6, 67, 88, C.wall);
    S.wallShadow([[57.4, 44], [61.6, 46], [62.6, 85.4], [57.4, 85.4]]);
    /* the table: dark planks, cross-hatched, the seams between */
    const tab = [[0, 87], [67, 85], [67, 100], [0, 100]];
    S.F(tab, C.table, { w: 0 });
    S.hatch(tab, { gap: 2.2, ang: 20, w: k.TEX * 0.45, rag: 3 });
    S.L([[0, 87], [67, 85]], k.DET);
    for (const y of [91, 95.5]) S.L([[0, y + 0.6], [67, y - 1]], k.TEX);
    /* the books standing at the back: one spine-out, one page-edge out */
    S.box(36.4, 37, 45.6, 86, 1.6, -1.2, C.bookA, { sideSh: 0.7 });
    for (const y of [41, 43, 78, 80]) S.L([[36.4, y], [45.6, y]], k.TEX);
    S.box(46.2, 36, 57.4, 86, 0, -1.4, C.pages, { top: C.bookB });
    S.F(rect(46.2, 36, 47.4, 86), C.bookB, { w: k.TEX });
    S.F(rect(56.4, 36, 57.6, 86), C.bookB, { w: k.TEX });
    for (let x = 48.4; x < 56; x += 1.3) S.L([[x, 37.4], [x, 85]], k.TEX * 0.6);
    /* a dark teapot behind the mug */
    S.F(ribbon(curve([[30, 63], [33.4, 61.8], [34.6, 66], [32, 70]], 5), 1.4), C.pot, { w: k.DET });
    S.lathe(25, 86, [[25, 4.6], [23.8, 4.8], [20, 5.2], [4, 5.4], [0, 5.2]], C.pot, { q: 0.18, sh: 0.7, bore: "#1E1C1D",
      tone: { gap: 1.7, ang: 75, w: k.TEX * 0.45 }, ribs: false });
    /* candles: pillars and a tealight in a glass */
    const flame = (x, y, s) => {
      S.F(curve([[x, y - 4 * s], [x + 1.3 * s, y - 0.6 * s], [x, y + 1 * s], [x - 1.3 * s, y - 0.6 * s]], 5, true), C.flame, { w: k.DET });
      S.F(curve([[x, y - 2 * s], [x + 0.6 * s, y - 0.2 * s], [x, y + 0.6 * s], [x - 0.6 * s, y - 0.2 * s]], 4, true), "#FFF6DA", { w: k.TEX * 0.6 });
      S.L([[x, y + 0.4 * s], [x, y + 1.8 * s]], k.TEX);
      /* the glow: a few short radiating ticks */
      for (const a of [-150, -120, -60, -30]) S.L([[x + Math.cos(a * RAD) * 3.2 * s, y - 1.4 * s + Math.sin(a * RAD) * 3.6 * s], [x + Math.cos(a * RAD) * 4.4 * s, y - 1.4 * s + Math.sin(a * RAD) * 5 * s]], k.TEX * 0.5);
    };
    const pillar = (x, h, r) => {
      const c = S.lathe(x, 86, [[h, r], [0, r]], C.wax, { q: 0.2, sh: 0.86, bore: "#E8D3B8", ribN: 7 });
      /* the melted dip and a run of wax down the side */
      S.L(curve([[x + r * 0.6, 86 - h + 0.6], [x + r * 0.7, 86 - h + 3], [x + r * 0.62, 86 - h + 5]], 4), k.TEX * 0.8);
      return c;
    };
    pillar(3.2, 17, 3.6); flame(3.2, 65.6, 1);
    pillar(12, 16, 4); flame(12, 66.6, 1.1);
    S.lathe(17.6, 86.6, [[10, 5.2], [9, 5.4], [0, 5]], C.glass, { q: 0.2, sh: 0.86, bore: "#F6E8D2", ribN: 5 });
    S.L([[14.2, 78.4], [14.4, 84.4]], k.TEX * 0.6); S.L([[15.4, 78], [15.6, 84.8]], k.TEX * 0.6);
    flame(18, 75, 0.9);
    /* the mug: blue enamel, hatched; tea in it cross-hatched; a tag over the rim */
    const handle = ribbon(curve([[25.2, 71], [21.4, 71.2], [20.8, 78], [23.6, 84.6], [26.4, 86]], 6), 2.2, 2.6);
    S.F(handle, C.mug, { w: k.OUT, sh: 0.86 });
    S.hatch(handle, { gap: 1.0, ang: 80 });
    S.lathe(34.2, 91.6, [[24, 10.4], [23, 10.4], [3, 9.6], [0, 9.2]], C.mug, { q: 0.2, sh: 0.72, bore: "#1F2E35",
      boreTone: { gap: 0.8, ang: 0, cross: true }, hi: [20, 4], hiFill: "#5E7C88", tone: { gap: 1.5, ang: 82 } });
    S.L(curve([[40.8, 67.8], [41.4, 74], [41.2, 82], [41.6, 86.4]], 5), k.TEX);
    S.F(rect(39.6, 86.2, 43.4, 92), C.tag, { w: k.DET });
    S.L(ov(41.5, 87.6, 0.5, 0.5), k.TEX * 0.6, { closed: true });
    /* steam: three loose S-curves rising and thinning */
    for (const [x, d] of [[29, 0], [34, 1], [38.6, 0.5]])
      S.L(curve([[x, 64], [x + 1.6, 60 - d], [x - 0.8, 55], [x + 1.2, 50 - d], [x, 46]], 6), k.TEX * 0.6, { curve: true, taper: [0.9, 0.2] });
    /* the open book: cover, the page block's ruled edge, two leaves rising */
    const cov = [[42.4, 93.4], [67, 89.6], [67, 92.6], [43, 95.8]];
    S.F(cov, C.cover, { w: k.DET });
    S.hatch(cov, { gap: 0.9, ang: 80 });
    S.F([[43.4, 87.4], [67, 83.6], [67, 90], [43.6, 93.6]], C.pages, { w: 0, sh: 0.9 });
    for (let i = 1; i < 6; i++) S.L([[43.5, 87.4 + i * 1.03], [67, 83.6 + i * 1.07]], k.TEX * 0.6);
    S.F(curve([[43.4, 87.4], [46, 84.4], [51, 82.6], [55.4, 83.4]], 5).concat([[56.4, 84.6]]), C.pages, { w: 0 });
    S.F(curve([[55.4, 83.4], [59, 80.6], [63.4, 79.6], [67, 79.8]], 5).concat([[67, 83.6], [56.4, 84.6]]), C.pages, { w: 0, sh: 1.03 });
    /* a few lines of type on each leaf */
    for (let i = 0; i < 3; i++) {
      S.L([[46 + i * 0.4, 85.4 + i * 0.7], [53.6, 84.2 + i * 0.5]], k.TEX * 0.45);
      S.L([[58.4, 82.6 + i * 0.6], [65.4, 81.2 + i * 0.6]], k.TEX * 0.45);
    }
    S.L(curve([[43.4, 87.4], [46, 84.4], [51, 82.6], [55.4, 83.4], [59, 80.6], [63.4, 79.6], [67, 79.8]], 5), k.OUT);
    S.L([[43.4, 87.4], [43.6, 93.6], [67, 90]], k.OUT);
    S.L([[43.4, 87.4], [56.4, 84.6], [67, 83.6]], k.DET);
    S.L([[55.4, 83.4], [56.4, 84.6]], k.DET);
    /* reading glasses folded in front: rims, a glint in each lens */
    const lens = (cx, cy) => {
      S.L(curve([[cx - 4.4, cy - 3], [cx + 4.2, cy - 3.2], [cx + 4, cy + 2.4], [cx, cy + 4], [cx - 4, cy + 2.2]], 6, true), k.OUT * 1.25, { closed: true, curve: true });
      S.L(curve([[cx - 2.6, cy + 1], [cx - 1.8, cy - 1], [cx - 0.4, cy - 2]], 4), k.TEX * 0.7);
    };
    S.L(curve([[1, 86], [10, 83.2], [20.6, 82.6]], 6), k.DET * 1.2);
    lens(5.6, 92.4); lens(17.4, 92.6);
    S.L(curve([[9.6, 90.6], [11.4, 89.6], [13.2, 90.6]], 4), k.OUT);
  };

  /* ── 5 · vanitas: hourglass, pewter cup, books, scarf ─────────────────── */
  D.vanitas = (S) => {
    const C = { wall: "#4C5230", top: "#5E3F25", front: "#3F2511", box: "#A67B57", lid: "#C29571",
      cap: "#8A4E2A", sand: "#D6B07A", glass: "#C9C3AE", cup: "#9A8A74", scarf: "#7B4A36", scarf2: "#A86B44",
      stripe: "#C59B5A", bookA: "#A9794F", bookB: "#3E4248", flat: "#86643F", pages: "#D9C7A0",
      p1: "#C9935E", p2: "#26262A", p3: "#B44A44", p4: "#4E7A4A", pencil: "#7A2626", plate: "#D9C7A0" };
    const k = S.k;
    /* the old-master wall: dark, cross-hatched, with the faint mottle of
       the painted cloth left as gaps */
    S.panel(0, 0, 170, 78, C.wall);
    S.wallShadow([[139.8, 21], [146.4, 27], [148, 52], [139.8, 52]]);
    S.wallShadow([[109.6, 47.6], [114.2, 52], [114.6, 74], [108.6, 76.6]]);
    S.wallShadow([[90.4, 65], [94.6, 67], [94.2, 76.6], [90.4, 76.6]]);
    /* the table: lit top with grain, the front edge in shadow */
    const tt = [[0, 77], [170, 77], [170, 85], [0, 85]];
    S.F(tt, C.top, { w: 0 });
    for (const [y, a, b] of [[79.6, 4, 60], [81.6, 30, 120], [83.4, 90, 166]]) S.L(curve([[a, y], [(a + b) / 2, y - 0.3], [b, y + 0.2]], 4), k.TEX * 0.5);
    S.L([[0, 77], [170, 77]], k.DET);
    S.F([[0, 85], [170, 85], [170, 100], [0, 100]], C.front, { w: 0 });
    /* only the shade under the table's lip, fading down */
    S.hatch([[0, 85.4], [170, 85.4], [170, 90], [0, 90]], { gap: 1.6, ang: 30, w: k.TEX * 0.45, rag: 2.5 });
    S.L([[0, 85], [170, 85]], k.OUT);
    /* the scarf, heaped behind the box and down over the table at left */
    const heap = curve([[30, 62], [42, 52.6], [60, 54], [78, 52], [92, 58], [92, 68], [30, 70]], 6, true);
    S.F(heap, C.scarf, { w: k.DET });
    const tail = curve([[2, 80], [12, 74], [26, 70], [40, 66], [40, 74], [24, 78], [8, 82]], 6, true);
    S.F(tail, C.scarf2, { w: k.DET });
    for (const s of [[[34, 64], [50, 58], [66, 60], [88, 60]], [[36, 68], [56, 64], [90, 65]], [[8, 79], [24, 74], [39, 70]]])
      S.F(ribbon(curve(s, 6), 1.3), C.stripe, { w: 0 });
    for (const [x, y] of [[48, 61.4], [60, 59.4], [74, 60], [16, 77.4], [28, 73.4]])
      S.F([[x, y - 1.6], [x + 1.8, y], [x, y + 1.6], [x - 1.8, y]], "#5A2E22", { w: 0 });
    for (const f of [[[44, 54], [50, 62], [48, 68]], [[70, 53], [74, 62], [72, 69]], [[20, 73.6], [26, 78]]]) S.L(curve(f, 4), k.TEX, { curve: true });
    for (let i = 0; i < 9; i++) S.L([[3 + i * 1.4, 80.6 + i * 0.1], [1 + i * 1.6, 86 + (i % 2)]], k.TEX * 0.8);
    /* the box: grain on its face, a brass plate */
    S.box(32, 67.6, 88, 83, 2.4, -2.6, C.box, { top: C.lid });
    S.L([[32, 70.4], [88, 70.4]], k.DET);
    for (const y of [73.2, 76.6, 80]) S.L(curve([[33, y], [50, y - 0.5], [62, y + 0.4], [87, y - 0.2]], 5), k.TEX * 0.6, { curve: true });
    S.F(rect(76, 73, 86, 79.4), C.plate, { w: k.TEX });
    S.L([[78, 75.4], [84, 75.4]], k.TEX * 0.5); S.L([[78, 77.2], [83, 77.2]], k.TEX * 0.5);
    /* the hourglass, fallen against the box: two turned caps, three
       spindles, the glass waisted between them */
    const hg = (pts) => rot(pts, 66, 70, 42);
    const glass = hg(curve([[62.6, 59], [69.4, 59], [67.2, 69.2], [69.4, 80.4], [62.6, 80.4], [64.8, 69.2]], 6, true));
    const sp1 = hg(rect(57.8, 59.4, 59.2, 80.6));
    S.F(sp1, C.cap, { w: k.DET }); S.hatch(sp1, { gap: 0.8, ang: 42 + 90 });
    S.F(glass, C.glass, { w: k.DET });
    S.L(hg([[63.6, 61], [65.2, 67.4]]), k.TEX * 0.6); S.L(hg([[63.6, 79], [65.2, 72]]), k.TEX * 0.6);
    const sand = hg(curve([[63.6, 74.2], [68.4, 74.2], [69.2, 80], [62.8, 80]], 4, true));
    S.F(sand, C.sand, { w: k.TEX });
    for (let i = 0; i < 14; i++) { const [px, py] = hg([[63.8 + rnd() * 4.6, 75 + rnd() * 4.4]])[0]; S.L([[px, py], [px + 0.2, py + 0.1]], k.TEX * 0.6); }
    S.L(hg([[66, 69.4], [66, 74.2]]), k.TEX * 0.5);
    const sp2 = hg(rect(72.8, 59.4, 74.2, 80.6)), sp3 = hg(rect(65.4, 59.4, 66.6, 80.6));
    S.F(sp2, C.cap, { w: k.DET }); S.hatch(sp2, { gap: 0.8, ang: 42 + 90 });
    S.F(sp3, C.cap, { w: k.DET, sh: 0.85 });
    for (const y of [57.4, 82.6]) {
      const capS = hg(ov(66, y, 9.4, 2.4));
      S.ball(...hg([[66, y]])[0], 9.4, 3.2, C.cap, { sil: capS, sh: 0.78, arcs: false, tone: { gap: 1.2, ang: 42 } });
      S.L(hg(ov(66, y, 6.6, 1.5, 0, 180)), k.TEX * 0.7, { curve: true });
    }
    S.F(ribbon([[54, 82.6], [76, 81.4]], 1.4), C.pencil, { w: k.DET });
    /* the pewter cup: engraved, a pencil pot */
    const pencil = (x0, y0, x1, y1, col, dark) => {
      const r = ribbon([[x0, y0], [x1, y1]], 1.3);
      S.F(r, col, { w: k.DET });
      if (dark) S.hatch(r, { gap: 0.5, ang: 0, min: 0.2 });
      S.F(ribbon([[x0 - (x1 - x0) * 0.08, y0 - 1.6], [x0, y0]], 0.2, 1.3), "#E8CFA6", { w: k.TEX });
    };
    pencil(90.2, 30, 92.2, 48, C.p1); pencil(103.4, 33, 102.2, 48, C.p2, true); pencil(106.6, 37, 104.8, 48, C.p3); pencil(109, 39, 107, 48, C.p4, true);
    const cup = S.lathe(98.6, 82.6, [[35, 11.6], [34, 11.4], [26, 10], [16, 8], [11, 5.6], [8, 2.2], [5, 2.2], [3, 6.6], [0, 7.4]], C.cup,
      { q: 0.16, sh: 0.62, cres: 0.4, bore: "#3A3128", boreTone: { gap: 0.7, ang: 0, cross: true }, hi: [33, 14], hiFill: "#C8BBA6",
        crescTone: { gap: 1.3, ang: 70 } });
    for (const h of [31.6, 27]) S.band(98.6, 82.6, cup.P, h, k.DET, 0.16);
    /* the engraving: arched panels round the bowl, a scroll in each */
    for (const dx of [-6.2, 0, 6.2]) {
      const x = 98.6 + dx, y0 = 82.6 - 26, y1 = 82.6 - 16.6, w = dx ? 2.2 : 2.8;
      S.L(curve([[x - w, y1], [x - w, y0 + 2.4], [x, y0], [x + w, y0 + 2.4], [x + w, y1]], 5), k.TEX);
      S.L(curve([[x, y0 + 2.6], [x - w * 0.5, y0 + 4.4], [x, y0 + 6.2], [x + w * 0.5, y0 + 7.6]], 4), k.TEX * 0.7);
    }
    /* the flat book the standing pair rest on: ruled page edge */
    S.box(104, 74, 141, 81.4, 2.2, -2.4, C.flat, { top: C.pages });
    for (const y of [76.2, 77.4, 78.6]) S.L([[106, y], [140, y]], k.TEX * 0.5);
    /* two old volumes standing: tan with a label, dark with an ornament */
    S.box(113, 21, 125.2, 74, 1.4, -1.6, C.bookA, { top: C.pages });
    for (const y of [26, 29, 64, 68]) S.L([[113, y], [125.2, y]], k.DET * 0.8);
    S.F(rect(115.4, 33, 122.8, 46), "#5A3826", { w: k.TEX });
    for (const y of [36, 39, 42]) S.L([[116.6, y], [121.4, y]], k.TEX * 0.6);
    /* scuffs where the cloth has worn through */
    for (const [x, y] of [[116, 54], [121, 58], [118, 20.6]]) S.L(curve([[x, y], [x + 1.4, y + 0.8], [x + 2.4, y + 0.2]], 3), k.TEX * 0.6);
    S.box(125.2, 20.6, 138.2, 74, 1.6, -1.6, C.bookB, { top: C.pages, tone: { gap: 1.15, ang: 80, w: k.TEX * 0.55 } });
    for (const y of [25, 28.4, 66, 69.4]) S.L([[125.2, y], [138.2, y]], k.DET * 0.8);
    for (const cy of [36, 48, 58]) {
      S.F([[131.7, cy - 5], [135.2, cy], [131.7, cy + 5], [128.2, cy]], "#9A9C9E", { w: k.TEX });
      S.L([[131.7, cy - 2.6], [133.4, cy], [131.7, cy + 2.6], [130, cy], [131.7, cy - 2.6]], k.TEX * 0.6);
    }
    /* the scarf's other end, spilling in front of the books, fringed */
    const end = curve([[133, 72], [138, 62], [146, 54], [158, 50], [168, 54]], 6).concat([[170, 56], [170, 78]], curve([[164, 82], [152, 86], [140, 85], [132, 80]], 6));
    S.F(end, C.scarf, { w: k.DET });
    const fold = curve([[146, 66], [156, 58], [166, 60], [170, 66]], 6).concat([[170, 74]], curve([[160, 74], [150, 76], [144, 72]], 5));
    S.F(fold, C.scarf2, { w: k.DET });
    for (const s of [[[136, 68], [148, 60], [160, 56], [169, 58]], [[134, 77], [150, 80], [168, 76]]]) S.F(ribbon(curve(s, 6), 1.3), C.stripe, { w: 0 });
    for (const [x, y] of [[142, 74], [154, 70], [162, 66], [148, 82]]) S.F([[x, y - 1.6], [x + 1.8, y], [x, y + 1.6], [x - 1.8, y]], "#5A2E22", { w: 0 });
    for (const f of [[[138, 66], [148, 62], [158, 64]], [[140, 76], [152, 72], [166, 74]], [[156, 52], [160, 60], [158, 68]]]) S.L(curve(f, 5), k.TEX * 0.8, { curve: true, taper: [1, 0.4] });
    for (let i = 0; i < 14; i++) { const x = 128 + i * 2.6; S.L(curve([[x + 4, 84], [x + 2, 90], [x + 1 + (i % 3), 96]], 4), k.TEX); }
  };

  const NAMES = { bottles: "Sun through glass bottles", roses: "Roses, fruit and a tipped glass", orchid: "Orchid in a bud vase",
    tea: "Tea by the window", vanitas: "Vanitas with hourglass" };
  const Q = { bottles: 0.42, roses: 0.26, orchid: 0.2, tea: 0.2, vanitas: 0.16 };
  const ASPECT = { bottles: 1, roses: 100 / 150, orchid: 68 / 104, tea: 67 / 100, vanitas: 170 / 100 };

  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;          /* the retro set's hierarchy */
      const t = kit(k, { yaw: 0, pitch: 0 });
      rs = 11;
      D[key](stage(t, Q[key]));
      t.flush();
      return k.done();
    });
  }
  out._keys = Object.keys(D);
  out._names = NAMES;
  out._aspect = ASPECT;
  /* the picture-plane helpers, for other vignette modules (src/scapes.js) */
  out._stage = stage;
  out._util = { ov, rect, rot, curve, ribbon, smooth };
  return out;
})();
