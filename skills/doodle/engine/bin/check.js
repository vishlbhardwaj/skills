/*
 * Injected into a page by bin/check.sh.
 *
 * Counting DOM children was not a check: it reported a number nobody compared
 * to anything, so a silent shortfall read as a plausible total for a whole
 * session. A check has to ASSERT.
 */
(function () {
  const errs = [];
  const ce = console.error;
  console.error = function () { errs.push([].slice.call(arguments).join(" ")); ce.apply(console, arguments); };
  addEventListener("error", (e) => errs.push("uncaught: " + e.message));

  setTimeout(function () {
    const w = document.getElementById("world");
    const expected = typeof SUBJECTS !== "undefined" ? SUBJECTS.length
                   : typeof CELLS !== "undefined" ? CELLS.length : null;
    const rendered = w.children.length;
    const html = w.innerHTML;
    const fails = [];
    if (expected !== null && rendered !== expected)
      fails.push("rendered " + rendered + " of " + expected + " subjects");
    if (/NaN|Infinity/.test(html)) fails.push("NaN or Infinity in output");

    /*
     * CLASS DRIFT. A module that names a class in src/spec.js has to draw at
     * that class's hand. This is the check that did not exist when the same
     * ten plants were rendering 1.7x apart on two pages and nobody noticed
     * for a week.
     */
    let drift = 0;
    if (typeof Spec !== "undefined") {
      const mods = (typeof SUBJECTS !== "undefined" ? SUBJECTS : typeof CELLS !== "undefined" ? CELLS : [])
        .map((c) => c.mod).filter((m) => m && m.cls);
      for (const m of mods) {
        const d = Spec.audit(m, m.cls);
        if (d.length) { drift++; if (drift <= 3) fails.push("drift " + m.cls + " '" + m.label + "': " + d.join("; ")); }
      }
    }
    if (!w.querySelector("path")) fails.push("no paths drawn");

    /*
     * MISSING PALETTE KEYS. Not read off the console — this script is
     * injected last, so it hooks console.error after every subject has
     * already drawn. Stage records them instead.
     */
    let noColour = [];
    if (typeof Stage !== "undefined" && Stage.missingColours) {
      noColour = Stage.missingColours();
      if (noColour.length)
        fails.push("palette: page declares no " + noColour.join(", "));
    }
    errs.slice(0, 4).forEach((e) => fails.push("console: " + e));
    document.title = "__CHK__" + JSON.stringify({
      ok: fails.length === 0, expected, rendered,
      paths: w.querySelectorAll("path").length, drift, noColour: noColour.length, fails,
    });
  }, 4000);
})();
