/*
 * Injected into retro.html by bin/export-retro.sh. Rebuilds every device with
 * Retro.EXPORT on (parts tagged, export-only extras drawn) and dumps the
 * hand-made ribbons — exactly what the page draws — with part tags, pivots
 * and plane affines, in TILE coordinates. bin/retro_rive.py turns it into RML.
 */
(function () {
  Retro.EXPORT = true;
  /* any module: window.__EXP = { mod: "Cafe", tile: "STILE" } — default Retro/TILE */
  const E = window.__EXP || {};
  const MOD = window[E.mod || "Retro"], TL = E.tile ? eval(E.tile) : TILE;
  const Q = typeof applyClean === "function" ? applyClean(flat(DEFAULTS)) : flat(DEFAULTS);
  const out = {};
  for (const key of MOD._keys) {
    const mod = MOD[key];
    const obj = mod.build(Q);
    const extra = new Set(Object.keys(obj.parts).filter((n) => obj.parts[n].extra));
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    if (obj.frame) [bx0, by0, bx1, by1] = obj.frame;
    else for (const m of obj.marks.concat(obj.regions)) {
      if (m.g && extra.has(m.g)) continue;
      for (const p of m.pts) {
        if (p[0] < bx0) bx0 = p[0]; if (p[0] > bx1) bx1 = p[0];
        if (p[1] < by0) by0 = p[1]; if (p[1] > by1) by1 = p[1];
      }
    }
    const bw = bx1 - bx0, bh = by1 - by0;
    const pen = Q.weight * (mod.pen || 1);
    const box = { w: TL.w * mod.fit.w, h: TL.h * mod.fit.h };
    const s = Math.min((box.w - pen * 1.6) / bw, (box.h - pen * 1.6) / bh);
    const ox = (TL.w - bw * s) / 2 - bx0 * s, oy = (TL.h - bh * s) / 2 - by0 * s;
    const to = (p) => [ox + p[0] * s, oy + p[1] * s];
    const items = [];
    for (const r of obj.regions)
      items.push({ k: "f", g: r.g || null, L: r.L || 0,
        c: Stage.shade(r.fill ? Q[r.fill] || r.fill : Q.cWood, r.shade),
        d: Hand.region(r.pts.map(to), { ...Q, curve: !!r.curve, weight: pen, seed: Q.seed + (r.s || 0) }) });
    for (const m of obj.marks) {
      const mc = Stage.markColor(m, Q);
      if (!mc) continue;
      items.push({ k: "l", g: m.g || null, L: m.L || 0, c: mc,
        d: Hand.mark(m.pts.map(to), { ...Q, closed: !!m.closed, taper: m.taper,
          curve: m.curve !== false, weight: pen * Stage.markWeight(m, Q) }) });
    }
    const parts = {};
    for (const [n, q] of Object.entries(obj.parts))
      parts[n] = { top: q.top, extra: q.extra, pivot: q.pivot ? to(q.pivot) : null,
        M: q.M ? q.M.map((r) => r.map((v) => v * s)) : null,
        normal: q.normal ? q.normal.map((v) => v * s) : null,
        clip: q.clip ? q.clip.map(to) : null,
        track: q.track ? q.track.map(([f, p, sc]) => [f, to(p), sc]) : null };
    out[key] = { name: MOD._names[key], w: TL.w, h: TL.h, scale: s, clean: !!Q.clean, seam: Q.seam == null ? 0.8 : Q.seam, items, parts };
  }
  const pre = document.createElement("pre");
  pre.id = "retro-dump";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
