import type { ReactNode, RefObject } from 'react'
import type { Experiment } from '@/content/experiments'

// Container A: the live experiment frame, then its control bar.
// Source: design_handoff_lab/README.md "Container A", Lab.dc.html:67-101.
//
// This component only builds the frame and the chrome around it. The
// experiment itself (the canvas, its particle system, its pointer handling)
// is `children` — Task 8's job, not this one.
//
// COUPLING CONTRACT, read this before wiring an experiment into `children`:
// the title block fades to opacity 0.18 on pointerdown and back to 1 on
// pointerup, but that fade belongs to the experiment, not to this container
// (the container has no pointer handlers at all). ContainerA only attaches
// `titleRef` to the title block element and puts the opacity transition on
// it. The experiment must hold the SAME ref and write
// `titleRef.current.style.opacity` directly on its own pointerdown/pointerup
// handlers. Do not add pointer handlers here — that would fight the
// experiment for the same style property.
interface ContainerAProps {
  experiment: Experiment
  /** See the coupling contract above. Attached to the title block element. */
  titleRef: RefObject<HTMLDivElement | null>
  /** The assembled control bar content, built from Control.tsx's primitives. */
  controls: ReactNode
  /** The experiment frame's content (Task 8's canvas). */
  children: ReactNode
}

export default function ContainerA({ experiment, titleRef, controls, children }: ContainerAProps) {
  return (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,1fr)_auto]">
      <div className="relative min-h-0 overflow-hidden">
        {children}

        <div
          ref={titleRef}
          className="pointer-events-none absolute top-2 left-6 max-w-[34ch] transition-opacity duration-[var(--dur-2)] ease-out"
        >
          <div className="flex items-baseline gap-3 font-mono text-xs tracking-[.06em] opacity-[var(--o-2)]">
            <span className="tabular-nums">{experiment.number}</span>
            <span className="tabular-nums">{experiment.date}</span>
            <span className="uppercase">live</span>
          </div>
          <h1 className="my-2 text-xl leading-[1.02] font-medium tracking-[-.025em]">
            {experiment.title}
          </h1>
          {/* The title block gets its own sentence (Lab.dc.html:77), distinct
              from the timeline's one-liner. Falls back to `abstract` when a
              live experiment has no `lede` yet, so the block never renders
              nothing rather than leaving a gap. */}
          <p className="m-0 text-sm leading-[1.5] opacity-[var(--o-2)]">
            {experiment.lede ?? experiment.abstract}
          </p>
        </div>

        <div className="pointer-events-none absolute top-2 right-6 font-mono text-xs tracking-[.06em] opacity-[var(--o-3)]">
          drop an image file anywhere
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 px-6 pt-3 pb-5">{controls}</div>
    </div>
  )
}
