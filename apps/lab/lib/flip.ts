// Experiment 04 — the water solver.
//
// FLIP, after Zhu & Bridson 2005. The water IS the particles; the grid is
// only the tool that makes them incompressible. One frame moves the
// particles, copies their velocity onto a staggered grid, takes the
// divergence out of that grid, and hands the change back to the particles.
// Because the particles carry the water between frames, the motion keeps
// its detail instead of smearing the way a pure grid advection does.
//
// Nothing here touches the DOM, React, or a canvas. It knows positions,
// velocities and cell size. components/NavierStokes.tsx owns the loop that
// calls it and the renderer that draws the result.
//
// THE PADDED WORLD, read this before mapping coordinates: the grid covers
// the canvas grown by one cell on every side, and that outer ring of cells
// is the solid wall. So sim (h, h) is canvas (0, 0). The wall therefore
// sits just outside the view, and the water reaches the visible edge
// instead of stopping one cell short of it. The caller does the one
// translate; nothing in this file knows about the canvas.

// AIR is 0 so that a fresh Uint8Array is an empty tank. The first draft had
// SOLID at 0, which made every cell a wall and quietly turned the pressure
// solve into a no-op: the water fell, and nothing ever pushed back.
const AIR = 0
const FLUID = 1
const SOLID = 2

/** Cell size in CSS px. Everything else here is derived from it. */
export const CELL = 12
/** Particle radius. 0.3 cells is the usual FLIP packing, ~2.8 particles per cell. */
const RADIUS = 0.3 * CELL
/** Lattice pitch of a resting pool: two radii apart, rows staggered. */
const PITCH = 2 * RADIUS

/** Gauss-Seidel sweeps per frame. 40 is where a still pool stops sagging. */
const SOLVE_ITERS = 40
/** >1 over-relaxes each sweep, which is what makes 40 enough instead of 200. */
const OVER_RELAX = 1.9
/** Passes of the push-apart step. This is what stops FLIP from clumping. */
const SEPARATE_ITERS = 2
/** How hard a cell that holds too many particles pushes back. Keeps volume. */
const DRIFT_K = 1

/**
 * The PIC and FLIP blend, as a function of the viscosity slider.
 * FLIP keeps the particle's own velocity and adds only the grid's change,
 * so it keeps energy and splashes. PIC throws the particle's velocity away
 * and takes the grid's, which loses energy on every transfer and reads as
 * syrup. Water is nearly all FLIP; the slider walks toward PIC.
 */
const flipRatio = (viscosity: number) => 0.95 - 0.45 * viscosity

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export type Pointer = {
  x: number
  y: number
  /** px per second, measured between two steps by the caller */
  vx: number
  vy: number
  radius: number
  /** 0 to 1: how much of the pointer velocity a cell at the centre takes */
  strength: number
  active: boolean
}

export type Params = {
  /** px per second squared */
  gravity: number
  /** 0 loose, 1 syrup */
  viscosity: number
  pointer: Pointer
}

export type Flip = {
  h: number
  nx: number
  ny: number
  /** horizontal velocity on the vertical faces, (nx + 1) * ny */
  u: Float32Array
  /** vertical velocity on the horizontal faces, nx * (ny + 1) */
  v: Float32Array
  /** the same two fields as they were before the pointer and the solve */
  uPrev: Float32Array
  vPrev: Float32Array
  /** accumulated transfer weight per face; > 0 marks a face the water reached */
  uW: Float32Array
  vW: Float32Array
  type: Uint8Array
  /** particles per cell, bilinear. nx * ny */
  density: Float32Array
  /** the density of the pool at rest, measured once on the first frame */
  restDensity: number
  cap: number
  n: number
  px: Float32Array
  py: Float32Array
  vx: Float32Array
  vy: Float32Array
  r: number
  /** uniform hash over the particles, rebuilt every frame for the push-apart */
  hashPitch: number
  hashNx: number
  hashNy: number
  hashStart: Int32Array
  hashItem: Int32Array
}

// Scratch for the bilinear stencil below. Module level because it is read
// and written a few hundred thousand times per frame, and allocating four
// numbers that often is the one thing that would show up in a profile.
const idx = new Int32Array(4)
const wt = new Float32Array(4)

/**
 * The four surrounding nodes of a staggered field and their bilinear
 * weights, written into `idx` and `wt`. `ox`/`oy` is where node (0,0) of
 * that field sits in world units: (0, h/2) for u, (h/2, 0) for v,
 * (h/2, h/2) for the cell centres.
 */
function stencil(
  x: number,
  y: number,
  ox: number,
  oy: number,
  h: number,
  gnx: number,
  gny: number,
) {
  const gx = clamp((x - ox) / h, 0, gnx - 1.0001)
  const gy = clamp((y - oy) / h, 0, gny - 1.0001)
  const i = gx | 0
  const j = gy | 0
  const tx = gx - i
  const ty = gy - j
  const a = j * gnx + i
  idx[0] = a
  idx[1] = a + 1
  idx[2] = a + gnx
  idx[3] = a + gnx + 1
  wt[0] = (1 - tx) * (1 - ty)
  wt[1] = tx * (1 - ty)
  wt[2] = (1 - tx) * ty
  wt[3] = tx * ty
}

/**
 * An empty tank the size of the canvas plus its wall ring.
 *
 * The particle capacity is the number of lattice sites in the whole tank,
 * so DROP can keep adding water until the tank is literally full and no
 * further. That is a physical limit rather than a picked number, which is
 * why there is no maximum-particles constant anywhere.
 */
export function createFlip(width: number, height: number): Flip {
  const h = CELL
  const nx = Math.ceil(width / h) + 2
  const ny = Math.ceil(height / h) + 2
  const cap = Math.ceil(((nx * h) / PITCH) * ((ny * h) / (PITCH * 0.866)))

  const type = new Uint8Array(nx * ny)
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) type[j * nx + i] = SOLID

  const hashPitch = 2.2 * RADIUS
  const hashNx = Math.ceil((nx * h) / hashPitch) + 1
  const hashNy = Math.ceil((ny * h) / hashPitch) + 1

  return {
    h,
    nx,
    ny,
    u: new Float32Array((nx + 1) * ny),
    v: new Float32Array(nx * (ny + 1)),
    uPrev: new Float32Array((nx + 1) * ny),
    vPrev: new Float32Array(nx * (ny + 1)),
    uW: new Float32Array((nx + 1) * ny),
    vW: new Float32Array(nx * (ny + 1)),
    type,
    density: new Float32Array(nx * ny),
    restDensity: 0,
    cap,
    n: 0,
    px: new Float32Array(cap),
    py: new Float32Array(cap),
    vx: new Float32Array(cap),
    vy: new Float32Array(cap),
    r: RADIUS,
    hashPitch,
    hashNx,
    hashNy,
    hashStart: new Int32Array(hashNx * hashNy + 1),
    hashItem: new Int32Array(cap),
  }
}

/**
 * Add a particle at every lattice site inside `shape`, over the box given.
 * Rows are staggered by half a pitch, which is the packing a pool settles
 * into anyway, so a fresh block of water does not immediately explode.
 */
function fill(
  f: Flip,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  shape: (x: number, y: number) => boolean,
) {
  const rowPitch = PITCH * 0.866
  const lo = f.h + f.r
  const hiX = (f.nx - 1) * f.h - f.r
  const hiY = (f.ny - 1) * f.h - f.r
  let row = 0
  for (let y = y0; y <= y1; y += rowPitch, row++) {
    for (let x = x0 + (row % 2 ? f.r : 0); x <= x1; x += PITCH) {
      if (f.n >= f.cap) return
      if (!shape(x, y)) continue
      f.px[f.n] = clamp(x, lo, hiX)
      f.py[f.n] = clamp(y, lo, hiY)
      f.vx[f.n] = 0
      f.vy[f.n] = 0
      f.n++
    }
  }
}

const always = () => true

export function fillRect(f: Flip, x0: number, y0: number, x1: number, y1: number) {
  fill(f, x0, y0, x1, y1, always)
}

export function fillDisc(f: Flip, cx: number, cy: number, r: number) {
  const r2 = r * r
  fill(f, cx - r, cy - r, cx + r, cy + r, (x, y) => {
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= r2
  })
}

/** Gravity, then move. The one place a particle position changes by velocity. */
function integrate(f: Flip, dt: number, gravity: number) {
  for (let p = 0; p < f.n; p++) {
    f.vy[p] += gravity * dt
    f.px[p] += f.vx[p] * dt
    f.py[p] += f.vy[p] * dt
  }
}

/**
 * Push overlapping particles apart.
 *
 * Without this the pressure solve alone lets particles pile onto each other
 * inside a cell: the grid sees the right density, the eye sees clumps and
 * holes. Two passes over a uniform hash is enough, and the hash is built
 * once per frame rather than once per pass.
 */
function separate(f: Flip) {
  const { hashStart, hashItem, hashNx, hashNy, hashPitch } = f
  hashStart.fill(0)
  const cellOf = (p: number) => {
    const i = clamp((f.px[p] / hashPitch) | 0, 0, hashNx - 1)
    const j = clamp((f.py[p] / hashPitch) | 0, 0, hashNy - 1)
    return j * hashNx + i
  }
  for (let p = 0; p < f.n; p++) hashStart[cellOf(p)]++
  let sum = 0
  for (let c = 0; c < hashNx * hashNy; c++) {
    sum += hashStart[c]
    hashStart[c] = sum
  }
  hashStart[hashNx * hashNy] = sum
  for (let p = 0; p < f.n; p++) {
    const c = cellOf(p)
    hashStart[c]--
    hashItem[hashStart[c]] = p
  }

  const minDist = 2 * f.r
  const minDist2 = minDist * minDist
  for (let pass = 0; pass < SEPARATE_ITERS; pass++) {
    for (let p = 0; p < f.n; p++) {
      const x = f.px[p]
      const y = f.py[p]
      const i0 = Math.max(((x / hashPitch) | 0) - 1, 0)
      const j0 = Math.max(((y / hashPitch) | 0) - 1, 0)
      const i1 = Math.min(((x / hashPitch) | 0) + 1, hashNx - 1)
      const j1 = Math.min(((y / hashPitch) | 0) + 1, hashNy - 1)
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const c = j * hashNx + i
          for (let k = hashStart[c]; k < hashStart[c + 1]; k++) {
            const q = hashItem[k]
            if (q === p) continue
            const dx = f.px[q] - x
            const dy = f.py[q] - y
            const d2 = dx * dx + dy * dy
            if (d2 > minDist2 || d2 === 0) continue
            const d = Math.sqrt(d2)
            // Half the correction each, and the pair is visited twice, so
            // the two particles end up exactly minDist apart.
            const s = (0.5 * (minDist - d)) / d
            f.px[p] -= dx * s
            f.py[p] -= dy * s
            f.px[q] += dx * s
            f.py[q] += dy * s
          }
        }
    }
  }
}

/** Keep every particle inside the wall ring and kill the velocity into it. */
function collide(f: Flip) {
  const lo = f.h + f.r
  const hiX = (f.nx - 1) * f.h - f.r
  const hiY = (f.ny - 1) * f.h - f.r
  for (let p = 0; p < f.n; p++) {
    if (f.px[p] < lo) {
      f.px[p] = lo
      f.vx[p] = 0
    } else if (f.px[p] > hiX) {
      f.px[p] = hiX
      f.vx[p] = 0
    }
    if (f.py[p] < lo) {
      f.py[p] = lo
      f.vy[p] = 0
    } else if (f.py[p] > hiY) {
      f.py[p] = hiY
      f.vy[p] = 0
    }
  }
}

/** Particle velocity onto the grid, plus the cell types and the density. */
function toGrid(f: Flip) {
  const { nx, ny, h, u, v, uW, vW, type, density } = f
  u.fill(0)
  v.fill(0)
  uW.fill(0)
  vW.fill(0)
  density.fill(0)
  for (let c = 0; c < type.length; c++) if (type[c] !== SOLID) type[c] = AIR

  const half = h / 2
  for (let p = 0; p < f.n; p++) {
    const x = f.px[p]
    const y = f.py[p]
    const ci = clamp((x / h) | 0, 0, nx - 1)
    const cj = clamp((y / h) | 0, 0, ny - 1)
    const c = cj * nx + ci
    if (type[c] === AIR) type[c] = FLUID

    stencil(x, y, 0, half, h, nx + 1, ny)
    for (let k = 0; k < 4; k++) {
      u[idx[k]] += f.vx[p] * wt[k]
      uW[idx[k]] += wt[k]
    }
    stencil(x, y, half, 0, h, nx, ny + 1)
    for (let k = 0; k < 4; k++) {
      v[idx[k]] += f.vy[p] * wt[k]
      vW[idx[k]] += wt[k]
    }
    stencil(x, y, half, half, h, nx, ny)
    for (let k = 0; k < 4; k++) density[idx[k]] += wt[k]
  }

  for (let k = 0; k < u.length; k++) if (uW[k] > 0) u[k] /= uW[k]
  for (let k = 0; k < v.length; k++) if (vW[k] > 0) v[k] /= vW[k]

  // A face on a wall carries no flow through it. The solve already refuses
  // to change these faces; this makes sure the value it reads there is 0
  // rather than whatever a particle sliding along the wall deposited.
  for (let j = 0; j < ny; j++)
    for (let i = 0; i <= nx; i++) {
      const left = i > 0 ? type[j * nx + i - 1] : SOLID
      const right = i < nx ? type[j * nx + i] : SOLID
      if (left === SOLID || right === SOLID) u[j * (nx + 1) + i] = 0
    }
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i < nx; i++) {
      const above = j > 0 ? type[(j - 1) * nx + i] : SOLID
      const below = j < ny ? type[j * nx + i] : SOLID
      if (above === SOLID || below === SOLID) v[j * nx + i] = 0
    }
}

/** The density a settled pool has, measured once from the opening block. */
function measureRest(f: Flip) {
  let sum = 0
  let count = 0
  for (let c = 0; c < f.type.length; c++)
    if (f.type[c] === FLUID) {
      sum += f.density[c]
      count++
    }
  if (count > 0) f.restDensity = sum / count
}

/**
 * The pointer, as a disc that hands its own velocity to the water.
 *
 * It ADDS that velocity rather than blending the water toward it. Blending
 * looks like the same thing and is not: a pointer that rests on the water
 * blends it toward zero, which makes the cursor a hole the water piles up
 * around. Adding leaves a still pointer doing exactly nothing, which is
 * what a force proportional to pointer speed means.
 *
 * It writes into the grid BEFORE the solve, so the solve cleans the result
 * up and a fast swipe cannot leave a divergent hole behind. The loop skips
 * the two outermost face rings, which belong to the wall.
 */
function applyPointer(f: Flip, p: Pointer) {
  if (!p.active) return
  const { nx, ny, h, u, v } = f
  const r2 = p.radius * p.radius
  const i0 = Math.max((((p.x - p.radius) / h) | 0) - 1, 2)
  const i1 = Math.min((((p.x + p.radius) / h) | 0) + 1, nx - 2)
  const j0 = Math.max((((p.y - p.radius) / h) | 0) - 1, 2)
  const j1 = Math.min((((p.y + p.radius) / h) | 0) + 1, ny - 2)

  for (let j = Math.max(j0 - 1, 1); j <= Math.min(j1 + 1, ny - 2); j++)
    for (let i = i0; i <= i1; i++) {
      const dx = i * h - p.x
      const dy = (j + 0.5) * h - p.y
      const d2 = dx * dx + dy * dy
      if (d2 > r2) continue
      const w = (1 - Math.sqrt(d2) / p.radius) * p.strength
      u[j * (nx + 1) + i] += p.vx * w
    }
  for (let j = j0; j <= j1; j++)
    for (let i = Math.max(i0 - 1, 1); i <= Math.min(i1 + 1, nx - 2); i++) {
      const dx = (i + 0.5) * h - p.x
      const dy = j * h - p.y
      const d2 = dx * dx + dy * dy
      if (d2 > r2) continue
      const w = (1 - Math.sqrt(d2) / p.radius) * p.strength
      v[j * nx + i] += p.vy * w
    }
}

/**
 * Make the grid divergence free, by Gauss-Seidel.
 *
 * Each fluid cell measures how much more flows out of it than in, and
 * pushes that error back out across the faces it shares with non-solid
 * neighbours. Sweeping this often enough is the pressure solve; over-
 * relaxation past 1 is what makes 40 sweeps enough.
 *
 * The drift term is the FLIP-specific part: a cell holding more particles
 * than a resting pool would gets an extra push outward, so the water keeps
 * its volume instead of slowly sinking into itself over a minute.
 */
function solve(f: Flip) {
  const { nx, ny, u, v, type, density, restDensity } = f
  for (let iter = 0; iter < SOLVE_ITERS; iter++) {
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const c = j * nx + i
        if (type[c] !== FLUID) continue
        const sx0 = type[c - 1] === SOLID ? 0 : 1
        const sx1 = type[c + 1] === SOLID ? 0 : 1
        const sy0 = type[c - nx] === SOLID ? 0 : 1
        const sy1 = type[c + nx] === SOLID ? 0 : 1
        const s = sx0 + sx1 + sy0 + sy1
        if (s === 0) continue

        const ul = j * (nx + 1) + i
        const vt = j * nx + i
        let div = u[ul + 1] - u[ul] + v[vt + nx] - v[vt]
        if (restDensity > 0) {
          const compression = density[c] - restDensity
          if (compression > 0) div -= DRIFT_K * compression
        }

        const p = (-div / s) * OVER_RELAX
        u[ul] -= sx0 * p
        u[ul + 1] += sx1 * p
        v[vt] -= sy0 * p
        v[vt + nx] += sy1 * p
      }
  }
}

/**
 * The grid back to the particles.
 *
 * Only faces the water actually reached take part, and the weights are
 * renormalised over those, so a particle at the surface is not dragged
 * toward zero by the empty air beside it.
 */
function fromGrid(f: Flip, ratio: number) {
  const { nx, ny, h, u, v, uPrev, vPrev, uW, vW } = f
  const half = h / 2
  for (let p = 0; p < f.n; p++) {
    const x = f.px[p]
    const y = f.py[p]

    stencil(x, y, 0, half, h, nx + 1, ny)
    let pic = 0
    let delta = 0
    let w = 0
    for (let k = 0; k < 4; k++) {
      const a = idx[k]
      if (uW[a] <= 0) continue
      pic += u[a] * wt[k]
      delta += (u[a] - uPrev[a]) * wt[k]
      w += wt[k]
    }
    if (w > 0) f.vx[p] = ratio * (f.vx[p] + delta / w) + (1 - ratio) * (pic / w)

    stencil(x, y, half, 0, h, nx, ny + 1)
    pic = 0
    delta = 0
    w = 0
    for (let k = 0; k < 4; k++) {
      const a = idx[k]
      if (vW[a] <= 0) continue
      pic += v[a] * wt[k]
      delta += (v[a] - vPrev[a]) * wt[k]
      w += wt[k]
    }
    if (w > 0) f.vy[p] = ratio * (f.vy[p] + delta / w) + (1 - ratio) * (pic / w)
  }
}

/** One fixed timestep. The caller runs this on a clock, never per frame. */
export function step(f: Flip, dt: number, params: Params) {
  if (f.n === 0) return
  integrate(f, dt, params.gravity)
  separate(f)
  collide(f)
  toGrid(f)
  if (f.restDensity === 0) measureRest(f)
  // The copy sits between the transfer and the pointer on purpose: the FLIP
  // change a particle reads back is then everything the grid did this frame,
  // the pointer's push included.
  f.uPrev.set(f.u)
  f.vPrev.set(f.v)
  applyPointer(f, params.pointer)
  solve(f)
  fromGrid(f, flipRatio(params.viscosity))
}
