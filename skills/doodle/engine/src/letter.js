/*
 * LETTER — a single-stroke alphabet, drawn by the hand like anything else.
 *
 * Signage, labels, panel numbers and callouts kept being needed and kept
 * being re-declared: cafe.js carried eleven glyphs because "CAFE" and "OPEN"
 * were the only two words anyone had asked for. A drawn label is not an SVG
 * <text> — it has to wobble with everything around it — so the alphabet is
 * geometry.
 *
 * Convention, matching the one cafe.js already used: each glyph lives in a
 * box 3 wide and 5 tall with y running DOWN, so a glyph list drops straight
 * onto a plane in any of the cameras. Strokes are polylines; a glyph is a
 * list of them. Nothing is closed — a closed O is drawn as a loop that
 * returns to its start, so the hand's overshoot lands on top of itself the
 * way a real pen does.
 */
window.Letter = (function () {

  const G = {
    A: [[[0,5],[1.5,0],[3,5]], [[0.6,3.2],[2.4,3.2]]],
    B: [[[0,5],[0,0],[2.3,0],[3,1.2],[2.3,2.5],[0,2.5]], [[2.3,2.5],[3,3.7],[2.3,5],[0,5]]],
    C: [[[3,0.7],[2.2,0],[0.8,0],[0,1.2],[0,3.8],[0.8,5],[2.2,5],[3,4.3]]],
    D: [[[0,5],[0,0],[2,0],[3,1.4],[3,3.6],[2,5],[0,5]]],
    E: [[[3,0],[0,0],[0,5],[3,5]], [[0,2.4],[2.2,2.4]]],
    F: [[[3,0],[0,0],[0,5]], [[0,2.4],[2.2,2.4]]],
    G: [[[3,0.7],[2.2,0],[0.8,0],[0,1.2],[0,3.8],[0.8,5],[2.2,5],[3,4.2],[3,2.9],[1.8,2.9]]],
    H: [[[0,0],[0,5]], [[3,0],[3,5]], [[0,2.5],[3,2.5]]],
    I: [[[1.5,0],[1.5,5]], [[0.5,0],[2.5,0]], [[0.5,5],[2.5,5]]],
    J: [[[2.6,0],[2.6,3.9],[1.9,5],[0.7,5],[0,4]]],
    K: [[[0,0],[0,5]], [[3,0],[0,2.7]], [[1,1.9],[3,5]]],
    L: [[[0,0],[0,5],[3,5]]],
    M: [[[0,5],[0,0],[1.5,2.4],[3,0],[3,5]]],
    N: [[[0,5],[0,0],[3,5],[3,0]]],
    O: [[[0.8,0],[2.2,0],[3,1.2],[3,3.8],[2.2,5],[0.8,5],[0,3.8],[0,1.2],[0.8,0]]],
    P: [[[0,5],[0,0],[2.3,0],[3,1.3],[2.3,2.6],[0,2.6]]],
    Q: [[[0.8,0],[2.2,0],[3,1.2],[3,3.8],[2.2,5],[0.8,5],[0,3.8],[0,1.2],[0.8,0]], [[1.9,3.6],[3.2,5.4]]],
    R: [[[0,5],[0,0],[2.3,0],[3,1.3],[2.3,2.6],[0,2.6]], [[1.4,2.6],[3,5]]],
    S: [[[3,0.8],[2.1,0],[0.9,0],[0,1],[0.4,2.2],[2.6,2.8],[3,4],[2.1,5],[0.9,5],[0,4.2]]],
    T: [[[0,0],[3,0]], [[1.5,0],[1.5,5]]],
    U: [[[0,0],[0,3.8],[0.9,5],[2.1,5],[3,3.8],[3,0]]],
    V: [[[0,0],[1.5,5],[3,0]]],
    W: [[[0,0],[0.7,5],[1.5,2.2],[2.3,5],[3,0]]],
    X: [[[0,0],[3,5]], [[3,0],[0,5]]],
    Y: [[[0,0],[1.5,2.6],[3,0]], [[1.5,2.6],[1.5,5]]],
    Z: [[[0,0],[3,0],[0,5],[3,5]]],

    0: [[[0.8,0],[2.2,0],[3,1.2],[3,3.8],[2.2,5],[0.8,5],[0,3.8],[0,1.2],[0.8,0]], [[0.4,4.2],[2.6,0.8]]],
    1: [[[0.6,1],[1.6,0],[1.6,5]], [[0.5,5],[2.7,5]]],
    2: [[[0,1],[0.9,0],[2.2,0],[3,1.1],[2.6,2.4],[0,5],[3,5]]],
    3: [[[0,0],[3,0],[1.4,2.2],[2.6,2.4],[3,3.6],[2.3,5],[0.8,5],[0,4.2]]],
    4: [[[2.2,5],[2.2,0],[0,3.5],[3,3.5]]],
    5: [[[3,0],[0.5,0],[0,2.4],[1.9,2.1],[3,3],[2.8,4.5],[1.4,5],[0.2,4.5]]],
    6: [[[2.7,0.3],[1.2,0],[0.2,1.4],[0,3.6],[0.9,5],[2.2,5],[3,3.9],[2.3,2.7],[0.9,2.6],[0,3.6]]],
    7: [[[0,0],[3,0],[1.2,5]]],
    8: [[[1.5,2.4],[0.4,1.8],[0.5,0.5],[1.5,0],[2.5,0.5],[2.6,1.8],[1.5,2.4],[0.2,3.2],[0.3,4.5],[1.5,5],[2.7,4.5],[2.8,3.2],[1.5,2.4]]],
    9: [[[0.3,4.7],[1.8,5],[2.8,3.6],[3,1.4],[2.1,0],[0.8,0],[0,1.1],[0.7,2.3],[2.1,2.4],[3,1.4]]],

    ".": [[[1.3,4.7],[1.7,4.7],[1.7,5],[1.3,5],[1.3,4.7]]],
    ",": [[[1.7,4.6],[1.3,5.6]]],
    ":": [[[1.3,1.5],[1.7,1.5]], [[1.3,4.2],[1.7,4.2]]],
    "-": [[[0.4,2.5],[2.6,2.5]]],
    "—": [[[0,2.5],[3,2.5]]],
    "/": [[[2.8,0],[0.2,5]]],
    "'": [[[1.5,0],[1.3,1.4]]],
    "!": [[[1.5,0],[1.5,3.4]], [[1.4,4.6],[1.6,4.6]]],
    "?": [[[0.2,1],[1.1,0],[2.3,0.2],[2.8,1.3],[2,2.4],[1.5,3.4]], [[1.4,4.6],[1.6,4.6]]],
    "&": [[[3,5],[0.7,1.6],[0.8,0.4],[1.8,0.2],[2.2,1.2],[0.3,3.3],[0.5,4.7],[1.8,5],[2.8,3.9]]],
    "(": [[[2.2,0],[0.9,1.6],[0.9,3.4],[2.2,5]]],
    ")": [[[0.8,0],[2.1,1.6],[2.1,3.4],[0.8,5]]],
    "+": [[[1.5,1.2],[1.5,3.8]], [[0.4,2.5],[2.6,2.5]]],
    "=": [[[0.4,1.8],[2.6,1.8]], [[0.4,3.4],[2.6,3.4]]],
    "°": [[[1.4,0],[2,0],[2.2,0.6],[2,1.2],[1.4,1.2],[1.2,0.6],[1.4,0],[2,0]]],
    "#": [[[1.1,0],[0.6,5]], [[2.3,0],[1.8,5]], [[0.2,1.7],[2.8,1.7]], [[0.1,3.4],[2.7,3.4]]],
  };

  const EM = 3, TRACK = 1.4, SPACE = 2.2;

  /*
   * `paths(str, sc, x, y, opt)` — the string as polylines in (u, v) with v
   * DOWN, top-left at (x, y), each glyph `sc` × its box. `track` is the gap
   * between glyph boxes in glyph units; the default is measured off the café
   * sign. Unknown characters are skipped, not substituted: a tofu box in a
   * drawing is worse than a missing letter.
   */
  function paths(str, sc, x, y, opt) {
    const o = opt || {};
    const track = o.track == null ? TRACK : o.track;
    const out = [];
    let u = 0;
    for (const ch of String(str).toUpperCase()) {
      if (ch === " ") { u += SPACE + track; continue; }
      const g = G[ch];
      if (g) for (const s of g) out.push(s.map(([a, b]) => [x + (u + a) * sc, y + b * sc]));
      u += EM + track;
    }
    return out;
  }

  /* the advance width of a string, in the same units `paths` is scaled by */
  function width(str, sc, opt) {
    const track = (opt && opt.track != null) ? opt.track : TRACK;
    let u = 0;
    for (const ch of String(str).toUpperCase()) u += (ch === " " ? SPACE : EM) + track;
    return Math.max(0, u - track) * sc;
  }

  /* draw straight onto a 2D rig: `Letter.write(k, "OPEN", x, y, sc, w)` */
  function write(k, str, x, y, sc, w, opt) {
    const o = opt || {};
    let ox = x;
    if (o.align === "centre") ox = x - width(str, sc, o) / 2;
    if (o.align === "right") ox = x - width(str, sc, o);
    for (const p of paths(str, sc, ox, y, o))
      k.M(p, w == null ? k.DET : w, { curve: false });
    return width(str, sc, o);
  }

  return { G, paths, width, write, EM, TRACK, SPACE };
})();
