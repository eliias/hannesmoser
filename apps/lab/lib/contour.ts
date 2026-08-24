// Experiment 04 — particles to one silhouette.
//
// The particles are splatted into a scalar field, and the water is
// everything above one threshold. Marching squares turns that line into
// closed loops, and the loops become a Path2D the caller fills.
//
// WHY LOOPS AND NOT PIXELS: a threshold on a pixel buffer gives a stepped
// edge, and softening it costs a blur pass. Loops are curves, so the edge
// stays crisp at any device pixel ratio, a splash that flies off is simply
// its own loop, and a pocket of trapped air is a loop inside a loop that
// the even-odd fill rule punches out for free.

/** Field sample pitch in world px. Smaller is smoother and quadratically slower. */
export const CELL = 4
/** Splat radius. About one and a half particle spacings, so a pool closes up. */
export const RADIUS = 11
/** The iso value. 0.5 makes a lone particle a droplet of radius 0.54 * RADIUS. */
export const THRESHOLD = 0.5

export type Contour = {
  cell: number
  /** node counts; a node is one sample of the field */
  nnx: number
  nny: number
  field: Float32Array
  /** where the line crosses each horizontal / vertical edge, 0 to 1 */
  tH: Float32Array
  tV: Float32Array
  /** for each edge, the edge the line leaves it for. -1 means no line here. */
  next: Int32Array
  /** the edges a line starts at this frame, so the walk has somewhere to begin */
  starts: Int32Array
  startCount: number
  /** key offset of the vertical edges; horizontal edges own the keys below it */
  ev: number
}

export function createContour(width: number, height: number): Contour {
  const nnx = Math.floor(width / CELL) + 1
  const nny = Math.floor(height / CELL) + 1
  const edges = nnx * nny
  return {
    cell: CELL,
    nnx,
    nny,
    field: new Float32Array(edges),
    tH: new Float32Array(edges),
    tV: new Float32Array(edges),
    next: new Int32Array(2 * edges).fill(-1),
    // Worst case is two segments per cell. It never comes close in practice,
    // but a fixed allocation beats a per-frame grow.
    starts: new Int32Array(2 * edges),
    startCount: 0,
    ev: edges,
  }
}

/**
 * Rebuild the field from the particles.
 *
 * The kernel is (1 - d²/r²)², which is smooth, has no square root in it,
 * and reaches exactly 0 at the rim. The outermost ring of nodes is left
 * untouched at 0, which guarantees every contour closes inside the field
 * instead of running off the edge as an open line.
 */
export function splat(c: Contour, px: Float32Array, py: Float32Array, n: number) {
  const { field, nnx, nny, cell } = c
  field.fill(0)
  const r = RADIUS
  const r2 = r * r
  const span = Math.ceil(r / cell)
  for (let p = 0; p < n; p++) {
    const cx = px[p] / cell
    const cy = py[p] / cell
    const i0 = Math.max(Math.ceil(cx - span), 1)
    const i1 = Math.min(Math.floor(cx + span), nnx - 2)
    const j0 = Math.max(Math.ceil(cy - span), 1)
    const j1 = Math.min(Math.floor(cy + span), nny - 2)
    for (let j = j0; j <= j1; j++) {
      const dy = j * cell - py[p]
      const dy2 = dy * dy
      const row = j * nnx
      for (let i = i0; i <= i1; i++) {
        const dx = i * cell - px[p]
        const d2 = dx * dx + dy2
        if (d2 >= r2) continue
        const k = 1 - d2 / r2
        field[row + i] += k * k
      }
    }
  }
}

// The 16 marching squares cases, as pairs of edges the line runs between.
// Corners are TL = 1, TR = 2, BR = 4, BL = 8, and a bit is set when that
// corner is inside the water. Every segment is oriented so the water lies
// on its left, which is what lets one edge be the start of exactly one
// segment and makes the walk below a plain lookup.
//
// Edge codes: 0 top, 1 right, 2 bottom, 3 left.
// Two entries per case, -1 where the case has no second segment.
// prettier-ignore
const CASES = new Int8Array([
  -1, -1, -1, -1, // 0  none
   3,  0, -1, -1, // 1  TL
   0,  1, -1, -1, // 2  TR
   3,  1, -1, -1, // 3  TL TR
   1,  2, -1, -1, // 4  BR
  -1, -1, -1, -1, // 5  saddle, resolved below
   0,  2, -1, -1, // 6  TR BR
   3,  2, -1, -1, // 7  TL TR BR
   2,  3, -1, -1, // 8  BL
   2,  0, -1, -1, // 9  TL BL
  -1, -1, -1, -1, // 10 saddle, resolved below
   2,  1, -1, -1, // 11 TL TR BL
   1,  3, -1, -1, // 12 BL BR
   1,  0, -1, -1, // 13 TL BL BR
   0,  3, -1, -1, // 14 TR BR BL
  -1, -1, -1, -1, // 15 all
])

/** One of the four edge codes in CASES, resolved to this cell's edge key. */
const edgeKey = (edge: number, kT: number, kR: number, kB: number, kL: number) =>
  edge === 0 ? kT : edge === 1 ? kR : edge === 2 ? kB : kL

/**
 * The line, as a Path2D in field coordinates.
 *
 * Each closed loop is drawn as quadratic curves through the midpoints of
 * its segments, with the crossing points as control points. That is one
 * pass of smoothing for the price of the curve call that had to happen
 * anyway, and it takes the staircase off the 4px sample pitch.
 */
export function trace(c: Contour): Path2D {
  const { field, nnx, nny, cell, tH, tV, next, starts, ev } = c
  const thr = THRESHOLD
  c.startCount = 0

  for (let j = 0; j < nny - 1; j++) {
    for (let i = 0; i < nnx - 1; i++) {
      const tl = j * nnx + i
      const tr = tl + 1
      const bl = tl + nnx
      const br = bl + 1
      const a = field[tl]
      const b = field[tr]
      const d = field[br]
      const e = field[bl]

      let code = 0
      if (a >= thr) code |= 1
      if (b >= thr) code |= 2
      if (d >= thr) code |= 4
      if (e >= thr) code |= 8
      if (code === 0 || code === 15) continue

      // Edge keys. A horizontal edge is keyed by its left node, a vertical
      // edge by its top node, so the same physical edge gets the same key
      // from both cells that share it.
      const kT = tl
      const kB = bl
      const kL = ev + tl
      const kR = ev + tr

      let s0 = -1
      let e0 = -1
      let s1 = -1
      let e1 = -1
      if (code === 5 || code === 10) {
        // A saddle: the two diagonal corners may or may not be one body of
        // water. The average of the four corners stands in for the centre
        // sample and decides it.
        const centre = (a + b + d + e) / 4 >= thr
        if (code === 5) {
          if (centre) {
            s0 = kR; e0 = kT
            s1 = kL; e1 = kB
          } else {
            s0 = kL; e0 = kT
            s1 = kR; e1 = kB
          }
        } else if (centre) {
          s0 = kT; e0 = kL
          s1 = kB; e1 = kR
        } else {
          s0 = kT; e0 = kR
          s1 = kB; e1 = kL
        }
      } else {
        const o = code * 4
        s0 = edgeKey(CASES[o], kT, kR, kB, kL)
        e0 = edgeKey(CASES[o + 1], kT, kR, kB, kL)
      }

      // The crossings the two segments need. Recomputing a shared edge from
      // the neighbouring cell costs one divide and keeps the scan branchless
      // enough to stay readable.
      if (a !== b) tH[kT] = (thr - a) / (b - a)
      if (e !== d) tH[kB] = (thr - e) / (d - e)
      if (a !== e) tV[kL - ev] = (thr - a) / (e - a)
      if (b !== d) tV[kR - ev] = (thr - b) / (d - b)

      next[s0] = e0
      starts[c.startCount++] = s0
      if (s1 >= 0) {
        next[s1] = e1
        starts[c.startCount++] = s1
      }
    }
  }

  const path = new Path2D()
  for (let n = 0; n < c.startCount; n++) {
    const start = starts[n]
    if (next[start] < 0) continue

    let k = start
    let count = 0
    let x0 = 0
    let y0 = 0
    let x1 = 0
    let y1 = 0
    let px = 0
    let py = 0
    while (k >= 0) {
      const nk = next[k]
      next[k] = -1
      let x: number
      let y: number
      if (k < ev) {
        const i = k % nnx
        const j = (k / nnx) | 0
        x = (i + tH[k]) * cell
        y = j * cell
      } else {
        const m = k - ev
        const i = m % nnx
        const j = (m / nnx) | 0
        x = i * cell
        y = (j + tV[m]) * cell
      }
      if (count === 0) {
        x0 = x
        y0 = y
      } else if (count === 1) {
        x1 = x
        y1 = y
        path.moveTo((x0 + x) / 2, (y0 + y) / 2)
      } else {
        path.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2)
      }
      px = x
      py = y
      count++
      k = nk === start ? -1 : nk
    }
    if (count < 3) continue
    path.quadraticCurveTo(px, py, (px + x0) / 2, (py + y0) / 2)
    path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    path.closePath()
  }
  return path
}
