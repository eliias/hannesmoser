import type { ComponentType } from 'react'
import type { Experiment } from '@/content/experiments'
import { SIZE, projectMarkCells } from '@/brand/mark'
import { inkRgba } from '@/lib/ink'

// Container B: the case study screen. Everything here sits above the body
// (meta row, title block, live-project link) and is identical between case
// studies — it is driven entirely by the Experiment record. The body itself
// (two-column prose, full-bleed figure, mixed row, technical detail list) is
// Task 3's, reviewed and approved; it is rendered as `body` and never
// touched here.
//
// This is the one scrolling surface in the app. The shell (components/
// Shell.tsx) never scrolls; this container does, on its own axis, so the
// mark rail and the timeline stay put while the article moves under them.
// Source: design_handoff_lab/Lab.dc.html:105-245, README.md "Container B".
interface ContainerBProps {
  experiment: Experiment
  body: ComponentType
}

export default function ContainerB({ experiment, body: Body }: ContainerBProps) {
  const host = experiment.link ? new URL(experiment.link).hostname : null

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <article className="mx-auto max-w-[1180px] px-6 pt-6 pb-8">
        <div className="flex items-baseline gap-4 font-mono text-xs tracking-[.06em] opacity-[var(--o-2)]">
          <span className="tabular-nums">{experiment.number}</span>
          <span className="tabular-nums">{experiment.date}</span>
          <span className="uppercase">case study</span>
        </div>

        <div
          className="mt-4 mb-5 flex items-end justify-between gap-6 pb-5"
          style={{
            borderBottom:
              'var(--hair) solid color-mix(in srgb, var(--ink) calc(var(--o-4) * 100%), transparent)',
          }}
        >
          <div>
            <h1 className="m-0 text-2xl leading-[.96] font-medium tracking-[-.03em]">
              {experiment.title}
            </h1>
            {experiment.lede && (
              <p className="mt-3 max-w-[44ch] text-lg leading-[1.25] font-normal tracking-[-.015em] opacity-[var(--o-2)]">
                {experiment.lede}
              </p>
            )}
          </div>
          <svg
            width={52}
            height={52}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
            className="block flex-none"
          >
            <g fill={inkRgba(1)}>
              {projectMarkCells(experiment.title).map(({ x, y, w, h, opacity }) => (
                <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} opacity={opacity} />
              ))}
            </g>
          </svg>
        </div>

        {experiment.link && host && (
          <a
            href={experiment.link}
            target="_blank"
            rel="noreferrer"
            className="mb-6 flex items-center justify-between gap-5 border-[var(--hair)] border-ink px-5 py-4"
          >
            <span className="text-lg font-medium tracking-[-.015em]">Open the live project</span>
            <span className="font-mono text-sm whitespace-nowrap opacity-[var(--o-2)]">
              {host} ↗
            </span>
          </a>
        )}

        <Body />
      </article>
    </div>
  )
}
