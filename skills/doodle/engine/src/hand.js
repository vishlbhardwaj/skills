/*
 * THE HAND — what turns clean geometry into a drawn mark.
 *
 * Measured off four frames of the reference (nickbakeddesign, Oct 2026), not
 * guessed at:
 *
 *   paper   #FBFAF8   warm off-white, never pure white
 *   ink     #0A0A0A   near-black, never pure black
 *   accent  #0A84F8   ONE azure, flat fill, never outlined
 *   stroke  median 1.8% of canvas width, p25–p75 spanning 1.3%–2.9%
 *   air     the frame is 82–90% empty
 *
 * The important finding is that last number on the stroke: a drawn line is not
 * one width. It runs roughly ±40% around its median along its own length, and
 * that variation — not jitter — is what reads as a pen rather than a plot.
 *
 * A mark is built as a RIBBON (a filled polygon walking up one side of the
 * path and back down the other), never as a stroked path. A stroked path has
 * exactly one width by definition, so no amount of wobble on its centreline
 * will make it look drawn.
 *
 * Six things separate a drawn mark from a plotted one, and the reference uses
 * all six:
 *
 *   1 wander      low-frequency drift off the true path. LOW frequency —
 *                 high-frequency noise reads as fuzz or as a shaky hand,
 *                 which is a different and worse look.
 *   2 pressure    width varying along the length (the measurement above).
 *   3 overshoot   ends run past the corner. Nobody stops exactly on a vertex.
 *   4 double      the same path drawn twice with a different seed. This is the
 *                 single biggest tell in the reference — the door frame and the
 *                 globe meridians are all drawn twice, slightly apart.
 *   5 breaks      the mark skips. A dry marker lifts; the globe is full of
 *                 small white gaps mid-stroke.
 *   6 blobs       ink pools where the pen starts, stops and crosses.
 *
 * Everything is driven from one seeded RNG, so any drawing is reproducible and
 * a seed you like can be kept.
 */
window.Hand = (function () {

  /* ── seeded random ──────────────────────────────────────────────────── */
  function rng(seed) {
    let a = (seed | 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /*
   * Smooth 1-D noise. `n` control points over the whole run, cosine-eased —
   * so `n` IS the wobble frequency, and a low n is what gives drift rather
   * than tremor.
   */
  function wave(rand, n) {
    const v = [];
    for (let i = 0; i < n; i++) v.push(rand() * 2 - 1);
    return (t) => {
      const x = Math.max(0, Math.min(1, t)) * (n - 1);
      const i = Math.floor(x), f = x - i;
      const a = v[Math.min(n - 1, i)], b = v[Math.min(n - 1, i + 1)];
      return a + (b - a) * (f * f * (3 - 2 * f));
    };
  }

  /* ── path helpers ───────────────────────────────────────────────────── */
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

  /* Even spacing along the path. Without this the wander frequency would
     depend on how densely the author happened to place points. */
  function resample(pts, step) {
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = out.length ? pts[i - 1] : pts[i - 1];
      const b = pts[i];
      let d = dist(a, b);
      if (d < 1e-9) continue;
      const ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
      let t = step - carry;
      while (t <= d) { out.push([a[0] + ux * t, a[1] + uy * t]); t += step; }
      carry = d - (t - step);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* Catmull–Rom through the points, so an author can give few points and get
     a curve. Closed paths wrap. */
  function smooth(pts, closed, per) {
    if (pts.length < 3) return pts.slice();
    const P = (i) => pts[closed ? (i + pts.length) % pts.length
                               : Math.max(0, Math.min(pts.length - 1, i))];
    const out = [];
    const last = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                 (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                 (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                 (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                 (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[pts.length - 1]);
    return out;
  }

  const fmt = (n) => (Math.round(n * 10) / 10).toString();
  const poly = (p) => "M" + p.map((q) => fmt(q[0]) + " " + fmt(q[1])).join("L") + "Z";

  /*
   * ── one pass of one mark ────────────────────────────────────────────
   * Returns an array of ribbon polygons: more than one when the mark breaks.
   */
  /*
   * TRACING — the centreline a mark was ACTUALLY drawn along.
   *
   * The replay animation masked each ribbon with its raw control points, so
   * the reveal front travelled in a dead straight line while the ink it was
   * laying down wandered and curved. The nib was not following the pen.
   *
   * `mid` inside pass() is the real thing: resampled, smoothed, wandered,
   * boiled. Turn tracing on and every pass records it.
   */
  let trace = null;
  const beginTrace = () => { trace = []; };
  const endTrace = () => { const t = trace; trace = null; return t || []; };

  function pass(pts, P, rand) {
    const w = P.weight;
    const step = Math.max(1.2, w * 0.55);
    let path = resample(pts, step);
    if (path.length < 2) return [];

    const n = path.length;
    /* overshoot: extend both ends along their own direction */
    if (P.overshoot > 0 && !P.closed) {
      const ex = (a, b, k) => [b[0] + (b[0] - a[0]) * k, b[1] + (b[1] - a[1]) * k];
      const o = (P.overshoot * w) / step;
      path = [ex(path[1], path[0], o), ...path, ex(path[n - 2], path[n - 1], o)];
    }

    const m = path.length;
    const drift = wave(rand, Math.max(2, Math.round(P.wobble)));
    /* BOIL is not WANDER. Wander is low-frequency drift — a hand not quite
       following a line. Boil is a fast, tiny tremble along an otherwise
       straight run, and it is what makes the long frame lines in the pen
       references ripple without ever leaving their path. One is the arm, the
       other is the fingers; a pen has the second and almost none of the first. */
    const boil = wave(rand, Math.max(4, Math.round(m / 2.2)));
    const press = wave(rand, Math.max(2, Math.round(P.pressureFreq)));
    const phase = rand();

    /* the centreline, wandered; and the half-width at each sample */
    const mid = [], half = [];
    for (let i = 0; i < m; i++) {
      const t = i / (m - 1);
      const a = path[Math.max(0, i - 1)], b = path[Math.min(m - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d;
      const off = drift(t + phase) * P.wander * w + boil(t) * (P.boil || 0) * w;
      mid.push([path[i][0] + nx * off, path[i][1] + ny * off]);

      /* taper the very ends so a mark enters and leaves the paper rather than
         starting at full width like a rectangle */
      const edge = Math.min(1, Math.min(t, 1 - t) / 0.06);
      /* CLEAN: one even width end to end — the caps are round, not tapered */
      const taper = P.closed || P.clean ? 1 : 0.35 + 0.65 * edge;
      /*
       * STRUCTURAL taper, separate from pressure.
       *
       * Pressure varies a mark's width at random — that is the hand. This
       * varies it on purpose, from one end to the other, because a chair leg
       * is thick where it meets the seat and thin where it meets the floor,
       * and a spindle swells low and narrows into the bow. Drawn at one width
       * end to end, every stick reads as doweling and the whole chair reads
       * as a diagram.
       */
      const grain = P.taper ? (P.taper[0] + (P.taper[1] - P.taper[0]) * t) : 1;
      half.push((w / 2) * (1 + press(t + phase) * P.pressure) * taper * grain);
    }

    if (trace) trace.push(mid);

    /* breaks: a dry pen skips. Cut the run into spans and drop short ones. */
    const spans = [];
    if (P.breaks > 0) {
      const gap = wave(rand, Math.max(3, Math.round(m / 8)));
      let cur = [];
      for (let i = 0; i < m; i++) {
        const lift = (gap(i / (m - 1)) + 1) / 2 < P.breaks * 0.5;
        if (lift && cur.length > 2) { spans.push(cur); cur = []; }
        else if (!lift) cur.push(i);
      }
      if (cur.length > 2) spans.push(cur);
    }
    if (!spans.length) spans.push(Array.from({ length: m }, (_, i) => i));

    const out = [];
    for (const span of spans) {
      const L = [], R = [];
      for (const i of span) {
        const a = mid[Math.max(0, i - 1)], b = mid[Math.min(m - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const d = Math.hypot(dx, dy) || 1;
        const nx = -dy / d, ny = dx / d;
        L.push([mid[i][0] + nx * half[i], mid[i][1] + ny * half[i]]);
        R.push([mid[i][0] - nx * half[i], mid[i][1] - ny * half[i]]);
      }
      if (L.length > 1) out.push(poly(L.concat(R.reverse())));
      /* round caps: a crafted line ends in a semicircle, not a cut */
      if (P.clean && !P.flatCaps && !P.closed && span.length > 1) {
        for (const i of [span[0], span[span.length - 1]]) {
          const r = half[i], c = mid[i], cap = [];
          for (let k = 0; k < 14; k++) cap.push([c[0] + Math.cos(k / 14 * 2 * Math.PI) * r, c[1] + Math.sin(k / 14 * 2 * Math.PI) * r]);
          out.push(poly(cap));
        }
      }
    }
    return out;
  }

  /* A true circle, in two arcs. A halftone dot is a PRINT artefact — a screen
     — not a hand mark, so it must be mechanical. Drawn with the ink-blob
     function below, the dots came out lumpy and wildly uneven and the tone
     read as polka dots rather than as grey. */
  const circle = (x, y, r) =>
    `M${fmt(x - r)} ${fmt(y)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(x + r)} ${fmt(y)}` +
    `A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(x - r)} ${fmt(y)}Z`;

  /* An ink blob: a circle with a noisy radius, for where a pen rests. */
  function blob(x, y, r, rand) {
    const n = 11, w = wave(rand, 5), p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.72 + 0.5 * ((w(i / n) + 1) / 2));
      p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    return poly(p);
  }

  /*
   * ── the public mark ─────────────────────────────────────────────────
   * `mark(pts, P)` returns SVG path data for one drawn line. Double-pass is
   * the single biggest tell in the reference, so it is on by default.
   */
  function mark(pts, P) {
    const rand = rng(P.seed);
    const src = P.curve ? smooth(pts, P.closed, 10) : pts;
    const path = P.closed ? src.concat([src[0]]) : src;

    let d = [];
    const passes = P.double ? 2 : 1;
    for (let k = 0; k < passes; k++) {
      const jitter = k === 0 ? 0 : P.doubleOffset * P.weight;
      const moved = path.map((q, i) => {
        if (!jitter) return q;
        const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], dd = Math.hypot(dx, dy) || 1;
        return [q[0] + (-dy / dd) * jitter, q[1] + (dx / dd) * jitter];
      });
      d = d.concat(pass(moved, { ...P, seed: P.seed + k * 977 }, rng(P.seed + k * 977)));
    }

    if (P.blobs > 0 && !P.closed) {
      const r = P.weight * P.blobs;
      d.push(blob(path[0][0], path[0][1], r, rand));
      d.push(blob(path[path.length - 1][0], path[path.length - 1][1], r, rand));
    }
    return d.join(" ");
  }

  /*
   * A flat accent region. In the reference these sit UNDER the line work and
   * are never outlined — and they are slightly out of register with it, the
   * way a second colour plate is. `offset` is that misregistration.
   */
  function region(pts, P) {
    /*
     * Default the misregistration params.
     *
     * A surface that does not declare them produced NaN for every point, an
     * invalid path, and a drawing with no fills at all — silently, because an
     * unparseable `d` throws nothing. A missing knob should mean "none", not
     * "destroy the output".
     */
    P = { regionRag: 0.4, offsetX: 0, offsetY: 0, ...P };
    const rand = rng(P.seed + 4211);
    const src = P.curve ? smooth(pts, true, 10) : pts;
    const w = wave(rand, 7);
    const ragged = src.map((q, i) => {
      const t = i / src.length;
      const e = w(t) * P.weight * P.regionRag;
      return [q[0] + e + P.offsetX, q[1] + e * 0.6 + P.offsetY];
    });
    return poly(ragged);
  }

  /* Stray specks. The reference has them scattered near the drawing, not
     evenly over the frame — they are spatter off the pen, not texture. */
  function specks(box, count, P) {
    const rand = rng(P.seed + 99);
    const out = [];
    for (let i = 0; i < count; i++) {
      const x = box.x + rand() * box.w, y = box.y + rand() * box.h;
      out.push(blob(x, y, P.weight * (0.06 + rand() * 0.16), rand));
    }
    return out.join(" ");
  }

  /* ── tone ────────────────────────────────────────────────────────────
   *
   * The marker style carries tone as flat colour. The pen references carry it
   * as TEXTURE — and that, not the line, is most of what they are:
   *
   *   hatch     parallel ruling. Roofs, cast shadow, awnings.
   *   cross     two rulings crossing. Deeper than hatch without going solid.
   *   ribs      ONE family of lines that BOWS WITH THE SILHOUETTE.
   *   grid      ribs plus straight spans: the hand-drawn plaid.
   *   halftone  a regular dot grid. Brick walls, mid greys.
   *   stipple   scattered dots. Soft or granular tone.
   *   scribble  continuous loops. Foliage — the one organic texture among
   *             otherwise architectural marks.
   *   solid     pure black. Window panes, deep shadow.
   *
   * Every one needs the region clipped properly, so a span of ruling stops at
   * the shape's edge rather than at its bounding box.
   *
   * `ribs` and `grid` are the two that do something `hatch` cannot, and the
   * difference is the whole reason they exist.
   *
   * A straight ruling clipped to a shape is a FLAT grey. It tells you the
   * area a shape covers and nothing about its form — put it on a kettle and
   * the kettle goes flat. Every pen reference that draws a round object out
   * of pattern does the opposite: the pattern WRAPS. The lines down a jug
   * bow outwards over its belly and close in at its neck, and that bowing is
   * the only thing saying the jug is round.
   *
   * So the vertical family is not ruled in page space. Each scanline across
   * the shape is measured, and a column is placed at the same FRACTION of
   * every span — 0.2 of the way across the belly is further out in page
   * units than 0.2 of the way across the neck, so the line bows on its own,
   * from the silhouette, with nothing for the caller to supply. One cheap
   * parameterisation buys the entire effect.
   */
  function bounds(p) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const q of p) {
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }

  const inside = (p, x, y) => {
    let hit = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i], [xj, yj] = p[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };

  /* Where a ruled line crosses the outline. Sorted crossings pair up into the
     spans that are actually inside — which is what stops ruling from running
     out past the shape. */
  function spansAt(p, ax, ay, bx, by) {
    const ts = [];
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [x1, y1] = p[j], [x2, y2] = p[i];
      const d = (bx - ax) * (y2 - y1) - (by - ay) * (x2 - x1);
      if (Math.abs(d) < 1e-9) continue;
      const t = ((x1 - ax) * (y2 - y1) - (y1 - ay) * (x2 - x1)) / d;
      const u = ((x1 - ax) * (by - ay) - (y1 - ay) * (bx - ax)) / d;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) ts.push(t);
    }
    ts.sort((m, n) => m - n);
    const out = [];
    for (let i = 0; i + 1 < ts.length; i += 2) out.push([ts[i], ts[i + 1]]);
    return out;
  }

  /*
   * Walk a closed outline and displace it along its own normal, slowly.
   * Used for hand-blocked solids; see `tone(..., "solid")`.
   */
  function ragged(pts, P) {
    const step = Math.max(1.2, P.weight * 0.7);
    const src = resample(pts.concat([pts[0]]), step);
    const n = src.length;
    if (n < 4) return pts;
    const r = rng(P.seed + 991);
    const slow = wave(r, 4);
    const fast = wave(r, Math.max(5, Math.round(n / 5)));
    const amp = P.weight * (P.solidRag === undefined ? 0.55 : P.solidRag);
    /*
     * Zero-mean the offsets. Four cycles of a wave around a closed loop do
     * not average out, so the whole fill drifts to one side — a pane that is
     * ragged AND visibly off its own frame. Fraying is wanted; shifting is
     * not.
     */
    const offs = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      offs.push((slow(t) * 0.75 + fast(t) * 0.25) * amp);
    }
    const mean = offs.reduce((a, b) => a + b, 0) / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = src[(i - 1 + n) % n], b = src[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const off = offs[i] - mean;
      out.push([src[i][0] + (dy / d) * off, src[i][1] - (dx / d) * off]);
    }
    return out;
  }

  function tone(pts, P, kind) {
    const src = P.curve ? smooth(pts, true, 10) : pts;
    const b = bounds(src);
    const rand = rng(P.seed + 7331);
    const d = [];

    /*
     * A SOLID IS BLOCKED IN BY HAND, so its edge is not the shape's edge.
     *
     * `poly(src)` returns the geometry exactly — four crisp corners, a printed
     * rectangle sitting in the middle of a drawing where every other line
     * wobbles. The fill has to be made by the same hand as the outline.
     *
     * The edge is pushed along its own normal by a LOW-frequency wave (the
     * arm, not the fingers — per-point noise gives a sawtooth, which is the
     * mistake already in the log twice), with the corners allowed to run over
     * or fall short. Amplitude scales with the pen, so a small pane frays by
     * less than a big mass.
     */
    if (kind === "solid") {
      const rag = P.solidRag === 0 ? src : ragged(src, P);
      return poly(rag);
    }

    if (kind === "hatch") {
      const a = ((P.hatchAngle || 45) * Math.PI) / 180;
      const dx = Math.cos(a), dy = Math.sin(a);
      const gap = Math.max(1.5, P.hatchGap || P.weight * 3);
      const diag = Math.hypot(b.w, b.h);
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      for (let k = -diag / gap; k <= diag / gap; k++) {
        const ox = cx - dy * k * gap, oy = cy + dx * k * gap;
        const ax = ox - dx * diag, ay = oy - dy * diag;
        const bx2 = ox + dx * diag, by2 = oy + dy * diag;
        for (const [t0, t1] of spansAt(src, ax, ay, bx2, by2)) {
          const p0 = [ax + (bx2 - ax) * t0, ay + (by2 - ay) * t0];
          const p1 = [ax + (bx2 - ax) * t1, ay + (by2 - ay) * t1];
          if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 1) continue;
          d.push(mark([p0, p1], { ...P, closed: false, curve: false, double: false,
                                  blobs: 0, overshoot: 0, seed: P.seed + k * 31 }));
        }
      }
      return d.join(" ");
    }

    if (kind === "cross") {
      const g = Math.max(1.5, P.hatchGap || P.weight * 3);
      const a1 = P.hatchAngle == null ? 45 : P.hatchAngle;
      const a2 = P.hatchAngle2 == null ? a1 + 68 : P.hatchAngle2;
      return [tone(pts, { ...P, hatchAngle: a1, hatchGap: g }, "hatch"),
              tone(pts, { ...P, hatchAngle: a2, hatchGap: g,
                          seed: P.seed + 977 }, "hatch")].join(" ");
    }

    if (kind === "ribs" || kind === "grid") {
      const gap = Math.max(1.6, P.hatchGap || P.weight * 3);
      /*
       * Sample the shape densely in y and keep the WIDEST span on each line.
       * Widest, not every span: on a shape with a notch the extra spans are
       * a different part of the form and threading one column through all of
       * them zig-zags the line across the gap.
       */
      const step = Math.max(0.6, gap * 0.34);
      const rows = [];
      for (let y = b.y0 + step * 0.5; y < b.y1; y += step) {
        let best = null;
        for (const [t0, t1] of spansAt(src, b.x0 - 1, y, b.x1 + 1, y)) {
          if (!best || t1 - t0 > best[1] - best[0]) best = [t0, t1];
        }
        if (!best) continue;
        const W = b.x1 - b.x0 + 2;
        const x0 = b.x0 - 1 + best[0] * W, x1 = b.x0 - 1 + best[1] * W;
        if (x1 - x0 < gap * 0.5) continue;
        rows.push([y, x0, x1]);
      }
      if (rows.length < 2) return "";
      let wide = 0;
      for (const r of rows) wide = Math.max(wide, r[2] - r[1]);
      const n = Math.max(1, Math.round(wide / gap));
      /* the columns, each at a fixed fraction of its own span */
      for (let j = 1; j < n; j++) {
        const u = j / n, col = [];
        for (const [y, x0, x1] of rows) col.push([x0 + u * (x1 - x0), y]);
        if (col.length < 2) continue;
        d.push(mark(col, { ...P, closed: false, curve: true, double: false,
                           blobs: 0, overshoot: 0, seed: P.seed + j * 53 }));
      }
      if (kind === "grid") {
        /* and the straight spans across, at the same pitch, inset so the
           plaid does not re-draw the silhouette it sits inside */
        const every = Math.max(1, Math.round(gap / step));
        for (let i = every; i < rows.length - 1; i += every) {
          const [y, x0, x1] = rows[i], in0 = (x1 - x0) * 0.012;
          d.push(mark([[x0 + in0, y], [x1 - in0, y]],
                      { ...P, closed: false, curve: false, double: false,
                        blobs: 0, overshoot: 0, seed: P.seed + i * 17 }));
        }
      }
      return d.join(" ");
    }

    if (kind === "halftone" || kind === "stipple") {
      const gap = Math.max(1.6, P.toneGap || P.weight * 3.4);
      const r = Math.max(0.25, (P.toneDot || 0.26) * gap);
      for (let y = b.y0; y <= b.y1; y += gap)
        for (let x = b.x0; x <= b.x1; x += gap) {
          const jx = kind === "stipple" ? (rand() - 0.5) * gap * 1.5 : 0;
          const jy = kind === "stipple" ? (rand() - 0.5) * gap * 1.5 : 0;
          if (!inside(src, x + jx, y + jy)) continue;
          /* regular for a screen; only stipple varies, and only a little */
          d.push(circle(x + jx, y + jy, kind === "stipple" ? r * (0.65 + rand() * 0.6) : r));
        }
      return d.join(" ");
    }

    if (kind === "scribble") {
      /*
       * Real LOOPS, sampled round a circle at each step. Two points per step —
       * an offset and the centre — made an angular zigzag that read as
       * scratchy wire, not foliage: a loop needs to come back on itself, and
       * that takes a whole turn, not a detour.
       */
      const gap = Math.max(3, P.scribbleGap || P.weight * 4);
      const path = [];
      let up = true, k = 0;
      for (let x = b.x0; x <= b.x1 + gap; x += gap * 0.62) {
        const col = [];
        for (let y = b.y0; y <= b.y1 + gap; y += gap * 0.62) col.push(y);
        if (!up) col.reverse();
        up = !up;
        for (const y of col) {
          if (!inside(src, x, y)) continue;
          const rr = gap * (0.42 + ((k * 37) % 23) / 60);
          const turn = 7, lead = (k % 2 ? 1 : -1);
          for (let i = 0; i <= turn; i++) {
            const a = (i / turn) * Math.PI * 2 * lead + k;
            path.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.78]);
          }
          k++;
        }
      }
      if (path.length < 2) return "";
      return mark(path, { ...P, closed: false, curve: true, double: false,
                          blobs: 0, overshoot: 0, breaks: 0 });
    }
    return "";
  }

  return { mark, region, specks, tone, rng, smooth, beginTrace, endTrace, PAPER: "#FBFAF8", INK: "#0A0A0A", ACCENT: "#0A84F8" };
})();
