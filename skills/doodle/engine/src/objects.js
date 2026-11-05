/*
 * THE OBJECTS — clean geometry, no style.
 *
 * Everything is authored in a 0–100 box and scaled at render time, so an
 * object never knows the canvas size and the hand can be retuned globally
 * without touching any of this.
 *
 * Each object returns:
 *   marks   [{ pts, closed?, curve?, w? }]   lines, drawn in order
 *   regions [{ pts, curve? }]                flat accent, painted UNDER them
 *
 * `w` multiplies the global weight for that one mark, which is how a sole
 * gets to be heavier than a lace without a second set of dials.
 *
 * Proportion is taken from the real thing where it is knowable. A shoe in
 * side elevation is about 2.1 : 1 long to tall — measured off a photograph in
 * an earlier session, and the single thing that stops a shoe reading as a loaf.
 */
window.Objects = (function () {

  const LOCK = {
    label: "Padlock",
    build() {
      const body = [[26, 50], [74, 50], [78, 56], [78, 84], [74, 90], [26, 90], [22, 84], [22, 56]];
      return {
        regions: [{ pts: body, curve: true }],
        marks: [
          /* the shackle, drawn as one open U so it reads as bent metal */
          { pts: [[34, 54], [34, 36], [38, 26], [50, 22], [62, 26], [66, 36], [66, 54]],
            curve: true, w: 1.05 },
          { pts: body, closed: true, curve: true, w: 1.15 },
          /* keyhole: a round seat with a tapered slot under it */
          { pts: [[46, 64], [50, 62], [54, 64], [54, 68], [50, 70], [46, 68]],
            closed: true, curve: true, w: 0.8 },
          { pts: [[48, 69], [46, 79], [54, 79], [52, 69]], closed: true, w: 0.8 },
        ],
      };
    },
  };

  const BOTTLE = {
    label: "Water bottle",
    build() {
      const body = [[36, 36], [64, 36], [66, 44], [66, 84], [62, 90], [38, 90], [34, 84], [34, 44]];
      /* the fill stops partway up — a bottle reads as a bottle because it is
         visibly part full, not because of its outline */
      const water = [[35, 58], [65, 58], [65, 84], [61, 89], [39, 89], [35, 84]];
      return {
        regions: [{ pts: water, curve: true }],
        marks: [
          { pts: body, closed: true, curve: true, w: 1.1 },
          /* shoulder into the neck */
          { pts: [[42, 36], [44, 28], [56, 28], [58, 36]], curve: true, w: 0.9 },
          /* cap */
          { pts: [[42, 28], [42, 16], [58, 16], [58, 28]], closed: false, w: 1.0 },
          { pts: [[41, 16], [59, 16]], w: 1.0 },
          /* cap ribs */
          { pts: [[46, 18], [46, 26]], w: 0.55 },
          { pts: [[50, 18], [50, 26]], w: 0.55 },
          { pts: [[54, 18], [54, 26]], w: 0.55 },
          /* label band */
          { pts: [[34, 62], [66, 62]], w: 0.7 },
          { pts: [[34, 74], [66, 74]], w: 0.7 },
          /* the waterline itself, so the accent has an edge */
          { pts: [[35, 58], [65, 58]], w: 0.75 },
        ],
      };
    },
  };

  const SHOE = {
    label: "Shoe",
    build() {
      /*
       * Side elevation, toe to the right, about 1.9 : 1.
       *
       * The landmarks have to be IN the outline or the thing reads as a wedge:
       * a collar notch cut into the top-rear, with the tongue rising out of
       * it. Two earlier attempts failed opposite ways — one put a tongue spike
       * on an otherwise smooth top edge, which read as a horn; the other
       * removed it entirely and read as a doorstop. The fix is the order and
       * the hierarchy: heel tallest, dip, then a tongue LOWER than the heel.
       */
      const body = [
        [10, 84], [8, 68], [11, 50], [18, 48], [25, 58], [32, 52],
        [40, 60], [56, 64], [72, 67], [86, 74], [90, 82], [52, 86], [16, 86],
      ];
      /* Angular, not round: the reference's accent shapes are faceted
         polygons, and a 5-point closed curve smooths into an ellipse. */
      const panel = [[27, 69], [44, 71], [56, 73], [58, 79], [33, 79], [25, 75]];
      return {
        regions: [{ pts: panel, curve: false }],
        marks: [
          { pts: body, closed: true, curve: true, w: 1.15 },
          /* sole band — the line that makes it a sneaker and not a slipper */
          { pts: [[9, 76], [40, 79], [72, 78], [89, 75]], curve: true, w: 0.9 },
          /* toe cap */
          { pts: [[74, 68], [80, 76], [82, 83]], curve: true, w: 0.75 },
          /* Laces read as bars ACROSS the throat. Laid along it they are just
             dashes parallel to the top edge and say nothing. */
          { pts: [[27, 56], [31, 64]], w: 0.5 },
          { pts: [[32, 53], [36, 62]], w: 0.5 },
          { pts: [[37, 55], [41, 63]], w: 0.5 },
        ],
      };
    },
  };


  /*
   * THE ROOM — a scene rather than an object.
   *
   * Composed in a 0–100 by 0–125 box (the sheet is 4:5). Drawing order is the
   * composition: wash and rug first, then furniture, then the things on it,
   * so the line work of each layer sits over the flat colour of the one behind.
   *
   * What makes it read as THIS room: two pendants at very different sizes on
   * one cord line, a tall portrait frame off-centre, a long low sofa with four
   * cushions running warm-to-cool left to right, a round table on splayed legs,
   * and the window light arriving from the right.
   */
  const ROOM = {
    label: "Room",
    build(P) {
      const c = (k, d) => (P && P[k]) || d;
      const ring = (cx, cy, rx, ry, n) => {
        const o = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
        }
        return o;
      };
      const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

      const marks = [], regions = [];
      const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
      const R = (pts, fill, s, curve) => regions.push({ pts, fill, s: s || 0, curve: curve !== false });

      /* ── light and floor ─────────────────────────────────────────── */
      R(ring(52, 112, 46, 9, 22), "cWash", 3);                 // rug
      /* A shaft, not a panel. A rectangle of pale colour beside the window
         read as a second wall; light has to arrive at an angle to read as
         light at all. It is drawn first, so everything sits in it. */
      R([[58, 4], [82, 4], [48, 108], [20, 108]], "cWash", 5, false);
      M([[2, 108], [99, 108]], 0.55);                          // floor line

      /* ── window, right ───────────────────────────────────────────── */
      M(box(82, 6, 99, 78), 0.8, { closed: true, curve: false });
      M([[90.5, 7], [90.5, 77]], 0.45);
      M([[83, 38], [98, 38]], 0.45);
      M([[79, 78], [100, 78]], 0.7);

      /* ── pendants: one big, one small, each on its own drop ──────── */
      R(ring(15, 17, 11.5, 11, 20), "cWash", 7);
      M(ring(15, 17, 11.5, 11, 20), 1.1, { closed: true });
      M([[15, 6], [15, 6.5]], 0.4);
      M([[17, 28], [18, 43]], 0.45);
      R(ring(18, 49, 6, 5.5, 16), "cOrange", 9);
      M(ring(18, 49, 6, 5.5, 16), 1.0, { closed: true });

      /* ── framed art ──────────────────────────────────────────────── */
      M(box(41, 20, 67, 56), 1.0, { closed: true, curve: false });
      M(box(44, 23, 64, 53), 0.5, { closed: true, curve: false });
      R(ring(53, 32, 4.5, 4.5, 14), "cAmber", 11);
      R(ring(58, 37, 3, 3, 12), "cOrange", 13);
      R(ring(49, 39, 5.5, 5.5, 14), "cBlue", 15);
      R([[47, 44], [53, 44], [53, 51], [47, 51]], "cAmber", 17, false);
      R([[55, 46], [61, 46], [61, 51], [55, 51]], "cOlive", 19, false);
      M(ring(53, 32, 4.5, 4.5, 14), 0.45, { closed: true });
      M(ring(49, 39, 5.5, 5.5, 14), 0.45, { closed: true });

      /* ── sofa: a mass with arms, not an outline ──────────────────── */
      /* The back has to sit ABOVE the cushions. Drawn with its top edge at
         cushion height, the line ran straight through all four of them. */
      R([[20, 62], [86, 60], [91, 67], [91, 88], [15, 88], [15, 67]], "cSofa", 41, true);
      R([[11, 85], [93, 85], [95, 92], [91, 98], [13, 98], [9, 92]], "cSofa", 43, true);
      M([[20, 62], [86, 60], [91, 67], [91, 88]], 1.0, { curve: true });
      M([[11, 90], [10.5, 76], [11.5, 68], [15, 63], [21, 62]], 1.0, { curve: true });   // arm
      M([[9, 92], [13, 98], [91, 98], [95, 92], [93, 86]], 1.0, { curve: true });
      M([[15, 86], [91, 86]], 0.6);                             // seat line
      [19, 46, 73, 89].forEach((x) => M([[x, 98], [x + 1.5, 106]], 0.55));

      /* ── cushions, warm to cool, standing on the seat ────────────── */
      /* Authored AFTER the sofa on purpose: regions paint in authoring order,
         and written first they were buried under the sofa's own cream fill. */
      const CUSH = [[33, "cOrange", 21], [45, "cAmber", 23], [57, "cBlue", 25], [68, "cOlive", 27]];
      CUSH.forEach(([x, fill, sd]) => {
        const p = [[x, 68], [x + 11, 67], [x + 12, 84], [x + 1, 85]];
        R(p, fill, sd, true);
        M(p, 0.55, { closed: true, curve: true });
      });

      /* ── coffee table ────────────────────────────────────────────── */
      R(ring(34, 109, 26, 5, 20), "cWood", 29);
      M(ring(34, 109, 26, 5, 20), 0.9, { closed: true });
      M([[13, 111], [9, 124]], 0.6);
      M([[55, 111], [59, 124]], 0.6);
      M([[40, 113], [41, 125]], 0.6);

      /* ── vase and stems, standing on the table, left of centre ───── */
      /* Fewer, wider-spread stems. Five narrow ones leaving a narrow mouth
         read as a wheat sheaf however they were curved — the fix is spacing
         and count, not more curvature. */
      const vase = [[22, 109], [20, 104], [20.5, 98], [23, 95], [26.5, 95], [29, 98], [29.5, 104], [27.5, 109]];
      R(vase, "cWash", 45, true);
      M(vase, 0.8, { curve: true, closed: true });
      M([[22, 96], [28, 96]], 0.4);                             // the mouth

      /* The blooms belong IN FRONT of the sofa back, not out past the arm:
         pushed left they left the furniture entirely and the corner went
         lopsided. In the reference the stems overlap the sofa and read airy. */
      const STEM = [[15, 71], [24, 62], [32, 69]];
      STEM.forEach(([x1, y1], i) => {
        const ex = 23.5 + i * 1.6;
        M([[ex, 95], [(ex + x1) / 2 + (i - 1) * 4.5, (95 + y1) / 2 - 3], [x1, y1]], 0.6, { curve: true });
        R(ring(x1, y1, 3.3, 3.3, 11), "cOrange", 31 + i * 2);
        M(ring(x1, y1, 3.3, 3.3, 11), 0.42, { closed: true });
      });

      return { marks, regions };
    },
  };

  /* a scene fills the sheet and wants a much finer pen than a single object */
  ROOM.fit = { w: 0.88, h: 0.70 };
  ROOM.pen = 0.38;


  /*
   * THE SHOPFRONT — the pen family, not the marker one.
   *
   * Measured across five pen references, the line is 0.13%–0.44% of the image
   * width against the marker's 1.80%: four to fourteen times finer. And the
   * variation sits somewhere else entirely. A marker varies WITHIN a stroke,
   * continuously, as pressure. A pen holds one width along a run and varies
   * BETWEEN runs — two or three discrete weights that sort outline from
   * detail from texture. That hierarchy is most of what reads as "pen".
   *
   * Tone is the other half. These references carry grey as hatching, halftone
   * and solid black rather than as colour, so this exercises all of it.
   */
  const SHOP = {
    label: "Shopfront",
    build() {
      const marks = [], regions = [], tones = [];
      const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
      const T = (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) });
      const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

      /* ── the three weights, declared once ─────────────────────────── */
      const OUT = 1.6, DET = 0.85, TEX = 0.5;

      /* ── upper storey: brick as HALFTONE, the r3 move ─────────────── */
      T(box(10, 8, 90, 44), "halftone", TEX, { s: 3, gap: 1.5 });
      M(box(10, 8, 90, 44), OUT, { closed: true, curve: false });
      /* a few courses only — r4 draws some bricks and implies the rest */
      [16, 26, 36].forEach((y, i) => {
        for (let x = 14 + (i % 2) * 7; x < 86; x += 14) M([[x, y], [x + 7, y]], TEX);
      });

      /* ── upper windows, panes in SOLID black ──────────────────────── */
      [[22, 14], [46, 14], [70, 14]].forEach(([x, y], i) => {
        T(box(x, y, x + 14, y + 20), "solid", DET, { s: 5 + i });
        M(box(x, y, x + 14, y + 20), DET, { closed: true, curve: false });
        M([[x + 7, y], [x + 7, y + 20]], TEX);
        M([[x, y + 10], [x + 14, y + 10]], TEX);
        M(box(x - 1.5, y + 20, x + 15.5, y + 23), DET, { closed: true, curve: false });
      });

      /* ── awning: solid, with the name reversed out of it ──────────── */
      T([[8, 46], [92, 46], [88, 60], [12, 60]], "solid", DET, { s: 11 });
      M([[8, 46], [92, 46], [88, 60], [12, 60]], OUT, { closed: true, curve: false });

      /* ── shopfront glazing ────────────────────────────────────────── */
      M(box(12, 60, 88, 96), OUT, { closed: true, curve: false });
      /* cast shadow inside the glass, HATCHED */
      T([[16, 64], [52, 64], [52, 92], [16, 92]], "hatch", TEX, { s: 13, angle: 52, gap: 1.3 });
      [34, 56, 74].forEach((x) => M([[x, 60], [x, 96]], DET));
      M([[12, 78], [88, 78]], DET);
      /* the doorway, solid */
      T(box(58, 64, 74, 96), "solid", DET, { s: 15 });
      M(box(58, 64, 74, 96), DET, { closed: true, curve: false });

      /* ── stall riser, halftone at a tighter pitch ─────────────────── */
      T(box(12, 96, 88, 103), "halftone", TEX, { s: 17, gap: 0.9 });
      M(box(12, 96, 88, 103), DET, { closed: true, curve: false });

      /* ── pavement: ruled, and a kerb ──────────────────────────────── */
      M([[2, 103], [98, 103]], OUT);
      M([[2, 112], [98, 112]], DET);
      for (let x = 6; x < 98; x += 12) M([[x, 103], [x - 3, 112]], TEX);

      /* ── the tree: SCRIBBLE, the one organic texture ──────────────── */
      T([[70, 6], [92, 2], [99, 16], [92, 30], [74, 26], [68, 16]], "scribble", TEX,
        { s: 19, curve: true, gap: 1 });
      M([[84, 28], [86, 60], [84, 96]], DET, { curve: true });

      /* ── a planter, STIPPLE, and an A-board ───────────────────────── */
      T([[4, 84], [16, 84], [15, 96], [5, 96]], "stipple", TEX, { s: 21, gap: 0.8 });
      M([[4, 84], [16, 84], [15, 96], [5, 96]], DET, { closed: true, curve: false });
      M([[24, 96], [28, 82], [34, 96]], DET, { curve: false });
      M([[26, 90], [32, 90]], TEX);

      return { marks, regions, tones };
    },
  };
  /* A pen holds a fine line, and the sheet is dense with it. Measured across
     the five references: 0.13%–0.44% of image width, against the marker's
     1.80%. */
  SHOP.fit = { w: 0.80, h: 0.66 };
  SHOP.pen = 0.15;
  SHOP.nib = {
    pressure: 0.10,     // one width along a run — the hierarchy is between runs
    wander: 0.10,       // the arm barely moves
    boil: 0.4,          // the fingers do
    overshoot: 0.3,
    double: false,      // a marker tell, not a pen one
    breaks: 0.04,
    blobs: 0,
    specks: 2,
    toneDot: 0.17,
  };


  /*
   * THE READING CORNER.
   *
   * Four floating shelves of books, a bouclé shell chair on splayed wooden
   * legs, a window with a radiator, a patterned round rug.
   *
   * The books are the subject. They are drawn the way the pen references draw
   * repetition — every spine, at varying widths and heights and leans, because
   * the density IS the content. Draw half of them and it reads as a mistake.
   */
  const CORNER = {
    label: "Reading corner",
    build() {
      const marks = [], regions = [], tones = [];
      const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
      const T = (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) });
      const R = (pts, fill, sd, curve) => regions.push({ pts, fill, s: sd || 0, curve: curve !== false });
      const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const ring = (cx, cy, rx, ry, n) => {
        const o = [];
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2;
          o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
        return o;
      };
      const OUT = 1.5, DET = 0.9, TEX = 0.55;
      /* one deterministic wobble source, so a rebuild is the same drawing */
      let q = 7; const rnd = () => (q = (q * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

      /* ── wall return and skirting, left ───────────────────────────── */
      M([[7, 2], [7, 108]], DET);
      M([[11, 2], [11, 104]], TEX);
      M([[7, 108], [86, 108]], OUT);

      /* ── window, right, with its radiator ────────────────────────── */
      M(box(74, 4, 95, 74), DET, { closed: true, curve: false });
      M([[74, 40], [95, 40]], DET);
      M([[84.5, 4], [84.5, 74]], TEX);
      M(box(76, 76, 95, 96), DET, { closed: true, curve: false });
      for (let x = 78; x < 94; x += 2.6) M([[x, 77], [x, 95]], TEX);      // radiator fins
      /* a turned vase on the sill */
      M([[80, 74], [78.5, 66], [80, 60], [83, 59], [85.5, 62], [85, 70], [83.5, 74]],
        DET, { curve: true, closed: true });
      T([[80, 73], [79, 66], [80.5, 61], [84.5, 62], [84.5, 70], [83.5, 73]],
        "hatch", TEX, { s: 61, angle: 90, gap: 0.45, curve: true });

      /* ── four shelves of books ───────────────────────────────────── */
      const SHELF = [10, 26, 42, 58];
      SHELF.forEach((sy, si) => {
        M([[14, sy + 15], [70, sy + 15]], OUT);                 // the shelf board
        M([[14, sy + 15], [14, sy + 17]], TEX);
        M([[70, sy + 15], [70, sy + 17]], TEX);
        let x = 16;
        while (x < 68) {
          const w = 1.4 + rnd() * 2.4;
          if (x + w > 68) break;
          const h = 9 + rnd() * 5;
          const lean = rnd() < 0.12 ? (rnd() - 0.5) * 3 : 0;
          const top = sy + 15 - h;
          const spine = [[x, sy + 15], [x + lean, top], [x + w + lean, top], [x + w, sy + 15]];
          M(spine, DET, { curve: false });
          /* a dark spine every so often — the run needs value, not just edges */
          const r = rnd();
          if (r < 0.17) T(spine, "solid", TEX, { s: si * 40 + x });
          else if (r < 0.42) T(spine, "halftone", TEX, { s: si * 40 + x, gap: 0.42 });
          else if (r < 0.56) {
            M([[x + 0.4, top + 2.4], [x + w - 0.4, top + 2.4]], TEX);
            M([[x + 0.4, top + 3.6], [x + w - 0.4, top + 3.6]], TEX);
          }
          x += w + 0.5;
        }
      });
      /* the framed print propped on the third shelf, and a stack beside it */
      M(box(30, 46, 46, 57), DET, { closed: true, curve: false });
      M(box(33, 48.5, 43, 54.5), TEX, { closed: true, curve: false });
      [0, 1.6, 3.2, 4.8].forEach((dy, i) => M([[50, 57 - dy], [64, 57 - dy]], TEX));

      /* ── the chair: a back shell with a seat scooped in front ───── */
      /* One closed blob with an inner line is an egg. The form only reads if
         the seat is a SEPARATE shape drawn over the back, so its outline cuts
         across — that overlap is the whole chair. */
      const back = [[20, 97], [17, 85], [21, 75], [31, 70], [42, 73], [47, 82], [46, 93], [36, 97]];
      R(back, "cSofa", 71, true);
      M(back, OUT, { closed: true, curve: true });
      const seat = [[18, 96], [26, 89], [39, 88], [51, 91], [52, 97], [45, 102], [29, 103], [19, 101]];
      R(seat, "cSofa", 72, true);
      M(seat, OUT, { closed: true, curve: true });
      /* two soft contours instead of stipple — scattered dots on a white
         bouclé chair read as dirt, not as texture */
      M([[24, 92], [31, 87], [41, 87], [48, 91]], TEX, { curve: true });
      M([[22, 83], [27, 78], [35, 76]], TEX, { curve: true });
      /* Legs stop ON the floor, above the rug. Run past it they read as
         strings dangling through it. */
      [[24, 102, 20, 111], [34, 103, 34, 112], [47, 101, 51, 110]]
        .forEach(([x0, y0, x1, y1]) => M([[x0, y0], [x1, y1]], DET * 1.3));

      /* ── floorboards and the patterned rug ───────────────────────── */
      /* Boards stop short of the rug: marks paint after regions, so a board
         run through the rug's x-range draws straight over its colour. */
      for (let x = 10; x < 86; x += 9) M([[x, 108], [x - 1, 113]], TEX);
      M([[88, 108], [84, 124]], TEX);
      M([[14, 112], [10, 124]], TEX);
      /* Concentric RINGS. Filled discs stacked smallest-last left a solid
         black hole in the middle of the rug. */
      R(ring(48, 117, 34, 9, 24), "cOrange", 75);
      M(ring(48, 117, 34, 9, 24), DET, { closed: true, curve: true });
      M(ring(48, 117, 26, 6.9, 22), OUT, { closed: true, curve: true });
      M(ring(48, 117, 18, 4.8, 20), DET, { closed: true, curve: true });
      M(ring(48, 117, 10, 2.7, 18), OUT, { closed: true, curve: true });
      M(ring(48, 117, 4, 1.1, 14), DET, { closed: true, curve: true });

      return { marks, regions, tones };
    },
  };
  CORNER.fit = { w: 0.86, h: 0.74 };
  CORNER.pen = 0.14;
  CORNER.nib = {
    pressure: 0.09, wander: 0.07, boil: 0.14,   /* 0.4 read as a shaky hand */
    overshoot: 0.25, double: false, breaks: 0.03, blobs: 0,
    specks: 0, toneDot: 0.24,
  };


  /*
   * THE NOOK — green armchair, arc lamp, shelf, side table, palm.
   *
   * Colour is restored, not copied. Measured off the photograph the chair's
   * "green" is hue 82 at 13% saturation — a grey-olive, because the sun has
   * bleached it; the plant reads hue 53, which is yellow. Those samples
   * describe the LIGHT in that room, and a flat fill has none, so the numbers
   * are used for their relationships and each object gets its own colour back.
   *
   * The arc lamp is the drawing's one long continuous line and the chair is
   * its one big mass: between them they carry the whole composition, and
   * everything else is support.
   */
  const NOOK = {
    label: "Nook",
    build() {
      const marks = [], regions = [], tones = [];
      const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
      const T = (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) });
      const R = (pts, fill, sd, curve) => regions.push({ pts, fill, s: sd || 0, curve: curve !== false });
      const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const ring = (cx, cy, rx, ry, n) => {
        const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2;
          o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o;
      };
      const OUT = 1.45, DET = 0.85, TEX = 0.5;
      let q = 11; const rnd = () => (q = (q * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

      /* ── light, floor, the wall return ───────────────────────────── */
      R([[64, 2], [92, 2], [74, 112], [46, 112]], "cWash", 3, false);
      M([[12, 2], [12, 110]], TEX);                       // corner of the two walls
      M([[2, 110], [98, 110]], DET);                      // floor line
      for (let x = 6; x < 98; x += 10) M([[x, 110], [x - 4, 125]], TEX);
      M([[2, 118], [98, 116]], TEX);

      /* ── window, far left: slats only, it is barely in frame ─────── */
      M(box(0, 4, 8, 96), DET, { closed: true, curve: false });
      [22, 44, 66].forEach((y) => M([[0, y], [8, y]], DET));

      /* ── shelf, with books and a dark vase ───────────────────────── */
      M([[18, 34], [60, 34]], OUT);
      M([[18, 34], [18, 36.5]], TEX); M([[60, 34], [60, 36.5]], TEX);
      M([[19, 36.5], [59, 36.5]], TEX);
      let bx = 28;
      while (bx < 58) {
        const w = 1.3 + rnd() * 2.2, h = 8 + rnd() * 6;
        if (bx + w > 58) break;
        const sp = [[bx, 34], [bx, 34 - h], [bx + w, 34 - h], [bx + w, 34]];
        M(sp, DET, { curve: false });
        const r = rnd();
        if (r < 0.22) T(sp, "solid", TEX, { s: 100 + bx });
        else if (r < 0.5) T(sp, "halftone", TEX, { s: 100 + bx, gap: 0.4 });
        bx += w + 0.4;
      }
      const vase = [[20, 34], [18.5, 28], [20, 23], [23, 22], [25.5, 25], [25, 31], [24, 34]];
      R(vase, "cWood", 7, true);
      M(vase, DET, { curve: true, closed: true });

      /* ── framed print ────────────────────────────────────────────── */
      M(box(40, 44, 68, 70), OUT, { closed: true, curve: false });
      M(box(42.5, 46.5, 65.5, 67.5), TEX, { closed: true, curve: false });
      M([[44, 60], [51, 54], [57, 58], [63, 51]], TEX, { curve: true });

      /* ── the arc lamp: the one long continuous line in the drawing ── */
      M([[19, 112], [19, 88], [19.5, 60], [22, 50], [27, 46], [35, 46], [35, 50]], OUT, { curve: true });
      M([[16, 112], [22, 112]], OUT);
      /* A dome with a rim. A filled trapezoid read as a hole punched in the
         picture behind it. */
      const shade = [[26, 54], [29, 48], [35, 46], [41, 48], [44, 54], [41, 57], [29, 57]];
      M(shade, DET, { closed: true, curve: true });
      T(shade, "hatch", TEX, { s: 9, angle: 78, gap: 0.5, curve: true });
      M([[27, 58], [43, 58]], DET);
      /* the light it throws */
      R([[28, 59], [42, 59], [47, 74], [23, 74]], "cWash", 10, false);

      /* ── the chair: back, seat, wooden arms, splayed legs ────────── */
      const back = [[29, 68], [59, 66], [62, 75], [61, 93], [30, 95], [26, 77]];
      R(back, "cGreenD", 11, true);
      M(back, OUT, { closed: true, curve: true });
      M([[31, 74], [58, 72]], TEX);                       // the back's seam

      const seat = [[21, 97], [71, 94], [77, 102], [72, 114], [28, 116], [19, 106]];
      R(seat, "cGreen", 13, true);
      M(seat, OUT, { closed: true, curve: true });
      M([[24, 102], [72, 100]], TEX);

      /* Wooden arm rails — the one warm note against all that green.
         Four points with curve:true smooth into ovals, which is what made
         them read as two orange eggs lying on the chair. A rail is a flat
         bar: more points, no smoothing. */
      /* Four points, flat. Eight points with a kink in them made two planks
         that shot out past the chair on both sides. */
      [[[23, 95], [47, 89], [48, 93], [24, 99]],
       [[56, 89], [77, 92], [76, 96], [55, 93]]].forEach((p, i) => {
        R(p, "cWood", 15 + i * 2, false);
        M(p, DET, { closed: true, curve: false });
      });

      /* a throw over the right arm */
      R([[61, 88], [73, 90], [71, 102], [64, 101]], "cSofa", 19, true);
      M([[61, 88], [73, 90], [71, 102], [64, 101]], DET, { closed: true, curve: true });
      M([[64, 93], [70, 94]], TEX);

      /* Legs carry the chair's weight, so they are drawn like it — at detail
         weight they were thinner than the floorboards behind them. */
      [[29, 115, 26, 125], [45, 117, 44, 126], [67, 114, 71, 124], [75, 108, 80, 117]]
        .forEach(([x0, y0, x1, y1]) => M([[x0, y0], [x1, y1]], OUT * 0.8));

      /* ── side table and its plant ────────────────────────────────── */
      R(ring(10, 92, 11, 3, 18), "cWood", 21);
      M(ring(10, 92, 11, 3, 18), DET, { closed: true, curve: true });
      [[3, 94, 1, 112], [10, 95, 10, 114], [18, 94, 20, 111]]
        .forEach(([x0, y0, x1, y1]) => M([[x0, y0], [x1, y1]], TEX));
      const pot = [[6, 90], [6.5, 83], [14, 83], [14.5, 90]];
      R(pot, "cWash", 23, false);
      M(pot, DET, { closed: true, curve: false });
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.44;
        const L = 11 + (i % 2) * 3, cx = 10.2, cy = 84;
        const tipx = cx + Math.cos(a) * L, tipy = cy + Math.sin(a) * L;
        const nx = -Math.sin(a) * 2.1, ny = Math.cos(a) * 2.1;
        const leaf = [[cx, cy], [cx + nx + Math.cos(a) * L * 0.45, cy + ny + Math.sin(a) * L * 0.45],
                      [tipx, tipy],
                      [cx - nx + Math.cos(a) * L * 0.45, cy - ny + Math.sin(a) * L * 0.45]];
        R(leaf, "cLeaf", 25 + i * 2, true);
        M(leaf, TEX, { closed: true, curve: true });
      }

      /* ── palm, right: fronds only, it is a silhouette not a plant ── */
      [[92, 48, 74, 62], [95, 62, 76, 72], [96, 78, 78, 84], [93, 94, 80, 96]]
        .forEach(([x0, y0, x1, y1], i) => {
          M([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 3], [x1, y1]], DET, { curve: true });
          for (let k = 1; k <= 13; k++) {
            const t = k / 14;
            const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t - 3 * Math.sin(Math.PI * t);
            const sc = 1 - Math.abs(t - 0.45);
            M([[px, py], [px + 3.4 * sc, py - 4 * sc]], TEX);
            M([[px, py], [px + 2.8 * sc, py + 3.6 * sc]], TEX);
          }
        });

      return { marks, regions, tones };
    },
  };
  NOOK.fit = { w: 0.86, h: 0.76 };
  NOOK.pen = 0.15;
  NOOK.nib = {
    pressure: 0.1, wander: 0.08, boil: 0.14,
    overshoot: 0.28, double: false, breaks: 0.03, blobs: 0,
    specks: 0, toneDot: 0.24,
  };


  /*
   * THE ROOM, IN PERSPECTIVE.
   *
   * The same subject as the flat `room`, built through a camera instead of
   * drawn as an elevation — so the floor recedes, the side walls converge and
   * the far end of the sofa is genuinely smaller than the near end, rather
   * than being overlapped and hoped for.
   *
   * Room box, in author units: x ±46, floor y +40, ceiling y −42, back wall
   * at z 110. With f = 100 the back wall lands at about half scale, which is
   * a normal lens — enough convergence to read, not so much that it fish-eyes.
   */
  const PERSP = {
    label: "Perspective",
    build() {
      const V = View.one({ f: 100, vp: [50, 60] });
      const marks = [], regions = [], tones = [];
      const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
      const T = (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) });
      const R = (pts, fill, sd, curve) => regions.push({ pts, fill, s: sd || 0, curve: curve !== false });
      const OUT = 1.4, DET = 0.8, TEX = 0.48;

      const XW = 46, FL = 40, CE = -42, ZB = 110;

      /* ── the shell: back wall, and the four lines that run to the VP ── */
      const backWall = V.quad([-XW, CE, ZB], [XW, CE, ZB], [XW, FL, ZB], [-XW, FL, ZB]);
      M(backWall, OUT, { closed: true, curve: false });
      [[-XW, CE], [XW, CE], [XW, FL], [-XW, FL]].forEach(([x, y]) =>
        M(V.seg([x, y, 0], [x, y, ZB]), DET));

      /* ── floor: boards running INTO the picture ─────────────────── */
      View.boards(V, -XW, XW, FL, 2, ZB, 11.5).forEach((p) => M(p, TEX));
      View.joints(V, -XW, XW, FL, 2, ZB, 2).forEach((p) => M(p, TEX * 0.7));

      /* ── a shaft of light lying ON the floor, so it is a trapezoid ── */
      R(V.quad([6, FL, 8], [40, FL, 8], [46, FL, 96], [16, FL, 96]), "cWash", 3, false);

      /* ── rug: a rectangle on the floor plane, hence a trapezoid ───── */
      const rug = V.quad([-30, FL, 16], [18, FL, 16], [24, FL, 60], [-34, FL, 60]);
      R(rug, "cOrange", 5, false);
      M(rug, DET, { closed: true, curve: false });
      M(V.quad([-24, FL, 24], [12, FL, 24], [16, FL, 52], [-28, FL, 52]), TEX,
        { closed: true, curve: false });

      /* ── sofa: real boxes, each face carrying its own value ─────── */
      const sofaFace = (f, i, base, w) => {
        R(f.pts, base, i, false);
        regions[regions.length - 1].shade = f.shade;
        M(f.pts, w, { closed: true, curve: false });
      };
      /* Seat slab, back, and two arms — four boxes, not one. A single box
         from seat height to the floor is a plinth; the gaps between the parts
         are what say "sofa". */
      const Z0 = 62, Z1 = 92, X0 = -36, X1 = 18, SEAT = 14;
      View.box(V, X0, SEAT, Z0, X1, SEAT + 9, Z1).forEach((f, i) => sofaFace(f, 11 + i, "cSofa", OUT));
      View.box(V, X0, -16, Z1 - 7, X1, SEAT + 2, Z1).forEach((f, i) => sofaFace(f, 21 + i, "cSofa", OUT));
      [[X0, X0 + 7], [X1 - 7, X1]].forEach(([ax0, ax1], k) =>
        View.box(V, ax0, 2, Z0, ax1, SEAT + 7, Z1).forEach((f, i) =>
          sofaFace(f, 41 + k * 6 + i, "cSofa", OUT)));
      /* feet */
      [[X0 + 2, Z0 + 2], [X1 - 2, Z0 + 2]].forEach(([x, z]) =>
        M(V.seg([x, SEAT + 9, z], [x, FL, z]), DET * 1.4));

      /* cushions stand ON the seat and IN FRONT of the back */
      [["cOrange", -33], ["cAmber", -21], ["cBlue", -9], ["cOlive", 3]].forEach(([fill, x], i) => {
        View.box(V, x, -2, Z1 - 16, x + 11, SEAT, Z1 - 8).forEach((f, k) =>
          sofaFace(f, 61 + i * 4 + k, fill, DET));
      });

      /* ── coffee table: a top at height, on four legs ─────────────── */
      const TY = 22;
      View.box(V, -24, TY, 22, 8, TY + 3, 46).forEach((f, i) => sofaFace(f, 51 + i, "cWood", DET));
      [[-22, 25], [6, 25], [-22, 43], [6, 43]].forEach(([x, z]) =>
        M(V.seg([x, TY + 3, z], [x, FL, z]), OUT * 0.9));

      /* ── framed art, flat ON the back wall ───────────────────────── */
      M(V.quad([-6, -30, ZB], [22, -30, ZB], [22, -4, ZB], [-6, -4, ZB]), OUT,
        { closed: true, curve: false });
      M(V.quad([-3, -27, ZB], [19, -27, ZB], [19, -7, ZB], [-3, -7, ZB]), TEX,
        { closed: true, curve: false });
      R(V.quad([0, -22, ZB], [9, -22, ZB], [9, -11, ZB], [0, -11, ZB]), "cAmber", 61, false);
      R(V.quad([10, -19, ZB], [17, -19, ZB], [17, -10, ZB], [10, -10, ZB]), "cBlue", 63, false);

      /* ── window on the RIGHT WALL, so it is a parallelogram ──────── */
      M(V.quad([XW, -32, 30], [XW, -32, 86], [XW, 14, 86], [XW, 14, 30]), DET,
        { closed: true, curve: false });
      M(V.seg([XW, -32, 58], [XW, 14, 58]), TEX);
      M(V.seg([XW, -9, 30], [XW, -9, 86]), TEX);

      /* ── pendant hanging in the middle of the room ───────────────── */
      M(V.seg([-14, CE, 40], [-14, -22, 40]), DET);
      const s60 = V.s(40), c = V.p(-14, -15, 40);
      const lamp = [];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        lamp.push([c[0] + Math.cos(a) * 9 * s60, c[1] + Math.sin(a) * 8 * s60]);
      }
      R(lamp, "cWash", 71);
      M(lamp, OUT, { closed: true, curve: true });

      return { marks, regions, tones };
    },
  };
  PERSP.fit = { w: 0.94, h: 0.86 };
  PERSP.pen = 0.16;
  PERSP.nib = {
    pressure: 0.1, wander: 0.07, boil: 0.13,
    overshoot: 0.2, double: false, breaks: 0.03, blobs: 0, specks: 0, toneDot: 0.24,
  };


  /*
   * THE NOOK, IN PERSPECTIVE — the same subject as the flat `nook`, rebuilt
   * through the camera.
   *
   * The things that could only be faked before and are now real: the floor
   * recedes, the side wall converges, the chair sits at an angle to the
   * camera rather than square to it, the side table is a disc seen obliquely
   * instead of a drawn ellipse, and the near palm is large because it is near.
   */
  const NOOK3 = {
    label: "Nook 3D",
    build() {
      const V = View.one({ f: 105, vp: [50, 57] });
      const marks = [], regions = [], tones = [];
      const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
      const T = (pts, kind, w, opt) => tones.push({ pts, kind, w, ...(opt || {}) });
      const R = (pts, fill, sd, sh) => {
        regions.push({ pts, fill, s: sd || 0, curve: false });
        if (sh != null) regions[regions.length - 1].shade = sh;
      };
      const solid = (faces, fill, sd, w) => {
        faces.forEach((f, i) => R(f.pts, fill, sd + i, f.shade));
        /* one outline round the solid, not one per facet */
        if (faces.silhouette) M(faces.silhouette, w, { closed: true, curve: false });
        const top = faces[faces.length - 1];
        if (top && top.shade === 1) M(top.pts, w * 0.75, { closed: true, curve: false });
      };
      const OUT = 1.35, DET = 0.8, TEX = 0.46;
      let q = 11; const rnd = () => (q = (q * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

      const XW = 44, FL = 34, CE = -40, ZB = 104;

      /* ── the shell ───────────────────────────────────────────────── */
      M(V.quad([-XW, CE, ZB], [XW, CE, ZB], [XW, FL, ZB], [-XW, FL, ZB]), OUT,
        { closed: true, curve: false });
      [[-XW, CE], [XW, CE], [XW, FL], [-XW, FL]].forEach(([x, y]) =>
        M(V.seg([x, y, 0], [x, y, ZB]), DET));
      View.boards(V, -XW, XW, FL, 2, ZB, 11).forEach((p) => M(p, TEX));
      View.joints(V, -XW, XW, FL, 2, ZB, 2).forEach((p) => M(p, TEX * 0.7));

      /* sun across the floor and up the right wall */
      R(V.quad([2, FL, 10], [36, FL, 10], [XW, FL, 88], [14, FL, 88]), "cWash", 3);
      R(V.quad([XW, -30, 40], [XW, -30, 96], [XW, FL, 96], [XW, FL, 40]), "cWash", 4);

      /* ── window, cut into the RIGHT wall ─────────────────────────── */
      M(V.quad([XW, -30, 34], [XW, -30, 78], [XW, 6, 78], [XW, 6, 34]), DET,
        { closed: true, curve: false });
      M(V.seg([XW, -30, 56], [XW, 6, 56]), TEX);
      M(V.seg([XW, -12, 34], [XW, -12, 78]), TEX);

      /* ── shelf on the back wall, with books ──────────────────────── */
      const SY = -14;
      solid(View.prism(V, View.rect(-30, ZB - 9, 4, ZB), SY, SY + 2), "cWood", 11, DET);
      let bx = -27;
      while (bx < 2) {
        const w = 1.1 + rnd() * 1.9, h = 7 + rnd() * 5;
        if (bx + w > 2) break;
        const sp = V.quad([bx, SY, ZB - 2], [bx + w, SY, ZB - 2],
                          [bx + w, SY - h, ZB - 2], [bx, SY - h, ZB - 2]);
        M(sp, DET, { closed: true, curve: false });
        const r = rnd();
        if (r < 0.22) T(sp, "solid", TEX, { s: 200 + bx });
        else if (r < 0.5) T(sp, "halftone", TEX, { s: 200 + bx, gap: 0.4 });
        bx += w + 0.35;
      }

      /* ── framed print, flat on the back wall ─────────────────────── */
      M(V.quad([8, -28, ZB], [32, -28, ZB], [32, -6, ZB], [8, -6, ZB]), OUT,
        { closed: true, curve: false });
      M(V.quad([10.5, -25.5, ZB], [29.5, -25.5, ZB], [29.5, -8.5, ZB], [10.5, -8.5, ZB]),
        TEX, { closed: true, curve: false });
      M([V.p(12, -13, ZB), V.p(17, -18, ZB), V.p(22, -14, ZB), V.p(28, -20, ZB)],
        TEX, { curve: true });

      /* ── the green chair, TURNED so it is not square to the camera ─ */
      const CX = -8, CZ = 56, TURN = -30;
      const seatFoot = View.turn(View.soft(CX - 14, CZ - 13, CX + 14, CZ + 13, 5), TURN, CX, CZ);
      solid(View.prism(V, seatFoot, 14, 24), "cGreen", 21, OUT);
      const backFoot = View.turn(View.soft(CX - 14, CZ + 8, CX + 14, CZ + 13, 2.4), TURN, CX, CZ);
      solid(View.prism(V, backFoot, -16, 16), "cGreenD", 41, OUT);
      [[-14, -10], [10, 14]].forEach(([a, b], k) => {
        const armFoot = View.turn(View.soft(CX + a, CZ - 13, CX + b, CZ + 13, 1.8), TURN, CX, CZ);
        solid(View.prism(V, armFoot, 2, 14), "cWood", 61 + k * 8, DET);
      });
      /* legs, splayed from the seat's own corners */
      [[-11, -10], [11, -10], [11, 10], [-11, 10]].forEach(([dx, dz], i) => {
        const [x, z] = View.turn([[CX + dx, CZ + dz]], TURN, CX, CZ)[0];
        M(V.seg([x, 24, z], [x + (dx < 0 ? -3 : 3), FL, z + (dz < 0 ? -3 : 3)]), OUT * 0.85);
      });

      /* ── side table: a DISC seen obliquely, not a drawn ellipse ──── */
      const TX = -32, TZ = 44;
      solid(View.prism(V, View.disc(TX, TZ, 9, 20), 8, 11), "cWood", 81, DET);
      View.disc(TX, TZ, 7.5, 4).forEach(([x, z]) => M(V.seg([x, 11, z], [x, FL, z]), TEX));
      /* a pot and a succulent standing on it */
      solid(View.prism(V, View.disc(TX, TZ, 4.5, 12), -1, 8), "cWash", 91, DET);
      const top = V.p(TX, -1, TZ), sc = V.s(TZ);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.44, L = (11 + (i % 2) * 3) * sc;
        const nx = -Math.sin(a) * 2.1 * sc, ny = Math.cos(a) * 2.1 * sc;
        const leaf = [[top[0], top[1]],
          [top[0] + nx + Math.cos(a) * L * 0.45, top[1] + ny + Math.sin(a) * L * 0.45],
          [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L],
          [top[0] - nx + Math.cos(a) * L * 0.45, top[1] - ny + Math.sin(a) * L * 0.45]];
        R(leaf, "cLeaf", 101 + i * 2);
        regions[regions.length - 1].curve = true;
        M(leaf, TEX, { closed: true, curve: true });
      }

      /* ── arc lamp: a curve in 3D, so its foot is on the floor ────── */
      const arc = [[-36, FL, 30], [-36, 6, 30], [-35, -18, 31], [-30, -30, 34],
                   [-20, -34, 38], [-10, -34, 42]];
      M(arc.map((p) => V.p(p[0], p[1], p[2])), OUT, { curve: true });
      const sh = V.p(-10, -30, 42), ss = V.s(42);
      M([[sh[0] - 7 * ss, sh[1]], [sh[0] - 5 * ss, sh[1] - 6 * ss],
         [sh[0] + 5 * ss, sh[1] - 6 * ss], [sh[0] + 7 * ss, sh[1]]],
        DET, { closed: true, curve: true });
      T([[sh[0] - 7 * ss, sh[1]], [sh[0] - 5 * ss, sh[1] - 6 * ss],
         [sh[0] + 5 * ss, sh[1] - 6 * ss], [sh[0] + 7 * ss, sh[1]]],
        "hatch", TEX, { s: 121, angle: 80, gap: 0.5, curve: true });

      /* ── palm, NEAR the camera, so it is large ───────────────────── */
      /* Built in 3D. Drawn as screen-space offsets off a projected tip, the
         leaflets ignored the room entirely and lay flat on the right wall. */
      [[-6, 12], [14, 7]].forEach(([ty, tz], i) => {
        const base = [42, FL, 8];
        const tip = [20, ty, tz];
        const spine = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          spine.push([base[0] + (tip[0] - base[0]) * t,
                      base[1] + (tip[1] - base[1]) * t - 10 * Math.sin(Math.PI * t) * (1 - i * 0.1),
                      base[2] + (tip[2] - base[2]) * t]);
        }
        M(spine.map((p) => V.p(p[0], p[1], p[2])), DET, { curve: true });
        for (let k = 2; k < spine.length; k++) {
          const p = spine[k], w = 7 * (1 - Math.abs(k / spine.length - 0.5));
          M(V.seg(p, [p[0] + w * 0.4, p[1] - w, p[2] - w * 0.3]), TEX);
          M(V.seg(p, [p[0] + w * 0.5, p[1] + w * 0.8, p[2] + w * 0.2]), TEX);
        }
      });

      return { marks, regions, tones };
    },
  };
  NOOK3.fit = { w: 0.94, h: 0.86 };
  NOOK3.pen = 0.15;
  NOOK3.nib = {
    pressure: 0.1, wander: 0.07, boil: 0.12,
    overshoot: 0.2, double: false, breaks: 0.03, blobs: 0, specks: 0, toneDot: 0.24,
  };

  const ALL = { nook3: NOOK3, persp: PERSP, nook: NOOK, corner: CORNER, shop: SHOP, room: ROOM, lock: LOCK, bottle: BOTTLE, shoe: SHOE };
  return { ALL, keys: Object.keys(ALL) };
})();
