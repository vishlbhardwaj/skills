/*
 * THE CAMERA — what was missing.
 *
 * Every object before this was authored as 2D `[x, y]` and drawn straight to
 * the sheet, so every drawing was a flat elevation. Not because the geometry
 * was badly chosen but because the system could not express anything else:
 * there was no projection step at all. A sofa was a band, a table was an
 * ellipse, a floor was a line, and depth could only ever be faked by overlap.
 *
 * Author in THREE numbers now and project. Convention:
 *
 *     x   right, 0 at the centre of the room
 *     y   DOWN, 0 at eye level — so the horizon is y = 0
 *     z   into the picture, 0 at the near edge
 *
 * One-point perspective, which is what both interior references are: a single
 * vanishing point, everything parallel to z converging on it, everything
 * parallel to the picture plane staying parallel.
 *
 *     s = f / (f + z)        screen = vp + (x, y) · s
 *
 * As z grows s falls toward 0, so distant things shrink toward the vanishing
 * point. That is the whole of it. f is the focal length in author units: a
 * small f is a wide lens and a violent convergence, a large f is a long lens
 * and a nearly flat room.
 *
 * Output is in the same 0–100 × 0–125 space every other object uses, so the
 * hand, the tone fills and the sheet fitting all work on it unchanged.
 */
window.View = (function () {

  /*
   * TWO-POINT PERSPECTIVE — a level pinhole camera with the world yawed.
   *
   * One-point perspective cannot draw a box turned to the camera: such a box
   * has two sets of receding horizontals and one vanishing point can only
   * serve one of them. `axon` dodged that by dropping convergence entirely,
   * which is right for a product render and wrong for a building — a building
   * seen from the street converges, and that is most of what makes it read as
   * mass rather than as a facade printed on paper.
   *
   * So: yaw the world about the vertical axis, then project with a LEVEL
   * image plane. Because x and y are divided by the same depth, a vertical
   * world edge stays vertical on the sheet — which is the defining property
   * of two-point perspective and the reason it looks like architecture rather
   * than like a dramatic camera angle. The two horizontal axes get one
   * vanishing point each, left and right on the horizon.
   *
   * A NEGATIVE yaw sends +x receding to the right and +z receding to the
   * left, so a building with its front wall along x and its flank along z is
   * seen from its left, front wall dominant.
   */
  function two(o) {
    const f = (o && o.f) || 300;
    const a = (((o && o.yaw) === undefined ? -22 : o.yaw) * Math.PI) / 180;
    const d = (o && o.dist) || 150;
    const hor = (o && o.hor) === undefined ? 58 : o.hor;
    const cx = (o && o.cx) === undefined ? 50 : o.cx;
    const ca = Math.cos(a), sa = Math.sin(a);
    const V = {
      f, hor, cx, yaw: a,
      /* depth of a world point after the yaw — for back-to-front sorting */
      depth(x, y, z) { return -x * sa + z * ca + d; void y; },
      p(x, y, z) {
        const X = x * ca + z * sa;
        const Z = -x * sa + z * ca + d;
        const s = f / Math.max(1e-3, Z);
        return [cx + X * s, hor + y * s];
      },
      seg(p0, p1) { return [V.p(p0[0], p0[1], p0[2]), V.p(p1[0], p1[1], p1[2])]; },
      /*
       * A FACE: an origin and two in-plane directions, so anything flat can be
       * authored in plain (u, v) on that wall — u across, v DOWN — exactly as
       * it would be in elevation, and still land in perspective. Without this
       * every window has to be written out in three dimensions and the
       * drawing becomes unreadable.
       */
      face(origin, du, dv) {
        const F = {
          du, dv, origin,
          at(u, v) {
            return V.p(origin[0] + du[0] * u + dv[0] * v,
                       origin[1] + du[1] * u + dv[1] * v,
                       origin[2] + du[2] * u + dv[2] * v);
          },
          /* the same point pushed out along the face's own normal */
          out(u, v, n) {
            const nx = du[1] * dv[2] - du[2] * dv[1];
            const ny = du[2] * dv[0] - du[0] * dv[2];
            const nz = du[0] * dv[1] - du[1] * dv[0];
            const L = Math.hypot(nx, ny, nz) || 1;
            return V.p(origin[0] + du[0] * u + dv[0] * v + (nx / L) * n,
                       origin[1] + du[1] * u + dv[1] * v + (ny / L) * n,
                       origin[2] + du[2] * u + dv[2] * v + (nz / L) * n);
          },
          poly(uv) { return uv.map(([u, v]) => F.at(u, v)); },
        };
        return F;
      },
    };
    return V;
  }

  function one(o) {
    const f = (o && o.f) || 100;
    const vp = (o && o.vp) || [50, 62];
    const V = {
      f, vp,
      /* scale factor at a depth — useful for sizing a thing that sits at z */
      s(z) { return f / (f + z); },
      /* one point */
      p(x, y, z) { const s = f / (f + z); return [vp[0] + x * s, vp[1] + y * s]; },
      /* a run of points at one depth */
      run(pts, z) { return pts.map(([x, y]) => V.p(x, y, z)); },
      /* a quad given as four [x,y,z] corners */
      quad(a, b, c, d) { return [a, b, c, d].map((q) => V.p(q[0], q[1], q[2])); },
      /* a line segment in 3D, as a 2-point 2D path */
      seg(a, b) { return [V.p(a[0], a[1], a[2]), V.p(b[0], b[1], b[2])]; },
    };
    return V;
  }

  /*
   * An axis-aligned box, returned as faces sorted BACK TO FRONT.
   *
   * Painter's order is all a convex box needs — draw them in this order and
   * the near faces cover the far ones, which is the occlusion that makes a
   * box read as solid rather than as a wireframe. Faces whose outward normal
   * points away from the eye are dropped first, so a six-sided box draws the
   * three you can actually see.
   */
  function box(V, x0, y0, z0, x1, y1, z1, eye) {
    const E = eye || V.eye || [0, 0, -V.f];
    const C = [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ];
    const F = [
      { i: [0, 1, 2, 3], n: [0, 0, -1] },   // near
      { i: [5, 4, 7, 6], n: [0, 0, 1] },    // far
      { i: [4, 0, 3, 7], n: [-1, 0, 0] },   // left
      { i: [1, 5, 6, 2], n: [1, 0, 0] },    // right
      { i: [4, 5, 1, 0], n: [0, -1, 0] },   // top
      { i: [3, 2, 6, 7], n: [0, 1, 0] },    // bottom
    ];
    const mid = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    const out = [];
    for (const f of F) {
      const c = f.i.reduce((a, k) => [a[0] + C[k][0] / 4, a[1] + C[k][1] / 4, a[2] + C[k][2] / 4], [0, 0, 0]);
      const v = [c[0] - E[0], c[1] - E[1], c[2] - E[2]];
      if (f.n[0] * v[0] + f.n[1] * v[1] + f.n[2] * v[2] >= 0) continue;   // facing away
      /* A value per face, lit from upper-left-front. Without it a correctly
         projected box is still a flat slab — convergence alone does not make
         a solid look solid. */
      const SH = { "0,-1,0": 1, "0,0,-1": 0.9, "-1,0,0": 0.8, "1,0,0": 0.7, "0,1,0": 0.62, "0,0,1": 0.75 };
      out.push({ pts: f.i.map((k) => V.p(C[k][0], C[k][1], C[k][2])),
                 depth: c[2], n: f.n, shade: SH[f.n.join(",")] || 1 });
    }
    out.sort((a, b) => b.depth - a.depth);
    return out;
  }

  /*
   * Floorboards: lines running INTO the picture, so they converge. Drawn as
   * parallel screen lines they are the clearest possible tell that a drawing
   * has no camera behind it.
   */
  function boards(V, x0, x1, y, z0, z1, step) {
    const out = [];
    for (let x = x0; x <= x1 + 1e-6; x += step) out.push(V.seg([x, y, z0], [x, y, z1]));
    return out;
  }

  /* Cross-joints between boards, spaced so they get closer with distance. */
  function joints(V, x0, x1, y, z0, z1, n) {
    const out = [];
    for (let k = 1; k <= n; k++) {
      const z = z0 + (z1 - z0) * Math.pow(k / (n + 1), 0.72);
      out.push(V.seg([x0, y, z], [x1, y, z]));
    }
    return out;
  }

  /*
   * AXONOMETRIC — parallel projection, no vanishing point.
   *
   * One-point perspective cannot draw a box turned to the camera: such a box
   * has TWO sets of receding horizontals and one vanishing point can only
   * serve one of them. Product renders of this kind are not perspective at
   * all — measured off the reference, its screen's horizontal edges run at
   * +24° and its verticals sit at 93°, i.e. vertical. Nothing converges.
   *
   *   sx = ox + x·cos(ax) + z·cos(az)
   *   sy = oy + x·sin(ax) + z·sin(az) + y
   *
   * `ax` is the angle of the x axis on screen (the face toward us, running
   * down to the right) and `az` the angle of the z axis (running away, up to
   * the right). True isometric is ±30; this reference is a shallower ±23.
   *
   * There is no foreshortening, so `s()` is 1 — which also means anything
   * sized by depth in a perspective scene stays put here.
   */
  function axon(o) {
    const ax = ((o && o.ax) != null ? o.ax : 24) * Math.PI / 180;
    const az = ((o && o.az) != null ? o.az : -22) * Math.PI / 180;
    const k = (o && o.scale) || 1;
    const or = (o && o.origin) || [50, 56];
    const cx = Math.cos(ax) * k, sx = Math.sin(ax) * k;
    const cz = Math.cos(az) * k, sz = Math.sin(az) * k;
    /* The eye, for back-face culling: far along the direction that projects
       to nothing. Solve sx = sy = 0 for the null vector and walk back down it. */
    const nz = 1, nx = -cz / cx, ny = -(nx * sx + nz * sz) / k;
    const L = Math.hypot(nx, ny, nz) || 1;
    const V = {
      f: 1e6, vp: or, k, eye: [-nx / L * 4000, -ny / L * 4000, -nz / L * 4000],
      s() { return 1; },
      p(x, y, z) { return [or[0] + x * cx + z * cz, or[1] + x * sx + z * sz + y * k]; },
      run(pts, z) { return pts.map(([x, y]) => V.p(x, y, z)); },
      quad(a, b, c, d) { return [a, b, c, d].map((q) => V.p(q[0], q[1], q[2])); },
      seg(a, b) { return [V.p(a[0], a[1], a[2]), V.p(b[0], b[1], b[2])]; },
    };
    return V;
  }

  /*
   * A PRISM: any footprint in the floor plane, extruded vertically.
   *
   * `box` can only make things square to the camera, so every object built
   * with it faces dead on. A real room has things at an angle — and a chair
   * turned a few degrees reads as furniture where a head-on one reads as a
   * diagram. A footprint also covers shapes a box cannot: a round table, a
   * hexagonal pot, a sofa with a returned end.
   *
   * `foot` is a list of [x, z] in the floor plane; yTop is the top surface
   * (remember y runs DOWN, so yTop < yBot).
   */
  function prism(V, foot, yTop, yBot, eye) {
    const E = eye || V.eye || [0, 0, -V.f];
    /* wind it counter-clockwise, so an edge normal is reliably outward */
    let area = 0;
    for (let i = 0, j = foot.length - 1; i < foot.length; j = i++)
      area += (foot[j][0] * foot[i][1] - foot[i][0] * foot[j][1]);
    const f = area < 0 ? foot.slice().reverse() : foot;

    const faces = [], vis = [];
    for (let i = 0; i < f.length; i++) {
      const a = f[i], b = f[(i + 1) % f.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const n = [dz, 0, -dx];
      const c = [(a[0] + b[0]) / 2, (yTop + yBot) / 2, (a[1] + b[1]) / 2];
      const v = [c[0] - E[0], c[1] - E[1], c[2] - E[2]];
      if (n[0] * v[0] + n[2] * v[2] >= 0) continue;
      /* a side's value from how square it is to the light, upper-left-front */
      const L = Math.hypot(n[0], n[2]) || 1;
      const lit = (-n[0] / L) * 0.45 + (-n[2] / L) * 0.75;
      faces.push({
        pts: [V.p(a[0], yTop, a[1]), V.p(b[0], yTop, b[1]),
              V.p(b[0], yBot, b[1]), V.p(a[0], yBot, a[1])],
        depth: c[2], shade: 0.66 + 0.26 * Math.max(0, lit),
      });
      vis.push(i);
    }

    /*
     * The SILHOUETTE: one outline round the whole solid.
     *
     * Outlining every face instead draws a line down each facet, so a rounded
     * footprint — the thing that stops upholstery reading as a filing cabinet
     * — comes out covered in stripes. The visible sides form a contiguous run
     * in footprint order, so their top edges and bottom edges chain into a
     * single closed boundary.
     */
    let sil = null;
    if (vis.length) {
      let run = vis;
      /* rotate the run so it is contiguous even when it wraps index 0 */
      for (let k = 0; k < vis.length; k++)
        if (vis[(k + vis.length - 1) % vis.length] !== (vis[k] + f.length - 1) % f.length) {
          run = vis.slice(k).concat(vis.slice(0, k)); break;
        }
      const top = [], bot = [];
      for (const i of run) {
        const a = f[i], b = f[(i + 1) % f.length];
        top.push(V.p(a[0], yTop, a[1]));
        bot.push(V.p(a[0], yBot, a[1]));
        if (i === run[run.length - 1]) {
          top.push(V.p(b[0], yTop, b[1]));
          bot.push(V.p(b[0], yBot, b[1]));
        }
      }
      sil = top.concat(bot.reverse());
    }
    /* y runs DOWN and the eye is at y = 0, so a top surface shows only when
       it is below eye level */
    if (yTop > 0) faces.push({
      pts: f.map(([x, z]) => V.p(x, yTop, z)),
      depth: Math.min(...f.map((q) => q[1])) - 0.01, shade: 1,
    });
    faces.sort((a, b) => b.depth - a.depth);
    faces.silhouette = sil;
    return faces;
  }

  /* Turn a footprint about a vertical axis — what lets a thing sit at an
     angle to the camera instead of square to it. */
  function turn(foot, deg, cx, cz) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return foot.map(([x, z]) => {
      const dx = x - cx, dz = z - cz;
      return [cx + dx * c - dz * s, cz + dx * s + dz * c];
    });
  }

  /* A footprint for a rectangle, and for a disc. */
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

  /* A rounded footprint. A four-corner rect extrudes into a hard-edged block,
     which is right for a shelf and wrong for upholstery — a chair built that
     way reads as a filing cabinet. More points round the silhouette without
     needing curved faces. */
  const soft = (x0, z0, x1, z1, r, per) => {
    const n = per || 4, o = [];
    const C = [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, 90], [x0 + r, z0 + r, 180], [x1 - r, z0 + r, 270]];
    for (const [cx, cz, a0] of C)
      for (let i = 0; i <= n; i++) {
        const a = ((a0 + (i / n) * 90) * Math.PI) / 180;
        o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
      }
    return o;
  };
  const disc = (cx, cz, r, n) => {
    const o = [];
    for (let i = 0; i < (n || 18); i++) {
      const a = (i / (n || 18)) * Math.PI * 2;
      o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
    return o;
  };

  return { one, two, axon, box, prism, turn, rect, soft, disc, boards, joints };
})();
