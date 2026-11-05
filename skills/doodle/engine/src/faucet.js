/*
 * FAUCET — concept overlays for the "creativity faucet" reel (a reel script).
 *
 * Not a set of objects: three BEATS of one idea, drawn to sit on top of a talking-head video.
 *   mud    an old wall tap pouring muddy water        "the first water that comes out is all mud"
 *   clean  the SAME tap pouring clean water            "the clean water starts flowing"
 *   pipe   a pipe in section: crumpled bad ideas      "the good ideas are already in there,
 *          jammed at the outlet, a lightbulb behind    just stuck behind the bad ones"
 *
 * mud and clean share every line of the tap (one `tap()`), so a crossfade between the two
 * changes ONLY the water. That is the whole beat; if the tap moved, the eye would read two taps.
 *
 * Class `object` on the picture plane (x right, y DOWN), no camera: these are diagrams of an idea,
 * read square-on, like pen.js's flat subjects. LINE FIRST: muddy water is carried in line by a
 * scribble + floating grit (outlined), clean water by two highlight runs and outlined droplets,
 * the pipe wall by section hatch (the classic cut-surface convention), the paper balls by crease
 * lines. Colour is the second pass.
 *
 * Marks are not occluded in this renderer, so every line here is authored to stop where the
 * thing in front of it begins (water starts BELOW the spout lip; creases stay inside their ball).
 */
window.Faucet = (function () {
  const RAD = Math.PI / 180;
  const ell = (cx, cy, rx, ry, n, a0, a1) => {
    const N = n || 36, A0 = a0 == null ? 0 : a0, A1 = a1 == null ? 360 : a1;
    const full = A1 - A0 >= 360, out = [];
    for (let i = 0; i < (full ? N : N + 1); i++) {
      const a = (A0 + ((A1 - A0) * i) / N) * RAD;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  };
  const noise = (i, sd) => ((((i + 1) * 2654435761 + (sd || 0) * 40503) >>> 0) % 1000) / 1000;

  /* ── the tap, shared by mud and clean ─────────────────────────────── */
  /* returns the spout mouth: water is authored from there down */
  function tap(k, o) {
    const noWall = o && o.noWall;
    if (!noWall) {
    /* wall plate (a round flange seen face-on is a tall thin ellipse on the wall) */
    const plate = ell(10, 25, 3.2, 10, 30);
    k.R(plate, "cBrass", 1, 0.82, true);
    k.M(plate, k.OUT, { closed: true, curve: true });

    /* the wall pipe: a cylinder side-on — a band, with ribs bowing near its ends */
    const pipe = [[12.5, 20.5], [41, 20.5], [41, 29.5], [12.5, 29.5]];
    k.R(pipe, "cBrass", 2, 1);
    k.M([[12.5, 20.5], [41, 20.5]], k.OUT, { curve: false });
    k.M([[12.5, 29.5], [41, 29.5]], k.OUT, { curve: false });
    /* the turn of the round pipe: a darker lower third, plus one highlight run */
    k.R([[12.5, 26.6], [41, 26.6], [41, 29.5], [12.5, 29.5]], "cBrass", 3, 0.74);
    k.T([[12.5, 26.8], [41, 26.8], [41, 29.4], [12.5, 29.4]], "hatch", 0.36, { s: 4, gap: 0.55, angle: 60 });
    k.M([[15, 22.6], [38, 22.6]], k.TEX * 0.9, { curve: false });
    /* a hex nut where the pipe meets the body */
    const nut = [[37, 18.4], [42, 18.4], [42, 31.6], [37, 31.6]];
    k.R(nut, "cBrass", 5, 0.9);
    k.M(nut, k.DET, { closed: true, curve: false });
    k.M([[37, 22.8], [42, 22.8]], k.TEX, { curve: false });
    k.M([[37, 27.2], [42, 27.2]], k.TEX, { curve: false });
    }

    /* the body: a rounded block, wider at the bottom, the bit that reads "old tap" */
    const body = [[42, 16], [46, 13.2], [54, 13.2], [58, 16], [59, 24], [58.4, 33], [55, 35.4], [45, 35.4], [41.6, 33], [41.4, 24]];
    k.R(body, "cBrass", 6, 1, true);
    k.R([[54.6, 15.4], [58, 16], [59, 24], [58.4, 33], [55, 35.4], [53.8, 35.2], [55.4, 26]], "cBrass", 7, 0.74, true);
    k.T([[55.4, 17], [58, 17.4], [58.6, 25], [58, 32.4], [55, 34.4], [55.6, 26]], "hatch", 0.34, { s: 8, gap: 0.55, angle: 60, curve: true });
    k.M(body, k.OUT, { closed: true, curve: true });
    k.M([[45.6, 17.6], [44.6, 25], [45.4, 31.4]], k.TEX, { curve: true });      // highlight on the turn

    /* the stem and the cross handle (the handle is what says "tap" before anything else) */
    const stem = [[48, 8.6], [52, 8.6], [52, 13.4], [48, 13.4]];
    k.R(stem, "cBrass", 9, 0.86);
    k.M(stem, k.DET, { closed: true, curve: false });
    const bar = [[37.4, 5.2], [62.6, 5.2], [62.6, 8.8], [37.4, 8.8]];
    k.R(bar, "cBrass", 10, 1);
    k.M(bar, k.OUT, { closed: true, curve: false });
    for (const [cx, sd] of [[35.6, 11], [64.4, 12]]) {
      const ball = ell(cx, 7, 2.8, 2.8, 24);
      k.R(ball, "cBrass", sd, 0.9, true);
      k.M(ball, k.OUT, { closed: true, curve: true });
    }
    const hub = ell(50, 7, 3.2, 3.2, 24);
    k.R(hub, "cBrass", 13, 1.05, true);
    k.M(hub, k.DET, { closed: true, curve: true });

    /* the spout: a bent tube out of the body's right side, mouth facing DOWN */
    const spout = [[57.6, 22], [64, 22.4], [69.6, 25.6], [72.6, 31], [73.4, 38.6], [73.4, 41.4],
                   [66.6, 41.4], [66.6, 38.8], [66, 33.6], [63.4, 30.4], [58.4, 29.6]];
    k.R(spout, "cBrass", 14, 1, true);
    k.R([[69.6, 25.6], [72.6, 31], [73.4, 38.6], [73.4, 41.4], [71.4, 41.4], [71.2, 36], [69.4, 29.6]], "cBrass", 15, 0.74, true);
    k.M(spout, k.OUT, { closed: true, curve: true });
    /* the lip ring — a near-half ellipse, the mouth is seen from slightly above */
    const lip = [[66.2, 41.4], [73.8, 41.4], [73.8, 43.2], [66.2, 43.2]];
    k.R(lip, "cBrass", 16, 0.82);
    k.M(lip, k.DET, { closed: true, curve: false });
    k.M([[60, 24.4], [64.6, 24.8], [68, 27.4]], k.TEX, { curve: true });      // highlight
    return { x0: 66.8, x1: 73.2, y: 43.2 };
  }

  /* the falling stream: narrows a little as it accelerates, with a slight wobble */
  function stream(m, yEnd, sd) {
    const L = [], R = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, y = m.y + (yEnd - m.y) * t;
      const w = (m.x1 - m.x0) * (1 - t * 0.22);
      const c = (m.x0 + m.x1) / 2 + Math.sin(t * 5.2 + sd) * 0.55;
      L.push([c - w / 2, y]); R.push([c + w / 2, y]);
    }
    return { L, R, poly: L.concat(R.slice().reverse()), c: (m.x0 + m.x1) / 2 };
  }

  function mud(k) { pourMud(k, tap(k)); }

  function pourMud(k, m) {
    const yEnd = 86;
    /* the puddle first, so the stream lands IN it */
    const pud = ell(70, 89, 17, 3.6, 40);
    k.R(pud, "cMud", 20, 0.86, true);
    k.T(pud.concat([pud[0]]), "scribble", 0.34, { s: 21, gap: 0.8, curve: true, fill: "cMudInk" });
    k.M(pud, k.DET, { closed: true, curve: true });
    const s = stream(m, yEnd, 1);
    k.R(s.poly, "cMud", 22, 1, true);
    /* in line, mud is a scribble — a value with no direction, which is what mud is */
    k.T(s.poly.concat([s.poly[0]]), "scribble", 0.36, { s: 23, gap: 0.62, curve: true, fill: "cMudInk" });
    k.M(s.L, k.OUT * 0.9, { curve: true });
    k.M(s.R, k.OUT * 0.9, { curve: true });
    /* grit and bits: OUTLINED, because the dirt is what names this water (a w:0 fill would vanish in line) */
    for (let i = 0; i < 7; i++) {
      const y = m.y + 6 + i * 5.6, x = s.c + (noise(i, 3) - 0.5) * 3.2;
      const r = 0.55 + noise(i, 5) * 0.5;
      const g = ell(x, y, r * 1.2, r, 10, noise(i, 7) * 90);
      k.R(g, "cMudInk", 30 + i, 1, true);
      k.M(g, k.TEX * 0.9, { closed: true, curve: true });
    }
    /* splash: a few heavy brown drops thrown sideways */
    for (const [x, y, r, sd] of [[57.4, 82.6, 1.3, 40], [83.6, 81.4, 1.1, 41], [62, 78.4, 0.8, 42], [79.4, 77.6, 0.9, 43]]) {
      const d = ell(x, y, r, r * 1.15, 14);
      k.R(d, "cMud", sd, 0.9, true);
      k.M(d, k.DET, { closed: true, curve: true });
    }
  }

  function clean(k) {
    const m = tap(k);
    const yEnd = 86;
    const pud = ell(70, 89, 17, 3.6, 40);
    k.R(pud, "cWater", 20, 0.94, true);
    k.M(pud, k.DET, { closed: true, curve: true });
    /* one ripple ring inside the puddle — clean water is drawn by what it does, not by a tone */
    k.M(ell(70, 89, 9, 1.7, 30), k.TEX, { closed: true, curve: true });
    const s = stream(m, yEnd, 1);
    k.R(s.poly, "cWater", 22, 1, true);
    k.M(s.L, k.OUT * 0.9, { curve: true });
    k.M(s.R, k.OUT * 0.9, { curve: true });
    /* two highlight runs down the stream: the line twin of "clear" */
    const hl = (f, a, b) => s.L.slice(a, b).map(([x, y], i) => [x + (s.R[a + i][0] - x) * f, y]);
    k.M(hl(0.3, 1, 7), k.TEX, { curve: true });
    k.M(hl(0.34, 8, 12), k.TEX, { curve: true });
    /* clean droplets: teardrops, outlined, each with a glint */
    for (const [x, y, r, sd] of [[56.6, 80.4, 1.5, 40], [84.4, 79.4, 1.3, 41], [61.6, 75, 1.0, 42], [79.2, 74.4, 1.1, 43], [52.6, 85, 0.9, 44]]) {
      const drop = [[x, y - r * 2.1], [x + r * 0.55, y - r * 0.8], [x + r, y + r * 0.1]].concat(
        ell(x, y + r * 0.1, r, r, 12, 0, 180), [[x - r, y + r * 0.1], [x - r * 0.55, y - r * 0.8]]);
      k.R(drop, "cWater", sd, 0.9, true);
      k.M(drop, k.DET, { closed: true, curve: true });
      k.M([[x - r * 0.4, y - r * 0.1], [x - r * 0.35, y + r * 0.45]], k.TEX * 0.8, { curve: false });
    }
  }

  /* ── the pipe in section ──────────────────────────────────────────── */
  function crumple(k, cx, cy, r, sd) {
    /* a crumpled paper ball: an outline with flats and dents, then creases that run IN from the edge */
    const out = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * 360 + noise(i, sd) * 18;
      const rr = r * (0.86 + noise(i + 11, sd) * 0.2);
      out.push([cx + Math.cos(a * RAD) * rr, cy + Math.sin(a * RAD) * rr]);
    }
    k.R(out, "cPaper", sd, 1);
    /* the shadow side of the ball is a darker fill + its hatch twin */
    const sh = out.filter(([x, y]) => x - cx + (y - cy) > -r * 0.2);
    k.R(sh.concat([[cx + r * 0.1, cy + r * 0.1]]), "cPaper", sd + 1, 0.8);
    k.M(out, k.OUT * 0.9, { closed: true, curve: false });
    /* creases: short bent folds that start at the edge and die out inside — never through the
       middle (four creases meeting at the centre read as a pinwheel, not as paper) */
    for (let j = 0; j < 4; j++) {
      const a = j * 90 + noise(j, sd) * 60, b = a + 35 + noise(j + 4, sd) * 45;
      const r1 = 0.42 + noise(j + 8, sd) * 0.18, r2 = 0.5 + noise(j + 12, sd) * 0.2;
      const at = (ang, f) => [cx + Math.cos(ang * RAD) * r * f, cy + Math.sin(ang * RAD) * r * f];
      k.M([at(a, 0.88), at(a + 14, r1), at(b, r2)], k.TEX, { curve: false });
    }
  }

  function bulb(k, cx, cy, r) {
    /* glow rays first, so the bulb sits on top of their roots */
    for (let i = 0; i < 7; i++) {
      const a = (-90 + (i - 3) * 30) * RAD;
      k.M([[cx + Math.cos(a) * r * 1.45, cy + Math.sin(a) * r * 1.45], [cx + Math.cos(a) * r * 1.95, cy + Math.sin(a) * r * 1.95]],
          k.DET, { curve: false, taper: [1.2, 0.6] });
    }
    const glass = ell(cx, cy, r, r, 30, 135, 405).concat([[cx + r * 0.42, cy + r * 1.0], [cx + r * 0.42, cy + r * 1.35], [cx - r * 0.42, cy + r * 1.35], [cx - r * 0.42, cy + r * 1.0]]);
    k.R(glass, "cBulb", 50, 1, true);
    k.M(glass, k.OUT * 0.9, { closed: true, curve: true });
    /* the filament: what says "bulb" in line */
    k.M([[cx - r * 0.3, cy + r * 0.9], [cx - r * 0.3, cy + r * 0.1], [cx - r * 0.15, cy - r * 0.15], [cx, cy + r * 0.1], [cx + r * 0.15, cy - r * 0.15], [cx + r * 0.3, cy + r * 0.1], [cx + r * 0.3, cy + r * 0.9]], k.TEX, { curve: false });
    k.M([[cx - r * 0.62, cy - r * 0.2], [cx - r * 0.5, cy - r * 0.58]], k.TEX, { curve: true });  // glint
    /* the screw base */
    const base = [[cx - r * 0.42, cy + r * 1.35], [cx + r * 0.42, cy + r * 1.35], [cx + r * 0.36, cy + r * 1.95], [cx - r * 0.36, cy + r * 1.95]];
    k.R(base, "cSteel", 51, 0.9);
    k.M(base, k.DET, { closed: true, curve: false });
    k.M([[cx - r * 0.42, cy + r * 1.55], [cx + r * 0.4, cy + r * 1.62]], k.TEX, { curve: false });
    k.M([[cx - r * 0.38, cy + r * 1.75], [cx + r * 0.37, cy + r * 1.82]], k.TEX, { curve: false });
  }

  function pipe(k) {
    const X0 = 4, X1 = 88, T = 30, B = 62, WALL = 3.4;
    /* the inside of the pipe: a pale cavity, so the contents read */
    k.R([[X0, T + WALL], [X1, T + WALL], [X1, B - WALL], [X0, B - WALL]], "cInside", 60, 1);
    /* the walls, cut: section hatch is the line twin of "this is a cut surface" */
    for (const [y0, y1, sd] of [[T, T + WALL, 61], [B - WALL, B, 62]]) {
      const w = [[X0, y0], [X1, y0], [X1, y1], [X0, y1]];
      k.R(w, "cPipe", sd, 0.9);
      k.T(w.concat([w[0]]), "hatch", 0.36, { s: sd + 10, gap: 0.5, angle: 45 });
      k.M(w, k.DET, { closed: true, curve: false });
    }
    /* the outlet rim on the right: the open end of the pipe, seen at a slight angle */
    const rim = ell(X1 + 1.2, (T + B) / 2, 4.4, (B - T) / 2 + 1.6, 36);
    k.R(rim, "cPipe", 63, 0.8, true);
    k.M(rim, k.OUT, { closed: true, curve: true });
    k.M(ell(X1 + 1.2, (T + B) / 2, 2.2, (B - T) / 2 - WALL + 0.6, 30, -90, 90), k.DET, { curve: true });
    /* the far end stays open to the left (it runs on), drawn as a broken cut line */
    k.M([[X0, T], [X0 - 1.2, T + 6], [X0 + 0.8, T + 12], [X0 - 0.6, B - 12], [X0 + 1, B - 6], [X0, B]], k.DET, { curve: false });

    /* the good idea, at the BACK of the pipe */
    bulb(k, 17, 44.6, 5.4);
    /* the bad ideas, jammed toward the outlet — packed, overlapping, back to front */
    const balls = [[38, 40.4, 6.4, 70], [36.6, 52.8, 5.6, 72], [49.4, 46.4, 7, 74], [61, 39.4, 6, 76], [62.4, 52.6, 6.4, 78], [74.4, 45.6, 7.2, 80], [81.6, 38.4, 3.8, 82], [81.8, 53.8, 3.8, 84]];
    for (const [x, y, r, sd] of balls) crumple(k, x, y, r, sd);
  }


  /* ── the backed-up pipe: the whole metaphor in one drawing ─────────────
   * "Your creativity works like a backed-up pipe of water. The first mile is packed with
   * wastewater, and because it has one faucet, you can't get to the clear water until all of
   * that has run out." A long pipe in SECTION running into the same old tap: clear water at the
   * far end, mud packed in the stretch nearest the faucet, and the faucet pouring mud. The pipe is
   * drawn fat (it is a diagram, not plumbing) so the two waters read at overlay size. */
  function backed(k) {
    const X0 = -46, X1 = 43, T = 16.4, B = 33.6, WALL = 2.2, MIX = -6;
    const yi0 = T + WALL, yi1 = B - WALL;
    /* the boundary between the clear water and the mud: a soft, uneven front */
    const front = [];
    for (let i = 0; i <= 8; i++) {
      const y = yi0 + ((yi1 - yi0) * i) / 8;
      front.push([MIX + Math.sin(i * 1.7) * 2.2 + (noise(i, 9) - 0.5) * 1.6, y]);
    }
    const clear = [[X0, yi0]].concat(front, [[X0, yi1]]);
    /* mud stops at the body's edge: a tone renders above every fill, so a scribble that ran under
       the tap body would be drawn ON it */
    const XM = 41.2;
    const muddy = front.concat([[XM, yi1], [XM, yi0]]);
    k.R(clear, "cWater", 90, 1, false);
    k.R(muddy, "cMud", 91, 1, false);
    k.T(muddy.concat([muddy[0]]), "scribble", 0.36, { s: 92, gap: 0.62, curve: false, fill: "cMudInk" });
    k.M(front, k.DET, { curve: true });
    /* clear water in line: a few ripple runs, drawn by what water does */
    for (const [x, y] of [[-40, 21.6], [-30, 26.4], [-38, 29.4], [-22, 22.4], [-16, 28.2]])
      k.M([[x, y], [x + 2.2, y - 0.9], [x + 4.4, y], [x + 6.6, y - 0.9]], k.TEX, { curve: true });
    /* grit in the mud: outlined, because the dirt is what names it */
    for (let i = 0; i < 14; i++) {
      const x = MIX + 4 + ((i + 0.5) / 14) * (XM - MIX - 7), y = yi0 + 1.4 + noise(i * 7 + 3, 17) * (yi1 - yi0 - 2.8);
      const r = 0.5 + noise(i, 19) * 0.55;
      const g = ell(x, y, r * 1.2, r, 10, noise(i, 23) * 90);
      k.R(g, "cMudInk", 100 + i, 1, true);
      k.M(g, k.TEX * 0.9, { closed: true, curve: true });
    }
    /* the walls, cut: section hatch */
    for (const [y0, y1, sd] of [[T, yi0, 93], [yi1, B, 94]]) {
      const w = [[X0, y0], [X1, y0], [X1, y1], [X0, y1]];
      k.R(w, "cPipe", sd, 0.9);
      k.T(w.concat([w[0]]), "hatch", 0.36, { s: sd + 10, gap: 0.5, angle: 45 });
      k.M(w, k.DET, { closed: true, curve: false });
    }
    /* the far end runs on out of the picture: a broken cut line, not a cap */
    k.M([[X0, T], [X0 - 1.2, T + 4.4], [X0 + 0.8, T + 8.6], [X0 - 0.6, B - 4.4], [X0, B]], k.DET, { curve: false });
    /* the same tap, minus its wall pipe: the section pipe IS its supply */
    pourMud(k, tap(k, { noWall: true }));
  }

  const BUILD = { backed, mud, clean, pipe };
  const NAMES = { backed: "Backed-up pipe: clear water behind, mud at the faucet", mud: "Tap, muddy water", clean: "Tap, clean water", pipe: "Pipe: bad ideas in front, the good one behind" };
  const out = { _keys: Object.keys(BUILD), _names: NAMES };
  for (const key of out._keys) {
    out[key] = Spec.wrap("object", NAMES[key], () => {
      const k = Kit.rig({ gnd: 90 });
      BUILD[key](k);
      return k.done();
    });
  }
  return out;
})();
