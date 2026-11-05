/*
 * TEN LANDSCAPES.
 *
 * THE BUG THAT WASTED TWO REBUILDS: the declared frame was
 * [2, HOR-46, 98, 76] — screen y from -22 to 54. The ground at z=50 projects
 * to y=54. So EVERY foreground subject, all of which sat at z=3..8, projected
 * to y=66..68 and fell outside the frame entirely. The boats, gates, benches
 * and bales were never on screen; what showed was the far field at z=50..150,
 * which is why the scenes read as a ruled fan with fragments floating in it.
 *
 * Measuring ink density against a reference did not and could not find this:
 * the ink being measured was the backdrop. LOOK AT THE PICTURE, and when
 * something is missing check whether it is inside the frame before redrawing
 * it bigger.
 *
 * Rules the rebuild holds to:
 *
 *   1 THE FRAME MUST CONTAIN THE GROUND. Derived below from the camera, not
 *     chosen. NEAR_Z is the nearest depth drawn and the frame reaches it.
 *
 *   2 A SCENE IS ONE BIG RECOGNISABLE THING. The subject spans roughly half
 *     the frame height and straddles the horizon. A landscape of small
 *     tokens evenly spread is a map.
 *
 *   3 MASS, NOT WIRE. Thin outline on white reads as nothing at any density.
 *     Tone is dense hatch inside a closed silhouette — still no flat fill,
 *     but it reads as a value, which is what makes a shape legible.
 *
 *   4 DETAIL LADDER: foreground one thing at object fidelity, middle
 *     characteristic features only, distance a repeated token.
 */
window.Land = (function () {
  const S = {};
  const HOR = 24, GND = 46, F = 95, NEAR_Z = 5;

  /* rule 1, derived: the frame runs from well above the horizon down to the
     ground at the nearest depth anything is drawn at. */
  const BOT = HOR + GND * (F / (F + NEAR_Z));
  const TOP = HOR - 22;
  const FRAME = [2, TOP, 98, BOT - TOP];

  function rnd(seed) {
    let a = seed | 0 || 1;
    return () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  }

  /* ── MASS: a closed silhouette with hatch inside it ───────────────── */
  /*
   * TONE THE SHADOW SIDE, LEAVE THE LIT SIDE WHITE.
   *
   * Hatching a closed shape edge to edge gives a flat grey blob — which is
   * what every crown, bank and bale was. Form comes from the tone covering
   * only part of the shape. For a blob (`half: true`) the hatch is clipped to
   * the lower-right crescent: the outline from the 9-o'clock point round to
   * 3 o'clock, closed back through a chord. Flat-faced things (a roof, a
   * wall) keep full hatch, because a plane really is one value.
   */
  function crescent(pts) {
    let cx = 0, cy = 0;
    pts.forEach((q) => { cx += q[0]; cy += q[1]; });
    cx /= pts.length; cy /= pts.length;
    const lit = pts.filter((q) => (q[0] - cx) * 0.45 + (q[1] - cy) > 0);
    return lit.length > 2 ? lit : pts;
  }

  function mass(k, pts, gap, ang, w, curve, half) {
    k.T(half ? crescent(pts) : pts, "hatch", k.TEX * 0.7,
        { hatchGap: gap || 2.2, hatchAngle: ang === undefined ? 62 : ang,
          curve: curve !== false });
    k.M(pts, w || k.DET, { closed: true, curve: curve !== false });
  }

  /* ── DISTANCE: a ridge is one line ────────────────────────────────── */
  function ridge(k, prof, z, w) {
    k.M(prof.map(([x, y]) => k.V.p(x, y, z)), w || k.TEX, { curve: true });
  }

  /* a bank of trees at distance: ONE lumpy silhouette, lightly toned.
     Individually drawn far trees are the "half the twigs" failure. */
  function bank(k, x0, x1, z, h, seed, gap) {
    const V = k.V, s = V.s(z), R = rnd(seed), n = Math.max(6, Math.round((x1 - x0) / 22));
    const base = GND, pts = [[V.p(x0, base, z)[0], V.p(x0, base, z)[1]]];
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * (i / n);
      const hh = h * (0.62 + R() * 0.55);
      const p = V.p(x, base - hh, z);
      const q = V.p(x + (x1 - x0) / n / 2, base - hh * 0.6, z);
      pts.push(p, q);
    }
    pts.push(V.p(x1, base, z));
    mass(k, pts, gap || 2.6, 62, k.TEX * 1.1, true, true);
    void s;
  }

  /* ── MIDDLE: a tree is a trunk and ONE crown mass ─────────────────── */
  function crownPts(V, cx, cy, cz, r, seed, squash) {
    const c = V.p(cx, cy, cz), s = V.s(cz), R = rnd(seed);
    const q = squash || 0.86, n = 11, pts = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, am = ((i + 0.5) / n) * Math.PI * 2;
      const bump = 1.16 + R() * 0.1;
      pts.push([c[0] + Math.cos(a0) * r * s, c[1] + Math.sin(a0) * r * s * q]);
      pts.push([c[0] + Math.cos(am) * r * s * bump, c[1] + Math.sin(am) * r * s * q * bump]);
    }
    return pts;
  }

  /*
   * The trunk STOPS at the crown. Running it up through the middle and
   * sprouting branches out of the top of the foliage is what made every
   * earlier tree read as a scribble ball on a stick.
   */
  function tree(k, x, z, h, seed) {
    const V = k.V, b = V.p(x, GND, z), s = V.s(z);
    const cy = GND - h * 0.70, r = h * 0.38;
    const stop = V.p(x, cy + r * 0.55, z);
    k.M([b, stop], k.DET * 1.5, { taper: [1.45, 0.75] });
    mass(k, crownPts(V, x, cy, z, r, seed), 2.4, 58, k.DET, true, true);
    void s;
  }

  function pine(k, x, z, h) {
    const V = k.V, b = V.p(x, GND, z), s = V.s(z), pts = [];
    k.M([b, [b[0], b[1] - h * 0.18 * s]], k.TEX);
    pts.push([b[0], b[1] - h * 0.14 * s]);
    for (let t = 0; t < 4; t++) {
      const w = (0.30 - t * 0.065) * h * s, y0 = b[1] - (0.14 + t * 0.235) * h * s;
      pts.push([b[0] - w, y0], [b[0] - w * 0.45, y0 - 0.2 * h * s]);
    }
    pts.push([b[0], b[1] - h * s]);
    for (let t = 3; t >= 0; t--) {
      const w = (0.30 - t * 0.065) * h * s, y0 = b[1] - (0.14 + t * 0.235) * h * s;
      pts.push([b[0] + w * 0.45, y0 - 0.2 * h * s], [b[0] + w, y0]);
    }
    mass(k, pts, 2.3, 68, k.TEX * 1.1, false);
  }

  /* ── GROUND: restrained. A fan of forty ruled lines is a perspective
   * demo, not a field. A few contours and some tufts near the subject. */
  function ground(k, zs) {
    (zs || [18, 34, 58, 92]).forEach((z, i) => {
      const pts = [];
      for (let j = 0; j <= 7; j++)
        pts.push(k.V.p(-240 + j * 68, GND - 0.3, z + Math.sin(j * 1.7 + i) * 3));
      k.M(pts, k.TEX * (0.95 - i * 0.12), { curve: true });
    });
  }

  function tufts(k, z0, z1, n, seed, spread) {
    const R = rnd(seed), sp = spread || 46;
    const clusters = Math.max(3, Math.round(n / 7));
    for (let c = 0; c < clusters; c++) {
      const cxw = -sp + R() * sp * 2, czw = z0 + Math.pow(R(), 1.5) * (z1 - z0);
      for (let i = 0; i < n / clusters; i++) {
        const z = czw + (R() - 0.5) * 7, x = cxw + (R() - 0.5) * 16;
        const b = k.V.p(x, GND, z), s = k.V.s(z) * (1.6 + R() * 2.4);
        const blades = 2 + ((R() * 3) | 0);
        for (let j = 0; j < blades; j++) {
          const a = -1.4 + (j / Math.max(1, blades - 1)) * 2.8 + (R() - 0.5) * 0.5;
          k.M([b, [b[0] + Math.sin(a) * s * 0.75, b[1] - Math.cos(a) * s * 1.5]],
              k.TEX * 0.8, { taper: [1.3, 0.35] });
        }
      }
    }
  }

  function water(k, z0, z1, rows, seed) {
    for (let i = 0; i < rows; i++) {
      const t = i / rows, z = z0 + (z1 - z0) * Math.pow(t, 0.5), pts = [];
      for (let j = 0; j <= 9; j++)
        pts.push(k.V.p(-230 + (j / 9) * 460, GND, z + Math.sin(j * 7 + i) * 2.2));
      const w = k.TEX * (0.4 + (1 - t) * 1.25);
      if (t < 0.4) k.M(pts, w, { curve: true });
      else for (let j = 0; j < 3; j++) k.M(pts.slice(j * 3, j * 3 + 2), w);
    }
  }

  /* ── THE SUBJECTS — big, and at object fidelity ───────────────────── */

  /* roof as a mass, walls open, windows dark. u is half-width in world units */
  function cottage(k, x, z, u, hw, hr) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z);
    const W = u * s, Hw = hw * s, Hr = hr * s;
    const eave = b[1] - Hw;
    mass(k, [[b[0] - W * 1.12, eave], [b[0], eave - Hr],
             [b[0] + W * 1.12, eave]], 2.0, 54, k.OUT * 1.1, false);
    k.M([[b[0] - W, b[1]], [b[0] - W, eave], [b[0] + W, eave], [b[0] + W, b[1]]],
        k.OUT * 1.4, { taper: [1.1, 1] });
    k.M([[b[0] - W, b[1]], [b[0] + W, b[1]]], k.OUT * 1.2);
    /* door */
    const dw = W * 0.19, dh = Hw * 0.52;
    k.M([[b[0] - dw, b[1]], [b[0] - dw, b[1] - dh], [b[0] + dw, b[1] - dh],
         [b[0] + dw, b[1]]], k.DET * 1.3);
    /* two dark windows — the single clearest "this is a building" cue */
    [-0.58, 0.58].forEach((f) => {
      const wx = b[0] + f * W, wy = b[1] - Hw * 0.62, ww = W * 0.2, wh = Hw * 0.26;
      const q = [[wx - ww, wy - wh], [wx + ww, wy - wh], [wx + ww, wy + wh], [wx - ww, wy + wh]];
      mass(k, q, 1.5, 45, k.DET * 1.2, false);
    });
    /* chimney */
    const cx = b[0] + W * 0.6, ct = eave - Hr * 0.52;
    mass(k, [[cx - W * 0.11, ct], [cx + W * 0.11, ct],
             [cx + W * 0.11, ct - Hr * 0.4], [cx - W * 0.11, ct - Hr * 0.4]],
         2.0, 54, k.DET * 1.2, false);
    void s;
  }

  function barn(k, x, z, u, hw, hr) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z);
    const W = u * s, Hw = hw * s, Hr = hr * s, eave = b[1] - Hw;
    mass(k, [[b[0] - W * 1.08, eave], [b[0] - W * 0.42, eave - Hr * 0.72],
             [b[0] + W * 0.42, eave - Hr * 0.72], [b[0] + W * 1.08, eave]],
         2.0, 54, k.OUT * 1.1, false);
    k.M([[b[0] - W, b[1]], [b[0] - W, eave], [b[0] + W, eave], [b[0] + W, b[1]]], k.OUT * 1.4);
    k.M([[b[0] - W, b[1]], [b[0] + W, b[1]]], k.OUT * 1.2);
    /* the big doors */
    const dw = W * 0.4, dh = Hw * 0.74;
    k.M([[b[0] - dw, b[1]], [b[0] - dw, b[1] - dh], [b[0] + dw, b[1] - dh],
         [b[0] + dw, b[1]]], k.OUT * 1.2);
    k.M([[b[0], b[1]], [b[0], b[1] - dh]], k.DET);
    [[-dw, -dh], [dw, -dh]].forEach(([sx, sy]) =>
      k.M([[b[0] + sx, b[1]], [b[0], b[1] + sy]], k.DET));
    /* plank lines */
    for (let i = 1; i < 6; i++)
      k.M([[b[0] - W, b[1] - Hw * i / 6], [b[0] - dw, b[1] - Hw * i / 6]], k.TEX * 0.9);
    for (let i = 1; i < 6; i++)
      k.M([[b[0] + dw, b[1] - Hw * i / 6], [b[0] + W, b[1] - Hw * i / 6]], k.TEX * 0.9);
    void s;
  }

  function windmill(k, x, z, u, h) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z), W = u * s, H = h * s;
    const top = b[1] - H;
    mass(k, [[b[0] - W, b[1]], [b[0] - W * 0.46, top], [b[0] + W * 0.46, top],
             [b[0] + W, b[1]]], 2.6, 64, k.OUT * 1.3, false);
    /* cap */
    mass(k, [[b[0] - W * 0.56, top], [b[0], top - H * 0.17],
             [b[0] + W * 0.56, top]], 1.8, 50, k.OUT * 1.1, false);
    /* sails — four, at 20 degrees so they read as turning */
    const hub = [b[0], top - H * 0.06], L = W * 1.85;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.35;
      const tip = [hub[0] + Math.cos(a) * L, hub[1] + Math.sin(a) * L];
      const px = -Math.sin(a) * W * 0.17, py = Math.cos(a) * W * 0.17;
      mass(k, [[hub[0] + px, hub[1] + py], [tip[0] + px, tip[1] + py],
               [tip[0] - px, tip[1] - py], [hub[0] - px, hub[1] - py]],
           2.2, 30 + i * 30, k.DET * 1.2, false);
    }
    const dw = W * 0.2;
    k.M([[b[0] - dw, b[1]], [b[0] - dw, b[1] - H * 0.2], [b[0] + dw, b[1] - H * 0.2],
         [b[0] + dw, b[1]]], k.OUT * 1.1);
  }

  function lighthouse(k, x, z, u, h) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z), W = u * s, H = h * s;
    const top = b[1] - H * 0.78, tw = W * 0.42;
    k.M([[b[0] - W, b[1]], [b[0] - tw, top], [b[0] + tw, top], [b[0] + W, b[1]]], k.OUT * 1.4);
    k.M([[b[0] - W, b[1]], [b[0] + W, b[1]]], k.OUT * 1.2);
    /* the bands are the whole identity of a lighthouse */
    for (let i = 0; i < 3; i++) {
      const t0 = 0.1 + i * 0.3, t1 = t0 + 0.15;
      const w0 = W + (tw - W) * t0, w1 = W + (tw - W) * t1;
      const y0 = b[1] + (top - b[1]) * t0, y1 = b[1] + (top - b[1]) * t1;
      mass(k, [[b[0] - w0, y0], [b[0] + w0, y0], [b[0] + w1, y1], [b[0] - w1, y1]],
           1.9, 70, k.DET, false);
    }
    /* gallery + lantern */
    k.M([[b[0] - tw * 1.5, top], [b[0] + tw * 1.5, top]], k.OUT * 1.2);
    k.M([[b[0] - tw * 1.5, top], [b[0] - tw * 1.5, top - H * 0.04],
         [b[0] + tw * 1.5, top - H * 0.04], [b[0] + tw * 1.5, top]], k.DET);
    const lt = top - H * 0.04;
    k.M([[b[0] - tw, lt], [b[0] - tw, lt - H * 0.13], [b[0] + tw, lt - H * 0.13],
         [b[0] + tw, lt]], k.OUT * 1.2);
    for (let i = -1; i <= 1; i++)
      k.M([[b[0] + i * tw * 0.5, lt], [b[0] + i * tw * 0.5, lt - H * 0.13]], k.TEX);
    mass(k, [[b[0] - tw * 0.9, lt - H * 0.13], [b[0], lt - H * 0.2],
             [b[0] + tw * 0.9, lt - H * 0.13]], 1.6, 50, k.DET, false);
  }

  function church(k, x, z, u, hw, hr) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z);
    const W = u * s, Hw = hw * s, Hr = hr * s, eave = b[1] - Hw;
    /* nave */
    mass(k, [[b[0] - W * 1.06, eave], [b[0] + W * 0.1, eave - Hr],
             [b[0] + W * 1.06, eave]], 2.0, 54, k.OUT * 1.1, false);
    k.M([[b[0] - W, b[1]], [b[0] - W, eave], [b[0] + W, eave], [b[0] + W, b[1]]], k.OUT * 1.4);
    k.M([[b[0] - W, b[1]], [b[0] + W, b[1]]], k.OUT * 1.2);
    /* arched windows */
    [-0.5, 0.1, 0.7].forEach((f) => {
      const wx = b[0] + f * W, ww = W * 0.12, wy = b[1] - Hw * 0.34;
      const q = [[wx - ww, wy], [wx - ww, wy - Hw * 0.26],
                 [wx - ww * 0.5, wy - Hw * 0.38], [wx + ww * 0.5, wy - Hw * 0.38],
                 [wx + ww, wy - Hw * 0.26], [wx + ww, wy]];
      mass(k, q, 1.5, 45, k.DET * 1.1, false);
    });
    /* tower */
    const tx = b[0] - W * 1.3, tw = W * 0.3, tt = b[1] - Hw * 1.75;
    k.M([[tx - tw, b[1]], [tx - tw, tt], [tx + tw, tt], [tx + tw, b[1]]], k.OUT * 1.3);
    mass(k, [[tx - tw * 1.25, tt], [tx, tt - Hw * 0.85], [tx + tw * 1.25, tt]],
         2.0, 54, k.OUT * 1.1, false);
    mass(k, [[tx - tw * 0.5, b[1] - Hw * 1.5], [tx + tw * 0.5, b[1] - Hw * 1.5],
             [tx + tw * 0.5, b[1] - Hw * 1.62], [tx - tw * 0.5, b[1] - Hw * 1.62]],
         1.4, 45, k.DET, false);
  }

  function cabin(k, x, z, u, hw, hr) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z);
    const W = u * s, Hw = hw * s, Hr = hr * s, eave = b[1] - Hw;
    mass(k, [[b[0] - W * 1.16, eave], [b[0], eave - Hr],
             [b[0] + W * 1.16, eave]], 2.0, 54, k.OUT * 1.1, false);
    k.M([[b[0] - W, b[1]], [b[0] - W, eave], [b[0] + W, eave], [b[0] + W, b[1]]], k.OUT * 1.4);
    k.M([[b[0] - W, b[1]], [b[0] + W, b[1]]], k.OUT * 1.2);
    /* log courses — what makes it a cabin and not a shed */
    for (let i = 1; i < 7; i++) {
      const y = b[1] - Hw * i / 7;
      k.M([[b[0] - W, y], [b[0] + W, y]], k.TEX * 1.05, { curve: true });
    }
    const dw = W * 0.22, dh = Hw * 0.58;
    mass(k, [[b[0] - dw, b[1]], [b[0] - dw, b[1] - dh], [b[0] + dw, b[1] - dh],
             [b[0] + dw, b[1]]], 1.7, 45, k.DET * 1.3, false);
    const cx = b[0] - W * 0.72;
    mass(k, [[cx - W * 0.1, eave - Hr * 0.3], [cx + W * 0.1, eave - Hr * 0.3],
             [cx + W * 0.1, eave - Hr * 0.75], [cx - W * 0.1, eave - Hr * 0.75]],
         2.0, 54, k.DET * 1.2, false);
  }

  function sailboat(k, x, z, u, h, flip) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z), f = flip ? -1 : 1;
    const W = u * s, H = h * s;
    const hull = [[-1, -0.3], [-0.82, -0.52], [0, -0.6], [0.84, -0.5], [1, -0.26],
                  [0.72, 0.12], [-0.74, 0.12]];
    mass(k, hull.map(([a, c]) => [b[0] + a * W * f, b[1] + c * W * 0.42]),
         2.3, 62, k.OUT * 1.3, true, true);
    /* mast and two sails */
    const mx = b[0] - 0.12 * W * f, my = b[1] - 0.5 * W * 0.42;
    k.M([[mx, my], [mx, my - H]], k.OUT * 1.2, { taper: [1.2, 0.8] });
    mass(k, [[mx, my - H * 0.96], [mx + 0.62 * W * f, my - H * 0.12], [mx, my - H * 0.08]],
         2.2, 40, k.DET * 1.2, false);
    mass(k, [[mx, my - H * 0.88], [mx - 0.42 * W * f, my - H * 0.1], [mx, my - H * 0.06]],
         2.2, 120, k.DET * 1.2, false);
  }

  function mill(k, x, z, u, hw, hr) {
    /* a watermill: cottage plus a wheel, for the river scene */
    cottage(k, x, z, u, hw, hr);
    const V = k.V, s = V.s(z), b = V.p(x, GND, z), r = u * 0.62 * s;
    const c = [b[0] + u * s * 1.18, b[1] - r * 0.55];
    const o = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
    }
    k.M(o, k.OUT * 1.2, { closed: true, curve: true });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      k.M([[c[0] + Math.cos(a) * r * 0.22, c[1] + Math.sin(a) * r * 0.22],
           [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]], k.DET);
    }
  }

  /* ── SECONDARY — middle rung props ────────────────────────────────── */

  function fence(k, x0, z0, x1, z1, n) {
    const V = k.V;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      k.M([V.p(x, GND, z), V.p(x, GND - 12, z)], k.DET * (1.3 - t * 0.5), { taper: [1.2, 0.85] });
    }
    [-9, -4.5].forEach((dy) => k.M([V.p(x0, GND + dy, z0), V.p(x1, GND + dy, z1)], k.TEX));
  }

  function bale(k, x, z, r) {
    const V = k.V, s = V.s(z), c = V.p(x, GND - r, z), rr = r * s, o = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      o.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
    }
    mass(k, o, 2.4, 58, k.OUT * 1.1, true, true);
    for (let j = -2; j <= 2; j++) {
      const f = j / 2.6, sq = Math.sqrt(Math.max(0.03, 1 - f * f));
      k.M(o.map(([px, py]) => [c[0] + (px - c[0]) * sq + f * rr * 0.12, py]),
          k.TEX * 0.9, { closed: true, curve: true });
    }
  }

  function jetty(k, x, z0, z1) {
    const V = k.V;
    [-1, 1].forEach((sd) =>
      k.M([V.p(x + sd * 14, GND - 7, z0), V.p(x + sd * 8, GND - 7, z1)], k.OUT * 1.2));
    for (let i = 0; i <= 7; i++) {
      const t = i / 7, z = z0 + (z1 - z0) * t, w = 14 - 6 * t;
      k.M([V.p(x - w, GND - 7, z), V.p(x + w, GND - 7, z)], k.DET);
      if (i % 2 === 0)
        [-1, 1].forEach((sd) => k.M([V.p(x + sd * w, GND - 7, z), V.p(x + sd * w, GND, z)],
                                    k.DET * 1.2, { taper: [1.1, 0.9] }));
    }
  }

  function bridge(k, x, z, u) {
    const V = k.V, s = V.s(z), b = V.p(x, GND, z), W = u * s;
    k.M([[b[0] - W, b[1] - 9 * s], [b[0] + W, b[1] - 9 * s]], k.OUT * 1.3);
    k.M([[b[0] - W, b[1] - 16 * s], [b[0] + W, b[1] - 16 * s]], k.DET);
    const arch = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (i / 14);
      arch.push([b[0] - Math.cos(a) * W * 0.6, b[1] - 9 * s - Math.sin(a) * W * 0.44]);
    }
    k.M(arch, k.OUT * 1.2, { curve: true });
    const span = arch.concat([[b[0] + W, b[1] - 9 * s], [b[0] + W, b[1] - 16 * s],
                              [b[0] - W, b[1] - 16 * s], [b[0] - W, b[1] - 9 * s]]);
    mass(k, span, 2.4, 62, k.TEX * 0.9, false);
    [-1, 1].forEach((sd) =>
      k.M([[b[0] + sd * W, b[1] - 16 * s], [b[0] + sd * W, b[1] - 3 * s]], k.DET));
  }

  /* a near trunk at the frame edge — the repoussoir that gives the sky a
     reason to be there and the scene a near rung */
  /*
   * THE NEAR TREE AT THE FRAME EDGE (repoussoir).
   *
   * A thin straight pole with a small crown on top is a lamppost. What makes
   * this read as a tree overhanging the view is: a HEAVY tapered trunk, a
   * real lean, branches that fork before the foliage, and a crown that
   * SPREADS across the top of the frame rather than sitting on the stick.
   */
  function edgeTree(k, side, z, h, seed) {
    const V = k.V, x = side * 46, b = V.p(x, GND, z), s = V.s(z), R = rnd(seed);
    const lean = -side * h * 0.12 * s;
    const fork = [b[0] + lean * 0.75, b[1] - h * 0.62 * s];
    k.M([b, [b[0] + lean * 0.3, b[1] - h * 0.34 * s], fork],
        k.OUT * 4.2, { curve: true, taper: [1.5, 0.42] });
    /* limbs fork BELOW the foliage and carry it */
    const limbs = [[-1.0, 0.30], [-0.55, 0.42], [0.45, 0.34], [0.9, 0.24]];
    limbs.forEach(([dx, dy], i) => {
      const tip = [fork[0] - side * dx * h * 0.30 * s, fork[1] - h * dy * s];
      k.M([fork, [(fork[0] + tip[0]) / 2 - side * dx * h * 0.04 * s,
                  (fork[1] + tip[1]) / 2 - h * 0.03 * s], tip],
          k.OUT * (2.1 - i * 0.22), { curve: true, taper: [1.4, 0.4] });
    });
    /* the canopy: overlapping lobes spread along the limbs, not one ball */
    const lobes = [[-0.34, 0.90, 0.16], [-0.10, 0.99, 0.18], [0.16, 0.95, 0.15],
                   [0.34, 0.84, 0.13], [-0.22, 0.78, 0.12], [0.04, 0.80, 0.13]];
    lobes.forEach(([dx, dy, rr], i) =>
      mass(k, crownPts(V, x - side * dx * h * 0.42 + lean / s, GND - h * dy, z,
                       h * rr * (0.92 + R() * 0.2), seed + i * 13, 0.9),
           2.4, 58, k.DET * 1.1, true, true));
  }

  /* ── THE TEN ──────────────────────────────────────────────────────
   *
   * SCALE DISCIPLINE. The frame is 96 screen units wide and the scale at a
   * depth is s = f/(f+z), so the widest world x that stays on screen is
   * 46/s — about ±49 at z=6, ±60 at z=30, ±94 at z=100. Authoring the near
   * work out to ±260 (which the first rebuild did) crops every foreground
   * subject in half. Far ridges and banks may run wide; near ones may not.
   */

  S.hills = (k) => {
    ridge(k, [[-260, -12], [-120, -22], [-30, -10], [60, -24], [260, -14]], 170);
    ridge(k, [[-260, 0], [-130, -9], [-20, 2], [90, -7], [260, 0]], 120, k.TEX * 1.1);
    bank(k, -260, -56, 84, 20, 7);
    bank(k, 64, 260, 92, 17, 11);
    ground(k);
    tree(k, 44, 34, 30, 13);
    fence(k, -44, 7, -26, 48, 7);
    cottage(k, -12, 13, 25, 19, 14);
    tufts(k, NEAR_Z, 36, 44, 17, 46);
    edgeTree(k, -1, 6, 70, 23);
  };

  S.coast = (k) => {
    ridge(k, [[-260, -8], [-130, -26], [-60, -12], [20, -28], [260, -10]], 180);
    water(k, 46, 150, 20, 5);
    k.M(k.V.seg([-250, GND, 46], [250, GND, 46]), k.DET);
    bank(k, -260, -130, 96, 15, 19);
    bank(k, 150, 260, 104, 12, 23);
    lighthouse(k, 10, 15, 11, 40);
    tufts(k, NEAR_Z, 40, 44, 9, 46);
    fence(k, -42, 6, -30, 40, 6);
    edgeTree(k, -1, 7, 66, 29);
  };

  S.desert = (k) => {
    ridge(k, [[-260, 2], [-110, 2], [-104, -16], [-46, -16], [-40, 4], [260, 4]], 180);
    ridge(k, [[-260, 14], [30, 14], [38, 0], [96, 0], [104, 16], [260, 16]], 130, k.TEX * 1.1);
    ground(k, [24, 48, 86]);
    [[-50, 40, 24], [44, 62, 20], [78, 92, 14]].forEach(([x, z, h]) => {
      const V = k.V, b = V.p(x, GND, z), s = V.s(z), w = 3.4 * s;
      mass(k, [[b[0] - w, b[1]], [b[0] - w, b[1] - h * s], [b[0] + w, b[1] - h * s],
               [b[0] + w, b[1]]], 2.4, 66, k.DET * 1.3, false);
      [-1, 1].forEach((sd) => {
        const y = b[1] - h * (0.5 + sd * 0.08) * s, aw = 7.5 * s;
        mass(k, [[b[0] + sd * w, y], [b[0] + sd * aw, y], [b[0] + sd * aw, y - h * 0.3 * s],
                 [b[0] + sd * (aw - w * 1.7), y - h * 0.3 * s],
                 [b[0] + sd * (aw - w * 1.7), y - w * 1.2], [b[0] + sd * w, y - w * 1.2]],
             2.4, 66, k.DET * 1.2, false);
      });
    });
    cabin(k, -10, 14, 23, 17, 12);
    tufts(k, NEAR_Z, 38, 28, 3, 46);
    edgeTree(k, 1, 8, 62, 31);
  };

  S.forest = (k) => {
    ridge(k, [[-260, -6], [-110, -18], [10, -8], [130, -20], [260, -10]], 190);
    bank(k, -260, 260, 130, 22, 21, 2.2);
    for (let i = 0; i < 9; i++) pine(k, -96 + i * 24, 74 + (i % 3) * 18, 26 + (i % 4) * 4);
    ground(k, [20, 40, 64]);
    cabin(k, 14, 15, 24, 18, 13);
    tufts(k, NEAR_Z, 34, 38, 13, 46);
    /* a felled log: round ends, or it is a grey slab */
    const V = k.V, b = V.p(-24, GND, 9), s = V.s(9);
    const log = [[-20, -1], [-21, -5], [-17, -8], [14, -9], [19, -6], [19, -2],
                 [15, 1], [-16, 2]];
    mass(k, log.map(([u, v]) => [b[0] + u * s, b[1] + v * s]), 2.4, 58, k.OUT * 1.4, true, true);
    const e = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      e.push([b[0] + (17 + Math.cos(a) * 2.6) * s, b[1] + (-3.5 + Math.sin(a) * 5) * s]);
    }
    k.M(e, k.DET, { closed: true, curve: true });
    for (let i = 0; i < 4; i++)
      k.M([[b[0] + (-13 + i * 8) * s, b[1] - 7.5 * s],
           [b[0] + (-11 + i * 8) * s, b[1] + 0.5 * s]], k.TEX);
    edgeTree(k, 1, 6, 70, 37);
  };

  S.lake = (k) => {
    ridge(k, [[-260, 2], [-150, -30], [-96, -10], [-30, -36], [40, -12], [120, -32], [260, -2]], 180);
    ridge(k, [[-260, 12], [-120, -4], [-10, 10], [110, -6], [260, 10]], 130, k.TEX * 1.1);
    bank(k, -260, -80, 104, 18, 41);
    k.M(k.V.seg([-250, GND, 54], [250, GND, 54]), k.DET);
    water(k, 22, 104, 22, 17);
    cottage(k, 26, 20, 21, 16, 12);
    jetty(k, -22, NEAR_Z, 42);
    sailboat(k, 40, 30, 17, 28);
    tufts(k, NEAR_Z, 26, 32, 23, 46);
    edgeTree(k, -1, 6, 68, 43);
  };

  S.field = (k) => {
    ridge(k, [[-260, 4], [-80, -6], [60, 6], [260, 0]], 170);
    bank(k, -260, -100, 110, 14, 29);
    bank(k, 120, 260, 118, 12, 47);
    ground(k, [26, 52, 90]);
    barn(k, 18, 17, 26, 19, 14);
    [[-54, 58, 7], [62, 86, 5]].forEach(([x, z, r]) => bale(k, x, z, r));
    fence(k, -46, 6, -32, 52, 7);
    bale(k, -26, 9, 10);
    tufts(k, NEAR_Z, 34, 36, 53, 46);
    edgeTree(k, 1, 7, 66, 59);
  };

  S.cliff = (k) => {
    ridge(k, [[-260, 0], [-120, -14], [-30, -4], [80, -16], [260, -6]], 190);
    water(k, 60, 170, 18, 31);
    k.M(k.V.seg([-250, GND, 60], [250, GND, 60]), k.DET);
    const V = k.V;
    mass(k, [V.p(-170, GND, 56), V.p(-90, GND - 22, 56), V.p(0, GND - 26, 56),
             V.p(40, GND - 5, 56), V.p(40, GND, 56)], 3.0, 62, k.DET, true);
    lighthouse(k, -34, 50, 7, 26);
    ground(k, [22, 42]);
    tufts(k, NEAR_Z, 32, 38, 37, 46);
    fence(k, -40, 6, -22, 46, 7);
    edgeTree(k, 1, 7, 68, 67);
  };

  S.valley = (k) => {
    ridge(k, [[-260, 0], [-140, -26], [-60, -6], [10, -30], [90, -8], [160, -26], [260, 0]], 180);
    ridge(k, [[-260, 12], [-120, -4], [-30, 10], [70, -6], [260, 12]], 130, k.TEX * 1.1);
    bank(k, -260, -90, 100, 17, 71);
    bank(k, 100, 260, 108, 15, 73);
    k.M([k.V.p(-34, GND, 8), k.V.p(-14, GND, 54), k.V.p(-5, GND, 104)], k.DET, { curve: true });
    k.M([k.V.p(28, GND, 8), k.V.p(12, GND, 54), k.V.p(7, GND, 104)], k.DET, { curve: true });
    water(k, 8, 100, 18, 43);
    mill(k, 30, 19, 19, 16, 12);
    bridge(k, -6, 15, 34);
    tufts(k, NEAR_Z, 26, 28, 79, 44);
    edgeTree(k, -1, 6, 70, 83);
  };

  S.island = (k) => {
    k.M(k.V.seg([-250, GND, 150], [250, GND, 150]), k.TEX);
    water(k, 20, 150, 24, 59);
    const V = k.V, s = V.s(66), m = [];
    const c = V.p(0, GND, 66);
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * (1 + i / 21);
      m.push([c[0] + Math.cos(a) * 56 * s, c[1] + Math.sin(a) * 12 * s]);
    }
    mass(k, m, 2.8, 62, k.DET, true, true);
    [[-22, 34], [2, 42], [20, 29]].forEach(([x, h], j) => {
      const b = V.p(x, GND - 4, 66);
      k.M([b, [b[0] + 3 * s, b[1] - h * s]], k.OUT * 1.2, { taper: [1.4, 0.7] });
      for (let i = 0; i < 7; i++) {
        const r = (-84 + i * 28) * Math.PI / 180;
        const tip = [b[0] + 3 * s + Math.sin(r) * 17 * s, b[1] - h * s - Math.cos(r) * 17 * s];
        mass(k, [[b[0] + 3 * s, b[1] - h * s],
                 [(b[0] + 3 * s + tip[0]) / 2, (b[1] - h * s + tip[1]) / 2 - 3 * s],
                 tip, [(b[0] + 3 * s + tip[0]) / 2, (b[1] - h * s + tip[1]) / 2 + 1 * s]],
             1.8, 40 + j * 20, k.TEX, true);
      }
    });
    sailboat(k, -20, 12, 22, 36);
    edgeTree(k, 1, 7, 64, 89);
  };

  S.terrace = (k) => {
    ridge(k, [[-260, -8], [-120, -24], [0, -10], [120, -26], [260, -10]], 180);
    ridge(k, [[-260, 6], [-100, -8], [20, 6], [140, -8], [260, 6]], 130, k.TEX * 1.1);
    bank(k, -260, -120, 96, 16, 97);
    for (let t = 0; t < 5; t++) {
      const z = 20 + Math.pow(t / 4, 0.8) * 76, w = 140 - t * 18;
      k.M(k.V.seg([-w, GND - 0.4, z], [w, GND - 0.4, z]), k.DET * (1.2 - t * 0.14));
      for (let x = -w + 14; x < w; x += 26)
        k.M(k.V.seg([x, GND - 0.4, z], [x * 0.94, GND - 0.4, z + 7]), k.TEX * 0.8);
    }
    church(k, 10, 18, 20, 17, 12);
    tree(k, -48, 38, 28, 101);
    tufts(k, NEAR_Z, 30, 34, 67, 46);
    edgeTree(k, -1, 6, 68, 103);
  };

  const NAMES = {
    hills: "Cottage in the hills", coast: "Lighthouse coast", desert: "Desert cabin",
    forest: "Cabin in the pines", lake: "Lake and jetty", field: "Barn and bales",
    cliff: "Headland", valley: "Watermill valley", island: "Island", terrace: "Terraced hill",
  };

  const out = {};
  for (const key of Object.keys(S)) {
    out[key] = Kit.wrap(NAMES[key], () => {
      const k = Kit.rig({ f: F, vp: [50, HOR], gnd: GND });
      S[key](k);
      const o = k.done();
      o.frame = FRAME;
      return o;
    }, { w: 0.94, h: 0.8 }, 0.17);
    out[key].clip = true;
  }
  out._keys = Object.keys(S);
  return out;
})();
