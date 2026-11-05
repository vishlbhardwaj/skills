/*
 * FIFTY FLOWERS.
 *
 * One toolkit, fifty species. What varies is the ARCHETYPE — radial head,
 * scalloped mass, nested rings, cup, bell, trumpet, spike — and the
 * landmark that names the species inside it: a cosmos petal is notched, a
 * cornflower petal is fringed, a black-eyed susan's petals droop off a black
 * dome. A palette swap is not a different flower.
 *
 * Every flower shares ONE frame, so they arrive at one scale on one ground
 * line: a snowdrop is short and a foxglove is tall, which is information.
 * Fitted to its own bounding box each flower would come out the same height.
 *
 * Three rules from the plants that bite harder here, because a flower is
 * mostly overlap:
 *
 *   EVERY OUTLINE DRAWS OVER EVERY FILL. So a stem stops at the lowest edge
 *   of its head, petals start at the rim of the disc rather than its
 *   centre, and layered heads (dahlia, camellia) are built as concentric
 *   ANNULI over a backing disc — each ring's petals live inside their own
 *   band, so no outline crosses a fill in front of it.
 *
 *   A HEAVY PEN WANTS FEW, BIG PARTS. Where a flower really is many small
 *   parts (lupin, hyacinth) density is the subject and it is drawn whole.
 *
 *   CONTRAST IS BORROWED FROM THE BUILDINGS: solid black soil under every
 *   stem, black centres where the species has them (anemone, poppy,
 *   gerbera, susan).
 */
window.Flowers = (function () {
  const L = Kit.LEAF;
  const RAD = Math.PI / 180;

  /* half-profiles, along 0 → 1; narrowing points kept at both ends */
  const PR = {
    strap:  [[0,0],[0.06,0.05],[0.1,0.3],[0.1,0.8],[0.07,0.97],[0.02,1],[0,1]],
    petal:  [[0,0],[0.05,0.03],[0.13,0.2],[0.16,0.5],[0.12,0.8],[0.04,0.96],[0.01,0.995],[0,1]],
    broad:  [[0,0],[0.1,0.03],[0.3,0.2],[0.42,0.5],[0.38,0.8],[0.2,0.97],[0.05,1],[0,1]],
    notch:  [[0,0],[0.08,0.04],[0.26,0.3],[0.36,0.7],[0.34,0.95],[0.18,1.0],[0.06,0.9],[0,0.88]],
    fringe: [[0,0],[0.06,0.1],[0.12,0.55],[0.26,0.84],[0.24,1],[0.16,0.88],[0.09,1.0],[0,0.9]],
    lemon:  [[0,0],[0.05,0.02],[0.12,0.08],[0.30,0.25],[0.34,0.5],[0.30,0.75],[0.12,0.92],[0.05,0.98],[0,1]],
    bell:   [[0,0],[0.14,0.02],[0.26,0.2],[0.3,0.6],[0.38,0.86],[0.48,0.98],[0.32,0.93],[0.2,1.0],[0.08,0.93],[0,0.97]],
    tube:   [[0,0],[0.08,0.03],[0.12,0.3],[0.2,0.65],[0.36,0.88],[0.44,1.0],[0.2,0.96],[0,1]],
    goblet: [[0,0],[0.1,0.04],[0.2,0.3],[0.24,0.62],[0.2,0.92],[0.08,0.99],[0,1]],
    calla:  [[0,0],[0.05,0.05],[0.1,0.35],[0.24,0.7],[0.4,0.92],[0.3,1.0],[0.1,1.04],[0,1.12]],
    spathe: [[0,0],[0.06,0.03],[0.26,0.2],[0.36,0.46],[0.30,0.72],[0.12,0.93],[0.02,0.995],[0,1]],
  };

  const C = {
    white: "#F7F4EC", cream: "#F3E7C4", yellow: "#F2C933", gold: "#E9A825",
    orange: "#F08A1C", amber: "#F6A93B", rust: "#C8692E", brown: "#6E4A2E",
    red: "#D9333F", crimson: "#A3243B", rose: "#C7253E", coral: "#F26F5C",
    pink: "#E99AB8", blush: "#F4BCCB", magenta: "#C93A6B", fuchsia: "#D9739B",
    lilac: "#9A7FD1", violet: "#7F5AB8", purple: "#6C3A9E", plum: "#7B2C8F",
    blue: "#4D7FD6", navy: "#2A3A7A", sky: "#7E9FD8", bell: "#5E6FC9",
    green: "#7F9A62", twig: "#6B4E3A",
  };

  /* ── the toolkit, bound to one rig ───────────────────────────────────── */
  /*
   * DEFERRED OCCLUSION. Every outline draws over every fill, so a flower —
   * which is mostly overlap — came out with petal edges crossing the petals
   * in front of them, and the rose's inner lines read as a smiley face.
   *
   * Fills are emitted immediately, in authoring order (back to front). Every
   * OUTLINE and detail line is queued with its position in that order, and
   * at `flush()` each one is cut wherever it passes inside any filled shape
   * authored AFTER it. Author back to front and occlusion is automatic.
   *
   * Black fills are REGIONS ("ink"), never tones: a tone renders above every
   * region, so a black poppy blotch hid the green seed pod authored on top.
   */
  function inPoly(x, y, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const bbox = (P) => {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    for (const [x, y] of P) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }
    return [a, b, c, d];
  };

  function kit(k) {
    const V = k.V;
    let H = null;
    /* `head()` scales everything authored after it about the head's centre:
       a bigger head is the room the detail needs */
    const p = (x, y) => (H ? V.p(H.cx + (x - H.cx) * H.S, H.cy + (y - H.cy) * H.S, 0) : V.p(x, y, 0));
    let seed = 11;
    const sd = () => (seed += 3);
    const items = [];
    const t = { p };

    const opaque = (P) => items.push({ shape: true, P, bb: bbox(P) });
    const queue = (P, w, x) => items.push({ shape: false, P, w, x: x || {} });
    const toP = (pts) => pts.map(([a, b]) => p(a, b));

    t.head = (cx, cy, S) => { H = { cx, cy, S: S || 1.35 }; };

    t.line = (pts, w, x) => queue(toP(pts), w, x);
    t.fillOnly = (pts, fill, sh) => k.R(toP(pts), fill, sd(), sh == null ? null : sh, true);

    /* a filled closed shape, outlined once; the outline is occluded later */
    t.shape = (pts, fill, w, curve) => {
      const P = toP(pts);
      if (fill) { k.R(P, fill, sd(), null, curve !== false); opaque(P); }
      queue(P, (w || 1) * k.TEX, { closed: true, curve: curve !== false });
      return P;
    };

    const halfW = (prof, v) => {
      for (let i = 1; i < prof.length; i++)
        if (prof[i][1] >= v) {
          const [u0, v0] = prof[i - 1], [u1, v1] = prof[i];
          return u0 + (u1 - u0) * ((v - v0) / ((v1 - v0) || 1));
        }
      return 0;
    };
    t.halfW = halfW;

    /* `at(u, v)` answers in WORLD units, so its points feed back into
       line/dot/blade without converting */
    t.blade = (prof, x, y, len, ang, fill, wide, rib, w) => {
      const a = ang * RAD, W = wide == null ? 1 : wide;
      const dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
      const at = (u, v) => [x + dx * v * len + px * u * len * W,
                            y + dy * v * len + py * u * len * W];
      const pts = prof.map(([u, v]) => at(u, v))
        .concat(prof.slice(0, -1).reverse().map(([u, v]) => at(-u, v)));
      t.shape(pts, fill, w, true);
      if (rib) t.line([at(0, 0.08), at(0, 0.9)], k.TEX * 0.6, { curve: false });
      at.W = W; at.prof = prof;
      return at;
    };

    /* a leaf: blade + midrib + three pairs of side veins (+ teeth) */
    t.leaf = (prof, x, y, len, ang, fill, wide, serrate) => {
      const at = t.blade(prof, x, y, len, ang, fill || "cLeaf", wide, true);
      for (const v of [0.3, 0.5, 0.7]) {
        const hw = halfW(prof, v + 0.1);
        for (const s of [-1, 1]) t.line([at(0, v), at(s * hw * 0.62, v + 0.14)], k.TEX * 0.42, { curve: false });
      }
      if (serrate)
        for (let v = 0.2; v < 0.86; v += 0.13)
          for (const s of [-1, 1]) {
            const hw = halfW(prof, v);
            t.line([at(s * hw * 0.92, v), at(s * hw * 1.06, v + 0.05)], k.TEX * 0.5, { curve: false });
          }
      return at;
    };

    t.ell = (cx, cy, rx, ry, n, rot) => {
      const out = [], r = (rot || 0) * RAD;
      for (let i = 0; i < (n || 22); i++) {
        const a = (i / (n || 22)) * Math.PI * 2;
        const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        out.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
      }
      return out;
    };

    /* a disc; a stippled one is a domed centre and gets an inner ring */
    t.disc = (cx, cy, rx, ry, fill, tone) => {
      const R = ry == null ? rx : ry, pts = t.ell(cx, cy, rx, R);
      if (fill === "ink") { const P = toP(pts); k.R(P, "ink", sd(), null, true); opaque(P); }
      else t.shape(pts, fill);
      if (tone) {
        k.T(toP(pts), tone, 0.5, { s: sd(), gap: 0.55, curve: true });
        t.line(t.ell(cx, cy, rx * 0.6, R * 0.6, 16), k.TEX * 0.42, { closed: true });
      }
    };

    t.scallop = (cx, cy, rx, ry, n, bump, phase) => {
      const out = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < 4; j++) {
          const f = j / 4, a = ((i + f) / n) * Math.PI * 2 + (phase || 0);
          const b = 1 + Math.sin(f * Math.PI) * bump;
          out.push([cx + Math.cos(a) * rx * b, cy + Math.sin(a) * ry * b]);
        }
      return out;
    };

    /*
     * A ring of petals. Each petal gets a darker base (the same profile,
     * shorter, shade 0.84 — the cheapest gradient there is) and a crease,
     * unless `plain`. Small petals skip the crease: at that size it is noise.
     */
    t.radial = (cx, cy, o) => {
      const n = o.n, droop = o.droop || 0;
      for (let i = 0; i < n; i++) {
        let a = (o.rot || 0) + (i * 360) / n;
        a = ((a % 360) + 540) % 360 - 180;
        if (o.skipTop && Math.abs(a) < o.skipTop) continue;
        if (droop) a += droop * Math.sin(a * RAD);
        const bx = cx + Math.sin(a * RAD) * o.r0, by = cy - Math.cos(a * RAD) * o.r0;
        const fill = Array.isArray(o.fill) ? o.fill[i % o.fill.length] : o.fill;
        const prof = o.prof || PR.petal, ang = a + (o.twist || 0);
        const at = t.blade(prof, bx, by, o.len, ang, fill, o.wide, o.rib);
        if (o.plain || fill === "ink") continue;
        const base = prof.map(([u, v]) => [u, v * 0.42]);
        const bpts = base.map(([u, v]) => at(u, v)).concat(base.slice(0, -1).reverse().map(([u, v]) => at(-u, v)));
        /* a pale petal shaded by multiplying goes GREY — dirty, not shadowed.
           Pale fills get a whisper; mid and dark fills the full 0.84 */
        const hex = fill && fill[0] === "#" ? parseInt(fill.slice(1), 16) : null;
        const lum = hex == null ? 0.5 : (0.3 * (hex >> 16) + 0.59 * ((hex >> 8) & 255) + 0.11 * (hex & 255)) / 255;
        t.fillOnly(bpts, fill, lum > 0.8 ? 0.96 : 0.84);
        if (!o.rib && o.len * (H ? H.S : 1) > 4.5) t.line([at(0, 0.12), at(0, 0.52)], k.TEX * 0.42, { curve: false });
      }
    };

    t.along = (pts, u) => {
      const seg = [];
      let tot = 0;
      for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(l); tot += l;
      }
      let d = u * tot;
      for (let i = 0; i < seg.length; i++) {
        if (d <= seg[i] || i === seg.length - 1) {
          const f = Math.min(1, d / seg[i]), a = pts[i], b = pts[i + 1];
          return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f,
                   ang: Math.atan2(b[0] - a[0], -(b[1] - a[1])) / RAD };
        }
        d -= seg[i];
      }
    };

    /*
     * A STEM is a filled ribbon, not a black stick: an ink underlay a little
     * wider than a green ribbon on top, both regions. A stick of solid ink
     * was most of every drawing and read as a lollipop; and being regions,
     * a head authored later simply covers the stem's end.
     */
    const smooth = (pts) => {
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let j = 0; j < 8; j++) {
          const s = j / 8, s2 = s * s, s3 = s2 * s;
          out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * s +
            (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * s2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * s3)));
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    };
    const ribbon = (c, w0, w1) => {
      const L = [], R = [];
      c.forEach((q, i) => {
        const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
        const w = (w0 + (w1 - w0) * (i / (c.length - 1))) / 2;
        L.push([q[0] - (dy / d) * w, q[1] + (dx / d) * w]);
        R.push([q[0] + (dy / d) * w, q[1] - (dx / d) * w]);
      });
      return L.concat(R.reverse());
    };
    t.stem = (pts, w, fill) => {
      const c = smooth(pts), W = (w || 1) * 1.05;
      const out = toP(ribbon(c, W + 0.62, W * 0.62 + 0.62));
      k.R(out, "ink", sd(), null, true);
      k.R(toP(ribbon(c, W, W * 0.62)), fill || "#6F8F55", sd(), null, true);
      opaque(out);
    };

    t.ground = () => {
      const m = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (i / 12);
        m.push(p(-Math.cos(a) * 6.5, 40 - Math.sin(a) * 2.2));
      }
      queue([p(-13, 40), p(13, 40)], k.DET);
      k.T(m, "solid", 0.4, { fill: "ink", curve: true });
    };
    t.water = () => {
      queue([p(-15, 40), p(15, 40)], k.DET);
      queue([p(-11, 41.6), p(6, 41.6)], k.TEX);
      queue([p(-4, 43), p(12, 43)], k.TEX * 0.8);
    };

    t.star = (cx, cy, r, w) => {
      for (let i = 0; i < 3; i++) {
        const a = (i * 60 + 15) * RAD;
        t.line([[cx - Math.cos(a) * r, cy - Math.sin(a) * r], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]],
               (w || 0.6) * k.TEX, { curve: false });
      }
    };
    t.dot = (cx, cy, r) => {
      const P = toP(t.ell(cx, cy, r, r, 10));
      k.R(P, "ink", sd(), null, true); opaque(P);
    };

    /* resolve: every queued line, cut by every filled shape authored after it */
    t.flush = () => {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.shape) continue;
        const occ = [];
        const bb = bbox(it.P);
        for (let j = i + 1; j < items.length; j++) {
          const o = items[j];
          if (o.shape && o.bb[0] <= bb[2] && o.bb[2] >= bb[0] && o.bb[1] <= bb[3] && o.bb[3] >= bb[1]) occ.push(o);
        }
        const draw = (run) => k.M(run, it.w, { curve: true, ...it.x, closed: false });
        if (!occ.length) { k.M(it.P, it.w, { curve: true, ...it.x }); continue; }
        const P = it.x.closed ? it.P.concat([it.P[0]]) : it.P;
        let cur = [];
        for (let s = 1; s < P.length; s++) {
          const [ax, ay] = P[s - 1], [bx, by] = P[s];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.35));
          for (let j = 0; j < n; j++) {
            const x = ax + ((bx - ax) * j) / n, y = ay + ((by - ay) * j) / n;
            const hid = occ.some((o) => x >= o.bb[0] && x <= o.bb[2] && y >= o.bb[1] && y <= o.bb[3] && inPoly(x, y, o.P));
            if (hid) { if (cur.length > 1) draw(cur); cur = []; } else cur.push([x, y]);
          }
        }
        cur.push(P[P.length - 1]);
        if (cur.length > 1) draw(cur);
      }
    };
    return t;
  }

  /* a two-leaf pair up a stem, at fraction u */
  function pair(t, stemPts, u, len, spread, fill, prof) {
    const s = t.along(stemPts, u);
    t.leaf(prof || L.lance, s.x, s.y, len, s.ang - (spread || 55), fill || "cLeaf", 1);
    t.leaf(prof || L.lance, s.x, s.y, len, s.ang + (spread || 55), fill || "cLeafD", 1);
  }

  const F = {};

  /* ── radial heads ─────────────────────────────────────────────────── */

  F.daisy = (t) => {
    t.ground();
    const st = [[0, 40], [1.4, 18], [0, -1.8]];
    t.stem(st); pair(t, st, 0.3, 9, 50);
    t.head(0, -14, 1.45);
    t.radial(0, -14, { n: 18, r0: 3.2, len: 8.5, prof: PR.strap, wide: 1.7, fill: C.white });
    t.disc(0, -14, 3.8, 3.8, C.yellow, "stipple");
  };

  F.sunflower = (t) => {
    t.ground();
    const st = [[0, 40], [-1.2, 16], [0, 3]];
    t.stem(st, 1.5);
    t.leaf(L.heart, -0.6, 26, 11, -62); t.leaf(L.heart, -0.8, 15, 10, 58, "cLeafD");
    t.head(0, -12, 1.22);
    t.radial(0, -12, { n: 15, r0: 5.6, len: 8, rot: 12, prof: PR.petal, wide: 2.0, fill: C.gold });
    t.radial(0, -12, { n: 15, r0: 5.8, len: 9, prof: PR.petal, wide: 2.0, fill: C.yellow });
    t.disc(0, -12, 6.4, 6.4, C.brown, "stipple");
  };

  F.gerbera = (t) => {
    t.ground();
    t.leaf(L.oval, -1, 39, 10, -72); t.leaf(L.oval, 1, 39, 10, 70, "cLeafD");
    t.stem([[0, 40], [1, 14], [0, 0]]);
    t.head(0, -12, 1.35);
    t.radial(0, -12, { n: 22, r0: 4, len: 8.5, prof: PR.strap, wide: 2.2, fill: C.orange });
    t.radial(0, -12, { n: 22, r0: 3, len: 3.6, rot: 8, prof: PR.strap, wide: 2.6, fill: C.amber });
    t.disc(0, -12, 3.1, 3.1, "ink");
  };

  F.susan = (t) => {
    t.ground();
    const st = [[0, 40], [1.6, 16], [0, 2]];
    t.stem(st); pair(t, st, 0.35, 10, 48);
    t.head(0, -10, 1.45);
    t.radial(0, -10, { n: 13, r0: 3.4, len: 8.5, prof: PR.petal, wide: 1.8, fill: C.gold, droop: 32 });
    t.disc(0, -10.6, 4, 3.7, "ink");
  };

  F.coneflower = (t) => {
    t.ground();
    const st = [[0, 40], [-1.4, 14], [0, -2]];
    t.stem(st); pair(t, st, 0.4, 10, 40, null, L.spear);
    t.head(0, -11, 1.35);
    t.radial(0, -11, { n: 12, r0: 3.2, len: 9.5, prof: PR.strap, wide: 1.9, fill: C.fuchsia, droop: 60, skipTop: 20 });
    t.shape(t.ell(0, -13.4, 4.2, 4.8), C.rust);
    t.disc(0, -13.4, 3.6, 4.2, null, "stipple");
  };

  F.cosmos = (t) => {
    t.ground();
    const st = [[0, 40], [2.4, 22], [-0.6, 6], [0, -5]];
    t.stem(st, 0.8);
    [0.2, 0.42, 0.62].forEach((u, i) => {
      const s = t.along(st, u);
      for (const sd of [-1, 1]) t.leaf(L.needle, s.x, s.y, 7 - i, s.ang + sd * 58, i % 2 ? "cLeafD" : "cLeaf", 2.4);
    });
    t.head(0, -14, 1.45);
    t.radial(0, -14, { n: 8, r0: 2.2, len: 9, rot: 22, prof: PR.notch, wide: 1.5, fill: C.pink });
    t.disc(0, -14, 2.6, 2.6, C.yellow, "stipple");
  };

  F.zinnia = (t) => {
    t.ground();
    const st = [[0, 40], [0.8, 14], [0, -3]];
    t.stem(st, 1.1); pair(t, st, 0.3, 8, 62, null, L.oval); pair(t, st, 0.62, 6.5, 58, null, L.oval);
    t.head(0, -12, 1.4);
    t.disc(0, -12, 7.6, 7.6, C.crimson);
    t.radial(0, -12, { n: 14, r0: 5.2, len: 5, prof: PR.broad, wide: 1.2, fill: C.magenta });
    t.radial(0, -12, { n: 11, r0: 2.4, len: 3.4, rot: 16, prof: PR.broad, wide: 1.3, fill: "#E0588A" });
    t.disc(0, -12, 2.4, 2.4, C.yellow);
    for (let i = 0; i < 6; i++) t.star(Math.sin(i * 60 * RAD) * 1.2, -12 - Math.cos(i * 60 * RAD) * 1.2, 0.5);
  };

  F.marigold = (t) => {
    t.ground();
    const st = [[0, 40], [-1, 16], [0, -4]];
    t.stem(st, 1.1);
    [[0.28, -1], [0.48, 1]].forEach(([u, sd]) => {
      const s = t.along(st, u);
      const at = t.blade(L.lance, s.x, s.y, 10, sd * 62, sd < 0 ? "cLeafD" : "cLeaf", 1.3, true);
      for (let j = 1; j < 5; j++) t.line([at(0, j * 0.19), at(sd * 0.2, j * 0.19 + 0.08)], 0.55, { curve: false });
    });
    t.head(0, -12, 1.45);
    t.shape(t.scallop(0, -12, 8, 7, 12, 0.2), C.orange);
    t.shape(t.scallop(0, -12.8, 5.3, 4.5, 9, 0.22, 0.3), C.amber);
    t.shape(t.scallop(0, -13.2, 2.5, 2.1, 6, 0.25), "#E07012");
  };

  F.aster = (t) => {
    t.ground();
    const st = [[0, 40], [0.5, 14], [0, 2]];
    t.stem(st);
    t.stem([[0.4, 10], [-5, 0], [-8, -2.6]], 0.8);
    t.stem([[0.3, 4], [6, -4], [8.5, 4.6]], 0.8);
    pair(t, st, 0.3, 8, 52);
    [[-8, -8, 0.62], [0, -14, 0.82], [9, 9, 0.56]].forEach(([x, y, s]) => {
      t.radial(x, y, { n: 26, r0: 2.6 * s, len: 6.6 * s, prof: PR.strap, wide: 1.1, fill: C.lilac });
      t.disc(x, y, 2.8 * s, 2.8 * s, C.yellow);
    });
  };

  F.mum = (t) => {
    t.ground();
    const st = [[0, 40], [1.2, 16], [0, 2]];
    t.stem(st, 1.1); pair(t, st, 0.35, 8, 56, null, L.spear);
    t.head(0, -12, 1.25);
    t.disc(0, -12, 10, 10, C.rust);
    t.radial(0, -12, { n: 26, r0: 6.6, len: 7.5, prof: PR.strap, wide: 1.4, fill: C.rust, droop: 12 });
    t.radial(0, -12, { n: 20, r0: 3.4, len: 4.4, rot: 9, prof: PR.strap, wide: 1.8, fill: "#E08A3E" });
    t.radial(0, -12, { n: 10, r0: 0.5, len: 3, prof: PR.strap, wide: 2.4, fill: C.amber });
  };

  /* concentric annuli over a backing disc: no outline crosses a fill */
  F.dahlia = (t) => {
    t.ground();
    const st = [[0, 40], [-1, 16], [0, 3]];
    t.stem(st, 1.2); pair(t, st, 0.32, 9, 50, null, L.oval);
    t.head(0, -11, 1.2);
    t.disc(0, -11, 13.6, 13.6, C.crimson);
    t.radial(0, -11, { n: 16, r0: 8.6, len: 5, prof: PR.petal, wide: 2.4, fill: C.crimson });
    t.radial(0, -11, { n: 14, r0: 5, len: 4.2, rot: 11, prof: PR.petal, wide: 2.6, fill: "#B8304A" });
    t.radial(0, -11, { n: 10, r0: 2, len: 3.4, rot: 4, prof: PR.petal, wide: 2.8, fill: "#CF4560" });
    t.radial(0, -11, { n: 6, r0: 0.2, len: 2, rot: 20, prof: PR.petal, wide: 3, fill: "#E06078" });
  };

  F.cornflower = (t) => {
    t.ground();
    const st = [[0, 40], [1.6, 16], [0, -6]];
    t.stem(st, 0.85);
    [0.25, 0.5].forEach((u, i) => { const s = t.along(st, u); t.leaf(L.needle, s.x, s.y, 9, s.ang + (i ? 34 : -34), "cOlive", 1.5); });
    t.head(0, -13, 1.5);
    t.radial(0, -13, { n: 9, r0: 2.2, len: 6.5, prof: PR.fringe, wide: 1.6, fill: C.blue });
    t.disc(0, -13, 2.4, 2.4, C.navy);
    for (let i = 0; i < 5; i++) t.star(Math.sin(i * 72 * RAD) * 1.1, -13 - Math.cos(i * 72 * RAD) * 1.1, 0.5);
  };

  F.anemone = (t) => {
    t.ground();
    const st = [[0, 40], [1.4, 16], [0, -4]];
    t.stem(st);
    for (const a of [-60, 0, 60]) t.leaf(L.spear, 0, 6, 5.5, 180 + a, "cLeafD", 1.6);
    t.head(0, -13, 1.45);
    t.radial(0, -13, { n: 6, r0: 2.6, len: 7.5, rot: 30, prof: PR.broad, wide: 1.25, fill: C.red });
    t.disc(0, -13, 2.8, 2.8, "ink");
    for (let i = 0; i < 12; i++) t.dot(Math.sin(i * 30 * RAD) * 4, -13 - Math.cos(i * 30 * RAD) * 4, 0.42);
  };

  F.poppy = (t) => {
    t.ground();
    const st = [[0, 40], [2.6, 18], [-1, 2], [0, -5]];
    t.stem(st, 0.9);
    for (let i = 0; i < 10; i++) {
      const s = t.along(st, 0.12 + i * 0.08), sd = i % 2 ? 1 : -1;
      t.line([[s.x + sd * 0.5, s.y], [s.x + sd * 1.3, s.y - 0.5]], 0.4, { curve: false });
    }
    t.leaf(L.spear, 0.6, 32, 9, -58, "cOlive", 1.4, true);
    t.head(0, -14, 1.35);
    const petal = (ang, len, fill) => {
      const at = t.blade(PR.broad, 0, -14, len, ang, fill, 1.75, false);
      for (const u of [-0.16, 0.14]) t.line([at(u * 0.4, 0.42), at(u, 0.7), at(u * 1.2, 0.9)], 0.42, { curve: true });
    };
    petal(-45, 8.6, "#C92A2A"); petal(45, 8.6, "#C92A2A");
    petal(-135, 9.4, C.red); petal(135, 9.4, C.red);
    t.disc(0, -14, 3.9, 3.9, "ink");
    for (let i = 0; i < 18; i++) {
      const a = i * 20 * RAD, e = [Math.sin(a) * 5.2, -14 - Math.cos(a) * 5.2];
      t.line([[Math.sin(a) * 3.6, -14 - Math.cos(a) * 3.6], e], 0.42, { curve: false });
      t.dot(e[0], e[1], 0.32);
    }
    t.disc(0, -14, 2.1, 2.1, "#8A9862");
    for (let i = 0; i < 6; i++) {
      const a = i * 60 * RAD;
      t.line([[0, -14], [Math.sin(a) * 2, -14 - Math.cos(a) * 2]], 0.45, { curve: false });
    }
  };

  F.cherry = (t) => {
    t.ground();
    t.stem([[0, 40], [0.4, 18], [-1, 4], [-3, -8]], 1.8, C.twig);
    t.stem([[0.2, 14], [6, 4], [8, -2]], 1.0, C.twig);
    t.stem([[-1, 4], [-8, -1]], 0.9, C.twig);
    [[-3, -11, 1], [8, -5, 0.9], [-9, -4, 0.85], [3, -1, 0.8], [-4, 8, 0.75]].forEach(([x, y, s]) => {
      t.radial(x, y, { n: 5, r0: 0.6 * s, len: 3.4 * s, prof: PR.notch, wide: 1.6, fill: C.blush });
      t.dot(x, y, 0.55 * s);
    });
    t.blade(PR.lemon, 6.4, 10, 2.6, 60, C.pink, 1, false);
  };

  F.frangipani = (t) => {
    t.ground();
    t.stem([[0, 40], [0, 10], [0, -4]], 1.6);
    t.leaf(L.lance, 0, 20, 13, -48, "cLeafD", 1.1); t.leaf(L.lance, 0, 18, 12, 52, "cLeaf", 1.1);
    t.head(0, -12, 1.4);
    t.radial(0, -12, { n: 5, r0: 0.8, len: 8.5, twist: 32, prof: PR.broad, wide: 1.15, fill: C.white });
    t.disc(0, -12, 2.2, 2.2, C.yellow);
  };

  F.periwinkle = (t) => {
    t.ground();
    const st = [[0, 40], [-1, 26], [0, 16]];
    t.stem(st);
    pair(t, st, 0.3, 6, 64, null, L.oval); pair(t, st, 0.7, 5, 70, null, L.oval);
    t.head(0, 8, 1.55);
    t.radial(0, 8, { n: 5, r0: 0.8, len: 6, twist: 24, prof: PR.broad, wide: 1.3, fill: C.lilac });
    t.disc(0, 8, 1.4, 1.4, C.white);
    t.dot(0, 8, 0.5);
  };

  F.clematis = (t) => {
    t.ground();
    const st = [[0, 40], [3, 20], [-2, 8], [0, -3]];
    t.stem(st, 0.8);
    t.line([[1.8, 22], [6, 18], [7.5, 20], [6.5, 21.6], [5.5, 20.4]], 0.5, { curve: true });
    pair(t, st, 0.45, 6, 60, null, L.heart);
    t.head(0, -12, 1.4);
    t.radial(0, -12, { n: 6, r0: 1.6, len: 8.6, prof: L.spear, wide: 1.3, fill: C.violet, rib: true });
    t.disc(0, -12, 2.6, 2.6, C.cream);
    for (let i = 0; i < 10; i++) t.line([[0, -12], [Math.sin(i * 36 * RAD) * 2.4, -12 - Math.cos(i * 36 * RAD) * 2.4]], 0.4, { curve: false });
  };

  F.passion = (t) => {
    t.ground();
    const st = [[0, 40], [-2, 20], [1, 6], [0, -2]];
    t.stem(st, 0.85);
    t.leaf(L.heart, -1.4, 24, 8, -66, "cLeaf", 1.2);
    t.line([[0.6, 12], [5, 9], [6, 12], [4.5, 13]], 0.5, { curve: true });
    t.head(0, -12, 1.35);
    t.radial(0, -12, { n: 10, r0: 2.2, len: 8, prof: PR.strap, wide: 1.7, fill: C.white });
    t.disc(0, -12, 6.4, 6.4, C.purple);
    for (let i = 0; i < 30; i++) {
      const a = i * 12 * RAD;
      t.line([[Math.sin(a) * 3.4, -12 - Math.cos(a) * 3.4], [Math.sin(a) * 6.2, -12 - Math.cos(a) * 6.2]], 0.45, { curve: false });
    }
    t.disc(0, -12, 2.8, 2.8, "#9FB46A");
    for (let i = 0; i < 5; i++) t.blade(PR.lemon, 0, -12, 3.4, i * 72, C.yellow, 1.2, false);
  };

  F.waterlily = (t) => {
    t.water();
    const pad = t.ell(3, 38.6, 14, 3, 26);
    t.shape(pad.slice(0, 20).concat([[3, 38.6]]), "cLeaf", 1, true);
    t.head(0, 34, 1.35);
    [-66, -40, -14, 14, 40, 66].forEach((a) => t.blade(L.lance, 0, 36, 9.5, a, C.pink, 1.5, true));
    [-36, 0, 36].forEach((a) => t.blade(L.lance, 0, 36.6, 7.4, a, C.blush, 1.5, true));
    t.disc(0, 32.4, 2.4, 1.1, C.yellow);
  };

  F.lotus = (t) => {
    t.water();
    t.stem([[0, 40], [-0.8, 18], [0, -5.6]], 1.1);
    t.stem([[2, 40], [6, 34], [8, 30]], 0.9);
    t.shape(t.ell(10, 29.4, 7, 2.2), "cLeafD");
    t.head(0, -8, 1.3);
    [-56, -28, 0, 28, 56].forEach((a) => t.blade(L.spear, 0, -6, 11, a, C.fuchsia, 1.5, false));
    [-13, 13].forEach((a) => t.blade(L.spear, 0, -5.6, 9.4, a, C.pink, 1.6, false));
  };

  F.hibiscus = (t) => {
    t.ground();
    const st = [[0, 40], [1.2, 16], [0, -2]];
    t.stem(st, 1.1);
    t.leaf(L.oval, 0.6, 24, 10, -62, "cLeafD", 1.1); t.leaf(L.oval, 0.8, 16, 9, 58, "cLeaf", 1.1);
    t.head(0, -12, 1.35);
    t.radial(0, -12, { n: 5, r0: 0.6, len: 10, twist: 14, prof: PR.broad, wide: 1.45, fill: C.red });
    t.disc(0, -12, 2.4, 2.4, "#7A0F25");
    t.line([[0, -12], [4, -18], [7, -21]], 0.9, { curve: true });
    for (const [x, y] of [[6.4, -21.6], [7.6, -20.4], [7.6, -22.2], [6.6, -20.4]]) t.dot(x, y, 0.5);
  };

  F.magnolia = (t) => {
    t.ground();
    t.stem([[0, 40], [-0.6, 18], [0.6, 2], [0, -4]], 1.8, C.twig);
    t.stem([[-0.2, 10], [-6, 4], [-8, 5]], 0.9, C.twig);
    t.blade(PR.lemon, -8.4, 5, 3, -60, "#C7B79E", 1, false);
    t.head(0, -8, 1.3);
    [-34, 0, 34].forEach((a) => t.blade(PR.spathe, 0, -4, 12, a, "#F4DCE6", 1.05, false));
    [-15, 17].forEach((a) => t.blade(PR.spathe, 0, -3.6, 10.4, a, "#EDC3D3", 1.05, false));
  };

  F.camellia = (t) => {
    t.ground();
    const st = [[0, 40], [0.8, 16], [0, -2]];
    t.stem(st, 1.1);
    t.leaf(L.oval, 0, -3, 7, -110, "cLeafD", 1.05); t.leaf(L.oval, 0, -3, 7, 112, "cLeafD", 1.05);
    t.leaf(L.oval, 0.4, 18, 8, 60, "cLeaf", 1.05);
    t.head(0, -11, 1.35);
    t.disc(0, -11, 9.6, 9.6, "#D9486E");
    t.radial(0, -11, { n: 8, r0: 5, len: 5, prof: PR.broad, wide: 1.7, fill: "#D9486E" });
    t.radial(0, -11, { n: 7, r0: 2.4, len: 3.2, rot: 22, prof: PR.broad, wide: 1.9, fill: "#E2678A" });
    t.disc(0, -11, 2.2, 2.2, C.yellow);
    for (let i = 0; i < 8; i++) t.dot(Math.sin(i * 45 * RAD) * 1.4, -11 - Math.cos(i * 45 * RAD) * 1.4, 0.35);
  };

  /* ── masses ───────────────────────────────────────────────────────── */

  /* A rose is PETALS IN FRONT OF PETALS: back fan, closed bud, two outer
     petals wrapping it, one front petal low across them. Authored back to
     front, the deferred occlusion cuts every edge that should be hidden —
     drawn as a cup with lines on it, it read as a smiley face. */
  F.rose = (t) => {
    t.ground();
    const st = [[0, 40], [1.2, 18], [0, -3.4]];
    t.stem(st, 1.1);
    for (const [u, sd] of [[0.22, 1], [0.34, -1], [0.5, 1], [0.7, -1]]) {
      const s = t.along(st, u);
      t.shape([[s.x + sd * 0.5, s.y - 0.8], [s.x + sd * 1.7, s.y - 1.4], [s.x + sd * 0.5, s.y + 0.4]], "#6F8F55", 0.7, false);
    }
    const s = t.along(st, 0.4);
    t.line([[s.x, s.y], [s.x - 5, s.y - 2.6], [s.x - 8.4, s.y - 3.6]], 0.6, { curve: true });
    t.leaf(L.oval, s.x - 5.2, s.y - 2.6, 4.4, -150, "cLeafD", 1.05, true);
    t.leaf(L.oval, s.x - 5.2, s.y - 2.6, 4.4, -30, "cLeafD", 1.05, true);
    t.leaf(L.oval, s.x - 8.4, s.y - 3.6, 5.2, -80, "cLeaf", 1.05, true);
    const s2 = t.along(st, 0.62);
    t.leaf(L.oval, s2.x, s2.y, 6.4, 58, "cLeaf", 1.05, true);
    t.head(0, -8, 1.45);
    t.shape([[-5.4, -7], [-5.8, -10.8], [-4.2, -13.6], [-1.2, -14.6], [1.6, -14.4], [4.4, -13.6], [5.8, -10.8], [5.4, -7]], "#A81E35");
    t.shape([[-2.8, -8.6], [-3.1, -11.8], [-1.2, -13.4], [1.2, -13.3], [3.1, -11.8], [2.8, -8.6]], C.rose);
    t.line([[-1.8, -11.4], [-0.4, -12.6], [1.4, -11.8], [0.8, -10.4], [-0.6, -10.6], [-0.4, -11.6]], 0.55, { curve: true });
    t.shape([[0, -3.2], [-3.4, -3.8], [-5.8, -6.4], [-6.6, -9.8], [-5.2, -11.6], [-3.4, -10.4], [-2, -8.4], [-0.6, -6]], "#B92139");
    t.line([[-5.6, -10.6], [-4.4, -9.6], [-3.6, -8.2]], 0.45, { curve: true });
    t.shape([[0, -3.2], [3.4, -3.8], [5.8, -6.4], [6.6, -9.8], [5.4, -11.8], [3.4, -10.8], [1.6, -8.6], [-0.4, -5.4]], "#D4304A");
    t.line([[5.6, -10.8], [4.4, -9.8], [3.4, -8.6]], 0.45, { curve: true });
    t.shape([[-4.8, -5], [-2.2, -7.4], [0, -7.8], [2.4, -7.2], [4.6, -5], [2.6, -3.6], [0, -3.1], [-2.6, -3.6]], C.rose);
    t.line([[-2.6, -5.4], [0, -6.4], [2.6, -5.4]], 0.45, { curve: true });
    for (const a of [-125, 180, 125]) t.blade(L.lance, 0, -3.2, 3.8, a, "#5E7A4A", 1.3, false);
  };

  F.peony = (t) => {
    t.ground();
    const st = [[0, 40], [-1, 16], [0, -2]];
    t.stem(st, 1.2);
    for (const a of [-58, -36]) t.leaf(L.spear, -0.6, 22, 9, a, "cLeafD", 1.1);
    for (const a of [40, 62]) t.leaf(L.spear, -0.8, 16, 8, a, "cLeaf", 1.1);
    t.head(0, -10, 1.35);
    t.shape(t.scallop(0, -10, 9.4, 8.2, 11, 0.16), C.pink);
    t.shape(t.scallop(0, -11.4, 6.2, 5, 9, 0.18, 0.4), C.blush);
    t.shape(t.scallop(0, -12.4, 3.2, 2.5, 6, 0.2), "#F8D3DD");
    t.line([[-7.6, -6], [-3, -3.4], [1.6, -3.2]], 0.6, { curve: true });
  };

  F.ranunculus = (t) => {
    t.ground();
    const st = [[0, 40], [1.4, 16], [0, -4.6]];
    t.stem(st); pair(t, st, 0.4, 7, 55, null, L.spear);
    t.head(0, -12, 1.45);
    for (let i = 0; i < 7; i++) {
      const r = 7.6 - i * 1.05;
      t.shape(t.ell(0, -12 - i * 0.38, r, r * 0.92), i % 2 ? C.amber : C.orange);
    }
    t.dot(0, -14.4, 0.6);
  };

  F.carnation = (t) => {
    t.ground();
    const st = [[0, 40], [0.8, 18], [0, -1]];
    t.stem(st, 0.85);
    [0.25, 0.55].forEach((u) => pair(t, st, u, 7, 40, "cOlive", L.needle));
    t.head(0, -6, 1.45);
    t.blade(PR.goblet, 0, -1, 6.6, 0, "cOlive", 0.9, false);
    const fr = [[-2.2, -7]];
    for (let a = -110; a <= 110; a += 7) {
      const r = (Math.round(a / 7) % 2 ? 6.4 : 5.3);
      fr.push([Math.sin(a * RAD) * r, -8.2 - Math.cos(a * RAD) * r]);
    }
    fr.push([2.2, -7]);
    t.shape(fr, "#E35D7E", 1, false);
    const inner = [];
    for (let a = -80; a <= 80; a += 8) inner.push([Math.sin(a * RAD) * (Math.round(a / 8) % 2 ? 3.4 : 2.7), -9 - Math.cos(a * RAD) * (Math.round(a / 8) % 2 ? 3.4 : 2.7)]);
    t.line(inner, 0.6, { curve: false });
  };

  F.hydrangea = (t) => {
    t.ground();
    const st = [[0, 40], [-1, 16], [0, 0]];
    t.stem(st, 1.3);
    t.leaf(L.oval, -0.8, 22, 11, -60, "cLeafD", 1.05); t.leaf(L.oval, -0.6, 14, 10, 60, "cLeaf", 1.05);
    t.head(0, -10, 1.3);
    t.shape(t.scallop(0, -10, 10.4, 9, 13, 0.14), C.sky);
    const sh = [];
    for (let a = -30; a <= 150; a += 10) sh.push([Math.cos(a * RAD) * 10.2, -10 + Math.sin(a * RAD) * 8.8]);
    for (let a = 150; a >= -30; a -= 10) sh.push([-2.6 + Math.cos(a * RAD) * 8.6, -12 + Math.sin(a * RAD) * 7.2]);
    t.shape(sh, "#6385C2", 0.01);
    [[-6, -14], [-2, -16], [3, -15], [7, -12], [-7, -8], [-3, -10], [2, -10.4], [6, -7], [-4, -4.6], [1, -5.4], [-1, -13]]
      .forEach(([x, y]) => { t.star(x, y, 0.95, 0.7); });
  };

  F.allium = (t) => {
    t.ground();
    t.leaf(L.strap, -1, 39.4, 14, -70, "cOlive", 1.3); t.leaf(L.strap, 1, 39.4, 13, 66, "cOlive", 1.3);
    t.stem([[0, 40], [0.8, 10], [0, -11]], 1.0);
    t.head(0, -18, 1.3);
    t.disc(0, -18, 7.2, 7.2, C.lilac);
    const sh = [];
    for (let a = -20; a <= 160; a += 12) sh.push([Math.cos(a * RAD) * 7.1, -18 + Math.sin(a * RAD) * 7.1]);
    for (let a = 160; a >= -20; a -= 12) sh.push([-1.8 + Math.cos(a * RAD) * 6, -19.6 + Math.sin(a * RAD) * 6]);
    t.shape(sh, C.violet, 0.01);
    for (let i = 0; i < 16; i++) {
      const a = i * 137.5 * RAD, r = 5.6 * Math.sqrt((i + 0.5) / 16);
      t.star(Math.cos(a) * r, -18 + Math.sin(a) * r, 0.9);
    }
  };

  F.dandelion = (t) => {
    t.ground();
    for (const a of [-70, -50, 54, 72]) t.leaf(L.spear, 0, 39.4, 9, a, a < 0 ? "cLeafD" : "cLeaf", 1);
    t.stem([[0, 40], [1, 14], [0, -12.4]], 0.8);
    t.head(0, -14, 1.4);
    t.disc(0, -14, 1.6, 1.6, "#C9B98A");
    for (let i = 0; i < 24; i++) {
      const a = i * 15 * RAD, r0 = 1.6, r1 = 8;
      const e = [Math.sin(a) * r1, -14 - Math.cos(a) * r1];
      t.line([[Math.sin(a) * r0, -14 - Math.cos(a) * r0], e], 0.4, { curve: false });
      for (const d of [-28, 0, 28]) {
        const b = a + d * RAD;
        t.line([e, [e[0] + Math.sin(b) * 1.3, e[1] - Math.cos(b) * 1.3]], 0.35, { curve: false });
      }
    }
    t.line([[11, -22], [13, -25]], 0.35, { curve: false });
    for (const d of [-28, 0, 28]) t.line([[13, -25], [13 + Math.sin((32 + d) * RAD) * 1.3, -25 - Math.cos((32 + d) * RAD) * 1.3]], 0.35, { curve: false });
  };

  F.thistle = (t) => {
    t.ground();
    const st = [[0, 40], [1, 16], [0, -4.6]];
    t.stem(st, 1.0);
    const s = t.along(st, 0.4);
    for (const sd of [-1, 1]) {
      const at = t.blade(L.lance, s.x, s.y, 10, sd * 60, sd < 0 ? "cLeafD" : "cOlive", 1.2, true);
      for (let j = 1; j < 5; j++) t.line([at(sd * 0.2, j * 0.2), at(sd * 0.32, j * 0.2 + 0.06)], 0.6, { curve: false });
    }
    t.head(0, -9, 1.4);
    t.shape(t.ell(0, -8.6, 4.4, 4), C.green);
    t.line([[-3, -10], [3, -6]], 0.5, { curve: false }); t.line([[3, -10], [-3, -6]], 0.5, { curve: false });
    t.line([[-4, -8], [0, -5]], 0.5, { curve: false }); t.line([[4, -8], [0, -5]], 0.5, { curve: false });
    const br = [[-3.6, -11]];
    for (let a = -54; a <= 54; a += 9) br.push([Math.sin(a * RAD) * 8, -11.2 - Math.cos(a * RAD) * 8]);
    br.push([3.6, -11]);
    t.shape(br, "#A35AB0");
    for (let a = -45; a <= 45; a += 9) t.line([[0, -11.4], [Math.sin(a * RAD) * 7.4, -11.4 - Math.cos(a * RAD) * 7.4]], 0.45, { curve: false });
    for (const a of [-110, -70, 70, 110]) t.line([[Math.sin(a * RAD) * 4.4, -8.6 - Math.cos(a * RAD) * 4], [Math.sin(a * RAD) * 6.4, -8.6 - Math.cos(a * RAD) * 5.6]], 0.5, { curve: false });
  };

  F.protea = (t) => {
    t.ground();
    const st = [[0, 40], [-0.8, 16], [0, -2]];
    t.stem(st, 1.4);
    for (const [u, a] of [[0.25, -50], [0.4, 46], [0.6, -40]]) { const s = t.along(st, u); t.leaf(L.oval, s.x, s.y, 7, a, "cOlive", 0.8); }
    t.head(0, -8, 1.3);
    [-62, -40, -18, 4, 26, 48, 66].forEach((a) => t.blade(L.spear, 0, -2, 13, a, C.fuchsia, 1.2, false));
    t.disc(0, -13.6, 4.6, 2.2, C.white, "stipple");
    [-36, -12, 12, 36].forEach((a) => t.blade(L.spear, 0, -1.6, 10.6, a, C.pink, 1.2, false));
  };

  /* ── cups, bells, trumpets ────────────────────────────────────────── */

  const CUP = [[0,0],[-0.24,0.05],[-0.42,0.28],[-0.48,0.62],[-0.44,0.98],[-0.4,1.02],
               [-0.3,0.86],[-0.04,1.08],[0.04,1.08],[0.3,0.86],[0.4,1.02],[0.44,0.98],
               [0.48,0.62],[0.42,0.28],[0.24,0.05]];
  function cup(t, x, y, size, tilt, fill) {
    const a = tilt * RAD;
    const at = (u, v) => [x + (u * Math.cos(a) + v * Math.sin(a)) * size, y + (u * Math.sin(a) - v * Math.cos(a)) * size];
    t.shape(CUP.map(([u, v]) => at(u, v)), fill);
    /* the right-hand petal is turned from the light: one darker fill */
    t.fillOnly([[0.06, 0.12], [0.14, 0.42], [0.3, 0.86], [0.4, 1.02], [0.44, 0.98], [0.48, 0.62],
                [0.42, 0.28], [0.24, 0.05]].map(([u, v]) => at(u, v)), fill, 0.8);
    t.fillOnly([[-0.2, 0.06], [-0.06, 0.14], [0.06, 0.12], [0.2, 0.06], [0, 0.01]].map(([u, v]) => at(u, v)), fill, 0.7);
    t.line([at(-0.3, 0.86), at(-0.14, 0.42), at(-0.06, 0.12)], 0.8, { curve: true });
    t.line([at(0.3, 0.86), at(0.14, 0.42), at(0.06, 0.12)], 0.8, { curve: true });
    for (const u of [-0.07, 0.05]) t.line([at(u, 0.5), at(u * 1.4, 0.95)], 0.42, { curve: true });
  }

  F.tulip = (t) => {
    t.ground();
    t.leaf(L.strap, -0.6, 39.4, 20, -24, "cOlive", 1.6); t.leaf(L.strap, 0.6, 39.4, 16, 30, "cLeaf", 1.6);
    t.stem([[0, 40], [1, 14], [0, -6]], 1.0);
    t.head(0, 1, 1.3);
    cup(t, 0, -6, 11, -4, C.red);
  };

  F.crocus = (t) => {
    t.ground();
    [[-4.2, 18, -6, C.violet], [4.4, 24, 8, C.lilac]].forEach(([x, top, tilt, col], i) => {
      for (const a of [-12, 10]) t.leaf(L.needle, x * 0.4, 39.6, 40 - top + 4, a + tilt, "cLeaf", 1.2);
      t.stem([[x * 0.4, 40], [x, top + 0.2]], 0.8);
      const at = t.blade(PR.goblet, x, top, 12, tilt, col, 1, false);
      t.line([at(-0.08, 0.15), at(-0.02, 0.96)], 0.6, { curve: true });
      t.line([at(0.08, 0.15), at(0.02, 0.96)], 0.6, { curve: true });
      void i;
    });
  };

  F.daffodil = (t) => {
    t.ground();
    t.leaf(L.strap, -0.6, 39.4, 22, -16, "cLeaf", 1.3); t.leaf(L.strap, 0.6, 39.4, 19, 20, "cLeafD", 1.3);
    t.stem([[0, 40], [0.4, 10], [-0.6, -2], [-2.2, -5.4]], 0.9);
    t.blade(PR.lemon, -1.6, -4.8, 3, -40, "#C7B79E", 0.8, false);
    t.head(1.4, -12, 1.45);
    t.radial(1.4, -12, { n: 6, r0: 1.6, len: 7.2, prof: L.spear, wide: 1.25, fill: "#F7E07A" });
    t.shape(t.scallop(2.2, -11.4, 3.6, 3.4, 8, 0.16), C.amber);
    t.disc(2.5, -11.2, 1.9, 1.8, "#D9811C");
  };

  F.calla = (t) => {
    t.ground();
    t.leaf(L.spear, -0.6, 39.4, 16, -38, "cLeafD", 1.2); t.leaf(L.spear, 0.6, 39.4, 14, 42, "cLeaf", 1.2);
    t.stem([[0, 40], [0.6, 10], [0, -4]], 1.0);
    t.head(0, -4, 1.25);
    const at = t.blade(PR.calla, 0, -4, 16, 16, C.white, 1.05, false);
    t.line([at(-0.36, 0.9), at(0, 0.84), at(0.32, 0.98)], 0.7, { curve: true });
    const s = at(0, 0.62);
    t.blade(PR.lemon, s[0], s[1], 4.6, 14, C.yellow, 0.9, false);
  };

  F.lily = (t) => {
    t.ground();
    const st = [[0, 40], [1, 16], [0, -4]];
    t.stem(st, 1.0);
    for (const u of [0.2, 0.36, 0.52]) pair(t, st, u, 6, 48, null, L.lance);
    t.head(0, -12, 1.3);
    t.radial(0, -12, { n: 6, r0: 1, len: 10, prof: L.spear, wide: 1.25, fill: "#E5679A", rib: true });
    for (let i = 0; i < 6; i++)
      for (let j = 1; j <= 3; j++) {
        const a = (i * 60 + 10) * RAD, r = 2 + j * 1.8;
        t.dot(Math.sin(a) * r, -12 - Math.cos(a) * r, 0.32);
      }
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + 30) * RAD, e = [Math.sin(a) * 6.4, -12 - Math.cos(a) * 6.4];
      t.line([[0, -12], e], 0.5, { curve: false });
      t.blade(PR.lemon, e[0], e[1], 1.6, i * 60 + 120, "#7A3B1E", 0.8, false);
    }
  };

  F.morningglory = (t) => {
    t.ground();
    const st = [[0, 40], [-3, 26], [2, 14], [-1, 4], [0, -4]];
    t.stem(st, 0.8);
    t.leaf(L.heart, -2.4, 24, 7, -70, "cLeaf", 1.1); t.leaf(L.heart, 1.6, 12, 6, 70, "cLeafD", 1.1);
    t.line([[1.8, 14], [5, 16], [6.4, 14], [5, 13]], 0.5, { curve: true });
    t.head(0, -12, 1.4);
    t.shape(t.scallop(0, -12, 8, 8, 5, 0.06, -Math.PI / 2), C.blue);
    const st5 = [];
    for (let i = 0; i < 10; i++) {
      const a = (i * 36) * RAD, r = i % 2 ? 1.2 : 7.4;
      st5.push([Math.sin(a) * r, -12 - Math.cos(a) * r]);
    }
    t.shape(st5, "#E9EFFB", 0.6, false);
    t.disc(0, -12, 1.7, 1.7, "#F7E9A0");
  };

  F.petunia = (t) => {
    t.ground();
    const st = [[0, 40], [1.6, 20], [0, -4.2]];
    t.stem(st, 0.9);
    pair(t, st, 0.3, 7, 60, null, L.oval);
    t.blade(PR.goblet, 0.8, 20, 6, 50, "#9C4AAE", 0.9, false);
    t.head(0, -11.6, 1.45);
    t.shape(t.scallop(0, -11.6, 7.4, 7.4, 5, 0.18, -Math.PI / 2), C.plum);
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 + 36) * RAD;
      t.line([[Math.sin(a) * 2, -11.6 - Math.cos(a) * 2], [Math.sin(a) * 6.4, -11.6 - Math.cos(a) * 6.4]], 0.45, { curve: true });
    }
    t.disc(0, -11.6, 2, 2, "ink");
  };

  F.bluebell = (t) => {
    t.ground();
    t.leaf(L.strap, -0.6, 39.4, 18, -20, "cLeaf", 1.2); t.leaf(L.strap, 0.6, 39.4, 16, 26, "cLeafD", 1.2);
    const st = [[0, 40], [1.6, 14], [-1, -8], [-6, -16], [-10, -15]];
    t.stem(st, 0.85);
    for (let i = 0; i < 6; i++) {
      const s = t.along(st, 0.52 + i * 0.09);
      const b = [s.x + 1.2, s.y + 1.4];
      t.line([[s.x, s.y], b], 0.45, { curve: false });
      t.blade(PR.bell, b[0], b[1], 5.4 - i * 0.4, 168, C.bell, 1.15, false);
    }
  };

  F.valley = (t) => {
    t.ground();
    t.leaf(L.oval, -1, 39.6, 26, -10, "cLeafD", 0.78); t.leaf(L.oval, 1, 39.6, 24, 14, "cLeaf", 0.78);
    const st = [[2.6, 40], [4.8, 12], [8, -2], [14, -4]];
    t.stem(st, 0.7);
    for (let i = 0; i < 6; i++) {
      const s = t.along(st, 0.5 + i * 0.09);
      const b = [s.x + 0.4, s.y + 1.8];
      t.line([[s.x, s.y], b], 0.4, { curve: true });
      t.blade(PR.bell, b[0], b[1], 3.6 - i * 0.25, 178, C.white, 1.3, false);
    }
  };

  function fuchsiaFlower(t, x, y, s) {
    t.line([[x, y], [x, y + 2.6 * s]], 0.45, { curve: false });
    const y1 = y + 2.6 * s;
    t.blade(PR.lemon, x, y1, 3.2 * s, 180, C.red, 0.7, false);
    const y2 = y1 + 3 * s;
    for (const a of [-118, -150, 150, 118]) t.blade(L.lance, x, y2, 6 * s, a + 180, C.red, 1.1, false);
    t.blade(PR.bell, x, y2 - 0.4, 5.2 * s, 180, C.purple, 1.25, false);
    for (const d of [-1.2, 0, 1.2]) {
      t.line([[x + d * 0.4 * s, y2 + 4.6 * s], [x + d * s, y2 + 8 * s]], 0.4, { curve: false });
      t.dot(x + d * s, y2 + 8.2 * s, 0.35);
    }
  }
  F.fuchsia = (t) => {
    t.ground();
    const st = [[-2, 40], [-1.6, 12], [2, -8], [9, -14], [13, -11]];
    t.stem(st, 0.9);
    for (const [u, sd] of [[0.3, -1], [0.45, 1], [0.6, -1]]) {
      const s = t.along(st, u);
      t.leaf(L.oval, s.x, s.y, 6, s.ang + sd * 60, sd < 0 ? "cLeafD" : "cLeaf", 0.9);
    }
    fuchsiaFlower(t, 13, -11, 1);
    fuchsiaFlower(t, 4.4, -10, 0.8);
  };

  F.snowdrop = (t) => {
    t.ground();
    t.leaf(L.strap, -0.6, 39.4, 22, -10, "cOlive", 1.1); t.leaf(L.strap, 0.6, 39.4, 20, 14, "cOlive", 1.1);
    t.stem([[0, 40], [0.4, 10], [2, -3], [5, -4]], 0.75);
    t.head(5, 0, 1.4);
    t.blade(PR.lemon, 3.4, -3.6, 2.6, 80, "#A9B49A", 0.7, false);
    t.line([[5, -4], [5.6, -2.2]], 0.45, { curve: false });
    t.blade(PR.spathe, 5.6, -2.2, 7.4, 196, C.white, 1.1, false);
    t.blade(PR.spathe, 5.6, -2.2, 7.4, 164, C.white, 1.1, false);
    t.blade(PR.bell, 5.6, -1.4, 4, 180, "#EAF0DF", 1.2, false);
    t.dot(5.6, 2.4, 0.5);
  };

  /* ── spikes ───────────────────────────────────────────────────────── */

  F.foxglove = (t) => {
    t.ground();
    t.leaf(L.lance, -0.6, 39.4, 14, -64, "cLeafD", 1.3); t.leaf(L.lance, 0.6, 39.4, 13, 62, "cLeaf", 1.3);
    const st = [[0, 40], [0.6, 6], [0, -28]];
    t.stem(st, 1.0);
    for (let i = 0; i < 10; i++) {
      const u = 0.32 + i * 0.065, s = t.along(st, u), sd = i % 3 === 2 ? -1 : 1;
      const len = 7.2 - i * 0.48;
      if (i < 8) {
        const at = t.blade(PR.tube, s.x, s.y, len, sd * 142, "#C76BA8", 1.15, false);
        if (i < 5) for (const v of [0.72, 0.84]) t.dot(...at(sd * 0.06, v), 0.3);
      } else t.blade(PR.lemon, s.x, s.y, 2.2, sd * 40, "cLeaf", 1, false);
    }
  };

  F.snapdragon = (t) => {
    t.ground();
    const st = [[0, 40], [-0.6, 8], [0, -24]];
    t.stem(st, 1.0);
    pair(t, st, 0.2, 8, 54, null, L.lance); pair(t, st, 0.36, 6.4, 50, null, L.lance);
    for (let i = 0; i < 9; i++) {
      const s = t.along(st, 0.48 + i * 0.058), sd = i % 2 ? 1 : -1;
      if (i < 7) {
        t.blade(PR.lemon, s.x, s.y, 4.6 - i * 0.3, sd * 62, C.yellow, 1.35, false);
        t.blade(PR.lemon, s.x + sd * 1.6, s.y + 1.2, 2.6 - i * 0.15, sd * 118, C.orange, 1.2, false);
      } else t.blade(PR.lemon, s.x, s.y, 2, sd * 30, "cLeaf", 1, false);
    }
  };

  F.lupin = (t) => {
    t.ground();
    t.stem([[0, 40], [-4, 34]], 0.6);
    for (let i = 0; i < 7; i++) t.leaf(L.lance, -4, 34, 6, -90 + i * 30, i % 2 ? "cLeafD" : "cLeaf", 1);
    const st = [[0, 40], [0.6, 10], [0, -27]];
    t.stem(st, 1.0);
    for (let i = 0; i < 12; i++) {
      const s = t.along(st, 0.44 + i * 0.046), w = 3.6 * (1 - i / 13);
      for (const sd of [-1, 0, 1]) {
        if (sd === 0 && i % 2) continue;
        t.blade(Kit.LEAF.round, s.x + sd * w * 0.55, s.y + 0.4, 2.8 * (1 - i / 16), sd * 70,
                i % 2 ? "#A79CE6" : "#6E62C9", 1.1, false);
      }
    }
  };

  F.hyacinth = (t) => {
    t.ground();
    for (const a of [-34, -14, 14, 34]) t.leaf(L.strap, 0, 39.4, 14, a, a < 0 ? "cLeafD" : "cLeaf", 1.9);
    const st = [[0, 40], [0, -14]];
    t.stem(st, 1.6);
    for (let r = 0; r < 8; r++) {
      const y = 10 - r * 3.2, w = 4.6 - Math.abs(r - 3) * 0.35;
      for (let j = -1; j <= 1; j++) {
        const cx = j * w * 0.8 + (r % 2 ? 1.2 : 0), cy = y - Math.abs(j) * 0.6;
        const pts = [];
        for (let i = 0; i < 12; i++) {
          const a = (i * 30) * RAD, rr = i % 2 ? 1.1 : 2.4;
          pts.push([cx + Math.sin(a) * rr, cy - Math.cos(a) * rr]);
        }
        t.shape(pts, r % 2 ? "#8F6AD8" : "#A88BE6", 0.9, true);
      }
    }
  };

  F.gladiolus = (t) => {
    t.ground();
    for (const a of [-14, 8]) t.leaf(L.needle, 0, 39.6, 34, a, a < 0 ? "cLeafD" : "cLeaf", 0.85);
    const st = [[0, 40], [1.4, 6], [3, -27]];
    t.stem(st, 1.0);
    for (let i = 0; i < 8; i++) {
      const s = t.along(st, 0.36 + i * 0.075), sd = i % 2 ? 1 : -1;
      if (i < 6) {
        const at = t.blade(PR.tube, s.x, s.y, 6.6 - i * 0.5, sd * 58, C.coral, 1.25, false);
        const m = at(0, 1);
        t.blade(L.round, m[0], m[1], 2.4 - i * 0.15, sd * 30, "#F49384", 1.1, false);
        t.blade(L.round, m[0], m[1], 2.4 - i * 0.15, sd * 110, "#F49384", 1.1, false);
      } else t.blade(PR.lemon, s.x, s.y, 2.2, sd * 26, "cLeaf", 1, false);
    }
  };

  F.iris = (t) => {
    t.ground();
    for (const a of [-12, 10, -26]) t.leaf(L.needle, 0, 39.6, 30, a, a === 10 ? "cLeaf" : "cLeafD", 1.6);
    t.stem([[0, 40], [0.6, 10], [0, -6]], 1.0);
    t.head(0, -8, 1.35);
    for (const a of [-22, 0, 22]) t.blade(PR.spathe, 0, -9, 10, a, "#7D63C2", 1.05, false);
    for (const a of [-118, 118, 180]) {
      const at = t.blade(L.round, 0, -8.6, a === 180 ? 8 : 9, a, "#5B3E9E", 1.15, false);
      const b = at(0, 0.18), e = at(0, 0.5);
      t.line([b, e], 1.4, { curve: false });
      t.blade(PR.lemon, b[0], b[1], 3, a, C.yellow, 0.7, false);
    }
  };

  /* ── wrap ─────────────────────────────────────────────────────────── */
  const NAMES = {
    daisy: "Daisy", sunflower: "Sunflower", gerbera: "Gerbera", susan: "Black-eyed Susan",
    coneflower: "Coneflower", cosmos: "Cosmos", zinnia: "Zinnia", marigold: "Marigold",
    aster: "Aster", mum: "Chrysanthemum", dahlia: "Dahlia", cornflower: "Cornflower",
    anemone: "Anemone", poppy: "Poppy", cherry: "Cherry blossom", frangipani: "Frangipani",
    periwinkle: "Periwinkle", clematis: "Clematis", passion: "Passionflower",
    waterlily: "Water lily", lotus: "Lotus", hibiscus: "Hibiscus", magnolia: "Magnolia",
    camellia: "Camellia", rose: "Rose", peony: "Peony", ranunculus: "Ranunculus",
    carnation: "Carnation", hydrangea: "Hydrangea", allium: "Allium", dandelion: "Dandelion",
    thistle: "Thistle", protea: "Protea", tulip: "Tulip", crocus: "Crocus",
    daffodil: "Daffodil", calla: "Calla lily", lily: "Stargazer lily",
    morningglory: "Morning glory", petunia: "Petunia", bluebell: "Bluebell",
    valley: "Lily of the valley", fuchsia: "Fuchsia", snowdrop: "Snowdrop",
    foxglove: "Foxglove", snapdragon: "Snapdragon", lupin: "Lupin", hyacinth: "Hyacinth",
    gladiolus: "Gladiolus", iris: "Iris",
  };

  /* one frame for all fifty: one scale, one ground line */
  const FRAME = [-21, -35, 21, 44];

  const out = {};
  for (const key of Object.keys(F)) {
    out[key] = Spec.wrap("flower", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.64;
      const t = kit(k);
      F[key](t);
      t.flush();
      const o = k.done();
      o.frame = FRAME.map((v, i) => (i % 2 ? 26 + v : 50 + v));
      return o;
    });
  }
  out._keys = Object.keys(F);
  out._names = NAMES;
  return out;
})();
