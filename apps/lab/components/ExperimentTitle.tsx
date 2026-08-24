import type { RefObject } from 'react'
import type { Experiment } from '@/content/experiments'

// The title block of a live experiment: number, date, kind, title, lede.
// Source: design_handoff_lab/README.md "Container A", Lab.dc.html:77.
//
// It lives here rather than inside ContainerA because two containers now
// need the same block. ContainerA stacks the canvas over its control bar;
// ContainerC floats the chrome on a full-bleed canvas. The block itself is
// the same one in both, so it is written once.
//
// COUPLING CONTRACT: the container attaches `titleRef` and carries the
// opacity transition; the experiment writes `titleRef.current.style.opacity`
// on its own pointerdown and pointerup. Read the longer note in ContainerA.
interface ExperimentTitleProps {
  experiment: Experiment
  titleRef: RefObject<HTMLDivElement | null>
}

export default function ExperimentTitle({ experiment, titleRef }: ExperimentTitleProps) {
  return (
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
  )
}
