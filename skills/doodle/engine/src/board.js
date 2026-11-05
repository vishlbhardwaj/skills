/*
 * BOARD — storyboards.
 *
 * A storyboard is not eight illustrations in a row. It is one sequence, and
 * the things that make it read are SHOT SIZE, STAGING and the fact that the
 * frame CROPS. None of those existed here: every subject in this system is
 * fitted to its own bounding box, which is the exact opposite of a shot.
 *
 * So a panel is a crop with a stated aspect, and `shot()` takes any subject
 * module already in the repo and places it in that crop at a chosen size and
 * position. Nothing has to be redrawn to be boarded.
 *
 * Panel space: x 0 → W, y 0 → H, y DOWN, where H = 100 and W = 100 × aspect.
 * The caption strip, when there is one, hangs below H and is part of the
 * stated frame so the whole card fits as one piece.
 */
window.Board = (function () {

  const H = 100;

  /* aspect ratios, by the name a director would say */
  const ASPECT = {
    cine:     2.39,          // anamorphic
    scope:    2.0,
    wide:     16 / 9,
    tv:       4 / 3,
    square:   1,
    portrait: 4 / 5,
    phone:    9 / 16,
  };

  /*
   * SHOT SIZE = how much of the panel's HEIGHT the subject stands in.
   *
   * Quoted against the subject's own height, not its width, because that is
   * what a shot size means: a close-up of a wide object still fills the
   * frame vertically. Above 1.0 the subject is larger than the panel and is
   * cropped — which is the point of a close-up.
   */
  const SHOT = {
    ews:  0.20,   // extreme wide — the subject is a token in a landscape
    ws:   0.42,   // wide — subject whole, with air around it
    full: 0.86,   // full shot — the subject fills the frame, nothing cropped
    ms:   1.20,   // medium — cropped
    mcu:  1.80,
    cu:   2.80,
    ecu:  5.00,
  };

  /* which detail rung a shot size is allowed to draw (see SKILL.md) */
  const RUNG = { ews: "distance", ws: "middle", full: "middle",
                 ms: "foreground", mcu: "foreground", cu: "foreground", ecu: "foreground" };

  const bboxOf = (obj) => {
    if (obj.frame) return obj.frame.slice();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const m of obj.marks.concat(obj.regions, obj.tones || []))
      for (const p of m.pts) {
        if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
      }
    return [x0, y0, x1, y1];
  };

  /*
   * `shot(k, mod, P, opt)` — put an existing subject in this panel.
   *
   *   size   a SHOT key, or a number (subject height ÷ panel height)
   *   at     [u, v] in 0..1 of the panel, where the subject's CENTRE lands.
   *          Default [0.5, 0.5]. Thirds are 0.33 / 0.67 — staging a subject
   *          dead centre in every panel is what makes a board read as a
   *          catalogue.
   *   anchor "centre" (default) | "feet" — "feet" lands the BOTTOM of the
   *          subject at v, which is what you want when the subject stands on
   *          a ground line shared with the rest of the panel.
   *   flip   mirror horizontally, so a character can face into the cut
   *
   * The subject's own pen and fit are deliberately NOT used: inside a panel
   * the panel's class owns the hand. That is the whole reason this exists.
   */
  function shot(k, mod, P, opt) {
    const o = opt || {};
    const Q = mod.nib ? { ...P, ...mod.nib } : P;
    const obj = mod.build(Q);
    const [x0, y0, x1, y1] = bboxOf(obj);
    const bw = x1 - x0, bh = y1 - y0;

    const size = typeof o.size === "number" ? o.size : (SHOT[o.size || "full"]);
    const s = (size * H) / bh;
    const at = o.at || [0.5, 0.5];
    const W = k.W;
    const cx = at[0] * W, cy = at[1] * H;
    const sx = o.flip ? -s : s;
    const ox = cx - (x0 + bw / 2) * sx;
    const oy = o.anchor === "feet" ? cy - y1 * s : cy - (y0 + bh / 2) * s;
    const to = (p) => [ox + p[0] * sx, oy + p[1] * s];

    for (const r of obj.regions) k.regions.push({ ...r, pts: r.pts.map(to) });
    for (const t of (obj.tones || [])) k.tones.push({ ...t, pts: t.pts.map(to) });
    for (const m of obj.marks) k.marks.push({ ...m, pts: m.pts.map(to) });
    return { to, s, rung: RUNG[o.size] || "middle" };
  }

  /* a ground line across the panel, at v in 0..1 — the thing that tells you
     where the camera is standing. Without it a subject floats. */
  const ground = (k, v, w) =>
    k.M([[-2, v * H], [k.W + 2, v * H]], w == null ? k.DET : w, { curve: false });

  /* a flat sky/ground wash, edge to edge, behind everything */
  const wash = (k, v0, v1, fill, sd) =>
    k.regions.unshift({ pts: [[-2, v0 * H], [k.W + 2, v0 * H], [k.W + 2, v1 * H], [-2, v1 * H]],
                        fill, s: sd || 0, curve: false });

  /*
   * CAMERA MOVES — the marks a board uses to say what the camera does.
   *
   * These are drawn in the same ink as everything else, thinner. A board that
   * annotates its moves in a different medium stops being one drawing.
   */
  function move(k, kind, opt) {
    const o = opt || {}, W = k.W, w = k.TEX;
    const inset = o.inset == null ? 0.22 : o.inset;
    const arrow = (a, b, len) => {
      k.M([a, b], w, { curve: false });
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L, h = len || H * 0.05;
      k.M([[b[0] - ux * h - uy * h * 0.45, b[1] - uy * h + ux * h * 0.45], b,
           [b[0] - ux * h + uy * h * 0.45, b[1] - uy * h - ux * h * 0.45]], w, { curve: false });
    };

    if (kind === "push" || kind === "pull") {
      const mx = W * inset * 0.5, my = H * inset * 0.5;
      const r = [[mx, my], [W - mx, my], [W - mx, H - my], [mx, H - my]];
      k.M(r, w, { closed: true, curve: false });
      const corners = [[[0, 0], [mx, my]], [[W, 0], [W - mx, my]],
                       [[W, H], [W - mx, H - my]], [[0, H], [mx, H - my]]];
      for (const [a, b] of corners) kind === "push" ? arrow(a, b) : arrow(b, a);
      return;
    }
    if (kind === "pan-l" || kind === "pan-r") {
      const y = H * (o.v == null ? 0.88 : o.v);
      const a = [W * 0.2, y], b = [W * 0.8, y];
      kind === "pan-r" ? arrow(a, b, H * 0.06) : arrow(b, a, H * 0.06);
      return;
    }
    if (kind === "tilt-u" || kind === "tilt-d") {
      const x = W * (o.u == null ? 0.9 : o.u);
      const a = [x, H * 0.78], b = [x, H * 0.22];
      kind === "tilt-u" ? arrow(a, b, H * 0.06) : arrow(b, a, H * 0.06);
      return;
    }
    if (kind === "track-l" || kind === "track-r") {
      const y = H * (o.v == null ? 0.9 : o.v);
      for (const dy of [-H * 0.025, H * 0.025]) {
        const a = [W * 0.22, y + dy], b = [W * 0.78, y + dy];
        kind === "track-r" ? arrow(a, b, H * 0.05) : arrow(b, a, H * 0.05);
      }
      return;
    }
    throw new Error("Board.move: unknown move '" + kind + "'");
  }

  /* an arrow INSIDE the frame: what the subject does, not what the camera
     does. Boards distinguish these by weight — action is heavier. */
  const action = (k, pts) => {
    k.M(pts, k.DET, { curve: pts.length > 2 });
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, h = H * 0.055;
    k.M([[b[0] - ux * h - uy * h * 0.42, b[1] - uy * h + ux * h * 0.42], b,
         [b[0] - ux * h + uy * h * 0.42, b[1] - uy * h - ux * h * 0.42]], k.DET, { curve: false });
  };


  /*
   * THE CROP IS GEOMETRIC, not an SVG clip-path.
   *
   * Stage's `clip` crops to the tile's fit box, which is the wrong rectangle
   * here — a panel's frame is only the top part of its card, the caption
   * strip is the rest, and an SVG clip big enough to show the caption lets
   * the shot spill out of the frame. The first board drew a four-storey café
   * straight across its own rule and over the panel below it.
   *
   * Clipping the GEOMETRY instead is also the more honest crop: the pen never
   * travels off-panel, so the live replay draws what the panel actually
   * shows. Regions are clipped as polygons (Sutherland-Hodgman), lines as
   * runs of segments — a line crossing the edge comes back as two marks, and
   * the hand puts a fresh overshoot on each new end, which the frame rule
   * then covers.
   */
  function clipPoly(pts, R) {
    const [x0, y0, x1, y1] = R;
    const edges = [
      [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
      [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
      [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
      [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
    ];
    let out = pts;
    for (const [inside, cut] of edges) {
      const src = out; out = [];
      for (let i = 0; i < src.length; i++) {
        const a = src[(i + src.length - 1) % src.length], b = src[i];
        const ia = inside(a), ib = inside(b);
        if (ib) { if (!ia) out.push(cut(a, b)); out.push(b); }
        else if (ia) out.push(cut(a, b));
      }
      if (!out.length) return [];
    }
    return out;
  }

  function clipLine(pts, R) {
    const [x0, y0, x1, y1] = R;
    const inside = (p) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
    /* Liang-Barsky on one segment */
    const seg = (a, b) => {
      let t0 = 0, t1 = 1;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const P = [-dx, dx, -dy, dy], Q = [a[0] - x0, x1 - a[0], a[1] - y0, y1 - a[1]];
      for (let i = 0; i < 4; i++) {
        if (P[i] === 0) { if (Q[i] < 0) return null; continue; }
        const r = Q[i] / P[i];
        if (P[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
        else { if (r < t0) return null; if (r < t1) t1 = r; }
      }
      return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
    };
    const runs = [];
    let cur = null;
    for (let i = 1; i < pts.length; i++) {
      const c = seg(pts[i - 1], pts[i]);
      if (!c) { cur = null; continue; }
      if (cur && Math.hypot(cur[cur.length - 1][0] - c[0][0], cur[cur.length - 1][1] - c[0][1]) < 1e-7)
        cur.push(c[1]);
      else { cur = [c[0], c[1]]; runs.push(cur); }
      if (!inside(pts[i])) cur = null;
    }
    return runs.filter((r) => r.length > 1);
  }

  /* crop everything authored so far to the panel rectangle */
  function crop(k, R) {
    const reg = [], ton = [], mks = [];
    for (const r of k.regions) { const c = clipPoly(r.pts, R); if (c.length > 2) reg.push({ ...r, pts: c }); }
    for (const t of k.tones) { const c = clipPoly(t.pts, R); if (c.length > 2) ton.push({ ...t, pts: c }); }
    for (const m of k.marks) {
      const src = m.closed ? m.pts.concat([m.pts[0]]) : m.pts;
      for (const run of clipLine(src, R)) mks.push({ ...m, closed: false, pts: run });
    }
    k.regions.length = 0; k.regions.push(...reg);
    k.tones.length = 0; k.tones.push(...ton);
    k.marks.length = 0; k.marks.push(...mks);
  }

  /*
   * `panel(spec)` — one panel as a subject module, ready for any page.
   *
   *   n         panel number, drawn in the corner
   *   aspect    a key of ASPECT, or a number
   *   draw(k,P) authors the shot in panel space; `k.W` is the panel width
   *   shot      shot-size key, recorded on the module so the page can label it
   *   caption   action line, lettered under the frame
   *   dialogue  spoken line, lettered under the caption in quotes
   *   secs      duration, drawn at the right of the caption strip
   *   move      a camera move key, drawn over the shot
   *
   * The frame is STATED and the panel CLIPS, so a shot can run past the edge.
   */
  function panel(spec) {
    const sp = spec || {};
    const ar = typeof sp.aspect === "number" ? sp.aspect : ASPECT[sp.aspect || "wide"];
    const W = H * ar;
    const hasCap = !!(sp.caption || sp.dialogue || sp.n != null || sp.shot || sp.secs);
    const CAP = hasCap ? (sp.dialogue ? 26 : 17) : 0;

    const build = (P) => {
      const k = Kit.rig({ f: 1e6, vp: [0, 0] });     // panel space is 2D; no camera
      k.W = W; k.H = H; k.ASPECT = ar;
      k.OUT = 1.35; k.DET = 0.74; k.TEX = 0.46;
      k.shot = (mod, opt) => shot(k, mod, P, opt);
      k.ground = (v, w) => ground(k, v, w);
      k.wash = (v0, v1, fill, sd) => wash(k, v0, v1, fill, sd);
      k.move = (kind, opt) => move(k, kind, opt);
      k.action = (pts) => action(k, pts);
      k.text = (str, x, y, sc, w, opt) => Letter.write(k, str, x, y, sc, w, opt);

      if (sp.draw) sp.draw(k, P);
      if (sp.move) move(k, sp.move);
      crop(k, [0, 0, W, H]);

      /* the rule: after the crop, so it sits cleanly on the cut edges */
      k.M([[0, 0], [W, 0], [W, H], [0, H]], k.OUT, { closed: true, curve: false });

      if (hasCap) {
        const sc = 0.78;
        /* the caption starts clear of the number, measured — the first board
           set it at a guessed 6.5 and printed "01THE STREET" */
        let x = 0;
        if (sp.n != null) x = k.text(String(sp.n).padStart(2, "0"), 0, H + 4.4, 0.95, k.DET) + 3.2;
        if (sp.shot) k.text(String(sp.shot), W, H + 4.6, 0.72, k.TEX, { align: "right" });
        if (sp.secs != null) k.text(sp.secs + "S", W, H + 11.6, 0.72, k.TEX, { align: "right" });
        if (sp.caption) k.text(sp.caption, x, H + 4.4, sc, k.TEX);
        if (sp.dialogue) k.text('"' + sp.dialogue + '"', x, H + 13.6, sc, k.TEX);
      }

      const o = k.done();
      o.frame = [0, 0, W, H + CAP];
      return o;
    };

    const c = Spec.of("panel");
    const mod = Kit.wrap(sp.label || ("Panel " + (sp.n == null ? "" : sp.n)),
                         build, { w: 0.94, h: 0.94 }, c.pen, c.nib);
    mod.cls = "panel";
    mod.clip = true;
    mod.aspect = (W) / (H + CAP);      // the CARD's aspect, caption included
    mod.shotSize = sp.shot;
    mod.n = sp.n;
    return mod;
  }

  /*
   * `sequence(list)` — panels numbered in read order, with the aspect checked.
   *
   * Mixed aspects in one board is almost always a mistake (a panel authored
   * at the default while the rest are cine), and it shows up as one card
   * sitting a different height in the row. Caught here rather than looked at.
   */
  function sequence(list) {
    const panels = list.map((sp, i) => panel({ ...sp, n: sp.n == null ? i + 1 : sp.n }));
    const a = panels[0] && panels[0].aspect;
    panels.forEach((p, i) => {
      if (Math.abs(p.aspect - a) > 1e-9)
        console.error("Board.sequence: panel " + (i + 1) + " is " + p.aspect.toFixed(3) +
                      ", the board is " + a.toFixed(3) + " — give every panel the same aspect");
    });
    panels.aspect = a;
    return panels;
  }

  return { H, ASPECT, SHOT, RUNG, panel, sequence, shot, move, action, ground, wash,
           clipPoly, clipLine };
})();
