'use client'

import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Experiment } from '@/content/experiments'
import { inkRgba } from '@/lib/ink'
import { step, type Spring } from '@/lib/spring'

// The fisheye timeline. One requestAnimationFrame loop redistributes the row:
// the item under the cursor grows, its neighbours shrink, and the items always
// share exactly the rail width.
//
// THE RULE OF THIS FILE: after mount, item `width`, `transform`,
// `background-color`, `color` and the two child opacities belong to the loop
// alone. They are written to `element.style` through refs and never appear in
// JSX again. JSX sets `left` and `width` once, from the item index, for the
// static export and the first paint; those two values can never change, so
// React never rewrites them. Anything in JSX computed from `active` would be
// re-applied on every click and every arrow key, and would stomp the loop
// mid-flight. Source and reasoning: Lab.dc.html:390-470, inventory sections 3,
// 5 and 8.

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** The three elements the loop writes to, per item. */
type ItemEls = {
  el: HTMLButtonElement | null
  date: HTMLSpanElement | null
  abs: HTMLSpanElement | null
}

/** Position, width and reveal, per item. `null` until the first frame. */
type ItemSprings = { x: Spring | null; w: Spring | null; rv: Spring | null }

/**
 * Everything the loop reads and writes. It lives in one ref, never in state:
 * React state schedules a render, and a render is exactly what must not happen
 * 60 times a second.
 */
type View = {
  rail: HTMLDivElement | null
  items: ItemEls[]
  springs: ItemSprings[]
  /** Cursor x relative to the rail, `null` when the cursor is away. */
  px: number | null
  /** Mirror of the `active` prop, so the loop never closes over a stale one. */
  active: number
  /** Mirror of the item count. */
  count: number
  reduced: boolean
  /** Spring constants, read once from the tokens on mount. */
  k: number
  d: number
  kReveal: number
  dReveal: number
  /** --o-2 and --o-3, read once from the tokens on mount alongside the springs. */
  o2: number
  o3: number
  raf: number
}

/**
 * One frame. Reads the rail width first, then writes every item, so no write
 * in this function forces a reflow for a later read in the same frame.
 */
// The fisheye algorithm's own constants. Not design tokens: they describe the
// shape of the redistribution curve, not how the site looks, so a designer
// would never reach for them. Ported from Lab.dc.html:393-401, :411 and :456.
const FISHEYE = {
  /** Gaussian width as a fraction of one cell, with a floor in px. */
  sigmaScale: 0.85,
  sigmaFloor: 90,
  /** Width one full bump buys, and the active item's permanent bonus. */
  bumpWeight: 2.1,
  activeBonus: 0.3,
  /** Bump above which an item reveals its abstract. */
  revealAt: 0.4,
  /** Reveal above which the item's type flips from ink to paper. */
  inkFlipAt: 0.5,
  /**
   * How far the date's opacity climbs on reveal, upward from `--o-3`. This is
   * NOT `--o-2 - --o-3`: the endpoint is .50 and there is no token for it, so
   * the delta cannot be derived from the scale.
   */
  dateRevealGain: 0.18,
} as const

function frameBody(v: View) {
  const rail = v.rail
  const n = v.count
  if (!rail || n === 0) return

  const W = rail.clientWidth || 1
  const cell = W / n
  const sigma = Math.max(cell * FISHEYE.sigmaScale, FISHEYE.sigmaFloor)
  const active = clamp(v.active, 0, n - 1)

  // Gaussian bump per item, and the weight it buys. The active item carries a
  // small permanent bonus so the row leans toward it with the cursor away.
  const bump: number[] = []
  const weight: number[] = []
  let sum = 0
  for (let i = 0; i < n; i++) {
    const centre = (i + 0.5) * cell
    const b = v.px === null ? 0 : Math.exp(-Math.pow((v.px - centre) / sigma, 2))
    const w = 1 + FISHEYE.bumpWeight * b + (i === active ? FISHEYE.activeBonus : 0)
    bump.push(b)
    weight.push(w)
    sum += w
  }

  let x = 0
  for (let i = 0; i < n; i++) {
    const it = v.items[i]
    const targetWidth = (W * weight[i]) / sum
    // The x target is the running sum of target widths, not of animated
    // widths, so a lagging neighbour never drags the whole row with it.
    const targetX = x
    x += targetWidth
    if (!it || !it.el || !it.date || !it.abs) continue

    const s = v.springs[i] ?? (v.springs[i] = { x: null, w: null, rv: null })
    // Seed position and width from the geometry the static fallback actually
    // painted: n equal cells, item i at i * cell. Without this the springs
    // snap to their weighted targets on frame 1 and the row pops by up to
    // 100px one frame after first paint, because the fallback cannot carry
    // the active item's +0.3 bonus. Seeding changes the path, not the
    // destination. Reduced motion still snaps: step() assigns the target.
    if (s.x === null) s.x = { x: i * cell, v: 0 }
    if (s.w === null) s.w = { x: cell, v: 0 }
    s.x = step(s.x, targetX, v.k, v.d, v.reduced)
    s.w = step(s.w, targetWidth, v.k, v.d, v.reduced)
    s.rv = step(s.rv, bump[i] > FISHEYE.revealAt ? 1 : 0, v.kReveal, v.dReveal, v.reduced)
    const rv = clamp(s.rv.x, 0, 1)

    it.el.style.transform = `translate3d(${s.x.x.toFixed(2)}px,0,0)`
    it.el.style.width = `${Math.max(0, s.w.x).toFixed(2)}px`
    // This is the handoff from the static fallback to the loop: JSX put the
    // item at `left: calc(100% * i / n)`, the loop parks it at 0 and carries
    // it with `transform` from here on. Re-asserted every frame, as in the
    // prototype, so nothing can put the fallback back.
    it.el.style.left = '0px'
    // The abstract's full-reveal opacity IS --o-2, so it reads from the token.
    // The date's is not: it climbs from --o-3 to .50, and .50 is not on the
    // scale, so the gain stays an algorithm constant rather than a fake
    // derivation. `o3 + (o2 - o3) * rv` would reach .55, not .50.
    it.abs.style.opacity = (rv * v.o2).toFixed(3)
    it.el.style.backgroundColor = inkRgba(Number(rv.toFixed(3)))
    it.el.style.color = rv > FISHEYE.inkFlipAt ? 'var(--paper)' : 'var(--ink)'
    it.date.style.opacity = (v.o3 + FISHEYE.dateRevealGain * rv).toFixed(3)
  }
}

interface TimelineProps {
  /** Oldest to newest. The row renders in this order, left to right. */
  experiments: Experiment[]
  active: number
  onSelect: (i: number) => void
}

export default function Timeline({ experiments, active, onSelect }: TimelineProps) {
  const view = useRef<View>({
    rail: null,
    items: [],
    springs: [],
    px: null,
    active: 0,
    count: 0,
    reduced: false,
    k: 0,
    d: 0,
    kReveal: 0,
    dReveal: 0,
    o2: 0,
    o3: 0,
    raf: 0,
  })

  const n = experiments.length

  // The loop reads these two through the ref. Mirroring them here is what
  // lets the loop start once on mount and survive every later render.
  useEffect(() => {
    view.current.active = active
    view.current.count = n
  }, [active, n])

  useEffect(() => {
    const v = view.current
    const rail = v.rail
    if (!rail) return

    // Tokens are the interface: the spring constants come from the custom
    // properties, read once here rather than every frame.
    const tokens = getComputedStyle(rail)
    const token = (name: string) => Number.parseFloat(tokens.getPropertyValue(name))
    v.k = token('--spring-k')
    v.d = token('--spring-d')
    v.kReveal = token('--spring-k-reveal')
    v.dReveal = token('--spring-d-reveal')
    v.o2 = token('--o-2')
    v.o3 = token('--o-3')

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const readMotion = () => {
      v.reduced = motion.matches
    }
    readMotion()
    motion.addEventListener('change', readMotion)

    // Re-arm first, then draw, so one bad frame cannot end the loop.
    const frame = () => {
      v.raf = requestAnimationFrame(frame)
      frameBody(v)
    }
    v.raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(v.raf)
      v.raf = 0
      motion.removeEventListener('change', readMotion)
    }
  }, [])

  const slot = (i: number) => (view.current.items[i] ??= { el: null, date: null, abs: null })

  const setActive = (i: number) => {
    const idx = clamp(i, 0, n - 1)
    onSelect(idx)
    const el = view.current.items[idx]?.el
    if (el && document.activeElement !== el) el.focus({ preventScroll: true })
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const rail = view.current.rail
    if (!rail) return
    view.current.px = e.clientX - rail.getBoundingClientRect().left
  }

  const onPointerLeave = () => {
    view.current.px = null
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setActive(active + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive(active - 1)
    }
  }

  // Enter/Space live on the item button, not the nav, and act on that
  // button's own index. The nav-level handler used to act on `active`, which
  // is the wrong item once Tab has moved focus away from it. Live
  // experiments have no link, so this is a no-op and native activation
  // (the button's own click) selects the focused item instead.
  const onItemKeyDown = (i: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const link = experiments[i]?.link
    if (link) {
      e.preventDefault()
      window.open(link, '_blank', 'noreferrer')
    }
  }

  return (
    // Shell hands this slot into its grid row without a landmark, so the
    // element is ours to supply. The keyboard handler needs it anyway.
    <nav
      aria-label="Experiments"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative select-none border-t-[var(--hair)] border-ink bg-paper pt-4 [touch-action:pan-y]"
    >
      <div
        ref={(el) => {
          view.current.rail = el
        }}
        className="relative h-[var(--rail-h)] overflow-hidden"
      >
        {experiments.map((e, i) => (
          <button
            key={e.number}
            type="button"
            ref={(el) => {
              slot(i).el = el
            }}
            onClick={() => setActive(i)}
            onKeyDown={onItemKeyDown(i)}
            aria-current={i === active ? 'true' : undefined}
            // The only styles JSX ever sets on an item, and both are derived
            // from the index alone. They lay the row out for the static export
            // and for the first paint; the loop then owns the geometry.
            style={{ left: `calc(100% * ${i} / ${n})`, width: `calc(100% / ${n})` }}
            className="absolute top-0 flex h-full cursor-pointer flex-col justify-center gap-1 overflow-hidden border-0 bg-transparent px-4 pt-3 pb-4 text-left will-change-[transform,width]"
          >
            <span
              // bg-ink, not bg-current: the rule keeps the ink while the rest
              // of the item inverts to paper on reveal. It reads as part of the
              // rail rather than as a mark that flips with the fill.
              className={`absolute top-0 left-0 h-[var(--rule-active)] w-[calc(100%-var(--s-4))] bg-ink transition-opacity duration-[var(--dur-2)] ease-out ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span
              className={`text-xs tracking-[.08em] tabular-nums ${
                i === active ? 'opacity-[var(--o-2)]' : 'opacity-[var(--o-3)]'
              }`}
            >
              {e.number}
            </span>
            <span
              className={`text-md leading-[1.35] tracking-[-.02em] whitespace-nowrap ${
                i === active ? 'font-semibold' : 'font-normal'
              }`}
            >
              {e.title}
            </span>
            <span className="flex min-w-0 items-baseline gap-3">
              <span
                ref={(el) => {
                  slot(i).date = el
                }}
                className="flex-none font-mono text-xs whitespace-nowrap tabular-nums opacity-[var(--o-3)]"
              >
                {e.date}
              </span>
              <span
                ref={(el) => {
                  slot(i).abs = el
                }}
                className="flex-none text-xs leading-[1.5] whitespace-nowrap opacity-0"
              >
                {e.abstract}
              </span>
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
