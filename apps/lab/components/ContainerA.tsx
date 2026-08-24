import type { ReactNode, RefObject } from 'react'
import ExperimentTitle from '@/components/ExperimentTitle'
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

        <ExperimentTitle experiment={experiment} titleRef={titleRef} />

        <div className="pointer-events-none absolute top-2 right-6 font-mono text-xs tracking-[.06em] opacity-[var(--o-3)]">
          drop an image file anywhere
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 px-6 pt-3 pb-5">{controls}</div>
    </div>
  )
}
