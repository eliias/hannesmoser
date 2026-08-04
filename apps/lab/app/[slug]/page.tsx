import type { Metadata } from 'next'
import ExperimentView from '@/components/ExperimentView'
import { bySlug, experiments } from '@/content/experiments'

// One static HTML file per experiment. This is what makes a deep link work:
// with `output: 'export'` there is no server to resolve a route at request
// time, so every path that should survive a reload has to exist on disk.
export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const e = bySlug(slug)
  return {
    title: `${e.title} — lab.hannesmoser.at`,
    description: e.lede ?? e.abstract,
  }
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ExperimentView slug={slug} />
}
