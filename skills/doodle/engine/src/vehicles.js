/*
 * FIVE VEHICLES — types none of the sets have (the café street has the only
 * bicycle), picked by construction: a step-through scooter, a three-wheeled
 * auto-rickshaw, a rounded camper van, a two-deck bus, a tractor whose rear
 * wheel is the drawing.
 *
 * Class `product` on the retro toolkit. Long axis along x, nose at +x; the yawed
 * camera sees the near side (plane z = z0, the FR plane) and the nose (RT plane
 * at +x). A WHEEL is a short cylinder — a circle base extruded across the axle —
 * so a tyre shows its tread when the camera turns; rim, hub and spokes sit on its
 * near face. Concave silhouettes (the scooter) are split into CONVEX prisms.
 * Ground y = 0, up is negative.
 */
window.Vehicles = (function () {
  const { kit, rr, ell, circ, rect } = Retro._kit;
  const K = { tyre: "#232328", rim: "#C9CCD1", hub: "#8E9196", glass: "#2E3A4E", glassL: "#5B7290", chrome: "#DCDCD8",
    mint: "#8FC1A9", mintD: "#6FA58C", seat: "#6B4532", yellow: "#F2C933", green: "#3E8E5A", canvas: "#2B2C30",
    teal: "#4F9A9A", white: "#F4F1E8", red: "#C8322F", redD: "#9E2420", cream: "#EFE6C9", tracRed: "#C2402F", black: "#1E1E22", lamp: "#FFF3C4" };
  const D = {};

  function wheel(t, cx, r, z, w, o) {
    o = o || {};
    t.prism(circ(cx, -r, r, 28).map(([x, y]) => [x, y, z]), [0, 0, w], K.tyre);
    const f = t.FR(z - 0.02);
    t.flat(f, circ(cx, -r, r * (o.rim || 0.58), 22), o.rimFill || K.rim, { w: t.k.DET });
    t.flat(f, circ(cx, -r, r * 0.2, 12), K.hub, { w: t.k.TEX });
    const n = o.spokes || 0;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; t.line(f, [[cx + Math.cos(a) * r * 0.2, -r + Math.sin(a) * r * 0.2], [cx + Math.cos(a) * r * 0.55, -r + Math.sin(a) * r * 0.55]], t.k.TEX * 0.7); }
    if (o.lugs) for (let i = 0; i < o.lugs; i++) {
      const a = (i / o.lugs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      t.line(f, [[cx + c * r * 0.86, -r + s * r * 0.86], [cx + c * r * 1.0, -r + s * r * 1.0]], t.k.DET * 1.3);
    }
  }
  const lamp = (t, pl, u, v, r) => { t.flat(pl, circ(u, v, r, 18), K.chrome, { w: t.k.DET }); t.flat(pl, circ(u, v, r * 0.72, 16), K.lamp, { w: t.k.TEX }); };

  /* 1 · Retro scooter — step-through: a bulbous rear body, a floorboard, a leg shield
     with a front fender; the gap between is the identification */
  D.scooter = (t) => {
    wheel(t, -13, 5.2, -2, 4, { spokes: 0, rim: 0.62 });
    /* the bulbous rear body: a sampled convex curve, not 8 facets (it read as cut from card) */
    const body = ell(-10, -6.2, 11, 13.6, 24, 180, 360).map(([x, y]) => [x, y, -6]).concat([[1, -6.2, -6], [-21, -6.2, -6]].slice(0, 0));
    t.prism(body, [0, 0, 12], K.mint);
    t.prism(rr(-18, -23, -2, -20, [2, 2, 0.6, 0.6]).map(([x, y]) => [x, y, -4.2]), [0, 0, 8.4], K.seat);
    t.line(t.FR(-6.02), [[-15, -11], [-5, -11]], t.k.TEX);
    t.flat(t.FR(-6.02), rr(-12, -16, -7, -13.6, 1), K.chrome, { w: t.k.TEX });
    t.box(-2, -7.4, -5.2, 10, -5.2, 5.2, K.mintD);
    for (let x = 0; x < 9; x += 2) t.line(t.TOP(-7.41), [[x, -4.4], [x, 4.4]], t.k.TEX * 0.6);
    wheel(t, 16, 5.2, -2, 4, { rim: 0.62 });
    t.prism([[11, -6.4, -5.2], [21, -6.4, -5.2], [20.4, -9.4, -5.2], [16, -11.6, -5.2], [12, -10.4, -5.2]], [0, 0, 10.4], K.mint);
    /* the leg shield: a smooth convex sweep from the floor up to the headset */
    const shield = [];
    for (let i = 0; i <= 10; i++) { const tt = i / 10; shield.push([8 + 4.6 * Math.sin(tt * Math.PI / 2) + tt * 1.6, -6 - 24 * tt, -5.2]); }
    for (let i = 10; i >= 0; i--) { const tt = i / 10; shield.push([8.2 + 1.8 * tt * tt, -6.4 - 23.4 * tt, -5.2]); }
    t.prism(shield.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.3), [0, 0, 10.4], K.mint);
    t.box(10, -32.4, -2, 15, -29, 2, K.mint, { r: 0.8 });
    t.box(9, -33.6, -10, 14, -32.2, 10, K.chrome, { r: 0.6 });
    [-10, 10].forEach((z) => t.box(9.6, -34, z - 1.2, 12.6, -32.8, z + 1.2, K.black, { r: 0.4 }));
    lamp(t, t.RT(15.02), 0, -30.6, 1.7);
    [-1, 1].forEach((s) => { t.line3([[11, -33.6, s * 7], [11, -38, s * 9.4]], t.k.DET); t.ball([11, -38.6, s * 9.6], 1.2, K.chrome); });
    t.flat(t.FR(-5.24), rr(9.4, -18, 12.6, -15.6, 0.6), K.chrome, { w: t.k.TEX });
    t.line3([[-6, -5.4, -6.4], [-8.6, 0, -8]], t.k.DET);
  };

  /* 2 · Auto-rickshaw — three wheels, an open passenger side, a canvas canopy, a windscreen */
  D.rickshaw = (t) => {
    wheel(t, -11, 4.6, 6, 3, {});
    t.box(-17, -15, -8, 9, -4.6, 8, K.green, { r: 1.2 });
    const side = t.FR(-8.02);
    t.flat(side, rr(-15, -14, -1, -5.6, 1.2), "#1F2522", { w: t.k.DET });
    t.flat(side, rr(-14, -12.6, -4, -9.6, 1), K.seat, { w: t.k.TEX });
    t.box(9, -16, -6, 16, -4.6, 6, K.green, { r: 1.2 });
    wheel(t, 13, 4.6, -1.5, 3, {});
    t.prism([[9, -4.6, -4], [17, -4.6, -4], [17, -9, -4], [12, -11, -4]], [0, 0, 8], K.green);
    [[-16.4, -7.6], [-16.4, 7.6], [8.6, -7.6], [8.6, 7.6]].forEach(([x, z]) => t.box(x - 0.5, -32, z - 0.5, x + 0.5, -15, z + 0.5, K.black));
    t.prism([[-18, -31, -9], [12, -31, -9], [15.6, -28.6, -9], [15.6, -27, -9], [-18, -27, -9]], [0, 0, 18], K.yellow);
    t.line(t.FR(-9.02), [[-16, -29], [12, -29]], t.k.TEX);
    const ws = t.RT(15.62);
    t.flat(ws, rect(-5.6, -26.6, 5.6, -17), K.glassL, { w: t.k.DET });
    t.line(ws, [[-4, -25], [-1, -22]], t.k.TEX); t.line(ws, [[0, -25.6], [3.4, -22]], t.k.TEX);
    t.flat(t.RT(16.02), rr(-3.4, -15, 3.4, -11.6, 0.8), K.yellow, { w: t.k.DET });
    lamp(t, t.RT(17.02), 0, -8.2, 1.4);
    t.box(15.6, -17.2, -7.4, 16.6, -16.4, 7.4, K.chrome);
    [-7, 7].forEach((z) => t.ball([16.4, -17.8, z], 0.9, K.black));
    t.box(-18, -6, -7.6, -17, -5, 7.6, K.chrome);
    wheel(t, -11, 4.6, -9, 3, {});
  };

  /* 3 · Camper van — a rounded box, two-tone with a V at the nose, split windscreen, roof rack */
  D.camper = (t) => {
    wheel(t, -14, 4.8, 7, 3, {});
    wheel(t, 13, 4.8, 7, 3, {});
    t.prism(rr(-25, -30, 23, -4.4, [3, 7, 2, 2]).map(([x, y]) => [x, y, -9]), [0, 0, 18], K.teal);
    const s = t.FR(-9.02), n = t.RT(23.02);
    t.flat(s, [[-24, -16], [-24, -27], [-22, -29.4], [18, -29.4], [20, -26], [20, -16]], K.white, { w: t.k.TEX });
    [[-21, -11], [-9, 1], [3, 15]].forEach(([a, b]) => t.flat(s, rr(a, -26.6, b, -19.6, 0.8), K.glass, { w: t.k.DET }));
    t.line(s, [[-8.6, -15.6], [-8.6, -5]], t.k.DET); t.line(s, [[3.4, -15.6], [3.4, -5]], t.k.DET);
    t.flat(s, rr(-7, -11.6, -5, -10.6, 0.4), K.chrome, { w: 0 });
    t.flat(n, [[-8.4, -16], [-8.4, -28], [8.4, -28], [8.4, -16], [0, -9.6]], K.white, { w: t.k.TEX });
    t.flat(n, rr(-7.6, -27, -0.6, -20.4, 1), K.glass, { w: t.k.DET });
    t.flat(n, rr(0.6, -27, 7.6, -20.4, 1), K.glass, { w: t.k.DET });
    t.flat(n, circ(0, -14, 2.2, 18), K.chrome, { w: t.k.DET });
    t.flat(n, circ(0, -14, 1.4, 14), K.white, { w: t.k.TEX });
    [-6, 6].forEach((z) => lamp(t, n, z, -11.4, 1.9));
    t.box(22.6, -6.4, -9.4, 24.2, -4.6, 9.4, K.chrome, { r: 0.4 });
    t.box(-26, -6.4, -9.4, -24.6, -4.6, 9.4, K.chrome, { r: 0.4 });
    t.box(-18, -33.6, -6.4, 12, -32, 6.4, K.black);
    t.box(-14, -36.6, -4, -4, -33.6, 4, "#C08A55", { r: 0.6 });
    t.box(-2, -35.6, -3, 6, -33.6, 3, "#8E5E34", { r: 0.6 });
    t.ball([22.2, -27, -8.4], 0.9, K.chrome);
    wheel(t, -14, 4.8, -10, 3, {});
    wheel(t, 13, 4.8, -10, 3, {});
  };

  /* 4 · Double-decker bus — two decks of windows are the read; a cream band between them */
  D.bus = (t) => {
    wheel(t, -19, 5.6, 7, 3.4, {});
    wheel(t, 16, 5.6, 7, 3.4, {});
    t.prism(rr(-32, -50, 27, -4, [4, 5, 2, 2]).map(([x, y]) => [x, y, -10]), [0, 0, 20], K.red);
    const s = t.FR(-10.02), n = t.RT(27.02);
    t.flat(s, rect(-31.6, -29, 26.6, -26.6), K.cream, { w: t.k.TEX });
    for (let i = 0; i < 7; i++) t.flat(s, rr(-29 + i * 7.6, -46, -23 + i * 7.6, -32, 1.2), K.glass, { w: t.k.DET });
    for (let i = 0; i < 5; i++) t.flat(s, rr(-29 + i * 7.6, -24, -23 + i * 7.6, -13, 1.2), K.glass, { w: t.k.DET });
    t.flat(s, rect(9.4, -24, 15.6, -5), K.glassL, { w: t.k.DET });
    t.line(s, [[12.5, -24], [12.5, -5]], t.k.DET);
    t.flat(s, rect(-31.6, -9, 26.6, -7.4), K.redD, { w: 0 });
    t.flat(n, rect(-8.6, -46, 8.6, -34), K.glass, { w: t.k.DET });
    t.line(n, [[0, -46], [0, -34]], t.k.DET);
    t.flat(n, rect(-7, -49.4, 7, -47), K.black, { w: t.k.TEX });
    t.line(n, [[-5, -48.2], [-1, -48.2]], t.k.TEX * 0.8, { }); t.line(n, [[1, -48.2], [4.4, -48.2]], t.k.TEX * 0.8);
    t.flat(n, rect(-9.4, -29, 9.4, -26.6), K.cream, { w: t.k.TEX });
    t.flat(n, rect(-8.6, -24, 8.6, -14), K.glass, { w: t.k.DET });
    t.line(n, [[0, -24], [0, -14]], t.k.DET);
    t.flat(n, rr(-4.6, -12, 4.6, -7.4, 0.6), K.chrome, { w: t.k.DET });
    for (let z = -3.6; z < 4; z += 1.4) t.line(n, [[z, -11.6], [z, -7.8]], t.k.TEX * 0.6);
    [-7.4, 7.4].forEach((z) => lamp(t, n, z, -9.6, 1.5));
    t.box(26.4, -5.4, -10.4, 28, -4, 10.4, K.black);
    wheel(t, -19, 5.6, -10.6, 3.4, {});
    wheel(t, 16, 5.6, -10.6, 3.4, {});
  };

  /* 5 · Tractor — the huge lugged rear wheel IS the tractor; small front wheel, hood, stack, open seat */
  D.tractor = (t) => {
    /* far wheels first (z > 0, behind the body), then the body, then each near FENDER
       and its near WHEEL in front of it — first draft had both wheels on the far side,
       so the fender dome hid the one thing that makes it a tractor */
    wheel(t, -9, 11.5, 6, 5, { lugs: 22, rim: 0.5, rimFill: K.yellow });
    wheel(t, 15, 5.8, 4, 3, { lugs: 14, rim: 0.5, rimFill: K.yellow });
    t.box(-6, -19, -5, 21, -8.6, 5, K.tracRed, { r: 1.4 });
    const nose = t.RT(21.02), side = t.FR(-5.02);
    t.flat(nose, rr(-3.8, -17.6, 3.8, -10, 0.8), K.black, { w: t.k.DET });
    for (let v = -16.6; v < -10.4; v += 1.2) t.line(nose, [[-3.2, v], [3.2, v]], t.k.TEX * 0.6);
    [-3.6, 3.6].forEach((z) => lamp(t, nose, z, -19.6, 1.1));
    for (let x = 0; x < 19; x += 3) t.line(side, [[x, -17], [x, -11]], t.k.TEX * 0.7);
    t.box(-6, -8.6, -4, 18, -6.6, 4, K.black);
    t.tower(circ(13, 0, 0.9, 12), -19, 9, K.black);
    t.tower(circ(13, 0, 1.4, 12), -28, 1, K.black);
    t.box(-14, -27, -3.6, -6, -25, 3.6, K.black, { r: 0.8 });
    t.box(-14.6, -33, -3.6, -12.8, -27, 3.6, K.black, { r: 0.6 });
    t.line3([[-4, -19, 0], [-1, -28, 0]], t.k.OUT * 1.4);
    t.prism(ell(-1, -28.6, 3.4, 0.8, 16).map(([x, y]) => [x, y, -3.4]), [0, 0, 0.1], K.black);
    t.prism(Array.from({ length: 13 }, (_, i) => { const a = Math.PI + (i / 12) * Math.PI; return [-9 + Math.cos(a) * 13.6, -11.5 + Math.sin(a) * 13.6, -11.6]; }), [0, 0, 5.4], K.tracRed);
    wheel(t, -9, 11.5, -12.4, 5, { lugs: 22, rim: 0.5, rimFill: K.yellow });
    wheel(t, 15, 5.8, -8, 3, { lugs: 14, rim: 0.5, rimFill: K.yellow });
  };

  const CAM = { scooter: { yaw: 30, pitch: 10 }, rickshaw: { yaw: 32, pitch: 12 }, camper: { yaw: 30, pitch: 10 },
                bus: { yaw: 28, pitch: 8 }, tractor: { yaw: 34, pitch: 12 } };
  const NAMES = { scooter: "Retro scooter", rickshaw: "Auto-rickshaw", camper: "Camper van", bus: "Double-decker bus", tractor: "Tractor" };
  const out = {};
  for (const key of Object.keys(D)) {
    out[key] = Spec.wrap("product", NAMES[key], () => {
      const k = Kit.rig({ f: 260, vp: [50, 26], gnd: 40 });
      k.OUT = 1.0; k.DET = 0.72; k.TEX = 0.5;
      const t = kit(k, CAM[key]);
      D[key](t);
      t.flush();
      return k.done();
    });
  }
  out._keys = Object.keys(D);
  out._names = NAMES;
  return out;
})();
