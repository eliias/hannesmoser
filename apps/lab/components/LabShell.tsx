'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Shell from '@/components/Shell'
import Timeline from '@/components/Timeline'
import { experiments, indexOfSlug, newest } from '@/content/experiments'

// This lives in the ROOT LAYOUT, not in a page, and that placement is the
// whole point. Next keeps a layout mounted while sibling routes swap beneath
// it, so navigating between experiments never remounts the timeline: the rAF
// loop keeps running, the springs keep their velocity, and the row does not
// re-seed from the static fallback on every click. Move this into a page and
// every navigation restarts the animation.
//
// There is no `active` state anywhere. The URL is the state, which is what
// makes a deep link and a reload land in the same place.
export default function LabShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const slug = pathname.split('/').filter(Boolean)[0] ?? newest.slug
  const found = indexOfSlug(slug)
  // `/` serves the newest experiment, so an unknown segment resolves there
  // too rather than leaving the row with nothing marked.
  const active = found === -1 ? experiments.length - 1 : found

  return (
    <Shell nav={<Timeline experiments={experiments} active={active} />}>{children}</Shell>
  )
}
