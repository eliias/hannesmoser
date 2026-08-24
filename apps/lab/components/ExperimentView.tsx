'use client'

import { useRef } from 'react'
import type { ComponentType, RefObject } from 'react'
import ContainerB from '@/components/ContainerB'
import ImageDissolve from '@/components/ImageDissolve'
import NavierStokes from '@/components/NavierStokes'
import { bySlug } from '@/content/experiments'
import type { Experiment } from '@/content/experiments'
import PostindexBody from '@/content/case-studies/postindex'
import RobovacBody from '@/content/case-studies/robovac'

// Case-study bodies, keyed by slug.
const CASE_STUDY_BODIES: Record<string, ComponentType> = {
  postindex: PostindexBody,
  robovac: RobovacBody,
}

// Live experiments, keyed by slug. Every one of them takes the experiment
// and the title ref, and picks its own container.
const LIVE_BODIES: Record<
  string,
  ComponentType<{ experiment: Experiment; titleRef: RefObject<HTMLDivElement | null> }>
> = {
  'image-dissolve': ImageDissolve,
  'navier-stokes': NavierStokes,
}

// The branch order matters: `kind` decides the container, and a missing body
// is a bug, not a reason to fall through to a different experiment. An
// earlier draft checked `kind === 'case-study' && body`, so a case study
// added without a row here silently rendered the particle canvas under its
// own title. Failing loudly follows the precedent in brand/mark.ts.
function bodyFor<T>(table: Record<string, T>, slug: string): T {
  const body = table[slug]
  if (!body) throw new Error(`ExperimentView: no body registered for "${slug}"`)
  return body
}

// This is the only thing a route renders. The shell and the timeline live in
// the layout above it, so a navigation swaps this subtree and nothing else.
//
// `titleRef` is the container/experiment coupling contract: the container
// attaches it to the title block, the experiment writes its opacity on
// pointerdown. See ExperimentTitle.
export default function ExperimentView({ slug }: { slug: string }) {
  const titleRef = useRef<HTMLDivElement>(null)
  const experiment = bySlug(slug)

  if (experiment.kind === 'case-study') {
    return <ContainerB experiment={experiment} body={bodyFor(CASE_STUDY_BODIES, slug)} />
  }
  const Body = bodyFor(LIVE_BODIES, slug)
  return <Body experiment={experiment} titleRef={titleRef} />
}
