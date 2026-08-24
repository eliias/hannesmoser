import type { ReactNode, RefObject } from 'react'
import ExperimentTitle from '@/components/ExperimentTitle'
import type { Experiment } from '@/content/experiments'

// Container C: one canvas, edge to edge, with the chrome floating on it.
//
// It exists because ContainerA gives its control bar a row of its own, and
// a row of its own is exactly what experiment 04 cannot have: the water
// settles at the bottom of the canvas, so the canvas has to run all the way
// down to the navigation. Adding a mode flag to ContainerA would braid two
// layouts into one component; this is the same amount of code with the two
// layouts kept apart.
//
// Title left, controls right, both along the top. The controls are at the
// top and not at the bottom for one reason: the pool is black and the type
// is black, and the pool lives at the bottom.
//
// COUPLING CONTRACT: see ExperimentTitle. The container attaches the ref
// and owns the transition; the experiment writes the opacity.
interface ContainerCProps {
  experiment: Experiment
  titleRef: RefObject<HTMLDivElement | null>
  /** The assembled control bar content, built from Control.tsx's primitives. */
  controls: ReactNode
  /** The experiment's canvas. */
  children: ReactNode
}

export default function ContainerC({
  experiment,
  titleRef,
  controls,
  children,
}: ContainerCProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {children}

      <ExperimentTitle experiment={experiment} titleRef={titleRef} />

      {/* pointer-events-none on the wrapper, auto on the bar: the pointer
          drives the water, and only the controls themselves may take it
          away from the canvas underneath. */}
      <div className="pointer-events-none absolute top-2 right-6 left-6 flex justify-end">
        <div className="pointer-events-auto flex max-w-[62%] flex-wrap items-center justify-end gap-5">
          {controls}
        </div>
      </div>
    </div>
  )
}
