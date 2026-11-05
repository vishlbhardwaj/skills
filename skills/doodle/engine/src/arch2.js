/*
 * FIFTEEN MORE BUILDINGS — a spread of forms, one vocabulary.
 *
 * Shares `Arch._kit` so there is a single set of windows, doors, sills,
 * cornices and pots across all twenty. That shared vocabulary is what stops a
 * set this varied from looking like twenty unrelated drawings: the FORMS
 * differ — gable, tier, taper, setback, turret, frame — while the hand, the
 * stroke hierarchy and the black-pane convention stay fixed.
 *
 * Everything is two-point perspective (`View.two`), authored in (u, v) on a
 * `V.face` wherever it is flat detail on a wall. The round buildings are the
 * one new problem: a horizontal circle projects to an ellipse, so it is
 * sampled in 3D and projected point by point rather than drawn as an ellipse.
 */
window.Arch2 = (function () {
  const K = Arch._kit;
  const { GNDY, slab, rectF, bandF, windowF, oculusF, doorF, chimney, pot,
          pavement, massing, NIB } = K;
  const A = {};

  /* ── round forms: sample the circle in 3D, never draw an ellipse ──── */
  const ring = (V, cx, cz, r, y, n) => {
    const out = [], N = n || 28;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      out.push(V.p(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r));
    }
    return out;
  };
  const extremes = (pts) => {
    let lo = pts[0], hi = pts[0];
    pts.forEach((p) => { if (p[0] < lo[0]) lo = p; if (p[0] > hi[0]) hi = p; });
    return [lo, hi];
  };

  /*
   * A TAPERED DRUM — lighthouse, windmill, silo, water tank, turret.
   *
   * A cylinder HIDES HALF OF EACH OF ITS OWN RINGS, and drawing them whole
   * put a stray ellipse on the ground under every round form. The rule:
   *
   *   bottom ring  — only the NEAR half; the far half is behind the body
   *   top ring     — above eye level you see its UNDERSIDE, so only the FAR
   *                  half; below eye level you look down into it and the
   *                  whole ellipse shows
   *
   * "Near" is the half with the larger screen y, since y runs down the sheet.
   */
  const halfRing = (pts, near) => {
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const keep = pts.filter((p) => (near ? p[1] > cy : p[1] < cy));
    return keep.length > 2 ? keep : pts;
  };

  function drum(k, cx, cz, rBot, rTop, yBot, yTop, w, n) {
    const V = k.V;
    const b = ring(V, cx, cz, rBot, yBot, n), t = ring(V, cx, cz, rTop, yTop, n);
    k.M(halfRing(b, true), w || k.OUT, { curve: true });
    k.M(yTop < 0 ? halfRing(t, false) : t, w || k.OUT,
        { curve: true, closed: yTop >= 0 });
    const [bl, br] = extremes(b), [tl, tr] = extremes(t);
    k.M([bl, tl], w || k.OUT);
    k.M([br, tr], w || k.OUT);
    return { b, t, bl, br, tl, tr };
  }

  function coneRoof(k, cx, cz, r, yBase, yApex, w) {
    const V = k.V, b = ring(V, cx, cz, r, yBase);
    k.M(halfRing(b, true), w || k.OUT, { curve: true });
    const ap = V.p(cx, yApex, cz), [l, rr] = extremes(b);
    k.M([l, ap], w || k.OUT);
    k.M([rr, ap], w || k.OUT);
    return ap;
  }

  /*
   * A PITCHED ROOF as a solid. Eaves overhang, so from below you see the
   * soffit — which is the depth cue, exactly as with the cornice.
   */
  function gableRoof(k, x0, x1, z0, z1, yEave, yRidge, o, w) {
    const V = k.V, ov = o === undefined ? 2.4 : o;
    const X0 = x0 - ov, X1 = x1 + ov, Z0 = z0 - ov, Z1 = z1 + ov;
    const rz = (Z0 + Z1) / 2;
    k.M([V.p(X0, yEave, Z0), V.p(X0, yRidge, rz), V.p(X0, yEave, Z1)], w || k.OUT);
    k.M([V.p(X0, yRidge, rz), V.p(X1, yRidge, rz)], w || k.OUT);
    k.M([V.p(X0, yEave, Z0), V.p(X1, yEave, Z0)], w || k.OUT);
    k.M([V.p(X0, yEave, Z1), V.p(X1, yEave, Z1)], k.MID);
    k.M([V.p(X1, yEave, Z0), V.p(X1, yRidge, rz), V.p(X1, yEave, Z1)], w || k.OUT);
    /* the soffit: a thin band under the eave, seen from below */
    k.M([V.p(X0, yEave, Z0), V.p(X0, yEave + 1.4, Z0),
         V.p(X1, yEave + 1.4, Z0), V.p(X1, yEave, Z0)], k.MID);
  }

  /*
   * A GABLE TO THE STREET — ridge running back into the picture.
   *
   * `gableRoof` runs its ridge along x, so its gables face LEFT and RIGHT.
   * Calling it and ALSO drawing a gable triangle on the front face gives two
   * roofs at right angles to each other, which is exactly what made the Tudor
   * and the chalet read as wireframe boxes. One roof, one ridge direction.
   */
  function gableToStreet(k, x0, x1, z0, z1, yEave, yRidge, o, w) {
    const V = k.V, ov = o === undefined ? 2.4 : o;
    const X0 = x0 - ov, X1 = x1 + ov, Z0 = z0 - ov, Z1 = z1 + ov, rx = (X0 + X1) / 2;
    const W0 = w || k.OUT;
    /* the gable the viewer faces */
    k.M([V.p(X0, yEave, Z0), V.p(rx, yRidge, Z0), V.p(X1, yEave, Z0)], W0);
    k.M([V.p(rx, yRidge, Z0), V.p(rx, yRidge, Z1)], W0);           /* ridge   */
    k.M([V.p(X0, yEave, Z0), V.p(X0, yEave, Z1)], W0);             /* near eave */
    k.M([V.p(X1, yEave, Z0), V.p(X1, yEave, Z1)], k.MID);          /* far eave  */
    k.M([V.p(X0, yEave, Z1), V.p(rx, yRidge, Z1)], k.MID);         /* back slope */
    /* the verge board: the roof has thickness, seen on the gable edge */
    k.M([V.p(X0, yEave + 1.5, Z0), V.p(rx, yRidge + 1.5, Z0),
         V.p(X1, yEave + 1.5, Z0)], k.MID);
    k.M([V.p(X0, yEave, Z0), V.p(X0, yEave + 1.5, Z0)], k.MID);
    k.M([V.p(X1, yEave, Z0), V.p(X1, yEave + 1.5, Z0)], k.MID);
  }

  function hipRoof(k, x0, x1, z0, z1, yEave, yRidge, inset, w) {
    const V = k.V, i = inset === undefined ? 6 : inset;
    const rz = (z0 + z1) / 2;
    const R0 = V.p(x0 + i, yRidge, rz), R1 = V.p(x1 - i, yRidge, rz);
    const c = [V.p(x0, yEave, z0), V.p(x1, yEave, z0), V.p(x1, yEave, z1), V.p(x0, yEave, z1)];
    k.M(c, w || k.OUT, { closed: true });
    k.M([R0, R1], w || k.OUT);
    k.M([c[0], R0], k.MID); k.M([c[1], R1], k.MID);
    k.M([c[2], R1], k.MID); k.M([c[3], R0], k.MID);
  }

  /* a railing on a face: posts plus two rails, standing proud of the wall */
  function railing(k, F, u0, u1, v, h, n, proj) {
    k.M([F.out(u0, v, proj), F.out(u0, v - h, proj),
         F.out(u1, v - h, proj), F.out(u1, v, proj)], k.OUT);
    for (let i = 1; i < n; i++) {
      const u = u0 + (u1 - u0) * (i / n);
      k.M([F.out(u, v, proj), F.out(u, v - h, proj)], k.FINE);
    }
    k.M([F.at(u0, v), F.out(u0, v, proj)], k.MID);
    k.M([F.at(u1, v), F.out(u1, v, proj)], k.MID);
  }

  /* a row of columns standing in front of the wall */
  function columns(k, x0, x1, z, n, yTop, yBot, r) {
    const V = k.V;
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i / (n - 1));
      drum(k, x, z, r * 1.18, r * 1.18, yBot, yBot - r * 0.7, k.MID);
      drum(k, x, z, r, r * 0.86, yBot - r * 0.7, yTop + r * 0.8, k.OUT);
      drum(k, x, z, r * 1.2, r * 1.2, yTop + r * 0.8, yTop, k.MID);
      /* two flutes, which is enough to say fluted */
      [-0.42, 0.42].forEach((f) =>
        k.M([V.p(x + f * r, yBot - r * 0.7, z - r * 0.8),
             V.p(x + f * r, yTop + r * 0.8, z - r * 0.8)], k.FINE));
    }
  }

  /* a stoop: steps up to a raised door, seen in perspective */
  function stoop(k, cx, z0, z1, w, yTop, n) {
    const V = k.V;
    for (let i = 0; i < n; i++) {
      const t = i / n, y = GNDY + (yTop - GNDY) * t;
      const z = z0 + (z1 - z0) * t, dy = (yTop - GNDY) / n;
      k.M([V.p(cx - w / 2, y, z), V.p(cx + w / 2, y, z)], k.MID);
      k.M([V.p(cx - w / 2, y, z), V.p(cx - w / 2, y + dy, z)], k.FINE);
      k.M([V.p(cx - w / 2, y, z), V.p(cx - w / 2, y, z + (z1 - z0) / n)], k.FINE);
    }
    [-1, 1].forEach((sd) =>
      k.M([V.p(cx + sd * w / 2, GNDY, z0), V.p(cx + sd * w / 2, yTop - 8, z1),
           V.p(cx + sd * w / 2, yTop, z1)], k.OUT));
  }

  function crenel(k, F, u0, u1, v, h, n) {
    const pts = [[u0, v]];
    for (let i = 0; i < n; i++) {
      const a = u0 + (u1 - u0) * (i / n), b = u0 + (u1 - u0) * ((i + 0.55) / n);
      const c = u0 + (u1 - u0) * ((i + 1) / n);
      pts.push([a, v - h], [b, v - h], [b, v], [c, v]);
    }
    k.M(F.poly(pts), k.OUT);
  }

  /* ── 1 · TUDOR — jettied upper floor, half timber ─────────────────── */
  A.tudor = () => {
    const M = massing({ w: 40, d: 30, top: -62, f: 330, dist: 200, yaw: -24 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const JET = 3.2, MID = H * 0.44;
    /* ground floor sits BACK; the upper floor overhangs it — the jetty is
       the whole point of the form and only reads in perspective */
    k.M([V.p(-W / 2, TOP + MID, 0), V.p(-W / 2, TOP + MID, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    const up = V.face([-W / 2 - JET, TOP, -JET], [1, 0, 0], [0, 1, 0]);
    const UW = W + JET * 2;
    k.M([up.at(0, 8), up.at(UW, 8), up.at(UW, MID), up.at(0, MID)], k.OUT, { closed: true });
    gableToStreet(k, -W / 2 - JET, W / 2 + JET, -JET, D, TOP + 8, TOP - 16, 2.6);
    /* the gable wall itself, inside the verge */
    k.M(up.poly([[0, 8], [UW / 2, -24], [UW, 8]]), k.MID);
    /* half-timber: posts, mid-rail, and the braces that say Tudor */
    for (let i = 1; i < 6; i++) k.M([up.at(UW * i / 6, 8), up.at(UW * i / 6, MID)], k.MID);
    bandF(k, up, 0, UW, (8 + MID) / 2, 1.2, 1, k.MID);
    [[0.08, 0.26], [0.74, 0.92]].forEach(([a, b]) => {
      k.M([up.at(UW * a, MID), up.at(UW * b, 9)], k.MID);
      k.M([up.at(UW * b, MID), up.at(UW * a, 9)], k.MID);
    });
    [0.26, 0.5, 0.74].forEach((f) => windowF(k, up, UW * f, 13, 8, 10, 3, 2, { sill: false }));
    windowF(k, up, UW / 2, -8, 6, 7, 2, 2, { sill: false, reveal: false });
    /* the jetty's underside, the shadow line that proves the overhang */
    k.M([up.at(0, MID), V.p(-W / 2, TOP + MID, 0)], k.MID);
    k.M([up.at(UW, MID), V.p(W / 2, TOP + MID, 0)], k.MID);
    k.M([V.p(-W / 2, TOP + MID, 0), V.p(W / 2, TOP + MID, 0)], k.OUT);
    /*
     * The lower storey's own front wall. It was never drawn — only the jetty
     * line above it and the ground line below — so the ground floor had no
     * right-hand edge and the whole thing read as unfinished.
     */
    k.M([front.at(0, MID), front.at(W, MID), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    [0.25, 0.75].forEach((f) => windowF(k, front, W * f, MID + 8, 9, 11, 3, 2));
    doorF(k, front, W * 0.5, H - 1, 7, 15);
    chimney(k, W * 0.22, TOP - 12, D * 0.5, 5.5, 14);
    pavement(k, -W / 2, W / 2, D);
    pot(k, -W * 0.44, -6, 9, "bush", 3);
    return k.done();
  };

  /* ── 2 · BROWNSTONE — stoop, tall windows, heavy cornice ──────────── */
  A.brownstone = () => {
    const M = massing({ w: 32, d: 34, top: -86, f: 330, dist: 210, yaw: -21 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [0.3, 0.66].forEach((f) => [0.12, 0.36, 0.60].forEach((g) =>
      windowF(k, flank, D * f, H * g, 6, 14, 2, 3, { sillOut: 1.0 })));
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    slab(k, -W / 2 - 3, W / 2 + 3, TOP - 4.5, TOP, -3, D + 3, k.OUT);
    /* bracketed cornice — the brackets are what make it a brownstone */
    for (let i = 0; i <= 6; i++) {
      const u = (W / 6) * i;
      k.M([front.at(u, 0), front.out(u, 0, 3), front.out(u, -4.5, 3)], k.MID);
    }
    [0.12, 0.36, 0.60].forEach((g) => {
      [0.27, 0.73].forEach((f) => windowF(k, front, W * f, H * g, 8.5, 17, 2, 3));
    });
    bandF(k, front, -1, W + 1, H * 0.84, 1.3, 2, k.MID);
    /* the raised entrance, reached by the stoop */
    const DV = H * 0.84 - 1;
    doorF(k, front, W * 0.73, DV, 8, 17, { glazed: true });
    stoop(k, -W / 2 + W * 0.73, -14, -1, 10, GNDY - (GNDY - (TOP + DV)) * 0 - 16, 7);
    /* and the basement door beneath it */
    windowF(k, front, W * 0.27, H - 13, 8, 11, 2, 2);
    pavement(k, -W / 2, W / 2, D, 16);
    pot(k, -W * 0.5, -8, 9, "cone", 7);
    return k.done();
  };

  /* ── 3 · PAGODA — three tiers of upswept eaves ────────────────────── */
  A.pagoda = () => {
    const M = massing({ w: 36, d: 36, top: -80, f: 330, dist: 215, yaw: -25 });
    const { k, V, W, D, TOP, H } = M;
    /*
     * Stack from the GROUND up and let each body start where the one below
     * ends. Placing tiers at fractions of the total height left a gap under
     * every one and the whole thing floated apart.
     */
    let y = GNDY;
    for (let t = 0; t < 4; t++) {
      const w = (W / 2) * (1 - t * 0.15), bh = 19 - t * 2.2;
      const yTop = y - bh;
      slab(k, -w, w, yTop, y, -w, w, t ? k.MID : k.OUT);
      const face = V.face([-w, yTop, -w], [1, 0, 0], [0, 1, 0]);
      if (t === 0) doorF(k, face, w, bh - 1.5, w * 0.5, bh * 0.62, { glazed: false });
      else windowF(k, face, w, bh * 0.26, w * 0.92, bh * 0.4, 3, 2,
                   { sill: false, reveal: false });
      /*
       * THE UPSWEPT EAVE — the corners lift. Drawn level it is a stack of
       * tents; the lift is the one line that says pagoda.
       */
      const ov = w * 0.34, lift = bh * 0.30;
      const cn = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const low = cn.map(([sx, sz]) => V.p(sx * (w + ov), yTop - lift, sz * (w + ov)));
      const inn = cn.map(([sx, sz]) => V.p(sx * (w + ov * 0.4), yTop + 0.8,
                                           sz * (w + ov * 0.4)));
      k.M(low, k.OUT, { closed: true });
      k.M(inn, k.MID, { closed: true });
      for (let i = 0; i < 4; i++) k.M([inn[i], low[i]], k.OUT);
      const apex = V.p(0, yTop - lift - bh * 0.42, 0);
      for (let i = 0; i < 4; i++) {
        const e = V.p(cn[i][0] * (w + ov) * 0.46, yTop - lift - bh * 0.2,
                      cn[i][1] * (w + ov) * 0.46);
        k.M([low[i], e, apex], k.MID, { curve: true });
      }
      /* rafters under the eave: what gives a pagoda its stripe of shadow */
      for (let i = 1; i < 6; i++) {
        const u = -w - ov + (w + ov) * 2 * (i / 6);
        k.M([V.p(u, yTop - lift, -(w + ov)), V.p(u, yTop + 0.8, -(w + ov * 0.4))], k.FINE);
      }
      y = yTop - lift + 1.2;
    }
    k.M([V.p(0, y, 0), V.p(0, y - 13, 0)], k.OUT, { taper: [1.5, 0.4] });
    [3, 5.6, 8.2].forEach((d, i) =>
      k.M(ring(V, 0, 0, 2.6 - i * 0.6, y - d, 14), k.FINE, { closed: true, curve: true }));
    pavement(k, -W / 2, W / 2, D, 12);
    return k.done();
  };

  /* ── 4 · ADOBE — flat parapet, projecting vigas, deep reveals ─────── */
  A.adobe = () => {
    const M = massing({ w: 50, d: 34, top: -34, f: 320, dist: 180, yaw: -27 });
    const { k, V, W, D, TOP, H, front } = M;
    /*
     * Adobe is MASSING AND SHADOW, not facade. Two blocks of different
     * heights, the lower one stepping forward, beams punching through the
     * wall, and openings deep enough to go black. A single extruded
     * rectangle with two windows in it is a shed in any language.
     *
     * The first attempt drew holes on `front` AND on a second face at the
     * same plane, so every opening came with a ghost beside it. One face
     * per plane.
     */
    const LOW = TOP + 15;
    slab(k, -W / 2, W / 2 - 14, TOP, GNDY, 0, D, k.OUT);
    slab(k, W / 2 - 14, W / 2, LOW, GNDY, -13, D, k.OUT);
    const hi = V.face([-W / 2, TOP, 0], [1, 0, 0], [0, 1, 0]);
    const lo = V.face([W / 2 - 14, LOW, -13], [1, 0, 0], [0, 1, 0]);
    /* vigas — the round beam ends in a row are the signature of the form */
    [[TOP + 4, 0, -W / 2 + 3, W / 2 - 17, 7],
     [LOW + 4, -13, W / 2 - 11, W / 2 - 3, 3]].forEach(([yy, z0, x0, x1, n]) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + (x1 - x0) * (i / (n - 1));
        k.M([V.p(x, yy, z0), V.p(x, yy, z0 - 6)], k.OUT, { taper: [1.3, 1.05] });
        k.M(ring(V, x, z0 - 6, 1.6, yy, 10), k.MID, { closed: true, curve: true });
      }
    });
    /* a deep-set opening: the reveal is drawn and the hole goes solid black */
    const hole = (F, cu, v, w, h) => {
      const d = 3.4;
      rectF(k, F, cu - w / 2, v, cu + w / 2, v + h, k.OUT);
      k.M([F.at(cu - w / 2, v), F.out(cu - w / 2, v, -d),
           F.out(cu - w / 2, v + h, -d), F.at(cu - w / 2, v + h)], k.MID);
      k.M([F.out(cu - w / 2, v, -d), F.out(cu + w / 2, v, -d)], k.MID);
      k.F([F.out(cu - w / 2, v, -d), F.out(cu + w / 2, v, -d),
           F.out(cu + w / 2, v + h, -d), F.out(cu - w / 2, v + h, -d)]);
    };
    const HW = W - 14, HH = GNDY - TOP;
    hole(hi, HW * 0.26, HH * 0.30, 8, 9);
    hole(hi, HW * 0.60, HH * 0.34, 8, 9);
    hole(hi, HW * 0.86, HH * 0.30, 6, 7);
    doorF(k, hi, HW * 0.52, HH - 1, 10, 17);
    /* a timber lintel over the door, which is how the hole is held up */
    k.M([hi.out(HW * 0.52 - 7, HH - 18, 1.4), hi.out(HW * 0.52 + 7, HH - 18, 1.4)],
        k.OUT, { taper: [1.1, 1.1] });
    hole(lo, 7, (GNDY - LOW) * 0.3, 7, 8);
    /* the ladder leaning on the parapet */
    const lx = -W / 2 + 4;
    [-1.8, 1.8].forEach((o) =>
      k.M([V.p(lx + o, GNDY, -9), V.p(lx + o, TOP - 1, -1.5)], k.MID, { taper: [1.2, 0.9] }));
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      k.M([V.p(lx - 1.8, GNDY + (TOP - 1 - GNDY) * t, -13 + 11 * t),
           V.p(lx + 1.8, GNDY + (TOP - 1 - GNDY) * t, -13 + 11 * t)], k.FINE);
    }
    pavement(k, -W / 2, W / 2, D, 13);
    pot(k, -W * 0.56, -14, 9, "bush", 11);
    return k.done();
  };

  /* ── 5 · ALPINE CHALET — huge overhang, balcony, shutters ─────────── */
  A.chalet = () => {
    const M = massing({ w: 48, d: 34, top: -48, f: 330, dist: 200, yaw: -23 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    /* gable to the street, and an eave overhang big enough to read as shelter */
    gableToStreet(k, -W / 2, W / 2, 0, D, TOP, TOP - 20, 6.5);
    k.M(front.poly([[0, 0], [W / 2, -18], [W, 0]]), k.MID);
    /* log courses */
    for (let i = 1; i < 9; i++) k.M([front.at(0, H * i / 9), front.at(W, H * i / 9)], k.FINE);
    windowF(k, front, W / 2, -12, 7, 7, 2, 2, { sill: false, reveal: false });
    [0.28, 0.72].forEach((f) => {
      windowF(k, front, W * f, H * 0.22, 9, 10, 2, 2);
      /* shutters: two boards flanking the opening, drawn proud of the wall */
      [-1, 1].forEach((sd) => {
        const u0 = W * f + sd * 5.2, u1 = W * f + sd * 9.4;
        k.M([front.out(Math.min(u0, u1), H * 0.22, 1.4),
             front.out(Math.max(u0, u1), H * 0.22, 1.4),
             front.out(Math.max(u0, u1), H * 0.22 + 10, 1.4),
             front.out(Math.min(u0, u1), H * 0.22 + 10, 1.4)], k.MID, { closed: true });
        for (let j = 1; j < 3; j++)
          k.M([front.out(u0 + (u1 - u0) * j / 3, H * 0.22, 1.4),
               front.out(u0 + (u1 - u0) * j / 3, H * 0.22 + 10, 1.4)], k.FINE);
      });
    });
    /* the balcony runs the full width and projects properly */
    const bv = H * 0.46;
    k.M([front.at(0, bv), front.at(W, bv), front.out(W, bv, 5),
         front.out(0, bv, 5)], k.OUT, { closed: true });
    railing(k, front, 0, W, bv, 6.5, 16, 5);
    [0.3, 0.7].forEach((f) => windowF(k, front, W * f, H * 0.62, 9, 12, 2, 2));
    doorF(k, front, W * 0.5, H - 1, 8, 15);
    pavement(k, -W / 2, W / 2, D, 12);
    pot(k, -W * 0.56, -8, 10, "cone", 13);
    pot(k, W * 0.56, -8, 10, "cone", 29);
    return k.done();
  };

  /* ── 6 · LIGHTHOUSE — a taper, which no prism can do ──────────────── */
  A.lighthouse = () => {
    const M = massing({ w: 30, d: 30, top: -92, f: 330, dist: 215, yaw: -22 });
    const { k, V, W, D, TOP, H } = M;
    const BASE = GNDY, TOWTOP = TOP + 16;
    drum(k, 0, 0, 11, 5.4, BASE, TOWTOP, k.OUT);
    /* the bands are the whole identity, and in perspective they are ellipses */
    for (let i = 0; i < 3; i++) {
      const t0 = 0.12 + i * 0.28, t1 = t0 + 0.14;
      const r0 = 11 + (5.4 - 11) * t0, r1 = 11 + (5.4 - 11) * t1;
      const y0 = BASE + (TOWTOP - BASE) * t0, y1 = BASE + (TOWTOP - BASE) * t1;
      const a = ring(V, 0, 0, r0, y0), b = ring(V, 0, 0, r1, y1);
      k.M(halfRing(a, true), k.MID, { curve: true });
      k.M(halfRing(b, true), k.MID, { curve: true });
      /* fill the band's visible front half — the one solid accent */
      const half = a.slice(0, 15).concat(b.slice(0, 15).reverse());
      k.F(half);
    }
    /* gallery, lantern, cap */
    drum(k, 0, 0, 8, 8, TOWTOP, TOWTOP - 2.2, k.OUT);
    const g = drum(k, 0, 0, 5, 5, TOWTOP - 2.2, TOWTOP - 14, k.OUT);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      k.M([V.p(Math.cos(a) * 5, TOWTOP - 2.2, Math.sin(a) * 5),
           V.p(Math.cos(a) * 5, TOWTOP - 14, Math.sin(a) * 5)], k.FINE);
    }
    k.F(g.b.slice(0, 15).concat(g.t.slice(0, 15).reverse()).map((p, i, arr) =>
      i < 8 || i >= arr.length - 8 ? p : p));
    coneRoof(k, 0, 0, 6.4, TOWTOP - 14, TOWTOP - 21, k.OUT);
    /* railing round the gallery */
    const rg = ring(V, 0, 0, 8, TOWTOP - 5.5, 20);
    k.M(rg, k.MID, { closed: true, curve: true });
    for (let i = 0; i < 20; i++)
      k.M([rg[i], ring(V, 0, 0, 8, TOWTOP, 20)[i]], k.FINE);
    /* the keeper's cottage at the foot, for scale */
    slab(k, -26, -9, GNDY - 15, GNDY, -4, 12, k.OUT);
    gableRoof(k, -26, -9, -4, 12, GNDY - 15, GNDY - 23, 1.8);
    const cf = V.face([-26, GNDY - 15, -4], [1, 0, 0], [0, 1, 0]);
    windowF(k, cf, 11, 5, 5, 6, 2, 2, { sill: false });
    doorF(k, cf, 4.5, 15, 4, 9);
    pavement(k, -26, 16, D, 12);
    return k.done();
  };

  /* ── 7 · WINDMILL — taper plus sails ──────────────────────────────── */
  A.windmill = () => {
    const M = massing({ w: 34, d: 34, top: -82, f: 330, dist: 210, yaw: -24 });
    const { k, V, W, D, TOP, H } = M;
    const TOWTOP = TOP + 18;
    drum(k, 0, 0, 14, 7.5, GNDY, TOWTOP, k.OUT);
    for (let i = 1; i < 4; i++) {
      const t = i / 4, r = 14 + (7.5 - 14) * t;
      k.M(halfRing(ring(V, 0, 0, r, GNDY + (TOWTOP - GNDY) * t), true), k.FINE,
          { curve: true });
    }
    const cf = V.face([-5, TOWTOP + 12, -8.6], [1, 0, 0], [0, 1, 0]);
    windowF(k, cf, 5, 2, 6, 7, 2, 2, { sill: false, reveal: false });
    doorF(k, V.face([-4.5, GNDY - 16, -13.2], [1, 0, 0], [0, 1, 0]), 4.5, 16, 7, 14);
    /* the cap, a dome */
    const cap = ring(V, 0, 0, 8.6, TOWTOP);
    k.M(cap, k.OUT, { closed: true, curve: true });
    coneRoof(k, 0, 0, 8.6, TOWTOP, TOWTOP - 9, k.OUT);
    /*
     * SAILS. Four, at an angle, in the plane facing the camera's front — a
     * windmill drawn with its sails square to the frame reads as a plus sign.
     */
    const hub = [0, TOWTOP - 5.5, -8.6], L = 30;
    k.M([V.p(hub[0], hub[1], hub[2]), V.p(hub[0], hub[1], hub[2] - 3)], k.OUT);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.42;
      const ex = Math.cos(a), ey = Math.sin(a);
      const tip = [hub[0] + ex * L, hub[1] + ey * L, hub[2] - 3];
      const px = -ey * 3.2, py = ex * 3.2;
      k.M([V.p(hub[0] + px, hub[1] + py, hub[2] - 3),
           V.p(tip[0] + px, tip[1] + py, tip[2]),
           V.p(tip[0] - px, tip[1] - py, tip[2]),
           V.p(hub[0] - px, hub[1] - py, hub[2] - 3)], k.OUT, { closed: true });
      for (let j = 1; j < 7; j++) {
        const t = j / 7;
        k.M([V.p(hub[0] + ex * L * t + px, hub[1] + ey * L * t + py, hub[2] - 3),
             V.p(hub[0] + ex * L * t - px, hub[1] + ey * L * t - py, hub[2] - 3)], k.FINE);
      }
    }
    pavement(k, -17, 17, D, 12);
    return k.done();
  };

  /* ── 8 · ART DECO TOWER — setbacks and vertical fins ──────────────── */
  A.deco = () => {
    const M = massing({ w: 40, d: 32, top: -96, f: 340, dist: 230, yaw: -20 });
    const { k, V, W, D, TOP, H } = M;
    const tiers = [[1.00, 0.00, 0.40], [0.74, 0.40, 0.70], [0.50, 0.70, 0.90]];
    tiers.forEach(([sc, a, b], t) => {
      const w = (W / 2) * sc, d = (D / 2) * sc;
      const y0 = TOP + H * a, y1 = TOP + H * b + (t === 0 ? GNDY - TOP - H : 0);
      slab(k, -w, w, y0, t === 0 ? GNDY : TOP + H * b, -d, d, k.OUT);
      const f = V.face([-w, y0, -d], [1, 0, 0], [0, 1, 0]);
      const hh = (t === 0 ? GNDY : TOP + H * b) - y0;
      /*
       * VERTICAL EMPHASIS is the whole of Deco: continuous piers with the
       * windows recessed between them, never a grid of separate holes.
       */
      const n = t === 0 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const u0 = (w * 2) * (i + 0.18) / n, u1 = (w * 2) * (i + 0.82) / n;
        for (let r = 0; r < Math.round(hh / 9); r++) {
          const v = 4 + r * 9;
          if (v + 6 > hh - 2) break;
          k.F(f.poly([[u0, v], [u1, v], [u1, v + 6], [u0, v + 6]]));
        }
        k.M([f.at((w * 2) * (i + 0.5) / n, 2), f.at((w * 2) * (i + 0.5) / n, hh - 2)], k.FINE);
      }
      bandF(k, f, -0.5, w * 2 + 0.5, 2, 1.3, 2, k.OUT);
      void y1;
    });
    /* the crowning fin */
    const tw = (W / 2) * 0.5;
    k.M([V.p(-tw * 0.3, TOP, 0), V.p(0, TOP - 16, 0), V.p(tw * 0.3, TOP, 0)], k.OUT);
    k.M([V.p(0, TOP - 16, 0), V.p(0, TOP - 24, 0)], k.OUT, { taper: [1.4, 0.4] });
    const gf = V.face([-W / 2, TOP + H - 14, -D / 2], [1, 0, 0], [0, 1, 0]);
    doorF(k, gf, W / 2, 13, 11, 17, { glazed: true });
    [-1, 1].forEach((sd) => windowF(k, gf, W / 2 + sd * 13, 3, 8, 9, 2, 1,
                                    { sill: false, reveal: false }));
    pavement(k, -W / 2, W / 2, D);
    return k.done();
  };

  /* ── 9 · TEMPLE FRONT — podium, columns, pediment ─────────────────── */
  A.temple = () => {
    const M = massing({ w: 52, d: 38, top: -52, f: 330, dist: 205, yaw: -25 });
    const { k, V, W, D, TOP, H, front } = M;
    const POD = GNDY - 7, COLT = TOP + 12, ENT = TOP + 12;
    /* podium, stepped on all visible sides */
    for (let i = 0; i < 3; i++) {
      const o = 7 - i * 2.2, y = GNDY - i * 2.3;
      slab(k, -W / 2 - o, W / 2 + o, y - 2.3, y, -o, D, k.MID);
    }
    /* cella behind */
    slab(k, -W / 2 + 4, W / 2 - 4, TOP + 14, POD, 9, D, k.MID);
    columns(k, -W / 2 + 4, W / 2 - 4, 2.5, 6, COLT, POD, 2.6);
    /* entablature, then the pediment above it */
    slab(k, -W / 2 - 1, W / 2 + 1, ENT - 7, ENT, -1, D, k.OUT);
    bandF(k, V.face([-W / 2 - 1, ENT - 7, -1], [1, 0, 0], [0, 1, 0]),
          0, W + 2, 2.6, 1.6, 2, k.MID);
    const pf = V.face([-W / 2 - 2.5, ENT - 7, -2.5], [1, 0, 0], [0, 1, 0]);
    k.M(pf.poly([[0, 0], [(W + 5) / 2, -13], [W + 5, 0]]), k.OUT);
    k.M(pf.poly([[2.5, -1.6], [(W + 5) / 2, -11], [W + 2.5, -1.6]]), k.MID);
    oculusF(k, pf, (W + 5) / 2, -5.4, 2.8, 6);
    k.M([V.p(-W / 2 - 2.5, ENT - 7, -2.5), V.p(-W / 2 - 2.5, ENT - 7, D)], k.MID);
    doorF(k, V.face([-W / 2 + 4, TOP + 14, 9], [1, 0, 0], [0, 1, 0]),
          (W - 8) / 2, POD - TOP - 14, 11, 20);
    pavement(k, -W / 2 - 7, W / 2 + 7, D, 14);
    return k.done();
  };

  /* ── 10 · BARN AND SILO — a gambrel, which is two pitches ─────────── */
  A.barn = () => {
    const M = massing({ w: 48, d: 38, top: -40, f: 330, dist: 200, yaw: -26 });
    const { k, V, W, D, TOP, H, front } = M;
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    /* the gambrel: two slopes a side, which is what distinguishes a barn roof */
    const gm = [[0, 0], [W * 0.17, -11], [W * 0.5, -19], [W * 0.83, -11], [W, 0]];
    k.M(front.poly(gm), k.OUT);
    const bk = V.face([-W / 2, TOP, D], [1, 0, 0], [0, 1, 0]);
    k.M(bk.poly(gm), k.MID);
    gm.forEach(([u, v]) => { if (u > 0 && u < W) k.M([front.at(u, v), bk.at(u, v)], k.MID); });
    k.M([front.at(0, 0), bk.at(0, 0)], k.OUT);
    /* the big doors, with their diagonal bracing */
    const dv0 = H * 0.30, dw = W * 0.42;
    rectF(k, front, W / 2 - dw / 2, dv0, W / 2 + dw / 2, H - 1, k.OUT);
    k.M([front.at(W / 2, dv0), front.at(W / 2, H - 1)], k.OUT);
    [-1, 1].forEach((sd) => {
      k.M([front.at(W / 2 + sd * dw / 2, dv0), front.at(W / 2, H - 1)], k.MID);
      k.M([front.at(W / 2 + sd * dw / 2, H - 1), front.at(W / 2, dv0)], k.MID);
    });
    k.M([front.at(W / 2 - dw / 2 - 2, dv0 - 2.4), front.at(W / 2 + dw / 2 + 2, dv0 - 2.4)], k.OUT);
    windowF(k, front, W / 2, -8, 6, 6, 2, 2, { sill: false, reveal: false });
    [0.12, 0.88].forEach((f) => windowF(k, front, W * f, H * 0.42, 7, 8, 2, 2));
    for (let i = 1; i < 8; i++) k.M([front.at(0, H * i / 8), front.at(W, H * i / 8)], k.FINE);
    /* cupola */
    slab(k, -4, 4, TOP - 25, TOP - 19, -4, 4, k.MID);
    coneRoof(k, 0, 0, 5, TOP - 25, TOP - 31, k.MID);
    /* the silo: a drum with a dome, set behind the gable end */
    drum(k, W / 2 + 13, D * 0.45, 9, 9, GNDY, TOP - 14, k.OUT);
    for (let i = 1; i < 9; i++)
      k.M(halfRing(ring(V, W / 2 + 13, D * 0.45, 9,
                        GNDY + (TOP - 14 - GNDY) * i / 9, 20), true),
          k.FINE, { curve: true });
    coneRoof(k, W / 2 + 13, D * 0.45, 9.6, TOP - 14, TOP - 24, k.OUT);
    pavement(k, -W / 2, W / 2 + 22, D, 12);
    return k.done();
  };

  /* ── 11 · MODERNIST VILLA — cantilever, ribbon window, pilotis ────── */
  A.villa = () => {
    const M = massing({ w: 52, d: 34, top: -46, f: 330, dist: 200, yaw: -24 });
    const { k, V, W, D, TOP, H } = M;
    const SLAB = TOP + H * 0.44;
    /* the upper box CANTILEVERS past the ground floor and past the columns —
       the whole proposition of the style, and invisible in elevation */
    slab(k, -W / 2, W / 2, TOP, SLAB, -8, D, k.OUT);
    const uf = V.face([-W / 2, TOP, -8], [1, 0, 0], [0, 1, 0]);
    /* a ribbon window: one continuous horizontal opening, not punched holes */
    const rv = (SLAB - TOP) * 0.34;
    rectF(k, uf, 3, rv, W - 3, rv + 9, k.OUT);
    for (let i = 1; i < 7; i++)
      k.M([uf.at(3 + (W - 6) * i / 7, rv), uf.at(3 + (W - 6) * i / 7, rv + 9)], k.MID);
    for (let i = 0; i < 7; i++) {
      const u0 = 3 + (W - 6) * i / 7 + 0.8, u1 = 3 + (W - 6) * (i + 1) / 7 - 0.8;
      k.F(uf.poly([[u0, rv + 0.9], [u1, rv + 0.9], [u1, rv + 8.1], [u0, rv + 8.1]]));
    }
    k.M([V.p(-W / 2, SLAB, -8), V.p(W / 2, SLAB, -8)], k.OUT);
    /* ground floor set well back, so the box floats */
    slab(k, -W / 2 + 10, W / 2 - 4, SLAB, GNDY, 2, D, k.MID);
    const gf = V.face([-W / 2 + 10, SLAB, 2], [1, 0, 0], [0, 1, 0]);
    const gw = W - 18, gh = GNDY - SLAB - 6;
    rectF(k, gf, 2, 4, 2 + gw, 4 + gh, k.OUT);
    for (let i = 0; i < 5; i++) {
      const u0 = 2 + gw * (i + 0.06) / 5, u1 = 2 + gw * (i + 0.94) / 5;
      k.F(gf.poly([[u0, 5.2], [u1, 5.2], [u1, 2.8 + gh], [u0, 2.8 + gh]]));
    }
    /* pilotis */
    for (let i = 0; i < 4; i++) {
      const x = -W / 2 + 5 + i * ((W - 12) / 3);
      drum(k, x, -4, 1.9, 1.9, GNDY, SLAB, k.MID);
    }
    /* roof terrace: a parapet and one curved screen wall */
    k.M([V.p(-W / 2, TOP, -8), V.p(-W / 2, TOP - 5, -8), V.p(W / 2, TOP - 5, -8),
         V.p(W / 2, TOP, -8)], k.MID);
    const sc = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      sc.push(V.p(W / 2 - 16 + t * 16, TOP - 13, D * 0.3 - Math.sin(t * Math.PI) * 7));
    }
    k.M(sc, k.OUT, { curve: true });
    k.M(sc.map((p, i) => V.p(W / 2 - 16 + (i / 12) * 16, TOP - 5,
                             D * 0.3 - Math.sin((i / 12) * Math.PI) * 7)), k.MID, { curve: true });
    pavement(k, -W / 2, W / 2, D, 12);
    pot(k, -W * 0.56, -12, 9, "bush", 31);
    return k.done();
  };

  /* ── 12 · VICTORIAN — turret, porch, busy roofline ────────────────── */
  A.victorian = () => {
    const M = massing({ w: 50, d: 34, top: -62, f: 330, dist: 205, yaw: -23 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    k.M([V.p(-W / 2, TOP + 14, 0), V.p(-W / 2, TOP + 14, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [0.34, 0.68].forEach((f) => windowF(k, flank, D * f, H * 0.3, 6, 14, 2, 3,
                                        { sillOut: 1.0 }));
    k.M([front.at(0, 14), front.at(W, 14), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    /* cross gable over the left half, hipped roof behind it */
    hipRoof(k, -W / 2, W / 2, 0, D, TOP + 14, TOP, 9, k.OUT);
    k.M(front.poly([[0, 14], [W * 0.3, -12], [W * 0.6, 14]]), k.OUT);
    k.M(front.poly([[2, 14], [W * 0.3, -9], [W * 0.6 - 2, 14]]), k.MID);
    /* bargeboard: a row of pendants under the verge, cheap and very Victorian */
    for (let i = 1; i < 7; i++) {
      const t = i / 7, u = W * 0.3 * t, v = 14 - 26 * t;
      k.M([front.at(u, v), front.at(u, v + 2.4)], k.FINE);
      k.M([front.at(W * 0.6 - u, v), front.at(W * 0.6 - u, v + 2.4)], k.FINE);
    }
    windowF(k, front, W * 0.3, 0, 7, 8, 2, 2, { sill: false, reveal: false });
    windowF(k, front, W * 0.3, H * 0.34, 9, 14, 2, 3);
    /* the turret: a polygonal drum with a conical cap */
    const tx = W / 2 - 2, tz = -6;
    drum(k, tx, tz, 11, 11, GNDY, TOP + 10, k.OUT, 8);
    coneRoof(k, tx, tz, 12.4, TOP + 10, TOP - 11, k.OUT);
    k.M([V.p(tx, TOP - 11, tz), V.p(tx, TOP - 17, tz)], k.MID, { taper: [1.3, 0.5] });
    for (let i = 0; i < 3; i++) {
      const a = -0.5 + i * 0.75;
      const fx = tx + Math.cos(a) * 8, fz = tz + Math.sin(a) * 8;
      const tf = V.face([fx - 2.6, TOP + 18, fz - 1], [1, 0, 0], [0, 1, 0]);
      windowF(k, tf, 2.6, 2, 4.2, 11, 1, 2, { sill: false, reveal: false });
    }
    /* porch across the front, with turned posts */
    const pv = H - 20;
    k.M([front.at(0, pv), front.at(W * 0.62, pv),
         front.out(W * 0.62, pv, 9), front.out(0, pv, 9)], k.OUT, { closed: true });
    for (let i = 0; i <= 3; i++) {
      const u = (W * 0.62) * i / 3;
      k.M([front.out(u, pv, 9), front.out(u, H - 1, 9)], k.OUT, { taper: [0.9, 1.15] });
      if (i < 3) {
        const u1 = (W * 0.62) * (i + 1) / 3;
        k.M([front.out(u, pv + 3, 9), front.out(u + (u1 - u) * 0.5, pv + 5.5, 9),
             front.out(u1, pv + 3, 9)], k.FINE, { curve: true });
      }
    }
    railing(k, front, 0, W * 0.62, H - 1, 6, 12, 9);
    doorF(k, front, W * 0.3, H - 1, 7, 15);
    pavement(k, -W / 2, W / 2, D, 14);
    return k.done();
  };

  /* ── 13 · TOWN HALL — arcade, clock, cupola ───────────────────────── */
  A.townhall = () => {
    const M = massing({ w: 56, d: 34, top: -58, f: 340, dist: 220, yaw: -20 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [0.34, 0.68].forEach((f) => windowF(k, flank, D * f, H * 0.3, 6, 14, 2, 3,
                                        { sillOut: 1.0 }));
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    slab(k, -W / 2 - 3, W / 2 + 3, TOP - 4, TOP, -3, D + 3, k.OUT);
    hipRoof(k, -W / 2, W / 2, 0, D, TOP - 4, TOP - 13, 11, k.MID);
    for (let i = -2; i <= 2; i++) windowF(k, front, W / 2 + i * 10, H * 0.18, 7, 15, 2, 3);
    bandF(k, front, -1, W + 1, H * 0.56, 1.4, 2, k.OUT);
    /* arcade at the base: round-headed openings, the shadow behind each filled */
    for (let i = -2; i <= 2; i++) {
      const cu = W / 2 + i * 10, aw = 8;
      const a = [], inner = [];
      for (let j = 0; j <= 14; j++) {
        const t = Math.PI * (j / 14);
        a.push([cu - Math.cos(t) * (aw / 2), H - 18 - Math.sin(t) * (aw * 0.5)]);
        inner.push([cu - Math.cos(t) * (aw / 2 - 1), H - 18 - Math.sin(t) * (aw * 0.5 - 1)]);
      }
      k.M(front.poly([[cu - aw / 2, H - 1]].concat(a, [[cu + aw / 2, H - 1]])), k.OUT);
      k.F([front.out(cu - aw / 2 + 1, H - 2, -3)]
          .concat(inner.map(([u, v]) => front.out(u, v, -3)),
                  [front.out(cu + aw / 2 - 1, H - 2, -3)]));
    }
    /* the clock tower, set back on the ridge */
    const tw = 7;
    slab(k, -tw, tw, TOP - 30, TOP - 6, D * 0.3 - tw, D * 0.3 + tw, k.OUT);
    const tf = V.face([-tw, TOP - 30, D * 0.3 - tw], [1, 0, 0], [0, 1, 0]);
    oculusF(k, tf, tw, 8, 4.6, 12);
    bandF(k, tf, -0.6, tw * 2 + 0.6, 15, 1.3, 2, k.MID);
    windowF(k, tf, tw, 17, 7, 5, 2, 1, { sill: false, reveal: false });
    k.M([V.p(-tw - 1.6, TOP - 30, D * 0.3 - tw - 1.6),
         V.p(0, TOP - 40, D * 0.3), V.p(tw + 1.6, TOP - 30, D * 0.3 + tw + 1.6)], k.OUT);
    k.M([V.p(-tw - 1.6, TOP - 30, D * 0.3 - tw - 1.6),
         V.p(-tw - 1.6, TOP - 30, D * 0.3 + tw + 1.6), V.p(0, TOP - 40, D * 0.3)], k.MID);
    k.M([V.p(0, TOP - 40, D * 0.3), V.p(0, TOP - 47, D * 0.3)], k.OUT, { taper: [1.3, 0.4] });
    pavement(k, -W / 2, W / 2, D, 14);
    pot(k, -W * 0.52, -9, 10, "cone", 19);
    pot(k, W * 0.52, -9, 10, "cone", 37);
    return k.done();
  };

  /* ── 14 · RIAD — horseshoe arches, crenellated parapet, screen ────── */
  A.riad = () => {
    const M = massing({ w: 46, d: 32, top: -58, f: 330, dist: 200, yaw: -25 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D), V.p(W / 2, TOP, D),
         V.p(W / 2, TOP, 0)], k.MID, { closed: true });
    crenel(k, front, 0, W, 0, 4.5, 9);
    crenel(k, flank, 0, D, 0, 4.5, 6);
    bandF(k, front, -1, W + 1, 8, 1.4, 2, k.MID);
    /*
     * A HORSESHOE ARCH returns INWARD below its widest point — if it stops at
     * the springing it is just a round arch and the whole character is gone.
     */
    const horseshoe = (cu, v0, w, h) => {
      const p = [];
      for (let i = 0; i <= 22; i++) {
        const t = -0.42 + (i / 22) * (Math.PI + 0.84);
        p.push([cu - Math.cos(t) * (w / 2), v0 - Math.sin(t) * (w * 0.56)]);
      }
      return [[p[0][0], v0 + h]].concat(p, [[p[p.length - 1][0], v0 + h]]);
    };
    [0.5].forEach((f) => {
      const g = horseshoe(W * f, H - 20, 15, 19);
      k.M(front.poly(g), k.OUT);
      k.M(front.poly(horseshoe(W * f, H - 20.8, 12.6, 18)), k.MID);
      k.F(front.poly(horseshoe(W * f, H - 21.6, 10.4, 17)));
    });
    [0.17, 0.83].forEach((f) => {
      const g = horseshoe(W * f, H - 22, 9, 21);
      k.M(front.poly(g), k.MID);
      k.F(front.poly(horseshoe(W * f, H - 22.6, 7, 20)));
    });
    /* a mashrabiya screen: a lattice, drawn as a diagonal grid of small holes */
    [0.3, 0.7].forEach((f) => {
      const u0 = W * f - 7, v0 = H * 0.26;
      rectF(k, front, u0, v0, u0 + 14, v0 + 15, k.OUT);
      for (let a = 0; a < 7; a++)
        for (let b = 0; b < 8; b++) {
          const cu = u0 + 1.6 + a * 1.8 + (b % 2) * 0.9, cv = v0 + 1.6 + b * 1.7;
          if (cu > u0 + 12.6) continue;
          k.F(front.poly([[cu, cv - 0.7], [cu + 0.7, cv], [cu, cv + 0.7], [cu - 0.7, cv]]));
        }
    });
    oculusF(k, front, W / 2, H * 0.30, 5, 8);
    pavement(k, -W / 2, W / 2, D, 12);
    pot(k, -W * 0.56, -8, 11, "cone", 23);
    pot(k, W * 0.56, -8, 11, "cone", 41);
    return k.done();
  };

  /* ── 15 · WATER TOWER — a tank on a frame, almost all void ────────── */
  A.watertower = () => {
    const M = massing({ w: 34, d: 34, top: -88, f: 330, dist: 215, yaw: -24 });
    const { k, V, W, D, TOP, H } = M;
    const TANKB = TOP + 34, TANKT = TOP + 6, R = 13;
    /*
     * The structure is mostly EMPTY, so what reads is the pattern of the
     * bracing, not a silhouette. Four legs, splayed, with cross-braces at
     * three levels, and the horizontal rings that tie them.
     */
    const legs = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      legs.push([Math.cos(a), Math.sin(a)]);
    }
    const legP = (i, t) => {
      const r = R * 0.72 + (R * 1.5 - R * 0.72) * t;
      return [legs[i][0] * r, TANKB + (GNDY - TANKB) * t, legs[i][1] * r];
    };
    legs.forEach((_, i) => {
      const a = legP(i, 0), b = legP(i, 1);
      k.M([V.p(a[0], a[1], a[2]), V.p(b[0], b[1], b[2])], k.OUT, { taper: [0.85, 1.2] });
    });
    [0.34, 0.68, 1.0].forEach((t) => {
      const p = legs.map((_, i) => { const q = legP(i, t); return V.p(q[0], q[1], q[2]); });
      if (t < 1) k.M(p, k.MID, { closed: true });
      for (let i = 0; i < 4; i++) {
        const t0 = t - 0.34, j = (i + 1) % 4;
        const a0 = legP(i, Math.max(0, t0)), a1 = legP(j, t);
        const b0 = legP(j, Math.max(0, t0)), b1 = legP(i, t);
        k.M([V.p(a0[0], a0[1], a0[2]), V.p(a1[0], a1[1], a1[2])], k.FINE);
        k.M([V.p(b0[0], b0[1], b0[2]), V.p(b1[0], b1[1], b1[2])], k.FINE);
      }
    });
    /* the tank */
    drum(k, 0, 0, R, R, TANKB, TANKT, k.OUT);
    for (let i = 1; i < 4; i++)
      k.M(halfRing(ring(V, 0, 0, R, TANKB + (TANKT - TANKB) * i / 4, 22), true),
          k.FINE, { curve: true });
    /* banded seams, one filled to give the whole thing a value */
    const a = ring(V, 0, 0, R, TANKB - 5), b = ring(V, 0, 0, R, TANKB - 9);
    k.F(a.slice(0, 15).concat(b.slice(0, 15).reverse()));
    coneRoof(k, 0, 0, R * 1.08, TANKT, TANKT - 11, k.OUT);
    k.M([V.p(0, TANKT - 11, 0), V.p(0, TANKT - 17, 0)], k.MID, { taper: [1.3, 0.5] });
    /* the ladder, running up one leg */
    const l0 = legP(0, 0), l1 = legP(0, 1);
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      const x = l1[0] + (l0[0] - l1[0]) * t, y = l1[1] + (l0[1] - l1[1]) * t;
      const z = l1[2] + (l0[2] - l1[2]) * t;
      k.M([V.p(x - 1.4, y, z), V.p(x + 1.4, y, z)], k.FINE);
    }
    pavement(k, -R * 1.5, R * 1.5, D, 12);
    return k.done();
  };

  /* ── 16 · SHOPHOUSE — five-foot way, ornate parapet, shutters ─────
   *
   * Added as the live-drawing demo: it builds up in clearly separate stages —
   * the mass, the arcade you can walk under, the shuttered upper floor, then
   * the parapet and the vents — so the replay has a legible order.
   */
  A.shophouse = () => {
    const M = massing({ w: 44, d: 32, top: -72, f: 330, dist: 205, yaw: -23 });
    const { k, V, W, D, TOP, H, front, flank } = M;
    const UPPER = H * 0.26, ARC = H * 0.62;
    k.M([V.p(-W / 2, TOP, 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    [0.34, 0.68].forEach((f) =>
      windowF(k, flank, D * f, UPPER + 4, 6.5, 15, 2, 3, { sillOut: 1.0 }));
    k.M([front.at(0, 0), front.at(W, 0), front.at(W, H), front.at(0, H)],
        k.OUT, { closed: true });
    /* the parapet: a scrolled gable above the cornice, which is the whole
       character of the type */
    const pp = [[0, 2]];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = W * t;
      const rise = Math.sin(t * Math.PI) * 13 + Math.sin(t * Math.PI * 3) * 2.2;
      pp.push([u, 2 - rise]);
    }
    pp.push([W, 2]);
    k.M(front.poly(pp), k.OUT, { curve: true });
    k.M(front.poly(pp.map(([u, v]) => [u, v + 2.4])), k.MID, { curve: true });
    oculusF(k, front, W / 2, -6, 3.6, 6);
    slab(k, -W / 2 - 2.6, W / 2 + 2.6, TOP + 2, TOP + 5, -2.6, D + 2.6, k.OUT);
    /* upper floor: three shuttered openings with louvred panels */
    [0.2, 0.5, 0.8].forEach((f) => {
      const cu = W * f;
      windowF(k, front, cu, UPPER, 9.5, 17, 2, 3);
      [-1, 1].forEach((sd) => {
        const a = cu + sd * 5.6, b = cu + sd * 9.8;
        const u0 = Math.min(a, b), u1 = Math.max(a, b);
        k.M([front.out(u0, UPPER, 1.5), front.out(u1, UPPER, 1.5),
             front.out(u1, UPPER + 17, 1.5), front.out(u0, UPPER + 17, 1.5)],
            k.MID, { closed: true });
        for (let j = 1; j < 7; j++)
          k.M([front.out(u0 + 0.5, UPPER + 17 * j / 7, 1.5),
               front.out(u1 - 0.5, UPPER + 17 * j / 7, 1.5)], k.FINE);
      });
    });
    bandF(k, front, -1, W + 1, UPPER + 22, 1.4, 2, k.OUT);
    /* air vents above the arcade — a row of small pierced squares */
    for (let i = 0; i < 9; i++) {
      const u = W * (i + 0.5) / 9;
      k.F(front.poly([[u - 1.1, ARC - 5], [u + 1.1, ARC - 5],
                      [u + 1.1, ARC - 2.4], [u - 1.1, ARC - 2.4]]));
    }
    /*
     * THE FIVE-FOOT WAY: a covered walk you can see INTO, which is the one
     * thing this type is for and the one thing an elevation cannot show.
     */
    const RZ = 9;
    for (let i = 0; i < 3; i++) {
      const cu = W * (0.2 + i * 0.3), aw = 11;
      const a = [], inner = [];
      for (let j = 0; j <= 14; j++) {
        const t = Math.PI * (j / 14);
        a.push([cu - Math.cos(t) * (aw / 2), ARC - Math.sin(t) * (aw * 0.42)]);
        inner.push([cu - Math.cos(t) * (aw / 2 - 1.2), ARC - Math.sin(t) * (aw * 0.42 - 1.2)]);
      }
      k.M(front.poly([[cu - aw / 2, H - 1]].concat(a, [[cu + aw / 2, H - 1]])), k.OUT);
      /* the recess behind each arch, and the shopfront set back in it */
      k.M([front.at(cu - aw / 2 + 1.2, H - 1), front.out(cu - aw / 2 + 1.2, H - 1, -RZ),
           front.out(cu - aw / 2 + 1.2, ARC - 2, -RZ)], k.MID);
      k.F([front.out(cu - aw / 2 + 1.2, H - 2, -RZ)]
          .concat(inner.map(([u, v]) => front.out(u, v, -RZ)),
                  [front.out(cu + aw / 2 - 1.2, H - 2, -RZ)]));
    }
    k.M([front.at(0, ARC), front.at(W, ARC)], k.OUT);
    pavement(k, -W / 2, W / 2, D, 13);
    pot(k, -W * 0.54, -9, 10, "bush", 43);
    pot(k, W * 0.54, -9, 10, "bush", 59);
    return k.done();
  };


  /*
   * ── 21 · THE THATCHED COTTAGE ─────────────────────────────────────
   *
   * A traditional English countryside house. What makes the TYPE read is not
   * the windows — it is the roof, and the roof is a MASS, not a plane:
   *
   *   · thatch has real DEPTH (300-400mm of reed), so its eave is a cut band
   *     you see the end of, never a single line;
   *   · it is HIPPED and rounded, not a sharp gable — no verge boards, no
   *     barge, every edge soft;
   *   · the eave SWEEPS UP over each dormer in one continuous curve. That
   *     curve is the eyebrow, and it is the single most recognisable thing
   *     about the type. The dormer faces are flush with the wall (a wall
   *     dormer), which is both common and the only way the sweep stays one
   *     unbroken line;
   *   · a big brick stack, because an open hearth is why the plan is what
   *     it is.
   *
   * Proportion is the other half. A cottage is WIDE AND LOW — walls a third
   * of the height, roof two thirds. Drawn at a townhouse's proportions it
   * reads as a cottage-roofed villa, and no amount of thatch texture fixes
   * that.
   */
  A.cottage = () => {
    const M = massing({ w: 78, d: 34, top: -8, f: 330, dist: 232, yaw: -17 });
    const { k, V, W, D, TOP, front, flank } = M;
    const OV = 4.2;                       /* the thatch oversails the wall   */
    const T = 3.4;                        /* and is this thick at the cut    */
    const X0 = -W / 2 - OV, X1 = W / 2 + OV, Z0 = -OV, Z1 = D + OV;
    const RIDGE = -52, RZ = (Z0 + Z1) / 2, HIP = 13;
    const DORM = [-W * 0.29, W * 0.02, W * 0.33];   /* the three eyebrows    */
    /*
     * The bells must be SEPARATE and the valleys must reach the base eave.
     * Fattened until they overlapped, the three merged into one bow across
     * the whole front and the house read as two storeys under a sagging
     * eave. Narrow enough to stay three arches; the window straddles each
     * one, head under the crown and sill below the base eave — that
     * straddle is what makes it a dormer rather than a first-floor window.
     */
    const DH = 14, DW = 11.5;

    /*
     * The eave line. Flat at TOP, lifting over each dormer by a bell whose
     * tails die away before the next one — the sweeps must not merge, or the
     * roof reads as a scalloped awning instead of three eyebrows.
     */
    const eave = (x) => {
      let y = TOP;
      for (const c of DORM) {
        const t = (x - c) / (DW * 1.15);
        y -= DH * Math.exp(-t * t * 1.7);
      }
      return y;
    };
    const curveAt = (y0, z, n) => {
      const out = [];
      for (let i = 0; i <= (n || 46); i++) {
        const x = X0 + (X1 - X0) * (i / (n || 46));
        out.push(V.p(x, eave(x) + y0, z));
      }
      return out;
    };

    /* ── the left flank, behind everything on the front ─────────────── */
    k.M([V.p(-W / 2, eave(-W / 2), 0), V.p(-W / 2, TOP, D),
         V.p(-W / 2, GNDY, D), V.p(-W / 2, GNDY, 0)], k.OUT, { closed: true });
    windowF(k, flank, D * 0.56, 9, 8, 11, 2, 2, { sillOut: 1.2 });

    /* ── the front wall: its head IS the eave curve ─────────────────── */
    const wallTop = curveAt(T, 0);
    k.M(wallTop, k.MID, { curve: true });
    k.M([V.p(-W / 2, GNDY, 0), V.p(W / 2, GNDY, 0)], k.OUT);
    k.M([V.p(-W / 2, eave(-W / 2) + T, 0), V.p(-W / 2, GNDY, 0)], k.OUT);
    k.M([V.p(W / 2, eave(W / 2) + T, 0), V.p(W / 2, GNDY, 0)], k.OUT);

    /* ── the thatch ─────────────────────────────────────────────────── */
    /* the cut band at the eave: two curves, and you see the reed ends */
    const lower = curveAt(T, Z0), upper = curveAt(0, Z0);
    k.M(lower, k.OUT, { curve: true });
    k.M(upper, k.MID, { curve: true });
    /* the reed ends: implied, not combed out. Every tick drawn was a fringe */
    for (let i = 1; i < 26; i++) {
      if (i % 3 === 1) continue;
      const x = X0 + (X1 - X0) * (i / 26), j = (i * 37) % 11;
      k.M([V.p(x, eave(x) + 0.8 + j * 0.06, Z0),
           V.p(x, eave(x) + T - 0.5 - j * 0.05, Z0)], k.FINE);
    }

    /* hips and ridge */
    const RA = V.p(X0 + HIP, RIDGE, RZ), RB = V.p(X1 - HIP, RIDGE, RZ);
    k.M([RA, RB], k.OUT);
    k.M([V.p(X0 + HIP, RIDGE + 2.2, RZ), V.p(X1 - HIP, RIDGE + 2.2, RZ)], k.MID);
    /* the ridge is capped and its edge is cut in scallops — the one piece
       of decoration the type allows itself */
    const sc = [];
    for (let i = 0; i <= 16; i++) {
      const x = X0 + HIP + (X1 - X0 - 2 * HIP) * (i / 16);
      sc.push(V.p(x, RIDGE + 2.2 + (i % 2 ? 1.5 : 0), RZ));
    }
    k.M(sc, k.FINE);
    k.M([V.p(X0, eave(X0) + T, Z0), RA], k.OUT);          /* left hip, front */
    k.M([V.p(X0, eave(X0) + T, Z1), RA], k.MID);          /* left hip, back  */
    k.M([V.p(X1, eave(X1) + T, Z0), RB], k.OUT);          /* right hip       */
    k.M([V.p(X0, eave(X0) + T, Z0), V.p(X0, eave(X0) + T, Z1)], k.OUT);
    k.M([V.p(X0, eave(X0), Z0), V.p(X0, eave(X0), Z1)], k.MID);

    /*
     * COMBING — the rake of the reed, all the way up the slope.
     *
     * Left bare the slope was a blank triangle half the drawing tall, and
     * the roof read as a shape rather than a material. Short ticks near the
     * eave were worse: half-drawn texture is the one option that never
     * works. Thatch IS a combed surface, so the density is the subject —
     * draw the whole rake, at the finest weight, and let it carry the mass.
     */
    /*
     * Only between the hips: a rake that keeps going past X0 + HIP leaves
     * the roof surface and stands out in the sky beyond its own edge, and
     * marks here have no occlusion to save it. The stack is skipped for the
     * same reason — the combing was drawing straight through the brickwork.
     */
    const STACKX = -W * 0.30;
    for (let i = 0; i <= 28; i++) {
      const x = X0 + HIP + (X1 - X0 - HIP * 2) * (i / 28);
      if (Math.abs(x - STACKX) < 5.6) continue;
      const j = (i * 29) % 7;
      k.M([V.p(x, eave(x) - 1.1, Z0 + 0.7),
           V.p(x, RIDGE + 3.4 + j * 0.18, RZ - 2.2)], k.FINE);
    }
    /* the hip is a triangle: every rake on it converges on the ridge end */
    for (let i = 1; i < 9; i++) {
      const t = i / 9, z = Z0 + (Z1 - Z0) * t;
      k.M([V.p(X0 + 0.5, eave(X0) - 1.0, z), RA], k.FINE);
    }

    /* ── the eyebrow dormers, flush with the wall under the sweep ───── */
    /*
     * `eave()` answers in WORLD y; `front` is a face whose v runs DOWN FROM
     * TOP. Passing one into the other put every dormer at a height nobody
     * chose and left the sweep running UNDER the windows instead of arching
     * over them. Convert once, here.
     */
    const toV = (worldY) => worldY - TOP;
    DORM.forEach((cu) => {
      const head = toV(eave(cu) + T + 2.4);
      windowF(k, front, W / 2 + cu, head, 9.5, 11, 2, 2,
              { sillOut: 1.1, reveal: 1.0 });
    });

    /* ── ground floor: two casements and a low door ─────────────────── */
    const V0 = GNDY - TOP;                    /* wall height, in face space */
    [-W * 0.33, W * 0.30].forEach((cu) =>
      windowF(k, front, W / 2 + cu, V0 - 26, 11, 13, 3, 2, { sillOut: 1.6 }));
    doorF(k, front, W / 2 - W * 0.02, V0 - 1.5, 8.5, 17);
    /* a plain hood on two brackets — a porch, not a shopfront awning */
    const du0 = W / 2 - W * 0.02 - 7, du1 = W / 2 - W * 0.02 + 7, hv = V0 - 20;
    k.M([front.at(du0, hv), front.at(du1, hv),
         front.out(du1, hv - 1.6, 5.5), front.out(du0, hv - 1.6, 5.5)],
        k.OUT, { closed: true });
    [du0 + 1, du1 - 1].forEach((u) =>
      k.M([front.at(u, hv + 5), front.out(u, hv - 1.2, 4.6)], k.FINE));

    /* ── the stack: brick, tall, and the reason the plan is the plan ── */
    /* based BELOW the ridge so it emerges from the thatch rather than
       balancing on it — a stack standing on a roof reads as a water tank */
    /*
     * The base has to sit just below the ROOF SURFACE AT THE STACK'S OWN z,
     * not below the ridge. The slope at the stack's front face is y ~= -36.9
     * (ridge -52 plus 0.318 of the drop to the eave), so a base at RIDGE+3.5
     * left the shaft hanging in mid-slope as a stray vertical.
     */
    chimney(k, STACKX, RIDGE + 16, RZ - 3, 7.5, 38);
    for (let r = 1; r < 8; r++) {
      const y = RIDGE - 22 + r * 3.4;
      k.M([V.p(STACKX - 3.75, y, RZ - 6.75), V.p(STACKX + 3.75, y, RZ - 6.75)], k.FINE);
    }

    /* ── the garden ─────────────────────────────────────────────────── */
    pavement(k, -W / 2, W / 2, D, 11);
    pot(k, -W * 0.16, -6, 11, "bush", 5);
    pot(k, W * 0.16, -6, 9, "cone", 17);
    pot(k, -W * 0.46, -5, 8, "bush", 29);
    return k.done();
  };

  const NAMES = {
    tudor: "Tudor", brownstone: "Brownstone", pagoda: "Pagoda", adobe: "Adobe",
    chalet: "Alpine chalet", lighthouse: "Lighthouse", windmill: "Windmill",
    deco: "Art Deco tower", temple: "Temple front", barn: "Barn and silo",
    villa: "Modernist villa", victorian: "Victorian", townhall: "Town hall",
    riad: "Riad", watertower: "Water tower", shophouse: "Shophouse",
    cottage: "Thatched cottage",
  };

  const out = {};
  for (const key of Object.keys(A))
    out[key] = Spec.wrap("elevation", NAMES[key], A[key]);
  out._keys = Object.keys(A);
  /* roof, round and porch helpers, shared with houses.js — same vocabulary */
  out._kit = { ring, halfRing, extremes, drum, coneRoof, gableRoof, gableToStreet, hipRoof,
               railing, columns, stoop };
  return out;
})();
