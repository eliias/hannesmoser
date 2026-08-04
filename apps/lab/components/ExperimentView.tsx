'use client'

import { useRef } from 'react'
import type { ComponentType } from 'react'
import ContainerB from '@/components/ContainerB'
import ImageDissolve from '@/components/ImageDissolve'
import { bySlug } from '@/content/experiments'
import PostindexBody from '@/content/case-studies/postindex'
import RobovacBody from '@/content/case-studies/robovac'

// Case-study bodies, keyed by slug.
const CASE_STUDY_BODIES: Record<string, ComponentType> = {
  postindex: PostindexBody,
  robovac: RobovacBody,
}

// The branch order matters: `kind` decides the container, and a missing body
// is a bug, not a reason to fall through to a different experiment. An
// earlier draft checked `kind === 'case-study' && body`, so a case study
// added without a row here silently rendered the particle canvas under its
// own title. Failing loudly follows the precedent in brand/mark.ts.
function bodyFor(slug: string): ComponentType {
  const body = CASE_STUDY_BODIES[slug]
  if (!body) throw new Error(`ExperimentView: no case-study body registered for "${slug}"`)
  return body
}

// This is the only thing a route renders. The shell and the timeline live in
// the layout above it, so a navigation swaps this subtree and nothing else.
//
// `titleRef` is the ContainerA/experiment coupling contract: the container
// attaches it to the title block, the experiment writes its opacity on
// pointerdown. The 'live' branch is hardcoded to ImageDissolve because it is
// the only live experiment there is; a second one turns this into a lookup
// with the same shape as CASE_STUDY_BODIES.
export default function ExperimentView({ slug }: { slug: string }) {
  const titleRef = useRef<HTMLDivElement>(null)
  const experiment = bySlug(slug)

  if (experiment.kind === 'case-study') {
    return <ContainerB experiment={experiment} body={bodyFor(slug)} />
  }
  return <ImageDissolve experiment={experiment} titleRef={titleRef} />
}
