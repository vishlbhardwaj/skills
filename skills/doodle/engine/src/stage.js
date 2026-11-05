/*
 * THE STAGE — subject rendering and live drawing, shared by every page.
 *
 * This used to live inside canvas.html. A second page wanting the same
 * behaviour would have meant a second copy of ~250 lines, and every fix after
 * that made twice. Both canvas.html and buildings.html now draw through here.
 *
 * `build(S, P, TILE)` renders one subject into its own <g>, recording the
 * centreline of every path so `Live` can replay it.
 */
window.Stage = (function () {
const NS = "http://www.w3.org/2000/svg";
const art = document.getElementById("art");
const world = document.getElementById("world");
let V = null;

const flat = (o) => {
  const P = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (Array.isArray(v)) P[k] = v[0];
    else if (v && typeof v === "object" && v.type === "select") P[k] = v.default;
    else if (v && typeof v === "object") Object.assign(P, flat(v));
    else P[k] = v;
  }
  return P;
};

function shade(hex, amt) {
  if (amt == null || amt === 1) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * amt)));
  return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)]
    .map((v) => v.toString(16).padStart(2, "0")).join("");
}

/*
 * LINE MODES — the clean-illustration register (see the clean-illustration
 * skill). A mark that outlines a filled shape carries that fill as `tone`.
 *   ink    (default) every line in the page ink
 *   tonal  an outline is a darker shade of its own fill; detail lines stay ink
 *   none   outlines of filled shapes are dropped — pure flat vector; only
 *          detail lines remain
 * Returns null when the mark should not be drawn.
 */

/*
 * PALETTE LOOKUP, which used to fail SILENTLY.
 *
 * `Q[key] || key` falls through to the raw string when a page has not
 * declared a colour the module names, and the browser renders an unreadable
 * string as BLACK. So a missing palette entry was not an error — it was a
 * subject quietly turning into a slab, which is exactly how the board's
 * armchair shipped. Ten objects would have come out ten slabs.
 *
 * A key that looks like one of ours (`cSomething`) and is not in the palette
 * is a BUG, not a colour. Say so on the console — bin/check.js reads the
 * console, so from here on a missing swatch fails the page — and fall back
 * to a flat grey, which is visible as wrong rather than invisible as black.
 */
const MISSING = "#C9C4BC";
const missing = new Set();
function swatch(Q, key, fallback) {
  if (key == null) return fallback;
  if (Q[key] !== undefined) return Q[key];
  if (/^c[A-Z]/.test(key)) {
    /*
     * RECORDED, not just logged.
     *
     * The first version of this called console.error and relied on
     * bin/check.js to pick it up. It never fired: check.js is injected at the
     * END of the page, so it replaces console.error AFTER every subject has
     * already been drawn. A check that can only see things which happen
     * later is not a check — it reported a clean sheet on a page with a
     * colour deliberately deleted. The set is read, not the console.
     */
    if (!missing.has(key)) {
      missing.add(key);
      console.error("palette: no colour '" + key + "' on this page");
    }
    return MISSING;
  }
  return key;                       /* a literal "#RRGGBB" or "ink" is fine */
}

function markColor(m, Q) {
  const mode = Q.lineMode || "ink";
  if (mode === "ink" || !m.tone) return Q.ink;
  if (mode === "none") return null;
  const base = m.tone === "ink" ? Q.ink : (Q[m.tone] || m.tone);
  if (!/^#[0-9a-f]{6}$/i.test(base)) return Q.ink;
  return shade(base, Q.toneDepth || 0.58);
}

/*
 * Clean register: outline vs detail weight are separate dials. A mark at the
 * subject's outline weight (OUT, w ≥ 0.9) takes `outlineMul`; everything
 * finer takes `detailMul` — so the silhouette can be fattened without
 * clogging the detail, or the detail lifted without blobbing the outline.
 */
function markWeight(m, Q) {
  const w = m.w || 1;
  if (!Q.clean) return w;
  return w * (w >= 0.9 ? (Q.outlineMul || 1) : (Q.detailMul || 1));
}


/*
 * ── THE UNDERDRAWING ────────────────────────────────────────────────
 *
 * An illustrator does not start with the finished line. They rough the shape
 * out first with loose, light, searching strokes, then commit in ink over
 * the top, and the pencil is erased at the end.
 *
 * This was tried once before and REJECTED, for two reasons that are both
 * designed against here (LEARNINGS, "scribbly MOVEMENT, not scribbly lines"):
 *
 *   1. Jitter was applied per-point to an already dense centreline — ~45
 *      points over a short run — which is HIGH-frequency noise and reads as
 *      spikes and stars, not a loose arc. `loosen` instead throws away the
 *      dense path, resamples it down to a HANDFUL of points far apart, and
 *      moves those by a LOW-frequency wave (under ~1.5 cycles over the whole
 *      stroke). Looseness is a long wavelength; that is the whole point.
 *
 *   2. The ghosts ACCUMULATED and stayed, wrapping the subject in a grey
 *      halo unrelated to any line in it. Here the ghost is structural marks
 *      only, and it LEAVES — it fades out as the ink finishes, the way a
 *      pencil is erased.
 */
function loosen(pts, amp, seed) {
  if (pts.length < 2) return pts;

  /* cumulative arc length, so samples are evenly spaced along the path and
     not bunched where the author happened to put control points */
  const acc = [0];
  for (let i = 1; i < pts.length; i++)
    acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = acc[acc.length - 1];
  if (L < 1e-3) return pts;

  const at = (d) => {
    let i = 1;
    while (i < acc.length - 1 && acc[i] < d) i++;
    const t = (d - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
            pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };

  /*
   * The deviation has to be a fraction of the stroke's OWN length, not one
   * figure for the whole subject: a 12px sill given the facade's amplitude
   * is not loose, it is a knot. The first render had exactly that — little
   * scribble tangles wherever a short mark lived.
   */
  const amp2 = Math.min(amp, L * 0.13);

  /* few points, far apart: three for a short run, never more than seven */
  const n = Math.max(3, Math.min(7, Math.round(L / 46) + 2));
  const TAU = Math.PI * 2;
  const p1 = seed * 1.7, p2 = seed * 2.9 + 1.1;
  const k1 = 0.55 + (seed % 3) * 0.22;        // under 1.5 cycles over the WHOLE
  const k2 = 1.05 + (seed % 2) * 0.3;         // stroke — a long wavelength

  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const d = u * L;
    const P = at(d);
    const A = at(Math.max(0, d - 2)), B = at(Math.min(L, d + 2));
    const tx = B[0] - A[0], ty = B[1] - A[1], m = Math.hypot(tx, ty) || 1;
    const nx = -ty / m, ny = tx / m;
    /* the ends drift less than the middle: a hand is surest where it lands */
    const hold = 0.35 + 0.65 * Math.sin(Math.PI * u);
    const w = amp2 * hold *
      (0.62 * Math.sin(p1 + TAU * k1 * u) + 0.38 * Math.sin(p2 + TAU * k2 * u));
    /* and a gesture runs past its own end rather than stopping on it */
    const over = (i === 0 ? -1 : i === n - 1 ? 1 : 0) * amp2 * 0.9;
    out.push([P[0] + nx * w + (tx / m) * over, P[1] + ny * w + (ty / m) * over]);
  }
  return out;
}

/* loose, light, fast — a pencil, not the pen */
const GHOST_NIB = { pressure: 0.06, wander: 0.09, wobble: 3, pressureFreq: 4,
                    boil: 0.04, overshoot: 0.5, double: false, breaks: 0.05,
                    blobs: 0, specks: 0, solidRag: 0 };

/* ── draw one subject into its own tile ─────────────────────────────── */
function build(S, P, TILE) {
  const mod = S.mod;
  let Q = P;
  if (mod.nib) Q = { ...P, ...mod.nib };
  /* P.__hand: a viewer's live experiment (VDL's Randomise tab), applied OVER the
     class nib on purpose. Never set by a page or a module — the class still owns
     the hand, and Spec.audit reads mod.nib, not this. */
  if (P.__hand) Q = { ...Q, ...P.__hand };
  const obj = mod.build(Q);

  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  /*
   * A clipped subject declares its own FRAME and is fitted to that.
   *
   * Clipping crops the drawing, but the fit still measured the bounding box —
   * so widening a landscape's ground to run off the edge made the whole scene
   * shrink to a sliver to keep the ground's far corners in view. Geometry
   * larger than the frame is the entire point; the frame has to be stated,
   * not inferred.
   */
  if (obj.frame) {
    [bx0, by0, bx1, by1] = obj.frame;
  } else {
    for (const m of obj.marks.concat(obj.regions, obj.tones || []))
      for (const p of m.pts) {
        if (p[0] < bx0) bx0 = p[0]; if (p[0] > bx1) bx1 = p[0];
        if (p[1] < by0) by0 = p[1]; if (p[1] > by1) by1 = p[1];
      }
  }
  const bw = bx1 - bx0, bh = by1 - by0;
  const pen = Q.weight * (mod.pen || 1);
  const fit = mod.fit || { w: 0.86, h: 0.8 };
  const box = { w: TILE.w * fit.w, h: TILE.h * fit.h };
  const s = Math.min((box.w - pen * 1.6) / bw, (box.h - pen * 1.6) / bh);
  const ox = (TILE.w - bw * s) / 2 - bx0 * s;
  const oy = (TILE.h - bh * s) / 2 - by0 * s;
  const to = (p) => [ox + p[0] * s, oy + p[1] * s];

  const g = document.createElementNS(NS, "g");
  g.setAttribute("transform",
    `translate(${S.col * (TILE.w + TILE.gap)} ${S.row * (TILE.h + TILE.gap)})`);

  /*
   * `clip` crops a subject to its own tile.
   *
   * A landscape's ground has to run off the edge of the picture. Fitted by
   * bounding box it cannot: widen the plane and the whole scene shrinks to
   * keep its corners in view, so the ground ends in two converging edges and
   * the landscape sits on a plinth like a diorama. Clipping lets the geometry
   * be larger than the frame, which is what a frame is for.
   */
  if (mod.clip) {
    const id = "clip-" + S.key;
    const cp = document.createElementNS(NS, "clipPath");
    cp.setAttribute("id", id);
    const r = document.createElementNS(NS, "rect");
    /* clip to the STATED FRAME when there is one, not to the fit box: the two
       differ in aspect, and a layer wider than the frame spilled into the
       slack (scapes: a far hill ran past the sky on both sides) */
    if (obj.frame) {
      const [fx, fy] = to([bx0, by0]);
      r.setAttribute("x", fx); r.setAttribute("y", fy);
      r.setAttribute("width", bw * s); r.setAttribute("height", bh * s);
    } else {
      const m = TILE.w * (1 - fit.w) / 2;
      r.setAttribute("x", m); r.setAttribute("y", TILE.h * (1 - fit.h) / 2);
      r.setAttribute("width", TILE.w - m * 2);
      r.setAttribute("height", TILE.h * fit.h);
    }
    cp.appendChild(r); g.appendChild(cp);
    g.setAttribute("clip-path", `url(#${id})`);
  }
  /*
   * Every path records the CENTRELINE it was drawn from.
   *
   * A mark is a ribbon — a filled polygon up one side and back down the
   * other — so it has no stroke to animate with a dash offset. But the
   * centreline is known at the moment it is built, and a thick round-capped
   * stroke along that centreline, grown with a dash offset, is a mask that
   * reveals the ribbon in the direction the pen actually travelled.
   */
  const strokes = [];
  const add = (d, fill, line, isFill, wt) => {
    if (!d) return;
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", d); el.setAttribute("fill", fill);
    /* clean register: exact fills meet edge to edge, and anti-aliasing leaves
       a hairline seam between them — a stroke in the fill's own colour closes it */
    if (isFill && Q.clean && (Q.seam == null || Q.seam > 0)) { el.setAttribute("stroke", fill); el.setAttribute("stroke-width", Q.seam == null ? 0.8 : Q.seam); el.setAttribute("stroke-linejoin", "round"); }
    if (line) strokes.push({ el, line, isFill: !!isFill, w: wt || 8 });
    g.appendChild(el);
  };

  /* Colour off = skip the fills. The line work already carries the drawing;
     every region in these subjects has an outline over it. */
  if (!Q.outline)
    for (const r of obj.regions) {
      if (r.fill === "cWash" && !Q.showShadow) continue;
      add(Hand.region(r.pts.map(to), { ...Q, curve: !!r.curve, weight: pen,
        seed: Q.seed + (r.s || 0) }),
        shade(swatch(Q, r.fill, Q.cWood), r.shade),
        r.pts.map(to), true, pen);
    }

  for (const t of (obj.tones || []))
    add(Hand.tone(t.pts.map(to), { ...Q, weight: pen * (t.w || 0.6),
      curve: t.curve === true, seed: Q.seed + (t.s || 0),
      hatchAngle: t.angle != null ? t.angle : Q.hatchAngle,
      hatchAngle2: t.angle2,
      hatchGap: (t.gap || 1) * Q.hatchGap, toneGap: (t.gap || 1) * Q.toneGap,
    }, t.kind), swatch(Q, t.fill, Q.ink),
      t.pts.map(to), true, pen);

  for (const m of obj.marks) {
    /*
     * Capture the centreline the hand ACTUALLY drew along — resampled,
     * smoothed, wandered — not the control points. Masking the replay with
     * the control points sent the reveal front down a dead straight line
     * while the ink it was laying wandered up to four units off it.
     */
    Hand.beginTrace();
    const d = Hand.mark(m.pts.map(to), { ...Q, closed: !!m.closed, taper: m.taper,
      curve: m.curve !== false, weight: pen * markWeight(m, Q) });
    const traced = Hand.endTrace();
    const mc = markColor(m, Q);
    if (mc) add(d, mc, traced[0] || m.pts.map(to), false, pen * markWeight(m, Q));
  }

  /*
   * The ghost layer: the structural marks only, roughed out.
   *
   * Only `w >= 0.9` — the same threshold `markWeight` uses for an outline.
   * An underdrawing finds the SHAPE; it does not trace every vein and
   * glazing bar, and trying to is what turns it into a halo. Two searching
   * passes, the second lighter, because one clean loose line reads as a
   * decision rather than a search.
   *
   * OPT-IN (`Q.ghost`). Building it unconditionally added 2,416 paths to the
   * canvas and took a redraw from 372ms to 661ms — a 78% tax on every page
   * for a layer that is hidden most of the time. A page that wants the
   * sketch-in asks for it and pays; nobody else does.
   */
  const ghostEl = document.createElementNS(NS, "g");
  ghostEl.setAttribute("class", "live-ghost");
  ghostEl.style.display = "none";
  const ghostStrokes = [];
  const amp = Math.max(1.6, Math.min(14, Math.hypot(bw, bh) * s * 0.014));
  const GQ = { ...Q, ...GHOST_NIB, weight: pen * 0.42 };
  let gi = 0;
  for (const m of (Q.ghost ? obj.marks : [])) {
    if ((m.w || 1) < 0.9) continue;
    const src = m.pts.map(to);
    for (let pass = 0; pass < 2; pass++) {
      gi++;
      const pts = loosen(src, amp * (pass ? 1.35 : 1), gi * 3 + pass * 11);
      if (pts.length < 2) continue;
      Hand.beginTrace();
      const d = Hand.mark(pts, { ...GQ, closed: false, curve: true,
        weight: GQ.weight * (pass ? 0.8 : 1), seed: Q.seed + gi * 7 + pass });
      const traced = Hand.endTrace();
      if (!d) continue;
      const el = document.createElementNS(NS, "path");
      el.setAttribute("d", d);
      el.setAttribute("fill", Q.ghostInk || "#A6BCD2");
      el.setAttribute("opacity", pass ? 0.42 : 0.66);
      ghostEl.appendChild(el);
      ghostStrokes.push({ el, line: traced[0] || pts, w: GQ.weight });
    }
  }
  g.insertBefore(ghostEl, g.firstChild);

  g.__strokes = strokes;
  g.__ghost = { el: ghostEl, strokes: ghostStrokes };
  g.__key = S.key;
  return g;
}

/*
 * ── LIVE DRAWING ────────────────────────────────────────────────────
 *
 * Replay a subject the way it was authored: stroke by stroke, in order, with
 * a nib running along each one. This is not a gimmick — The authoring order
 * IS the drawing order (walls, then openings, then the small things), so
 * watching it replay is the most direct way to see whether a subject was
 * built in a sensible sequence or assembled at random.
 *
 * Three mechanics:
 *
 *   a mark is revealed by a MASK — a thick round-capped stroke along its own
 *   centreline, grown with stroke-dashoffset. A ribbon has no stroke of its
 *   own to animate, but it always has a centreline.
 *
 *   a fill (a black window pane) is WIPED downward with a growing rect. A pen
 *   does not outline a fill, it blocks it in, and a wipe reads as that.
 *
 *   the nib is sampled off the same centreline with getPointAtLength, so it
 *   sits exactly where the ink is appearing.
 */
const Live = (() => {
  /*
   * CONCURRENT RUNS.
   *
   * A single module-level token meant starting a second replay cancelled the
   * first — fine for one canvas, useless for a page that draws four buildings
   * at once. Each run now carries its own liveness flag, and `play` only
   * stops the others when asked to (`solo`, the default).
   */
  const runs = new Set();
  let uid = 0;
  const stopAll = () => { runs.forEach((r) => { r.alive = false; }); runs.clear(); };

  const pathD = (pts) => "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function stop() { stopAll(); }

  function reset(g) {
    (g.__strokes || []).forEach((s) => {
      s.el.style.visibility = "";
      s.el.removeAttribute("mask");
    });
    const gh = g.__ghost;
    if (gh) {
      gh.el.style.display = "none";
      gh.el.style.opacity = "";
      gh.strokes.forEach((s) => { s.el.style.visibility = ""; s.el.removeAttribute("mask"); });
    }
    ["live-defs", "live-nib"].forEach((c) =>
      g.querySelectorAll("." + c).forEach((n) => n.remove()));
  }

  /* a hand does not travel at constant speed: it accelerates out of the
     start and slows into the finish */
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

  /*
   * SCRIBBLY MOVEMENT, not scribbly lines.
   *
   * A pen does not advance smoothly: it surges and hesitates along its own
   * path. `warp` is u plus a sine, which is the integral of (1 + A·cos) — so
   * for A < 1 it is strictly MONOTONIC while its rate swings either side of
   * average. Monotonic matters: let the progress dip and the ink retreats,
   * which reads as erasing rather than hesitating.
   */
  const warp = (u, k, amp) =>
    Math.max(0, Math.min(1, u + (amp * Math.sin(2 * Math.PI * k * u)) / (2 * Math.PI * k)));
  /* a deterministic wobble per stroke, so no two take the same time */
  const vary = (i) => 0.78 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.44;

  function anim(ms, step, me) {
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (t) => {
        if (!me.alive) return res();
        const u = Math.min(1, (t - t0) / ms);
        step(u);
        if (u < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
  }

  const bbox = (pts) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach((p) => {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    });
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  };

  /*
   * NO CONSTRUCTION LINES.
   *
   * A first version drew two loose "searching" passes under every structural
   * stroke and kept them until the end. Two faults: jittering each point of
   * an already dense centreline independently gives HIGH-FREQUENCY zigzag —
   * spikes and stars, not a loose arc — and letting them accumulate wrapped
   * the whole building in a grey scribble halo that had nothing to do with
   * the drawing.
   *
   * The liveliness belongs in the MOVEMENT of the stroke being drawn, not in
   * extra lines around it. See `warp` below.
   */

  /*
   * MIN_MS is the real budget, not `speed`.
   *
   * Most strokes in a building are short, so they clamp to the floor and
   * raising `speed` does nothing: at 2300 a drawing took 51s, at 6000 it took
   * 45.6s. 277 marks times a 110ms minimum IS the running time. Lower the
   * floor to shorten a recording; raise it to study the sequence.
   */
  function stroke(S, defs, nib, me, speed, i, g, lim) {
    const id = "lv" + (++uid);
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", id);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    const mp = document.createElementNS(NS, "path");
    mp.setAttribute("d", pathD(S.line));
    mp.setAttribute("fill", "none");
    mp.setAttribute("stroke", "#fff");
    /* the centreline is the real one now, so the mask can hug the ribbon
       instead of being generously oversized */
    mp.setAttribute("stroke-width", Math.max(4, S.w * 2.0 + 3));
    mp.setAttribute("stroke-linecap", "round");
    mp.setAttribute("stroke-linejoin", "round");
    mask.appendChild(mp); defs.appendChild(mask);

    const L = mp.getTotalLength() || 1;
    S.el.setAttribute("mask", "url(#" + id + ")");
    S.el.style.visibility = "";
    mp.setAttribute("stroke-dasharray", L + " " + L);
    mp.setAttribute("stroke-dashoffset", L);
    const ms = Math.max(lim.min, Math.min(lim.max, (L / speed) * 1000)) * vary(i);
    /* surges per stroke, and how hard — longer runs get more of both */
    const k = 2 + (i % 4), amp = 0.5 + ((i * 7) % 5) * 0.08;
    return anim(ms, (u) => {
      const e = ease(warp(u, k, amp));
      mp.setAttribute("stroke-dashoffset", L * (1 - e));
      const pt = mp.getPointAtLength(L * e);
      /* the nib rides a little off the line, the way a hand does */
      const q = mp.getPointAtLength(Math.min(L, L * e + 2));
      const dx = q.x - pt.x, dy = q.y - pt.y, d = Math.hypot(dx, dy) || 1;
      const off = Math.sin(u * 19 + i) * Math.min(3, S.w * 0.5);
      nib.setAttribute("transform", "translate(" + (pt.x - dy / d * off)
        + " " + (pt.y + dx / d * off) + ")");
    }, me).then(() => S.el.removeAttribute("mask"));
  }

  /*
   * A FILL IS SCRIBBLED IN, NOT WIPED.
   *
   * A downward wipe is a video edit, not a pen. A hand blocks a dark in with
   * a serpentine — back and forth, overshooting the edges — so the mask is a
   * zigzag stroked wide enough for its rows to merge. The ragged ends are the
   * point: they are why it does not look printed.
   */
  function fill(S, defs, nib, me, o, i) {
    const b = bbox(S.line);
    let a = (i * 7919 + 13) % 233280;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    const gap = Math.max(3.5, Math.min(18, b.h / 4.2));
    const rows = Math.max(2, Math.ceil(b.h / gap) + 1);
    const pts = [];
    for (let r = 0; r < rows; r++) {
      const y = b.y0 - gap * 0.5 + r * gap;
      const over = gap * (0.5 + rnd() * 1.4);
      const lead = r % 2 ? [b.x1 + over, b.x0 - over] : [b.x0 - over, b.x1 + over];
      pts.push([lead[0], y + (rnd() - 0.5) * gap * 0.3],
               [lead[1], y + (rnd() - 0.5) * gap * 0.3]);
    }
    const id = "lv" + (++uid);
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", id);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    const mp = document.createElementNS(NS, "path");
    mp.setAttribute("d", pathD(pts));
    mp.setAttribute("fill", "none");
    mp.setAttribute("stroke", "#fff");
    mp.setAttribute("stroke-width", gap * 1.5);
    mp.setAttribute("stroke-linecap", "round");
    mp.setAttribute("stroke-linejoin", "round");
    mask.appendChild(mp); defs.appendChild(mask);
    S.el.setAttribute("mask", "url(#" + id + ")");
    S.el.style.visibility = "";
    const L = mp.getTotalLength() || 1;
    mp.setAttribute("stroke-dasharray", L + " " + L);
    mp.setAttribute("stroke-dashoffset", L);
    const ms = Math.max(90, Math.min(520, (L / (o.speed || 2600)) * 1000 * 1.5));
    return anim(ms, (u) => {
      const e = warp(u, 3, 0.55);
      mp.setAttribute("stroke-dashoffset", L * (1 - e));
      const pt = mp.getPointAtLength(L * e);
      nib.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")");
    }, me).then(() => S.el.removeAttribute("mask"));
  }

  /* the hand lifts and travels to the next start — a visible reposition,
     which is as much a part of drawing as the strokes are */
  function travel(nib, from, to, me) {
    if (!from) return Promise.resolve();
    const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
    if (d < 6) return Promise.resolve();
    return anim(Math.min(160, 30 + d / 9), (u) => {
      const e = ease(u);
      nib.setAttribute("transform", "translate(" + (from[0] + (to[0] - from[0]) * e)
        + " " + (from[1] + (to[1] - from[1]) * e) + ")");
    }, me);
  }


  /*
   * ROUGHING OUT — the pencil pass.
   *
   * Not the ink loop at a higher speed. A gesture pass is many quick lines
   * going down nearly at once, so these CASCADE: each starts a beat after
   * the last and they overlap heavily, and the whole pass fits a fixed
   * budget however many strokes there are. Drawn one at a time at ink pace,
   * 120 ghost strokes would take five seconds and stop being a rough-in.
   *
   * No nib. The nib says "this is the line being committed"; a search has no
   * single point of attention, and showing one made it read as a slow start
   * rather than a fast pass.
   */
  function ghostStroke(S, defs, me, ms, i) {
    const id = "lv" + (++uid);
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", id);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    const mp = document.createElementNS(NS, "path");
    mp.setAttribute("d", pathD(S.line));
    mp.setAttribute("fill", "none");
    mp.setAttribute("stroke", "#fff");
    mp.setAttribute("stroke-width", Math.max(4, S.w * 2.0 + 3));
    mp.setAttribute("stroke-linecap", "round");
    mp.setAttribute("stroke-linejoin", "round");
    mask.appendChild(mp); defs.appendChild(mask);
    const L = mp.getTotalLength() || 1;
    S.el.setAttribute("mask", "url(#" + id + ")");
    S.el.style.visibility = "";
    mp.setAttribute("stroke-dasharray", L + " " + L);
    mp.setAttribute("stroke-dashoffset", L);
    /* a searching stroke is fast and even — it does not hesitate the way a
       committed one does, so less warp than the ink pass */
    return anim(ms, (u) => {
      mp.setAttribute("stroke-dashoffset", L * (1 - ease(warp(u, 2, 0.3))));
    }, me).then(() => S.el.removeAttribute("mask"));
  }

  function roughIn(g, defs, me, o) {
    const gh = g.__ghost;
    if (!gh || !gh.strokes.length) return Promise.resolve();
    gh.el.style.display = "";
    gh.el.style.opacity = "1";
    gh.strokes.forEach((s) => { s.el.style.visibility = "hidden"; });
    const n = gh.strokes.length;
    const budget = o.roughMs || 1700;
    const step = Math.max(6, budget / n);
    const each = Math.max(110, Math.min(300, step * 7));
    return Promise.all(gh.strokes.map((S, i) =>
      sleep(i * step).then(() => (me.alive ? ghostStroke(S, defs, me, each, i) : null))));
  }

  /* the pencil is erased once the ink is down */
  function erase(g, me, ms) {
    const gh = g.__ghost;
    if (!gh || gh.el.style.display === "none") return Promise.resolve();
    return anim(ms || 760, (u) => { gh.el.style.opacity = String(1 - u); }, me)
      .then(() => { gh.el.style.display = "none"; gh.el.style.opacity = ""; });
  }

  async function play(g, opt) {
    const o = opt || {};
    if (o.solo !== false) stopAll();
    const me = { alive: true };
    runs.add(me);
    reset(g);
    const defs = document.createElementNS(NS, "defs");
    defs.setAttribute("class", "live-defs");
    g.insertBefore(defs, g.firstChild);

    const nib = document.createElementNS(NS, "g");
    nib.setAttribute("class", "live-nib");
    const halo = document.createElementNS(NS, "circle");
    halo.setAttribute("r", 15); halo.setAttribute("fill", "none");
    halo.setAttribute("stroke", "#C2443A"); halo.setAttribute("stroke-width", 1.6);
    halo.setAttribute("opacity", 0.35);
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("r", 5); dot.setAttribute("fill", "#C2443A");
    nib.appendChild(halo); nib.appendChild(dot);
    g.appendChild(nib);

    /*
     * Replay order is not render order: the DOM must go regions → tones →
     * marks so fills sit UNDER the line work, but replayed that way the
     * drawing opens with black panes floating in space. Ink first, then go
     * back and block in the darks.
     */
    const all = g.__strokes || [];
    const list = all.filter((x) => !x.isFill).concat(all.filter((x) => x.isFill));
    list.forEach((s) => { s.el.style.visibility = "hidden"; });

    /* phase 1 — rough it out in pencil, if this subject has an underdrawing */
    const hasGhost = o.ghost !== false && g.__ghost && g.__ghost.strokes.length;
    /* `o.roughed` means the pencil is ALREADY on the paper — `Live.sketch` put
       it there and held it. Skip phase 1, but still erase it at the end, or the
       underdrawing outlives the drawing it was for. */
    if (hasGhost && o.roughed) {
      /* `reset` above hid the held pencil; put it straight back, unanimated */
      g.__ghost.el.style.display = "";
      g.__ghost.el.style.opacity = "1";
    } else if (hasGhost) {
      nib.style.display = "none";
      await roughIn(g, defs, me, o);
      if (!me.alive) return;
      nib.style.display = "";
      await sleep(180);
    }

    const speed = o.speed || 2600;
    const lim = { min: o.minMs || 110, max: o.maxMs || 820 };
    let at = null;
    for (let i = 0; i < list.length; i++) {
      if (!me.alive) return;
      const S = list[i];
      await travel(nib, at, S.line[0], me);
      if (S.isFill) await fill(S, defs, nib, me, o, i);
      else await stroke(S, defs, nib, me, speed, i, g, lim);
      at = S.line[S.line.length - 1];
      const g2 = o.gap === undefined ? 10 + (i % 5) * 7 : o.gap;
      if (g2) await sleep(g2);
    }
    if (!me.alive) return;
    nib.remove();
    /* phase 3 — erase the pencil */
    if (hasGhost) await erase(g, me, o.eraseMs);
    if (!me.alive) return;
    runs.delete(me);
    if (o.done) o.done();
  }

  /*
   * The underdrawing on its own — a loading state. Show it while whatever
   * comes next is still being worked out, then `Live.play(g)` inks over it
   * or `Live.reset(g)` drops it.
   */
  async function sketch(g, opt) {
    const o = opt || {};
    if (o.solo !== false) stopAll();
    const me = { alive: true };
    runs.add(me);
    reset(g);
    (g.__strokes || []).forEach((s) => { s.el.style.visibility = "hidden"; });
    const defs = document.createElementNS(NS, "defs");
    defs.setAttribute("class", "live-defs");
    g.insertBefore(defs, g.firstChild);
    await roughIn(g, defs, me, o);
    runs.delete(me);
  }

  /*
   * Take the drawing off the paper NOW, with no animation and before the
   * browser has painted. A first-run replay that calls `play` on a timer shows
   * the finished subject for as long as that timer lasts — the answer, then
   * the working out. `arm` is what makes the page open blank.
   */
  function arm(g) {
    (g.__strokes || []).forEach((s) => { s.el.style.visibility = "hidden"; });
    const gh = g.__ghost;
    if (gh) {
      gh.el.style.display = "none";
      gh.strokes.forEach((s) => { s.el.style.visibility = "hidden"; });
    }
  }

  return { play, sketch, arm, erase, stop, reset,
           get running() { return runs.size > 0; } };
})();

/* the subject whose tile is nearest the middle of the screen */
  return { NS, flat, shade, markColor, markWeight, build, Live,
           missingColours: () => [...missing] };
})();
