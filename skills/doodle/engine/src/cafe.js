/*
 * THE CAFÉ STREET — a lively scene, in two-point perspective like the
 * buildings, in the approved register (heavy line, flat colour, black for
 * contrast, shadow as a darker fill).
 *
 * Reference: a small mustard café (Pinterest 29a30b31…), measured:
 *   facade lit #DDB772 / avg #D19B3B   door #D9931C   stools #ECD3A4
 *   table #917047                      brick pavement #A69E8D / #97765C
 *   planters #A57F5E                   awning: blue + white stripes
 * The identity colours are restored, not the warm-light average.
 *
 * Built on Retro's product toolkit with `cam.persp` (View.two), so every
 * part, plane and clip exports to Rive — the scene is ALSO an interactive
 * Rive file (~/Projects/cafe-rive). Export layers, back to front:
 *   L0 ground, buildings, the café, tables, customer      (static + parts)
 *   L1 walkers on the pavement lane (moving, `top`)
 *   L2 the kerb: trees, lamp, bicycle                      (in front of walkers)
 *   L3 the road: a cyclist
 *   L4 night overlay   L5 night glows
 */
window.Cafe = (function () {
  const { kit, rr, ell, circ, sector, rot, rect, note, NIB } = Retro._kit;
  const RAD = Math.PI / 180;
  const GND = 26;                       /* ground; the horizon is y = 0 */
  const CAM = { persp: { f: 600, yaw: -26, dist: 380, hor: 58, cx: 50, lift: 150 } };
  /* the block of street the diorama stands on */
  const SX0 = -80, SX1 = 78, SZ0 = -38, SZ1 = 42;

  const C = {
    mustard: "#E8B34B", ochre: "#C98F2E", door: "#D9931C", awnBlue: "#3E5FA8", awnWhite: "#F4F1EA",
    brick: "#A65A43", brickD: "#7E4433", stone: "#D9D2C3", pale: "#BFD3D6", paleD: "#9DB4B8",
    pave: "#C9A58A", paveD: "#B38D72", kerb: "#BDB8AE", road: "#5E6066", glass: "#2C3436",
    table: "#7A5C44", stool: "#E8CFA0", board: "#2A2B2E", wood: "#B8814C", planter: "#9A6A43",
    leaf: "#6E9A55", leafD: "#4F7A44", leafL: "#8DB86A", trunk: "#6E4A2E", pole: "#2F4A3A",
    skin: "#E9B48C", skinD: "#C98E66", hair: "#3A2A22", hair2: "#C9853E", coat1: "#D9483B",
    coat2: "#3E5FA8", coat3: "#6E9A55", pants: "#2E3A4E", pants2: "#5A4A3E", dog: "#C9853E",
    sky: "#FFFFFF", sun: "#F2C933", cloud: "#F4F1EA", warm: "#FFD27A", night: "#1B2440",
    pink: "#E99AB8", magenta: "#C93A6B", red: "#D9333F", white: "#FBFAF6", cup: "#FFFFFF",
    bike: "#3E8E86", basket: "#C9A06A",
  };

  /* a scalloped blob round a centre — tree crowns, clouds, flower mounds */
  function blob(cx, cy, rx, ry, n, amp, seed) {
    let q = seed || 3;
    const r = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
      const k = 1 + (r() - 0.5) * 0.12;
      for (let j = 0; j <= 4; j++) {
        const a = a0 + ((a1 - a0) * j) / 4, bump = Math.sin((j / 4) * Math.PI) * amp;
        pts.push([cx + Math.cos(a) * rx * (k + bump), cy + Math.sin(a) * ry * (k + bump)]);
      }
    }
    return pts;
  }

  /* a tapered limb as a filled ribbon from a to b */
  function limb(a, b, w0, w1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    return [[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1],
            [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]];
  }

  /*
   * A WALKER. A flat figure on the front plane at depth z, feet at (x, GND),
   * facing `dir`. Parts: arm/leg behind, legs, body (torso + head + bag),
   * arm in front — each its own part with the SAME track, so they travel
   * together and the limbs swing about hip and shoulder.
   */
  function walker(t, id, x, z, o) {
    const H = o.h || 13.6, d = o.dir || 1, pl = t.FR(z);
    const hipY = GND - H * 0.47, shY = GND - H * 0.79, headY = GND - H * 0.9;
    const tr = o.track;
    const P = (name, px, py, top) => t.part(id + "_" + name, { pivot: [px, py, z], top: true, track: tr });
    const shoe = (fx) => t.flat(pl, rot(ell(fx + d * 0.55, GND - 0.45, 1.25, 0.6, 12), 0, fx, GND), "ink", { w: 0 });
    /* back arm and back leg, a shade darker */
    /* mid-stride at rest, so the still drawing reads as walking: the back
       leg trails, the front leg reaches, each arm swings against its leg */
    const st = H * 0.11, sw = H * 0.07;
    P("armB", x, shY);
    t.flat(pl, limb([x, shY + 0.6], [x + d * sw, GND - H * 0.44], 0.85, 0.65), o.coat, { sh: 0.8 });
    P("legB", x, hipY);
    t.flat(pl, limb([x, hipY], [x - d * st, GND - 0.6], 1.15, 0.8), o.pants, { sh: 0.8 });
    shoe(x - d * st);
    P("legF", x, hipY);
    t.flat(pl, limb([x, hipY], [x + d * st, GND - 0.6], 1.15, 0.8), o.pants);
    shoe(x + d * st);
    P("body", x, GND);
    const tw = H * 0.13;
    t.flat(pl, [[x - tw, shY], [x + tw, shY], [x + tw * 1.15, hipY + H * (o.long ? 0.16 : 0.04)],
                [x - tw * 1.15, hipY + H * (o.long ? 0.16 : 0.04)]], o.coat);
    t.flat(pl, rect(x - 0.6, shY - 1.2, x + 0.6, shY + 0.2), o.skin, { w: 0 });
    const hr = H * 0.075;
    t.flat(pl, circ(x, headY, hr, 18), o.skin);
    t.flat(pl, ell(x - d * hr * 0.25, headY - hr * 0.35, hr * 1.02, hr * 0.78, 16, 180, 360)
                .concat([[x - d * hr * 1.05, headY + hr * 0.5]]), o.hair, { w: 0 });
    t.dot(pl, x + d * hr * 0.45, headY - hr * 0.05, 0.22, "ink");
    if (o.bag) {
      t.line(pl, [[x - d * 0.4, shY + 0.4], [x - d * 1.8, hipY + 1.2]], 0.6);
      t.flat(pl, rr(x - d * 3.4 - 1.6, hipY, x - d * 3.4 + 1.6, hipY + 3.4, 0.4), o.bag);
    }
    if (o.extraBody) o.extraBody(pl, x, shY, hipY, H);
    P("armF", x, shY);
    const hx = x - d * sw, hy = GND - H * 0.43;
    t.flat(pl, limb([x, shY + 0.6], [hx, hy], 0.85, 0.65), o.coat);
    t.flat(pl, circ(hx, hy + 0.2, 0.6, 10), o.skin, { w: 0 });
    if (o.cup) {
      t.flat(pl, [[hx - 0.7, hy - 1.7], [hx + 0.7, hy - 1.7], [hx + 0.55, hy + 0.3], [hx - 0.55, hy + 0.3]], C.white);
      t.flat(pl, rect(hx - 0.72, hy - 1, hx + 0.72, hy - 0.4), C.door, { w: 0 });
    }
    t.part(null);
  }

  /* a walking track: from x0 to x1 over D frames, starting `phase` of the way
     along, with a step bob — sampled for Rive as [f, dx, dy, dz] */
  function track(xr, xa, xb, D) {
    /* rests at xr on the page; in Rive it walks xa -> xb and wraps */
    const out = [], u0 = (xr - xa) / (xb - xa), n = 30;
    let prev = null;
    for (let f = 0; f <= D; f += n) {
      const u = (u0 + f / D) % 1, dx = xa + (xb - xa) * u - xr;
      if (prev != null && Math.sign(xb - xa) * (dx - prev) < 0) {
        const fw = Math.round(((1 - u0) % 1) * D);           /* the wrap frame */
        out.push([fw, xb - xr, 0, 0], [fw + 1, xa - xr, 0, 0]);
      }
      out.push([f, dx, 0, 0]);
      prev = dx;
    }
    return out.sort((a, b) => a[0] - b[0]);
  }

  /* block letters, stroked, for the fascia */
  const GLYPH = {
    C: [[[3, 0], [0, 0], [0, 5], [3, 5]]],
    A: [[[0, 5], [1.5, 0], [3, 5]], [[0.6, 3.2], [2.4, 3.2]]],
    F: [[[3, 0], [0, 0], [0, 5]], [[0, 2.4], [2.2, 2.4]]],
    E: [[[3, 0], [0, 0], [0, 5], [3, 5]], [[0, 2.4], [2.2, 2.4]]],
    O: [[[0, 0], [3, 0], [3, 5], [0, 5], [0, 0]]],
    P: [[[0, 5], [0, 0], [3, 0], [3, 2.6], [0, 2.6]]],
    N: [[[0, 5], [0, 0], [3, 5], [3, 0]]],
    L: [[[0, 0], [0, 5], [3, 5]]],
    U: [[[0, 0], [0, 5], [3, 5], [3, 0]]],
    S: [[[3, 0], [0, 0], [0, 2.5], [3, 2.5], [3, 5], [0, 5]]],
    I: [[[1.5, 0], [1.5, 5]]],
  };
  function word(t, pl, str, u, v, sc, w, track) {
    [...str].forEach((ch, i) => {
      for (const s of GLYPH[ch] || []) t.line(pl, s.map(([a, b]) => [u + (i * (track || 4.4) + a) * sc, v + b * sc]), w);
    });
  }

  function scene(t) {
    const k = t.k;
    const G = (x, z) => [x, GND, z];

    /* ── L0 · sky ─────────────────────────────────────────────────── */
    /* the sky floats over the block: sun, clouds, birds hang above it */
    /* sky things face the camera (the screen's x axis, in the world), so a
       sun is a circle, not an ellipse on a wall */
    const ya = CAM.persp.yaw * RAD, SKZ = 30, SUN = [66, -78];
    const facing = (z) => t.plane([0, 0, z], [Math.cos(ya), 0, Math.sin(ya)], [0, 1, 0]);
    const sky = facing(SKZ);
    t.part("sun", { pivot: sky.at(SUN[0], SUN[1]) });
    t.flat(sky, circ(SUN[0], SUN[1], 8, 30), C.sun);
    for (let i = 0; i < 8; i++) {
      const a = i * 45 * RAD;
      t.line(sky, [[SUN[0] + Math.cos(a) * 11, SUN[1] + Math.sin(a) * 11], [SUN[0] + Math.cos(a) * 14, SUN[1] + Math.sin(a) * 14]], k.DET);
    }
    t.part(null);
    [[-46, -70, 13, 5, 5, 0], [6, -84, 11, 4.4, 9, 1]].forEach(([cx, cy, rx, ry, sd, i]) => {
      t.part("cloud" + i, { pivot: sky.at(cx, cy), track: [[0, 0, 0, 0], [600, 14, 0, 0], [1200, 0, 0, 0]] });
      t.flat(sky, blob(cx, cy, rx, ry, 7, 0.22, sd).filter((p) => p[1] <= cy + ry * 0.7), C.cloud);
      t.part(null);
    });

    /* ── L0 · the ground ──────────────────────────────────────────── */
    /* the block: soil under a thin crust, its two near faces showing */
    t.box(SX0, GND, SZ0, SX1, GND + 9, SZ1, "#8E6A4E", { w: k.OUT });
    t.line(t.FR(SZ0), [[SX0, GND + 2.2], [SX1, GND + 2.2]], 0.5);
    t.line(t.RT(SX0), [[SZ0, GND + 2.2], [SZ1, GND + 2.2]], 0.5);
    for (const [u, v] of [[-60, 5], [-20, 6.5], [15, 4.6], [50, 6.8], [-42, 7.4]]) t.flat(t.FR(SZ0), ell(u, GND + v, 1.4, 0.7, 10), "#6E5038", { w: 0 });
    const top = t.TOP(GND);
    t.flat(top, rect(SX0, SZ0, SX1, -20), C.road, { w: 0 });
    for (let x = SX0 + 6; x < SX1 - 8; x += 18) t.flat(top, rect(x, -29.6, x + 9, -28.6), C.white, { w: 0 });
    t.flat(top, rect(SX0, 0, SX1, SZ1), "#8DB86A", { w: 0 });
    t.box(SX0, GND - 1.2, -21, SX1, GND, -19, C.kerb, { w: k.DET, wc: k.TEX });
    const pave = t.TOP(GND - 1.2);
    t.flat(pave, rect(SX0, -19, SX1, 0), C.pave, { w: 0 });
    for (let z = -17; z < 0; z += 2.2) t.line(pave, [[SX0, z], [SX1, z]], 0.32);
    for (let r = 0; r < 9; r++) {
      const z0 = -19 + r * 2.2;
      for (let x = SX0 + 2 + (r % 2) * 2.5; x < SX1; x += 5) t.line(pave, [[x, z0], [x, z0 + 2.2]], 0.28);
    }

    /* ── L0 · neighbours ──────────────────────────────────────────── */
    /* right: a pale blue-grey block with a slate shopfront */
    t.box(22, -34, 0, 66, GND - 1.2, 34, C.pale);
    const br = t.FR(0);
    t.box(20.8, -37, -1.6, 67.2, -34, 35.6, C.white, { w: k.DET });
    t.box(46, -42, 18, 58, -37, 28, "#9DB4B8", { w: k.DET });
    t.tower(circ(32, 22, 3.4, 18), -37, 7, "#B8814C", { w: k.DET });
    for (const v of [-28, -10]) for (const x of [30, 44, 58]) {
      t.flat(br, rr(x - 3.6, v, x + 3.6, v + 11, [3.6, 3.6, 0, 0]), C.white, { w: k.DET });
      t.flat(br, rr(x - 2.6, v + 1, x + 2.6, v + 10, [2.6, 2.6, 0, 0]), C.glass, { w: 0 });
      t.flat(br, rect(x - 0.3, v + 1, x + 0.3, v + 10), C.white, { w: 0 });
    }
    t.flat(br, rect(26, 5, 62, GND - 1.2), "#4A5560", { w: k.DET });
    t.flat(br, rect(28, 8, 43, GND - 3), C.glass, { w: k.TEX });
    t.flat(br, rect(45, 8, 60, GND - 3), C.glass, { w: k.TEX });
    t.flat(br, sector(37, 16, 3, 4, 200, 250), C.white, { w: 0 });

    /* ── L0 · THE CAFÉ ────────────────────────────────────────────── */
    const TOPY = GND - 42;
    const F = t.FR(0);
    t.box(-22, TOPY, 0, 22, GND - 1.2, 34, C.mustard);
    for (let y = TOPY + 3; y < GND - 2; y += 3) t.line(F, [[-22, y], [22, y]], 0.3);
    t.box(-23.4, TOPY - 2.4, -1.8, 23.4, TOPY, 35.8, C.ochre, { w: k.DET });
    t.box(-12, TOPY - 6.4, 14, -2, TOPY - 2.4, 22, "#9C9C98", { w: k.DET });
    t.box(6, TOPY - 3.6, 10, 16, TOPY - 2.4, 20, "#BFD3D6", { w: k.DET });
    /* fascia lettering */
    word(t, F, "CAFE", -12.4, TOPY + 4.6, 1.3, k.OUT * 1.5, 4.8);
    t.flat(F, rect(-6, TOPY + 13.4, 6, TOPY + 14), C.board, { w: 0 });
    /* blade sign with a cup on it */
    t.line3([[19.6, TOPY + 6, 0], [19.6, TOPY + 6, -9.2]], 0.8, { curve: false });
    t.raise(t.RT(20), rr(-8.8, TOPY + 6.6, -1.2, TOPY + 14.8, 1.2), 0.6, C.white);
    const sg = t.RT(19.3);
    t.flat(sg, rr(-6.6, TOPY + 9.4, -3.4, TOPY + 12.8, [0, 0, 1.2, 1.2]), C.awnBlue, { w: t.k.TEX });
    t.flat(sg, ell(-2.9, TOPY + 10.8, 0.8, 0.9, 10, 270, 450), null, { w: t.k.TEX });
    t.line(sg, [[-5.6, TOPY + 8.6], [-5.2, TOPY + 7.8]], 0.4);
    /* the window: frame, four dark panes, two warm pendant lamps */
    t.flat(F, rect(1, 1, 19, 20.5), C.ochre);
    const panes = [[2, 2, 9.6, 10.6], [10.4, 2, 18, 10.6], [2, 11.4, 9.6, 19.5], [10.4, 11.4, 18, 19.5]];
    panes.forEach((p) => t.flat(F, rect(...p), C.glass, { w: k.TEX }));
    for (const x of [6, 14]) {
      t.line(F, [[x, 2], [x, 5.2]], 0.4);
      t.flat(F, ell(x, 6, 1.4, 0.9, 12, 180, 360), C.warm, { w: 0 });
    }
    t.box(0.4, 20.5, -1.4, 19.6, 21.6, 0, C.ochre, { w: k.TEX, wc: 0 });
    /* the doorway: a warm interior behind the door */
    t.flat(F, rect(-16, 3, -4, GND - 1.2), C.ochre, { w: k.DET });
    t.flat(F, rect(-15, 4, -5, GND - 1.2), "#5A3E2A", { w: 0 });
    t.flat(F, rect(-13.5, 12, -9.5, GND - 1.2), "#7A5A3E", { w: 0 });
    t.flat(F, ell(-10, 7, 1.3, 0.8, 10, 180, 360), C.warm, { w: 0 });
    const dp = t.FR(-0.2);
    t.part("door", { plane: dp, at: [-15, 4] });
    t.flat(dp, rect(-15, 4, -5, GND - 1.2), C.door);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++)
      t.flat(dp, rect(-13.8 + c * 4.3, 5.4 + r * 4.3, -10.2 + c * 4.3, 8.9 + r * 4.3), C.glass, { w: 0 });
    t.flat(dp, rect(-13.8, 19, -6.2, GND - 2.8), C.door, { w: k.TEX, sh: 0.9 });
    t.dot(dp, -6.3, 13, 0.45, "ink");
    t.flat(dp, rr(-12.8, 10, -7.2, 12.4, 0.4), C.white, { w: t.k.TEX });
    word(t, dp, "OPEN", -12.2, 10.55, 0.27, 0.32, 4.6);
    t.part(null);
    t.line(F, [[-10, 3], [-10, 1.5]], 0.4);
    t.flat(F, ell(-10, 1.4, 1.6, 0.9, 12), C.white, { w: k.TEX });

    /* the AWNING: striped slope + scalloped valance */
    const aw0 = -2.6, aw1 = 1.4, out = -9;
    const slope = t.plane([-22, aw0, 0], [1, 0, 0], [0, (aw1 - aw0), out]);
    for (let i = 0; i < 11; i++) {
      const u0 = -1 + i * 4.18, u1 = u0 + 4.18;
      t.flat(slope, [[u0, 0], [u1, 0], [u1 + 0.2, 1], [u0 - 0.1, 1]], i % 2 ? C.awnWhite : C.awnBlue, { w: 0 });
    }
    t.flat(slope, [[-1, 0], [45, 0], [45.2, 1], [-1.1, 1]], null, { w: k.DET });
    const val = t.FR(out);
    for (let i = 0; i < 11; i++) {
      const x0 = -23 + i * 4.18, x1 = x0 + 4.18;
      const sh = [[x0, aw1], [x1, aw1]].concat(ell((x0 + x1) / 2, aw1 + 2.6, 2.09, 1.3, 8, 0, 180));
      t.flat(val, sh, i % 2 ? C.awnWhite : C.awnBlue, { w: 0 });
    }
    t.line(val, [[-23, aw1], [23, aw1]], k.DET);
    t.line(val, [].concat(
      Array.from({ length: 11 }, (_, i) => ell(-23 + i * 4.18 + 2.09, aw1 + 2.6, 2.09, 1.3, 8, 180, 0)).flat()), k.DET);
    t.line(val, [[-23, aw1], [-23, aw1 + 2.6]], k.DET);
    t.line(val, [[23, aw1], [23, aw1 + 2.6]], k.DET);

    /* planter box under the window, full of flowers */
    t.box(1, GND - 5.5, -4, 19, GND - 1.2, -1, C.planter, { w: k.DET });
    const fp = t.FR(-2.5);
    t.flat(fp, blob(10, GND - 6.4, 9.6, 2.6, 9, 0.18, 7).filter((p) => p[1] < GND - 5), C.leaf);
    let q = 11;
    const rn = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const x = 1.6 + rn() * 16.8, y = GND - 6.6 - rn() * 2.4;
      t.flat(fp, circ(x, y, 0.75, 8), [C.pink, C.magenta, C.red, C.white][i % 4], { w: 0.35 });
    }
    /* string lights from the cornice out to the lamp post */
    const bulbs = [];
    const cat = (u) => { const x = 22 + u * (44 - 22), y = TOPY + 2 + (Math.sin(u * Math.PI) * 6) + u * 6, z = -u * 17.5; return [x, y, z]; };
    t.line3(Array.from({ length: 13 }, (_, i) => cat(i / 12)), 0.55);
    for (let i = 1; i < 12; i++) { const p = cat(i / 12); bulbs.push(p); t.ball([p[0], p[1] + 0.9, p[2]], 0.7, C.white, 0.4); }

    /* ── the brick neighbour LAST: it hides the café's side wall ───── */
    /* left: three storeys of brick */
    t.box(-70, -42, 0, -22, GND - 1.2, 34, C.brick);
    const bl = t.FR(0);
    t.box(-71.5, -45, -1.6, -20.5, -42, 35.6, C.stone, { w: k.DET });
    t.box(-62, -52, 14, -56, -45, 20, C.brickD, { w: k.DET });
    t.box(-62.8, -53.4, 13.2, -55.2, -52, 20.8, C.stone, { w: k.DET });
    t.box(-40, -48.5, 8, -30, -45, 16, "#9C9C98", { w: k.DET });
    /* its side wall shows over the block's edge: two windows */
    const bs = t.RT(-70);
    for (const v of [-34, -16]) for (const z of [9, 24]) {
      t.flat(bs, rect(z - 3.5, v, z + 3.5, v + 10), C.stone, { w: k.DET });
      t.flat(bs, rect(z - 2.6, v + 1, z + 2.6, v + 9), C.glass, { w: 0 });
    }
    for (const v of [-34, -16]) for (const x of [-62, -48, -34]) {
      t.flat(bl, rect(x - 4, v, x + 4, v + 10), C.stone, { w: k.DET });
      t.flat(bl, rect(x - 3, v + 1, x - 0.4, v + 4.6), C.glass, { w: 0 });
      t.flat(bl, rect(x + 0.4, v + 1, x + 3, v + 4.6), C.glass, { w: 0 });
      t.flat(bl, rect(x - 3, v + 5.4, x - 0.4, v + 9), C.glass, { w: 0 });
      t.flat(bl, rect(x + 0.4, v + 5.4, x + 3, v + 9), C.glass, { w: 0 });
      t.box(x - 4.6, v + 10, -1.2, x + 4.6, v + 11, 0, C.stone, { w: k.TEX, wc: 0 });
    }
    for (let y = -40; y < GND - 2; y += 2.4) t.line(bl, [[-70, y], [-22, y]], 0.22);
    /* its shop: a dark green awning over a shutter */
    t.flat(bl, rect(-66, 4, -26, GND - 1.2), C.stone, { w: k.DET });
    t.flat(bl, rect(-63, 9, -29, GND - 1.2), "#8E9196", { w: k.DET });
    for (let y = 10.5; y < GND - 1.5; y += 1.4) t.line(bl, [[-63, y], [-29, y]], 0.3);
    t.prism([[-66, 3, 0], [-26, 3, 0], [-26, 3, -5.5], [-66, 3, -5.5]], [0, 3.6, 0], "#3F6B4E", { w: k.DET });

    /* ── L0 · pavement furniture behind the walker lane ────────────── */
    /* chalkboard A-frame */
    const cb = t.FR(-8);
    t.line3([[-19, GND - 1.2, -9.5], [-18, GND - 11, -8]], k.DET);
    t.flat(cb, [[-21.6, GND - 1.2], [-20.2, GND - 11.5], [-15.8, GND - 11.5], [-14.4, GND - 1.2]], C.wood);
    t.flat(cb, [[-20.6, GND - 2.6], [-19.6, GND - 10.4], [-16.4, GND - 10.4], [-15.4, GND - 2.6]], C.board, { w: 0 });
    for (const [y, a, b] of [[-9.2, -19.2, -16.8], [-7.6, -19.4, -17.6], [-6.2, -19.6, -16.4], [-4.6, -19.8, -17.2]])
      t.flat(cb, rect(a, GND + y, b, GND + y + 0.35), C.white, { w: 0 });
    /* two bistro tables, stools, a customer with a coffee */
    const table = (x, z) => {
      t.line3([[x, GND - 1.2, z], [x, GND - 6.2, z]], 0.9, { curve: false });
      t.tower(circ(x, z, 1.4, 12), GND - 1.2, 0.3, C.table, { w: k.TEX, wc: 0 });
      t.tower(circ(x, z, 3.4, 26), GND - 6.2, 0.5, C.table, { w: k.DET });
    };
    const stool = (x, z) => {
      for (const [dx, dz] of [[-0.9, 0.5], [0.9, 0.5], [0, -0.9]]) t.line3([[x + dx * 0.5, GND - 4.4, z + dz * 0.5], [x + dx, GND - 1.2, z + dz]], 0.6, { curve: false });
      t.tower(circ(x, z, 1.5, 16), GND - 4.4, 0.6, C.stool, { w: k.DET, wc: k.TEX });
    };
    stool(-9, -6); table(-4, -8); stool(1, -9.5);
    stool(7, -7.5);
    /* the customer, seated on the far stool of the right table */
    const cz = -6.8, cx = 15.5, cp = t.FR(cz);
    t.flat(cp, limb([cx - 0.4, GND - 4.8], [cx - 3.4, GND - 4.4], 1.1, 1), C.pants2);
    t.flat(cp, limb([cx - 3.4, GND - 4.4], [cx - 3.6, GND - 1.4], 0.9, 0.75), C.pants2);
    t.flat(cp, ell(cx - 4.1, GND - 1.1, 1.2, 0.55, 10), "ink", { w: 0 });
    t.tower(circ(cx, cz + 0.6, 1.5, 16), GND - 4.4, 0.6, C.stool, { w: k.DET, wc: k.TEX });
    t.line3([[cx, GND - 4.4, cz + 0.6], [cx, GND - 1.2, cz + 0.6]], 0.6, { curve: false });
    t.flat(cp, [[cx - 1.8, GND - 11], [cx + 1.6, GND - 11], [cx + 1.8, GND - 4.6], [cx - 1.8, GND - 4.6]], C.coat3);
    t.flat(cp, circ(cx, GND - 12.6, 1.05, 16), C.skin);
    t.flat(cp, ell(cx + 0.3, GND - 13, 1.15, 0.8, 14, 180, 360).concat([[cx + 1.2, GND - 12]]), C.hair2, { w: 0 });
    t.dot(cp, cx - 0.55, GND - 12.7, 0.18, "ink");
    t.part("sip", { pivot: [cx - 0.4, GND - 10.4, cz] });
    t.flat(cp, limb([cx - 0.4, GND - 10.4], [cx - 2.6, GND - 8], 0.6, 0.5), C.coat3);
    t.part(null);
    table(11, -8.5);
    const cupAt = [10.2, GND - 6.7, -9.2];
    t.part("cup", { pivot: cupAt });
    t.tower(circ(cupAt[0], cupAt[2], 0.9, 12), GND - 6.7, 1.3, C.cup, { w: k.TEX, wc: k.TEX });
    t.part(null);
    t.tower(circ(12.6, -7.8, 1.1, 12), GND - 6.7, 0.2, C.white, { w: k.TEX, wc: 0 });
    t.extra(() => {
      for (let i = 0; i < 3; i++) {
        t.part("steam" + i, { pivot: [cupAt[0] - 0.6 + i * 0.6, GND - 8.6, cupAt[2]], top: true });
        const sx = cupAt[0] - 0.6 + i * 0.6;
        t.line(t.FR(cupAt[2]), [[sx, GND - 8.4], [sx + 0.5, GND - 9.4], [sx - 0.3, GND - 10.4], [sx + 0.3, GND - 11.4]], 0.45, { curve: true });
      }
      t.part(null);
    });
    stool(-4.5, -12.5);

    /* ── night, part one: dark over the street, the glows above it —
       still BELOW the walkers and trees, so they pass in front of a lit
       window instead of under its glow ───────────────────────────── */
    t.extra(() => {
      t.part("night", { pivot: [0, 0, 0], top: true });
      t.flat(t.FR(150), rect(-300, -300, 300, 160), C.night, { w: 0 });
      t.part(null);
    });
    t.extra(() => {
      t.part("glow", { pivot: [0, 0, 0], top: true });
      panes.forEach((p) => t.flat(F, rect(...p), C.warm, { w: 0 }));
      for (const x of [6, 14]) t.flat(F, ell(x, 6, 1.6, 1.1, 12, 180, 360), "#FFF1C2", { w: 0 });
      t.flat(t.FR(-17.5), circ(44, GND - 34.2, 5.5, 26), "#FFE39A", { w: 0 });
      t.flat(t.FR(-17.5), [[42.6, GND - 32.6], [45.4, GND - 32.6], [45, GND - 35.8], [43, GND - 35.8]], "#FFF8DD", { w: 0 });
      for (const p of bulbs) t.flat(t.FR(p[2]), circ(p[0], p[1] + 0.9, 1.1, 12), "#FFE07A", { w: 0 });
      t.flat(br, rect(28, 8, 43, GND - 3), "#E9C77A", { w: 0 });
      t.flat(br, rect(45, 8, 60, GND - 3), "#E9C77A", { w: 0 });
      t.part("moon", { pivot: sky.at(SUN[0], SUN[1]), top: true });
      t.flat(sky, circ(SUN[0], SUN[1], 7.4, 30), "#F4F1EA");
      t.flat(sky, circ(SUN[0] + 3.2, SUN[1] - 2.3, 6.6, 30), "#767C8C", { w: 0 });
      for (const [sx, sy] of [[-70, -80], [-30, -92], [20, -70], [40, -96], [-56, -56], [84, -60], [0, -98]])
        t.flat(sky, rot([[sx, sy - 1.6], [sx + 0.45, sy], [sx, sy + 1.6], [sx - 0.45, sy]], 0, sx, sy).concat([]), "#FFF6C8", { w: 0 });
      t.part(null);
    });

    /* ── L1 · walkers ─────────────────────────────────────────────── */
    t.layer();
    const D = 1200, LANE = -14;
    walker(t, "w1", -38, LANE, { dir: 1, coat: C.coat1, pants: C.pants, skin: C.skin, hair: C.hair,
      bag: C.basket, long: true, track: track(-38, SX0 + 5, SX1 - 5, D) });
    walker(t, "w2", 20, LANE - 1.2, { dir: -1, coat: C.coat2, pants: C.pants2, skin: C.skinD, hair: C.hair,
      cup: true, h: 14.4, track: track(20, SX1 - 5, SX0 + 5, D) });
    /* two more, resting off the page: in Rive they keep the pavement busy */
    t.extra(() => {
      walker(t, "w4", -60, LANE - 2.4, { dir: 1, coat: "#C94A9A", pants: C.pants, skin: C.skinD, hair: C.hair,
        long: true, h: 13.2, track: track(-60, SX0 + 5, SX1 - 5, D) });
      walker(t, "w5", 60, LANE + 0.6, { dir: -1, coat: "#8E9196", pants: C.pants2, skin: C.skin, hair: C.hair2,
        bag: C.awnBlue, h: 14, track: track(60, SX1 - 5, SX0 + 5, D) });
    });
    /* the dog walker and the dog, trotting ahead on a lead */
    const dogX = 48, dogTr = track(36, SX0 + 5, SX1 - 18, D);
    walker(t, "w3", 36, LANE + 1.4, { dir: 1, coat: C.coat3, pants: C.pants, skin: C.skin, hair: C.hair2,
      h: 13, track: dogTr });
    const dz = LANE + 1.6, dpl = t.FR(dz);
    const DOGP = (n, px, py, top) => t.part("dog_" + n, { pivot: [px, py, dz], top: true, track: dogTr });
    DOGP("legB", dogX - 1.4, GND - 3);
    t.flat(dpl, limb([dogX - 1.6, GND - 3], [dogX - 1.8, GND - 0.4], 0.45, 0.35), C.dog, { sh: 0.75 });
    t.flat(dpl, limb([dogX + 1.9, GND - 3], [dogX + 2.1, GND - 0.4], 0.45, 0.35), C.dog, { sh: 0.75 });
    DOGP("tail", dogX - 2.9, GND - 4.2);
    t.flat(dpl, limb([dogX - 2.9, GND - 4.2], [dogX - 4.4, GND - 6], 0.4, 0.2), C.dog);
    DOGP("body", dogX, GND - 3);
    t.flat(dpl, rr(dogX - 3.2, GND - 5, dogX + 2.6, GND - 2.6, 1.2), C.dog);
    t.flat(dpl, ell(dogX + 3.4, GND - 5.6, 1.6, 1.25, 14), C.dog);
    t.flat(dpl, ell(dogX + 4.8, GND - 5.3, 0.9, 0.6, 10), C.dog, { w: 0 });
    t.flat(dpl, ell(dogX + 2.9, GND - 5.9, 0.6, 1.1, 10), "#8E5E34", { w: 0 });
    t.dot(dpl, dogX + 5.6, GND - 5.4, 0.3, "ink");
    t.dot(dpl, dogX + 3.9, GND - 6, 0.22, "ink");
    t.line(dpl, [[dogX + 2.4, GND - 4.8], [36 - 13 * 0.07, GND - 13 * 0.43]], 0.35);
    DOGP("legF", dogX + 1.6, GND - 3);
    t.flat(dpl, limb([dogX - 1.2, GND - 3], [dogX - 1, GND - 0.4], 0.45, 0.35), C.dog);
    t.flat(dpl, limb([dogX + 1.6, GND - 3], [dogX + 1.4, GND - 0.4], 0.45, 0.35), C.dog);
    t.extra(() => {
      DOGP("woof", dogX + 6.5, GND - 7);
      for (const [a, r] of [[-40, 1.6], [-40, 2.9]]) t.line(dpl, ell(dogX + 5.6, GND - 6, r, r, 6, a - 35, a + 35), k.DET);
    });
    t.part(null);

    /* ── L2 · the kerb: trees, lamp, bicycle ──────────────────────── */
    t.layer();
    const tree = (id, x, z, R, seed) => {
      const tp = t.FR(z);
      t.tower(rect(x - 3, z - 3, x + 3, z + 3), GND - 1.2, 0.2, "#4A3A2E", { w: k.TEX, wc: 0 });
      t.flat(tp, limb([x, GND - 1.2], [x + 0.4, GND - R * 1.5], 1.3, 0.9), C.trunk);
      t.flat(tp, limb([x + 0.2, GND - R * 1.2], [x - R * 0.35, GND - R * 1.75], 0.6, 0.4), C.trunk);
      t.part(id, { pivot: [x, GND - R * 1.2, z] });
      const cy = GND - R * 2.05;
      t.flat(tp, blob(x, cy, R, R * 0.92, 9, 0.16, seed), C.leafD);
      t.flat(tp, blob(x - R * 0.12, cy - R * 0.1, R * 0.82, R * 0.74, 8, 0.18, seed + 2), C.leaf, { w: 0 });
      t.flat(tp, blob(x - R * 0.34, cy - R * 0.34, R * 0.34, R * 0.28, 5, 0.2, seed + 5), C.leafL, { w: 0 });
      for (let i = 0; i < 7; i++) {
        const a = (i * 51 + seed * 7) * RAD, r = R * (0.25 + (i % 3) * 0.2);
        const px = x + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.85;
        t.line(tp, [[px - 0.9, py + 0.5], [px, py - 0.4], [px + 0.9, py + 0.5]], 0.45);
      }
      t.part(null);
      return cy;
    };
    const tcy = tree("treeL", -44, -17.5, 13, 3);
    tree("treeR", 58, -17.5, 11, 13);
    t.extra(() => {
      for (let i = 0; i < 4; i++) {
        t.part("leaf" + i, { pivot: [-44 - 8 + i * 5, tcy + 4 + (i % 2) * 3, -17.5], top: true });
        const lx = -44 - 8 + i * 5, ly = tcy + 4 + (i % 2) * 3;
        t.flat(t.FR(-17.5), rot(ell(lx, ly, 1.1, 0.55, 10), 30 + i * 40, lx, ly), i % 2 ? C.leaf : C.leafL, { w: 0.4 });
      }
      t.part("bird", { pivot: [-44, tcy - 4, -17.5], top: true });
      t.line(t.FR(-17.5), [[-46.2, tcy - 4.6], [-45.1, tcy - 3.6], [-44, tcy - 4.4], [-42.9, tcy - 3.6], [-41.8, tcy - 4.6]], 0.7, { curve: true });
      t.part(null);
    });
    /* the lamp post, a lantern and a hanging basket */
    const lx = 44, lz = -17.5, lp = t.FR(lz);
    t.tower(circ(lx, lz, 1.2, 14), GND - 1.2, 2, C.pole, { w: k.DET });
    t.line3([[lx, GND - 3, lz], [lx, GND - 32, lz]], 1.1, { curve: false });
    t.line3([[lx, GND - 28, lz], [lx - 4, GND - 28, lz]], 0.7, { curve: false });
    t.flat(lp, [[lx - 4.6, GND - 26], [lx - 3.4, GND - 26], [lx - 2.9, GND - 23.4], [lx - 5.1, GND - 23.4]], C.planter);
    t.flat(lp, blob(lx - 4, GND - 26.6, 2.6, 1.4, 6, 0.2, 9).filter((p) => p[1] < GND - 26), C.leaf);
    for (let i = 0; i < 6; i++) t.flat(lp, circ(lx - 6 + i * 0.8, GND - 26.8 - (i % 2) * 0.8, 0.45, 8), [C.pink, C.red, C.white][i % 3], { w: 0 });
    t.flat(lp, [[lx - 2.2, GND - 32], [lx + 2.2, GND - 32], [lx + 1.6, GND - 36.5], [lx - 1.6, GND - 36.5]], C.pole);
    t.flat(lp, [[lx - 1.4, GND - 32.6], [lx + 1.4, GND - 32.6], [lx + 1, GND - 35.8], [lx - 1, GND - 35.8]], C.white, { w: 0 });
    t.flat(lp, [[lx - 2.6, GND - 36.5], [lx + 2.6, GND - 36.5], [lx, GND - 38.6]], C.pole);
    /* a bicycle with a flower basket, parked at the kerb */
    const bx = -33, bz = -17, bp = t.FR(bz), by = GND - 3.2;
    for (const wx of [bx - 4.2, bx + 4.2]) {
      t.flat(bp, circ(wx, by, 3, 26), null, { w: k.DET });
      t.flat(bp, circ(wx, by, 2.5, 22), null, { w: 0.35 });
      t.dot(bp, wx, by, 0.35);
    }
    t.line(bp, [[bx - 4.2, by], [bx - 0.8, by], [bx + 2.6, by - 3.8], [bx - 1.6, by - 3.8], [bx - 0.8, by], [bx - 2.2, by - 5]], 0.75);
    t.line(bp, [[bx + 2.6, by - 3.8], [bx + 4.2, by], [bx + 2.2, by - 6]], 0.75);
    t.part("bell", { pivot: [bx + 2.2, by - 6.3, bz] });
    t.line(bp, [[bx + 1.2, by - 6.3], [bx + 3.6, by - 6.3]], 0.8);
    t.flat(bp, rr(bx - 3.4, by - 5.6, bx - 1, by - 5, 0.3), "ink", { w: 0 });
    t.part(null);
    t.flat(bp, rr(bx + 2.4, by - 8.6, bx + 5.6, by - 6.2, 0.4), C.basket);
    for (let i = 0; i < 4; i++) t.flat(bp, circ(bx + 3 + i * 0.8, by - 8.9 - (i % 2) * 0.5, 0.45, 8), [C.pink, C.red, C.white, C.magenta][i], { w: 0 });
    t.flat(bp, limb([bx - 0.8, by], [bx + 2.6, by - 3.8], 0.25, 0.25), C.bike, { w: 0 });
    t.extra(() => {
      t.part("ring", { pivot: [bx + 3.6, by - 8, bz], top: true });
      for (const r of [2.4, 3.8, 5.2]) {
        t.line(bp, ell(bx + 3.8, by - 9.4, r, r, 6, -75, 5), k.DET);
        t.line(bp, ell(bx + 3.8, by - 9.4, r, r, 6, 175, 255), k.DET);
      }
      t.part(null);
    });

    /* ── L3 · the road: a cyclist ─────────────────────────────────── */
    t.layer();
    t.extra(() => {
      const cz2 = -27, cpl = t.FR(cz2), X = SX0 + 5, Y = GND - 3.2;
      t.part("cyclist", { pivot: [X, GND, cz2], top: true, track: [[0, 0, 0, 0], [300, 0, 0, 0], [420, SX1 - SX0 - 10, 0, 0], [421, 0, 0, 0], [900, 0, 0, 0], [1020, SX1 - SX0 - 10, 0, 0], [1021, 0, 0, 0], [1200, 0, 0, 0]] });
      for (const wx of [X - 4.4, X + 4.4]) t.flat(cpl, circ(wx, Y, 3.1, 22), null, { w: k.DET });
      t.line(cpl, [[X - 4.4, Y], [X, Y], [X + 3, Y - 4], [X - 1.4, Y - 4], [X, Y], [X - 1.8, Y - 5.4]], 0.8);
      t.line(cpl, [[X + 3, Y - 4], [X + 4.4, Y], [X + 2.6, Y - 6.2]], 0.8);
      t.flat(cpl, limb([X - 1.2, Y - 6.4], [X + 1.4, Y - 12.6], 1.2, 1.1), C.coat1);
      t.flat(cpl, circ(X + 2.1, Y - 14.2, 1.1, 14), C.skin);
      t.flat(cpl, ell(X + 2, Y - 14.6, 1.3, 1, 14, 180, 360), C.sun, { w: k.TEX });
      t.flat(cpl, limb([X - 1, Y - 6], [X + 1, Y - 2], 0.7, 0.55), C.pants);
      t.flat(cpl, limb([X + 1.2, Y - 11.6], [X + 2.8, Y - 6.6], 0.5, 0.4), C.coat1);
      t.part(null);
      /* two birds crossing the sky */
      for (let i = 0; i < 2; i++) {
        const bx0 = SX0 + i * 10, by0 = -58 - i * 7;
        t.part("birdS" + i, { pivot: sky.at(bx0, by0), top: true, track: [[0, 0, 0, 0], [1200, SX1 - SX0 - 12, -8 * i, 0]] });
        t.line(sky, [[bx0 - 2.4, by0 - 0.6], [bx0 - 1.2, by0 + 0.5], [bx0, by0 - 0.4], [bx0 + 1.2, by0 + 0.5], [bx0 + 2.4, by0 - 0.6]], 0.9, { curve: true });
      }
      t.part(null);
    });

    /* ── the end: a light dusk over everything, walkers and trees too ── */
    t.layer();
    t.extra(() => {
      t.part("night2", { pivot: [0, 0, 0], top: true });
      t.flat(t.FR(150), rect(-300, -300, 300, 160), C.night, { w: 0 });
      t.part(null);
    });
  }

  const out = {};
  out.cafe = Spec.wrap("diorama", "Café street", () => {
    const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
    k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
    const t = kit(k, CAM);
    scene(t);
    t.flush();
    const o = k.done();
    o.parts = t.parts;
    return o;
  });
  /* a diorama: no frame and no clip — the block's edges ARE the picture */
  out._keys = ["cafe"];
  out._names = { cafe: "Café street" };
  return out;
})();
