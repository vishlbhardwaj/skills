/*
 * TEN RETRO DEVICES — handheld console, cassette player, boombox, CRT
 * television, rotary phone, instant camera, 8-bit home computer, reel-to-reel
 * deck, arcade cabinet, turntable.
 *
 * Products, so the camera is ORTHOGRAPHIC (a product render), not one-point:
 * a box turned to the camera has two sets of receding edges and one
 * vanishing point cannot serve both. Each device gets its own yaw/pitch — a
 * console is seen nearly face-on, a turntable from well above — but the
 * hand, the palette logic and the stroke hierarchy are shared, so the ten
 * read as one set.
 *
 * Register: the approved one. Heavy line (pen 0.3 × weight 26), flat
 * identity colour, BLACK for contrast (screens, speakers, keys, lenses), and
 * shadow as a darker fill on the faces turned from the light.
 *
 * The toolkit is the flowers' deferred occlusion carried into 3D:
 *   - `prism(base, e)` fills the visible sides and cap, registers one opaque
 *     hull, and QUEUES its silhouette and creases;
 *   - every detail is a flat or raised shape on a `plane`;
 *   - `flush()` cuts each queued line by every filled shape authored after
 *     it. Author back to front and nothing draws through anything.
 * A line lying exactly on a later shape's edge is NOT cut (`deep` test), or
 * a band flush with a body's edge would chew that edge into dashes.
 */
window.Retro = (function () {
  const RAD = Math.PI / 180;

  const C = {
    putty: "#CFCBC0", plum: "#A8325E", lcd: "#A9B65A", lcdD: "#5E6E2E", bezel: "#5B5E6E",
    slate: "#8E8C88", blue: "#3F6FA8", silver: "#C9CCD1", alu: "#DCDCD8", cream: "#EFE6C9",
    orange: "#EE8A2E", foam: "#F09A3E", foamD: "#C26A1C", tape: "#5B3A26", red: "#D9483B",
    wood: "#B8814C", woodD: "#8E5E34", screen: "#2C3436", grey: "#9C9C98", dark: "#3A3B40",
    cone: "#4A4A50", phone: "#C8322F", body: "#EEEAE0", glass: "#2E3A4E", glass2: "#4C6A8E",
    sky: "#9EC3E3", sun: "#F2C933", hill: "#7E9B5E", beige: "#C9B48E", key: "#5A4A3E",
    keyL: "#E2D3B0", cab: "#4166B0", yellow: "#F2C933", panel: "#34343A", white: "#FBFAF6",
    green: "#5DBB63", cyan: "#58C3D6", magenta: "#C94A9A", navy: "#1F2B3A", vinyl: "#232328",
    sheen: "#5A5A63", mint: "#8FC1A9", mintD: "#6FA58C", olive: "#6F806C", teal: "#5FB8B0",
    vcr: "#55575E", led: "#5BE37A", ledR: "#FF4A3A", juke: "#9A6236", scope: "#CFC8B4", phos: "#7CFF8A",
    phosD: "#0F2F22", lavaL: "#F6B13B", lavaW: "#D9333F", fanG: "#7FB7A8", pcBeige: "#D8D0BC",
    slideG: "#8E9196", nes: "#CFCBC2", brass: "#C9A043", bread: "#E8B874", crust: "#B97A3E",
    tweed: "#D9C9A0", cloth: "#8E6A4E", tin: "#D9483B", navyF: "#1F2B5A", walkie: "#F2C933", calc: "#DCD5C4", cam: "#5A5C63", film: "#3A2C26", reelM: "#B9BCC2", keycap: "#F3EBD9",
  };

  /* ── geometry ─────────────────────────────────────────────────────── */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return mul(a, 1 / l); };

  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  /* rounded rect; r is one radius or [tl, tr, br, bl] */
  function rr(x0, y0, x1, y1, r) {
    const R = Array.isArray(r) ? r : [r, r, r, r];
    const cs = [[x0 + R[0], y0 + R[0], R[0], 180], [x1 - R[1], y0 + R[1], R[1], 270],
                [x1 - R[2], y1 - R[2], R[2], 0], [x0 + R[3], y1 - R[3], R[3], 90]];
    const out = [];
    for (const [cx, cy, q, a0] of cs) {
      if (!q) { out.push([cx, cy]); continue; }
      const n = Math.max(3, Math.round(q * 1.6));
      for (let i = 0; i <= n; i++) {
        const a = (a0 + (90 * i) / n) * RAD;
        out.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]);
      }
    }
    return out;
  }
  const ell = (cx, cy, rx, ry, n, a0, a1) => {
    const N = n || 36, A0 = a0 == null ? 0 : a0, A1 = a1 == null ? 360 : a1;
    const full = A1 - A0 >= 360, out = [];
    for (let i = 0; i < (full ? N : N + 1); i++) {
      const a = (A0 + ((A1 - A0) * i) / N) * RAD;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  };
  const circ = (cx, cy, r, n) => ell(cx, cy, r, r, n || Math.max(14, Math.round(r * 5)));
  const sector = (cx, cy, r0, r1, a0, a1) =>
    ell(cx, cy, r1, r1, 14, a0, a1).concat(ell(cx, cy, r0, r0, 10, a0, a1).reverse());
  const rot = (S, deg, cx, cy) => {
    const c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
    return S.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  };

  function hull(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function inPoly(x, y, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function edgeDist(x, y, poly) {
    let d = 1e9;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, ay] = poly[j], [bx, by] = poly[i];
      const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L));
      d = Math.min(d, Math.hypot(x - ax - u * dx, y - ay - u * dy));
    }
    return d;
  }
  const bbox = (P) => {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    for (const [x, y] of P) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }
    return [a, b, c, d];
  };

  /* ── the toolkit ──────────────────────────────────────────────────── */
  function kit(k, cam) {
    const th = cam.yaw * RAD, ph = cam.pitch * RAD;
    const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
    /* yaw about the vertical, then look down by `pitch`; verticals stay
       vertical. E points from the object toward the eye. */
    const A0 = [ct, 0, st], A1 = [st * sp, cp, -ct * sp];
    const E = [st * cp, -sp, -ct * cp];
    let P = (v) => [50 + dot(A0, v), 50 + dot(A1, v)];
    let Eat = () => E;
    /* `cam.persp` = View.two's options: two-point perspective, like the
       buildings. Visibility is then tested against the real eye position,
       and a plane part's affine is the local slope of the projection. */
    if (cam.persp) {
      const V2 = View.two(cam.persp), a = ((cam.persp.yaw === undefined ? -22 : cam.persp.yaw) * RAD);
      /* `lift` raises the eye above the world's horizon line: a level camera
         looking down onto roofs — a diorama, verticals still vertical */
      const d = cam.persp.dist || 150, lift = cam.persp.lift || 0;
      const eye = [d * Math.sin(a), -lift, -d * Math.cos(a)];
      P = (v) => V2.p(v[0], v[1] + lift, v[2]);
      Eat = (q) => unit(sub(eye, q));
      k.V2 = V2;
    }
    let seed = 7;
    const sd = () => (seed += 3);
    const items = [];
    /*
     * PARTS — for the Rive export. `part(name, o)` tags everything authored
     * after it until `part(null)`: o.pivot (3D point to turn/scale about),
     * o.plane + o.at (spin IN that plane — the affine of the plane is kept so
     * a reel on a foreshortened face turns as a reel, not a wobbling oval),
     * o.top (drawn above all static line work in the export, and its fills
     * cut no other part's lines — it moves, so they must be whole under it),
     * o.clip (a shape on o.plane the part is masked to).
     * Nothing here changes what the HTML page draws unless Retro.EXPORT.
     */
    const EXPORT = !!(window.Retro && window.Retro.EXPORT);
    const parts = {};
    let cur = null;
    const R0 = k.R;
    let L = 0;
    k.R = (...a) => { R0(...a); const r = k.regions[k.regions.length - 1]; r.g = cur; r.L = L; };
    const opaque = (Q) => items.push({ shape: true, P: Q, bb: bbox(Q), g: cur,
                                       top: EXPORT && !!(cur && parts[cur].top) });
    const queue = (Q, w, x) => items.push({ shape: false, P: Q, w, x: x || {}, g: cur, L });
    /* export layers: everything authored after `layer()` stacks above
       everything before it in Rive — the foreground in front of walkers */

    const t = { P, E, k, parts, EXPORT };
    t.layer = () => { L++; };
    const linAt = (c, v) => { const a = P(c), b = P(add(c, v)); return [b[0] - a[0], b[1] - a[1]]; };
    const vsize = (q) => { const a = P(q), b = P(add(q, [0, -1, 0])); return Math.hypot(b[0] - a[0], b[1] - a[1]); };
    t.part = (name, o) => {
      cur = name;
      if (!name || parts[name]) return;
      o = o || {};
      const q = { top: !!o.top, extra: inExtra };
      if (o.plane) {
        const c = o.plane.at(o.at[0], o.at[1]);
        q.pivot = P(c);
        const a = linAt(c, sub(o.plane.at(1, 0), o.plane.at(0, 0))), b = linAt(c, sub(o.plane.at(0, 1), o.plane.at(0, 0)));
        q.M = [[a[0], b[0]], [a[1], b[1]]];
        q.normal = linAt(c, o.plane.n);
      } else if (o.pivot) q.pivot = P(o.pivot);
      /* a path through the scene: [frame, dx, dy, dz] from the pivot, kept as
         screen points + perspective scale so a walker shrinks as it recedes */
      if (o.track && o.pivot) {
        const s0 = vsize(o.pivot);
        q.track = o.track.map(([f, dx, dy, dz]) => {
          const p3 = add(o.pivot, [dx, dy, dz]);
          return [f, P(p3), vsize(p3) / s0];
        });
      }
      if (o.clip) q.clip = (o.clipPlane || o.plane).map(o.clip).map(P);
      if (o.clip3) q.clip = hull(o.clip3.map(P));
      parts[name] = q;
    };
    /* drawn only in the Rive export: alternate pictures, notes, flashes */
    let inExtra = false;
    t.extra = (fn) => { if (EXPORT) { const was = cur; inExtra = true; fn(); inExtra = false; cur = was; } };

    /* light from upper-left-front: tops lift, right flanks drop */
    t.shade = (n) => 1 + 0.08 * Math.max(0, -n[1]) - 0.28 * Math.max(0, n[0]) - 0.12 * Math.max(0, -n[0])
                     - 0.18 * Math.max(0, n[2]);

    /*
     * A prism: planar convex base `S3`, extruded by vector `e`. Visible sides
     * and the visible cap are filled; ONE hull outline; creases only where a
     * visible face meets the visible cap or turns a real corner.
     */
    t.prism = (S3, e, fill, o) => {
      o = o || {};
      const w = o.w != null ? o.w : k.OUT, wc = o.wc != null ? o.wc : k.DET, sh = o.sh != null ? o.sh : 1;
      const N = S3.length;
      const c = mul(S3.reduce((a, b) => add(a, b), [0, 0, 0]), 1 / N);
      const eh = unit(e);
      const side = [];
      for (let i = 0; i < N; i++) {
        const a = S3[i], b = S3[(i + 1) % N];
        let n = unit(cross(sub(b, a), e));
        if (dot(n, sub(mul(add(a, b), 0.5), c)) < 0) n = mul(n, -1);
        side.push({ n, vis: dot(n, Eat(mul(add(a, b), 0.5))) > 1e-4 });
      }
      const far = dot(eh, Eat(add(c, e))) > 0;
      const cap = far ? S3.map((p) => add(p, e)) : S3;
      const capN = far ? eh : mul(eh, -1);
      const tone = o.flatSides ? () => sh : (n) => sh * t.shade(n);
      side.forEach((s, i) => {
        if (!s.vis) return;
        const a = S3[i], b = S3[(i + 1) % N];
        k.R([a, b, add(b, e), add(a, e)].map(P), o.sideFill || fill, sd(), tone(s.n), false);
      });
      k.R(cap.map(P), fill, sd(), o.capSh != null ? o.capSh : tone(capN), false);
      const H = hull(S3.concat(S3.map((p) => add(p, e))).map(P));
      opaque(H);
      const tn = { tone: o.sideFill || fill };
      if (w) queue(H, w, { closed: true, ...tn });
      if (wc) {
        /* cap edges whose side is visible are creases; runs of them */
        const start = side.findIndex((s) => !s.vis);
        if (start < 0) queue(cap.map(P), wc, { closed: true, ...tn });
        else {
          let run = [];
          for (let j = 1; j <= N; j++) {
            const i = (start + j) % N;
            if (side[i].vis) { if (!run.length) run.push(cap[i]); run.push(cap[(i + 1) % N]); }
            else if (run.length) { queue(run.map(P), wc, tn); run = []; }
          }
          if (run.length) queue(run.map(P), wc, tn);
        }
        for (let i = 0; i < N; i++) {
          const pv = side[(i - 1 + N) % N], cu = side[i];
          if (pv.vis && cu.vis && dot(pv.n, cu.n) < 0.82)
            queue([P(S3[i]), P(add(S3[i], e))], wc, tn);
        }
      }
      return H;
    };

    /* a plane: origin + two directions; its normal faces the eye */
    t.plane = (o, du, dv) => {
      let n = unit(cross(du, dv));
      if (dot(n, Eat(o)) < 0) n = mul(n, -1);
      const at = (u, v) => add(o, add(mul(du, u), mul(dv, v)));
      return { at, n, map: (S) => S.map(([u, v]) => at(u, v)) };
    };
    t.FR = (z) => t.plane([0, 0, z], [1, 0, 0], [0, 1, 0]);      // u = x, v = y
    t.TOP = (y) => t.plane([0, y, 0], [1, 0, 0], [0, 0, 1]);     // u = x, v = z
    t.RT = (x) => t.plane([x, 0, 0], [0, 0, 1], [0, 1, 0]);      // u = z, v = y

    /* a flat shape painted on a plane — decal, window, label */
    t.flat = (pl, S2, fill, o) => {
      o = o || {};
      const Q = pl.map(S2).map(P);
      if (fill) { k.R(Q, fill, sd(), o.sh != null ? o.sh : 1, false); opaque(Q); }
      if (o.w !== 0) queue(Q, o.w != null ? o.w : k.DET, { closed: true, tone: fill || null });
      return Q;
    };
    /* a shape standing proud of a plane by h — button, knob, key */
    t.raise = (pl, S2, h, fill, o) =>
      t.prism(pl.map(S2), mul(pl.n, h), fill, { w: k.DET, wc: k.TEX, ...(o || {}) });
    t.line = (pl, pts, w, x) => queue(pl.map(pts).map(P), w != null ? w : k.DET, x || {});
    t.line3 = (pts, w, x) => queue(pts.map(P), w != null ? w : k.DET, { curve: true, ...(x || {}) });
    t.dot = (pl, cx, cy, r, fill) => t.flat(pl, circ(cx, cy, r, 12), fill || "ink", { w: 0 });
    /* a ball: round from every side, so a circle on the sheet */
    t.ball = (p3, r, fill, w) => {
      const [x, y] = P(p3);
      const Q = circ(x, y, r, 20);
      k.R(Q, fill, sd(), 1, false); opaque(Q);
      queue(Q, w != null ? w : k.DET, { closed: true, tone: fill });
      /* a highlight: a small pale tick upper-left */
      k.R(circ(x - r * 0.38, y - r * 0.38, r * 0.22, 8), "#FFFFFF", sd(), 1, false);
    };
    t.box = (x0, y0, z0, x1, y1, z1, fill, o) => {
      const S = (o && o.r) ? rr(x0, y0, x1, y1, o.r) : rect(x0, y0, x1, y1);
      return t.prism(S.map(([x, y]) => [x, y, z0]), [0, 0, z1 - z0], fill, o);
    };
    /* the same, standing on a horizontal footprint (x, z) and rising by h */
    t.tower = (S2xz, y, h, fill, o) => t.prism(S2xz.map(([x, z]) => [x, y, z]), [0, -h, 0], fill, o);

    /* perforations: a grid of dots clipped to a shape */
    t.mesh = (pl, S2, gap, r, fill) => {
      const [a, b, c2, d] = bbox(S2);
      for (let y = b + gap / 2, row = 0; y < d; y += gap * 0.87, row++)
        for (let x = a + gap / 2 + (row % 2) * gap / 2; x < c2; x += gap)
          if (inPoly(x, y, S2) && edgeDist(x, y, S2) > r * 1.4) t.dot(pl, x, y, r, fill);
    };

    /* resolve: each queued line, cut wherever it is DEEP inside a later fill */
    t.flush = () => {
      const M0 = k.M;
      let curL = 0;
      k.M = (...a) => { M0(...a); const m = k.marks[k.marks.length - 1]; m.g = cur; m.L = curL; };
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.shape) continue;
        const bb = bbox(it.P), occ = [];
        cur = it.g; curL = it.L;
        /* a moving part's own lines are cut only by its own fills */
        const moving = EXPORT && it.g && parts[it.g].top;
        for (let j = i + 1; j < items.length; j++) {
          const o = items[j];
          if (o.top && o.g !== it.g) continue;
          if (moving && o.g !== it.g) continue;
          if (o.shape && o.bb[0] <= bb[2] && o.bb[2] >= bb[0] && o.bb[1] <= bb[3] && o.bb[3] >= bb[1]) occ.push(o);
        }
        const x = { curve: false, ...it.x };
        if (!occ.length) { k.M(it.P, it.w, x); continue; }
        const draw = (run) => k.M(run, it.w, { ...x, closed: false });
        const Q = x.closed ? it.P.concat([it.P[0]]) : it.P;
        const deep = (px, py) => occ.some((o) => px >= o.bb[0] && px <= o.bb[2] && py >= o.bb[1] &&
          py <= o.bb[3] && inPoly(px, py, o.P) && edgeDist(px, py, o.P) > 0.22);
        const runs = [];
        let run = [], any = false;
        for (let s = 1; s < Q.length; s++) {
          const [ax, ay] = Q[s - 1], [bx, by] = Q[s];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.4));
          for (let j = 0; j < n; j++) {
            const px = ax + ((bx - ax) * j) / n, py = ay + ((by - ay) * j) / n;
            if (deep(px, py)) { any = true; if (run.length > 1) runs.push(run); run = []; }
            else run.push([px, py]);
          }
        }
        run.push(Q[Q.length - 1]);
        if (!any) { k.M(it.P, it.w, x); continue; }
        if (run.length > 1) runs.push(run);
        runs.forEach(draw);
      }
      cur = null;
    };
    return t;
  }

  /* a cassette in a window: shell, label, tape window, two reels */
  function cassette(t, pl, x0, y0, x1, y1, label, tag) {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
    t.flat(pl, rr(x0, y0, x1, y1, h * 0.08), "#E9E2D0");
    t.flat(pl, rect(x0 + w * 0.07, y0 + h * 0.1, x1 - w * 0.07, y0 + h * 0.36), label || C.orange, { w: 0 });
    t.line(pl, [[x0 + w * 0.07, y0 + h * 0.36], [x1 - w * 0.07, y0 + h * 0.36]], t.k.TEX);
    const wy0 = y0 + h * 0.46, wy1 = y0 + h * 0.8;
    t.flat(pl, rr(x0 + w * 0.2, wy0, x1 - w * 0.2, wy1, h * 0.06), C.tape);
    for (const sx of [-1, 1]) {
      const rx = cx + sx * w * 0.22, ry = (wy0 + wy1) / 2, R = h * 0.13;
      if (tag) t.part(tag + (sx < 0 ? "L" : "R"), { plane: pl, at: [rx, ry] });
      t.flat(pl, circ(rx, ry, R), "#FFFFFF");
      for (let i = 0; i < 6; i++) {
        const a = i * 60 * RAD;
        t.dot(pl, rx + Math.cos(a) * R * 0.55, ry + Math.sin(a) * R * 0.55, R * 0.16);
      }
      if (tag) t.part(null);
    }
    /* the trapezoid foot of the shell */
    t.line(pl, [[x0 + w * 0.22, y1], [x0 + w * 0.28, y1 - h * 0.12], [x1 - w * 0.28, y1 - h * 0.12], [x1 - w * 0.22, y1]], t.k.TEX);
  }

  /* a knob: a raised disc, an indicator, ticks round it on the panel */
  function knob(t, pl, cx, cy, r, h, fill, ang, ticks, tag) {
    if (ticks) for (let i = 0; i < ticks; i++) {
      const a = (135 + (270 * i) / (ticks - 1)) * RAD;
      t.line(pl, [[cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25],
                  [cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 1.5]], t.k.TEX);
    }
    t.raise(pl, circ(cx, cy, r), h, fill);
    const top = t.plane(pl.at(0, 0).map((v, i) => v + pl.n[i] * h), sub(pl.at(1, 0), pl.at(0, 0)), sub(pl.at(0, 1), pl.at(0, 0)));
    const a = (ang == null ? -60 : ang) * RAD;
    if (tag) t.part(tag, { plane: top, at: [cx, cy] });
    t.line(top, [[cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2], [cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85]], t.k.DET);
    if (tag) t.part(null);
    return top;
  }

  /* an eighth note — export-only secondary action */
  function note(t, pl, x, y, sc) {
    t.flat(pl, rot(ell(x, y, 1.6 * sc, 1.15 * sc, 14), -20, x, y), "ink", { w: 0 });
    t.line(pl, [[x + 1.45 * sc, y - 0.3 * sc], [x + 1.45 * sc, y - 6 * sc], [x + 3.6 * sc, y - 4.2 * sc]], 0.9);
  }


  /* seven-segment digits, top-left at (x, y) on a plane whose v runs DOWN */
  const SEG = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd",
                6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcfgd" };
  function seg7(t, pl, x, y, str, col, sc) {
    const S = { a: [[0.3, 0], [2.2, 0.6]], b: [[2.2, 0.3], [2.8, 2.4]], c: [[2.2, 2.7], [2.8, 4.8]],
                d: [[0.3, 4.6], [2.2, 5.2]], e: [[-0.3, 2.7], [0.3, 4.8]], f: [[-0.3, 0.3], [0.3, 2.4]],
                g: [[0.3, 2.3], [2.2, 2.9]] };
    [...str].forEach((ch, i) => {
      for (const k of SEG[ch] || "") {
        const [[a, b], [c, d]] = S[k], ox = x + i * 3.8 * sc;
        t.flat(pl, rect(ox + a * sc, y + b * sc, ox + c * sc, y + d * sc), col, { w: 0 });
      }
    });
  }

  const D = {};
  /* the y on the front plane (z = 0) that lands where a 3D point does */
  const P3y = (t, p) => { const a = t.P(p), b = t.P([0, 0, 0]), c = t.P([0, 1, 0]); return (a[1] - b[1]) / (c[1] - b[1]); };

  /* ── 1 · handheld console ─────────────────────────────────────────── */
  D.handheld = (t) => {
    const f = t.FR(0);
    /* the cartridge, standing out of the top behind the face */
    t.box(-15, -37.5, 2, 15, -33, 6.5, C.slate);
    t.prism(rr(-20, -34, 20, 34, [3, 3, 14, 3]).map(([x, y]) => [x, y, 0]), [0, 0, 8], C.putty);
    t.raise(t.RT(20), circ(4, -14, 3.2), 1.2, C.slate);
    /* the screen, in its bezel with the one rounded corner */
    t.flat(f, rr(-16.5, -30, 16.5, -3.5, [2, 2, 9, 2]), C.bezel);
    t.flat(f, rect(-11, -26.5, 11, -8), C.lcd);
    const px = (x0, y0, x1, y1) => t.flat(f, rect(x0, y0, x1, y1), C.lcdD, { w: 0 });
    px(-11, -11, 11, -8);                                         // ground
    t.flat(f, ell(5.5, -11, 4.2, 3.2, 14, 180, 360), C.lcdD, { w: 0 }); // hill
    t.part("hero", { pivot: [-5, -11, 0] });
    px(-6.5, -15.5, -4, -11); px(-7, -17.5, -3.5, -15.5);         // a figure
    px(-8, -15, -7, -13); px(-4, -16.5, -2.5, -15.5);
    t.part("cloud", { pivot: [1, -22, 0] });
    px(-1, -23, 3, -22); px(-2, -22, 4.5, -21);                   // a cloud
    t.part(null);
    t.dot(f, -14, -20, 0.9, C.red);
    t.line(f, [[-16.5, -1], [-3, -1]], t.k.TEX);
    /* d-pad: two ink bars — ink on ink needs no occlusion */
    t.part("dpad", { pivot: [-10, 10.8, 0] });
    t.raise(f, rect(-15, 9, -5, 12.6), 1.4, "ink");
    t.raise(f, rect(-11.8, 5.8, -8.2, 15.8), 1.4, "ink");
    t.part("btnB", { pivot: [9, 11.5, 0] });
    t.raise(f, circ(9, 11.5, 3.3), 1.4, C.plum);
    t.part("btnA", { pivot: [16, 7, 0] });
    t.raise(f, circ(16, 7, 3.3), 1.4, C.plum);
    t.part(null);
    for (const x of [-6, 2]) t.raise(f, rot(rr(x - 3, 21, x + 3, 22.6, 0.8), -28, x, 21.8), 0.8, C.slate);
    /* speaker slots */
    for (let i = 0; i < 6; i++)
      t.line(f, rot([[9 + i * 1.9, 21.5], [9 + i * 1.9, 27]], -28, 9 + i * 1.9, 24.2), 0.75);
  };

  /* ── 2 · cassette player, headphones beside it ────────────────────── */
  D.walkman = (t) => {
    const f = t.FR(0);
    /* headphones first: they lie behind the player's right edge */
    const hp = t.FR(10);
    t.flat(hp, sector(46, 5, 11.2, 13, 180, 360), C.silver);
    for (const cx of [33, 59]) {
      t.part(cx < 40 ? "cupL" : "cupR", { pivot: [cx, 6, 10] });
      t.flat(hp, ell(cx, 6, 5.6, 6.4, 24), C.foam);
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, r = 1 + i * 0.5;
        t.dot(hp, cx + Math.cos(a) * r, 6 + Math.sin(a) * r * 1.1, 0.42, C.foamD);
      }
    }
    t.part(null);
    t.prism(rr(-24, -16, 24, 16, 3).map(([x, y]) => [x, y, 0]), [0, 0, 9], C.blue);
    /* piano keys along the top */
    const keys = [C.silver, C.silver, C.orange, C.silver];
    keys.forEach((col, i) => t.box(-20 + i * 5, -18.6, 2, -15.8 + i * 5, -16, 7, col, { w: t.k.DET, wc: t.k.TEX }));
    t.dot(t.TOP(-16), 17, 4.5, 1.1);
    /* door with the cassette behind its window */
    t.flat(f, rr(-20, -12, 14, 12, 2), C.silver);
    t.flat(f, rr(-17.5, -9.5, 11.5, 9, 1.6), "ink");
    cassette(t, f, -16, -8, 10, 7.5, C.orange, "reel");
    t.line(f, [[-17, 10.5], [-5, 10.5]], t.k.TEX);
    t.line(f, [[18.5, -10], [18.5, 9]], 0.9);
    t.raise(f, rr(16.8, -2, 20.2, 1.5, 0.8), 1, C.orange);
    /* the lead, from the jack up and over into the right cup */
    t.line3([[17, -16, 4.5], [22, -26, 6], [38, -22, 10], [55, -14, 10], [59, -0.5, 10]], 0.85);
  };

  /* ── 3 · boombox ──────────────────────────────────────────────────── */
  D.boombox = (t) => {
    const f = t.FR(0);
    /* antenna, behind everything */
    t.part("antenna", { pivot: [38, -22, 13] });
    t.line3([[38, -22, 13], [46, -40, 13]], 1.0, { curve: false });
    t.line3([[46, -40, 13], [52, -54, 13]], 0.7, { curve: false });
    t.ball([52, -54, 13], 1.3, C.alu);
    t.part(null);
    /* handle on posts */
    t.box(-33, -31, 6, -29, -21, 10, C.dark);
    t.box(29, -31, 6, 33, -21, 10, C.dark);
    t.box(-34, -34, 6, 34, -30, 10, C.dark, { r: 1.5 });
    t.prism(rr(-46, -21, 46, 25, 4).map(([x, y]) => [x, y, 0]), [0, 0, 16], C.silver);
    const ks = [C.dark, C.dark, C.red, C.dark, C.dark, C.dark];
    ks.forEach((col, i) => t.box(-16 + i * 5.4, -23.6, 3, -11.6 + i * 5.4, -21, 9, col, { w: t.k.DET, wc: t.k.TEX }));
    /* tuning dial */
    t.flat(f, rr(-40, -17, 40, -10, 1.5), C.cream);
    for (let x = -36; x <= 36; x += 3)
      t.line(f, [[x, -16], [x, x % 9 === 0 ? -13 : -14.5]], t.k.TEX * 0.8);
    t.flat(f, rect(9.6, -17, 10.6, -10), C.red, { w: 0 });
    /* two speakers */
    for (const cx of [-29, 29]) {
      const cy = 8;
      t.flat(f, circ(cx, cy, 15), C.grey);
      t.flat(f, circ(cx, cy, 13.2), "ink", { w: 0 });
      t.part(cx < 0 ? "coneL" : "coneR", { pivot: [cx, cy, 0] });
      t.flat(f, circ(cx, cy, 10), C.cone);
      t.flat(f, circ(cx, cy, 7), null, { w: t.k.TEX });
      t.flat(f, circ(cx, cy, 3.6), C.dark);
      t.flat(f, ell(cx - 1.1, cy - 1.2, 1.1, 0.8, 10), "#FFFFFF", { w: 0 });
      t.part(null);
      for (const a of [45, 135, 225, 315])
        t.dot(f, cx + Math.cos(a * RAD) * 14.1, cy + Math.sin(a * RAD) * 14.1, 0.5);
    }
    /* cassette deck in the middle */
    t.flat(f, rr(-12.5, -6, 12.5, 21, 1.5), "ink");
    cassette(t, f, -10, 1, 10, 14, C.red, "reel");
    t.raise(f, rr(-6, -4.6, -1.5, -2.6, 0.6), 0.8, C.alu);
    t.raise(f, rr(1.5, -4.6, 6, -2.6, 0.6), 0.8, C.alu);
    t.flat(f, rect(-11, 16.5, 11, 18), C.grey, { w: 0 });
    t.extra(() => [[-40, -24, 1.8], [22, -38, 2], [-22, -38, 1.6], [42, -26, 1.7]].forEach(([x, y, sc], i) => {
      t.part("note" + i, { pivot: [x, y, 0], top: true });
      note(t, f, x, y, sc);
    }));
  };

  /* ── 4 · CRT television on legs, rabbit ears ──────────────────────── */
  D.crt = (t) => {
    const f = t.FR(0);
    /* rabbit ears, back legs first */
    t.part("ears", { pivot: [2, -30, 18] });
    t.line3([[1, -30, 18], [-22, -64, 22]], 0.75, { curve: false });
    t.line3([[3, -30, 18], [27, -62, 14]], 0.75, { curve: false });
    t.ball([-22, -64, 22], 1.4, C.alu); t.ball([27, -62, 14], 1.4, C.alu);
    t.part(null);
    for (const [x, z, dx] of [[-28, 30, -2], [28, 30, 2]])
      t.line3([[x, 26, z], [x + dx, 36, z + 1]], t.k.OUT * 1.3, { taper: [1.3, 0.6], curve: false });
    t.prism(rr(-34, -26, 34, 26, 2.5).map(([x, y]) => [x, y, 0]), [0, 0, 32], C.wood);
    t.tower(rr(-5, 13, 9, 23, 3), -26, 3.5, C.dark);
    for (const [x, z, dx] of [[-28, 3, -3], [28, 3, 3]])
      t.line3([[x, 26, z], [x + dx, 37, z - 1]], t.k.OUT * 1.3, { taper: [1.3, 0.6], curve: false });
    /* the screen: cream surround, dark tube, colour bars */
    t.flat(f, rr(-30.5, -22.5, 13, 22.5, 4), C.cream);
    t.flat(f, rr(-28, -20, 10.5, 20, 7), C.screen);
    const bars = ["#EDEDE6", C.yellow, C.cyan, C.green, C.magenta, C.red, C.blue];
    const bw = 30 / bars.length;
    bars.forEach((col, i) => t.flat(f, rect(-24.5 + i * bw, -15, -24.5 + (i + 1) * bw, 9), col, { w: 0 }));
    ["#3F6FA8", "#232328", "#C94A9A", "#232328", "#58C3D6", "#232328", "#EDEDE6"].forEach((col, i) =>
      t.flat(f, rect(-24.5 + i * bw, 9, -24.5 + (i + 1) * bw, 14.5), col, { w: 0 }));
    /* export-only: a second channel, static between channels, a rolling bar */
    t.extra(() => {
      t.part("chan2", { pivot: [-9.5, 0, 0] });
      t.flat(f, rect(-24.5, -15, 5.5, 4), "#8CC0E8", { w: 0 });
      t.flat(f, ell(-9, 4, 6.5, 6.5, 20, 180, 360), C.sun, { w: 0 });
      t.flat(f, rect(-24.5, 4, 5.5, 14.5), "#2F5E9E", { w: 0 });
      for (const [y, x0] of [[7, -21], [9.5, -12], [12, -19], [8, -3]])
        t.line(f, [[x0, y], [x0 + 2, y - 0.8], [x0 + 4, y], [x0 + 6, y - 0.8]], t.k.TEX);
      t.flat(f, [[-17, 4], [-14, 4], [-14.5, 5.6], [-16.6, 5.6]], C.red, { w: t.k.TEX });
      t.line(f, [[-15.5, 4], [-15.5, -2.5]], t.k.TEX);
      t.flat(f, [[-15.3, -2.2], [-15.3, 3.4], [-12, 3.4]], "#FFFFFF", { w: t.k.TEX });
      t.part("snow", { pivot: [-9.5, 0, 0] });
      t.flat(f, rect(-24.5, -15, 5.5, 14.5), "#5A5F62", { w: 0 });
      let q = 3;
      const rnd = () => ((q = (q * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 150; i++)
        t.flat(f, rect(-24.2 + rnd() * 29, -14.7 + rnd() * 28.6, 0, 0).map(([x, y], j, a) =>
          [a[0][0] + (j === 1 || j === 2 ? 0.9 : 0), a[0][1] + (j >= 2 ? 0.5 : 0)]),
          rnd() > 0.5 ? "#E6E6DE" : "#26282A", { w: 0 });
      t.part("scan", { pivot: [-9.5, -15, 0], plane: f, at: [-9.5, -15], clip: rect(-24.5, -15, 5.5, 14.5) });
      t.flat(f, rect(-24.5, -16.2, 5.5, -14.6), "#FFFFFF", { w: 0 });
      t.part(null);
    });
    t.flat(f, rect(-24.5, -15, 5.5, 14.5), null, { w: t.k.TEX });
    t.flat(f, sector(-9, 0, 15.5, 16.6, 200, 245), "#FFFFFF", { w: 0 });
    /* controls */
    t.flat(f, rr(16, -22.5, 31, 22.5, 2), C.woodD, { w: t.k.TEX });
    knob(t, f, 23.5, -13, 4.6, 2.6, C.cream, -50, 9, "dial");
    knob(t, f, 23.5, -1, 3.4, 2.2, C.cream, 200, 0);
    for (let i = 0; i < 6; i++) t.line(f, [[18, 8 + i * 2.4], [29, 8 + i * 2.4]], 0.85);
  };

  /* ── 5 · rotary telephone ─────────────────────────────────────────── */
  D.phone = (t) => {
    const f = t.FR(0);
    const base = [[-30, 14], [30, 14], [29, 9], [23, -8], [20, -10], [-20, -10], [-23, -8], [-29, 9]];
    t.prism(base.map(([x, y]) => [x, y, 0]), [0, 0, 24], C.phone);
    /* cradle prongs */
    t.box(-18, -16, 9, -14, -10, 15, C.phone, { w: t.k.DET, wc: t.k.TEX });
    t.box(14, -16, 9, 18, -10, 15, C.phone, { w: t.k.DET, wc: t.k.TEX });
    /* the dial: plate, finger wheel holes, centre card, finger stop */
    t.flat(f, circ(0, 2.5, 10.2), C.cream);
    for (let i = 0; i < 10; i++) {
      const a = (-58 - i * 29) * RAD;
      const hx = Math.cos(a) * 7.1, hy = 2.5 + Math.sin(a) * 7.1;
      t.flat(f, circ(hx, hy, 1.55, 12), "#FFFFFF", { w: t.k.TEX });
      t.dot(f, hx, hy, 0.38);
    }
    t.flat(f, circ(0, 2.5, 3.6), "#FFFFFF", { w: t.k.TEX });
    t.flat(f, circ(0, 2.5, 2.6), null, { w: t.k.TEX * 0.8 });
    t.line(f, [[8.8, 7.6], [10.6, 10.4]], 1.0);
    /* the curly cord, hanging off the left */
    const coil = [];
    for (let i = 0; i <= 140; i++) {
      const u = i / 140, a = u * 11 * 2 * Math.PI;
      const bx = -33 - 5 * Math.sin(u * Math.PI), by = -9 + u * 21;
      coil.push([bx + Math.cos(a) * 2.2, by + Math.sin(a) * 1.5 + u * 0.4, 12]);
    }
    t.line3(coil, 0.6);
    t.line3([[-33, 12.6, 12], [-31, 14, 16], [-30.2, 11, 20]], 0.8);
    /* the handset across the top */
    t.part("handset", { pivot: [0, -16, 12], top: true });
    t.box(-25, -22, 8, 25, -16.5, 16, C.phone, { r: 2.5 });
    for (const cx of [-24, 24]) t.prism(ell(cx, -14.5, 6.8, 5.2, 30).map(([x, y]) => [x, y, 7.5]), [0, 0, 9], C.phone);
    t.part(null);
    t.line3([[-24, -10.5, 8], [-33, -9, 12]], 0.8);
    t.extra(() => {
      const h = t.FR(12);
      t.part("ringL", { pivot: [-31, -15, 12], top: true });
      for (const R of [9, 12.5]) t.line(h, ell(-25, -15, R, R, 8, 150, 210), t.k.DET);
      t.part("ringR", { pivot: [31, -15, 12], top: true });
      for (const R of [9, 12.5]) t.line(h, ell(25, -15, R, R, 8, -30, 30), t.k.DET);
      t.part(null);
    });
  };

  /* ── 6 · instant camera, a print coming out ───────────────────────── */
  D.instant = (t) => {
    const f = t.FR(0), pf = t.FR(-0.4);
    /* the print, behind the slot */
    t.part("print", { plane: pf, at: [0, 14], clip: rect(-17, 12.3, 17, 70) });
    t.flat(pf, rect(-14, 14, 14, 42), C.white);
    t.flat(pf, rect(-11.5, 17, 11.5, 35), C.sky, { w: t.k.TEX });
    t.flat(pf, circ(5, 22.5, 2.6), C.sun, { w: 0 });
    t.flat(pf, ell(-4, 35, 12, 7, 18, 180, 360).concat([[-11.5, 35]]).filter(([x]) => x >= -11.5 && x <= 11.5), C.hill, { w: 0 });
    t.flat(pf, ell(7, 35, 9, 5, 14, 180, 360).filter(([x]) => x <= 11.5), "#5E7A4A", { w: 0 });
    t.part(null);
    t.prism(rr(-30, -20, 30, 18, 3).map(([x, y]) => [x, y, 0]), [0, 0, 20], C.body);
    t.flat(f, rr(-30, 6, 30, 18, [0, 0, 3, 3]), C.dark, { w: 0 });
    t.line(f, [[-30, 6], [30, 6]], t.k.DET);
    t.flat(f, rect(-16, 11.4, 16, 13.2), "ink", { w: 0 });
    /* stripe, viewfinder, flash */
    ["#D9483B", "#EE8A2E", "#F2C933", "#5DBB63", "#3F6FA8"].forEach((col, i) =>
      t.flat(f, rect(-26 + i * 1.6, -6, -24.4 + i * 1.6, 6), col, { w: 0 }));
    t.flat(f, rr(-27, -17, -17, -10, 1.5), "ink");
    t.flat(f, rect(-25.5, -15.6, -23.5, -13.6), "#FFFFFF", { w: 0 });
    t.raise(f, rr(10, -18, 27, -9, 1.5), 1.2, "#E9EEF2");
    for (let x = 12; x <= 25; x += 1.8) t.line(t.FR(-1.2), [[x, -17], [x, -10]], t.k.TEX * 0.8);
    /* lens: barrel, glass in rings, a glint */
    t.raise(f, circ(-2, -2.5, 11.5), 4, "ink");
    const g = t.FR(-4);
    t.flat(g, circ(-2, -2.5, 8.5), C.glass, { w: t.k.TEX });
    t.flat(g, circ(-2, -2.5, 5.2), C.glass2, { w: t.k.TEX });
    t.flat(g, circ(-2, -2.5, 1.8), "ink", { w: 0 });
    t.flat(g, sector(-2, -2.5, 6, 7.3, 200, 250), "#FFFFFF", { w: 0 });
    t.part("shutter", { pivot: [21, 1, 0] });
    t.raise(f, circ(21, 1, 2.8), 1.8, C.red);
    t.part(null);
    t.extra(() => {
      t.part("flash", { pivot: [18.5, -13.5, -1.2], top: true });
      const star = [];
      for (let i = 0; i < 16; i++) {
        const a = (i * 22.5 - 90) * RAD, r = i % 2 ? 5.5 : 14;
        star.push([18.5 + Math.cos(a) * r, -13.5 + Math.sin(a) * r]);
      }
      t.flat(t.FR(-1.2), star, "#FFF6B8", { w: t.k.DET });
      t.part(null);
    });
  };

  /* ── 7 · 8-bit home computer + joystick ───────────────────────────── */
  D.computer = (t) => {
    /* the wedge: side profile (y, z) extruded across */
    const prof = [[0, 0], [-5, 0], [-11, 26], [0, 26]];
    t.prism(prof.map(([y, z]) => [-36, y, z]), [72, 0, 0], C.beige);
    /* the key deck, ruled on the slope */
    const slope = t.plane([0, -5, 0], [1, 0, 0], [0, -6 / 26, 1]);
    t.flat(slope, rect(-33, 2.5, 33, 23), "#B19A72", { w: t.k.TEX });
    const pitch = 4.1;
    const TYPE = [[0, 2], [1, 5], [2, 8], [0, 9], [3, 4], [1, 10], [2, 3], [3, 9]];
    for (let r = 0; r < 4; r++) {
      const off = [0, 1.2, 1.8, 2.6][r], v0 = 19 - r * 4;
      for (let c = 0; c < 13; c++) {
        const u0 = -31.5 + off + c * pitch;
        const kn = TYPE.findIndex(([a, b]) => a === r && b === c);
        t.part(kn >= 0 ? "key" + kn : null, { pivot: slope.at(u0 + 1.7, v0 + 1.6) });
        t.raise(slope, rect(u0, v0, u0 + 3.4, v0 + 3.2), 1.2, C.key);
        t.part(null);
      }
    }
    t.part("space", { pivot: slope.at(-1, 4.6) });
    t.raise(slope, rect(-16, 3, 14, 6.2), 1.2, C.key);                 // space bar
    t.part(null);
    for (let r = 0; r < 4; r++) t.raise(slope, rect(26.5, 19 - r * 4, 31.5, 22.2 - r * 4), 1.2, C.keyL);
    /* badge and power light on the front */
    const f = t.FR(0);
    t.flat(f, rect(-33, -3.6, -21, -1.4), C.dark, { w: 0 });
    for (const [x, col] of [[-31, C.red], [-29, C.orange], [-27, C.yellow], [-25, C.green]])
      t.flat(f, rect(x, -3.2, x + 1.2, -1.8), col, { w: 0 });
    t.part("led", { pivot: [30, -2.5, 0] });
    t.dot(f, 30, -2.5, 0.9, C.red);
    t.part(null);
    /* joystick, on the desk in front, its lead back into the side port */
    t.line3([[36, 0, 14], [42, 0, 6], [40, 0, -6], [34, 0, -10]], 0.8);
    t.prism(rr(20, -24, 36, -10, 2).map(([x, z]) => [x, 0, z]), [0, -4, 0], "ink", { w: t.k.OUT });
    t.part("fire", { pivot: [23.5, -4, -21] });
    t.raise(t.TOP(-4), circ(23.5, -21, 1.6), 1.2, C.red);
    t.part("stick", { pivot: [29, -4, -17], top: true });
    t.line3([[29, -4, -17], [28, -20, -17]], 1.6, { curve: false });
    t.ball([28, -21, -17], 3.2, C.red);
    t.part(null);
  };

  /* ── 8 · reel-to-reel deck ────────────────────────────────────────── */
  D.reel = (t) => {
    t.box(-30, -42, 0, 30, 42, 14, C.silver);
    const f = t.FR(0), r = t.FR(-1.5);
    t.flat(f, rr(-28, -40, 28, 4, 2), C.dark);
    for (const [cx, pack] of [[-14, 10.5], [14, 6.5]]) {
      const cy = -23;
      t.part(cx < 0 ? "reelL" : "reelR", { plane: r, at: [cx, cy] });
      t.flat(r, circ(cx, cy, 13), C.alu);
      for (let i = 0; i < 3; i++) {
        const a0 = i * 120 - 60 + (cx > 0 ? 25 : 0);
        t.flat(r, sector(cx, cy, 4.2, 11.4, a0, a0 + 72), C.panel, { w: t.k.TEX });
        t.flat(r, sector(cx, cy, 4.3, pack, a0 + 1, a0 + 71), C.tape, { w: 0 });
      }
      t.flat(r, circ(cx, cy, 3.4), C.alu, { w: t.k.TEX });
      for (let i = 0; i < 3; i++) {
        const a = (i * 120 + 90) * RAD;
        t.dot(r, cx + Math.cos(a) * 1.6, cy + Math.sin(a) * 1.6, 0.55);
      }
      t.part(null);
    }
    /* tape path round the guides, across the heads */
    t.line(f, [[-24.5, -23], [-20, -3], [-9, -1], [9, -1], [20, -3], [20.5, -23]], t.k.TEX);
    for (const x of [-20, 20]) t.raise(f, circ(x, -3, 1.8), 2, C.alu);
    t.raise(f, rr(-9, -3, 9, 3.5, 1.5), 2.4, C.panel);
    t.raise(f, circ(12.5, 1.5, 1), 1.4, C.alu);
    /* VU meters */
    for (const x of [-26, 5]) {
      t.flat(f, rr(x, 9, x + 21, 22, 1.5), C.panel);
      t.flat(f, rr(x + 1.2, 10.2, x + 19.8, 20.8, 1), C.cream, { w: 0 });
      t.line(f, ell(x + 10.5, 22, 8, 8, 12, 215, 325), t.k.TEX);
      t.flat(f, sector(x + 10.5, 22, 7, 8.6, 300, 325), C.red, { w: 0 });
      t.part(x < 0 ? "needleL" : "needleR", { pivot: [x + 10.5, 20.5, 0] });
      t.line(f, [[x + 10.5, 20.5], [x + 15.5, 13]], t.k.TEX);
      t.part(null);
    }
    /* transport keys and two small knobs */
    const cols = [C.dark, C.dark, C.dark, C.red, C.dark];
    cols.forEach((col, i) => t.raise(f, rr(-25 + i * 7, 26, -20 + i * 7, 32, 1), 1.6, col));
    knob(t, f, 13, 30.5, 2.4, 1.6, C.dark, -60, 0);
    knob(t, f, 22, 30.5, 2.4, 1.6, C.dark, 220, 0);
    t.line(f, [[-26, 37], [26, 37]], t.k.TEX);
    t.extra(() => {
      t.part("lamp", { pivot: [-1.5, 29, -1.6], top: true });
      t.flat(t.FR(-1.6), rr(-3.4, 27.2, 0.4, 30.8, 0.6), "#FF9A86", { w: 0 });
      t.part(null);
    });
  };

  /* ── 9 · arcade cabinet ───────────────────────────────────────────── */
  D.arcade = (t) => {
    /* upper body, recessed behind the marquee and panel */
    t.box(-16, -28, 8, 16, 14, 30, C.cab);
    const s = t.FR(8);
    t.flat(s, rect(-13, -25, 13, 11), "ink");
    t.flat(s, rr(-10.5, -22, 10.5, 6, 2), C.navy);
    const bricks = [C.red, C.orange, C.yellow, C.green];
    bricks.forEach((col, r) => {
      for (let c = 0; c < 6; c++) {
        t.part(r === 3 && c === 1 ? "brick" : null, { pivot: [-6.8, -13.3, 8] });
        t.flat(s, rect(-9.5 + c * 3.2, -20 + r * 2, -6.9 + c * 3.2, -18.6 + r * 2), col, { w: 0 });
        t.part(null);
      }
    });
    const scr = rr(-10.5, -22, 10.5, 6, 2);
    t.part("paddle", { plane: s, at: [0.5, 3.6], clip: scr });
    t.flat(s, rect(-2.5, 3, 3.5, 4.2), "#FFFFFF", { w: 0 });
    t.part("ball", { plane: s, at: [2, -4], clip: scr });
    t.dot(s, 2, -4, 0.7, "#FFFFFF");
    t.part(null);
    /* side art on the upper flank */
    t.flat(t.RT(16), [[8, 4], [8, -2], [30, -20], [30, -14]], C.red, { w: t.k.TEX });
    /* the base */
    t.box(-16, 14, 0, 16, 60, 30, C.cab);
    const b = t.FR(0);
    t.flat(b, rr(-7, 24, 7, 41, 1), C.panel);
    for (const x of [-4.5, 1.5]) {
      t.flat(b, rr(x, 28, x + 3, 33.5, 0.6), C.red);
      t.line(b, [[x + 1.5, 29], [x + 1.5, 32.5]], 0.8);
    }
    t.flat(b, rect(-16, 55, 16, 60), "ink", { w: 0 });
    t.flat(t.RT(16), [[0, 50], [0, 42], [30, 22], [30, 30]], C.red, { w: t.k.TEX });
    /* marquee, lit */
    t.box(-17, -44, 0, 17, -28, 30, C.cab);
    const m = t.FR(0);
    t.flat(m, rr(-14.5, -41.5, 14.5, -30.5, 1.2), C.yellow);
    t.flat(m, rr(-11, -39, 11, -33, 2.5), "ink", { w: 0 });
    for (let i = 0; i < 5; i++) t.flat(m, rect(-8.6 + i * 3.6, -37.6, -6.6 + i * 3.6, -34.4), C.yellow, { w: 0 });
    t.extra(() => {
      t.part("glow", { pivot: [0, -36, 0], top: true });
      t.flat(m, rr(-14.5, -41.5, 14.5, -30.5, 1.2), "#FFFFFF", { w: 0 });
      t.part(null);
    });
    /* control panel jutting out */
    const prof = [[17, -7], [12.5, -7], [8, 8], [17, 8]];
    t.prism(prof.map(([y, z]) => [-16.5, y, z]), [33, 0, 0], C.panel);
    const deck = t.plane([0, 12.5, -7], [1, 0, 0], [0, -4.5 / 15, 1]);
    t.raise(deck, circ(-8, 7, 2.6), 0.8, "ink");
    t.part("stick", { pivot: add(deck.at(-8, 7), [0, -0.8, 0]), top: true });
    t.line3([deck.at(-8, 7).map((v, i) => v + [0, -0.8, 0][i]), add(deck.at(-8, 7), [0, -9, 0])], 1.3, { curve: false });
    t.ball(add(deck.at(-8, 7), [0, -10.5, 0]), 2.8, C.red);
    [[2, C.red], [7, C.yellow], [12, C.cyan]].forEach(([u, col], i) => {
      t.part("btn" + i, { pivot: deck.at(u, 7) });
      t.raise(deck, circ(u, 7, 1.9), 1.2, col);
    });
    t.part(null);
  };

  /* ── 10 · turntable ───────────────────────────────────────────────── */
  D.turntable = (t) => {
    t.box(-38, -6, 0, 38, 0, 50, C.wood);
    for (const x of [-34, 34]) t.box(x - 2.5, 0, 2, x + 2.5, 2, 4, "ink", { w: t.k.DET, wc: 0 });
    const top = t.TOP(-6);
    t.flat(top, rect(-36.5, 1.5, 36.5, 48.5), C.alu, { w: t.k.TEX });
    /* hinges at the back */
    for (const x of [-24, 24]) t.tower(rect(x - 3, 46.5, x + 3, 50), -6, 2, C.dark, { w: t.k.DET, wc: 0 });
    /* platter, record, label */
    const cx = -6, cz = 25;
    t.tower(ell(cx, cz, 19, 19, 48), -6, 2.4, C.grey);
    const rec = t.TOP(-8.4);
    t.flat(rec, circ(cx, cz, 17.8, 48), C.vinyl, { w: 0 });
    for (const R of [15.5, 12.5, 9.5]) t.flat(rec, circ(cx, cz, R, 44), null, { w: 0.4 });
    t.flat(rec, sector(cx, cz, 7.5, 16.8, 200, 235), C.sheen, { w: 0 });
    t.flat(rec, sector(cx, cz, 7.5, 16.8, 20, 55), C.sheen, { w: 0 });
    t.part("label", { plane: rec, at: [cx, cz] });
    t.flat(rec, circ(cx, cz, 5.6, 24), C.red, { w: t.k.TEX });
    t.flat(rec, circ(cx, cz, 3.2, 20), null, { w: 0.4 });
    t.flat(rec, rect(cx - 3.6, cz + 1.4, cx + 2.2, cz + 2.5), "#FBFAF6", { w: 0 });
    t.flat(rec, rect(cx - 2.4, cz - 3.2, cx + 1.2, cz - 2.4), "#FBFAF6", { w: 0 });
    t.part(null);
    t.tower(circ(cx, cz, 0.7, 10), -8.4, 1.6, C.alu, { w: t.k.TEX, wc: 0 });
    /* tonearm: pivot, counterweight, arm, headshell */
    t.tower(circ(27, 38, 4, 20), -6, 2.5, C.alu);
    t.tower(circ(27.5, 44.5, 2.2, 14), -9.3, 3.4, C.dark, { w: t.k.DET });
    t.line3([[27, -10.5, 38], [27.5, -11, 44]], 1.0, { curve: false });
    t.tower(circ(27, 38, 1.6, 12), -8.5, 2.6, C.dark, { w: t.k.DET });
    t.tower(rect(30, 15, 32.5, 17.5), -6, 2.8, C.dark, { w: t.k.TEX, wc: 0 });
    t.line3([[27, -11, 38], [26.5, -11, 26], [20, -10.6, 15], [15, -10.4, 12]], 1.0);
    t.tower(rr(10.5, 9.5, 16, 13.5, 1).map((p) => p), -9.3, 1.6, C.dark, { w: t.k.DET });
    /* controls on the plate */
    t.tower(rr(-34, 4, -27, 8, 1), -6, 1.2, C.dark, { w: t.k.DET, wc: t.k.TEX });
    t.tower(circ(-22, 6, 1.8, 14), -6, 1.6, C.red, { w: t.k.DET, wc: t.k.TEX });
    t.line(top, [[33, 22], [33, 40]], 0.9);
    t.tower(rect(31.6, 28, 34.4, 31), -6, 1.6, C.dark, { w: t.k.DET, wc: 0 });
    /* front: strobe dots */
    const f = t.FR(0);
    for (let i = 0; i < 9; i++) t.dot(f, -30 + i * 2.2, -3, 0.45);
    t.flat(f, rect(24, -4.2, 33, -1.8), C.alu, { w: t.k.TEX });
    t.extra(() => [[-16, 1.7], [0, 1.9], [-8, 1.6]].forEach(([x, sc], i) => {
      const y = P3y(t, [x, -8.4, 46]);
      t.part("note" + i, { pivot: [x, y, 0], top: true });
      note(t, t.FR(0), x, y, sc);
    }));
  };


  /* ── 11 · typewriter ─────────────────────────────────────────────── */
  D.typewriter = (t) => {
    const prof = [[6, -2], [-1, -2], [-10, 22], [6, 22]];
    t.prism(prof.map(([y, z]) => [-30, y, z]), [60, 0, 0], C.mint);
    const slope = t.plane([0, -1, -2], [1, 0, 0], [0, -9 / 24, 1]);
    t.flat(slope, rect(-27, 2, 27, 21), C.mintD, { w: t.k.TEX });
    const TK = [[0, 3], [1, 6], [2, 2], [3, 5], [1, 8], [2, 4]];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 10; c++) {
        const u = -22.5 + c * 5 + [0, 1.2, 2.2, 3.2][r], v = 6.5 + r * 4.1;
        const kn = TK.findIndex(([a, b]) => a === r && b === c);
        t.part(kn >= 0 ? "tk" + kn : null, { pivot: slope.at(u, v) });
        t.raise(slope, circ(u, v, 1.75, 16), 1.6, C.keycap);
        t.part(null);
      }
    t.part("tspace", { pivot: slope.at(0, 3.2) });
    t.raise(slope, rr(-12, 2.4, 12, 4.2, 0.8), 1.2, C.keycap);
    t.part(null);
    /* the carriage: one part, slides along x as it types */
    const cp = { plane: t.FR(0), at: [0, 0] };
    t.part("carriage", cp);
    t.line3([[-34, -18, 22], [-41, -24, 20], [-45, -24, 19]], 1.1, { curve: true });
    t.box(-34, -20, 21, 34, -13, 31, C.dark);
    t.prism(circ(-19, 27, 4.2, 22).map(([y, z]) => [-37, y, z]), [74, 0, 0], "ink");
    for (const x of [-40.5, 37]) t.prism(circ(-19, 27, 3, 18).map(([y, z]) => [x, y, z]), [3.5, 0, 0], C.dark);
    const pp = t.plane([0, -22.5, 26], [1, 0, 0], [0, -1, 0.25]);
    t.flat(pp, rect(-14, 0, 14, 30), C.white);
    for (const [v, segs] of [[25, [[-11, -5], [-4, 2], [3, 9]]], [22, [[-11, -2], [-1, 6], [7, 10]]], [19, [[-11, -7], [-6, 4]]]])
      for (const [a, b] of segs) t.line(pp, [[a, v], [b, v]], t.k.TEX);
    t.extra(() => {
      for (let i = 0; i < 6; i++) {
        t.part("w" + i, cp);
        t.line(pp, [[-11 + i * 3.6, 16], [-8.6 + i * 3.6, 16]], t.k.TEX);
      }
      t.part("ding", { pivot: [38, -30, 24], top: true });
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 90) * RAD;
        t.line(t.FR(24), [[38 + Math.cos(a) * 2.5, -30 + Math.sin(a) * 2.5], [38 + Math.cos(a) * 5, -30 + Math.sin(a) * 5]], t.k.DET);
      }
    });
    t.part(null);
  };

  /* ── 12 · film projector ─────────────────────────────────────────── */
  D.projector = (t) => {
    const f = t.FR(0);
    t.line3([[-8, -6, 6], [-15, -26, 4]], t.k.OUT, { curve: false });
    t.line3([[7, -6, 6], [13, -29, 4]], t.k.OUT, { curve: false });
    const rp = t.FR(3);
    for (const [cx, cy, R, nm] of [[-15, -26, 12.5, "reelA"], [13, -29, 11, "reelB"]]) {
      t.part(nm, { plane: rp, at: [cx, cy] });
      t.flat(rp, circ(cx, cy, R), C.reelM);
      t.flat(rp, circ(cx, cy, R * 0.86), null, { w: t.k.TEX });
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * RAD;
        t.flat(rp, circ(cx + Math.cos(a) * R * 0.52, cy + Math.sin(a) * R * 0.52, R * 0.2, 16), C.film, { w: t.k.TEX });
      }
      t.flat(rp, circ(cx, cy, R * 0.15, 12), "ink", { w: 0 });
      t.part(null);
    }
    t.line(rp, [[-26.5, -24], [-21, -5]], t.k.TEX);
    t.line(rp, [[23.5, -27], [19, -6]], t.k.TEX);
    t.box(-21, -6, 0, 21, 12, 17, C.olive);
    for (const x of [-16, 16]) t.box(x - 2.5, 12, 3, x + 2.5, 15, 7, "ink", { w: t.k.DET, wc: 0 });
    t.prism(circ(3, 8.5, 4.4, 24).map(([y, z]) => [21, y, z]), [11, 0, 0], "ink");
    const lf = t.RT(32);
    t.flat(lf, circ(8.5, 3, 3.1, 18), C.glass2, { w: t.k.TEX });
    t.flat(lf, sector(8.5, 3, 1.4, 2.4, 200, 260), "#FFFFFF", { w: 0 });
    knob(t, f, -12, 3, 3.4, 1.6, C.cream, -40, 7);
    t.raise(f, rr(-3, 0, 4, 6, 1), 1.2, C.dark);
    for (let i = 0; i < 5; i++) t.line(f, [[8, -2 + i * 2.4], [18, -2 + i * 2.4]], 0.8);
    t.extra(() => {
      t.part("beam", { pivot: [32, 3, 8.5], top: true });
      t.flat(t.FR(8.5), [[32, 0.5], [52, -7], [52, 13], [32, 5.5]], "#FFF3B0", { w: 0 });
      t.part(null);
    });
  };

  /* ── 13 · twin-bell alarm clock ──────────────────────────────────── */
  D.alarm = (t) => {
    const f = t.FR(0), b = t.FR(3);
    t.line3([[-10, -21, 5], [-6, -29, 5], [6, -29, 5], [10, -21, 5]], t.k.OUT * 1.2);
    for (const s of [-1, 1]) {
      t.part(s < 0 ? "bellL" : "bellR", { pivot: [s * 12, -17, 3] });
      const dome = rot(ell(s * 11, -16, 6.4, 6.6, 22, 180, 360).concat([[s * 11 + 6.4 * s, -15], [s * 11 - 6.4 * s, -15]].sort((a, b) => a[0] - b[0]).reverse()), s * 28, s * 11, -16);
      t.prism(dome.map(([x, y]) => [x, y, 0]), [0, 0, 6], C.silver);
      t.part(null);
    }
    t.part("hammer", { pivot: [0, -15, 3] });
    t.line(b, [[0, -15], [0, -24.5]], 0.9);
    t.ball([0, -26, 3], 1.7, C.dark);
    t.part(null);
    for (const s of [-1, 1]) t.line3([[s * 9, 13, 4], [s * 13.5, 20, 4]], t.k.OUT * 1.3, { taper: [1.3, 0.7], curve: false });
    t.prism(circ(0, 0, 16, 44).map(([x, y]) => [x, y, 0]), [0, 0, 9], C.red);
    t.flat(f, circ(0, 0, 14.6, 40), "#D8D8D4");
    t.flat(f, circ(0, 0, 13, 40), C.cream);
    for (let i = 0; i < 12; i++) {
      const a = (i * 30) * RAD, big = i % 3 === 0;
      t.line(f, [[Math.cos(a) * (big ? 9.6 : 10.8), Math.sin(a) * (big ? 9.6 : 10.8)], [Math.cos(a) * 12, Math.sin(a) * 12]], big ? t.k.DET : t.k.TEX);
    }
    const hf = t.FR(-0.3);
    const hand = (len, wid, ang) => rot([[-wid, 1.5], [0, -len], [wid, 1.5]], ang, 0, 0);
    t.part("hourH", { plane: hf, at: [0, 0] });
    t.flat(hf, hand(6.5, 1.1, -60), "ink", { w: 0 });
    t.part("minH", { plane: hf, at: [0, 0] });
    t.flat(hf, hand(10, 0.8, 60), "ink", { w: 0 });
    t.part("secH", { plane: hf, at: [0, 0] });
    t.flat(hf, rot(rect(-0.25, -11, 0.25, 2.5), 160, 0, 0), C.red, { w: 0 });
    t.part(null);
    t.dot(hf, 0, 0, 1, "ink");
    t.flat(f, sector(0, 0, 10.5, 12, 200, 245), "#FFFFFF", { w: 0 });
    t.extra(() => {
      const h = t.FR(2);
      t.part("ringL", { pivot: [-20, -20, 2], top: true });
      for (const R of [10, 13.5]) t.line(h, ell(-12, -17, R, R, 8, 195, 245), t.k.DET);
      t.part("ringR", { pivot: [20, -20, 2], top: true });
      for (const R of [10, 13.5]) t.line(h, ell(12, -17, R, R, 8, 295, 345), t.k.DET);
      t.part(null);
    });
  };

  /* ── 14 · transistor radio ───────────────────────────────────────── */
  D.radio = (t) => {
    const f = t.FR(0);
    t.part("antenna", { pivot: [13, -26, 4] });
    t.line3([[13, -26, 4], [17, -42, 4]], 1.0, { curve: false });
    t.line3([[17, -42, 4], [20, -56, 4]], 0.7, { curve: false });
    t.ball([20, -56, 4], 1.3, C.alu);
    t.part(null);
    t.prism(rr(-19, -26, 19, 26, 5).map(([x, y]) => [x, y, 0]), [0, 0, 9], C.teal);
    t.raise(t.RT(19), circ(4.5, -14, 4.4, 24), 1.6, C.cream);
    const wf = t.RT(20.6);
    t.part("wheel", { plane: wf, at: [4.5, -14] });
    for (let i = 0; i < 8; i++) {
      const a = i * 45 * RAD;
      t.line(wf, [[4.5 + Math.cos(a) * 2, -14 + Math.sin(a) * 2], [4.5 + Math.cos(a) * 3.9, -14 + Math.sin(a) * 3.9]], t.k.TEX);
    }
    t.part(null);
    t.flat(f, rr(-15, -22, 15, -9, 2), C.cream);
    for (let x = -12; x <= 12; x += 2) t.line(f, [[x, -20.5], [x, x % 6 === 0 ? -17 : -18.5]], t.k.TEX * 0.8);
    for (let x = -12; x <= 12; x += 6) t.flat(f, rect(x - 1, -14, x + 1, -12.6), "ink", { w: 0 });
    t.part("needle", { plane: f, at: [-6, -15.5] });
    t.flat(f, rect(-6.4, -21.5, -5.6, -9.5), C.red, { w: 0 });
    t.part(null);
    t.flat(f, rr(-16, -6.5, 16, -3.5, 1), C.silver);
    t.flat(f, rect(-5, -5.6, 5, -4.4), "ink", { w: 0 });
    t.part("grille", { pivot: [0, 11, 0] });
    t.flat(f, rr(-15.5, -0.5, 15.5, 22.5, 3.5), "#D8D8D4");
    t.mesh(f, rr(-14.5, 0.5, 14.5, 21.5, 3), 2.2, 0.55, C.dark);
    t.part(null);
    t.extra(() => [[-12, -30, 1.6], [10, -34, 1.8]].forEach(([x, y, sc], i) => {
      t.part("note" + i, { pivot: [x, y, 0], top: true });
      note(t, f, x, y, sc);
      t.part(null);
    }));
  };

  /* ── 15 · VCR and a tape ─────────────────────────────────────────── */
  D.vcr = (t) => {
    const f = t.FR(0);
    for (const x of [-32, 32]) t.box(x - 3, 8, 3, x + 3, 10, 7, "ink", { w: t.k.DET, wc: 0 });
    t.box(-38, -8, 0, 38, 8, 40, C.vcr);
    t.line(t.TOP(-8), [[-36, 2], [36, 2]], t.k.TEX);
    t.flat(f, rr(-30, -5.5, -4, 0.5, 1), "#3A3B40");
    t.flat(f, rect(-27, -3.6, -7, -1), "ink", { w: 0 });
    t.flat(f, rr(4, -5.5, 24, 1.5, 1), "ink");
    const seg = (x, y, on) => {                       // a seven-segment digit
      const S = { a: [[0.3, 0], [2.2, 0.6]], b: [[2.2, 0.3], [2.8, 2.4]], c: [[2.2, 2.7], [2.8, 4.8]],
                  d: [[0.3, 4.6], [2.2, 5.2]], e: [[-0.3, 2.7], [0.3, 4.8]], f: [[-0.3, 0.3], [0.3, 2.4]], g: [[0.3, 2.3], [2.2, 2.9]] };
      for (const k of on) { const [[a, b], [c, d]] = S[k]; t.flat(f, rect(x + a * 0.8, y + b * 0.8, x + c * 0.8, y + d * 0.8), C.led, { w: 0 }); }
    };
    t.part("clock", { pivot: [14, -2, 0] });
    seg(6, -4, "bc"); seg(9, -4, "abged"); t.flat(f, rect(12.2, -3, 12.8, -2.4), C.led, { w: 0 });
    t.flat(f, rect(12.2, -1.4, 12.8, -0.8), C.led, { w: 0 }); seg(14, -4, "abcdef"); seg(17.6, -4, "abcdef");
    t.part(null);
    t.extra(() => {
      t.part("play", { pivot: [14, -2, 0] });
      t.flat(f, [[6.5, -4], [10.5, -2], [6.5, 0]], C.led, { w: 0 });
      t.flat(f, rect(13, -3.4, 22, -2.6), C.led, { w: 0 });
      t.flat(f, rect(13, -1.4, 19, -0.6), C.led, { w: 0 });
      t.part(null);
    });
    [C.dark, C.dark, C.dark, C.red].forEach((col, i) => t.raise(f, rr(4 + i * 5.2, 3, 7.8 + i * 5.2, 5.6, 0.6), 0.9, col));
    t.raise(f, rr(-35.5, -5, -32.5, -2, 0.6), 0.9, C.dark);
    t.dot(f, -34, 3, 0.6, C.red);
    t.flat(f, rect(28, -5, 35, -4), "#9C9C98", { w: 0 });
    /* the tape, in front of the slot; clipped to the slot's swept mouth */
    const mouth = [];
    for (const z of [0, -90]) for (const [x, y] of [[-27.3, -4.2], [-6.7, -4.2], [-6.7, -0.6], [-27.3, -0.6]]) mouth.push([x, y, z]);
    t.part("tape", { plane: t.TOP(-3.6), at: [-17, -13], top: true, clip3: mouth });
    t.box(-26, -3.6, -18, -8, -1.2, -8, "#26272B");
    const tt = t.TOP(-3.6);
    t.flat(tt, rect(-24.5, -16.5, -9.5, -12.2), C.white, { w: t.k.TEX });
    t.line(tt, [[-23, -14.4], [-14, -14.4]], t.k.TEX);
    for (const x of [-21, -13]) t.flat(tt, circ(x, -10.2, 1.3, 12), "#FFFFFF", { w: t.k.TEX });
    t.flat(t.FR(-18), rect(-23, -3, -11, -1.8), C.white, { w: 0 });
    t.part(null);
  };

  /* ── 16 · jukebox ────────────────────────────────────────────────── */
  D.jukebox = (t) => {
    const f = t.FR(0);
    const arch = ell(0, -18, 22, 22, 28, 180, 360).concat([[22, 34], [-22, 34]]);
    t.box(-24, 34, -1, 24, 38, 17, C.silver);
    t.prism(arch.map(([x, y]) => [x, y, 0]), [0, 0, 16], C.juke);
    ["#E8483B", "#F2C933", "#5DBB63"].forEach((col, i) => {
      t.part("band" + i, { pivot: [0, -18, 0] });
      const r0 = 15.6 + i * 1.9, r1 = r0 + 1.9;
      t.flat(f, sector(0, -18, r0, r1, 180, 360), col, { w: t.k.TEX });
      for (const sx of [-1, 1]) t.flat(f, sx < 0 ? rect(-r1, -18, -r0, 7) : rect(r0, -18, r1, 7), col, { w: t.k.TEX });
    });
    t.part(null);
    t.flat(f, ell(0, -18, 15, 15, 24, 180, 360).concat([[15, -5], [-15, -5]]), "#FFE7A3");
    const rp = t.TOP(-11);
    t.flat(rp, circ(0, 0, 9.5, 36), C.vinyl, { w: t.k.DET });
    t.part("rec", { plane: rp, at: [0, 0] });
    t.flat(rp, circ(0, 0, 3.4, 20), C.red, { w: t.k.TEX });
    t.flat(rp, rect(-2.2, 0.8, 1.4, 1.6), "#FBFAF6", { w: 0 });
    t.part(null);
    t.line(f, [[9, -27], [6, -16], [2.5, -12.5]], 0.9);
    t.flat(f, rr(-15, -4, 15, 5.5, 1), C.cream);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) t.flat(f, rect(-13 + c * 4.5, -2.6 + r * 3.8, -10 + c * 4.5, -1 + r * 3.8), "#FFFFFF", { w: t.k.TEX * 0.8 });
    t.part("grille", { pivot: [0, 18.5, 0] });
    t.flat(f, rr(-17, 8, 17, 29, 2), C.film);
    for (let i = 0; i < 7; i++) t.flat(f, rect(-13.6 + i * 4.3, 9.5, -12.2 + i * 4.3, 27.5), C.silver, { w: t.k.TEX * 0.8 });
    t.part(null);
    t.extra(() => [[-12, -46, 1.7], [12, -50, 1.9], [0, -48, 1.6]].forEach(([x, y, sc], i) => {
      t.part("note" + i, { pivot: [x, y, 0], top: true });
      note(t, f, x, y, sc);
      t.part(null);
    }));
  };

  /* ── 17 · VHS camcorder ──────────────────────────────────────────── */
  D.camcorder = (t) => {
    t.box(-14, -17, 6, -11, -10, 10, C.dark); t.box(10, -17, 6, 13, -10, 10, C.dark);
    t.box(-16, -20, 6, 15, -16.5, 10, C.dark, { r: 1.5 });
    t.box(-24, -10, 0, 22, 11, 16, C.cam);
    t.prism(circ(-14.5, 3.5, 3.4, 18).map(([y, z]) => [4, y, z]), [-24, 0, 0], C.dark);
    t.flat(t.RT(-20), circ(3.5, -14.5, 2.2, 14), C.glass2, { w: t.k.TEX });
    const f = t.FR(0);
    t.flat(f, rr(-6, -6, 18, 8, 1.5), "#6A6D74");
    t.flat(f, rect(-2, -3, 8, 1), "ink");
    t.flat(f, rect(10, -3.5, 16, -1.5), C.white, { w: 0 });
    t.flat(f, rr(-20, -1.5, 14, 2.8, 1), "#2A2B2E", { w: t.k.DET });
    [C.dark, C.dark, C.red].forEach((col, i) => t.raise(t.TOP(-10), rr(-4 + i * 4.5, 4, -1 + i * 4.5, 8, 0.6), 0.8, col));
    /* lens: barrel, hood, glass */
    t.prism(circ(0.5, 8, 7.4, 30).map(([y, z]) => [-24, y, z]), [-11, 0, 0], "ink");
    t.prism(circ(0.5, 8, 8.8, 30).map(([y, z]) => [-35, y, z]), [-3.5, 0, 0], C.dark);
    const g = t.RT(-38.5);
    t.flat(g, circ(8, 0.5, 6.4, 28), C.glass, { w: t.k.TEX });
    t.flat(g, circ(8, 0.5, 4, 22), C.glass2, { w: t.k.TEX });
    t.dot(g, 8, 0.5, 1.2, "ink");
    t.part("glint", { plane: g, at: [8, 0.5] });
    t.flat(g, sector(8, 0.5, 4.6, 5.8, 200, 250), "#FFFFFF", { w: 0 });
    t.part(null);
    const side = t.RT(-24);
    t.part("rec", { pivot: [-24, -6.5, 2.6] });
    t.dot(side, 2.6, -6.5, 1.1, C.red);
    t.part(null);
    t.flat(side, rect(1.4, -4.4, 5.6, -3.4), "#FFFFFF", { w: 0 });
    t.extra(() => {
      t.part("recring", { pivot: [-24, -6.5, 2.6], top: true });
      t.flat(side, circ(2.6, -6.5, 2.4, 18), null, { w: t.k.TEX });
      t.part(null);
    });
  };

  /* ── 18 · synthesizer ────────────────────────────────────────────── */
  D.synth = (t) => {
    for (const x of [-44, 40]) t.box(x, -8, 0, x + 4, 0, 32, C.wood);
    t.box(-40, -6, 0, 40, 0, 32, C.vcr);
    const top = t.TOP(-6);
    t.flat(top, rect(-38, 17, 38, 30.5), C.panel, { w: t.k.TEX });
    const MEL = [0, 2, 4, 7, 9];
    for (let i = 0; i < 15; i++) {
      const u = -37.5 + i * 5;
      t.part(MEL.includes(i) ? "wk" + i : null, { pivot: top.at(u + 2.5, 8) });
      t.raise(top, rect(u, 2, u + 4.6, 15), 1, "#F7F4EC", { wc: 0 });
      t.part(null);
    }
    for (let i = 0; i < 14; i++) {
      if (![0, 1, 3, 4, 5].includes(i % 7)) continue;
      const u = -37.5 + (i + 1) * 5 - 0.2;
      t.raise(t.TOP(-7), rect(u - 1.5, 7.5, u + 1.5, 15), 1.4, "ink");
    }
    for (let i = 0; i < 6; i++) knob(t, top, -32 + i * 5.6, 24, 1.9, 1.6, C.cream, -50 + i * 40, 0, "kn" + i);
    for (let i = 0; i < 4; i++) {
      const u = 4 + i * 5;
      t.line(top, [[u, 19], [u, 29]], 0.9);
      t.part("sl" + i, { plane: top, at: [u, 24] });
      t.raise(top, rect(u - 1.4, 22.8 + i, u + 1.4, 24.6 + i), 1.2, i % 2 ? C.orange : C.cream);
      t.part(null);
    }
    t.flat(top, rect(26, 20, 37, 28), "ink");
    t.part("led", { pivot: top.at(31.5, 24) });
    t.flat(top, [[27.5, 24], [29, 22], [30.5, 26], [32, 21.5], [33.5, 26.5], [35, 24], [35, 25], [33.5, 27.3], [32, 22.8], [30.5, 27.2], [29, 23.2], [27.5, 25]], C.ledR, { w: 0 });
    t.part(null);
    t.extra(() => [[-24, -18, 1.8], [-6, -22, 1.6], [12, -20, 1.9]].forEach(([x, y, sc], i) => {
      t.part("note" + i, { pivot: [x, y, 0], top: true });
      note(t, t.FR(0), x, y, sc);
      t.part(null);
    }));
  };

  /* ── 19 · oscilloscope ───────────────────────────────────────────── */
  D.scope = (t) => {
    t.line3([[-24, -22, 8], [-20, -30, 10], [20, -30, 10], [24, -22, 8]], t.k.OUT * 1.2);
    for (const x of [-25, 25]) t.box(x - 3, 22, 4, x + 3, 25, 9, "ink", { w: t.k.DET, wc: 0 });
    t.box(-30, -22, 0, 30, 22, 32, C.scope);
    const f = t.FR(0);
    t.flat(f, rr(-28, -19.5, 8.5, 19.5, 4), C.dark);
    t.flat(f, circ(-9.5, 0, 15.5, 40), "#26272B", { w: t.k.TEX });
    const scr = circ(-9.5, 0, 12.8, 40);
    t.flat(f, scr, C.phosD, { w: t.k.TEX });
    for (let k = -3; k <= 3; k++) {
      const d = k * 3.1, h = Math.sqrt(12.4 * 12.4 - d * d);
      t.flat(f, rect(-9.5 + d - 0.12, -h, -9.5 + d + 0.12, h), "#2E6B4E", { w: 0 });
      t.flat(f, rect(-9.5 - h, d - 0.12, -9.5 + h, d + 0.12), "#2E6B4E", { w: 0 });
    }
    t.part("wave", { plane: f, at: [-9.5, 0], clip: circ(-9.5, 0, 12.6, 40) });
    const band = (wd) => {
      const up = [], dn = [];
      /* the export slides it under a clip; the page has none, so stay inside the tube */
      const [xa, xb] = t.EXPORT ? [-34, 16] : [-20, 1];
      for (let x = xa; x <= xb; x += 0.5) {
        const y = Math.sin(((x + 9.5) / 8.2) * 2 * Math.PI) * 6;
        up.push([x, y - wd]); dn.push([x, y + wd]);
      }
      return up.concat(dn.reverse());
    };
    t.flat(f, band(0.8), "#3FBF6A", { w: 0 });
    t.flat(f, band(0.35), "#D6FFDC", { w: 0 });
    t.part(null);
    t.flat(f, sector(-9.5, 0, 10.6, 12, 205, 240), "#FFFFFF", { w: 0, sh: 1 });
    knob(t, f, 14.5, -12, 3, 1.8, C.cream, -40, 9, "kn0");
    knob(t, f, 23.5, -12, 2.6, 1.6, C.cream, 200, 7, "kn1");
    knob(t, f, 19, 1.5, 4, 2.2, C.dark, -90, 11, "kn2");
    for (const x of [14, 24]) { t.raise(f, circ(x, 14, 2.2, 16), 2, C.alu); t.dot(t.FR(-2), x, 14, 0.8); }
    t.part("lamp", { pivot: [28, -17, 0] });
    t.dot(f, 28, -17, 0.9, C.red);
    t.part(null);
  };

  /* ── 20 · printing calculator ────────────────────────────────────── */
  D.calc = (t) => {
    /* the tape: roll at the back, paper rising out of it */
    const pp = t.plane([0, -15, 37], [1, 0, 0], [0, -1, 0.15]);
    t.part("paper", { plane: pp, at: [0, 0], clip: rect(-14, 0.2, 14, 80) });
    t.flat(pp, rect(-10, -14, 10, 24), "#FBFAF6");
    for (const [v, a, b] of [[20, -7, 5], [16.5, -7, 3], [13, -3, 5], [9.5, -7, 6]]) t.line(pp, [[a, v], [b, v]], t.k.TEX);
    t.part(null);
    t.extra(() => {
      t.part("pline", { plane: pp, at: [0, 0], clip: rect(-14, 0.2, 14, 80) });
      t.line(pp, [[-7, 6], [4, 6]], t.k.TEX);
      t.part(null);
    });
    t.prism(circ(-12, 37, 3.6, 20).map(([y, z]) => [-12, y, z]), [24, 0, 0], "#F4F1EA");
    const prof = [[0, 0], [-3, 0], [-9, 34], [0, 34]];
    t.prism(prof.map(([y, z]) => [-20, y, z]), [40, 0, 0], C.calc);
    const slope = t.plane([0, -3, 0], [1, 0, 0], [0, -6 / 34, 1]);
    const dp = t.plane(slope.at(0, 31.5), [1, 0, 0], [0, 6 / 34, -1]);
    t.flat(dp, rect(-17, 0, 17, 8), "ink");
    const show = (str) => seg7(t, dp, 15.6 - str.length * 3.8 * 1.05 + 0.4, 1.3, str, C.ledR, 1.05);
    t.part("d1578", { pivot: dp.at(0, 4) }); show("1578"); t.part(null);
    t.extra(() => {
      for (const s2 of ["0", "7", "78", "789", "2"]) { t.part("d" + s2, { pivot: dp.at(0, 4) }); show(s2); }
      t.part(null);
    });
    /* keys: C ÷ × − / 7 8 9 + / 4 5 6 + / 1 2 3 = / 0 0 . = */
    const LAB = [["C", "div", "mul", "min"], ["7", "8", "9", "plus"], ["4", "5", "6", "plus2"], ["1", "2", "3", "eq"], ["0", "00", "dot", "eq2"]];
    const TAG = { C: 1, mul: 1, 7: 1, 8: 1, 9: 1, 2: 1, eq: 1 };
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 4; c++) {
        const lab = LAB[r][c], u = -15.5 + c * 8, v = 22.5 - r * 4.6;
        const col = lab === "C" ? C.red : c === 3 ? C.orange : C.dark;
        t.part(TAG[lab] ? "k" + lab : null, { pivot: slope.at(u + 3, v + 1.6) });
        t.raise(slope, rr(u, v, u + 6, v + 3.4, 0.6), 1.2, col);
        t.part(null);
      }
  };

  /* ── 21 · lava lamp ──────────────────────────────────────────────── */
  D.lava = (t) => {
    const f = t.FR(0);
    /* a lamp is round: flat profiles on the front plane, a shade crescent each */
    const glass = [[-5, -30], [5, -30], [10.5, 6], [-10.5, 6]];
    t.flat(f, [[-5.6, -36], [5.6, -36], [5, -30], [-5, -30]], C.silver);
    t.flat(f, [[1.6, -36], [5.6, -36], [5, -30], [2.4, -30]], C.silver, { w: 0, sh: 0.8 });
    t.flat(f, glass, C.lavaL);
    t.flat(f, [[2.4, -30], [5, -30], [10.5, 6], [6, 6]], C.lavaL, { w: 0, sh: 0.88 });
    t.flat(f, ell(0, 5.6, 9.6, 2.6, 22, 180, 360).concat([[9.6, 6], [-9.6, 6]]), C.lavaW, { w: 0 });
    const blobs = [[-2.2, -2, 3.6, 2.8], [3.2, -12, 2.8, 3.6], [-3, -21, 2.2, 2.6], [1.8, -26, 1.7, 1.5], [-4.6, -8, 1.6, 1.4]];
    blobs.forEach(([x, y, rx, ry], i) => {
      t.part("blob" + i, { plane: f, at: [x, y], clip: glass });
      t.flat(f, ell(x, y, rx, ry, 18), C.lavaW, { w: t.k.TEX });
    });
    t.part(null);
    t.flat(f, [[-4.2, -27], [-3.4, -27], [-7.4, 2], [-8.4, 2]], "#FFFFFF", { w: 0 });
    t.flat(f, [[-10.5, 6], [10.5, 6], [13.5, 22], [-13.5, 22]], C.silver);
    t.flat(f, [[4, 6], [10.5, 6], [13.5, 22], [6.5, 22]], C.silver, { w: 0, sh: 0.78 });
    t.flat(f, [[-13.5, 22], [13.5, 22], [12.6, 24.4], [-12.6, 24.4]], C.dark);
    t.line(f, [[-11.4, 12], [11.4, 12]], t.k.TEX);
  };

  /* ── 22 · desk fan ───────────────────────────────────────────────── */
  D.fan = (t) => {
    t.box(-11, 20, -4, 11, 24, 10, C.fanG, { r: 3 });
    knob(t, t.FR(-4), 5, 22, 1.2, 0.8, C.cream, -40, 0, "speed");
    t.line3([[0, 20, 3], [0, 6, 3]], 1.6, { curve: false });
    t.prism(circ(0, 0, 4.4, 24).map(([x, y]) => [x, y, 6]), [0, 0, 6], C.fanG);
    const bp = t.FR(1.5), cg = t.FR(0);
    t.part("blades", { plane: bp, at: [0, 0] });
    for (let i = 0; i < 3; i++) {
      const a = i * 120;
      t.flat(bp, rot([[0.8, -1.6], [5, -12], [9.6, -9], [2.2, 0.6]], a, 0, 0), C.fanG, { sh: 0.95 });
    }
    t.flat(bp, circ(0, 0, 2.2, 16), C.dark);
    t.part(null);
    t.part("cage", { pivot: [0, 0, 0] });
    for (const R of [14, 9.5, 5]) t.flat(cg, circ(0, 0, R, 40), null, { w: R > 13 ? t.k.DET : t.k.TEX });
    for (let i = 0; i < 16; i++) {
      const a = i * 22.5 * RAD;
      t.line(cg, [[Math.cos(a) * 2.6, Math.sin(a) * 2.6], [Math.cos(a) * 14, Math.sin(a) * 14]], 0.35);
    }
    t.flat(cg, circ(0, 0, 2.8, 16), C.silver);
    t.part(null);
  };

  /* ── 23 · beige PC ───────────────────────────────────────────────── */
  D.pc = (t) => {
    t.box(-36, -16, 0, -20, 22, 30, C.pcBeige);
    const tf = t.FR(0);
    t.flat(tf, rect(-34, -12, -22, -9.4), C.dark, { w: t.k.TEX });
    t.flat(tf, rect(-33.4, -11, -22.6, -10.4), "ink", { w: 0 });
    t.part("drive", { pivot: [-23.4, -8.2, 0] });
    t.dot(tf, -23.4, -8.2, 0.5, C.led);
    t.part(null);
    for (let y = 0; y < 8; y += 2) t.line(tf, [[-33, y], [-23, y]], 0.4);
    t.raise(tf, circ(-28, 15, 1.6, 14), 0.8, C.dark);
    t.box(-12, -24, 4, 32, 12, 32, C.pcBeige, { r: 2 });
    t.box(2, 12, 10, 18, 16, 24, C.pcBeige, { wc: t.k.TEX });
    const m = t.FR(4);
    t.flat(m, rr(-9, -21, 29, 6, 2), "#B5AD98");
    t.flat(m, rr(-6.5, -18.5, 26.5, 3.5, 3), "#14261C");
    const lines = [[-4, 16], [-4, 22], [-4, 10], [-4, 19], [-4, 13]];
    lines.forEach(([x0, len], i) => {
      t.part("tx" + i, { pivot: [x0, -15.6 + i * 3.4, 4] });
      t.flat(m, rect(x0, -16.2 + i * 3.4, x0 + len, -15 + i * 3.4), C.phos, { w: 0 });
    });
    t.part("cursor", { pivot: [0, 1, 4] });
    t.flat(m, rect(-4, 0.8, -2, 2.2), C.phos, { w: 0 });
    t.part(null);
    t.dot(m, 24, 4.8, 0.5, C.led);
    t.box(-16, 18, -16, 26, 20.5, -5, C.pcBeige, { wc: t.k.TEX });
    const kb = t.TOP(18);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++)
      t.flat(kb, rect(-14.6 + c * 3 + r * 0.4, -14.6 + r * 2.4, -12.3 + c * 3 + r * 0.4, -12.8 + r * 2.4), "#B5AD98", { w: 0.35 });
    t.tower(rr(30, -12, 35, -5, 2.4), 22, 1.8, C.pcBeige, { wc: t.k.TEX });
    t.line3([[32.5, 20.5, -5], [34, 22, 4], [28, 22, 14]], 0.6);
    /* the floppy, half out of the drive; clipped to the slot's swept mouth */
    const mouth = [];
    for (const z of [0, -60]) for (const [x, y] of [[-33.6, -11.4], [-22.4, -11.4], [-22.4, -9.8], [-33.6, -9.8]]) mouth.push([x, y, z]);
    t.part("disk", { plane: t.TOP(-11), at: [-28, -6], top: true, clip3: mouth });
    t.box(-32.5, -11, -11, -23.5, -10.2, -1, "#2E3A4E", { wc: t.k.TEX });
    const dt = t.TOP(-11);
    t.flat(dt, rect(-31.5, -10, -24.5, -5), C.white, { w: t.k.TEX });
    t.flat(dt, rect(-30, -3.6, -26, -1.2), C.silver, { w: t.k.TEX });
    t.part(null);
  };

  /* ── 24 · slide projector + screen ───────────────────────────────── */
  D.slides = (t) => {
    /* the screen, on its tripod, behind and left */
    const sp = t.FR(30);
    for (const [a, b] of [[-46, -54], [-46, -38]]) t.line(sp, [[a, 10], [b, 26]], 0.8);
    t.line(sp, [[-46, -32], [-46, 26]], 1.0);
    t.flat(sp, rect(-62, -32, -30, -8), "#F7F4EC");
    t.flat(sp, rect(-62, -33.5, -30, -32), C.dark, { w: t.k.TEX });
    const pics = [
      () => { t.flat(sp, rect(-59.5, -29.5, -32.5, -10.5), C.sky, { w: 0 }); t.flat(sp, circ(-38, -24, 2.6, 16), C.sun, { w: 0 }); t.flat(sp, [[-59.5, -10.5], [-50, -20], [-42, -14], [-36, -18], [-32.5, -10.5]], "#7E9B5E", { w: 0 }); },
      () => { t.flat(sp, rect(-59.5, -29.5, -32.5, -10.5), "#2F5E9E", { w: 0 }); t.flat(sp, rect(-59.5, -18, -32.5, -10.5), "#E8D27C", { w: 0 }); t.flat(sp, [[-48, -18], [-47, -26], [-44, -18]], C.white, { w: 0 }); },
      () => { t.flat(sp, rect(-59.5, -29.5, -32.5, -10.5), "#F2C2A0", { w: 0 }); t.flat(sp, [[-56, -10.5], [-46, -26], [-36, -10.5]], "#8E6A4E", { w: 0 }); t.flat(sp, [[-49, -21], [-46, -26], [-43, -21]], C.white, { w: 0 }); },
    ];
    t.part("img0", { pivot: [-46, -20, 30] }); pics[0]();
    t.extra(() => { t.part("img1", { pivot: [-46, -20, 30] }); pics[1](); t.part("img2", { pivot: [-46, -20, 30] }); pics[2](); });
    t.part(null);
    t.flat(sp, rect(-59.5, -29.5, -32.5, -10.5), null, { w: t.k.TEX });
    /* the projector */
    t.box(-14, -4, 0, 14, 8, 24, C.slideG, { r: 1.5 });
    const tray = t.TOP(-4);
    t.part("tray", { plane: tray, at: [0, 12] });
    t.tower(circ(0, 12, 12.5, 40), -4, 4, "#3A3B40", { w: t.k.DET });
    const tt = t.TOP(-8);
    for (let i = 0; i < 20; i++) {
      const a = i * 18 * RAD;
      t.flat(tt, rot(rect(-0.5, -11.5, 0.5, -7.5), i * 18, 0, 0).map(([x, z]) => [x, z + 12]), i % 5 ? "#F7F4EC" : C.red, { w: 0.3 });
      void a;
    }
    t.flat(tt, circ(0, 12, 5, 22), C.silver, { w: t.k.TEX });
    t.part(null);
    t.prism(circ(1, 3, 4, 22).map(([x, y]) => [x, y, 0]), [0, 0, -7], "ink");
    t.flat(t.FR(-7), circ(1, 3, 2.8, 20), C.glass2, { w: t.k.TEX });
    t.flat(t.FR(-7), sector(1, 3, 1.4, 2.2, 200, 260), "#FFFFFF", { w: 0 });
    t.raise(t.FR(0), rr(-11, 1, -6, 5, 1), 0.8, C.dark);
    t.raise(t.FR(0), rr(8, 1, 12, 5, 1), 0.8, C.red);
    t.extra(() => {
      t.part("beam", { pivot: [1, 3, -7], top: true });
      t.flat(t.FR(-7), [[-1.5, 0.5], [3.5, 0.5], [-14, -16], [-30, -12]], "#FFF3B0", { w: 0 });
      t.part(null);
    });
  };

  /* ── 25 · game console + controller ──────────────────────────────── */
  D.console = (t) => {
    t.box(-22, -6, 0, 22, 2, 26, C.nes);
    const top = t.TOP(-6), f = t.FR(0);
    t.flat(top, rect(-22, 13, 22, 26), "#6E6C68", { w: t.k.DET });
    t.flat(top, rect(-12, 3, 12, 11), "#3A3B40", { w: t.k.DET });
    t.flat(f, rect(-22, -6, 22, -3.5), "#6E6C68", { w: t.k.TEX });
    t.part("led", { pivot: [-17, -1, 0] });
    t.dot(f, -17, -1, 0.6, C.red);
    t.part(null);
    t.raise(f, rr(-14, -2.4, -9, 0.4, 0.6), 0.8, "#A3243B");
    t.raise(f, rr(-7, -2.4, -2, 0.4, 0.6), 0.8, "#A3243B");
    for (const x of [6, 12]) t.flat(f, rect(x, -2, x + 3.6, 0.4), C.dark, { w: t.k.TEX });
    /* the cartridge, standing in the slot; clipped to the slot so it can seat */
    const cm = [];
    for (const y of [-6, -60]) for (const [x, z] of [[-11.6, 3.4], [11.6, 3.4], [11.6, 10.6], [-11.6, 10.6]]) cm.push([x, y, z]);
    t.part("cart", { plane: t.FR(5), at: [0, -6], top: true, clip3: cm });
    t.box(-10, -15, 4.5, 10, -5.8, 9.5, C.dark, { wc: t.k.TEX });
    const cf = t.FR(4.5);
    t.flat(cf, rect(-7.5, -13.8, 7.5, -7.6), "#E8D27C", { w: t.k.TEX });
    t.flat(cf, [[-6, -7.6], [-2, -12], [1, -9.6], [3, -11], [6, -7.6]], "#3E5FA8", { w: 0 });
    t.flat(cf, circ(4.4, -12, 0.9, 10), C.red, { w: 0 });
    t.part(null);
    /* the controller, on the desk in front, lead back to the port */
    t.line3([[6, 0, -1], [10, 2, -8], [4, 2, -14]], 0.7);
    t.box(-12, 0.6, -24, 10, 2, -14, C.nes, { r: 1.5, wc: t.k.TEX });
    const ct = t.TOP(0.6);
    t.flat(ct, rr(-11, -23, 9, -15, 1), "#3A3B40", { w: t.k.TEX });
    t.part("dpad", { pivot: [-6.5, 0.6, -19] });
    t.raise(ct, rect(-9, -19.8, -4, -18.2), 0.5, "ink");
    t.raise(ct, rect(-7.3, -21.6, -5.7, -16.4), 0.5, "ink");
    t.part(null);
    [["bB", 3, C.red], ["bA", 6.4, C.red]].forEach(([n, x, col]) => {
      t.part(n, { pivot: [x, 0.6, -19.4] });
      t.raise(ct, circ(x, -19.4, 1.2, 14), 0.6, col);
    });
    t.part(null);
    t.flat(ct, rr(-2.6, -20.6, -0.6, -19.8, 0.3), C.silver, { w: 0 });
    t.flat(ct, rr(-0.2, -20.6, 1.8, -19.8, 0.3), C.silver, { w: 0 });
  };

  /* ── 26 · pinball machine ────────────────────────────────────────── */
  D.pinball = (t) => {
    for (const [x, z] of [[-13, 38], [13, 38]]) t.line3([[x, 8, z], [x + Math.sign(x), 30, z]], t.k.OUT * 1.2, { taper: [1.2, 0.7], curve: false });
    t.box(-15, -32, 36, 15, -2, 42, C.blue);
    const bb = t.FR(36);
    t.flat(bb, rr(-13, -30, 13, -16, 1.5), C.yellow);
    t.flat(bb, rot([[0, -29], [2, -24], [7, -23], [3, -20], [4, -15.5], [0, -18], [-4, -15.5], [-3, -20], [-7, -23], [-2, -24]], 0, 0, 0), C.red, { w: t.k.TEX });
    t.flat(bb, rect(-10, -13, 10, -6), "ink");
    const score = (str) => seg7(t, bb, -8.6, -12.2, str, C.ledR, 1.05);
    t.part("sc0", { pivot: [0, -9.5, 36] }); score("1200");
    t.extra(() => { t.part("sc1", { pivot: [0, -9.5, 36] }); score("3450"); t.part("sc2", { pivot: [0, -9.5, 36] }); score("8850"); });
    t.part(null);
    t.box(-15, -2, 0, 15, 8, 40, C.red);
    for (const [x, z] of [[-13, 2], [13, 2]]) t.line3([[x, 8, z], [x + Math.sign(x), 30, z]], t.k.OUT * 1.2, { taper: [1.2, 0.7], curve: false });
    const pf = t.TOP(-2);
    t.flat(pf, rect(-13.5, 1.5, 13.5, 35), C.navyF, { w: t.k.TEX });
    t.line(pf, [[11, 2], [11, 32]], 0.5);
    for (const [u, v] of [[-8, 16], [0, 18], [8, 16]]) t.flat(pf, [[u - 1.4, v], [u + 1.4, v], [u, v + 2.6]], C.yellow, { w: 0 });
    t.flat(pf, [[-11, 6], [-8, 12], [-11, 12]], C.white, { w: t.k.TEX });
    t.flat(pf, [[9, 6], [6, 12], [9, 12]], C.white, { w: t.k.TEX });
    [[-5.5, 26, C.red], [5.5, 26, C.yellow], [0, 31, C.cyan]].forEach(([u, v, col], i) => {
      t.part("bump" + i, { pivot: [u, -3, v] });
      t.tower(circ(u, v, 2.4, 20), -2, 1.6, col);
      t.part(null);
    });
    const fp = t.TOP(-2.3);
    t.part("flipL", { plane: fp, at: [-7, 5.8] });
    t.flat(fp, [[-7.6, 6.4], [-7.4, 5.2], [-1.6, 4.2], [-1.4, 4.8]], C.white);
    t.part("flipR", { plane: fp, at: [7, 5.8] });
    t.flat(fp, [[7.6, 6.4], [7.4, 5.2], [1.6, 4.2], [1.4, 4.8]], C.white);
    t.part("ball", { plane: fp, at: [4, 12], top: true });
    t.ball([4, -3.4, 12], 1.1, C.silver);
    t.part(null);
    const fr = t.FR(0);
    t.flat(fr, rr(-4.5, 0, 4.5, 6.5, 0.6), C.dark);
    for (const x of [-2.4, 1]) t.flat(fr, rect(x, 1.4, x + 1.4, 3.6), C.ledR, { w: 0 });
    t.raise(fr, circ(11.5, 3, 1, 12), 2.2, C.silver);
  };

  /* ── 27 · toaster ────────────────────────────────────────────────── */
  D.toaster = (t) => {
    const slot = (z0, z1) => {
      const c = [];
      for (const y of [-14, -80]) for (const [x, z] of [[-11, z0], [11, z0], [11, z1], [-11, z1]]) c.push([x, y, z]);
      return c;
    };
    const slice = (name, z) => {
      const pl = t.FR(z);
      t.part(name, { plane: pl, at: [0, -14], top: true, clip3: slot(z - 1.6, z + 1.6) });
      t.flat(pl, rr(-9.4, -25, 9.4, -12, [4.5, 4.5, 0, 0]), C.crust);
      t.flat(pl, rr(-8, -23.8, 8, -12, [3.6, 3.6, 0, 0]), C.bread, { w: 0 });
      t.part(null);
    };
    t.prism(rr(-16, -14, 16, 12, [6, 6, 1.5, 1.5]).map(([x, y]) => [x, y, 0]), [0, 0, 22], C.silver);
    const top = t.TOP(-14);
    for (const z of [6.2, 15.8]) t.flat(top, rect(-11, z - 1.6, 11, z + 1.6), "ink");
    t.extra(() => {
      t.part("glow", { pivot: [0, -14, 11], top: true });
      for (const z of [6.2, 15.8]) t.flat(top, rect(-10.4, z - 1, 10.4, z + 1), "#FF7A3A", { w: 0 });
      t.part(null);
    });
    slice("toastB", 15.8);
    slice("toastF", 6.2);
    const f = t.FR(0);
    t.flat(f, [[-12, -10], [-10, -10], [-13, 8], [-14.4, 8]], "#FFFFFF", { w: 0 });
    t.flat(f, [[-7, -10], [-6.2, -10], [-8.2, 8], [-9, 8]], "#FFFFFF", { w: 0 });
    knob(t, f, 9, 5, 2.4, 1.4, C.dark, -60, 7);
    for (const x of [-12, 12]) t.box(x - 2.5, 12, 3, x + 2.5, 14, 8, "ink", { w: t.k.DET, wc: 0 });
    const sd = t.RT(16);
    t.line(sd, [[11, -10], [11, 4]], 0.9);
    t.part("lever", { plane: sd, at: [11, -8] });
    t.raise(sd, rr(8.4, -9.4, 13.6, -7, 0.8), 1.4, C.dark);
    t.part(null);
    t.extra(() => {
      t.part("ding", { pivot: [0, -32, 11], top: true });
      for (let i = 0; i < 6; i++) {
        const a = (i * 36 - 180) * RAD;
        t.line(t.FR(11), [[Math.cos(a) * 12, -24 + Math.sin(a) * 9], [Math.cos(a) * 15, -24 + Math.sin(a) * 11.5]], t.k.DET);
      }
      t.part(null);
    });
  };

  /* ── 28 · metronome ──────────────────────────────────────────────── */
  D.metronome = (t) => {
    t.box(-13.5, 18, -1, 13.5, 21, 11, C.woodD, { wc: t.k.TEX });
    t.prism([[-12, 18], [12, 18], [4.5, -26], [-4.5, -26]].map(([x, y]) => [x, y, 0]), [0, 0, 10], C.wood);
    t.prism([[-4.5, -26], [4.5, -26], [0, -31]].map(([x, y]) => [x, y, 0]), [0, 0, 10], C.woodD);
    const f = t.FR(0);
    t.flat(f, [[-7, 14], [7, 14], [2.8, -20], [-2.8, -20]], C.tweed);
    for (let y = -16; y <= 6; y += 2.5) t.line(f, [[-0.8 - (14 - y) * 0.03, y], [0.8 + (14 - y) * 0.03, y]], 0.4);
    const pp = t.FR(-0.6);
    t.part("pend", { pivot: [0, 12, -0.6] });
    t.line(pp, [[0, 12], [0, -22]], 0.9);
    t.flat(pp, [[-2.2, -11], [2.2, -11], [1.6, -7.4], [-1.6, -7.4]], C.silver);
    t.part(null);
    t.dot(f, 0, 12, 0.9, C.brass);
    t.extra(() => {
      for (const [n, s] of [["tickL", -1], ["tickR", 1]]) {
        t.part(n, { pivot: [s * 16, -22, 0], top: true });
        for (const r of [3, 5]) t.line(f, ell(s * 13, -22, r, r, 6, s < 0 ? 160 : -20, s < 0 ? 200 : 20), t.k.DET);
      }
      t.part(null);
    });
  };

  /* ── 29 · gramophone ─────────────────────────────────────────────── */
  D.gramophone = (t) => {
    t.box(-16, 4, 0, 16, 16, 26, C.wood);
    t.flat(t.FR(0), rect(-13, 7, 13, 13), C.woodD, { w: t.k.TEX });
    const top = t.TOP(4);
    t.tower(circ(-1, 13, 10, 36), 4, 1, C.dark, { w: t.k.DET });
    const rp = t.TOP(3);
    t.flat(rp, circ(-1, 13, 9.2, 36), C.vinyl, { w: 0 });
    for (const R of [7.6, 5.8]) t.flat(rp, circ(-1, 13, R, 30), null, { w: 0.35 });
    t.part("rec", { plane: rp, at: [-1, 13] });
    t.flat(rp, circ(-1, 13, 3.2, 20), C.red, { w: t.k.TEX });
    t.flat(rp, rect(-3, 13.6, 0.6, 14.4), "#FBFAF6", { w: 0 });
    t.part(null);
    void top;
    t.tower(circ(12, 21, 1.6, 12), 4, 2, C.brass, { w: t.k.DET });
    t.line3([[12, 2, 21], [12, -6, 21], [4, -2, 14]], 1.4, { curve: true });
    /* the horn, flaring up and out toward us */
    const hp = t.FR(14), mouth = rot(ell(-8, -22, 12, 8.6, 30), -32, -8, -22);
    t.flat(hp, hull(circ(4, -2, 1.4, 10).concat(mouth)), C.brass);
    for (const a of [0.2, 0.45, 0.7]) {
      const p = mouth[Math.round(a * 30) % 30];
      t.line(hp, [[4, -2], [(4 + p[0]) / 2 + 1.5, (-2 + p[1]) / 2 + 1], p], t.k.TEX, { curve: true });
    }
    t.flat(hp, mouth, C.brass, { sh: 1.08 });
    t.flat(hp, rot(ell(-7.4, -21.4, 9.6, 6.6, 26), -32, -7.4, -21.4), C.film, { w: t.k.TEX });
    t.flat(hp, rot(ell(-5.8, -20.6, 4.2, 2.8, 18), -32, -5.8, -20.6), "#1A1410", { w: 0 });
    const sd = t.RT(16);
    t.flat(sd, circ(13, 10, 1.4, 12), C.brass);
    t.part("crank", { plane: sd, at: [13, 10] });
    t.line(sd, [[13, 10], [13, 2.5]], 1.0);
    t.line(sd, [[13, 2.5], [10, 2.5]], 1.0);
    t.flat(sd, rr(9, 1.4, 11.2, 3.6, 1), C.dark);
    t.part(null);
    t.extra(() => [[-16, -36, 1.8], [-4, -40, 1.6], [6, -36, 1.7]].forEach(([x, y, sc], i) => {
      t.part("note" + i, { pivot: [x, y, 14], top: true });
      note(t, hp, x, y, sc);
      t.part(null);
    }));
  };

  /* ── 30 · walkie-talkie ──────────────────────────────────────────── */
  D.walkie = (t) => {
    t.part("ant", { pivot: [-5.5, -22, 4] });
    t.line3([[-5.5, -22, 4], [-5.5, -44, 4]], 2.2, { curve: false, taper: [1.3, 0.8] });
    t.ball([-5.5, -45, 4], 1.4, C.dark);
    t.part(null);
    t.tower(circ(4, 4, 2, 14), -22, 3, C.dark);
    t.prism(rr(-10, -22, 10, 24, 4).map(([x, y]) => [x, y, 0]), [0, 0, 8], C.walkie);
    const f = t.FR(0);
    t.flat(f, rr(-7.5, -17, 7.5, -5, 1.5), "#A9B65A");
    const ch = (s2) => seg7(t, f, -3.5, -14.6, s2, "#2E3A1E", 1.15);
    t.part("ch0", { pivot: [0, -11, 0] }); ch("07");
    t.extra(() => { t.part("ch1", { pivot: [0, -11, 0] }); ch("08"); });
    t.part(null);
    t.flat(f, rr(-7.5, 1, 7.5, 20, 2), C.silver);
    t.mesh(f, rr(-6.8, 1.8, 6.8, 19.2, 1.6), 1.9, 0.5, "ink");
    t.part("ledG", { pivot: [6, -19.4, 0] });
    t.dot(f, 6, -19.4, 0.8, C.led);
    t.extra(() => { t.part("ledR", { pivot: [6, -19.4, 0] }); t.dot(f, 6, -19.4, 0.8, C.red); });
    t.part(null);
    const sd = t.RT(10);
    t.part("ptt", { pivot: [10, -6, 4] });
    t.raise(sd, rr(1.6, -11, 6.4, -1, 1.2), 1.4, C.dark);
    t.part(null);
    t.extra(() => {
      for (let i = 0; i < 3; i++) {
        t.part("wave" + i, { pivot: [-12, 10, 0], top: true });
        const r = 4 + i * 3;
        t.line(f, ell(-9, 10, r, r * 1.2, 8, 140, 220), t.k.DET);
      }
      t.part(null);
    });
  };

  /* ── 31 · pager ──────────────────────────────────────────────────── */
  D.pager = (t) => {
    t.box(-3, -11, 2, 3, -8, 4, C.dark, { wc: t.k.TEX });
    t.prism(rr(-15, -8, 15, 8, 3).map(([x, y]) => [x, y, 0]), [0, 0, 5], C.dark);
    const f = t.FR(0);
    t.flat(f, rr(-12.5, -5.5, 6.5, 4, 1.2), "#A9B65A");
    const num = (s2) => seg7(t, f, -11.4, -3.6, s2, "#2E3A1E", 0.62);
    t.part("n1", { pivot: [-3, -1, 0] }); num("5550199");
    t.extra(() => { t.part("n0", { pivot: [-3, -1, 0] }); num("555"); });
    t.part(null);
    for (const y of [-4.6, 0.4]) t.raise(f, rr(8.4, y, 12.8, y + 3.2, 0.8), 0.8, "#6E6C68");
    t.part("led", { pivot: [12.6, -6.4, 0] });
    t.dot(f, 12.6, -6.4, 0.6, C.red);
    t.part(null);
    t.flat(f, rect(-12, 5.4, -4, 6.2), "#6E6C68", { w: 0 });
    t.extra(() => {
      for (const [n, s] of [["bzL", -1], ["bzR", 1]]) {
        t.part(n, { pivot: [s * 19, 0, 0], top: true });
        for (const dy of [-4, 0, 4]) t.line(f, [[s * 17.5, dy - 1.4], [s * 19, dy], [s * 17.5, dy + 1.4]], t.k.DET);
      }
      t.part(null);
    });
  };

  /* ── 32 · wind-up robot ──────────────────────────────────────────── */
  D.robot = (t) => {
    t.part("armL", { pivot: [-11, -4, 5] });
    t.box(-13.5, -5, 2.5, -9, 8, 7.5, C.silver);
    t.flat(t.FR(2.5), circ(-11.2, 9, 1.8, 14), C.dark);
    t.part(null);
    for (const [n, x0] of [["legL", -6.5], ["legR", 1.5]]) {
      t.part(n, { pivot: [x0 + 2.5, 14, 5] });
      t.box(x0, 14, 2, x0 + 5, 24, 8, C.slate);
      t.box(x0 - 0.6, 24, 0.6, x0 + 5.6, 27, 8.4, C.dark, { wc: t.k.TEX });
      t.part(null);
    }
    t.box(-9, -6, 0, 9, 14, 10, C.tin);
    const f = t.FR(0);
    t.flat(f, rr(-6, -3, 6, 9, 1.2), C.silver);
    for (const [i, x] of [[0, -3], [1, 3]]) {
      t.part("light" + i, { pivot: [x, 0, 0] });
      t.flat(f, circ(x, 0, 1.3, 14), i ? C.yellow : C.cyan);
      t.part(null);
    }
    for (let y = 3.5; y < 8; y += 1.4) t.line(f, [[-4, y], [4, y]], 0.5);
    t.line3([[0, -20, 5], [0, -26, 5]], 0.8, { curve: false });
    t.part("antball", { pivot: [0, -27, 5] });
    t.ball([0, -27, 5], 1.3, C.red);
    t.part(null);
    t.box(-7, -20, 1, 7, -6, 9, C.silver);
    const h = t.FR(1);
    for (const x of [-3.2, 3.2]) { t.flat(h, circ(x, -15, 2, 16), C.yellow); t.dot(h, x + 0.3, -14.8, 0.8, "ink"); }
    t.flat(h, rr(-3.6, -11.4, 3.6, -8.4, 0.6), C.dark);
    for (let x = -2.4; x <= 2.4; x += 1.2) t.line(h, [[x, -11], [x, -8.8]], 0.35);
    const sd = t.RT(9);
    t.part("key", { plane: sd, at: [5, 4] });
    t.flat(sd, [[4.4, 4.4], [5.6, 4.4], [5.6, 3.6], [4.4, 3.6]], C.brass, { w: 0 });
    t.flat(sd, ell(3.2, 4, 1.8, 1.2, 12), C.brass);
    t.flat(sd, ell(6.8, 4, 1.8, 1.2, 12), C.brass);
    t.part(null);
    t.part("armR", { pivot: [11, -4, 5] });
    t.box(9, -5, 2.5, 13.5, 8, 7.5, C.silver);
    t.flat(t.FR(2.5), circ(11.2, 9, 1.8, 14), C.dark);
    t.part(null);
  };

  /* ── 33 · cash register ──────────────────────────────────────────── */
  D.register = (t) => {
    /* the drawer's tray FIRST, so on the page the cabinet covers it; in Rive
       the whole drawer is one moving part clipped to the opening's mouth */
    const opening = [];
    for (const z of [-2, -60]) for (const [x, y] of [[-16, 11], [16, 11], [16, 17], [-16, 17]]) opening.push([x, y, z]);
    t.part("drawer", { plane: t.TOP(11), at: [0, 0], top: true, clip3: opening });
    t.box(-15.6, 11.2, -2.2, 15.6, 17, 18, C.woodD, { wc: t.k.TEX });
    const dt = t.TOP(11.2);
    for (const [x, col] of [[-12, C.green], [-6, C.green], [0, "#E8C547"], [6, "#C9CCD1"], [12, "#B87333"]])
      t.flat(dt, rect(x - 2.4, 0, x + 2.4, 14), col, { w: t.k.TEX });
    t.part(null);
    t.box(-18, 10, -2, 18, 18, 24, C.brass);
    t.part("drawer");
    const df = t.FR(-2.2);
    t.flat(df, rect(-15.6, 11.2, 15.6, 17), C.woodD, { w: t.k.DET });
    t.flat(df, rr(-3, 13, 3, 14.6, 0.8), C.brass, { w: t.k.TEX });
    t.part(null);
    const prof = [[10, 0], [2, 0], [-10, 14], [-10, 24], [10, 24]];
    t.prism(prof.map(([y, z]) => [-18, y, z]), [36, 0, 0], C.brass);
    const slope = t.plane([0, 2, 0], [1, 0, 0], [0, -12 / 14, 1]);
    const PRESS = { "1,2": "k0", "2,0": "k1", "3,3": "k2" };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const u = -13 + c * 6.5, v = 2 + r * 3.2;
      t.part(PRESS[r + "," + c] || null, { pivot: slope.at(u, v) });
      t.raise(slope, circ(u, v, 1.4, 14), 1.2, C.cream);
      t.part(null);
    }
    t.box(-12, -21, 15, 12, -10, 24, C.brass);
    const dsp = t.FR(15);
    t.flat(dsp, rect(-10, -19, 10, -13), "ink");
    const flag = (n, x, digit) => {
      const fl = t.FR(17);
      t.part(n, { plane: fl, at: [x, -21], clip: rect(-14, -60, 14, -21) });
      t.flat(fl, rect(x - 2.4, -26, x + 2.4, -21), C.white);
      seg7(t, fl, x - 1.1, -25.2, digit, "ink", 0.7);
      t.part(null);
    };
    flag("flag0", -6, "1"); flag("flag1", 0, "5"); flag("flag2", 6, "0");
    const sd = t.RT(18);
    t.flat(sd, circ(12, 4, 1.4, 12), C.dark);
    t.part("crank", { plane: sd, at: [12, 4] });
    t.line(sd, [[12, 4], [12, -4]], 1.0);
    t.flat(sd, rr(12, -5, 15, -3, 1), C.dark);
    t.part(null);
    t.extra(() => {
      t.part("ding", { pivot: [0, -30, 15], top: true });
      for (let i = 0; i < 5; i++) {
        const a = (i * 30 - 150) * RAD;
        t.line(t.FR(15), [[Math.cos(a) * 14, -24 + Math.sin(a) * 8], [Math.cos(a) * 17, -24 + Math.sin(a) * 10]], t.k.DET);
      }
      t.part(null);
    });
  };

  /* ── 34 · guitar amp ─────────────────────────────────────────────── */
  D.amp = (t) => {
    t.line3([[-14, -10, -1], [-24, 0, -4], [-20, 16, -6], [-30, 17, -2]], 0.9);
    t.box(-20, -16, 0, 20, 16, 14, C.tweed, { r: 2 });
    t.box(-6, -19, 5, 6, -16, 9, C.woodD, { r: 1, wc: t.k.TEX });
    const f = t.FR(0);
    t.flat(f, rect(-18, -14, 18, -7.5), C.silver);
    for (let i = 0; i < 6; i++) knob(t, f, -10 + i * 4.6, -10.7, 1.4, 1, "ink", -60 + i * 30, 0, "kn" + i);
    t.part("jewel", { pivot: [14.6, -10.7, 0] });
    t.flat(f, circ(14.6, -10.7, 1.4, 14), C.red);
    t.part(null);
    t.dot(f, -15, -10.7, 0.9, "ink");
    t.part("grille", { pivot: [0, 4.5, 0] });
    t.flat(f, rr(-17, -5.5, 17, 14, 1.5), C.cloth);
    for (let y = -4; y < 13.5; y += 1.6) t.line(f, [[-16.4, y], [16.4, y]], 0.25);
    t.flat(f, rr(-5, -4.4, 5, -2, 0.8), C.white, { w: t.k.TEX });
    t.part(null);
    t.extra(() => {
      for (let i = 0; i < 3; i++) {
        t.part("thump" + i, { pivot: [22, 4, 0], top: true });
        const r = 5 + i * 3.2;
        t.line(f, ell(16, 4, r, r * 1.25, 8, -40, 40), t.k.DET);
      }
      t.part(null);
    });
  };

  /* ── 35 · vending machine ────────────────────────────────────────── */
  D.vending = (t) => {
    t.box(-16, -34, 0, 16, 30, 22, C.red);
    const f = t.FR(0);
    t.part("sign", { pivot: [0, -32, 0] });
    t.flat(f, rect(-14, -33, 14, -29.5), C.white, { w: t.k.TEX });
    for (let i = 0; i < 4; i++) t.flat(f, rect(-9 + i * 5, -32.2, -6 + i * 5, -30.3), C.red, { w: 0 });
    t.part(null);
    const win = rr(-14, -28, 4, 9, 1);
    t.flat(f, win, "#CFE3E6");
    const cols = [C.red, C.blue, C.green, C.yellow, C.orange, C.magenta];
    for (let r = 0; r < 4; r++) {
      const y = -27 + r * 9;
      for (let c = 0; c < 4; c++) {
        const x = -12.6 + c * 4.2;
        const nm = r === 2 && c === 1 ? "can" : null;
        t.part(nm, { plane: f, at: [x + 1.4, y + 3], clip: nm ? win : undefined, top: !!nm });
        t.flat(f, rr(x, y, x + 2.8, y + 6.2, 0.6), cols[(r * 4 + c) % 6]);
        t.flat(f, rect(x + 0.6, y + 2, x + 2.2, y + 3.6), C.white, { w: 0 });
        t.part(null);
      }
      t.flat(f, rect(-14, y + 6.2, 4, y + 7), C.silver, { w: t.k.TEX * 0.8 });
    }
    t.flat(f, sector(-5, -10, 13, 14.5, 230, 265), "#FFFFFF", { w: 0 });
    t.flat(f, rr(6, -28, 14, 9, 1), C.dark);
    t.flat(f, rect(7.2, -26.6, 12.8, -22.4), "ink");
    const price = (s2) => seg7(t, f, 7.6, -25.8, s2, C.ledR, 0.5);
    t.part("p0", { pivot: [10, -24.5, 0] }); price("150");
    t.extra(() => { t.part("p1", { pivot: [10, -24.5, 0] }); price("000"); });
    t.part(null);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
      t.part(r === 1 && c === 0 ? "btn" : null, { pivot: [8.6 + c * 3, -18 + r * 3.4, 0] });
      t.raise(f, rr(7.4 + c * 3, -19 + r * 3.4, 9.8 + c * 3, -17 + r * 3.4, 0.4), 0.6, C.silver);
      t.part(null);
    }
    t.flat(f, rr(8.4, -3, 11.6, 3, 0.6), C.silver, { w: t.k.TEX });
    t.flat(f, rect(9.6, -2, 10.4, 2), "ink", { w: 0 });
    t.flat(f, rr(-12, 14, 4, 25, 1), "ink");
    t.extra(() => {
      t.part("canOut", { pivot: [-4, 24, 0], top: true });
      t.flat(f, rr(-7, 19.6, 1, 22.6, 0.6), C.blue);
      t.part(null);
    });
  };

  const CAM = {
    handheld: { yaw: 22, pitch: 12 }, walkman: { yaw: 20, pitch: 22 },
    boombox: { yaw: 16, pitch: 14 }, crt: { yaw: 26, pitch: 14 },
    phone: { yaw: 18, pitch: 22 }, instant: { yaw: 22, pitch: 14 },
    computer: { yaw: 14, pitch: 36 }, reel: { yaw: 22, pitch: 10 },
    arcade: { yaw: 30, pitch: 14 }, turntable: { yaw: 14, pitch: 40 },
    typewriter: { yaw: 16, pitch: 30 }, projector: { yaw: 14, pitch: 12 },
    alarm: { yaw: 16, pitch: 8 }, radio: { yaw: 20, pitch: 10 }, vcr: { yaw: 18, pitch: 26 },
    jukebox: { yaw: 14, pitch: 8 }, camcorder: { yaw: -28, pitch: 14 }, synth: { yaw: 10, pitch: 50 },
    scope: { yaw: 20, pitch: 12 }, calc: { yaw: 10, pitch: 32 },
    lava: { yaw: 14, pitch: 8 }, fan: { yaw: 18, pitch: 8 }, pc: { yaw: 22, pitch: 16 },
    slides: { yaw: 20, pitch: 26 }, console: { yaw: 18, pitch: 30 },
    pinball: { yaw: 22, pitch: 30 }, toaster: { yaw: 24, pitch: 18 }, metronome: { yaw: 18, pitch: 8 },
    gramophone: { yaw: 20, pitch: 24 }, walkie: { yaw: 18, pitch: 8 }, pager: { yaw: 16, pitch: 26 },
    robot: { yaw: 22, pitch: 8 }, register: { yaw: 22, pitch: 20 }, amp: { yaw: 22, pitch: 10 },
    vending: { yaw: 22, pitch: 8 },
  };
  const NAMES = {
    handheld: "Handheld console", walkman: "Cassette player", boombox: "Boombox",
    crt: "CRT television", phone: "Rotary telephone", instant: "Instant camera",
    computer: "8-bit computer", reel: "Reel-to-reel deck", arcade: "Arcade cabinet",
    turntable: "Turntable", typewriter: "Typewriter", projector: "Film projector",
    alarm: "Alarm clock", radio: "Transistor radio", vcr: "VCR",
    jukebox: "Jukebox", camcorder: "Camcorder", synth: "Synthesizer", scope: "Oscilloscope",
    calc: "Printing calculator", lava: "Lava lamp", fan: "Desk fan", pc: "Beige PC",
    slides: "Slide projector", console: "Game console", pinball: "Pinball machine", toaster: "Toaster",
    metronome: "Metronome", gramophone: "Gramophone", walkie: "Walkie-talkie", pager: "Pager",
    robot: "Wind-up robot", register: "Cash register", amp: "Guitar amp", vending: "Vending machine",
  };

  /* the buildings' nib: more pressure, less wander */
  const NIB = Spec.FIRM;

  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("product", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
      const t = kit(k, CAM[key]);
      D[key](t);
      t.flush();
      const o = k.done();
      o.parts = t.parts;
      return o;
    });
  }
  out._keys = Object.keys(D);
  out._names = NAMES;
  /* the product/scene toolkit, shared with cafe.js */
  out._kit = { kit, rr, ell, circ, sector, rot, rect, hull, note, knob, seg7, add, sub, mul, C, NIB };
  return out;
})();
