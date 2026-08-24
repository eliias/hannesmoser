'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import ContainerC from '@/components/ContainerC'
import { ControlButton, ControlSlider, ControlToggle } from '@/components/Control'
import { CELL as PAD, createFlip, fillDisc, fillRect, step } from '@/lib/flip'
import type { Flip } from '@/lib/flip'
import { createContour, splat, trace } from '@/lib/contour'
import type { Contour } from '@/lib/contour'
import { inkRgba, paperRgba } from '@/lib/ink'
import type { Experiment } from '@/content/experiments'

// Experiment 04 — Navier-Stokes.
//
// This component is the shell around two libraries. lib/flip.ts is the
// solver and lib/contour.ts is the renderer; neither knows what a canvas
// is. What lives here is everything that is not physics: the clock, the
// pointer, the device pixel ratio, and the four controls.
//
// COORDINATES: the solver's world is the canvas grown by one cell on every
// side, because that outer ring is its wall and the wall belongs outside
// the view. So sim (PAD, PAD) is canvas (0, 0). Two lines do the whole
// conversion: `track` adds PAD to a pointer position, and `draw` translates
// the context by -PAD before it fills the water. Nothing else converts.
//
// See ImageDissolve for why an experiment renders its own container.

const SIM = {
  /** 100 px is one metre, so 981 px/s² is earth. The slider scales it. */
  gravityEarth: 981,
  gravityDefault: 1,
  gravityMin: 0,
  gravityMax: 2,
  gravityStep: 0.05,
  viscosityDefault: 0.1,
  viscosityMin: 0,
  viscosityMax: 1,
  viscosityStep: 0.05,
  /** The solver takes fixed steps. Real elapsed time only decides how many. */
  dt: 1 / 60,
  /** A tab that was in the background comes back with seconds of debt. Drop it. */
  maxSteps: 3,
  /** The pointer disc: wider and stronger while the button is down. */
  pushRadiusIdle: 90,
  pushRadiusHeld: 120,
  pushStrengthIdle: 0.5,
  pushStrengthHeld: 0.9,
  /** A flick can cross the screen in two frames. Past this it is not water. */
  pushMaxSpeed: 1200,
  /** The opening pool, in fractions of the canvas. The water starts at the
      shape it settles into, and this is measured rather than taste.

      Any block seeded above the floor is a dam break, and a dam break
      throws a front at 2 * sqrt(g * h). A slab a quarter of the canvas deep
      makes that 970 px/s, which is enough to run 460 px up the side walls
      and hang there in streaks for three seconds. Lowering the block only
      lowers h. Removing the collapse removes the front: seeded like this,
      the wall and ceiling counts are zero at every sample over ten seconds.
      The gravity is still there, and DROP is where you see it. */
  seedX0: 0.01,
  seedX1: 0.99,
  seedY0: 0.75,
  seedY1: 1,
  /** DROP: a blob of about 250 particles, released high enough to splash. */
  dropRadius: 60,
  dropY: 0.15,
  /** the PARTICLES view */
  ghostFill: 0.1,
  ghostLine: 0.55,
  dotSize: 1.4,
} as const

type Sim = {
  canvas: HTMLCanvasElement
  frameEl: HTMLElement
  ctx: CanvasRenderingContext2D
  flip: Flip
  contour: Contour
  W: number
  H: number
  dpr: number
  /** in sim coordinates, so already offset by PAD */
  pointer: { x: number; y: number; prevX: number; prevY: number; down: boolean; over: boolean }
  /** the three React values, mirrored so the loop reads them without a closure */
  gravity: number
  viscosity: number
  particles: boolean
  /** leftover real time that has not been spent on a fixed step yet */
  acc: number
  last: number
  raf: number
}

/** A fresh tank with the opening block of water in it. Also what RESET does. */
function restart(s: Sim) {
  if (s.W < 1 || s.H < 1) return
  const f = createFlip(s.W, s.H)
  fillRect(
    f,
    PAD + s.W * SIM.seedX0,
    PAD + s.H * SIM.seedY0,
    PAD + s.W * SIM.seedX1,
    PAD + s.H * SIM.seedY1,
  )
  s.flip = f
  s.contour = createContour(f.nx * f.h, f.ny * f.h)
}

/** Re-measure the frame, resize the canvas, start the experiment over. */
function resize(s: Sim) {
  const r = s.frameEl.getBoundingClientRect()
  const W = Math.max(1, Math.floor(r.width))
  const H = Math.max(1, Math.floor(r.height))
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (W === s.W && H === s.H && dpr === s.dpr) return
  s.W = W
  s.H = H
  s.dpr = dpr
  // The backing store is in device pixels and the drawing is in CSS px.
  // Unlike experiment 03 this canvas draws curves, not a pixel buffer, so
  // the sharper edge costs the solver nothing.
  s.canvas.width = Math.round(W * dpr)
  s.canvas.height = Math.round(H * dpr)
  s.canvas.style.width = `${W}px`
  s.canvas.style.height = `${H}px`
  restart(s)
}

/** One fixed step, with the pointer velocity measured across exactly that step. */
function advance(s: Sim) {
  const p = s.pointer
  let vx = (p.x - p.prevX) / SIM.dt
  let vy = (p.y - p.prevY) / SIM.dt
  const speed = Math.hypot(vx, vy)
  if (speed > SIM.pushMaxSpeed) {
    const k = SIM.pushMaxSpeed / speed
    vx *= k
    vy *= k
  }
  p.prevX = p.x
  p.prevY = p.y

  step(s.flip, SIM.dt, {
    gravity: s.gravity * SIM.gravityEarth,
    viscosity: s.viscosity,
    pointer: {
      x: p.x,
      y: p.y,
      vx,
      vy,
      radius: p.down ? SIM.pushRadiusHeld : SIM.pushRadiusIdle,
      strength: p.down ? SIM.pushStrengthHeld : SIM.pushStrengthIdle,
      active: p.over,
    },
  })
}

function draw(s: Sim) {
  const { ctx, flip } = s
  splat(s.contour, flip.px, flip.py, flip.n)
  const path = trace(s.contour)

  ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
  ctx.fillStyle = paperRgba(1)
  ctx.fillRect(0, 0, s.W, s.H)
  ctx.translate(-PAD, -PAD)

  if (!s.particles) {
    ctx.fillStyle = inkRgba(1)
    // Even-odd, so a pocket of trapped air is a real hole in the water.
    ctx.fill(path, 'evenodd')
    return
  }

  // The PARTICLES view: the silhouette drops back to a hairline and the
  // particles the solver actually moves become visible.
  ctx.fillStyle = inkRgba(SIM.ghostFill)
  ctx.fill(path, 'evenodd')
  ctx.strokeStyle = inkRgba(SIM.ghostLine)
  ctx.lineWidth = 1
  ctx.stroke(path)
  const dots = new Path2D()
  const d = SIM.dotSize
  for (let p = 0; p < flip.n; p++) dots.rect(flip.px[p] - d / 2, flip.py[p] - d / 2, d, d)
  ctx.fillStyle = inkRgba(1)
  ctx.fill(dots)
}

/** rAF gives real time; the solver is only ever fed whole fixed steps. */
function frame(s: Sim, now: number) {
  const elapsed = (now - s.last) / 1000
  s.last = now
  s.acc += Math.min(elapsed, 0.1)
  let steps = 0
  while (s.acc >= SIM.dt && steps < SIM.maxSteps) {
    advance(s)
    s.acc -= SIM.dt
    steps++
  }
  if (steps === SIM.maxSteps) s.acc = 0
  draw(s)
}

interface NavierStokesProps {
  experiment: Experiment
  /** ContainerC attaches this to the title block; see the coupling contract there. */
  titleRef: RefObject<HTMLDivElement | null>
}

export default function NavierStokes({ experiment, titleRef }: NavierStokesProps) {
  // Explicit <number>: SIM is `as const`, so an inferred state type would be
  // the literal 1 / 0.1 and the sliders could never set anything else.
  const [gravity, setGravity] = useState<number>(SIM.gravityDefault)
  const [viscosity, setViscosity] = useState<number>(SIM.viscosityDefault)
  const [particles, setParticles] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const simRef = useRef<Sim | null>(null)

  // One effect owns every browser resource: the 2D context, the rAF loop
  // and the ResizeObserver. One setup, one cleanup.
  useEffect(() => {
    const canvas = canvasRef.current
    const frameEl = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !frameEl || !ctx) return

    const s: Sim = {
      canvas,
      frameEl,
      ctx,
      flip: createFlip(1, 1),
      contour: createContour(1, 1),
      W: 0,
      H: 0,
      dpr: 0,
      pointer: { x: -1e5, y: -1e5, prevX: -1e5, prevY: -1e5, down: false, over: false },
      gravity: SIM.gravityDefault,
      viscosity: SIM.viscosityDefault,
      particles: false,
      acc: 0,
      last: performance.now(),
      raf: 0,
    }
    simRef.current = s
    resize(s)

    const ro = new ResizeObserver(() => resize(s))
    ro.observe(frameEl)

    const tick = (now: number) => {
      s.raf = requestAnimationFrame(tick)
      frame(s, now)
    }
    s.raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(s.raf)
      ro.disconnect()
      simRef.current = null
    }
  }, [])

  // The two sliders are read live and must never restart the experiment:
  // moving GRAVITY mid-splash is the point of having it on a slider.
  useEffect(() => {
    const s = simRef.current
    if (s) s.gravity = gravity
  }, [gravity])

  useEffect(() => {
    const s = simRef.current
    if (s) s.viscosity = viscosity
  }, [viscosity])

  useEffect(() => {
    const s = simRef.current
    if (s) s.particles = particles
  }, [particles])

  const track = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current
    if (!s) return
    const r = s.canvas.getBoundingClientRect()
    const p = s.pointer
    p.x = e.clientX - r.left + PAD
    p.y = e.clientY - r.top + PAD
    // First frame back over the canvas: the jump from wherever the pointer
    // left is not a velocity, so start the measurement from here.
    if (!p.over) {
      p.prevX = p.x
      p.prevY = p.y
      p.over = true
    }
  }

  // The title fade belongs to the experiment, not to ContainerC.
  const fadeTitle = (o: string) => {
    if (titleRef.current) titleRef.current.style.opacity = o
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current
    if (!s) return
    track(e)
    s.pointer.down = true
    fadeTitle('0.18')
  }

  const onPointerUp = () => {
    const s = simRef.current
    if (s) s.pointer.down = false
    fadeTitle('1')
  }

  const onPointerLeave = () => {
    const s = simRef.current
    if (s) {
      s.pointer.down = false
      s.pointer.over = false
    }
    fadeTitle('1')
  }

  const controls = (
    <>
      <div className="flex gap-2">
        <ControlButton
          variant="primary"
          onClick={() => {
            const s = simRef.current
            if (!s) return
            // Where the pointer is, or the middle of the canvas when it is
            // somewhere else entirely.
            const x = s.pointer.over ? s.pointer.x : PAD + s.W / 2
            fillDisc(s.flip, x, PAD + s.H * SIM.dropY, SIM.dropRadius)
          }}
        >
          DROP
        </ControlButton>
        <ControlButton
          variant="tertiary"
          onClick={() => {
            const s = simRef.current
            if (s) restart(s)
          }}
        >
          RESET
        </ControlButton>
      </div>
      <ControlSlider
        label="GRAVITY"
        size="lg"
        min={SIM.gravityMin}
        max={SIM.gravityMax}
        step={SIM.gravityStep}
        value={gravity}
        onChange={setGravity}
      />
      <ControlSlider
        label="VISCOSITY"
        size="sm"
        min={SIM.viscosityMin}
        max={SIM.viscosityMax}
        step={SIM.viscosityStep}
        value={viscosity}
        onChange={setViscosity}
      />
      <ControlToggle label="PARTICLES" checked={particles} onChange={setParticles} />
    </>
  )

  return (
    <ContainerC experiment={experiment} titleRef={titleRef} controls={controls}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={track}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        className="absolute inset-0 block cursor-crosshair touch-none"
      />
    </ContainerC>
  )
}
