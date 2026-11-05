/*
 * THE MACINTOSH — the 1984 box, with its keyboard and mouse.
 *
 * ONE beige, not three. Measured off the reference the top is #E8E2D8, the
 * front #D3CEC0 and the side #ADA79B — all hue 37–44 at 10–26% saturation.
 * That is a single plastic at three angles to the light, which is exactly
 * what `View.prism` already produces from a face normal, so the palette has
 * one entry and the shading does the rest.
 *
 * The screen is #C9D5D2, hue 165 at 13% — a pale cool grey, not a cyan. It
 * is the only cool thing in a warm picture and that is the whole contrast.
 *
 * And it is drawn AXONOMETRIC, because the reference is. Measured off it, the
 * screen's horizontal edges run at +24° and its verticals sit at 93° — so
 * nothing converges. One-point perspective cannot draw a box turned to the
 * camera at all: such a box has two sets of receding horizontals and a single
 * vanishing point can only serve one of them.
 */
window.Macintosh = (function () {

  function build() {
    /* Axonometric, at the angles measured off the reference: the x axis
       down-right at 24°, the z axis up-right at 22°, verticals vertical. */
    const V = View.axon({ ax: 24, az: -22, origin: [50, 30] });
    const marks = [], regions = [], tones = [];
    const M = (pts, w, opt) => marks.push({ pts, w, ...(opt || {}) });
    const R = (pts, fill, sd, sh, curve) => {
      regions.push({ pts, fill, s: sd || 0, curve: !!curve });
      if (sh != null) regions[regions.length - 1].shade = sh;
    };
    /*
     * `noTop` suppresses a prism's top face, fill AND outline.
     *
     * Authoring the base before the body fixed the FILL — the body's regions
     * paint over it. The outline is a mark, and every mark paints after every
     * region, so the base's top face outline still drew straight across the
     * finished machine as two long diagonals. A surface something else is
     * standing on should not be drawn at all.
     */
    const solid = (faces, fill, sd, w, noTop) => {
      const top = faces[faces.length - 1];
      const lid = top && top.shade === 1;
      faces.forEach((f, i) => {
        if (noTop && lid && f === top) return;
        R(f.pts, fill, sd + i, f.shade);
      });
      if (faces.silhouette) M(faces.silhouette, w, { closed: true, curve: false });
      if (lid && !noTop) M(top.pts, w * 0.7, { closed: true, curve: false });
    };
    const OUT = 1.4, DET = 0.8, TEX = 0.45;
    /* No turn: the camera's own axes do the turning now. Rotating the
       footprint as well would twist the box off its own projection. */
    const GND = 40, TURN = 0;

    const F = -13;                     // the front face's depth, in body frame

    /* a point in the body's own frame: u across, y up/down, w depth */
    const P3 = (u, y, w) => {
      const [x, z] = View.turn([[u, w]], TURN, 0, 0)[0];
      return [x, y, z];
    };
    const quad = (a, b, c, d) => [a, b, c, d].map((p) => V.p(p[0], p[1], p[2]));

    /* ── the box ──────────────────────────────────────────────────── */
    const bodyFoot = View.turn(View.soft(-13, -13, 13, 15, 2.2), TURN, 0, 0);
    /* 26 wide by 38 tall = 0.68, against the real machine's 0.71. At 0.48,
       which is where this started, it reads as a tower, not a Macintosh. */
    /*
     * Base FIRST, then the body over it.
     *
     * Regions paint in authoring order, and a prism emits a top face whenever
     * its top is below eye level — so drawing the base second laid its lit
     * top face straight across the front of the machine. Authored first, the
     * body covers it. Same footprint, so the step is a line, not a box.
     */
    solid(View.prism(V, bodyFoot, 34, GND), "cBeige", 11, DET, true);
    solid(View.prism(V, bodyFoot, 2, 34), "cBeige", 31, OUT);
    M([V.p(...P3(-13, 34, F)), V.p(...P3(13, 34, F))], TEX);

    /* the carrying slot moulded into the back of the top */
    M(quad(P3(-5, 2, 8), P3(5, 2, 8), P3(5, 2, 12), P3(-5, 2, 12)),
      DET, { closed: true, curve: false });

    /* ── the front: bezel, screen, logo, floppy slot ──────────────── */
    M(quad(P3(-10.4, 5, F), P3(10.4, 5, F), P3(10.4, 23, F), P3(-10.4, 23, F)),
      DET, { closed: true, curve: false });
    const scr = quad(P3(-8.6, 6.6, F - 0.4), P3(8.6, 6.6, F - 0.4),
                     P3(8.6, 21.4, F - 0.4), P3(-8.6, 21.4, F - 0.4));
    R(scr, "cScreen", 51, 1, false);
    M(scr, DET, { closed: true, curve: false });
    /* the typed line the reference is animating — one line, held */
    const bar = quad(P3(-6.2, 12.4, F - 0.6), P3(6.2, 12.4, F - 0.6),
                     P3(6.2, 15.4, F - 0.6), P3(-6.2, 15.4, F - 0.6));
    M(bar, TEX, { closed: true, curve: false });
    for (let k = 0; k < 9; k++)
      M([V.p(...P3(-5.4 + k * 1.3, 13.1, F - 0.7)), V.p(...P3(-5.4 + k * 1.3, 14.7, F - 0.7))],
        TEX * 0.9);

    /* the rainbow logo, as six stacked bands */
    ["cRed", "cYellow", "cLeaf", "cAzure", "cSky", "cRed"].forEach((c, i) => {
      const y0 = 25 + i * 0.6;
      R(quad(P3(-9.8, y0, F - 0.3), P3(-7.8, y0, F - 0.3),
             P3(-7.8, y0 + 0.6, F - 0.3), P3(-9.8, y0 + 0.6, F - 0.3)), c, 61 + i, 1, false);
    });
    /* floppy slot: a thin dark mouth with its eject notch */
    const slot = quad(P3(-1.6, 28.4, F - 0.3), P3(8.6, 28.4, F - 0.3),
                      P3(8.6, 30.2, F - 0.3), P3(-1.6, 30.2, F - 0.3));
    R(slot, "cInk", 71, 0.9, false);
    M(slot, DET, { closed: true, curve: false });
    M([V.p(...P3(7.2, 30.2, F - 0.4)), V.p(...P3(7.2, 31.6, F - 0.4))], TEX);
    /* the recess under the front, the one place the box lifts off the desk */
    M(quad(P3(-7, 35, F + 0.6), P3(7, 35, F + 0.6), P3(7, 39, F + 0.6), P3(-7, 39, F + 0.6)),
      TEX, { closed: true, curve: false });

    /* ── vents, on the right flank ────────────────────────────────── */
    for (let k = 0; k < 7; k++)
      M([V.p(...P3(13.2, 22 + k * 1.5, -6)), V.p(...P3(13.2, 22 + k * 1.5, 9))], TEX * 0.9);

    /* ── keyboard: a wedge, with the key field ruled on its top ───── */
    const KB = View.turn(View.soft(-42, -40, -6, -22, 1.4), TURN, 0, 0);
    solid(View.prism(V, KB, 37, GND), "cBeige", 81, OUT);
    for (let r = 0; r < 6; r++)
      M([V.p(...P3(-40.4, 36.8, -38.6 + r * 2.6)), V.p(...P3(-7.6, 36.8, -38.6 + r * 2.6))], TEX * 0.8);
    for (let c = 0; c < 18; c++)
      M([V.p(...P3(-40.4 + c * 1.85, 36.8, -38.6)), V.p(...P3(-40.4 + c * 1.85, 36.8, -23.8))], TEX * 0.6);

    /* ── mouse, and the two cables ────────────────────────────────── */
    const MS = View.turn(View.soft(2, -36, 11, -25, 1.6), TURN, 0, 0);
    solid(View.prism(V, MS, 37.4, GND), "cBeige", 101, OUT);
    M([V.p(...P3(3.4, 37.2, -34)), V.p(...P3(9.6, 37.2, -34))], TEX);

    /* The mouse tail runs AROUND the machine, not through it. Routed inside
       its footprint the cable crossed the front face, because marks paint
       after regions and nothing was hiding it. */
    /*
     * Routed so it stays BELOW the machine's base on screen.
     *
     * Marks have no depth occlusion, so a cable that passes behind the box in
     * three dimensions still draws straight across its front face. In the
     * reference the machine hides it; here the route has to.
     */
    M([V.p(...P3(11, 39, -28)), V.p(...P3(22, 39, -22)),
       V.p(...P3(31, 39, -16)), V.p(...P3(34, 39, -10))], DET, { curve: true });
    /* the keyboard's lead: one curve. Coiled, it read as a scribble at this
       size — the spring is detail the drawing cannot carry. */
    M([V.p(...P3(-7, 39, -30)), V.p(...P3(-2, 39.2, -26)),
       V.p(...P3(-1, 39.4, -20)), V.p(...P3(-6, 39.5, -15))], DET * 0.9, { curve: true });

    return { marks, regions, tones };
  }

  return { label: "Macintosh", build,
           fit: { w: 0.88, h: 0.84 }, pen: 0.15,
           nib: { pressure: 0.1, wander: 0.07, boil: 0.11, overshoot: 0.2,
                  double: false, breaks: 0.03, blobs: 0, specks: 0 } };
})();
