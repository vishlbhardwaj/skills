/*
 * VDL TWEAK PROTOCOL for doodle pages — what VDL's Randomise tab drives when a
 * frame is a drawing rather than a UI surface.
 *
 *   VDLTweak.expose({ P, render, palette: ["cLeaf", …] })
 *
 * exposes window.VDL_TWEAK = { kind, schema, presets, get(), set(values), roll(values, locks) }.
 * VDL renders `schema` as dials, calls set() live, saves the values per frame and
 * re-applies them on load. The knobs are the HAND and the PALETTE — the things a
 * drawing is made of — not corners and density, which mean nothing to a doodle.
 *
 * Hand values go to P.__hand, which Stage applies over the class nib (see stage.js).
 * Ranges for Randomise are the approved register's neighbourhood: boil stays under
 * its ~0.14 ceiling, wander low-frequency, weight within reach of the house 26.
 */
window.VDLTweak = (function () {
  const HAND = ["wander", "pressure", "wobble", "boil", "overshoot", "breaks", "double"];
  const hex = (h, s, l) => { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join(""); };
  const hsl = (c) => { const r = parseInt(c.slice(1, 3), 16) / 255, g = parseInt(c.slice(3, 5), 16) / 255, b = parseInt(c.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; };

  function expose({ P, render, palette }) {
    const pal = (palette || []).filter((k) => typeof P[k] === "string" && /^#[0-9a-f]{6}$/i.test(P[k]));
    const base = { ...P };
    const schema = [
      { key: "weight",    label: "Stroke weight", group: "Hand", min: 14, max: 40, step: 1, def: base.weight, note: "The pen's width. 26 is the house weight every class is measured at." },
      { key: "wander",    label: "Wander",    group: "Hand", min: 0, max: 1.2, step: 0.01, def: base.wander, note: "Low-frequency drift of the arm. Higher = looser." },
      { key: "pressure",  label: "Pressure",  group: "Hand", min: 0, max: 0.9, step: 0.01, def: base.pressure, note: "How much a line swells and thins along its length." },
      { key: "wobble",    label: "Wobble",    group: "Hand", min: 0, max: 6, step: 0.1, def: base.wobble, note: "Smoothing of the path — low reads ruled, high reads hand." },
      { key: "boil",      label: "Boil",      group: "Hand", min: 0, max: 0.2, step: 0.005, def: base.boil, note: "Fast finger tremble. Past ~0.14 it reads shaky." },
      { key: "overshoot", label: "Overshoot", group: "Hand", min: 0, max: 1.2, step: 0.01, def: base.overshoot, note: "Lines run a little past their corners." },
      { key: "breaks",    label: "Breaks",    group: "Hand", min: 0, max: 0.3, step: 0.005, def: base.breaks, note: "Chance a line lifts and leaves a gap." },
      { key: "double",    label: "Double line", group: "Hand", type: "toggle", def: !!base.double, note: "Draw each line twice, slightly apart." },
      { key: "seed",      label: "Seed",      group: "Hand", min: 1, max: 999, step: 1, def: base.seed, note: "Re-rolls every stroke's randomness — same drawing, a new hand." },
      { key: "outline",   label: "Line only", group: "Colour", type: "toggle", def: !!base.outline, note: "Colour off: the test of whether it reads in line." },
      { key: "ink",       label: "Ink",       group: "Colour", type: "color", def: base.ink },
      { key: "paper",     label: "Paper",     group: "Colour", type: "color", def: base.paper },
      ...pal.map((k) => ({ key: k, label: k.replace(/^c/, ""), group: "Palette", type: "color", def: base[k] })),
    ];
    const presets = [
      { n: "House hand", v: {} },
      /* each preset must read as a DIFFERENT HAND at frame size — the first set was too timid to see */
      /* wander/overshoot are FRACTIONS OF THE STROKE WIDTH (hand.js), so a visibly loose hand
         needs values near 1 — the class band (~0.05–0.1) is the house hand, not the range */
      { n: "Loose sketch", v: { wander: 0.85, pressure: 0.55, overshoot: 0.9, breaks: 0.14, wobble: 4.6, boil: 0.13 } },
      { n: "Tight pen", v: { weight: 22, wander: 0, pressure: 0.04, boil: 0.02, overshoot: 0, breaks: 0, wobble: 1.0 } },
      { n: "Heavy marker", v: { weight: 38, pressure: 0.3, overshoot: 0.2 } },
      { n: "Fine liner", v: { weight: 16, pressure: 0.1, boil: 0.05, wander: 0.03 } },
      { n: "Double line", v: { double: true, wander: 0.08 } },
      { n: "Line only", v: { outline: true } },
    ];
    const defs = Object.fromEntries(schema.map((d) => [d.key, d.def]));
    let cur = { ...defs };
    const set = (values) => {
      cur = { ...defs, ...(values || {}) };
      for (const d of schema) if (!HAND.includes(d.key)) P[d.key] = cur[d.key];
      P.__hand = Object.fromEntries(HAND.map((k) => [k, cur[k]]));
      render();
    };
    /* a roll: a new seed, the hand jittered inside the approved neighbourhood, and
       the WHOLE palette turned by one shared hue shift so the colours stay a set */
    const roll = (values, locks) => {
      const L = locks || new Set(), r = (a, b, st) => Math.round((a + Math.random() * (b - a)) / st) * st, v = { ...defs, ...(values || {}) };
      const bands = { weight: [18, 36, 1], wander: [0, 0.9, 0.01], pressure: [0.04, 0.6, 0.01], wobble: [1, 4.6, 0.1],
                      boil: [0.02, 0.14, 0.005], overshoot: [0, 0.9, 0.01], breaks: [0, 0.16, 0.005] };
      for (const [k, b] of Object.entries(bands)) if (!L.has(k)) v[k] = +r(...b).toFixed(3);
      if (!L.has("seed")) v.seed = 1 + Math.floor(Math.random() * 998);
      if (!L.has("double")) v.double = Math.random() < 0.15;
      /* never a shift too small to see: 25–70° either way */
      const shift = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 45);
      for (const k of pal) if (!L.has(k)) { const [h, s, l] = hsl(defs[k]); v[k] = hex((h + shift + 360) % 360, s, l); }
      return v;
    };
    window.VDL_TWEAK = { kind: "doodle", schema, presets, get: () => ({ ...cur }), set, roll, defaults: () => ({ ...defs }) };
  }
  return { expose };
})();
