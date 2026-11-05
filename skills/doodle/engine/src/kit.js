/*
 * KIT — the scaffolding every subject repeats.
 *
 * rig() hands back a camera, the three draw lists, and the handful of helpers
 * that were being re-declared at the top of every module: filling a prism and
 * outlining its silhouette once, a tapered leg, a pooled shadow, and a leaf.
 */
window.Kit = (function () {

  function rig(opt) {
    const o = opt || {};
    const V = o.axon
      ? View.axon({ ax: o.ax != null ? o.ax : 24, az: o.az != null ? o.az : -22,
                    origin: o.origin || [50, 30] })
      : View.one({ f: o.f || 150, vp: o.vp || [50, 40] });

    const marks = [], regions = [], tones = [];
    const k = {
      V, marks, regions, tones,
      GND: o.gnd != null ? o.gnd : 40,
      OUT: 1.45, DET: 0.82, TEX: 0.48,

      M: (pts, w, x) => marks.push({ pts, w, ...(x || {}) }),
      T: (pts, kind, w, x) => tones.push({ pts, kind, w, ...(x || {}) }),
      R: (pts, fill, sd, sh, curve) => {
        regions.push({ pts, fill, s: sd || 0, curve: !!curve });
        if (sh != null) regions[regions.length - 1].shade = sh;
      },

      /* fill every face, outline the silhouette ONCE; `noTop` drops a lid
         something else is standing on, fill and outline both */
      solid(faces, fill, sd, w, noTop) {
        const top = faces[faces.length - 1];
        const lid = top && top.shade === 1;
        faces.forEach((f, i) => {
          if (noTop && lid && f === top) return;
          k.R(f.pts, fill, sd + i, f.shade);
        });
        if (faces.silhouette) k.M(faces.silhouette, w || k.OUT, { closed: true, curve: false });
        if (lid && !noTop) k.M(top.pts, (w || k.OUT) * 0.7, { closed: true, curve: false });
      },

      /* a prism from an absolute footprint, optionally turned */
      part(x0, z0, x1, z1, yTop, yBot, fill, sd, w, turn, cx, cz, soft, noTop) {
        let foot = soft ? View.soft(x0, z0, x1, z1, soft) : View.rect(x0, z0, x1, z1);
        if (turn) foot = View.turn(foot, turn, cx, cz);
        k.solid(View.prism(V, foot, yTop, yBot), fill || "cWood", sd, w, noTop);
        return foot;
      },

      shadow(cx, cz, rx, rz) {
        k.R(View.disc(0, 0, 1, 22).map(([x, z]) => V.p(cx + x * rx, k.GND, cz + z * (rz || rx)))
            , "cWash", 1, 1, true);
      },

      /*
       * CUT — hand occlusion, for a register with no fills.
       *
       * Everywhere colour is used, occlusion is a side effect of draw order:
       * author back to front and a later FILL covers what is behind it. With
       * nothing filled, nothing covers anything — a bowl of fruit authored
       * back to front comes out as six whole circles with a bowl drawn
       * through them like a wireframe.
       *
       * So a line in front of another line is CUT out of it: densify the run,
       * drop every point inside a nearer silhouette, emit what survives as
       * separate runs. Build each silhouette as you go and pass the ones
       * already laid down. It is also what a person drawing this does, and
       * it is why the thing at the back of a pen reference is a crescent of
       * line and nothing else.
       */
      cut(pts, blockers, closed) { return Kit.cut(pts, blockers, closed); },

      /*
       * The GROUND LINE, which replaces the pooled shadow.
       *
       * A grey ellipse under every object is the most stock-vector thing a
       * sheet can do; the pen references share ONE table rule that reaches
       * both edges of the picture. It must reach them and not pass them — a
       * subject is fitted to its own bounding box, so a rule running from
       * -14 to 114 made the ground line the widest thing in the drawing and
       * every object on the sheet came out two-thirds size.
       */
      ground(y, w) {
        k.M([[1, y == null ? k.GND : y], [99, y == null ? k.GND : y]],
            w || k.DET * 1.1, { curve: false });
      },

      /* thick where it meets the thing, thin at the floor */
      leg(x, z, dx, dz, yTop, w) {
        k.M(V.seg([x, yTop, z], [x + dx, k.GND, z + dz]), w || k.OUT * 1.5,
            { taper: [1.3, 0.58] });
      },

      /*
       * A leaf, from an explicit half-profile mirrored about its own axis.
       * `prof` is [[across, along]] with along running 0 at the base to 1 at
       * the tip. The base is a 3D point so the leaf sits in the scene and
       * takes its depth scale from it; the blade itself is flat and faces the
       * viewer, which is what a drawn leaf does.
       */
      leaf(prof, base3, len, angDeg, fill, sd, wide) {
        const b = V.p(base3[0], base3[1], base3[2]), s = V.s(base3[2]) * len;
        const a = (angDeg * Math.PI) / 180;
        const dx = Math.sin(a), dy = -Math.cos(a);           // along the leaf
        const px = Math.cos(a), py = Math.sin(a);            // across it
        const W = wide == null ? 1 : wide;
        const at = (u, t) => [b[0] + dx * t * s + px * u * s * W,
                              b[1] + dy * t * s + py * u * s * W];
        const pts = prof.map(([u, t]) => at(u, t))
          .concat(prof.slice(0, -1).reverse().map(([u, t]) => at(-u, t)));
        if (fill) k.R(pts, fill, sd, null, true);
        k.M(pts, k.TEX, { closed: true, curve: true });
        /* the midrib — one line is what stops a leaf reading as a petal */
        k.M([at(0, 0.06), at(0, 0.94)], k.TEX * 0.7, { curve: false });
        return at;
      },

      done() { return { marks, regions, tones }; },
    };
    return k;
  }

  /*
   * Explicit leaf profiles. Traced, not generated.
   *
   * Each one carries a point very close to the base and another very close to
   * the tip. Without them a closed Catmull-Rom rounds both ends off — the
   * neighbours pull the curve past the point — and every leaf in the set came
   * out an ellipse. A leaf is defined by the two places it narrows.
   */
  const LEAF = {
    oval:   [[0,0],[0.07,0.03],[0.30,0.16],[0.46,0.44],[0.40,0.74],[0.15,0.95],[0.03,0.99],[0,1]],
    lance:  [[0,0],[0.05,0.03],[0.16,0.20],[0.22,0.48],[0.17,0.76],[0.06,0.94],[0.02,0.99],[0,1]],
    heart:  [[0.03,0.01],[0.20,0.02],[0.40,0.12],[0.50,0.38],[0.42,0.70],[0.18,0.94],[0.04,0.99],[0,1]],
    paddle: [[0,0],[0.06,0.04],[0.20,0.26],[0.34,0.56],[0.37,0.82],[0.20,0.97],[0.05,0.995],[0,1]],
    needle: [[0,0],[0.04,0.06],[0.085,0.30],[0.08,0.64],[0.04,0.90],[0.01,0.99],[0,1]],
    strap:  [[0,0],[0.05,0.04],[0.13,0.14],[0.15,0.52],[0.12,0.84],[0.05,0.96],[0.01,0.99],[0,1]],
    round:  [[0,0],[0.09,0.04],[0.34,0.14],[0.50,0.42],[0.45,0.72],[0.20,0.95],[0.04,0.99],[0,1]],
    spear:  [[0,0],[0.09,0.03],[0.28,0.12],[0.30,0.36],[0.19,0.70],[0.07,0.92],[0.02,0.99],[0,1]],
    fan:    [[0,0],[0.06,0.06],[0.24,0.32],[0.52,0.68],[0.56,0.90],[0.26,0.995],[0,1]],
    frond:  [[0,0],[0.04,0.04],[0.11,0.26],[0.16,0.58],[0.12,0.84],[0.04,0.96],[0.01,0.99],[0,1]],
  };

  const NIB_PEN = { pressure: 0.1, wander: 0.07, boil: 0.12, overshoot: 0.22,
                    double: false, breaks: 0.03, blobs: 0, specks: 0 };

  const wrap = (label, build, fit, pen, nib) => ({
    label, build,
    fit: fit || { w: 0.82, h: 0.82 },
    pen: pen || 0.16,
    nib: nib || NIB_PEN,
  });

  function inPoly(poly, x, y) {
    let on = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) on = !on;
    }
    return on;
  }

  function cut(pts, blockers, closed) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const dense = [];
    for (let i = 0; i + 1 < src.length; i++) {
      const [x0, y0] = src[i], [x1, y1] = src[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.5));
      for (let j = 0; j < n; j++)
        dense.push([x0 + (x1 - x0) * (j / n), y0 + (y1 - y0) * (j / n)]);
    }
    dense.push(src[src.length - 1]);
    const runs = [];
    let run = [];
    for (const q of dense) {
      if (blockers.some((b) => inPoly(b, q[0], q[1]))) {
        if (run.length > 3) runs.push(run);
        run = [];
      } else run.push(q);
    }
    if (run.length > 3) runs.push(run);
    return runs;
  }

  return { rig, LEAF, NIB_PEN, wrap, cut, inPoly };
})();
