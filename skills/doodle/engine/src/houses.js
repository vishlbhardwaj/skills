/*
 * THE HOUSE SET — the house as a TYPE; each one a form nothing else here has.
 * (15 so far, in three batches of five; bin/check.sh is the count.)
 *
 * Chosen so no two share a FORM, the same way daily.js picked by
 * construction: the roof is the wall (A-frame), an asymmetric gable
 * (saltbox), a low gable behind a deep porch (Craftsman bungalow), a two-tier
 * hip over a pillared verandah (Kerala), the whole house lifted clear of the
 * ground (stilt house). None of them is already in arch / arch2 — the
 * cottage, chalet, Tudor, Victorian and brownstone are.
 *
 * One vocabulary across all five: the windows, doors, sills, pots, pavement
 * and black-pane convention come from Arch._kit, the roofs and railings from
 * Arch2._kit. Two-point perspective throughout (`massing`), flat detail
 * authored in (u, v) on a `V.face`, depth carried by what PROJECTS — eaves,
 * decks, porches, sills — not by the convergence.
 *
 * Coordinates: x right, y DOWN (horizon y = 0, ground GNDY = 26), z into the
 * picture; the front wall is z = 0 and the camera sees it plus the LEFT flank.
 */
window.Houses = (function () {
  const K = Arch._kit, K2 = Arch2._kit;
  const { GNDY, slab, rectF, bandF, windowF, doorF, chimney, pot, pavement, massing } = K;
  const { drum, railing } = K2;
  const A = {};

  /* clapboard / log / tile courses across a face, the whole face — half-drawn
     texture is the one option that never works (LEARNINGS, the cottage) */
  const courses = (k, F, u0, u1, v0, v1, gap, skip) => {
    for (let v = v0 + gap; v < v1 - 0.5; v += gap) {
      if (skip && skip(v)) continue;
      k.M([F.at(u0, v), F.at(u1, v)], k.FINE);
    }
  };

  /*
   * A RIDGE ROOF, ridge along x, drawn as its VISIBLE edges only: the near
   * (left) gable, the ridge, the front eave and its soffit, and only the
   * FRONT leg of the far gable. `Arch2.gableRoof` also draws the far gable's
   * back leg, which lies across any tall front wall since marks have no
   * occlusion (the machiya). Returns the ridge height at the near gable wall.
   */
  function ridgeRoof(k, x0, x1, z0, z1, yE, yR, ov) {
    const V = k.V, X0 = x0 - ov, X1 = x1 + ov, RZ = (z0 + z1) / 2;
    k.M([V.p(X0, yE, z0 - ov), V.p(X0, yR, RZ), V.p(X0, yE, z1 + ov)], k.OUT);
    k.M([V.p(X0, yR, RZ), V.p(X1, yR, RZ)], k.OUT);
    k.M([V.p(X0, yE, z0 - ov), V.p(X1, yE, z0 - ov)], k.OUT);
    k.M([V.p(X1, yE, z0 - ov), V.p(X1, yR, RZ)], k.OUT);
    k.M([V.p(X0, yE + 1.4, z0 - ov), V.p(X1, yE + 1.4, z0 - ov)], k.MID);
    const yWall = yR + (yE - yR) * (ov / (RZ - z0 + ov));
    k.M([V.p(x0, yE, z0), V.p(x0, yWall, RZ), V.p(x0, yE, z1)], k.MID);   /* the gable wall itself */
    return { RZ, X0, X1 };
  }

  /* a circle on a face, sampled in (u, v) so it lands in perspective as an ellipse */
  const circleF = (F, cu, cv, r, n) => {
    const out = [];
    for (let i = 0; i <= (n || 28); i++) { const a = (i / (n || 28)) * Math.PI * 2; out.push(F.at(cu + Math.cos(a) * r, cv + Math.sin(a) * r)); }
    return out;
  };
  const circleOut = (F, cu, cv, r, d, n) => {
    const out = [];
    for (let i = 0; i <= (n || 28); i++) { const a = (i / (n || 28)) * Math.PI * 2; out.push(F.out(cu + Math.cos(a) * r, cv + Math.sin(a) * r, d)); }
    return out;
  };

  /*
   * THE SILHOUETTE OF A CURVED SOLID (a dome, a saucer) — sample its surface,
   * project every point, take the convex hull. A ring cannot give the outline
   * of a sphere seen from above the horizon line, and an eyeballed arc lands
   * nearly right and reads wrong (LEARNINGS: forms built from trig).
   */
  function hull(pts) {
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of P.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  /* a surface of revolution about the vertical axis at (cx, cz): r(t), y(t) for t in [0,1] */
  function revolve(V, cx, cz, prof, nT, nA) {
    const out = [];
    for (let i = 0; i <= (nT || 16); i++) {
      const [r, y] = prof(i / (nT || 16));
      for (let j = 0; j < (nA || 36); j++) { const a = (j / (nA || 36)) * Math.PI * 2; out.push(V.p(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r)); }
    }
    return out;
  }
  /* the open polyline of the hull that lies ABOVE a screen y (drops the base, which a near-half ring draws) */
  const hullAbove = (h, yCut) => {
    const i0 = h.findIndex((p, i) => p[1] <= yCut && h[(i - 1 + h.length) % h.length][1] > yCut);
    const rot = i0 > 0 ? h.slice(i0).concat(h.slice(0, i0)) : h;
    const run = [];
    for (const p of rot) { if (p[1] <= yCut + 0.5) run.push(p); else if (run.length) break; }
    return run;
  };

  /* ── 1 · A-FRAME CABIN — the roof IS the wall ──────────────────────── */
  A.aframe = () => {
    const M = massing({ w: 46, d: 40, top: -58, f: 330, dist: 200, yaw: -26 });
    const { k, V, W, D, TOP, H } = M;
    const ov = 3, X0 = -W / 2 - ov, X1 = W / 2 + ov, AP = TOP - 4;
    /* the left slope: the plane you see beside the gable. Seams run eave →
       ridge the full depth: a standing-seam roof is a combed surface */
    k.M([V.p(X0, GNDY - 1, 0), V.p(X0, GNDY - 1, D)], k.OUT);
    k.M([V.p(X0, GNDY - 1, D), V.p(0, AP, D)], k.OUT);
    k.M([V.p(0, AP, 0), V.p(0, AP, D)], k.OUT);
    for (let z = 4; z < D - 1; z += 4) k.M([V.p(X0, GNDY - 1, z), V.p(0, AP, z)], k.FINE);
    /* a stovepipe through the slope, buried at its own z */
    const pz = D * 0.7, px = -W * 0.12, py = AP + ((GNDY - 1 - AP) * (px - 0)) / (X0 - 0);
    drum(k, px, pz, 1.4, 1.4, py + 1, py - 9, k.MID);
    drum(k, px, pz, 2.4, 2.4, py - 9, py - 11, k.MID);
    /* the gable: roof thickness is a band you see the end of */
    const front = V.face([-W / 2, TOP, 0], [1, 0, 0], [0, 1, 0]);
    const tri = (o) => [[-o - ov, H - 1], [W / 2, -4 - o], [W + ov + o, H - 1]];
    k.M(front.poly(tri(0)), k.OUT);
    k.M(front.poly(tri(-2.6)), k.MID);
    /* the glazed gable, recessed: mullions and a transom, panes black with
       white gaps — a glazed wall must not become a hole (the villa) */
    const glass = V.face([-W / 2, TOP, 3.5], [1, 0, 0], [0, 1, 0]);
    const gy = H - 24, gl = (v) => (W / 2) * ((v + 4) / (H + 3)) - 1.5;   /* half-width at v */
    k.M(glass.poly([[W / 2 - gl(gy), gy], [W / 2, 3], [W / 2 + gl(gy), gy]]), k.MID, { closed: true });
    k.M([glass.at(W / 2 - gl(gy), gy), glass.at(W / 2 + gl(gy), gy)], k.MID);
    const rake = (u) => 3 + Math.abs(u - W / 2) * ((H + 3) / (W / 2));   /* glass top at u */
    const half = gl(gy), bays = 6, bw = (2 * half) / bays, u0g = W / 2 - half;
    for (let b = 0; b < bays; b++) {
      const a = u0g + b * bw + 0.7, c = u0g + (b + 1) * bw - 0.7;
      const ta = rake(a) + 1.2, tc = rake(c) + 1.2;
      if (gy - 1.2 - Math.max(ta, tc) < 2) continue;
      k.F(glass.poly([[a, ta], [c, tc], [c, gy - 1.2], [a, gy - 1.2]]));
      if (b) k.M([glass.at(a - 0.7, rake(a - 0.7)), glass.at(a - 0.7, gy)], k.FINE);
    }
    /* ground floor: two windows and the door under the glass */
    windowF(k, glass, W * 0.2, H - 19, 7, 9, 2, 2, { sill: false });
    windowF(k, glass, W * 0.8, H - 19, 7, 9, 2, 2, { sill: false });
    doorF(k, glass, W * 0.5, H - 4, 8, 17, { glazed: true });
    /* the deck: a real slab standing in front, with its railing and steps */
    slab(k, -W / 2 - 4, W / 2 + 4, GNDY - 4, GNDY - 2.5, -11, 3.5, k.OUT);
    const deck = V.face([-W / 2, GNDY - 4, -11], [1, 0, 0], [0, 1, 0]);
    railing(k, deck, -4, W * 0.36, 0, 7, 7, 0);
    railing(k, deck, W * 0.64, W + 4, 0, 7, 7, 0);
    for (let i = 0; i < 3; i++) {
      const y = GNDY - 2.5 + i * 0.9, z = -11 - i * 2.2;
      k.M([V.p(-5, y, z), V.p(5, y, z)], k.MID);
    }
    k.M([V.p(-W / 2 - 4, GNDY - 2.5, -11), V.p(-W / 2 - 4, GNDY, -11)], k.MID);
    k.M([V.p(W / 2 + 4, GNDY - 2.5, -11), V.p(W / 2 + 4, GNDY, -11)], k.MID);
    pavement(k, -W / 2 - 4, W / 2 + 4, D, 16);
    pot(k, -W * 0.68, -14, 16, "cone", 11);
    pot(k, W * 0.66, -15, 12, "cone", 23);
    pot(k, -W * 0.82, -6, 9, "cone", 31);
    return k.done();
  };

  /* ── 2 · SALTBOX — the asymmetric gable is the whole identification ── */
  A.saltbox = () => {
    const M = massing({ w: 54, d: 46, top: -16, f: 330, dist: 210, yaw: -40 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const RZ = 13, RY = TOP - 19, REAR = GNDY - 11, ov = 2;
    /* the flank first — the saltbox profile, short front slope, long rear */
    const prof = [[0, TOP], [RZ, RY], [D, REAR], [D, GNDY], [0, GNDY]];
    k.M(prof.map(([z, y]) => V.p(-W / 2, y, z)), k.OUT, { closed: true });
    /* clapboard stops at the profile: above the rear eave a course only runs
       as far back as the long slope at its height */
    for (let v = 3.2; v < H - 0.5; v += 3.2) {
      const y = TOP + v, zMax = y >= REAR ? D : RZ + ((y - RY) / (REAR - RY)) * (D - RZ);
      k.M([flank.at(0, v), flank.at(Math.min(D, zMax) - 0.6, v)], k.FINE);
    }
    /* the rake: clapboard runs up to it, so cut the courses at the slope */
    windowF(k, flank, D * 0.3, H * 0.18, 7, 10, 2, 3, { sillOut: 1 });
    windowF(k, flank, D * 0.3, H * 0.58, 7, 10, 2, 3, { sillOut: 1 });
    windowF(k, flank, D * 0.78, H * 0.6, 6, 8, 2, 2, { sillOut: 1 });
    /* the roof as a solid: verge boards on the flank, eaves along the front */
    k.M([V.p(-W / 2 - ov, TOP + 0.5, -ov), V.p(-W / 2 - ov, RY - 1.6, RZ),
         V.p(-W / 2 - ov, REAR + 0.5, D + ov)], k.OUT);
    k.M([V.p(-W / 2 - ov, TOP - 1.2, -ov), V.p(-W / 2 - ov, RY - 3.2, RZ),
         V.p(-W / 2 - ov, REAR - 1.2, D + ov)], k.MID);
    k.M([V.p(-W / 2 - ov, RY - 3.2, RZ), V.p(W / 2 + ov, RY - 3.2, RZ)], k.OUT);
    k.M([V.p(-W / 2 - ov, TOP + 0.5, -ov), V.p(W / 2 + ov, TOP + 0.5, -ov)], k.OUT);
    k.M([V.p(W / 2 + ov, TOP + 0.5, -ov), V.p(W / 2 + ov, RY - 3.2, RZ)], k.OUT);
    k.M([V.p(-W / 2 - ov, TOP - 1.2, -ov), V.p(W / 2 + ov, TOP - 1.2, -ov)], k.MID);
    /* shingle courses on the front slope */
    for (let t = 0.2; t < 1; t += 0.2) {
      const y = TOP - 1.2 + (RY - 3.2 - (TOP - 1.2)) * t, z = -ov + (RZ + ov) * t;
      k.M([V.p(-W / 2 - ov, y, z), V.p(W / 2 + ov, y, z)], k.FINE);
    }
    /* the great central chimney, buried at the ridge */
    chimney(k, 0, RY - 3.2, RZ, 7, 9);
    /* the front: five bays, centre door with a pediment, clapboard */
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)], k.OUT, { closed: true });
    const bays = [0.12, 0.31, 0.69, 0.88];
    courses(k, front, 0, W, 0, H, 3.2);
    bays.forEach((f) => { windowF(k, front, W * f, H * 0.12, 7, 11, 2, 3); windowF(k, front, W * f, H * 0.55, 7, 11, 2, 3); });
    windowF(k, front, W * 0.5, H * 0.12, 7, 11, 2, 3);
    doorF(k, front, W * 0.5, H, 8, 18);
    k.M(front.poly([[W * 0.5 - 6.5, H - 18.5], [W * 0.5, H - 23], [W * 0.5 + 6.5, H - 18.5]]), k.OUT, { closed: true });
    rectF(k, front, W * 0.5 - 5.5, H - 18.5, W * 0.5 - 4.4, H, k.MID);
    rectF(k, front, W * 0.5 + 4.4, H - 18.5, W * 0.5 + 5.5, H, k.MID);
    k.M([front.at(0, H - 1.2), front.at(W, H - 1.2)], k.MID);
    pavement(k, -W / 2, W / 2, D, 10);
    pot(k, -W * 0.18, -5, 9, "bush", 7);
    pot(k, W * 0.18, -5, 9, "bush", 19);
    return k.done();
  };

  /* ── 3 · CRAFTSMAN BUNGALOW — low gable behind a deep porch ──────────── */
  A.bungalow = () => {
    const M = massing({ w: 54, d: 40, top: -4, f: 330, dist: 205, yaw: -24 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const ov = 4.5, RY = TOP - 17;
    /* flank wall and the main gable to the street, deep eaves */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    courses(k, flank, 0, D, 0, H, 3);
    windowF(k, flank, D * 0.55, H * 0.22, 12, 10, 3, 1, { sillOut: 1 });
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D)], k.OUT);
    K2.gableToStreet(k, -W / 2, W / 2, 0, D, TOP, RY, ov);
    /* exposed rafter tails under the near eave — the Craftsman signature */
    for (let z = 3; z < D; z += 4.5)
      k.M([V.p(-W / 2 - ov, TOP, z), V.p(-W / 2 - ov - 1.4, TOP + 1.6, z)], k.MID);
    /* the main gable face: shingles, a vent, knee braces under the verge */
    const gable = V.face([-W / 2, TOP, 0], [1, 0, 0], [0, 1, 0]);
    k.M(gable.poly([[0, 0], [W / 2, RY - TOP], [W, 0]]), k.MID);
    for (let v = -3; v > RY - TOP + 3; v -= 3) {
      const half = (W / 2) * (1 - v / (RY - TOP));
      k.M([gable.at(W / 2 - half + 1, v), gable.at(W / 2 + half - 1, v)], k.FINE);
    }
    windowF(k, gable, W / 2, -11, 10, 5, 4, 1, { sill: false, reveal: false });
    [[-ov + 1, 0], [W + ov - 1, 0]].forEach(([u]) => {
      const s = u < W / 2 ? 1 : -1;
      k.M([gable.at(u, 0), gable.at(u, 5), gable.at(u + s * 5, 0)], k.MID, { closed: true });
    });
    /* the front wall behind the porch: windows sit low and BETWEEN the columns */
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)], k.OUT, { closed: true });
    windowF(k, front, W * 0.22, H * 0.42, 12, 10, 3, 1, { sill: false });
    windowF(k, front, W * 0.78, H * 0.42, 12, 10, 3, 1, { sill: false });
    doorF(k, front, W * 0.5, H - 3, 8, 16, { glazed: true });
    /* the porch: full width, its own gable sitting BELOW the main eave so the
       two roofs never cross (two masses must not share an edge) */
    const PX0 = -W / 2 + 2, PX1 = W / 2 - 2, PZ = -14, PE = TOP + 10, PR = TOP + 1;
    K2.gableToStreet(k, PX0, PX1, PZ, 0, PE, PR, 2.5);
    const pg = V.face([PX0 - 2.5, PE, PZ - 2.5], [1, 0, 0], [0, 1, 0]);
    const pw = PX1 - PX0 + 5;
    for (let v = -2.4; v > PR - PE + 2; v -= 2.4) {
      const hw = (pw / 2) * (1 - v / (PR - PE));
      k.M([pg.at(pw / 2 - hw + 1.5, v), pg.at(pw / 2 + hw - 1.5, v)], k.FINE);
    }
    /* tapered square columns on stone piers — the type's landmark */
    [PX0 + 3, PX1 - 3].forEach((x) => {
      slab(k, x - 3.2, x + 3.2, GNDY - 12, GNDY - 3, PZ - 1, PZ + 4, k.OUT);
      for (let y = GNDY - 9.6; y < GNDY - 3; y += 2.4) k.M([V.p(x - 3.2, y, PZ - 1), V.p(x + 3.2, y, PZ - 1)], k.FINE);
      k.M([V.p(x - 2.4, GNDY - 12, PZ), V.p(x - 1.3, PE, PZ), V.p(x + 1.3, PE, PZ), V.p(x + 2.4, GNDY - 12, PZ)], k.OUT, { closed: true });
      [[-1, 1], [1, -1]].forEach(([sd]) =>
        k.M([V.p(x + sd * 1.3, PE, PZ), V.p(x + sd * 5, PE, PZ)], k.MID));
    });
    /* porch floor, centre steps, low railings either side of them */
    slab(k, PX0 - 1, PX1 + 1, GNDY - 3, GNDY, PZ - 2, 0, k.OUT);
    for (let i = 1; i <= 2; i++)
      slab(k, -6 + i, 6 - i, GNDY - 3 + i * 1.5, GNDY, PZ - 2 - i * 2.2, PZ - 2, k.MID);
    const pf = V.face([PX0, GNDY - 3, PZ - 1], [1, 0, 0], [0, 1, 0]);
    railing(k, pf, 6, (PX1 - PX0) / 2 - 7, 0, 5.5, 5, 0);
    railing(k, pf, (PX1 - PX0) / 2 + 7, PX1 - PX0 - 6, 0, 5.5, 5, 0);
    pavement(k, -W / 2, W / 2, D, 12);
    pot(k, PX1 + 6, -20, 10, "bush", 5);
    pot(k, PX0 - 6, -19, 13, "cone", 29);
    return k.done();
  };

  /* ── 4 · KERALA HOUSE — two-tier tiled hip over a pillared verandah ──── */
  A.kerala = () => {
    const M = massing({ w: 50, d: 40, top: -6, f: 330, dist: 215, yaw: -22 });
    const { k, V, W, D, TOP, H, front } = M;
    const PL = GNDY - 4;                       /* the raised plinth */
    const VZ = -11, VX = 9;                    /* verandah depth / side reach */
    /* plinth: a laterite base you step up onto, seen as a solid */
    slab(k, -W / 2 - VX - 2, W / 2 + VX + 2, PL, GNDY, VZ - 2, D, k.OUT);
    for (let y = PL + 1.3; y < GNDY; y += 1.3)
      k.M([V.p(-W / 2 - VX - 2, y, VZ - 2), V.p(W / 2 + VX + 2, y, VZ - 2)], k.FINE);
    /* the house wall inside the verandah */
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H - 4), front.at(0, H - 4)], k.OUT, { closed: true });
    doorF(k, front, W * 0.5, H - 4, 9, 18);
    [0.2, 0.8].forEach((f) => {
      windowF(k, front, W * f, H * 0.26, 9, 12, 3, 1, { sill: false });
      /* wooden bars, not glass: vertical rods across the black opening */
      for (let i = 1; i < 6; i++) k.M([front.at(W * f - 4.5 + i * 1.5, H * 0.26 + 1), front.at(W * f - 4.5 + i * 1.5, H * 0.26 + 11)], k.FINE);
    });
    /* lower tier: a lean-to running round the verandah, eaves low, tiled */
    const LE = PL - 17, LT = TOP - 2;          /* low eave y, where it meets the wall */
    const L = [V.p(-W / 2 - VX - 3, LE, VZ - 3), V.p(W / 2 + VX + 3, LE, VZ - 3)];
    k.M(L, k.OUT);
    k.M([V.p(-W / 2 - VX - 3, LE, VZ - 3), V.p(-W / 2 - VX - 3, LE, D - 6)], k.OUT);
    /* the lean-to wraps the left side too: its slope up to the wall, and its back edge */
    k.M([V.p(-W / 2, LT, 0), V.p(-W / 2, LT, D - 6)], k.MID);
    k.M([V.p(-W / 2 - VX - 3, LE, D - 6), V.p(-W / 2, LT, D - 6)], k.MID);
    for (let z = 4; z < D - 7; z += 6) k.M([V.p(-W / 2 - VX - 3, LE, z), V.p(-W / 2, LT, z)], k.FINE);
    k.M([V.p(-W / 2 - VX - 3, LE, VZ - 3), V.p(-W / 2, LT, 0)], k.MID);
    k.M([V.p(W / 2 + VX + 3, LE, VZ - 3), V.p(W / 2, LT, 0)], k.MID);
    k.M([V.p(-W / 2, LT, 0), V.p(W / 2, LT, 0)], k.MID);
    k.M([V.p(-W / 2 - VX - 3, LE + 1.4, VZ - 3), V.p(W / 2 + VX + 3, LE + 1.4, VZ - 3)], k.MID);
    for (let t = 0.2; t < 0.95; t += 0.2) {
      const y = LE + (LT - LE) * t, z = VZ - 3 + (3 - VZ) * t;
      const x0 = -W / 2 - VX - 3 + (VX + 3) * t, x1 = W / 2 + VX + 3 - (VX + 3) * t;
      k.M([V.p(x0, y, z), V.p(x1, y, z)], k.FINE);
    }
    /* slender turned pillars carrying it */
    for (let i = 0; i < 6; i++) {
      const x = -W / 2 - VX + 1 + ((W + 2 * VX - 2) * i) / 5;
      drum(k, x, VZ, 0.9, 0.9, PL, LE + 1.4, k.MID);
      drum(k, x, VZ, 1.5, 1.5, PL, PL - 1.6, k.FINE);
    }
    /* upper tier: a steep tiled hip, ridge with finials, a gablet facing
       the street — the mukhappu, lattice-screened, is the landmark */
    const UE = TOP - 4, UR = TOP - 26, ov = 3, X0 = -W / 2 - ov, X1 = W / 2 + ov, Z0 = -ov, Z1 = D + ov, IN = 10;
    const R0 = V.p(X0 + IN, UR, (Z0 + Z1) / 2), R1 = V.p(X1 - IN, UR, (Z0 + Z1) / 2);
    k.M([V.p(X0, UE, Z1), V.p(X0, UE, Z0), V.p(X1, UE, Z0)], k.OUT);
    k.M([V.p(X0, UE + 1.4, Z0), V.p(X1, UE + 1.4, Z0)], k.MID);
    k.M([R0, R1], k.OUT);
    k.M([V.p(X0, UE, Z0), R0], k.OUT); k.M([V.p(X1, UE, Z0), R1], k.OUT); k.M([V.p(X0, UE, Z1), R0], k.MID);
    [R0, R1].forEach((r) => k.M([r, [r[0], r[1] - 5]], k.OUT));
    for (let t = 0.17; t < 0.9; t += 0.17) {
      const y = UE + (UR - UE) * t, z = Z0 + ((Z1 - Z0) / 2) * t;
      const x0 = X0 + IN * t, x1 = X1 - IN * t;
      k.M([V.p(x0, y, z), V.p(x1, y, z)], k.FINE);
    }
    const gz = (Z0 + Z1) / 2 - 7, gyB = UR + 10, gw = 9;
    const g = V.face([-gw, gyB, gz], [1, 0, 0], [0, 1, 0]);
    k.M(g.poly([[-1.5, 0.5], [gw, -10.5], [2 * gw + 1.5, 0.5]]), k.OUT);
    k.M(g.poly([[0, 0], [gw, -9], [2 * gw, 0]]), k.MID, { closed: true });
    for (let i = 1; i < 6; i++) {
      const u = (2 * gw * i) / 6, top = -9 * (1 - Math.abs(u - gw) / gw);
      k.M([g.at(u, 0), g.at(u, top)], k.FINE);
    }
    k.M([g.at(2.2, -2.2), g.at(2 * gw - 2.2, -2.2)], k.FINE);
    pavement(k, -W / 2 - VX - 2, W / 2 + VX + 2, D, 10);
    pot(k, -W / 2 - VX - 8, -16, 18, "bush", 41);
    pot(k, W / 2 + VX + 7, -15, 12, "bush", 13);
    return k.done();
  };

  /* ── 5 · STILT HOUSE — the whole house lifted clear of the ground ─────── */
  A.stilt = () => {
    const M = massing({ w: 44, d: 30, top: -40, f: 330, dist: 210, yaw: -28 });
    const { k, V, W, D, TOP } = M;
    const FL = GNDY - 24, WT = TOP;            /* floor and wall-top y */
    const HB = FL - WT;
    /* stilts first — they are behind the deck and the ladder */
    const xs = [-W / 2 + 2, 0, W / 2 - 2], zs = [2, D - 2];
    zs.forEach((z) => xs.forEach((x) => {
      if (z > 2 && x > -W / 2 + 2) return;   /* hidden behind the front row */
      slab(k, x - 1.3, x + 1.3, FL, GNDY, z - 1.3, z + 1.3, k.MID);
    }));
    [[xs[0], xs[1]], [xs[1], xs[2]]].forEach(([a, b]) =>
      k.M([V.p(a + 1.3, GNDY - 3, 0.6), V.p(b - 1.3, FL + 3, 0.6)], k.FINE));
    k.M([V.p(xs[0] - 1.3, GNDY - 3, zs[0]), V.p(xs[0] - 1.3, FL + 3, zs[1])], k.FINE);
    /* the floor beam and the body: woven walls read as vertical slats */
    slab(k, -W / 2 - 1, W / 2 + 1, FL, FL + 2.4, -1, D + 1, k.OUT);
    const front = V.face([-W / 2, WT, 0], [1, 0, 0], [0, 1, 0]);
    const flank = V.face([-W / 2, WT, 0], [0, 0, 1], [0, 1, 0]);
    k.M([V.p(-W / 2, WT, 0), V.p(-W / 2, WT, D), V.p(-W / 2, FL, D), V.p(-W / 2, FL, 0)], k.OUT, { closed: true });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, HB), front.at(0, HB)], k.OUT, { closed: true });
    for (let u = 2.4; u < W; u += 2.4) if (u < W * 0.6 - 6 || u > W * 0.6 + 6) k.M([front.at(u, 1), front.at(u, HB - 1)], k.FINE);
    for (let u = 2.4; u < D; u += 2.4) if (u < D * 0.5 - 5 || u > D * 0.5 + 5) k.M([flank.at(u, 1), flank.at(u, HB - 1)], k.FINE);
    windowF(k, flank, D * 0.5, HB * 0.28, 8, 8, 2, 1, { sill: false });
    /* shuttered window + the door onto the deck */
    windowF(k, front, W * 0.6, HB * 0.24, 10, 9, 2, 1, { sill: false });
    k.M([front.out(W * 0.6 - 5, HB * 0.24, 0.5), front.out(W * 0.6 - 5, HB * 0.24 - 6, 3), front.out(W * 0.6 + 5, HB * 0.24 - 6, 3), front.out(W * 0.6 + 5, HB * 0.24, 0.5)], k.MID);
    doorF(k, front, W * 0.22, HB, 8, HB - 3);
    /* the roof: steep gable, ridge along x, big overhangs, crossed ridge
       poles at each gable end — the horns are the type's landmark */
    const ov = 6, RY = WT - 20, RZ = D / 2;
    const X0 = -W / 2 - ov, X1 = W / 2 + ov;
    k.M([V.p(X0, WT + 3, -ov - 2), V.p(X0, RY, RZ), V.p(X0, WT + 3, D + ov + 2)], k.OUT);
    k.M([V.p(X0, RY, RZ), V.p(X1, RY, RZ)], k.OUT);
    k.M([V.p(X0, WT + 3, -ov - 2), V.p(X1, WT + 3, -ov - 2)], k.OUT);
    k.M([V.p(X1, WT + 3, -ov - 2), V.p(X1, RY, RZ)], k.OUT);
    k.M([V.p(X0, WT + 4.6, -ov - 2), V.p(X1, WT + 4.6, -ov - 2)], k.MID);
    for (let t = 0.12; t < 0.98; t += 0.12) {
      const y = WT + 3 + (RY - WT - 3) * t, z = -ov - 2 + (RZ + ov + 2) * t;
      k.M([V.p(X0, y, z), V.p(X1, y, z)], k.FINE);
    }
    [X0, X1].forEach((x) => {
      k.M([V.p(x, RY + 3, RZ - 3), V.p(x, RY - 6, RZ + 5)], k.OUT);
      k.M([V.p(x, RY + 3, RZ + 3), V.p(x, RY - 6, RZ - 5)], k.OUT);
    });
    /* the deck in front at floor level, its railing, and the ladder down */
    slab(k, -W / 2, W * 0.1, FL, FL + 1.8, -9, 0, k.OUT);
    const deck = V.face([-W / 2, FL, -9], [1, 0, 0], [0, 1, 0]);
    railing(k, deck, 0, W * 0.6 - 10, 0, 6, 6, 0);
    [-W / 2 + 1.5, -W / 2 + 6.5].forEach((x) => k.M([V.p(x, FL + 1.8, -9), V.p(x, GNDY, -21)], k.OUT));
    for (let i = 1; i < 8; i++) {
      const t = i / 8, y = FL + 1.8 + (GNDY - FL - 1.8) * t, z = -9 - 12 * t;
      k.M([V.p(-W / 2 + 1.5, y, z), V.p(-W / 2 + 6.5, y, z)], k.MID);
    }
    pavement(k, -W / 2, W / 2, D, 24);
    pot(k, W * 0.34, -12, 14, "bush", 17);
    pot(k, W * 0.66, -5, 10, "bush", 23);
    return k.done();
  };

  /* ── 6 · YURT — the only round house: a lattice drum under a shallow cone ── */
  A.yurt = () => {
    const M = massing({ w: 56, d: 56, top: 6, f: 330, dist: 205, yaw: -20 });
    const { k, V } = M;
    const R = 26, CZ = R, WT = GNDY - 17, RE = WT - 1.5, CR = WT - 15, ov = 3;
    const { ring, halfRing, extremes } = K2;
    /* the drum: bottom ring near half, wall silhouette, felt seams on the near half */
    const bot = ring(V, 0, CZ, R, GNDY, 48), top = ring(V, 0, CZ, R, WT, 48);
    k.M(halfRing(bot, true), k.OUT, { curve: true });
    const [bl, br] = extremes(bot), [tl, tr] = extremes(top);
    k.M([bl, tl], k.OUT); k.M([br, tr], k.OUT);
    /* two rope bands: rings on a drum are near-half only (LEARNINGS, the drum) */
    [WT + 4, GNDY - 4].forEach((y) => k.M(halfRing(ring(V, 0, CZ, R + 0.3, y, 48), true), k.MID, { curve: true }));
    /* the trellis showing at the hem: a diagonal lattice band, near half */
    for (let a = 0.08; a < Math.PI - 0.05; a += 0.16) {
      if (Math.abs(Math.cos(a) * R) < 10) continue;          /* the door stands here */
      const x1 = -Math.cos(a) * R, z1 = CZ - Math.sin(a) * R;
      const x2 = -Math.cos(a + 0.16) * R, z2 = CZ - Math.sin(a + 0.16) * R;
      k.M([V.p(x1, GNDY - 4, z1), V.p(x2, WT + 4, z2)], k.FINE);
      k.M([V.p(x2, GNDY - 4, z2), V.p(x1, WT + 4, z1)], k.FINE);
    }
    /* the roof: eave ring near half (it overhangs), the cone's two sides to
       the crown, roof poles radiating on the near half */
    const eave = ring(V, 0, CZ, R + ov, RE, 48), crown = ring(V, 0, CZ, 5, CR, 24);
    k.M(halfRing(eave, true), k.OUT, { curve: true });
    const [el, er] = extremes(eave), [cl, cr] = extremes(crown);
    k.M([el, cl], k.OUT); k.M([er, cr], k.OUT);
    k.M(halfRing(ring(V, 0, CZ, R + ov, RE + 1.6, 48), true), k.MID, { curve: true });
    k.M(halfRing(crown, true), k.OUT, { curve: true });
    for (let a = 0.15; a < Math.PI - 0.1; a += 0.22)
      k.M([V.p(-Math.cos(a) * (R + ov), RE, CZ - Math.sin(a) * (R + ov)), V.p(-Math.cos(a) * 5, CR, CZ - Math.sin(a) * 5)], k.FINE);
    /* the toono crown and its stovepipe */
    drum(k, 0, CZ, 5, 5, CR, CR - 1.6, k.MID);
    drum(k, 8, CZ + 4, 1.2, 1.2, CR + 2, CR - 12, k.MID);
    drum(k, 8, CZ + 4, 2, 2, CR - 12, CR - 13.5, k.MID);
    /* the painted door: a flat panel on the tangent plane at the front */
    const door = V.face([-6, GNDY - 14, CZ - R - 0.6], [1, 0, 0], [0, 1, 0]);
    rectF(k, door, -1, -1, 13, 14, k.OUT);
    rectF(k, door, 0.6, 0.6, 5.6, 12.4, k.MID);
    rectF(k, door, 6.4, 0.6, 11.4, 12.4, k.MID);
    [[1.6, 2], [7.4, 2]].forEach(([u, v]) => k.F(door.poly([[u, v], [u + 3, v], [u + 3, v + 3], [u, v + 3]])));
    k.M([door.at(-3, -1.6), door.at(15, -1.6)], k.OUT);
    /* the ground is a pad, not a pavement: a ring of beaten earth */
    k.M(halfRing(ring(V, 0, CZ, R + 9, GNDY, 48), true), k.FINE, { curve: true });
    pot(k, -R - 6, CZ - 14, 12, "bush", 9);
    pot(k, R + 2, CZ - 22, 9, "cone", 21);
    return k.done();
  };

  /* ── 7 · BUTTERFLY ROOF — mid-century: the roof is a V ──────────────── */
  A.butterfly = () => {
    const M = massing({ w: 66, d: 34, top: -4, f: 330, dist: 215, yaw: -22 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const ov = 6, X0 = -W / 2 - ov, X1 = W / 2 + ov, LIFT = 12, F = 2;
    const roofY = (x) => TOP - LIFT * (Math.abs(x) / (W / 2 + ov));
    /* flank: board siding up to the roof's height at that wall */
    const yF = roofY(-W / 2);
    k.M([V.p(-W / 2, yF, 0), V.p(-W / 2, yF, D), V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    const fl = V.face([-W / 2, yF, 0], [0, 0, 1], [0, 1, 0]);
    for (let u = 3; u < D; u += 3) k.M([fl.at(u, 1), fl.at(u, GNDY - yF - 1)], k.FINE);
    /* the roof: a V fascia with real thickness, its left wing running back,
       and the soffit you see from below the overhang */
    const V3 = (x, dy, z) => V.p(x, roofY(x) + dy, z);
    k.M([V3(X0, 0, -ov), V3(0, 0, -ov), V3(X1, 0, -ov)], k.OUT);
    k.M([V3(X0, F, -ov), V3(0, F, -ov), V3(X1, F, -ov)], k.OUT);
    k.M([V3(X0, 0, -ov), V3(X0, F, -ov)], k.OUT); k.M([V3(X1, 0, -ov), V3(X1, F, -ov)], k.OUT);
    k.M([V3(X0, 0, -ov), V3(X0, 0, D + ov)], k.OUT);
    k.M([V3(X0, F, -ov), V3(X0, F, D + ov)], k.MID);
    k.M([V3(X0, F, D + ov), V3(X0, 0, D + ov)], k.MID);
    k.M([V3(-W / 2, F, 0), V3(-W / 2, F, D)], k.MID);
    for (let x = X0 + 4; x < -W / 2; x += 4) k.M([V3(x, F, -ov), V3(x, F, 0)], k.FINE);
    /* the front: clerestory triangles under each wing, glass below, a stone chimney wall */
    k.M([front.at(0, H), front.at(W, H)], k.OUT);
    k.M([front.at(0, 0), front.at(W, 0)], k.MID);
    k.M([front.at(0, roofY(-W / 2) - TOP + F), front.at(0, H)], k.OUT);
    k.M([front.at(W, roofY(W / 2) - TOP + F), front.at(W, H)], k.OUT);
    const clere = (u0, u1) => {
      for (let u = u0 + 1; u < u1 - 4; u += 5.5) {
        const a = u, b = u + 4.5, va = roofY(a - W / 2) - TOP + F + 1, vb = roofY(b - W / 2) - TOP + F + 1;
        if (-1 - Math.max(va, vb) > 1.5) k.F(front.poly([[a, va], [b, vb], [b, -1], [a, -1]]));
      }
    };
    clere(0, W / 2 - 2); clere(W / 2 + 2, W);
    /* stone chimney wall, left third: courses, no glass */
    const s0 = 2, s1 = W * 0.26;
    rectF(k, front, s0, 1, s1, H, k.OUT);
    for (let v = 3.2; v < H; v += 3.2) {
      k.M([front.at(s0, v), front.at(s1, v)], k.FINE);
      for (let u = s0 + ((v / 3.2) % 2 ? 3 : 6); u < s1; u += 6) k.M([front.at(u, v - 3.2), front.at(u, v)], k.FINE);
    }
    /* floor-to-ceiling glass: panes with white mullions — never one black hole */
    for (let u = s1 + 2; u < W - 3; u += 6.2) {
      if (u > W * 0.56 && u < W * 0.56 + 9) continue;
      k.F(front.poly([[u, 2], [u + 5.2, 2], [u + 5.2, H - 2], [u, H - 2]]));
    }
    doorF(k, front, W * 0.56 + 4.4, H - 0.5, 8, H - 3, { glazed: true });
    /* a low plinth step and a slatted screen by the door */
    slab(k, -W / 2 - 2, W / 2 + 2, GNDY - 1.6, GNDY, -4, 0, k.MID);
    pavement(k, -W / 2, W / 2, D, 14);
    pot(k, W * 0.62, -10, 16, "cone", 3);
    pot(k, -W * 0.62, -12, 12, "bush", 27);
    return k.done();
  };

  /* ── 8 · MACHIYA — the timber lattice under a pent roof is the face ───── */
  A.machiya = () => {
    const M = massing({ w: 40, d: 44, top: -28, f: 330, dist: 205, yaw: -24 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const PENT = H * 0.46, ov = 4, RY = TOP - 11;
    /* flank: plaster with a timber frame */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [D * 0.33, D * 0.66].forEach((u) => k.M([flank.at(u, 0), flank.at(u, H)], k.MID));
    k.M([flank.at(0, PENT), flank.at(D, PENT)], k.MID);
    /* main roof: ridge along x, tiled, with ridge-end blocks */
    /* ridge along x — drawn as its VISIBLE edges: the near gable, ridge, front
       eave and soffit, and only the front leg of the far gable (its back leg
       lies across the facade with no occlusion to hide it) */
    const RX0 = -W / 2 - ov, RX1 = W / 2 + ov, RZ = D / 2;
    k.M([V.p(RX0, TOP, -ov), V.p(RX0, RY, RZ), V.p(RX0, TOP, D + ov)], k.OUT);
    k.M([V.p(RX0, RY, RZ), V.p(RX1, RY, RZ)], k.OUT);
    k.M([V.p(RX0, TOP, -ov), V.p(RX1, TOP, -ov)], k.OUT);
    k.M([V.p(RX1, TOP, -ov), V.p(RX1, RY, RZ)], k.OUT);
    k.M([V.p(RX0, TOP + 1.4, -ov), V.p(RX1, TOP + 1.4, -ov)], k.MID);
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, RY + (TOP - RY) * (ov / (RZ + ov)), RZ), V.p(-W / 2, TOP, D)], k.MID);
    for (let t = 0.2; t < 1; t += 0.2) {
      const y = TOP + (RY - TOP) * t, z = -ov + (D / 2 + ov) * t;
      k.M([V.p(-W / 2 - ov, y, z), V.p(W / 2 + ov, y, z)], k.FINE);
    }
    for (let x = -W / 2 - ov + 2.5; x < W / 2 + ov; x += 2.5) k.M([V.p(x, TOP, -ov), V.p(x, TOP + 1.2, -ov)], k.FINE);
    [-W / 2 - ov, W / 2 + ov].forEach((x) => slab(k, x - 1.6, x + 1.6, RY - 4, RY, D / 2 - 1.6, D / 2 + 1.6, k.OUT));
    /* the front */
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)], k.OUT, { closed: true });
    /* upper floor: mushiko-mado — plastered slits, black, with their bars */
    rectF(k, front, W * 0.12, H * 0.1, W * 0.88, H * 0.36, k.MID);
    for (let i = 0; i < 9; i++) {
      const u = W * 0.16 + i * (W * 0.68 / 9);
      k.F(front.poly([[u, H * 0.13], [u + 1.6, H * 0.13], [u + 1.6, H * 0.33], [u, H * 0.33]]));
    }
    /* the pent roof between floors: a tiled slope standing proud */
    const P0 = [front.at(-1, PENT - 1), front.at(W + 1, PENT - 1)];
    const P1 = [front.out(-1, PENT + 2.5, 7), front.out(W + 1, PENT + 2.5, 7)];
    k.M([P0[0], P0[1], P1[1], P1[0]], k.OUT, { closed: true });
    k.M([front.out(-1, PENT + 4, 7), front.out(W + 1, PENT + 4, 7)], k.MID);
    k.M([P1[0], front.out(-1, PENT + 4, 7)], k.MID);
    for (let t = 0.25; t < 1; t += 0.25) k.M([front.out(-1, PENT - 1 + 3.5 * t, 7 * t), front.out(W + 1, PENT - 1 + 3.5 * t, 7 * t)], k.FINE);
    /* koshi lattice across the ground floor — the whole face, finely */
    const L0 = PENT + 5, LU = W * 0.6;
    rectF(k, front, 1.5, L0, LU, H - 3, k.OUT);
    for (let u = 2.6; u < LU - 0.5; u += 1.1) k.M([front.at(u, L0 + 0.6), front.at(u, H - 3.6)], k.FINE);
    [L0 + 4, H - 7].forEach((v) => k.M([front.at(1.5, v), front.at(LU, v)], k.MID));
    k.M([front.at(1.5, H - 3), front.out(1.5, H - 3, 3), front.out(LU, H - 3, 3), front.at(LU, H - 3)], k.MID);
    /* the entry with its noren: three dark panels split at the seams */
    const d0 = W * 0.66, d1 = W * 0.94;
    rectF(k, front, d0, L0, d1, H, k.OUT);
    const nw = (d1 - d0 - 2) / 3;
    for (let i = 0; i < 3; i++) {
      const a = d0 + 1 + i * nw + 0.3, b = a + nw - 0.6;
      k.F(front.poly([[a, L0 + 1], [b, L0 + 1], [b, L0 + 9], [a, L0 + 9]]));
    }
    k.M([front.at(d0 - 1, L0 + 1), front.at(d1 + 1, L0 + 1)], k.OUT);
    pavement(k, -W / 2, W / 2, D, 10);
    pot(k, W * 0.62, -5, 9, "bush", 15);
    return k.done();
  };

  /* ── 9 · CYCLADIC HOUSE — stacked white cubes, a dome, an outside stair ── */
  A.cycladic = () => {
    const M = massing({ w: 56, d: 32, top: 2, f: 330, dist: 205, yaw: -24 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const U0 = -4, U1 = W / 2 - 2, UZ0 = 5, UZ1 = D - 4, UT = TOP - 20, PAR = 2.4;
    /* lower cube, its flank, and the roof-terrace parapet */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    windowF(k, flank, D * 0.6, H * 0.25, 7, 9, 2, 2, { sillOut: 1 });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)], k.OUT, { closed: true });
    k.M([V.p(-W / 2, TOP - PAR, 0), V.p(U0, TOP - PAR, 0)], k.MID);
    k.M([V.p(-W / 2, TOP - PAR, 0), V.p(-W / 2, TOP - PAR, D)], k.MID);
    k.M([V.p(-W / 2, TOP - PAR, 0), V.p(-W / 2, TOP, 0)], k.MID);
    k.M([V.p(-W / 2, TOP - PAR, D), V.p(-W / 2, TOP, D)], k.MID);
    /* upper cube, set back and to the right — two masses, no shared edge */
    const up = V.face([U0, UT, UZ0], [1, 0, 0], [0, 1, 0]);
    const uw = U1 - U0, uh = TOP - UT;
    k.M([V.p(U0, UT, UZ0), V.p(U0, UT, UZ1), V.p(U0, TOP, UZ1)], k.OUT);
    k.M([up.at(0, 0), up.at(uw, 0), up.at(uw, uh), up.at(0, uh)], k.OUT, { closed: true });
    k.M([V.p(U0, UT - PAR, UZ0), V.p(U1, UT - PAR, UZ0)], k.MID);
    k.M([V.p(U0, UT - PAR, UZ0), V.p(U0, UT, UZ0)], k.MID); k.M([V.p(U1, UT - PAR, UZ0), V.p(U1, UT, UZ0)], k.MID);
    windowF(k, up, uw * 0.35, uh * 0.25, 7, 9, 2, 2, { arch: true, sill: false });
    doorF(k, up, uw * 0.72, uh, 7, 13);
    /* the dome: a sphere's base ring (near half) and its vertical silhouette */
    const DX = (U0 + U1) / 2, DZ = (UZ0 + UZ1) / 2, DR = 7.5, DB = UT - PAR;
    drum(k, DX, DZ, DR, DR, DB, DB - 3, k.MID);
    const dome = [];
    for (let i = 0; i <= 20; i++) { const a = Math.PI * (i / 20); dome.push(V.p(DX - Math.cos(a) * DR, DB - 3 - Math.sin(a) * DR, DZ)); }
    k.M(dome, k.OUT, { curve: true });
    k.M([V.p(DX, DB - 3 - DR, DZ), V.p(DX, DB - 3 - DR - 4, DZ)], k.MID);
    drum(k, DX, DZ, 1.1, 1.1, DB - 3 - DR - 3.4, DB - 3 - DR - 4.8, k.MID);
    /* the outside stair up the front of the lower cube, with its solid balustrade */
    const S0 = 2, S1 = W * 0.42, n = 9;
    k.M([front.out(S0, H, 4), front.out(S1, 0, 4), front.out(S1, -PAR, 4), front.out(S0 - 1, H - PAR - 1, 4)], k.OUT);
    k.M([front.at(S0, H), front.out(S0, H, 4)], k.MID);
    for (let i = 1; i < n; i++) {
      const u = S0 + ((S1 - S0) * i) / n, v = H - (H * i) / n;
      k.M([front.out(u, v, 4), front.out(u, v + H / n, 4), front.out(u - (S1 - S0) / n, v + H / n, 4)], k.FINE);
    }
    /* ground floor openings: blue shutters read as black panes, an arched door */
    windowF(k, front, W * 0.58, H * 0.3, 8, 10, 2, 2);
    doorF(k, front, W * 0.82, H, 8, 16);
    chimney(k, -W * 0.36, TOP - PAR, D * 0.55, 3.4, 6);
    pavement(k, -W / 2, W / 2, D, 10);
    pot(k, W * 0.7, -5, 9, "bush", 33);
    pot(k, W * 0.47, -5, 7, "bush", 41);
    pot(k, -W * 0.56, -6, 11, "bush", 8);
    return k.done();
  };

  /* ── 10 · HOUSEBOAT — a house on a hull, standing on water ────────────── */
  A.houseboat = () => {
    const M = massing({ w: 74, d: 18, top: -2, f: 330, dist: 215, yaw: -18 });
    const { k, V, W, D } = M;
    const WL = GNDY, GW = GNDY - 8;               /* waterline, gunwale (at mid-ships) */
    const sheer = (x) => GW - 7 * Math.pow(Math.abs(x) / (W / 2), 2.6);   /* the deck rises to the ends */
    /* hull side: gunwale with sheer, a rubbing strake, planking to the water */
    const xs = []; for (let i = 0; i <= 24; i++) xs.push(-W / 2 + (W * i) / 24);
    const gun = xs.map((x) => V.p(x, sheer(x), 0));
    k.M(gun, k.OUT, { curve: true });
    k.M(xs.map((x) => V.p(x, sheer(x) + 1.6, 0)), k.MID, { curve: true });
    const keel = xs.map((x) => V.p(x * 0.92, WL, 0));
    k.M([gun[0], keel[0]], k.OUT); k.M([gun[24], keel[24]], k.OUT);
    for (let t = 0.3; t < 1; t += 0.23) k.M(xs.map((x) => V.p(x * (1 - 0.08 * t), sheer(x) + (WL - sheer(x)) * t, 0)), k.FINE, { curve: true });
    /* the bow and stern: the deck's end edges running back */
    [[-W / 2, gun[0]], [W / 2, gun[24]]].forEach(([x]) => k.M([V.p(x, sheer(x), 0), V.p(x, sheer(x), D)], k.MID));
    k.M([V.p(-W / 2, sheer(-W / 2), D), V.p(-W * 0.3, sheer(-W * 0.3), D)], k.FINE);
    /* the cabin: a box on the deck with a barrel-vault roof */
    const C0 = -W * 0.3, C1 = W * 0.28, CT = GW - 16, CZ0 = 2, CZ1 = D - 2, VR = (CZ1 - CZ0) / 2;
    const cab = V.face([C0, CT, CZ0], [1, 0, 0], [0, 1, 0]);
    const ch = GW - CT, cw = C1 - C0;
    k.M([cab.at(0, 0), cab.at(cw, 0), cab.at(cw, ch), cab.at(0, ch)], k.OUT, { closed: true });
    for (let i = 0; i < 4; i++) windowF(k, cab, cw * (0.14 + i * 0.2), ch * 0.22, 6.5, 7, 2, 1, { sill: false });
    doorF(k, cab, cw * 0.92, ch, 5.5, ch - 3);
    /* the vault: end arch on the near end, eave + crown lines, ribs on the near side */
    const arch = (x, dy) => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); p.push(V.p(x, CT - 1 + dy - Math.sin(a) * VR * 0.9, CZ0 + VR - Math.cos(a) * (VR + 2))); } return p; };
    k.M(arch(C0 - 2, 0), k.OUT, { curve: true });
    k.M(arch(C0 - 2, 1.4), k.MID, { curve: true });
    k.M([V.p(C0 - 2, CT - 1, CZ0 - 2), V.p(C1 + 2, CT - 1, CZ0 - 2)], k.OUT);
    k.M([V.p(C0 - 2, CT - 1 - VR * 0.9, CZ0 + VR), V.p(C1 + 2, CT - 1 - VR * 0.9, CZ0 + VR)], k.OUT);
    k.M([V.p(C1 + 2, CT - 1, CZ0 - 2), V.p(C1 + 2, CT - 1 - VR * 0.9, CZ0 + VR)], k.OUT);
    for (let x = C0 + 2; x < C1 + 2; x += 3.2) {
      const p = []; for (let i = 0; i <= 8; i++) { const a = (Math.PI / 2) * (i / 8); p.push(V.p(x, CT - 1 - Math.sin(a) * VR * 0.9, CZ0 + VR - Math.cos(a) * (VR + 2))); }
      k.M(p, k.FINE, { curve: true });
    }
    /* the open deck at the bow: a railing and two chairs' worth of life */
    const deck = V.face([-W / 2 + 6, GW, 0], [1, 0, 0], [0, 1, 0]);
    railing(k, deck, 0, C0 + W / 2 - 8, 0, 5.5, 5, 0);
    pot(k, C1 + 9, 1, 9, "bush", 12);
    /* water: the waterline, then ripples converging with distance, and a
       broken reflection under the hull — no pavement, the ground is water */
    k.M([V.p(-W / 2 - 14, WL, 0), V.p(W / 2 + 14, WL, 0)], k.MID);
    let a = 7; const R = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let r = 1; r <= 6; r++) {
      const z = -r * 4.5;
      for (let j = 0; j < 7; j++) {
        const x = -W / 2 - 10 + R() * (W + 20), L = 3 + R() * 6;
        k.M([V.p(x, WL, z), V.p(x + L, WL, z)], r < 3 ? k.MID : k.FINE);
      }
    }
    for (let i = 0; i < 9; i++) { const x = -W * 0.4 + i * (W * 0.1); k.M([V.p(x, WL, -1.5), V.p(x + 3.5, WL, -1.5)], k.FINE); }
    return k.done();
  };

  /* ── 11 · HAVELI — the face is its jharokhas: projecting, canopied, domed ── */
  A.haveli = () => {
    const M = massing({ w: 52, d: 36, top: -46, f: 330, dist: 215, yaw: -22 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const FL = [H * 0.36, H * 0.68];               /* floor lines, from the top */
    /* flank and front walls, the flat roof's parapet with its crenels */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)], k.OUT, { closed: true });
    slab(k, -W / 2 - 1.5, W / 2 + 1.5, TOP - 1.5, TOP, -1.5, D + 1.5, k.OUT);
    for (let u = 1; u < W; u += 4) rectF(k, front, u, -4, u + 2, -1.5, k.MID);
    windowF(k, flank, D * 0.5, H * 0.1, 6, 8, 1, 2, { arch: true, sillOut: 1 });
    windowF(k, flank, D * 0.5, H * 0.45, 6, 8, 1, 2, { arch: true, sillOut: 1 });
    /* chhajja: a thin sloping eave along each floor line, standing proud */
    FL.forEach((v) => {
      k.M([front.at(-1, v), front.at(W + 1, v), front.out(W + 1, v + 2, 4), front.out(-1, v + 2, 4)], k.OUT, { closed: true });
      for (let u = 2; u < W; u += 5) k.M([front.at(u, v + 0.6), front.out(u, v + 2.4, 3)], k.FINE);
    });
    /* jharokha: an oriel on corbels, two posts, an arched black opening,
       its own canopy and a dome — the landmark, repeated to make the rhythm */
    const jharokha = (cu, vb, w, h) => {
      const d = 5, u0 = cu - w / 2, u1 = cu + w / 2;
      k.M([front.at(u0 + 1, vb + 5), front.out(u0, vb, d), front.out(u1, vb, d), front.at(u1 - 1, vb + 5)], k.OUT);
      for (let i = 1; i < 4; i++) k.M([front.at(u0 + (w * i) / 4, vb + 4), front.out(u0 + (w * i) / 4, vb + 0.6, d)], k.FINE);
      k.M([front.out(u0, vb, d), front.out(u0, vb - h, d)], k.OUT);
      k.M([front.out(u1, vb, d), front.out(u1, vb - h, d)], k.OUT);
      k.M([front.at(u0, vb), front.out(u0, vb, d)], k.MID);
      k.M([front.at(u0, vb - h), front.out(u0, vb - h, d)], k.MID);
      const ar = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); ar.push([cu - Math.cos(a) * (w / 2 - 2), vb - h * 0.55 - Math.sin(a) * (w * 0.32)]); }
      k.F(ar.concat([[u1 - 2, vb - 1.5], [u0 + 2, vb - 1.5]]).map(([u, v]) => front.out(u, v, d)));
      k.M([front.out(u0 + 0.6, vb - 3, d), front.out(u1 - 0.6, vb - 3, d)], k.MID);
      k.M([front.out(u0 - 1.5, vb - h, d + 1.5), front.out(u1 + 1.5, vb - h, d + 1.5),
           front.out(u1 + 0.5, vb - h - 2, d), front.out(u0 - 0.5, vb - h - 2, d)], k.OUT, { closed: true });
      const dm = [];
      for (let i = 0; i <= 14; i++) { const a = Math.PI * (i / 14); dm.push(front.out(cu - Math.cos(a) * (w / 2 - 0.5), vb - h - 2 - Math.sin(a) * (w * 0.42), d - 1)); }
      k.M(dm, k.OUT, { curve: true });
      k.M([front.out(cu, vb - h - 2 - w * 0.42, d - 1), front.out(cu, vb - h - 5 - w * 0.42, d - 1)], k.MID);
    };
    [W * 0.24, W * 0.76].forEach((u) => jharokha(u, FL[1] - 3, 11, 12));
    jharokha(W * 0.5, FL[0] - 3, 13, 13);
    [W * 0.22, W * 0.78].forEach((u) => windowF(k, front, u, H * 0.08, 7, 8, 1, 2, { arch: true }));
    /* the great arched gate, studded */
    const gu = W * 0.5, gw = 14, gt = H - 22;
    const gate = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); gate.push([gu - Math.cos(a) * (gw / 2), gt - Math.sin(a) * (gw * 0.45)]); }
    k.M(front.poly(gate.concat([[gu + gw / 2, H], [gu - gw / 2, H]])), k.OUT, { closed: true });
    k.M([front.at(gu, gt - gw * 0.45), front.at(gu, H)], k.MID);
    for (let v = gt + 2; v < H; v += 3.6) [-4.2, -1.6, 1.6, 4.2].forEach((du) => k.F(front.poly([[gu + du - 0.4, v], [gu + du + 0.4, v], [gu + du + 0.4, v + 0.8], [gu + du - 0.4, v + 0.8]])));
    [W * 0.2, W * 0.8].forEach((u) => windowF(k, front, u, H * 0.78, 7, 8, 1, 2));
    /* chhatris on the roof corners: four posts, a platform, a dome */
    [[-W / 2 + 6, 6], [W / 2 - 6, 6]].forEach(([x, z]) => {
      const c = V.face([x - 5, TOP - 1.5, z], [1, 0, 0], [0, 1, 0]);
      [0.6, 9.4].forEach((u) => k.M([c.at(u, -1), c.at(u, -9)], k.OUT));
      k.M([c.at(-0.6, -9), c.at(10.6, -9), c.at(10.6, -10.4), c.at(-0.6, -10.4)], k.OUT, { closed: true });
      const dm = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); dm.push(c.at(5 - Math.cos(a) * 5, -10.4 - Math.sin(a) * 5)); }
      k.M(dm, k.OUT, { curve: true });
      k.M([c.at(5, -15.4), c.at(5, -18)], k.MID);
    });
    pavement(k, -W / 2, W / 2, D, 10);
    pot(k, -W * 0.62, -6, 11, "bush", 19);
    pot(k, W * 0.62, -6, 11, "bush", 43);
    return k.done();
  };

  /* ── 12 · TREEHOUSE — the house carried by a tree ─────────────────────── */
  A.treehouse = () => {
    const M = massing({ w: 26, d: 20, top: -30, f: 330, dist: 200, yaw: -24 });
    const { k, V, W, D, TOP } = M;
    const PY = TOP + 16, TX = 2, TZ = D + 4, TR = 6.5;   /* platform level; the trunk stands BEHIND the cabin */
    let a = 5; const R = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    /* the cabin's silhouette on the sheet: everything behind it is cut by it
       (marks have no occlusion, so the tree's lines are clipped here by hand) */
    const front = V.face([-W / 2, TOP, 0], [1, 0, 0], [0, 1, 0]), HB = PY - TOP;
    const sil = [V.p(-W / 2 - 3.5, TOP, -3.5), V.p(-W / 2 - 3.5, TOP - 11, D / 2), V.p(W / 2 + 3.5, TOP - 11, D / 2),
                 V.p(W / 2 + 3.5, TOP, -3.5), V.p(W / 2 + 5, PY + 2, -6), V.p(-W / 2 - 5, PY + 2, -6),
                 V.p(-W / 2 - 5, PY + 2, D + 2), V.p(-W / 2 - 3.5, TOP, D + 3.5)];
    const inside = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const cut = (pts, w, o) => {             /* emit the runs of a dense path that fall outside the cabin */
      let run = [];
      const flush = () => { if (run.length > 1) k.M(run, w, o); run = []; };
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i], p1 = pts[i + 1] || p0;
        for (let t = 0; t < 1; t += 0.25) { const q = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]; if (inside(q, sil)) flush(); else run.push(q); if (!pts[i + 1]) break; }
      }
      flush();
    };
    /* the canopy: ONE mass made of overlapping clumps. Only the union outline
       is drawn — a clump drops every point that falls inside another clump
       (tested in world space, where the clumps are true ellipses) — and the
       whole outline is then cut where the cabin stands in front of it */
    const clumps = [[TX, TOP - 24, 19, 13], [TX - 22, TOP - 14, 14, 11], [TX + 23, TOP - 13, 14, 11],
                    [TX - 15, TOP + 2, 11, 9], [TX + 17, TOP + 3, 11, 9], [TX - 8, TOP - 34, 11, 8], [TX + 11, TOP - 33, 11, 8]];
    const inClump = (x, y, c) => ((x - c[0]) / c[2]) ** 2 + ((y - c[1]) / c[3]) ** 2 < 0.97;
    clumps.forEach((c, ci) => {
      let run = [];
      const flush = () => { if (run.length > 2) cut(run, k.OUT, { curve: true }); run = []; };
      for (let i = 0; i <= 72; i++) {
        const t = (i / 72) * Math.PI * 2, bump = 1 + 0.08 * Math.abs(Math.sin(i * 0.52 + ci));
        const x = c[0] + Math.cos(t) * c[2] * bump, y = c[1] + Math.sin(t) * c[3] * bump;
        if (clumps.some((o, oi) => oi !== ci && inClump(x, y, o))) flush(); else run.push(V.p(x, y, TZ));
      }
      flush();
      for (let j = 0; j < 3; j++) {           /* a few inner lobes say "leaves", not "cloud" */
        const ax = c[0] - c[2] * 0.45 + R() * c[2] * 0.9, ay = c[1] - c[3] * 0.2 + R() * c[3] * 0.5, rr = 2.4 + R() * 2.2, arc = [];
        for (let m = 0; m <= 6; m++) { const q = Math.PI * (0.15 + 0.7 * (m / 6)); arc.push(V.p(ax - Math.cos(q) * rr, ay + Math.sin(q) * rr * 0.6, TZ)); }
        cut(arc, k.FINE, { curve: true });
      }
    });
    /* the trunk: a filled body, flared at the root, rising into the canopy behind the cabin */
    const trunk = (sd) => { const p = []; for (let i = 0; i <= 16; i++) {
      const t = i / 16, y = GNDY + (TOP - 14 - GNDY) * t, flare = y > GNDY - 7 ? (y - (GNDY - 7)) * 0.8 : 0;
      p.push(V.p(TX + sd * (TR + flare - t * 1.8), y, TZ)); } return p; };
    [-1, 1].forEach((sd) => cut(trunk(sd), k.OUT, { curve: true }));
    for (let i = 0; i < 9; i++) { const y = GNDY - 3 - i * 3.6, x = TX - 2 + (i % 3) * 1.6; cut([V.p(x, y, TZ), V.p(x + 0.5, y - 2.4, TZ)], k.FINE); }
    [-1, 1].forEach((sd) => k.M([V.p(TX + sd * (TR + 6), GNDY, TZ), V.p(TX + sd * (TR + 9), GNDY + 0.3, TZ - 2)], k.MID));
    /* limbs: two braces under the platform, two boughs up into the canopy */
    [[-1, -W / 2 - 3], [1, W / 2 + 3]].forEach(([sd, x]) => {
      k.M([V.p(TX + sd * (TR - 1), PY + 14, TZ), V.p(x, PY + 2.2, 2)], k.OUT);
      k.M([V.p(TX + sd * (TR - 1), PY + 17.5, TZ), V.p(x - sd * 2, PY + 2.6, 2)], k.MID);
    });
    /* the platform: a slab with board ends, a railing round the front */
    slab(k, -W / 2 - 5, W / 2 + 5, PY, PY + 2, -6, D + 2, k.OUT);
    for (let x = -W / 2 - 3; x < W / 2 + 5; x += 3) k.M([V.p(x, PY + 2, -6), V.p(x, PY, -6)], k.FINE);
    const plat = V.face([-W / 2 - 5, PY, -6], [1, 0, 0], [0, 1, 0]);
    railing(k, plat, 0, W * 0.62, 0, 5, 6, 0);
    railing(k, plat, W * 0.62 + 7, W + 10, 0, 5, 3, 0);
    /* the cabin, its ridge roof, a round window and a door */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(-W / 2, PY, D)], k.OUT);
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, HB), front.at(0, HB)], k.OUT, { closed: true });
    for (let v = 2.6; v < HB; v += 2.6) k.M([front.at(0, v), front.at(W, v)], k.FINE);
    ridgeRoof(k, -W / 2, W / 2, 0, D, TOP, TOP - 11, 3.5);
    k.M(circleF(front, W * 0.3, HB * 0.42, 3.6), k.OUT, { curve: true });
    k.F(circleF(front, W * 0.3, HB * 0.42, 2.6));
    doorF(k, front, W * 0.74, HB, 7, HB - 3);
    /* the rope ladder hangs from the railing's gap, clear of the trunk */
    const lx = -W / 2 - 5 + W * 0.62 + 1.2;
    [0, 4.5].forEach((dx) => k.M([V.p(lx + dx, PY + 2, -6), V.p(lx + dx - 0.6, (PY + GNDY) / 2, -9), V.p(lx + dx, GNDY, -12)], k.MID, { curve: true }));
    for (let i = 1; i < 8; i++) { const t = i / 8, y = PY + 2 + (GNDY - PY - 2) * t, z = -6 - 6 * t; k.M([V.p(lx - 0.3, y, z), V.p(lx + 4.2, y, z)], k.MID); }
    k.M([V.p(-W - 6, GNDY, 0), V.p(W + 10, GNDY, 0)], k.MID);
    for (let i = 0; i < 12; i++) { const x = -W - 2 + R() * (2 * W + 8); k.M([V.p(x, GNDY, -2), V.p(x + 0.6, GNDY - 2, -2), V.p(x + 1.2, GNDY, -2)], k.FINE); }
    return k.done();
  };

  /* ── 13 · EARTH-SHELTERED HOUSE — the house is a grassy mound ─────────── */
  A.mound = () => {
    const M = massing({ w: 60, d: 40, top: -6, f: 330, dist: 205, yaw: -18 });
    const { k, V, W, D, TOP, H, front } = M;
    /* the hill: a traced profile on the front plane, and its crest further back */
    const prof = [[-12, H], [-4, H - 9], [6, H - 20], [18, H - 27], [W / 2, H - 30], [W - 18, H - 27], [W - 6, H - 20], [W + 4, H - 9], [W + 12, H]];
    k.M(front.poly(prof), k.OUT, { curve: true });
    const crest = V.face([-W / 2, TOP, D * 0.55], [1, 0, 0], [0, 1, 0]);
    k.M(crest.poly(prof.slice(1, -1).map(([u, v]) => [u, v - 6])), k.MID, { curve: true });
    /* grass: tufts along contour lines across the whole mound */
    let a = 3; const R = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let band = 0; band < 6; band++) {
      const v0 = H - 4 - band * 4.5;
      for (let i = 0; i < 14; i++) {
        const u = -6 + R() * (W + 12);
        const top = Math.min(...prof.map(([pu, pv], j) => j ? null : null).filter(Boolean), H);
        const lim = prof.reduce((m, [pu, pv], j) => { const q = prof[j + 1]; if (q && u >= pu && u <= q[0]) return pv + (q[1] - pv) * ((u - pu) / (q[0] - pu)); return m; }, H);
        if (v0 < lim + 2.5) continue;
        if (u > W / 2 - 13 && u < W / 2 + 13 && v0 > H - 22) continue;     /* the door and its stones */
        k.M([front.at(u, v0), front.at(u + 0.6, v0 - 2), front.at(u + 1.2, v0)], k.FINE);
      }
    }
    /* the round door in a stone ring, planked, with its knob in the middle */
    const dc = [W / 2, H - 9.5], dr = 9;
    k.M(circleF(front, dc[0], dc[1], dr + 2.4, 36), k.OUT, { curve: true });
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      k.M([front.at(dc[0] + Math.cos(t) * dr, dc[1] + Math.sin(t) * dr), front.at(dc[0] + Math.cos(t) * (dr + 2.4), dc[1] + Math.sin(t) * (dr + 2.4))], k.FINE);
    }
    const door = circleF(front, dc[0], dc[1], dr, 36).filter((p, i, arr) => true);
    k.M(door, k.OUT, { curve: true });
    for (let du = -6; du <= 6; du += 3) {
      const hv = Math.sqrt(dr * dr - du * du);
      k.M([front.at(dc[0] + du, dc[1] - hv + 0.6), front.at(dc[0] + du, Math.min(H, dc[1] + hv - 0.6))], k.FINE);
    }
    k.F(circleF(front, dc[0], dc[1], 1.1, 12));
    k.M([front.at(dc[0] - dr - 2.4, H), front.at(dc[0] + dr + 2.4, H)], k.OUT);
    /* two round windows with their four lights, and a stone chimney out of the turf */
    [W * 0.22, W * 0.78].forEach((u) => {
      k.M(circleF(front, u, H - 12, 5.4), k.OUT, { curve: true });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        const q = []; for (let i = 0; i <= 6; i++) { const t = (Math.PI / 2) * (i / 6); q.push([u + sx * (0.5 + Math.cos(t) * 3.9), H - 12 + sy * (0.5 + Math.sin(t) * 3.9)]); }
        q.push([u + sx * 0.5, H - 12 + sy * 0.5]);
        k.F(front.poly(q));
      });
    });
    slab(k, W * 0.18 - W / 2, W * 0.18 - W / 2 + 5, TOP - 2, H - 32 + TOP, D * 0.4, D * 0.4 + 5, k.OUT);
    for (let y = TOP; y < H - 32 + TOP; y += 2.5) k.M([V.p(W * 0.18 - W / 2, y, D * 0.4), V.p(W * 0.18 - W / 2 + 5, y, D * 0.4)], k.FINE);
    /* low dry-stone walls either side of the door (a path of small stones smeared into a black blot in perspective) */
    [[-W / 2 + 4, -14], [W / 2 - 4, 14]].forEach(([x, dx]) => {
      slab(k, Math.min(x, x + dx), Math.max(x, x + dx), GNDY - 4, GNDY, -4, -1, k.MID);
      for (let i = 0; i < 4; i++) k.M([V.p(Math.min(x, x + dx) + i * 3.5, GNDY - 4, -4), V.p(Math.min(x, x + dx) + i * 3.5 + 1.6, GNDY, -4)], k.FINE);
    });
    pot(k, -9, -6, 9, "bush", 23);
    pot(k, 9, -6, 9, "bush", 37);
    return k.done();
  };

  /* ── 14 · TINY HOUSE ON WHEELS — a house on a trailer ─────────────────── */
  A.tiny = () => {
    const M = massing({ w: 56, d: 18, top: -16, f: 330, dist: 210, yaw: -22 });
    const { k, V, W, D } = M;
    const DECK = GNDY - 11, TOP = DECK - 27;
    const front = V.face([-W / 2, TOP, 0], [1, 0, 0], [0, 1, 0]), HB = DECK - TOP;
    /* the trailer: chassis rail, tongue and coupler, jack stand */
    slab(k, -W / 2 - 1, W / 2 + 1, DECK, DECK + 2.4, -0.5, D + 0.5, k.OUT);
    k.M([V.p(-W / 2, DECK + 2, 2), V.p(-W / 2 - 14, DECK + 3.5, D / 2), V.p(-W / 2, DECK + 2, D - 2)], k.OUT);
    k.M([V.p(-W / 2 - 14, DECK + 3.5, D / 2), V.p(-W / 2 - 17, DECK + 3.5, D / 2)], k.OUT);
    k.M([V.p(-W / 2 - 8, DECK + 3, D / 2 - 1), V.p(-W / 2 - 8, GNDY, D / 2 - 1)], k.MID);
    k.M([V.p(-W / 2 - 9.6, GNDY, D / 2 - 1), V.p(-W / 2 - 6.4, GNDY, D / 2 - 1)], k.MID);
    /* tandem wheels with fenders, drawn on the side plane */
    const side = V.face([-W / 2, DECK, -0.6], [1, 0, 0], [0, 1, 0]);
    [W * 0.56, W * 0.72].forEach((u) => {
      const c = GNDY - 5 - DECK;
      k.F(circleF(side, u, c, 5, 24));
      k.M(circleF(side, u, c, 2.2, 16), k.OUT, { curve: true });
      k.F(circleF(side, u, c, 0.7, 8));
    });
    const fd = []; for (let i = 0; i <= 12; i++) { const t = Math.PI * (i / 12); fd.push(side.out(W * 0.64 - Math.cos(t) * 13.5, 1 - Math.sin(t) * 1.6, 0.8)); }
    k.M(fd, k.OUT, { curve: true });
    /* the house: vertical siding, a ridge roof, windows, a door with loose steps */
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(-W / 2, DECK, D), V.p(-W / 2, DECK, 0)], k.OUT, { closed: true });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, HB), front.at(0, HB)], k.OUT, { closed: true });
    for (let u = 2; u < W; u += 2) if (!(u > W * 0.42 && u < W * 0.56)) k.M([front.at(u, 1), front.at(u, HB - 1)], k.FINE);
    ridgeRoof(k, -W / 2, W / 2, 0, D, TOP, TOP - 9, 2.5);
    windowF(k, front, W * 0.18, HB * 0.24, 10, 9, 2, 1);
    windowF(k, front, W * 0.78, HB * 0.24, 12, 9, 3, 1);
    windowF(k, front, W * 0.78, -4.5, 9, 3, 3, 1, { sill: false, reveal: false });
    doorF(k, front, W * 0.49, HB, 7, HB - 3, { glazed: true });
    for (let i = 0; i < 3; i++) slab(k, -3.5 + i * 0.3, 3.5 - i * 0.3, DECK + 3 + i * 2.6, DECK + 3.6 + i * 2.6, -3 - i * 2.5, -1 - i * 2.5, k.MID);
    k.M([V.p(-W / 2 - 22, GNDY, 0), V.p(W / 2 + 10, GNDY, 0)], k.MID);
    pot(k, W * 0.36, -8, 10, "cone", 9);
    return k.done();
  };

  /* ── 15 · CONTAINER HOUSE — two corrugated boxes, the upper cantilevered ── */
  A.container = () => {
    const M = massing({ w: 60, d: 14, top: 12, f: 330, dist: 210, yaw: -24 });
    const { k, V, W, D } = M;
    const L = { x0: -W / 2, x1: W / 2, y0: GNDY - 14, y1: GNDY };
    const U = { x0: -W / 2 + 18, x1: W / 2 + 14, y0: GNDY - 28.4, y1: GNDY - 14.4 };
    const box = (B, fill) => {
      slab(k, B.x0, B.x1, B.y0, B.y1, 0, D, k.OUT);
      /* corrugation over the whole visible skin — a combed surface, all of it */
      for (let x = B.x0 + 1.4; x < B.x1 - 0.5; x += 1.4) if (!fill || !fill(x)) k.M([V.p(x, B.y0 + 0.8, 0), V.p(x, B.y1 - 0.8, 0)], k.FINE);
      /* corner castings: the container's landmark, small black blocks */
      [[B.x0, B.y0], [B.x1 - 1.6, B.y0], [B.x0, B.y1 - 1.6], [B.x1 - 1.6, B.y1 - 1.6]].forEach(([x, y]) =>
        k.F([V.p(x, y, 0), V.p(x + 1.6, y, 0), V.p(x + 1.6, y + 1.6, 0), V.p(x, y + 1.6, 0)]));
      k.M([V.p(B.x0, B.y0 + 1.6, 0), V.p(B.x1, B.y0 + 1.6, 0)], k.MID);
      k.M([V.p(B.x0, B.y1 - 1.6, 0), V.p(B.x1, B.y1 - 1.6, 0)], k.MID);
    };
    /* lower: glazing cut into the side, its end doors with locking bars */
    const lowGlass = (x) => x > -6 && x < 20;
    box(L, lowGlass);
    const lf = V.face([L.x0, L.y0, 0], [1, 0, 0], [0, 1, 0]);
    for (let u = W / 2 - 6 + 0.6; u < W / 2 + 20 - 1; u += 6.4) k.F(lf.poly([[u, 2.6], [u + 5.6, 2.6], [u + 5.6, 12.4], [u, 12.4]]));
    const lend = V.face([L.x0, L.y0, D], [0, 0, -1], [0, 1, 0]);
    [D * 0.3, D * 0.7].forEach((u) => k.M([lend.at(u, 1.6), lend.at(u, 12.4)], k.MID));
    k.M([lend.at(D / 2, 1.6), lend.at(D / 2, 12.4)], k.OUT);
    windowF(k, lf, W * 0.14, 3.4, 9, 6, 2, 1, { sill: false });
    doorF(k, lf, W * 0.82, 13.6, 6, 11, { glazed: true });
    /* upper, cantilevered: a full-height glazed end and a ribbon window */
    box(U, (x) => x > U.x1 - 13);
    const uf = V.face([U.x0, U.y0, 0], [1, 0, 0], [0, 1, 0]);
    for (let u = U.x1 - U.x0 - 12; u < U.x1 - U.x0 - 1; u += 3.8) k.F(uf.poly([[u, 2.4], [u + 3.1, 2.4], [u + 3.1, 11.6], [u, 11.6]]));
    for (let u = 6; u < 26; u += 5) k.F(uf.poly([[u, 4], [u + 4.3, 4], [u + 4.3, 7.6], [u, 7.6]]));
    /* the steel stair to the lower roof, and a railing on the terrace it reaches */
    const st = V.face([L.x0 - 12, L.y0, -3], [1, 0, 0], [0, 1, 0]);
    k.M([st.at(0, 14), st.at(12, 0)], k.OUT); k.M([st.at(2.6, 14), st.at(14.6, 0)], k.OUT);
    for (let i = 1; i < 8; i++) { const t = i / 8; k.M([st.at(12 * t, 14 - 14 * t), st.at(12 * t + 2.6, 14 - 14 * t)], k.MID); }
    k.M([st.at(0, 14), st.at(0, 9), st.at(12, -5)], k.MID);
    const terr = V.face([L.x0, L.y0, 0], [1, 0, 0], [0, 1, 0]);
    railing(k, terr, 1, 17, 0, 5, 6, 0);
    k.M([V.p(-W / 2 - 18, GNDY, 0), V.p(W / 2 + 18, GNDY, 0)], k.MID);
    pot(k, -W * 0.5 - 15, -8, 12, "cone", 47);
    pot(k, W * 0.3, -6, 9, "bush", 3);
    return k.done();
  };

  /* ── 16 · IGLOO — a hemisphere of snow blocks and its entrance tunnel ── */
  A.igloo = () => {
    const M = massing({ w: 48, d: 48, top: 0, f: 330, dist: 205, yaw: -20 });
    const { k, V } = M;
    const R = 23, CZ = R + 6, { ring, halfRing } = K2;
    /* the dome: its true outline, then courses (near halves, shrinking toward the crown) */
    const sil = hull(revolve(V, 0, CZ, (t) => [R * Math.cos((t * Math.PI) / 2), GNDY - R * Math.sin((t * Math.PI) / 2)], 18, 40));
    const base = ring(V, 0, CZ, R, GNDY, 48);
    k.M(hullAbove(sil, Math.max(...halfRing(base, true).map((p) => p[1])) - 0.1), k.OUT, { curve: true });
    k.M(halfRing(base, true), k.OUT, { curve: true });
    const N = 7;
    for (let i = 1; i < N; i++) {
      const la = (i / N) * (Math.PI / 2), y = GNDY - R * Math.sin(la), r = R * Math.cos(la);
      k.M(halfRing(ring(V, 0, CZ, r, y, 48), true), k.MID, { curve: true });
      /* staggered joints between this course and the one below, near half only, clear of the tunnel */
      const la0 = ((i - 1) / N) * (Math.PI / 2), y0 = GNDY - R * Math.sin(la0), r0 = R * Math.cos(la0);
      const n = Math.max(4, Math.round(12 * Math.cos(la)));
      for (let j = 0; j < n; j++) {
        const a = Math.PI * ((j + (i % 2 ? 0.5 : 0)) / n);
        if (a < 0.12 || a > Math.PI - 0.12) continue;
        if (i <= 2 && Math.abs(Math.cos(a)) < 0.38) continue;
        k.M([V.p(-Math.cos(a) * r0, y0, CZ - Math.sin(a) * r0), V.p(-Math.cos(a) * r, y, CZ - Math.sin(a) * r)], k.FINE);
      }
    }
    k.M(halfRing(ring(V, 0, CZ, 2.4, GNDY - R + 0.3, 16), true), k.MID, { curve: true });
    /* the entrance tunnel: a half-vault running out toward us, its dark mouth filled */
    const TZ = CZ - R - 9, TR = 8;
    const arch = (z, r) => { const p = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); p.push(V.p(-Math.cos(a) * r, GNDY - Math.sin(a) * r * 1.05, z)); } return p; };
    k.M(arch(TZ, TR), k.OUT, { curve: true });
    k.F(arch(TZ, TR - 2.6).concat([V.p(TR - 2.6, GNDY, TZ), V.p(-TR + 2.6, GNDY, TZ)]));
    k.M(arch(TZ, TR - 2.6), k.MID, { curve: true });
    [-TR, TR].forEach((x) => k.M([V.p(x, GNDY, TZ), V.p(x, GNDY, TZ + 8.5)], k.OUT));
    k.M([V.p(0, GNDY - TR * 1.05, TZ), V.p(0, GNDY - TR * 1.05, TZ + 7)], k.OUT);
    [0.35, 0.7].forEach((t) => k.M(arch(TZ + 8 * t, TR).filter((_, i) => i < 9), k.FINE, { curve: true }));
    /* snow: a ground line and soft drifts, a few stacked blocks waiting by the door */
    k.M([V.p(-R - 18, GNDY, -4), V.p(R + 18, GNDY, -4)], k.MID);
    [[-R - 6, -10, 9], [R + 4, -8, 12]].forEach(([x, z, w]) => k.M([V.p(x - w, GNDY, z), V.p(x - w / 3, GNDY - 2.6, z), V.p(x + w / 3, GNDY - 2.2, z), V.p(x + w, GNDY, z)], k.MID, { curve: true }));
    slab(k, 14, 22, GNDY - 4, GNDY, -14, -8, k.MID);
    slab(k, 15, 21, GNDY - 8, GNDY - 4, -13, -9, k.MID);
    return k.done();
  };

  /* ── 17 · OCTAGON HOUSE — eight walls, a low hip, a cupola ───────────── */
  A.octagon = () => {
    const M = massing({ w: 56, d: 56, top: -24, f: 330, dist: 215, yaw: -18 });
    const { k, V, TOP } = M;
    const R = 27, CZ = R, H = GNDY - TOP;
    const corner = (i, r, y) => { const a = Math.PI / 8 + (i * Math.PI) / 4; return [Math.cos(a) * r, y, CZ - Math.sin(a) * r]; };
    /* a wall is drawn only if it faces the camera: signed area of its projected quad */
    const sa = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };
    const walls = [];
    for (let i = 0; i < 8; i++) {
      const A0 = corner(i, R, TOP), A1 = corner(i + 1, R, TOP);
      const quad = [V.p(A1[0], TOP, A1[2]), V.p(A0[0], TOP, A0[2]), V.p(A0[0], GNDY, A0[2]), V.p(A1[0], GNDY, A1[2])];
      if (sa(quad) > 0.02) walls.push({ i, A0, A1, quad });
    }
    walls.forEach(({ A0, A1, quad }) => {
      k.M(quad, k.OUT, { closed: true });
      const L = Math.hypot(A0[0] - A1[0], A0[2] - A1[2]);
      const F = V.face([A1[0], TOP, A1[2]], [(A0[0] - A1[0]) / L, 0, (A0[2] - A1[2]) / L], [0, 1, 0]);
      const front = Math.abs((A0[2] + A1[2]) / 2 - (CZ - R)) < 3;
      windowF(k, F, L / 2, H * 0.1, 6.5, 11, 2, 3, { sillOut: 1 });
      if (front) doorF(k, F, L / 2, H, 7.5, 17, { glazed: true });
      else windowF(k, F, L / 2, H * 0.56, 6.5, 11, 2, 3, { sillOut: 1 });
      k.M([F.at(0, H * 0.48), F.at(L, H * 0.48)], k.FINE);
    });
    /* the low octagonal hip: eave edges and hips over the faces we see, a bracketed cornice */
    const ov = 3.5, EY = TOP - 1, AY = TOP - 11, apex = V.p(0, AY, CZ);
    walls.forEach(({ i }) => {
      const e0 = corner(i, R + ov, EY), e1 = corner(i + 1, R + ov, EY);
      k.M([V.p(...e0), V.p(...e1)], k.OUT);
      k.M([V.p(e0[0], EY + 1.6, e0[2]), V.p(e1[0], EY + 1.6, e1[2])], k.MID);
      for (let t = 0.125; t < 1; t += 0.25) { const x = e0[0] + (e1[0] - e0[0]) * t, z = e0[2] + (e1[2] - e0[2]) * t; k.M([V.p(x, EY + 1.6, z), V.p(x * 0.97, EY + 3.2, CZ + (z - CZ) * 0.97)], k.FINE); }
    });
    const hips = new Set(); walls.forEach(({ i }) => { hips.add(i); hips.add(i + 1); });
    [...hips].forEach((i) => k.M([V.p(...corner(i, R + ov, EY)), apex], i === Math.min(...hips) || i === Math.max(...hips) ? k.OUT : k.MID));
    /* the cupola: a small octagon of windows with its own cap and finial */
    const cr = 6.5, cb = TOP - 7, ct = cb - 8;
    for (let i = 0; i < 8; i++) {
      const c0 = corner(i, cr, 0), c1 = corner(i + 1, cr, 0);
      const q = [V.p(c1[0], ct, c1[2]), V.p(c0[0], ct, c0[2]), V.p(c0[0], cb, c0[2]), V.p(c1[0], cb, c1[2])];
      if (sa(q) > 0.01) {
        k.M(q, k.MID, { closed: true });
        const m = (u, v) => V.p(c1[0] + (c0[0] - c1[0]) * u, ct + (cb - ct) * v, c1[2] + (c0[2] - c1[2]) * u);
        k.F([m(0.2, 0.18), m(0.8, 0.18), m(0.8, 0.82), m(0.2, 0.82)]);
      }
    }
    const cap = V.p(0, ct - 6, CZ);
    for (let i = 1; i <= 4; i++) k.M([V.p(...corner(i, cr + 1.2, ct)), cap], k.MID);
    k.M([1, 2, 3, 4, 5].map((i) => V.p(...corner(i, cr + 1.2, ct))), k.OUT);
    k.M([cap, [cap[0], cap[1] - 4]], k.OUT);
    pavement(k, -R, R, CZ, 12);
    pot(k, -R * 0.9, -6, 12, "cone", 7);
    pot(k, R * 0.9, -6, 12, "cone", 19);
    return k.done();
  };

  /* ── 18 · FUTURO POD — a saucer shell lifted on a ring of legs ───────── */
  A.pod = () => {
    const M = massing({ w: 60, d: 60, top: 0, f: 330, dist: 210, yaw: -16 });
    const { k, V } = M;
    const RX = 27, HY = 10.5, CY = GNDY - 25, CZ = RX + 4, { ring, halfRing } = K2;
    const prof = (t) => { const a = -Math.PI / 2 + t * Math.PI; return [RX * Math.cos(a), CY - HY * Math.sin(a)]; };
    k.M(hull(revolve(V, 0, CZ, prof, 24, 48)), k.OUT, { curve: true, closed: true });
    /* the equator rim, the shell's seams (meridians, near half), the hatch below */
    k.M(halfRing(ring(V, 0, CZ, RX + 0.6, CY, 56), true), k.OUT, { curve: true });
    k.M(halfRing(ring(V, 0, CZ, RX * 0.96, CY + 2.4, 56), true), k.MID, { curve: true });
    for (let j = 1; j < 12; j++) {
      const a = Math.PI * (j / 12), m = [];
      for (let t = 0.06; t <= 0.5; t += 0.04) { const [r, y] = prof(t + 0.5); m.push(V.p(-Math.cos(a) * r, y, CZ - Math.sin(a) * r)); }
      k.M(m, k.FINE, { curve: true });
    }
    /* the ring of oval windows round the upper shell — the type's landmark */
    for (let j = 1; j < 8; j++) {
      const a = Math.PI * (j / 8), o = [];
      for (let i = 0; i <= 20; i++) {
        const t = (i / 20) * Math.PI * 2, da = Math.cos(t) * 0.17, dy = Math.sin(t) * 3;
        const yy = CY - 4 + dy, r = RX * Math.sqrt(Math.max(0, 1 - ((CY - yy) / HY) ** 2)) - 0.3;
        o.push(V.p(-Math.cos(a + da) * r, yy, CZ - Math.sin(a + da) * r));
      }
      k.F(o);
    }
    /* the steel ring and its legs, the fold-down stair from the hatch */
    const LY = CY + HY - 1;
    k.M(halfRing(ring(V, 0, CZ, RX * 0.55, LY, 40), true), k.MID, { curve: true });
    [0.2, 0.5, 0.8].forEach((f) => {
      const a = Math.PI * f, x0 = -Math.cos(a) * RX * 0.55, z0 = CZ - Math.sin(a) * RX * 0.55;
      const x1 = -Math.cos(a) * RX * 0.8, z1 = CZ - Math.sin(a) * RX * 0.8;
      k.M([V.p(x0, LY, z0), V.p(x1, GNDY, z1)], k.OUT);
      k.M([V.p(x1 - 2, GNDY, z1), V.p(x1 + 2, GNDY, z1)], k.MID);
    });
    const HX = 8;
    k.M([V.p(HX - 4, LY, CZ - 9), V.p(HX + 4, LY, CZ - 9)], k.MID);
    [HX - 3.5, HX + 3.5].forEach((x) => k.M([V.p(x, LY, CZ - 9), V.p(x, GNDY, CZ - 22)], k.OUT));
    for (let i = 1; i < 6; i++) { const t = i / 6; k.M([V.p(HX - 3.5, LY + (GNDY - LY) * t, CZ - 9 - 13 * t), V.p(HX + 3.5, LY + (GNDY - LY) * t, CZ - 9 - 13 * t)], k.MID); }
    k.M([V.p(-RX - 14, GNDY, -2), V.p(RX + 14, GNDY, -2)], k.MID);
    pot(k, -RX - 4, 2, 14, "cone", 33);
    pot(k, RX + 2, 0, 9, "bush", 9);
    return k.done();
  };

  /* ── 19 · TOWER HOUSE — a stone keep, corner turrets, a crow-stepped gable ── */
  A.tower = () => {
    const M = massing({ w: 32, d: 26, top: -50, f: 330, dist: 215, yaw: -24 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const TB = 16, TT = 3;                     /* turret base (below the wall top), how high it rises */
    /* the walls — the near corner line stops where the turret stands in front of it */
    k.M([V.p(-W / 2, TOP + TB, 0), V.p(-W / 2, GNDY, 0)], k.OUT);
    k.M([V.p(-W / 2, TOP, D), V.p(-W / 2, GNDY, D)], k.OUT);
    k.M([V.p(-W / 2, GNDY, 0), V.p(-W / 2, GNDY, D)], k.OUT);
    k.M([V.p(W / 2, TOP + TB, 0), V.p(W / 2, GNDY, 0)], k.OUT);
    k.M([front.at(2.6, 0), front.at(W - 2.6, 0)], k.OUT);
    k.M([V.p(-W / 2, GNDY, 0), V.p(W / 2, GNDY, 0)], k.OUT);
    k.M([V.p(-W / 2, TOP, 3), V.p(-W / 2, TOP, D)], k.OUT);
    /* quoins at the corners and a few stones — draw some, imply the rest */
    let a = 11; const R = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let v = TB + 2; v < H - 1; v += 4) {
      const long = (v / 4) % 2 < 1;
      rectF(k, front, 0, v, long ? 5.5 : 3.5, v + 4, k.FINE);
      rectF(k, front, W - (long ? 3.5 : 5.5), v, W, v + 4, k.FINE);
    }
    for (let i = 0; i < 14; i++) { const u = 7 + R() * (W - 14), v = 8 + R() * (H - 14), w = 3 + R() * 3; rectF(k, front, u, v, u + w, v + 2.6, k.FINE); }
    for (let i = 0; i < 9; i++) { const u = 3 + R() * (D - 6), v = 8 + R() * (H - 14); rectF(k, flank, u, v, u + 3 + R() * 3, v + 2.6, k.FINE); }
    /* small deep windows, arrow slits, a door up a short stone stair */
    windowF(k, front, W * 0.5, H * 0.14, 6, 9, 1, 2);
    windowF(k, front, W * 0.32, H * 0.42, 5.5, 8, 1, 2);
    windowF(k, front, W * 0.7, H * 0.42, 5.5, 8, 1, 2);
    [W * 0.22, W * 0.78].forEach((u) => k.F(front.poly([[u - 0.6, H * 0.7], [u + 0.6, H * 0.7], [u + 0.6, H * 0.7 + 7], [u - 0.6, H * 0.7 + 7]])));
    windowF(k, flank, D * 0.5, H * 0.3, 5, 8, 1, 2, { sillOut: 1 });
    doorF(k, front, W * 0.5, H - 6, 7, 13);
    for (let i = 0; i < 3; i++) slab(k, -4.5 + i * 0.4, 4.5 - i * 0.4, GNDY - 6 + i * 2, GNDY - 4 + i * 2, -2 - i * 2.4, -i * 2.4, k.MID);
    /* the roof: ridge along x, the near gable crow-stepped against the sky */
    const RY = TOP - 16, RZ = D / 2;
    k.M([V.p(-W / 2, RY, RZ), V.p(W / 2, RY, RZ)], k.OUT);
    k.M([V.p(-W / 2 + 3, TOP, 0), V.p(W / 2 - 3, TOP, 0)], k.MID);
    for (let t = 0.2; t < 1; t += 0.2) k.M([V.p(-W / 2 + 3, TOP + (RY - TOP) * t, RZ * t), V.p(W / 2 - 3, TOP + (RY - TOP) * t, RZ * t)], k.FINE);
    const steps = 5, sp = [];
    for (let i = 0; i <= steps; i++) {
      const z0 = (RZ * i) / steps, z1 = (RZ * (i + 1)) / steps, y = TOP + ((RY - TOP) * (i + 0.5)) / steps - 1.5;
      sp.push(V.p(-W / 2, y, z0)); if (i < steps) sp.push(V.p(-W / 2, y, z1));
    }
    for (let i = steps - 1; i >= 0; i--) {
      const zz = D - (RZ * i) / steps, z1 = D - (RZ * (i + 1)) / steps, y = TOP + ((RY - TOP) * (i + 0.5)) / steps - 1.5;
      sp.push(V.p(-W / 2, y, z1), V.p(-W / 2, y, zz));
    }
    k.M(sp, k.OUT);
    chimney(k, W / 2 - 4, RY + 2, RZ, 4, 6);
    /* corner turrets: corbelled drums with conical caps, standing proud of both walls */
    [[-W / 2 + 0.6, 0.6], [W / 2 - 0.6, 0.6]].forEach(([x, z]) => {
      const r = 4.4, by = TOP + TB, ty = TOP - TT;
      for (let i = 0; i < 4; i++) drum(k, x, z, r * (0.35 + i * 0.16), r * (0.5 + i * 0.16), by + 4 - i, by + 3 - i, k.FINE);
      drum(k, x, z, r, r, by, ty, k.OUT);
      K2.coneRoof(k, x, z, r + 1.2, ty, ty - 11);
      const tf = V.face([x - 1.2, ty + 4, z - r], [1, 0, 0], [0, 1, 0]);
      k.F(tf.poly([[0, 0], [2.4, 0], [2.4, 5], [0, 5]]));
    });
    pavement(k, -W / 2, W / 2, D, 12);
    pot(k, W * 0.75, -8, 12, "bush", 23);
    return k.done();
  };

  /* ── 20 · CAVE HOUSE — a home carved into a cliff ─────────────────────── */
  A.cave = () => {
    const M = massing({ w: 46, d: 30, top: -30, f: 330, dist: 210, yaw: -20 });
    const { k, V, W, D, TOP, H, front } = M;
    /* the cliff: a traced outline on the face plane and its top running back */
    /* jagged and asymmetric — a smooth symmetric outline read as a thatched hangar */
    const rock = [[-22, H], [-21, H - 9], [-26, H - 16], [-19, H - 27], [-21, H - 34], [-12, H - 41], [-8, H - 52], [2, H - 55], [9, H - 63],
                  [18, H - 61], [27, H - 70], [34, H - 67], [44, H - 74], [51, H - 66], [58, H - 60], [63, H - 48], [70, H - 43], [72, H - 29], [79, H - 21], [77, H - 9], [82, H]];
    k.M(front.poly(rock), k.OUT);
    const back = V.face([-W / 2, TOP, D], [1, 0, 0], [0, 1, 0]);
    k.M(back.poly(rock.slice(2, 14).map(([u, v]) => [u + 3, v - 5])), k.MID);
    [[-26, H - 16], [27, H - 70], [44, H - 74]].forEach(([u, v]) => k.M([front.at(u, v), back.at(u + 3, v - 5)], k.MID));
    /* the carved facade — a flat dressed panel set into the rock */
    const F0 = 2, F1 = W - 2, FT = 10;
    const inFacade = (u, v) => u > F0 - 2 && u < F1 + 2 && v > FT - 2;
    k.M(front.poly([[F0, H], [F0, FT + 4], [F0 + 4, FT], [F1 - 4, FT], [F1, FT + 4], [F1, H]]), k.OUT);
    /* strata: the rock's bedding lines, across all of it, broken at the facade */
    let a = 17; const R = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const top = (u) => { for (let i = 0; i < rock.length - 1; i++) { const [u0, v0] = rock[i], [u1, v1] = rock[i + 1]; if (u >= u0 && u <= u1) return v0 + (v1 - v0) * ((u - u0) / (u1 - u0)); } return H; };
    /* bedding: straight, slightly dipping, broken often — rock, not thatch */
    for (let v = H - 5; v > H - 74; v -= 5.5) {
      let run = [];
      const flush = () => { if (run.length > 1) k.M(run, k.FINE); run = []; };
      for (let u = -25; u <= 81; u += 3) {
        const vv = v + (u - 28) * 0.05 + (R() - 0.5) * 0.6;
        if (vv < top(u) + 1.5 || inFacade(u, vv) || R() < 0.16) flush(); else run.push(front.at(u, vv));
      }
      flush();
    }
    /* vertical joints and cracks, angular, a few per band */
    for (let i = 0; i < 16; i++) {
      const u = -20 + R() * 98, v = top(u) + 4 + R() * (H - top(u) - 10);
      if (inFacade(u, v) || inFacade(u, v + 6)) continue;
      k.M([front.at(u, v), front.at(u + (R() - 0.5) * 2.5, v + 3 + R() * 3), front.at(u + (R() - 0.5) * 3, v + 7 + R() * 2)], k.FINE);
    }
    /* boulders at the foot */
    [[-17, 7], [-9, 4.5], [70, 8], [61, 5]].forEach(([u, r]) =>
      k.M(front.poly([[u - r, H], [u - r * 0.8, H - r * 0.7], [u - r * 0.1, H - r], [u + r * 0.7, H - r * 0.75], [u + r, H]]), k.MID, { closed: true }));
    /* openings: an arched door, two framed windows, a little balcony on beams */
    const du = W * 0.36, dw = 9, dt = H - 17;
    const ar = []; for (let i = 0; i <= 14; i++) { const t = Math.PI * (i / 14); ar.push([du - Math.cos(t) * dw / 2, dt - Math.sin(t) * dw * 0.5]); }
    k.M(front.poly(ar.concat([[du + dw / 2, H], [du - dw / 2, H]])), k.OUT, { closed: true });
    rectF(k, front, du - dw / 2 + 1.2, dt, du + dw / 2 - 1.2, H, k.MID);
    k.F(front.poly([[du + 1, H - 9], [du + 1.8, H - 9], [du + 1.8, H - 8], [du + 1, H - 8]]));
    windowF(k, front, W * 0.74, H - 18, 8, 9, 2, 2);
    windowF(k, front, W * 0.58, FT + 6, 7, 8, 2, 2, { sill: false });
    const bv = FT + 15;
    k.M([front.at(W * 0.46, bv), front.at(W * 0.7, bv), front.out(W * 0.7, bv, 6), front.out(W * 0.46, bv, 6)], k.OUT, { closed: true });
    railing(k, front, W * 0.46, W * 0.7, bv, 5, 5, 6);
    [W * 0.49, W * 0.67].forEach((u) => k.M([front.at(u, bv + 3), front.out(u, bv + 0.5, 6)], k.MID));
    /* a chimney pipe out of the rock top, steps cut into the slope to the door */
    drum(k, W * 0.2 - W / 2, TOP + (H - 52) - 8, 1.2, 1.2, TOP + (H - 52) - 2, TOP + (H - 52) - 14, k.MID, 12);
    for (let i = 0; i < 4; i++) slab(k, du - W / 2 - 5, du - W / 2 + 5, GNDY - (4 - i) * 0.4, GNDY, -2 - i * 2.4, -i * 2.4, k.FINE);
    pot(k, W * 0.9 - W / 2, -6, 13, "cone", 31);
    pot(k, W * 0.14 - W / 2, -5, 9, "bush", 5);
    k.M([V.p(-W - 4, GNDY, -3), V.p(W + 30, GNDY, -3)], k.MID);
    return k.done();
  };

  const NAMES = {
    aframe: "A-frame cabin", saltbox: "Saltbox", bungalow: "Craftsman bungalow",
    kerala: "Kerala house", stilt: "Stilt house",
    yurt: "Yurt", butterfly: "Butterfly-roof house", machiya: "Machiya",
    cycladic: "Cycladic house", houseboat: "Houseboat",
    haveli: "Haveli", treehouse: "Treehouse", mound: "Earth-sheltered house",
    tiny: "Tiny house on wheels", container: "Container house",
    igloo: "Igloo", octagon: "Octagon house", pod: "Futuro pod", tower: "Tower house", cave: "Cave house",
  };
  const out = {};
  for (const key of Object.keys(A)) out[key] = Spec.wrap("elevation", NAMES[key], A[key]);
  out._keys = Object.keys(A);
  return out;
})();
