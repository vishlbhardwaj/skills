/*
 * FIVE BUILDINGS, IN TWO-POINT PERSPECTIVE.
 *
 * The first version of this file was flat elevation, measured off the Sézane
 * shopfront: ratio 0.743, stroke 0.65% of width, ink 16% of bbox, 55% of that
 * ink SOLID BLACK FILL, three near-equal bays, even density by fifths.
 *
 * Those measurements still govern the FACADE. What changed is that the facade
 * is now a wall in space rather than a drawing on paper:
 *
 *   · `View.two` — a level pinhole camera with the world yawed. Verticals stay
 *     vertical (x and y divide by the same depth), and the two horizontal axes
 *     each get a vanishing point. That is what makes it read as architecture
 *     and not as a dramatic camera angle.
 *
 *   · Every wall is a `V.face(origin, du, dv)` and all its detail is authored
 *     in plain (u, v) — u across, v DOWN — exactly as in elevation. Writing
 *     each window out in three dimensions would make the file unreadable.
 *
 *   · The real depth cues are the things that PROJECT: a cornice oversailing
 *     the wall shows its underside, a sill shows its top, an awning shows its
 *     flank. In elevation those were two parallel lines; here they are solids,
 *     and they are most of what sells the depth.
 *
 *   · The horizon sits about a storey up, where a person standing across the
 *     street would put it — so you look slightly UP at the cornice and
 *     slightly DOWN at the pavement.
 *
 * `curve` DEFAULTS TO FALSE here: canvas.html draws marks with
 * `curve: m.curve !== false`, and a building is straight lines.
 */
window.Arch = (function () {
  const A = {};
  /*
   * PANE TREATMENT, switchable.
   *
   * The measured reference puts 55% of its ink in solid black panes, and that
   * contrast is why an elevation reads — so filled is the default and the
   * main canvas keeps it. But a fill is a single instant in a live replay: it
   * blocks in and it is over. Drawn instead as frame, sash and glazing bars,
   * the same window becomes a dozen strokes you can watch being made, which
   * is what a recording wants.
   */
  const OPT = (window.ArchOpts = window.ArchOpts || { fillPanes: true });
  const GNDY = 26;            /* ground, below eye level (horizon is y = 0) */

  function sheet(V) {
    const marks = [], regions = [], tones = [];
    const k = {
      V, OUT: 1.0, MID: 0.62, FINE: 0.4,
      M: (pts, w, x) => marks.push({ curve: false, pts, w, ...(x || {}) }),
      F: (pts) => tones.push({ pts, kind: "solid", w: 0.4, fill: "ink" }),
      done: () => ({ marks, regions, tones }),
    };
    return k;
  }

  const area = (p) => {
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length];
      a += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return a / 2;
  };

  /*
   * A SLAB — an axis-aligned box, drawn as its camera-facing faces only.
   * Visibility by signed area of the projected quad, which is the cheapest
   * correct back-face test and needs no normals.
   */
  function slab(k, x0, x1, yTop, yBot, z0, z1, w) {
    const V = k.V, P = (x, y, z) => V.p(x, y, z);
    const F = [
      [[x0, yTop, z0], [x1, yTop, z0], [x1, yBot, z0], [x0, yBot, z0]],   /* front */
      [[x0, yTop, z1], [x0, yTop, z0], [x0, yBot, z0], [x0, yBot, z1]],   /* left  */
      [[x1, yTop, z0], [x1, yTop, z1], [x1, yBot, z1], [x1, yBot, z0]],   /* right */
      [[x0, yTop, z1], [x1, yTop, z1], [x1, yTop, z0], [x0, yTop, z0]],   /* top   */
      [[x0, yBot, z0], [x1, yBot, z0], [x1, yBot, z1], [x0, yBot, z1]],   /* under */
    ];
    F.forEach((f) => {
      const p = f.map((q) => P(q[0], q[1], q[2]));
      if (area(p) > 0.02) k.M(p, w || k.MID, { closed: true });
    });
  }

  /* ── face-space drawing: u across, v DOWN, exactly as in elevation ── */
  const rectF = (k, F, u0, v0, u1, v1, w) =>
    k.M(F.poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]), w, { closed: true });

  function bandF(k, F, u0, u1, v, gap, n, w) {
    for (let i = 0; i < n; i++)
      k.M([F.at(u0, v + i * gap), F.at(u1, v + i * gap)], w || k.MID);
  }

  /*
   * A WINDOW on a face. Panes are separate filled rectangles, so the glazing
   * bar is the WHITE GAP between them — which is how a glazing bar actually
   * works, and it survives perspective without any special case.
   *
   * `sill` is a real solid projecting from the wall: in elevation it was two
   * lines, here you see its top surface, and that is a depth cue for free.
   */
  function windowF(k, F, cu, v0, w, h, cols, rows, o) {
    const p = o || {};
    const u0 = cu - w / 2, u1 = cu + w / 2, v1 = v0 + h;
    const fr = p.frame === undefined ? w * 0.08 : p.frame;
    rectF(k, F, u0, v0, u1, v1, k.OUT);
    rectF(k, F, u0 + fr, v0 + fr, u1 - fr, v1 - fr, k.MID);
    const bar = p.bar === undefined ? w * 0.06 : p.bar;
    const iw = w - 2 * fr, ih = h - 2 * fr;
    const pw = (iw - bar * (cols - 1)) / cols, ph = (ih - bar * (rows - 1)) / rows;
    if (OPT.fillPanes) {
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) {
          const pu = u0 + fr + c * (pw + bar), pv = v0 + fr + r * (ph + bar);
          k.F(F.poly([[pu, pv], [pu + pw, pv], [pu + pw, pv + ph], [pu, pv + ph]]));
        }
    } else {
      /* glazing bars as real joinery: a heavier meeting rail where the two
         sashes close, lighter bars between the panes, and a lintel over */
      const mid = rows > 1 ? Math.round(rows / 2) : 0;
      for (let c = 1; c < cols; c++) {
        const bu = u0 + fr + c * pw + (c - 1) * bar + bar / 2;
        k.M([F.at(bu, v0 + fr), F.at(bu, v1 - fr)], k.MID);
      }
      for (let r = 1; r < rows; r++) {
        const bv = v0 + fr + r * ph + (r - 1) * bar + bar / 2;
        k.M([F.at(u0 + fr, bv), F.at(u1 - fr, bv)], r === mid ? k.OUT * 0.9 : k.MID);
      }
      k.M([F.at(u0 - w * 0.08, v0 - w * 0.07), F.at(u1 + w * 0.08, v0 - w * 0.07)],
          k.OUT * 0.9);
    }
    /* reveal: the window sits back in the wall, so its left jamb shows */
    if (p.reveal !== false) {
      const d = p.reveal || 1.1;
      k.M([F.at(u0, v0), F.out(u0, v0, -d)], k.FINE);
      k.M([F.out(u0, v0, -d), F.out(u0, v1, -d)], k.FINE);
      k.M([F.at(u0, v1), F.out(u0, v1, -d)], k.FINE);
    }
    if (p.sill !== false) {
      const s = w * 0.11, pr = p.sillOut || 1.6;
      const top = [F.at(u0 - s, v1), F.at(u1 + s, v1),
                   F.out(u1 + s, v1, pr), F.out(u0 - s, v1, pr)];
      if (area(top) > 0.02 || area(top) < -0.02) k.M(top, k.OUT, { closed: true });
      k.M([F.out(u0 - s, v1, pr), F.out(u0 - s, v1 + s * 0.8, pr),
           F.out(u1 + s, v1 + s * 0.8, pr), F.out(u1 + s, v1, pr)], k.OUT);
      k.M([F.at(u0 - s, v1 + s * 0.8), F.out(u0 - s, v1 + s * 0.8, pr)], k.FINE);
    }
    if (p.arch) {
      const a = [], inner = [];
      for (let i = 0; i <= 14; i++) {
        const t = Math.PI * (i / 14);
        a.push([cu - Math.cos(t) * (w / 2), v0 - Math.sin(t) * (w * 0.46)]);
        inner.push([cu - Math.cos(t) * (w / 2 - fr), v0 - Math.sin(t) * (w * 0.46 - fr)]);
      }
      k.M(F.poly(a), k.OUT);
      k.F(F.poly(inner.concat([[cu + w / 2 - fr, v0], [cu - w / 2 + fr, v0]])));
    }
  }

  function oculusF(k, F, cu, cv, r, spokes) {
    const ring = (rr) => {
      const o = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        o.push([cu + Math.cos(a) * rr, cv + Math.sin(a) * rr]);
      }
      return F.poly(o);
    };
    k.M(ring(r), k.OUT, { closed: true, curve: true });
    k.M(ring(r * 0.86), k.MID, { closed: true, curve: true });
    const n = spokes || 8, gap = 0.055;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + gap, a1 = ((i + 1) / n) * Math.PI * 2 - gap;
      const seg = [[cu + Math.cos(a0) * r * 0.2, cv + Math.sin(a0) * r * 0.2]];
      for (let j = 0; j <= 5; j++) {
        const a = a0 + (a1 - a0) * (j / 5);
        seg.push([cu + Math.cos(a) * r * 0.8, cv + Math.sin(a) * r * 0.8]);
      }
      seg.push([cu + Math.cos(a1) * r * 0.2, cv + Math.sin(a1) * r * 0.2]);
      k.F(F.poly(seg));
    }
  }

  function doorF(k, F, cu, vBase, w, h, o) {
    const p = o || {};
    const u0 = cu - w / 2, u1 = cu + w / 2, v0 = vBase - h;
    /* the opening is recessed, so you see the jamb on one side */
    const d = 1.6;
    k.M([F.at(u0, v0), F.out(u0, v0, -d), F.out(u0, vBase, -d), F.at(u0, vBase)], k.MID);
    rectF(k, F, u0, v0, u1, vBase, k.OUT);
    rectF(k, F, u0 + w * 0.08, v0 + w * 0.08, u1 - w * 0.08, vBase - w * 0.08, k.MID);
    if (p.glazed) {
      const gw = (w - w * 0.34) / 2;
      for (let c = 0; c < 2; c++)
        for (let r = 0; r < 3; r++) {
          const pu = u0 + w * 0.13 + c * (gw * 0.82 + w * 0.06);
          const pv = v0 + w * 0.13 + r * (h * 0.2);
          const q = [[pu, pv], [pu + gw * 0.78, pv],
                     [pu + gw * 0.78, pv + h * 0.16], [pu, pv + h * 0.16]];
          if (OPT.fillPanes) k.F(F.poly(q));
          else k.M(F.poly(q), k.MID, { closed: true });
        }
    } else {
      [0.22, 0.56].forEach((t) =>
        rectF(k, F, u0 + w * 0.16, v0 + h * t, u1 - w * 0.16, v0 + h * (t + 0.26), k.FINE));
    }
  }

  /* an awning: a solid wedge, so you see its underside and its end */
  function awningF(k, F, u0, u1, v, drop, proj, n) {
    const A1 = F.at(u0, v), B1 = F.at(u1, v);
    const A2 = F.out(u0 - 1, v + drop, proj), B2 = F.out(u1 + 1, v + drop, proj);
    k.M([A1, B1, B2, A2], k.OUT, { closed: true });
    k.M([A1, A2], k.MID);
    const scal = [A2];
    for (let i = 1; i <= n; i++) {
      const t = i / n, tm = (i - 0.5) / n;
      const mu = u0 - 1 + (u1 - u0 + 2) * tm, eu = u0 - 1 + (u1 - u0 + 2) * t;
      scal.push(F.out(mu, v + drop + 1.6, proj), F.out(eu, v + drop, proj));
    }
    k.M(scal, k.MID, { curve: true });
    for (let i = 1; i < n; i++) {
      const t = i / n;
      k.M([F.at(u0 + (u1 - u0) * t, v), F.out(u0 - 1 + (u1 - u0 + 2) * t, v + drop, proj)],
          k.FINE);
    }
  }

  function chimney(k, cx, yTop, z, w, h) {
    slab(k, cx - w / 2, cx + w / 2, yTop - h, yTop, z - w / 2, z + w / 2, k.OUT);
    slab(k, cx - w * 0.62, cx + w * 0.62, yTop - h - w * 0.3, yTop - h,
         z - w * 0.62, z + w * 0.62, k.OUT);
  }

  /* the fine rung, standing on the pavement in front of the wall */
  function pot(k, x, z, h, kind, seed) {
    let a = seed | 0 || 7;
    const R = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const V = k.V, pw = h * 0.34;
    const P = (dx, dy) => V.p(x + dx, GNDY + dy, z);
    k.M([P(-pw / 2, -h * 0.3), P(-pw * 0.4, 0), P(pw * 0.4, 0), P(pw / 2, -h * 0.3)],
        k.MID, { closed: true });
    k.M([P(-pw * 0.54, -h * 0.3), P(pw * 0.54, -h * 0.3)], k.MID);
    if (kind === "cone") {
      k.M([P(-h * 0.2, -h * 0.3), P(-h * 0.13, -h * 0.75), P(0, -h * 1.02),
           P(h * 0.13, -h * 0.75), P(h * 0.2, -h * 0.3)], k.MID, { curve: true });
      for (let i = 0; i < 14; i++) {
        const t = R(), yy = -h * (0.3 + 0.7 * t), ww = h * 0.19 * (1 - t * 0.85);
        const ox = -ww + R() * ww * 2;
        k.M([P(ox, yy), P(ox, yy + h * 0.05)], k.FINE);
      }
    } else {
      k.M([P(0, -h * 0.3), P(h * 0.03, -h * 0.6)], k.MID);
      for (let i = 0; i < 9; i++) {
        const an = -2.4 + (i / 8) * 1.7, L = h * (0.2 + R() * 0.2);
        const bx = h * 0.02, by = -h * (0.44 + R() * 0.18);
        const tx = bx + Math.cos(an) * L, ty = by + Math.sin(an) * L;
        k.M([P(bx, by), P((bx + tx) / 2, (by + ty) / 2 - h * 0.04), P(tx, ty)],
            k.FINE, { curve: true });
        for (let j = 1; j <= 3; j++) {
          const t = j / 4, px = bx + (tx - bx) * t, py = by + (ty - by) * t - h * 0.03;
          const leaf = [P(px - h * 0.035, py), P(px, py - h * 0.045),
                        P(px + h * 0.035, py), P(px, py + h * 0.03)];
          /* a leaf this small is one quick stroke, not a blocked-in shape —
             and 54 of them were a third of the fills in the whole drawing */
          if (OPT.fillPanes) k.F(leaf);
          else k.M(leaf, k.FINE, { closed: true });
        }
      }
    }
  }

  /* pavement: a band running along the front and round the corner */
  function pavement(k, x0, x1, zBack, out) {
    const V = k.V, o = out || 9;
    k.M([V.p(x0 - o, GNDY, -o), V.p(x1 + o * 0.4, GNDY, -o)], k.OUT);
    k.M([V.p(x0, GNDY, -o), V.p(x0, GNDY, zBack)], k.MID);
    k.M([V.p(x0 - o, GNDY, -o), V.p(x0 - o, GNDY, zBack)], k.FINE);
  }

  /* ── build helper: the two walls every building has ───────────────── */
  function massing(o) {
    const V = View.two({ f: o.f || 320, yaw: o.yaw === undefined ? -20 : o.yaw,
                         dist: o.dist || 190, hor: 58, cx: 50 });
    const k = sheet(V);
    const W = o.w, D = o.d, TOP = o.top;
    const front = V.face([-W / 2, TOP, 0], [1, 0, 0], [0, 1, 0]);
    const flank = V.face([-W / 2, TOP, 0], [0, 0, 1], [0, 1, 0]);
    return { k, V, W, D, TOP, H: GNDY - TOP, front, flank };
  }

  /* ── 1 · THE SHOPFRONT ────────────────────────────────────────────── */
  A.shopfront = () => {
    const M = massing({ w: 52, d: 30, top: -74, f: 330, dist: 200 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const FASCIA = H * 0.60, SHOP = H * 0.70;
    /* flank first — it is behind, and the front wall's line work sits over it */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    windowF(k, flank, D * 0.52, H * 0.14, 7, 13, 2, 2, { sillOut: 1.0 });
    windowF(k, flank, D * 0.52, H * 0.38, 7, 13, 2, 2, { sillOut: 1.0 });
    bandF(k, flank, 0, D, FASCIA, 1.4, 2, k.MID);
    /* front wall */
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    /* cornice: a real slab oversailing on both sides. Above eye level, so its
       UNDERSIDE shows — the single strongest depth cue on the whole drawing */
    slab(k, -W / 2 - 2.4, W / 2 + 2.4, TOP - 3.2, TOP, -2.4, D + 2.4, k.OUT);
    chimney(k, -W * 0.18, TOP - 3.2, D * 0.55, 4.2, 9);
    [0.22, 0.5, 0.78].forEach((f) => windowF(k, front, W * f, H * 0.12, 9, 17, 2, 3));
    bandF(k, front, -1, W + 1, FASCIA, 1.5, 2, k.OUT);
    /* shopfront, recessed behind the wall plane */
    rectF(k, front, 2, FASCIA + 2.5, W - 2, SHOP - 1, k.MID);
    awningF(k, front, 3, W - 3, SHOP, 3.6, 7, 9);
    const sv = SHOP + 5;
    [[2.5, W * 0.40], [W * 0.60, W - 2.5]].forEach(([u0, u1]) => {
      rectF(k, front, u0, sv, u1, H - 1.5, k.OUT);
      k.M([front.at(u0, sv), front.out(u0, sv, -2.2),
           front.out(u0, H - 1.5, -2.2), front.at(u0, H - 1.5)], k.FINE);
      const n = 2, w = (u1 - u0) / n;
      for (let i = 1; i < n; i++)
        k.M([front.at(u0 + i * w, sv), front.at(u0 + i * w, H - 1.5)], k.MID);
      k.F(front.poly([[u0 + 1.4, H - 9], [u1 - 1.4, H - 9],
                      [u1 - 1.4, H - 3], [u0 + 1.4, H - 3]]));
    });
    doorF(k, front, W * 0.5, H - 1.5, 7, 17, { glazed: true });
    pavement(k, -W / 2, W / 2, D);
    pot(k, -W * 0.40, -5, 10, "cone", 3);
    pot(k, W * 0.40, -5, 10, "cone", 11);
    pot(k, -W * 0.14, -4.5, 7, "bush", 23);
    return k.done();
  };

  /* ── 2 · STEPPED-GABLE TOWNHOUSE ──────────────────────────────────── */
  A.townhouse = () => {
    const M = massing({ w: 34, d: 30, top: -82, f: 330, dist: 205, yaw: -24 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const EAVE = 26;
    k.M([V.p(-W / 2, TOP + EAVE, 0), V.p(-W / 2, TOP + EAVE, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    windowF(k, flank, D * 0.5, EAVE + H * 0.12, 7, 12, 2, 2, { sillOut: 1.0 });
    windowF(k, flank, D * 0.5, EAVE + H * 0.42, 7, 12, 2, 2, { sillOut: 1.0 });
    /* the stepped gable, authored on the front face */
    const g = [[0, EAVE]];
    const st = [[3.2, 6.5], [3.2, 5.5], [3.2, 5.5]];
    let u = 0, v = EAVE;
    st.forEach(([du, dv]) => { u += du; g.push([u, v]); v -= dv; g.push([u, v]); });
    g.push([W / 2 - 2.4, v], [W / 2, v - 4], [W / 2 + 2.4, v]);
    u = W; v = EAVE;
    const rt = [[W, EAVE]];
    st.forEach(([du, dv]) => { u -= du; rt.push([u, v]); v -= dv; rt.push([u, v]); });
    g.push(...rt.reverse());
    k.M(front.poly(g), k.OUT);
    k.M([front.at(0, EAVE), front.at(W, EAVE), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    /* the gable is a thin wall standing proud of the roof behind it */
    k.M([front.at(0, EAVE), front.out(0, EAVE, 2.2)], k.MID);
    k.M([front.at(W / 2, v - 4), front.out(W / 2, v - 4, 2.2)], k.FINE);
    /* hoist beam — what says Amsterdam */
    k.M([front.at(W / 2, 7), front.out(W / 2, 5.5, 5.5)], k.OUT);
    k.M([front.out(W / 2, 5.5, 5.5), front.out(W / 2, 8.5, 5.5)], k.MID);
    oculusF(k, front, W / 2, 15, 3.4, 6);
    bandF(k, front, -1.5, W + 1.5, EAVE, 1.4, 2, k.OUT);
    [[EAVE + H * 0.10, 10, 14], [EAVE + H * 0.36, 10, 15]].forEach(([v0, ww, hh]) => {
      [-1, 1].forEach((sd) => windowF(k, front, W / 2 + sd * 7.5, v0, ww * 0.62, hh, 2, 3));
    });
    bandF(k, front, -1, W + 1, H - 24, 1.4, 1, k.MID);
    doorF(k, front, W / 2 - 7.5, H - 1, 7, 15);
    windowF(k, front, W / 2 + 7.5, H - 18, 7.5, 11, 2, 2);
    pavement(k, -W / 2, W / 2, D);
    pot(k, -W * 0.46, -5, 9, "cone", 5);
    pot(k, W * 0.46, -5, 9, "cone", 17);
    return k.done();
  };

  /* ── 3 · CHAPEL ───────────────────────────────────────────────────── */
  A.chapel = () => {
    const M = massing({ w: 44, d: 46, top: -78, f: 330, dist: 215, yaw: -26 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const EAVE = 40;
    /* nave flank, with the roof slope running back */
    k.M([V.p(-W / 2, TOP + EAVE, 0), V.p(-W / 2, TOP + EAVE, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    k.M([V.p(0, TOP, 0), V.p(0, TOP, D), V.p(-W / 2, TOP + EAVE, D)], k.MID);
    [0.3, 0.62].forEach((f) =>
      windowF(k, flank, D * f, EAVE + 6, 7, 16, 1, 3, { arch: true, sillOut: 1.0 }));
    /* gable front */
    k.M(front.poly([[0, EAVE], [W / 2, 0], [W, EAVE], [W, H], [0, H]]),
        k.OUT, { closed: true });
    k.M(front.poly([[2.5, EAVE + 2], [W / 2, 3.4], [W - 2.5, EAVE + 2]]), k.MID);
    oculusF(k, front, W / 2, EAVE * 0.62, 6.5, 8);
    [-1, 1].forEach((sd) =>
      windowF(k, front, W / 2 + sd * 13, EAVE + 14, 8.5, 17, 1, 3, { arch: true }));
    /* the great door, recessed in three orders — real depth, not three lines */
    const dw = 14, dv = H - 1;
    for (let i = 0; i < 3; i++) {
      const w = dw - i * 1.9, n = -i * 1.5, a = [];
      for (let j = 0; j <= 16; j++) {
        const t = Math.PI * (j / 16);
        a.push([W / 2 - Math.cos(t) * (w / 2), EAVE + 28 - Math.sin(t) * (w * 0.52)]);
      }
      const pts = [[W / 2 - w / 2, dv]].concat(a, [[W / 2 + w / 2, dv]]);
      k.M(pts.map(([u, vv]) => front.out(u, vv, n)), i ? k.MID : k.OUT);
      if (i) k.M([front.out(W / 2 - w / 2, dv, n + 1.5),
                  front.out(W / 2 - w / 2, dv, n)], k.FINE);
    }
    const w3 = dw - 2 * 1.9, inner = [];
    for (let j = 0; j <= 16; j++) {
      const t = Math.PI * (j / 16);
      inner.push([W / 2 - Math.cos(t) * (w3 / 2 - 1), EAVE + 28 - Math.sin(t) * (w3 * 0.5 - 1)]);
    }
    k.F([front.out(W / 2 - w3 / 2 + 1, dv, -3)]
        .concat(inner.map(([u, vv]) => front.out(u, vv, -3)),
                [front.out(W / 2 + w3 / 2 - 1, dv, -3)]));
    /* bell tower, set back along the flank so it reads as a separate mass */
    const tw = 7, tz = 0;
    slab(k, W / 2 - 2, W / 2 - 2 + tw * 2, TOP + 18, GNDY, tz, tz + tw * 2, k.OUT);
    const tcx = W / 2 - 2 + tw, tcz = tz + tw;
    k.M([V.p(tcx - tw - 1.6, TOP + 18, tz - 1.6), V.p(tcx, TOP + 2, tcz),
         V.p(tcx + tw + 1.6, TOP + 18, tz - 1.6)], k.OUT);
    k.M([V.p(tcx - tw - 1.6, TOP + 18, tz - 1.6),
         V.p(tcx - tw - 1.6, TOP + 18, tz + tw * 2 + 1.6),
         V.p(tcx, TOP + 2, tcz)], k.MID);
    k.M([V.p(tcx, TOP + 2, tcz), V.p(tcx, TOP - 5, tcz)], k.OUT);
    k.M([V.p(tcx - 2, TOP - 2.6, tcz), V.p(tcx + 2, TOP - 2.6, tcz)], k.MID);
    const tf = V.face([W / 2 - 2, TOP + 18, tz], [1, 0, 0], [0, 1, 0]);
    windowF(k, tf, tw, 7, 7, 10, 1, 2, { arch: true, sill: false });
    pavement(k, -W / 2, W / 2 - 2 + tw * 2, D);
    pot(k, -W * 0.58, -6, 10, "cone", 7);
    return k.done();
  };

  /* ── 4 · MANSARD BLOCK ────────────────────────────────────────────── */
  A.mansion = () => {
    const M = massing({ w: 58, d: 34, top: -70, f: 340, dist: 230, yaw: -19 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const EAVE = 20;
    k.M([V.p(-W / 2, TOP + EAVE, 0), V.p(-W / 2, TOP + EAVE, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [0.34, 0.68].forEach((f) => {
      windowF(k, flank, D * f, EAVE + H * 0.10, 6, 13, 2, 3, { sillOut: 1.0 });
      windowF(k, flank, D * f, EAVE + H * 0.42, 6, 13, 2, 3, { sillOut: 1.0 });
    });
    /* mansard: steep lower slope + shallow top, as a solid */
    k.M([V.p(-W / 2, TOP + EAVE, 0), V.p(-W / 2 + 5, TOP + 3, 0),
         V.p(W / 2 - 5, TOP + 3, 0), V.p(W / 2, TOP + EAVE, 0)], k.OUT);
    k.M([V.p(-W / 2 + 5, TOP + 3, 0), V.p(-W / 2 + 5, TOP + 3, D - 5)], k.MID);
    k.M([V.p(-W / 2, TOP + EAVE, D), V.p(-W / 2 + 5, TOP + 3, D - 5)], k.MID);
    k.M([V.p(-W / 2 + 5, TOP + 3, D - 5), V.p(W / 2 - 5, TOP + 3, D - 5)], k.MID);
    slab(k, -W / 2 - 2.2, W / 2 + 2.2, TOP + EAVE - 2.4, TOP + EAVE,
         -2.2, D + 2.2, k.OUT);
    /* dormers break the roof plane — the clearest proof the roof has depth */
    [-1, 0, 1].forEach((i) => {
      const cx = i * 17;
      k.M([V.p(cx - 4.5, TOP + EAVE - 2, 0.6), V.p(cx - 4.5, TOP + 9, -1.2),
           V.p(cx, TOP + 5.5, -1.8), V.p(cx + 4.5, TOP + 9, -1.2),
           V.p(cx + 4.5, TOP + EAVE - 2, 0.6)], k.OUT);
      const df = V.face([cx - 4.5, TOP + 9, -1.2], [1, 0, 0], [0, 1, 0]);
      windowF(k, df, 4.5, 1.6, 6, 7.5, 2, 2, { sill: false, reveal: false });
    });
    chimney(k, -W * 0.30, TOP + 3, D * 0.5, 4.4, 8);
    chimney(k, W * 0.30, TOP + 3, D * 0.5, 4.4, 8);
    k.M([front.at(0, EAVE), front.at(W, EAVE), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    [0, 1].forEach((s) => {
      const v0 = EAVE + H * (s ? 0.40 : 0.12);
      for (let i = -2; i <= 2; i++) {
        const cu = W / 2 + i * 11;
        windowF(k, front, cu, v0, 7.5, 15, 2, 3);
        if (s === 0 && Math.abs(i) <= 1) {
          /* a balcony is a projecting solid: you see the top of its slab */
          const u0 = cu - 5.5, u1 = cu + 5.5, bv = v0 + 16.2;
          k.M([front.at(u0, bv), front.at(u1, bv),
               front.out(u1, bv, 3), front.out(u0, bv, 3)], k.OUT, { closed: true });
          k.M([front.out(u0, bv, 3), front.out(u0, bv - 3.4, 3),
               front.out(u1, bv - 3.4, 3), front.out(u1, bv, 3)], k.OUT);
          for (let j = 0; j <= 8; j++)
            k.M([front.out(u0 + j * 1.37, bv, 3), front.out(u0 + j * 1.37, bv - 3.4, 3)],
                k.FINE);
        }
      }
    });
    bandF(k, front, -1, W + 1, H - 22, 1.4, 2, k.OUT);
    for (let i = -2; i <= 2; i++) {
      const cu = W / 2 + i * 11;
      if (i === 0) { doorF(k, front, cu, H - 1, 8, 16, { glazed: true }); continue; }
      windowF(k, front, cu, H - 15, 7.5, 9, 2, 1, { arch: true, sill: false });
    }
    pavement(k, -W / 2, W / 2, D);
    pot(k, -W * 0.44, -5, 9, "cone", 13);
    pot(k, W * 0.44, -5, 9, "cone", 29);
    return k.done();
  };

  /* ── 5 · CORNER CAFÉ ──────────────────────────────────────────────── */
  A.cafe = () => {
    const M = massing({ w: 46, d: 32, top: -66, f: 330, dist: 200, yaw: -27 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const FASCIA = H * 0.56;
    /* the corner café turns the corner: the flank is a shopfront too */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [0.32, 0.66].forEach((f) => {
      windowF(k, flank, D * f, H * 0.10, 6.5, 15, 2, 3, { sillOut: 1.0 });
      windowF(k, flank, D * f, H * 0.30, 6.5, 15, 2, 3, { sillOut: 1.0 });
    });
    bandF(k, flank, 0, D, FASCIA, 1.4, 2, k.MID);
    awningF(k, flank, 2, D - 2, FASCIA + 7, 3.2, 6, 6);
    rectF(k, flank, 2, FASCIA + 13, D - 2, H - 1.5, k.OUT);
    k.F(flank.poly([[3.4, H - 8], [D - 3.4, H - 8], [D - 3.4, H - 3], [3.4, H - 3]]));
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    slab(k, -W / 2 - 2.4, W / 2 + 2.4, TOP - 3, TOP, -2.4, D + 2.4, k.OUT);
    chimney(k, -W * 0.26, TOP - 3, D * 0.5, 4.4, 8);
    /* three to a row: four crowded them, and three gives each one wall to
       sit on, which is what makes a black pane read */
    [0.10, 0.30].forEach((f) => {
      for (const i of [-1, 0, 1]) windowF(k, front, W / 2 + i * 13, H * f, 8.5, 15, 2, 3);
    });
    bandF(k, front, -1, W + 1, FASCIA, 1.5, 2, k.OUT);
    rectF(k, front, 2, FASCIA + 2, W - 2, FASCIA + 6.5, k.MID);
    awningF(k, front, 3, W - 3, FASCIA + 7, 3.6, 7, 8);
    const sv = FASCIA + 13;
    [[2.5, W * 0.42], [W * 0.58, W - 2.5]].forEach(([u0, u1]) => {
      rectF(k, front, u0, sv, u1, H - 1.5, k.OUT);
      rectF(k, front, u0 + 1.2, sv + 1.2, u1 - 1.2, H - 2.7, k.MID);
      k.M([front.at(u0 + (u1 - u0) / 2, sv), front.at(u0 + (u1 - u0) / 2, H - 1.5)], k.MID);
      k.F(front.poly([[u0 + 2, H - 8], [u1 - 2, H - 8], [u1 - 2, H - 3.4], [u0 + 2, H - 3.4]]));
    });
    doorF(k, front, W * 0.5, H - 1.5, 7.5, 16, { glazed: true });
    pavement(k, -W / 2, W / 2, D, 12);
    /* pavement tables — they stand in FRONT of the wall, which is the one
       thing an elevation could never show */
    [[-W * 0.34, -8], [W * 0.30, -9.5]].forEach(([x, z], i) => {
      const r = 3.4, top = [];
      for (let j = 0; j < 14; j++) {
        const a = (j / 14) * Math.PI * 2;
        top.push(V.p(x + Math.cos(a) * r, GNDY - 8, z + Math.sin(a) * r * 0.9));
      }
      k.M(top, k.OUT, { closed: true, curve: true });
      k.M([V.p(x, GNDY - 8, z), V.p(x, GNDY, z)], k.MID, { taper: [1.2, 0.9] });
      k.M([V.p(x - 2.4, GNDY, z), V.p(x + 2.4, GNDY, z)], k.MID);
      [-1, 1].forEach((sd) => {
        const bx = x + sd * 6.4, bz = z + sd * 1.5;
        k.M([V.p(bx - 1.8, GNDY - 5, bz), V.p(bx + 1.8, GNDY - 5, bz)], k.MID);
        k.M([V.p(bx - 1.8, GNDY - 5, bz), V.p(bx - 1.8, GNDY - 10, bz)], k.MID);
        k.M([V.p(bx - 1.8, GNDY - 10, bz), V.p(bx + 1.1, GNDY - 10, bz)], k.FINE);
        k.M([V.p(bx - 1.5, GNDY - 5, bz), V.p(bx - 1.8, GNDY, bz)], k.FINE);
        k.M([V.p(bx + 1.5, GNDY - 5, bz), V.p(bx + 1.8, GNDY, bz)], k.FINE);
      });
      void i;
    });
    pot(k, -W * 0.50, -6, 10, "bush", 19);
    pot(k, W * 0.48, -6, 10, "bush", 37);
    return k.done();
  };

  const NAMES = {
    shopfront: "Shopfront", townhouse: "Stepped-gable townhouse",
    chapel: "Chapel", mansion: "Mansard block", cafe: "Corner café",
  };

  const NIB = Spec.FIRM;

  const out = {};
  for (const key of Object.keys(A))
    out[key] = Spec.wrap("elevation", NAMES[key], A[key]);
  out._keys = Object.keys(A);
  /* the toolkit, shared with arch2.js — one vocabulary, two files */
  out._kit = { GNDY, sheet, area, slab, rectF, bandF, windowF, oculusF, doorF,
               awningF, chimney, pot, pavement, massing, NIB, OPT };
  return out;
})();
