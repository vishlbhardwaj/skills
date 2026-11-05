/*
 * FIVE WOODEN CHAIRS.
 *
 * Chosen because each is a different structural idea, not a restyle of one:
 *
 *   Windsor      a bow, with thin spindles filling it
 *   Ladder-back  two posts, with horizontal slats between them
 *   Wishbone     one steam-bent rail that is crest and arms at once
 *   Bentwood     a closed hoop, braced by a circle inside it
 *   Adirondack   a reclined frame of flat boards, fanned
 *
 * Draw them from the same camera at the same scale and the differences are
 * structural rather than decorative, which is the whole point of a set.
 *
 * Shared convention, as everywhere in this system: y runs DOWN, the floor is
 * y = 40, seats land near y = 18, and a long lens keeps the legs from splaying
 * the way a wide one would.
 */
window.Chairs = (function () {

  /* Every chair sets up the same way; only the joinery differs. */
  function rig() {
    const V = View.one({ f: 185, vp: [50, 44] });
    const marks = [], regions = [], tones = [];
    const api = {
      V, marks, regions, tones,
      FLOOR: 40, OUT: 1.5, DET: 0.85, TEX: 0.5,
      M: (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) }),
      T: (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) }),
      R: (pts, fill, sd, sh, curve) => {
        regions.push({ pts, fill, s: sd || 0, curve: !!curve });
        if (sh != null) regions[regions.length - 1].shade = sh;
      },
      /* fill the faces, outline the silhouette once */
      solid(faces, fill, sd, w) {
        faces.forEach((f, i) => api.R(f.pts, fill, sd + i, f.shade));
        if (faces.silhouette) api.M(faces.silhouette, w, { closed: true, curve: false });
        const top = faces[faces.length - 1];
        if (top && top.shade === 1) api.M(top.pts, w * 0.7, { closed: true, curve: false });
      },
      /* a shadow pools under the thing that casts it */
      shadow(cx, cz, r) {
        api.R(View.disc(cx, cz, r, 22).map(([x, z]) => V.p(x, api.FLOOR, z)), "cWash", 1, 1, true);
      },
      /* a turned leg: one tapered stick from the seat to the floor */
      leg(x, z, dx, dz, yTop, w) {
        /* A chair leg rakes a little. At the splay these first had they read
           as a stepladder, and at detail weight they were thinner than the
           spindles they hold up. */
        api.M(V.seg([x, yTop, z], [x + dx, api.FLOOR, z + dz]), w || api.OUT * 1.9);
      },
      done() { return { marks, regions, tones }; },
    };
    return api;
  }

  /* ──────────────────────────────────────────────────────────────────
   * 1 · WINDSOR bow-back.
   *
   * A generic dome on a slab is not a Windsor. What makes one:
   *   · the bow is a HORSESHOE — it springs from the seat, rises almost
   *     vertically, and only turns over near the top. A semicircle reads as
   *     a croquet hoop leaning on a board.
   *   · the spindles FAN. Dead-parallel sticks are a fence.
   *   · the seat is a thick shaped elm saddle with a chamfered front edge,
   *     not a 3-unit slab.
   *   · the legs rake in BOTH directions and taper hard, and an H-stretcher
   *     ties them. Untapered legs are doweling.
   */
  function windsor() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const CX = 0, CZ = 50, TURN = -7;
    a.shadow(CX, CZ, 17);

    /* a saddle: D-shaped, deeper than it is wide at the back */
    const seat = View.turn([
      [CX - 12, CZ + 9], [CX - 12.5, CZ - 2], [CX - 10, CZ - 9], [CX - 4, CZ - 12],
      [CX + 4, CZ - 12], [CX + 10, CZ - 9], [CX + 12.5, CZ - 2], [CX + 12, CZ + 9],
    ], TURN, CX, CZ);
    a.solid(View.prism(V, seat, 17, 20.8), "cWood", 11, OUT);
    /* the chamfer round the front edge, and the dish */
    M(seat.slice(1, 7).map(([x, z]) => V.p(x, 18.4, z)), TEX, { curve: true });
    M([V.p(CX - 7, 17.2, CZ - 1), V.p(CX, 16.4, CZ + 1), V.p(CX + 7, 17.2, CZ - 1)],
      TEX, { curve: true });

    /*
     * The bow. Parameterised so the sides rise steeply and only turn over at
     * the crown — the shape of a horseshoe, not of a half circle.
     */
    const bowPt = (t, off, scale) => {
      const ang = Math.PI * t;
      const lift = Math.pow(Math.sin(ang), 0.62);          // steep sides
      const spread = Math.sign(Math.cos(ang)) * Math.pow(Math.abs(Math.cos(ang)), 1.35);
      const [x, z] = View.turn([[CX - spread * 11.2 * scale, CZ + 7.5 + 2.6 * lift]], TURN, CX, CZ)[0];
      return V.p(x, 18 - lift * 20.5 * scale + off, z);
    };
    const bowA = [], bowB = [];
    for (let i = 0; i <= 20; i++) { bowA.push(bowPt(i / 20, 0, 1)); bowB.push(bowPt(i / 20, 2.3, 0.93)); }
    M(bowA, OUT * 1.15, { curve: true });
    M(bowB, OUT * 1.15, { curve: true });

    /* spindles: fanned, and swelling low — thin where they enter the bow */
    for (let i = 1; i < 9; i++) {
      const t = i / 9, ang = Math.PI * t;
      const lift = Math.pow(Math.sin(ang), 0.62);
      const spreadTop = Math.sign(Math.cos(ang)) * Math.pow(Math.abs(Math.cos(ang)), 1.35) * 10.4;
      /*
       * Evenly spaced along the seat back, on the SAME side as the point of
       * the bow each one meets. Scaled off the bow's own spread they
       * converged on the seat centre and made a hand fan; sign-flipped they
       * ran from one side of the seat to the opposite side of the bow and
       * made a spider's web. A spindle is very nearly vertical.
       */
      const [bx, bz] = View.turn([[CX + (2 * t - 1) * 8.2, CZ + 7]], TURN, CX, CZ)[0];
      const [tx, tz] = View.turn([[CX - spreadTop, CZ + 7.5 + 2.4 * lift]], TURN, CX, CZ)[0];
      M(V.seg([bx, 17, bz], [tx, 18 - lift * 19 + 1.6, tz]), DET, { taper: [1.25, 0.6] });
    }

    /* legs: raked both ways, strongly tapered, with an H-stretcher */
    const LEG = [[-8.5, -7.5], [8.5, -7.5], [-8.5, 7.5], [8.5, 7.5]];
    LEG.forEach(([dx, dz]) => {
      const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
      a.M(V.seg([x, 20.8, z], [x + dx * 0.34, a.FLOOR, z + dz * 0.3]), OUT * 1.5,
          { taper: [1.3, 0.55] });
    });
    const mid = (i, j, f) => {
      const p0 = View.turn([[CX + LEG[i][0] * (1 + 0.34 * f), CZ + LEG[i][1] * (1 + 0.3 * f)]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + LEG[j][0] * (1 + 0.34 * f), CZ + LEG[j][1] * (1 + 0.3 * f)]], TURN, CX, CZ)[0];
      return [[p0[0], 20.8 + (a.FLOOR - 20.8) * f, p0[1]], [p1[0], 20.8 + (a.FLOOR - 20.8) * f, p1[1]]];
    };
    [[0, 2], [1, 3]].forEach(([i, j]) => M(V.seg(...mid(i, j, 0.55)), DET * 1.3, { taper: [1.1, 1.1] }));
    const [l, r] = [mid(0, 2, 0.55), mid(1, 3, 0.55)];
    M(V.seg([(l[0][0] + l[1][0]) / 2, l[0][1], (l[0][2] + l[1][2]) / 2],
            [(r[0][0] + r[1][0]) / 2, r[0][1], (r[0][2] + r[1][2]) / 2]), DET * 1.3);
    return a.done();
  }

  /* ──────────────────────────────────────────────────────────────────
   * 2 · LADDER-BACK — two posts, slats between them.
   * The slats are bowed in plan, not straight: a flat ladder is a gate.
   */
  function ladder() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const CX = 0, CZ = 50, TURN = -20;
    a.shadow(CX, CZ, 16);

    const foot = View.turn(View.rect(CX - 11, CZ - 10, CX + 11, CZ + 10), TURN, CX, CZ);
    a.solid(View.prism(V, foot, 18, 20.5), "cWood", 11, OUT);
    /* a rush seat: woven, so it gets a texture the others do not */
    a.T(View.turn(View.rect(CX - 10, CZ - 9, CX + 10, CZ + 9), TURN, CX, CZ)
        .map(([x, z]) => V.p(x, 18, z)), "hatch", TEX * 0.8,
        { s: 21, angle: 20, gap: 0.85 });

    /* two back posts, leaning back a little and splaying out */
    const postTop = [];
    [-10, 10].forEach((dx, k) => {
      const [bx, bz] = View.turn([[CX + dx, CZ + 9]], TURN, CX, CZ)[0];
      const [tx, tz] = View.turn([[CX + dx * 1.12, CZ + 12]], TURN, CX, CZ)[0];
      M(V.seg([bx, 20.5, bz], [tx, -5, tz]), OUT);
      postTop.push([tx, tz]);
    });

    /* four slats, each bowed back in plan */
    [-3, 2.4, 7.8, 13.2].forEach((y, s) => {
      const t = (y + 5) / 25;
      const bar = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        const dx = (-10 + 20 * u) * (1 + 0.12 * t);
        const [x, z] = View.turn([[CX + dx, CZ + 9 + 3 * (1 - (2 * u - 1) ** 2) + 3 * t]], TURN, CX, CZ)[0];
        bar.push([x, z]);
      }
      /* A slat is a board. Two thin lines with a gap between them read as a
         radiator grille, which is what four of them in a row looked like. */
      const up = bar.map(([x, z]) => V.p(x, y, z));
      const dn = bar.map(([x, z]) => V.p(x, y + 3.4, z));
      a.R(up.concat(dn.slice().reverse()), "cWood", 31 + s * 2, 0.92, true);
      M(up, DET, { curve: true });
      M(dn, DET, { curve: true });
    });

    /* straight legs with box stretchers — the country-chair tell */
    const legs = [[-10, -9], [10, -9], [-10, 9], [10, 9]];
    legs.forEach(([dx, dz]) => {
      const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
      a.leg(x, z, dx * 0.1, dz * 0.1, 20.5);
    });
    [[-10, -9, 10, -9], [-10, 9, 10, 9], [-10, -9, -10, 9], [10, -9, 10, 9]].forEach(([x0, z0, x1, z1]) => {
      const p0 = View.turn([[CX + x0, CZ + z0]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + x1, CZ + z1]], TURN, CX, CZ)[0];
      M(V.seg([p0[0], 32, p0[1]], [p1[0], 32, p1[1]]), DET * 0.9);
    });
    return a.done();
  }

  /* ──────────────────────────────────────────────────────────────────
   * 3 · WISHBONE.
   *
   * Authored as an explicit PROFILE, not generated from trig.
   *
   * Three attempts built the rail out of sin/cos came out nearly right and
   * read wrong every time — a hat stand, then a tangle. The two chairs in
   * this set that work (ladder-back, Adirondack) are made of explicit parts,
   * and that is the difference: a traced profile can be judged against the
   * real thing point by point, a formula can only be re-tuned and re-looked
   * at.
   *
   * Half the crest is listed and mirrored, so it is symmetrical by
   * construction rather than by luck.
   */
  function wishbone() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const CX = 0, CZ = 50, TURN = -16;
    a.shadow(CX, CZ, 16);

    const seat = View.turn([
      [CX - 12.5, CZ - 11], [CX + 12.5, CZ - 11],
      [CX + 9.5, CZ + 10], [CX - 9.5, CZ + 10],
    ], TURN, CX, CZ);
    a.solid(View.prism(V, seat, 17.5, 19.8), "cWood", 11, OUT);
    const seatTop = seat.map(([x, z]) => V.p(x, 17.5, z));
    a.T(seatTop, "hatch", TEX * 0.6, { s: 21, angle: 34, gap: 0.26 });
    a.T(seatTop, "hatch", TEX * 0.6, { s: 23, angle: 146, gap: 0.26 });

    /* half the crest: [x, y, z] from the centre out to the arm tip */
    const HALF = [
      [0, 2.2, 10], [4.2, 2.5, 9.6], [8, 3.4, 8.4], [10.8, 5.0, 5.8],
      [12.0, 6.6, 1.6], [12.2, 8.0, -3.0], [11.6, 8.8, -7.6],
    ];
    const crest = HALF.slice().reverse().map(([x, y, z]) => [-x, y, z]).concat(HALF.slice(1));
    const put = (dy) => crest.map(([x, y, z]) => {
      const [px, pz] = View.turn([[CX + x, CZ + z]], TURN, CX, CZ)[0];
      return V.p(px, y + dy, pz);
    });
    /* thick at the crest, thinning into the arms: the rail's whole character */
    M(put(0), OUT * 1.5, { curve: true, taper: [0.62, 0.62] });
    M(put(3.0), OUT * 1.5, { curve: true, taper: [0.62, 0.62] });
    /* the arm tips, capped and carried down to the seat on front posts */
    [crest[0], crest[crest.length - 1]].forEach(([x, y, z]) => {
      const [px, pz] = View.turn([[CX + x, CZ + z]], TURN, CX, CZ)[0];
      M([V.p(px, y, pz), V.p(px, y + 3.0, pz)], DET * 1.2);
      M(V.seg([px, y + 3.0, pz], [px, 19.8, pz]), OUT * 1.2, { taper: [0.85, 1.05] });
    });

    /* two rear uprights, and the Y under the crest's middle */
    [-10.4, 10.4].forEach((dx) => {
      const [x, z] = View.turn([[CX + dx, CZ + 9.2]], TURN, CX, CZ)[0];
      M(V.seg([x, 19.8, z], [x, 3.6, z]), OUT * 1.15, { taper: [1.1, 0.85] });
    });
    const [sx, sz] = View.turn([[CX, CZ + 9]], TURN, CX, CZ)[0];
    M(V.seg([sx, 17.5, sz], [sx, 10.2, sz]), OUT * 1.3, { taper: [1.25, 0.95] });
    [-5.0, 5.0].forEach((dx) => {
      const [tx, tz] = View.turn([[CX + dx, CZ + 9.4]], TURN, CX, CZ)[0];
      M([V.p(sx, 10.2, sz), V.p((sx + tx) / 2, 7.0, (sz + tz) / 2), V.p(tx, 3.4, tz)],
        OUT * 1.1, { curve: true, taper: [1, 0.78] });
    });

    const LEG = [[-10, -8.5], [10, -8.5], [-8, 8.5], [8, 8.5]];
    LEG.forEach(([dx, dz]) => {
      const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
      M(V.seg([x, 19.8, z], [x + dx * 0.24, a.FLOOR, z + dz * 0.2]), OUT * 1.5,
        { taper: [1.25, 0.58] });
    });
    const at = (i, f) => {
      const [x, z] = View.turn([[CX + LEG[i][0] * (1 + 0.24 * f), CZ + LEG[i][1] * (1 + 0.2 * f)]], TURN, CX, CZ)[0];
      return [x, 19.8 + (a.FLOOR - 19.8) * f, z];
    };
    [[0, 2], [1, 3]].forEach(([i, j]) => M(V.seg(at(i, 0.52), at(j, 0.52)), DET * 1.4));
    const lm = at(0, 0.52), rm = at(1, 0.52), lb = at(2, 0.52), rb = at(3, 0.52);
    M(V.seg([(lm[0] + lb[0]) / 2, lm[1], (lm[2] + lb[2]) / 2],
            [(rm[0] + rb[0]) / 2, rm[1], (rm[2] + rb[2]) / 2]), DET * 1.4);
    return a.done();
  }

  /* ──────────────────────────────────────────────────────────────────
   * 4 · BENTWOOD.
   *
   * Also an explicit profile. The hoop is widest about a third of the way up
   * and meets the seat well inside its rim; generated from a sine it pinched
   * to a point at the bottom and read as a balloon on a stick.
   */
  function bentwood() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const CX = 0, CZ = 50;
    a.shadow(CX, CZ, 15);

    a.solid(View.prism(V, View.disc(CX, CZ, 11, 24), 18, 19.8), "cWood", 11, OUT);
    a.T(View.disc(CX, CZ, 9.4, 24).map(([x, z]) => V.p(x, 18, z)), "halftone", TEX * 0.6,
        { s: 21, gap: 0.4 });

    /* half the hoop, seat upward: [x, y] */
    const HOOP = [
      [8.6, 18], [10.0, 13.5], [10.6, 8.5], [10.2, 3.5],
      [8.8, -0.6], [6.2, -3.6], [3.2, -5.2], [0, -5.6],
    ];
    const curve = (sc, cy) => {
      const half = HOOP.map(([x, y]) => [x * sc, cy + (y - cy) * sc]);
      /*
       * Mirror, then run back DOWN the other side. Concatenated the other way
       * round the path went left-seat → crown and then jumped to the right
       * side partway up, and the jump drew as a diagonal straight across the
       * chair. A mirrored half has to be reversed to keep one direction of
       * travel.
       */
      return half.map(([x, y]) => [-x, y])
        .concat(half.slice().reverse().slice(1))
        .map(([x, y]) => V.p(CX + x, y, CZ + 6.5 + 1.6 * (18 - y) / 24));
    };
    M(curve(1, 18), OUT * 1.35, { curve: true, taper: [0.88, 0.88] });
    M(curve(0.84, 18), OUT * 1.35, { curve: true, taper: [0.88, 0.88] });

    /* the braced circle, low inside the hoop */
    const ring = [];
    for (let i = 0; i < 26; i++) {
      const ang = (i / 26) * Math.PI * 2;
      ring.push(V.p(CX + Math.cos(ang) * 5.0, 9.6 + Math.sin(ang) * 4.6, CZ + 7.4));
    }
    M(ring, OUT, { closed: true, curve: true, taper: [0.75, 0.75] });
    M(V.seg([CX, 14.2, CZ + 7.4], [CX, 18, CZ + 7.4]), DET * 1.3);

    [[-8.4, -7], [8.4, -7]].forEach(([dx, dz]) =>
      M(V.seg([CX + dx, 19.8, CZ + dz], [CX + dx * 1.26, a.FLOOR, CZ + dz * 1.3]),
        OUT * 1.5, { taper: [1.25, 0.58] }));
    [-1, 1].forEach((sd) =>
      M([V.p(CX + sd * 8.6, 18.4, CZ + 6.5), V.p(CX + sd * 10.2, 27, CZ + 9.5),
         V.p(CX + sd * 11.2, a.FLOOR, CZ + 14)], OUT * 1.5,
        { curve: true, taper: [1.2, 0.58] }));
    return a.done();
  }

  /* ──────────────────────────────────────────────────────────────────
   * 5 · ADIRONDACK — flat boards, reclined, fanned.
   * Nothing here is turned or bent: it is all sawn plank, which is why the
   * arms are wide slabs and the back is a fan of straight slats.
   */
  function adirondack() {
    const a = rig(), { V, M, OUT, DET, TEX } = a;
    const CX = 0, CZ = 50, TURN = -22;
    a.shadow(CX, CZ, 19);

    /* the seat rakes down toward the back */
    const seatFoot = View.turn(View.rect(CX - 12, CZ - 12, CX + 12, CZ + 10), TURN, CX, CZ);
    a.solid(View.prism(V, seatFoot, 19, 21.5), "cWood", 11, OUT);
    /* seat slats, running front to back */
    for (let dx = -9; dx <= 9; dx += 4.5) {
      const p0 = View.turn([[CX + dx, CZ - 11]], TURN, CX, CZ)[0];
      const p1 = View.turn([[CX + dx, CZ + 9]], TURN, CX, CZ)[0];
      M(V.seg([p0[0], 18.9, p0[1]], [p1[0], 18.9, p1[1]]), TEX);
    }

    /* the fan back: straight slats splaying outward and leaning back */
    for (let i = -3; i <= 3; i++) {
      const b = View.turn([[CX + i * 2.8, CZ + 9]], TURN, CX, CZ)[0];
      const t = View.turn([[CX + i * 5.2, CZ + 17]], TURN, CX, CZ)[0];
      const w = 2.1;
      const quad = [V.p(b[0] - w, 19, b[1]), V.p(b[0] + w, 19, b[1]),
                    V.p(t[0] + w * 1.2, -4 - Math.abs(i) * -1.4, t[1]),
                    V.p(t[0] - w * 1.2, -4 - Math.abs(i) * -1.4, t[1])];
      a.R(quad, "cWood", 31 + i * 2, 0.9, false);
      M(quad, DET, { closed: true, curve: false });
    }
    /* the curved top rail that caps the fan */
    const cap = [];
    for (let i = -3.4; i <= 3.4; i += 0.4) {
      const p = View.turn([[CX + i * 5.2, CZ + 17]], TURN, CX, CZ)[0];
      cap.push(V.p(p[0], -3.4 - (1 - (i / 3.4) ** 2) * 2.2, p[1]));
    }
    M(cap, OUT, { curve: true });

    /* wide flat arms on vertical posts */
    [-1, 1].forEach((sd) => {
      const armFoot = View.turn(
        View.rect(CX + sd * 11 - 3.4, CZ - 13, CX + sd * 11 + 3.4, CZ + 8), TURN, CX, CZ);
      a.solid(View.prism(V, armFoot, 6, 8.5), "cWood", 51 + (sd > 0 ? 8 : 0), DET);
      const p = View.turn([[CX + sd * 11, CZ - 11]], TURN, CX, CZ)[0];
      M(V.seg([p[0], 8.5, p[1]], [p[0], a.FLOOR, p[1]]), OUT * 1.9);
    });

    [[-11, 8], [11, 8]].forEach(([dx, dz]) => {
      const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
      a.leg(x, z, dx * 0.1, dz * 0.1, 21.5);
    });
    return a.done();
  }

  const wrap = (label, build) => ({
    label, build,
    fit: { w: 0.8, h: 0.84 }, pen: 0.17,
    nib: { pressure: 0.1, wander: 0.07, boil: 0.12, overshoot: 0.22,
           double: false, breaks: 0.03, blobs: 0, specks: 0 },
  });

  return {
    windsor:    wrap("Windsor", windsor),
    ladder:     wrap("Ladder-back", ladder),
    wishbone:   wrap("Wishbone", wishbone),
    bentwood:   wrap("Bentwood", bentwood),
    adirondack: wrap("Adirondack", adirondack),
  };
})();
