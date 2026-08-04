'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import ContainerA from '@/components/ContainerA'
import { ControlButton, ControlSlider, ControlToggle } from '@/components/Control'
import { opacity as markOpacity } from '@/brand/mark'
import { INK, PAPER, inkRgba, paperRgba } from '@/lib/ink'
import type { Experiment } from '@/content/experiments'

// Experiment 03 — image dissolve.
// Source: design_handoff_lab/README.md "Experiment 03: image dissolve",
// Lab.dc.html:524-692, porting inventory §4.
//
// A source image becomes ~15k particles. One ImageData buffer, written
// through a Uint32Array view and committed once per frame with
// putImageData — never thousands of fillRect calls.
//
// WHY THIS COMPONENT RENDERS ContainerA, instead of sitting inside it:
// GRAVITY, GRAIN and INVERT are this experiment's own React state, and the
// control bar that sets them lives in a different DOM slot from the canvas
// (ContainerA's `controls` prop, not its `children`). One component cannot
// fill two slots of its own parent, so the experiment wraps the container
// and hands it both. The alternative, lifting the three values into the
// page, would put experiment state in a component that knows nothing about
// the experiment.

// Tuned simulation constants, not design tokens. They describe how the
// particles behave, not how the site looks, so they are deliberately not in
// tokens.css. See the plan's Global Constraints.
const SIM = {
  /** pointer repulsion, Lab.dc.html:623-636 */
  pushRadiusIdle: 90,
  pushRadiusHeld: 130,
  pushForceIdle: 1.1,
  pushForceHeld: 2.4,
  pushGain: 3,
  /** 'intact', the distortion mode: spring back home, Lab.dc.html:649-650 */
  homeK: 0.055,
  homeDamping: 0.87,
  /** 'fall', Lab.dc.html:620, 645-647 */
  gravityScale: 0.5,
  dragX: 0.994,
  dragY: 0.996,
  floorBounce: -0.22,
  floorFriction: 0.72,
  /** the pulse ring, Lab.dc.html:625, 637-643 */
  ringSpeed: 14,
  ringBand: 34,
  ringForce: 3.4,
  ringLift: 0.4,
  /** the particle build, Lab.dc.html:587-607 */
  fit: 0.82,
  minAlpha: 0.06,
  /** control ranges and their defaults, Lab.dc.html:274, 89, 93 */
  gravityDefault: 0.55,
  gravityMin: 0,
  gravityMax: 1.6,
  gravityStep: 0.05,
  grainDefault: 4,
  grainMin: 2,
  grainMax: 7,
  /** the 16-step colour lookup, Lab.dc.html:656-661 */
  lutSteps: 16,
} as const

// The placeholder source: the lab mark plus a typed label, drawn on canvas
// until the user drops a file (Lab.dc.html:536-559). These numbers are
// neither physics nor design tokens — they are artwork, laid out against
// this bitmap's own 760x520 box. The opacity rule is the mark's one rule,
// imported rather than written a second time.
const SOURCE = {
  w: 760,
  h: 520,
  cell: 68,
  gap: 24,
  top: 70,
  title: 'IMAGE DISSOLVE',
  titleSize: 34,
  titleY: 470,
  caption: 'sample source — drop your own',
  captionSize: 14,
  captionY: 500,
} as const

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** Parallel arrays, one slot per particle: position, home, velocity, ink alpha. */
type Particles = {
  n: number
  x: Float32Array
  y: Float32Array
  hx: Float32Array
  hy: Float32Array
  vx: Float32Array
  vy: Float32Array
  a: Float32Array
}

function particles(cap: number): Particles {
  return {
    n: 0,
    x: new Float32Array(cap),
    y: new Float32Array(cap),
    hx: new Float32Array(cap),
    hy: new Float32Array(cap),
    vx: new Float32Array(cap),
    vy: new Float32Array(cap),
    a: new Float32Array(cap),
  }
}

/**
 * Everything the loop touches at 60fps. None of it is React state: a
 * re-render per frame is exactly what this experiment cannot afford, and
 * the timeline is already animating in the same frame. Inventory §5.
 */
type Sim = {
  canvas: HTMLCanvasElement
  frameEl: HTMLElement
  ctx: CanvasRenderingContext2D
  /** the one pixel buffer, and the one 32-bit view over it */
  image: ImageData
  u32: Uint32Array
  W: number
  H: number
  /** the source's own pixels, replaced by a dropped file */
  src: HTMLCanvasElement | HTMLImageElement
  P: Particles
  /** sample pitch in source pixels; particles draw as (step - 1) px blocks */
  step: number
  phase: 'intact' | 'fall'
  /** pulse ring radius; -1 means no ring */
  pulse: number
  pointer: { x: number; y: number; down: boolean }
  lut: Uint32Array
  bg: number
  /** the three React values, mirrored here so the loop reads them without a closure */
  gravity: number
  grain: number
  invert: boolean
  /** the blob URL of the dropped image, so it can be revoked */
  url: string | null
  raf: number
}

/**
 * One ink alpha as a 32-bit little-endian RGBA word, for the Uint32Array
 * view. The colour is the site's single ink over paper — the source's own
 * colours are dropped on purpose. INVERT swaps the pair.
 */
function packed(alpha: number, invert: boolean): number {
  const ink = invert ? PAPER : INK
  const paper = invert ? INK : PAPER
  const r = Math.round(paper[0] + (ink[0] - paper[0]) * alpha)
  const g = Math.round(paper[1] + (ink[1] - paper[1]) * alpha)
  const b = Math.round(paper[2] + (ink[2] - paper[2]) * alpha)
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}

function lutFor(invert: boolean): Uint32Array {
  const lut = new Uint32Array(SIM.lutSteps)
  for (let q = 0; q < SIM.lutSteps; q++) lut[q] = packed((q + 1) / SIM.lutSteps, invert)
  return lut
}

/** The lab mark plus a typed label, on its own canvas. Colours and fonts are tokens. */
function defaultSource(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = SOURCE.w
  c.height = SOURCE.h
  const x = c.getContext('2d')
  if (!x) return c

  const css = getComputedStyle(document.documentElement)
  const grotesk = css.getPropertyValue('--grotesk').trim() || 'sans-serif'
  const mono = css.getPropertyValue('--mono').trim() || 'monospace'
  const dim = Number(css.getPropertyValue('--o-3')) || 0.32

  x.fillStyle = paperRgba(1)
  x.fillRect(0, 0, SOURCE.w, SOURCE.h)
  x.fillStyle = inkRgba(1)

  const pitch = SOURCE.cell + SOURCE.gap
  const ox = (SOURCE.w - (pitch * 3 + SOURCE.cell)) / 2
  for (let r = 0; r < 4; r++)
    for (let c2 = 0; c2 < 4; c2++) {
      x.globalAlpha = markOpacity(r, c2)
      x.fillRect(ox + c2 * pitch, SOURCE.top + r * pitch, SOURCE.cell, SOURCE.cell)
    }

  x.globalAlpha = 1
  x.textAlign = 'center'
  x.font = `500 ${SOURCE.titleSize}px ${grotesk}`
  x.fillText(SOURCE.title, SOURCE.w / 2, SOURCE.titleY)
  x.globalAlpha = dim
  x.font = `400 ${SOURCE.captionSize}px ${mono}`
  x.fillText(SOURCE.caption, SOURCE.w / 2, SOURCE.captionY)
  return c
}

/**
 * Source pixels to particles. The source is fitted into the frame, drawn to
 * an offscreen canvas, then sampled every `grain` pixels. A sample darker
 * than the floor becomes one particle that remembers where it came from;
 * its ink alpha is `1 - luminance`, so the image dissolves into the site's
 * one ink instead of keeping its own colours. Lab.dc.html:583-613.
 */
function build(s: Sim) {
  if (s.W < 1 || s.H < 1) return
  const sw = s.src instanceof HTMLImageElement ? s.src.naturalWidth : s.src.width
  const sh = s.src instanceof HTMLImageElement ? s.src.naturalHeight : s.src.height
  if (!sw || !sh) return

  const scale = Math.min(s.W / sw, s.H / sh) * SIM.fit
  const dw = Math.max(2, Math.floor(sw * scale))
  const dh = Math.max(2, Math.floor(sh * scale))
  const t = document.createElement('canvas')
  t.width = dw
  t.height = dh
  const tx = t.getContext('2d')
  if (!tx) return
  tx.drawImage(s.src, 0, 0, dw, dh)
  const data = tx.getImageData(0, 0, dw, dh).data

  const step = clamp(s.grain, SIM.grainMin, SIM.grainMax)
  const offX = (s.W - dw) / 2
  const offY = (s.H - dh) / 2
  const cols = Math.floor(dw / step)
  const rows = Math.floor(dh / step)
  const P = particles(cols * rows)

  let k = 0
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const sx = c * step
      const sy = r * step
      const i = (sy * dw + sx) * 4
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      const a = (1 - lum) * (data[i + 3] / 255)
      if (a < SIM.minAlpha) continue
      P.hx[k] = P.x[k] = offX + sx
      P.hy[k] = P.y[k] = offY + sy
      P.a[k] = a
      k++
    }
  P.n = k

  s.P = P
  s.step = step
  s.phase = 'intact'
  s.pulse = -1
}

/** Re-measure the frame, resize the canvas and the pixel buffer, rebuild. */
function resize(s: Sim) {
  const r = s.frameEl.getBoundingClientRect()
  const W = Math.max(1, Math.floor(r.width))
  const H = Math.max(1, Math.floor(r.height))
  if (W === s.W && H === s.H) return
  s.W = W
  s.H = H
  // No devicePixelRatio scaling: the prototype has none, so this is soft on
  // a retina screen. Known and accepted, see the handoff's "Unfinished".
  s.canvas.width = W
  s.canvas.height = H
  s.canvas.style.width = `${W}px`
  s.canvas.style.height = `${H}px`
  s.image = s.ctx.createImageData(W, H)
  s.u32 = new Uint32Array(s.image.data.buffer)
  build(s)
}

/** One frame: forces, then integrate, then blit the whole buffer at once. */
function frame(s: Sim) {
  const P = s.P
  const W = s.W
  const H = s.H
  const g = s.gravity * SIM.gravityScale
  const falling = s.phase === 'fall'
  const px = s.pointer.x
  const py = s.pointer.y
  const R = s.pointer.down ? SIM.pushRadiusHeld : SIM.pushRadiusIdle
  const F = s.pointer.down ? SIM.pushForceHeld : SIM.pushForceIdle

  let ring = -1
  if (s.pulse >= 0) {
    s.pulse += SIM.ringSpeed
    ring = s.pulse
    if (ring > W + H) s.pulse = -1
  }
  const cx = W / 2
  const cy = H / 2

  for (let i = 0; i < P.n; i++) {
    let x = P.x[i]
    let y = P.y[i]
    let vx = P.vx[i]
    let vy = P.vy[i]

    const dx = x - px
    const dy = y - py
    const d2 = dx * dx + dy * dy
    if (d2 < R * R) {
      const d = Math.sqrt(d2) || 1
      const f = (1 - d / R) * F
      vx += (dx / d) * f * SIM.pushGain
      vy += (dy / d) * f * SIM.pushGain
    }

    if (ring > 0) {
      const rdx = x - cx
      const rdy = y - cy
      const rd = Math.sqrt(rdx * rdx + rdy * rdy) || 1
      const off = Math.abs(rd - ring)
      if (off < SIM.ringBand) {
        const f = (1 - off / SIM.ringBand) * SIM.ringForce
        vx += (rdx / rd) * f
        vy += (rdy / rd) * f - SIM.ringLift
      }
    }

    if (falling) {
      vy += g
      vx *= SIM.dragX
      vy *= SIM.dragY
      if (y > H - 1) {
        y = H - 1
        vy *= SIM.floorBounce
        vx *= SIM.floorFriction
      }
    } else {
      vx += (P.hx[i] - x) * SIM.homeK
      vy += (P.hy[i] - y) * SIM.homeK
      vx *= SIM.homeDamping
      vy *= SIM.homeDamping
    }

    x += vx
    y += vy
    P.x[i] = x
    P.y[i] = y
    P.vx[i] = vx
    P.vy[i] = vy
  }

  const u32 = s.u32
  const lut = s.lut
  const block = Math.max(1, s.step - 1)
  u32.fill(s.bg)
  for (let i = 0; i < P.n; i++) {
    const x0 = P.x[i] | 0
    const y0 = P.y[i] | 0
    if (x0 < 0 || y0 < 0 || x0 + block >= W || y0 + block >= H) continue
    const col = lut[clamp((P.a[i] * SIM.lutSteps) | 0, 0, SIM.lutSteps - 1)]
    for (let yy = 0; yy < block; yy++) {
      const idx = (y0 + yy) * W + x0
      for (let xx = 0; xx < block; xx++) u32[idx + xx] = col
    }
  }
  s.ctx.putImageData(s.image, 0, 0)
}

interface ImageDissolveProps {
  experiment: Experiment
  /** ContainerA attaches this to the title block; see the coupling contract there. */
  titleRef: RefObject<HTMLDivElement | null>
}

export default function ImageDissolve({ experiment, titleRef }: ImageDissolveProps) {
  // Explicit <number>: SIM is `as const`, so an inferred state type would be
  // the literal 0.55 / 4 and the sliders could never set anything else.
  const [gravity, setGravity] = useState<number>(SIM.gravityDefault)
  const [grain, setGrain] = useState<number>(SIM.grainDefault)
  const [invert, setInvert] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const simRef = useRef<Sim | null>(null)

  // One effect owns every browser resource this experiment holds: the 2D
  // context, the pixel buffer, the rAF loop, the ResizeObserver, the frame's
  // drop listeners and the blob URL. One setup, one cleanup. The prototype
  // creates the observer in a ref callback and disconnects it somewhere else
  // (inventory §8); that split is the bug this shape avoids.
  useEffect(() => {
    const canvas = canvasRef.current
    const frameEl = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !frameEl || !ctx) return

    const s: Sim = {
      canvas,
      frameEl,
      ctx,
      image: ctx.createImageData(1, 1),
      u32: new Uint32Array(1),
      W: 0,
      H: 0,
      src: defaultSource(),
      P: particles(0),
      step: SIM.grainDefault,
      phase: 'intact',
      pulse: -1,
      pointer: { x: -1e5, y: -1e5, down: false },
      lut: lutFor(false),
      bg: packed(0, false),
      gravity: SIM.gravityDefault,
      grain: SIM.grainDefault,
      invert: false,
      url: null,
      raf: 0,
    }
    simRef.current = s
    resize(s)

    // Guards img.onload below: if the component unmounts while a dropped
    // image is still decoding, the handler would otherwise rebuild onto a
    // simulation object this effect already discarded.
    let alive = true

    const ro = new ResizeObserver(() => resize(s))
    ro.observe(frameEl)

    const tick = () => {
      s.raf = requestAnimationFrame(tick)
      frame(s)
    }
    s.raf = requestAnimationFrame(tick)

    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer?.files?.[0]
      if (!f || !f.type.startsWith('image/')) return
      // The prototype never revokes this URL (inventory §8). Revoke the
      // previous one here and the current one on unmount, so repeated drops
      // do not pin every image ever dropped.
      if (s.url) URL.revokeObjectURL(s.url)
      s.url = URL.createObjectURL(f)
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        s.src = img
        build(s)
      }
      img.src = s.url
    }
    frameEl.addEventListener('dragover', onDragOver)
    frameEl.addEventListener('drop', onDrop)

    return () => {
      alive = false
      cancelAnimationFrame(s.raf)
      ro.disconnect()
      frameEl.removeEventListener('dragover', onDragOver)
      frameEl.removeEventListener('drop', onDrop)
      if (s.url) URL.revokeObjectURL(s.url)
      simRef.current = null
    }
  }, [])

  // The three React values, mirrored into the loop's object. GRAIN is the
  // sample pitch, so a change there rebuilds the particle set — that is the
  // control's whole point. GRAVITY is read live, and must not rebuild, or
  // moving the slider mid-fall would put every particle back home.
  useEffect(() => {
    const s = simRef.current
    if (s) s.gravity = gravity
  }, [gravity])

  useEffect(() => {
    const s = simRef.current
    if (!s || s.grain === grain) return
    s.grain = grain
    build(s)
  }, [grain])

  useEffect(() => {
    const s = simRef.current
    if (!s || s.invert === invert) return
    s.invert = invert
    s.lut = lutFor(invert)
    s.bg = packed(0, invert)
  }, [invert])

  const track = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current
    if (!s) return
    const r = s.canvas.getBoundingClientRect()
    s.pointer.x = e.clientX - r.left
    s.pointer.y = e.clientY - r.top
  }

  // The title fade belongs to the experiment, not to ContainerA: the
  // container only attaches the ref and carries the transition. Writing the
  // style directly keeps a 60fps pointer out of React's render path.
  const fadeTitle = (o: string) => {
    if (titleRef.current) titleRef.current.style.opacity = o
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = simRef.current
    if (!s) return
    s.pointer.down = true
    track(e)
    fadeTitle('0.18')
  }

  const onPointerUp = () => {
    const s = simRef.current
    if (s) {
      s.pointer.down = false
      s.pointer.x = -1e5
      s.pointer.y = -1e5
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
            if (s) s.phase = 'fall'
          }}
        >
          DISSOLVE
        </ControlButton>
        <ControlButton
          variant="secondary"
          onClick={() => {
            const s = simRef.current
            if (s) s.pulse = 0
          }}
        >
          PULSE
        </ControlButton>
        <ControlButton
          variant="tertiary"
          onClick={() => {
            const s = simRef.current
            if (s) build(s)
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
        label="GRAIN"
        size="sm"
        min={SIM.grainMin}
        max={SIM.grainMax}
        step={1}
        value={grain}
        onChange={setGrain}
      />
      <ControlToggle label="INVERT" checked={invert} onChange={setInvert} />
    </>
  )

  return (
    <ContainerA experiment={experiment} titleRef={titleRef} controls={controls}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={track}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-0 block cursor-crosshair touch-none"
      />
    </ContainerA>
  )
}
