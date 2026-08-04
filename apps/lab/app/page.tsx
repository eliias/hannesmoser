'use client'

import { useRef, useState } from 'react'
import type { ComponentType } from 'react'
import Shell from '@/components/Shell'
import Timeline from '@/components/Timeline'
import ContainerB from '@/components/ContainerB'
import ImageDissolve from '@/components/ImageDissolve'
import { experiments } from '@/content/experiments'
import PostindexBody from '@/content/case-studies/postindex'
import RobovacBody from '@/content/case-studies/robovac'

// Case-study bodies, keyed by their Experiment title.
const CASE_STUDY_BODIES: Record<string, ComponentType> = {
  Postindex: PostindexBody,
  Robovac: RobovacBody,
}

// The branch order matters: `kind` decides the container, and a missing
// body is a bug, not a reason to fall through to a different experiment. An
// earlier draft checked `kind === 'case-study' && body`, so a case study
// added without a row in CASE_STUDY_BODIES silently rendered the particle
// canvas under its own title. Failing loudly here follows the precedent in
// brand/mark.ts's projectMarkCells, which throws on the same kind of miss.
function bodyFor(title: string): ComponentType {
  const body = CASE_STUDY_BODIES[title]
  if (!body) throw new Error(`page: no case-study body registered for "${title}"`)
  return body
}

// `active` sits here for now because the timeline needs a real owner for it,
// and the newest experiment is the one that loads first. `titleRef` is the
// ContainerA/experiment coupling contract: the container attaches it to the
// title block, the experiment writes its opacity on pointerdown.
//
// The 'live' branch is hardcoded to ImageDissolve because it is the only
// live experiment there is. A second one turns this into a lookup, the same
// shape as CASE_STUDY_BODIES above.
export default function Page() {
  const [active, setActive] = useState(experiments.length - 1)
  const titleRef = useRef<HTMLDivElement>(null)
  const experiment = experiments[active]

  return (
    <Shell nav={<Timeline experiments={experiments} active={active} onSelect={setActive} />}>
      {experiment.kind === 'case-study' ? (
        <ContainerB experiment={experiment} body={bodyFor(experiment.title)} />
      ) : (
        <ImageDissolve experiment={experiment} titleRef={titleRef} />
      )}
    </Shell>
  )
}
