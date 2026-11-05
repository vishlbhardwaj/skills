/*
 * __NAME__ — a drawing of your own (made by bin/new.sh).
 *
 * Draw inside draw(S). S is the still-life stage with the trial and things helpers:
 * S.F (fill), S.L (line), S.hatch, S.lathe, S.ball, S.box, S.soft, S.limb, S.pool,
 * S.prism, S.on, S.dash, S.keyhole … and People.figure(S, {...}) for a person.
 * Coordinates: x right, y DOWN, the tile is 100 tall. The frame fits the drawing
 * automatically, so draw at any size. Copy construction from the nearest example
 * in src/ (things.js, people.js, trials.js, scapes.js); never edit those files.
 */
window.Drawing = (() => {
  const ASPECT = 1;                       // tile width / height
  const CLASS = "object";                 // see src/spec.js: object, product, plant, scene, ink …

  function draw(S) {
    const k = S.k;                        // pens: k.OUT outline, k.DET detail, k.TEX texture
    S.panel(0, 0, 100, 100, "#FFFFFF");   // the paper; keep it the FIRST call

    /* placeholder: a cup. Replace it with the drawing. */
    S.pool(50, 84, 22, 2);
    S.lathe(50, 84, [[40, 17], [36, 18], [0, 15]], "#E9E6DF", { open: true });
  }

  const main = Spec.wrap(CLASS, "__NAME__", () => {
    const k = Kit.rig({ f: 260, vp: [80, 50], gnd: 40 });
    k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
    const t = Retro._kit.kit(k, { yaw: 0, pitch: 0 });
    const S = Things._extend(Trials._extend(StillLife._stage(t, 0.26)));
    draw(S);
    t.flush();
    const o = k.done();
    /* frame to the drawing: its bounding box + 10%, grown to ASPECT */
    const pts = o.regions.slice(1).flatMap((r) => r.pts).concat((o.marks || []).flatMap((m) => m.pts));
    if (pts.length) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const m = 0.1 * Math.max(x1 - x0, y1 - y0);
      x0 -= m; x1 += m; y0 -= m; y1 += m;
      const w = x1 - x0, h = y1 - y0;
      if (w / h < ASPECT) { const d = (h * ASPECT - w) / 2; x0 -= d; x1 += d; } else { const d = (w / ASPECT - h) / 2; y0 -= d; y1 += d; }
      o.frame = [x0, y0, x1, y1];
      o.regions[0].pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    }
    return o;
  });
  main.clip = true;
  return { main, _aspect: ASPECT };
})();
