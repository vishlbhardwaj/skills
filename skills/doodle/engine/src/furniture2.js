/*
 * TWENTY FURNITURE UNITS.
 *
 * Carcass work: explicit boxes and boards, each turned a few degrees off
 * square so it has a side to show. Proportions are real at roughly
 * 1 unit = 2 cm, floor at y = 40, so a seat lands near y = 18 and a worktop
 * near y = 4 — the same scale as everything else on the canvas.
 *
 * Every leg tapers. A carcass on untapered legs reads as a diagram, which is
 * the single thing that separated the chairs that worked from the ones that
 * did not.
 *
 * Footprints are ABSOLUTE, in the same frame as the legs. Passed as offsets
 * they get turned about a centre they are nowhere near and the carcass swings
 * away from its own feet.
 */
window.Furniture2 = (function () {
  const F = {};
  const CZ = 46;

  /* a drawer or door front, drawn ON the carcass face rather than as its own
     box — a box per drawer doubles every edge */
  function front(k, cx, cz, turn, x0, x1, y0, y1, zFace) {
    const V = k.V;
    const p0 = View.turn([[x0, zFace]], turn, cx, cz)[0];
    const p1 = View.turn([[x1, zFace]], turn, cx, cz)[0];
    k.M([V.p(p0[0], y0, p0[1]), V.p(p1[0], y0, p1[1]),
         V.p(p1[0], y1, p1[1]), V.p(p0[0], y1, p0[1])], k.DET,
        { closed: true, curve: false });
  }
  function pull(k, cx, cz, turn, x0, x1, y, zFace, w) {
    const V = k.V;
    const p0 = View.turn([[x0, zFace]], turn, cx, cz)[0];
    const p1 = View.turn([[x1, zFace]], turn, cx, cz)[0];
    k.M([V.p(p0[0], y, p0[1]), V.p(p1[0], y, p1[1])], w || k.DET * 1.3);
  }
  /* four tapered legs under a carcass */
  function legs(k, cx, cz, turn, hx, hz, yTop, splay) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const [x, z] = View.turn([[cx + sx * hx, cz + sz * hz]], turn, cx, cz)[0];
      k.leg(x, z, sx * (splay || 0.6), sz * (splay || 0.6) * 0.6, yTop);
    });
  }

  /*
   * 1 · Armchair.
   *
   * Back, then arms, then the seat INSET between them. Overlapping prisms
   * that each span the full footprint all draw their own silhouette, and the
   * result is a grid of boxes — a cubicle, not a chair. The seat has to live
   * in the gap the arms leave, and be authored last so it closes it.
   */
  F.armchair = (k) => {
    const T = -26, X = 20, D = 19, A = 7;
    k.shadow(0, CZ, X + 6, D * 0.6);
    /*
     * ONE mass, with the seat scooped out of it.
     *
     * Back, arms and seat as separate prisms each draw their own silhouette —
     * and a silhouette is a MARK, so the back's outline paints over the arms
     * that should hide it. Nested rectangles, i.e. a cubicle. Upholstery here
     * has to be one shell with the seat implied inside it.
     */
    k.part(-X, CZ - D, X, CZ + D, -5, 26, "cSofa", 11, k.OUT, T, 0, CZ, 7);
    k.part(-X + A, CZ - D + 1, X - A, CZ + D - 8, 13, 20, "cSofa", 41, k.DET, T, 0, CZ, 4);
    legs(k, 0, CZ, T, X - 4, D - 4, 26, 0.5);
  };

  /* 2 · Three-seat sofa — same order as the armchair, three seat cushions */
  F.sofa = (k) => {
    const T = -18, X = 44, D = 17, A = 6;
    k.shadow(0, CZ, X + 7, D * 0.7);
    /* one shell, three cushions scooped into it — see the armchair */
    k.part(-X, CZ - D, X, CZ + D, -3, 25, "cSofa", 11, k.OUT, T, 0, CZ, 6);
    [-25, 0, 25].forEach((x, i) =>
      k.part(x - 11, CZ - D + 1, x + 11, CZ + D - 7, 13, 19, "cSofa", 41 + i * 8,
             k.DET, T, 0, CZ, 3.4));
    legs(k, 0, CZ, T, X - 5, D - 4, 25, 0.5);
  };

  /* 3 · Daybed — low, one bolster, no back */
  F.daybed = (k) => {
    const T = -20, X = 40, D = 16;
    k.shadow(0, CZ, X + 6, D * 0.7);
    k.part(-X, CZ - D, X, CZ + D, 20, 28, "cSofa", 11, k.OUT, T, 0, CZ, 4);
    k.part(X - 9, CZ - D, X, CZ + D, 8, 21, "cSofa", 31, k.OUT, T, 0, CZ, 4.5);
    legs(k, 0, CZ, T, X - 4, D - 3, 28, 0.4);
  };

  /* 4 · Stool — three legs, round top */
  F.stool = (k) => {
    k.shadow(0, CZ, 14, 7);
    k.solid(View.prism(k.V, View.disc(0, CZ, 13, 20), 18, 21), "cWood", 11, k.OUT);
    [0, 120, 240].forEach((a) => {
      const r = a * Math.PI / 180;
      k.leg(Math.sin(r) * 9, CZ + Math.cos(r) * 9, Math.sin(r) * 4, Math.cos(r) * 2.6, 21);
    });
  };

  /* 5 · Bar stool — tall, with a footrest ring */
  F.barstool = (k) => {
    k.shadow(0, CZ, 12, 6);
    k.solid(View.prism(k.V, View.disc(0, CZ, 11, 20), 2, 5), "cWood", 11, k.OUT);
    [0, 90, 180, 270].forEach((a) => {
      const r = a * Math.PI / 180;
      k.leg(Math.sin(r) * 8, CZ + Math.cos(r) * 8, Math.sin(r) * 4, Math.cos(r) * 2.4, 5);
    });
    k.M(View.disc(0, CZ, 10.6, 18).map(([x, z]) => k.V.p(x, 28, z)), k.DET * 1.4,
        { closed: true, curve: true });
  };

  /* 6 · Nightstand */
  F.nightstand = (k) => {
    const T = -24, X = 13, D = 11;
    k.shadow(0, CZ, X + 5, D * 0.7);
    k.part(-X, CZ - D, X, CZ + D, 14, 30, "cWood", 11, k.OUT, T, 0, CZ);
    front(k, 0, CZ, T, -X + 1.4, X - 1.4, 16, 21.4, CZ - D - 0.3);
    front(k, 0, CZ, T, -X + 1.4, X - 1.4, 22.4, 28, CZ - D - 0.3);
    pull(k, 0, CZ, T, -4, 4, 18.8, CZ - D - 0.7);
    pull(k, 0, CZ, T, -4, 4, 25.2, CZ - D - 0.7);
    legs(k, 0, CZ, T, X - 1.6, D - 1.6, 30, 0.35);
  };

  /* 7 · Dresser — six drawers, two columns */
  F.dresser = (k) => {
    const T = -21, X = 30, D = 13;
    k.shadow(0, CZ, X + 6, D * 0.8);
    k.part(-X, CZ - D, X, CZ + D, 2, 34, "cWood", 11, k.OUT, T, 0, CZ);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 2; c++) {
        const x0 = -X + 1.6 + c * (X - 1.6), x1 = x0 + X - 3.2;
        front(k, 0, CZ, T, x0, x1, 4 + r * 9.6, 12 + r * 9.6, CZ - D - 0.3);
        pull(k, 0, CZ, T, (x0 + x1) / 2 - 4, (x0 + x1) / 2 + 4, 8 + r * 9.6, CZ - D - 0.7);
      }
    legs(k, 0, CZ, T, X - 2, D - 2, 34, 0.35);
  };

  /* 8 · Console — long, shallow, two drawers */
  F.console = (k) => {
    const T = -19, X = 38, D = 8;
    k.shadow(0, CZ, X + 6, D * 1.1);
    k.part(-X, CZ - D, X, CZ + D, 6, 10, "cWood", 11, k.OUT, T, 0, CZ);
    k.part(-X + 3, CZ - D + 1, X - 3, CZ + D - 1, 10, 17, "cWood", 31, k.DET, T, 0, CZ);
    [-18, 18].forEach((x) => {
      front(k, 0, CZ, T, x - 14, x + 14, 11.4, 15.6, CZ - D + 0.6);
      pull(k, 0, CZ, T, x - 4, x + 4, 13.5, CZ - D + 0.2);
    });
    legs(k, 0, CZ, T, X - 3, D - 2, 17, 0.5);
  };

  /* 9 · Dining table — rectangular, on an apron */
  F.dining = (k) => {
    const T = -23, X = 42, D = 20;
    k.shadow(0, CZ, X + 7, D * 0.8);
    k.part(-X, CZ - D, X, CZ + D, 2, 5, "cWood", 11, k.OUT, T, 0, CZ);
    k.part(-X + 4, CZ - D + 4, X - 4, CZ + D - 4, 5, 9, "cWood", 31, k.DET, T, 0, CZ);
    legs(k, 0, CZ, T, X - 5, D - 5, 9, 0.3);
  };

  /* 10 · Writing desk — a top, one drawer, splayed legs */
  F.writing = (k) => {
    const T = -22, X = 32, D = 14;
    k.shadow(0, CZ, X + 6, D * 0.8);
    k.part(-X, CZ - D, X, CZ + D, 3, 6, "cWood", 11, k.OUT, T, 0, CZ);
    k.part(-18, CZ - D + 1, 18, CZ + D - 3, 6, 11, "cWood", 31, k.DET, T, 0, CZ);
    pull(k, 0, CZ, T, -5, 5, 8.5, CZ - D + 0.6);
    legs(k, 0, CZ, T, X - 4, D - 4, 11, 0.8);
  };

  /* 11 · Filing cabinet — three deep drawers, on a plinth */
  F.filing = (k) => {
    const T = -25, X = 12, D = 15;
    k.shadow(0, CZ, X + 5, D * 0.7);
    k.part(-X, CZ - D, X, CZ + D, 4, 36, "cInk", 11, k.OUT, T, 0, CZ);
    k.part(-X + 1, CZ - D + 1, X - 1, CZ + D - 1, 36, 40, "cInk", 31, k.DET, T, 0, CZ, 0, true);
    for (let r = 0; r < 3; r++) {
      front(k, 0, CZ, T, -X + 1.4, X - 1.4, 6 + r * 10, 14.4 + r * 10, CZ - D - 0.3);
      pull(k, 0, CZ, T, -4, 4, 10 + r * 10, CZ - D - 0.7);
    }
  };

  /* 12 · Shoe rack — open, three tilted shelves */
  F.shoerack = (k) => {
    const T = -24, X = 22, D = 9;
    k.shadow(0, CZ, X + 5, D * 0.9);
    [-X, X].forEach((x, i) =>
      k.part(x - 1.4, CZ - D, x + 1.4, CZ + D, 8, 40, "cWood", 11 + i * 14, k.OUT, T, 0, CZ));
    [12, 22, 32].forEach((y, i) =>
      k.part(-X, CZ - D + 1, X, CZ + D - 1, y, y + 1.6, "cWood", 41 + i * 8, k.DET, T, 0, CZ));
  };

  /* 13 · Coat stand — a post, a foot, four pegs */
  F.coatstand = (k) => {
    k.shadow(0, CZ, 11, 6);
    k.part(-2.2, CZ - 2.2, 2.2, CZ + 2.2, -28, 38, "cWood", 11, k.OUT, 0, 0, CZ, 1.8);
    k.solid(View.prism(k.V, View.disc(0, CZ, 10, 18), 38, 40), "cWood", 31, k.DET, true);
    [0, 90, 180, 270].forEach((a, i) => {
      const r = a * Math.PI / 180;
      k.M([k.V.p(Math.sin(r) * 2, -23, CZ + Math.cos(r) * 2),
           k.V.p(Math.sin(r) * 12, -27, CZ + Math.cos(r) * 12)], k.OUT * 1.7, { taper: [1.3, 0.85] });
      k.M([k.V.p(Math.sin(r) * 2, -13, CZ + Math.cos(r) * 2),
           k.V.p(Math.sin(r) * 10, -17, CZ + Math.cos(r) * 10)], k.OUT * 1.5, { taper: [1.3, 0.85] });
    });
  };

  /* 14 · TV unit — long, low, two doors and an open bay */
  F.tvunit = (k) => {
    const T = -17, X = 40, D = 11;
    k.shadow(0, CZ, X + 6, D * 0.9);
    k.part(-X, CZ - D, X, CZ + D, 16, 32, "cWood", 11, k.OUT, T, 0, CZ);
    [-27, 27].forEach((x) => {
      front(k, 0, CZ, T, x - 11, x + 11, 18, 30, CZ - D - 0.3);
      pull(k, 0, CZ, T, x - 3, x + 3, 24, CZ - D - 0.7);
    });
    front(k, 0, CZ, T, -13, 13, 18, 30, CZ - D - 0.3);
    k.M(k.V.seg(...[[0, 24, CZ - D - 0.4], [0, 24, CZ - D - 0.4]].map((p, i) =>
      View.turn([[i ? 13 : -13, CZ - D - 0.4]], T, 0, CZ)[0]).map((p, i) => [p[0], 24, p[1]])), k.TEX);
    legs(k, 0, CZ, T, X - 3, D - 2, 32, 0.4);
  };

  /* 15 · Ottoman — a soft cube */
  F.ottoman = (k) => {
    const T = -28;
    k.shadow(0, CZ, 17, 9);
    k.part(-14, CZ - 14, 14, CZ + 14, 20, 34, "cSofa", 11, k.OUT, T, 0, CZ, 5);
    k.M(k.V.seg(...View.turn([[-13, CZ - 13], [13, CZ + 13]], T, 0, CZ)
      .map((p) => [p[0], 25, p[1]])), k.TEX);
    legs(k, 0, CZ, T, 11, 11, 34, 0.3);
  };

  /* 16 · Bed — headboard, mattress, two pillows */
  F.bed = (k) => {
    const T = -16, X = 32, D = 40;
    k.shadow(0, CZ, X + 7, D * 0.5);
    k.part(-X, CZ - D, X, CZ + D, 24, 34, "cSofa", 11, k.OUT, T, 0, CZ, 3);
    k.part(-X, CZ + D - 4, X, CZ + D, -4, 26, "cWood", 31, k.OUT, T, 0, CZ, 3);
    [-15, 15].forEach((x, i) =>
      k.part(x - 13, CZ + D - 22, x + 13, CZ + D - 7, 18, 24, "cPaper", 51 + i * 8, k.DET, T, 0, CZ, 4));
    legs(k, 0, CZ, T, X - 3, D - 3, 34, 0.3);
  };

  /* 17 · Drinks trolley — two trays on castors */
  F.trolley = (k) => {
    const T = -24, X = 18, D = 10;
    k.shadow(0, CZ, X + 5, D * 0.9);
    k.part(-X, CZ - D, X, CZ + D, 12, 14, "cWood", 11, k.OUT, T, 0, CZ);
    k.part(-X + 2, CZ - D + 2, X - 2, CZ + D - 2, 28, 30, "cWood", 31, k.DET, T, 0, CZ);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const [x, z] = View.turn([[sx * (X - 2), CZ + sz * (D - 2)]], T, 0, CZ)[0];
      k.M(k.V.seg([x, 14, z], [x, 37, z]), k.OUT * 1.2, { taper: [1.1, 0.9] });
      k.M(View.disc(x, z, 2.6, 12).map(([u, w]) => k.V.p(u, 38.4, w)), k.DET,
          { closed: true, curve: true });
    });
    k.M(k.V.seg(...View.turn([[-X, CZ + D + 3], [X, CZ + D + 3]], T, 0, CZ)
      .map((p) => [p[0], 8, p[1]])), k.DET * 1.5, { taper: [1, 1] });
  };

  /* 18 · Cube shelving — a 2×2 grid, open both sides */
  F.cubes = (k) => {
    const T = -20, X = 22, D = 10;
    k.shadow(0, CZ, X + 5, D * 0.9);
    [-X, 0, X].forEach((x, i) =>
      k.part(x - 1.3, CZ - D, x + 1.3, CZ + D, 6, 38, "cWood", 11 + i * 10, k.OUT, T, 0, CZ));
    [6, 22, 38].forEach((y, i) =>
      k.part(-X, CZ - D + 0.6, X, CZ + D - 0.6, y, y + 1.6, "cWood", 51 + i * 8, k.DET, T, 0, CZ));
  };

  /* 19 · Magazine rack — a leaning A-frame */
  F.magrack = (k) => {
    const T = -26, X = 15;
    k.shadow(0, CZ, X + 4, 8);
    [-1, 1].forEach((sd, i) => {
      const [x0, z0] = View.turn([[sd * X, CZ - 7]], T, 0, CZ)[0];
      const [x1, z1] = View.turn([[sd * (X - 7), CZ + 7]], T, 0, CZ)[0];
      k.M(k.V.seg([x0, 14, z0], [x0 + sd * 2, k.GND, z0]), k.OUT * 1.5, { taper: [1.25, 0.6] });
      k.M(k.V.seg([x1, 14, z1], [x1 + sd * 2, k.GND, z1]), k.OUT * 1.5, { taper: [1.25, 0.6] });
    });
    /* the sling between the frames, and magazines leaning IN it rather than
       standing on it — upright they read as boards on a table */
    k.part(-X + 2, CZ - 7, X - 2, CZ + 7, 16, 18, "cWood", 11, k.DET, T, 0, CZ);
    [-9, -3, 3, 9].forEach((x, i) => {
      const lean = -16 + i * 5;
      k.part(x - 4.6, CZ - 6, x + 4.6, CZ + 6, 2 + i * 0.8, 17, "cPaper", 31 + i * 6,
             k.DET, T + lean, 0, CZ);
    });
  };

  /* 20 · Glazed cabinet — tall, two doors, a visible shelf line */
  F.cabinet = (k) => {
    const T = -21, X = 20, D = 11;
    k.shadow(0, CZ, X + 5, D * 0.8);
    k.part(-X, CZ - D, X, CZ + D, -34, 36, "cWood", 11, k.OUT, T, 0, CZ);
    k.part(-X - 1, CZ - D - 1, X + 1, CZ + D + 1, 36, 40, "cWood", 31, k.DET, T, 0, CZ, 0, true);
    [-10, 10].forEach((x) => front(k, 0, CZ, T, x - 9, x + 9, -31, 33, CZ - D - 0.3));
    [-14, 2, 18].forEach((y) =>
      k.M(k.V.seg(...View.turn([[-X + 1.6, CZ - D - 0.4], [X - 1.6, CZ - D - 0.4]], T, 0, CZ)
        .map((p) => [p[0], y, p[1]])), k.TEX * 0.9));
    [-1.6, 1.6].forEach((dx) => {
      const [x, z] = View.turn([[dx, CZ - D - 0.8]], T, 0, CZ)[0];
      k.M(k.V.seg([x, -4, z], [x, 6, z]), k.DET * 1.4);
    });
  };

  const NAMES = {
    armchair: "Armchair", sofa: "Sofa", daybed: "Daybed", stool: "Stool",
    barstool: "Bar stool", nightstand: "Nightstand", dresser: "Dresser",
    console: "Console", dining: "Dining table", writing: "Writing desk",
    filing: "Filing cabinet", shoerack: "Shoe rack", coatstand: "Coat stand",
    tvunit: "TV unit", ottoman: "Ottoman", bed: "Bed", trolley: "Trolley",
    cubes: "Cube shelving", magrack: "Magazine rack", cabinet: "Cabinet",
  };

  const out = {};
  for (const key of Object.keys(F)) {
    out[key] = Kit.wrap(NAMES[key], () => {
      const k = Kit.rig({ f: 175, vp: [50, 36], gnd: 40 });
      F[key](k);
      return k.done();
    }, { w: 0.84, h: 0.8 }, 0.16);
  }
  out._keys = Object.keys(F);
  return out;
})();
