import type { ReactNode } from 'react'
import Mark from '@/components/Mark'

// The frame every screen lives in: three rows on a full viewport, mark
// rail / content / navigation. The shell itself never scrolls; a
// container inside the content row may (Container B, a later task).
// Handoff: design_handoff_lab/README.md, "1. Shell (always present)".
interface ShellProps {
  /** Rendered into the navigation row (Task 7). */
  nav: ReactNode
  /** Rendered into the content row (Tasks 5 to 6). */
  children: ReactNode
}

export default function Shell({ nav, children }: ShellProps) {
  return (
    // grid-template-rows: auto minmax(0,1fr) auto — the middle row MUST
    // carry minmax(0,1fr). Without it the content row keeps its intrinsic
    // height and pushes the navigation off screen at a short viewport.
    <div className="grid h-screen w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-paper">
      <header className="flex items-start justify-between pt-5 px-6 pb-4">
        <Mark size={22} />
        <a
          href="https://www.hannesmoser.at"
          className="whitespace-nowrap font-mono text-xs tracking-[0.04em] text-ink opacity-[var(--o-2)]"
        >
          www.hannesmoser.at&nbsp;↗
        </a>
      </header>

      <main className="relative min-h-0 overflow-hidden">{children}</main>

      {nav}
    </div>
  )
}
