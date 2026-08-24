// The three experiments, oldest to newest. This is the order the timeline
// renders left to right; the newest entry (highest index) is the one that
// loads first.
//
// The two case studies are real projects and their dates are their first
// commit, read from the repos themselves. The handoff's dates (2026-02-11,
// 2026-04-28) were placeholders, as was its prose: it described postindex as
// a postal-code lookup and robovac as telemetry for a robot vacuum cleaner.
// Neither is what those projects are. Image dissolve carries the day it was
// built, which keeps the live experiment newest and therefore first on load.
export type Experiment = {
  slug: string // the URL. Stable and independent of `number`, because the
  // numbering already changed once when real dates reordered the row, and a
  // shared link must not rot when it happens again.
  number: string // "01", zero padded, rendered with tabular figures
  date: string // ISO publication date
  title: string // short, must fit the nav without truncation
  kind: 'live' | 'case-study'
  abstract: string // one line, timeline nav only
  link?: string // external URL, case studies only
  lede?: string // longer standfirst, a container's title block only (both
  // kinds). Distinct from `abstract`: each container gets its own sentence
  // here rather than a repeat of the nav line.
}

export const experiments: Experiment[] = [
  {
    slug: 'robovac',
    number: '01',
    date: '2026-07-30',
    title: 'Robovac',
    kind: 'case-study',
    abstract: 'Postgres autovacuum, computed instead of guessed',
    lede: 'Your table is fine. Your autovacuum settings are the ones Postgres shipped in 2005.',
    link: 'https://robovac.hannesmoser.at',
  },
  {
    slug: 'postindex',
    number: '02',
    date: '2026-07-31',
    title: 'Postindex',
    kind: 'case-study',
    abstract: 'A filter engine inside the browser tab',
    lede: 'A filter engine that runs in the browser tab. Rust on wasm32, posting lists as roaring containers, immutable segments over a virtual filesystem on OPFS.',
    link: 'https://postindex.linear.dev',
  },
  {
    slug: 'image-dissolve',
    number: '03',
    date: '2026-08-04',
    title: 'Image dissolve',
    kind: 'live',
    abstract: 'Particles, gravity, pulse waves',
    lede: 'Drop an image, push it with the pointer, let it fall apart into a cloud, then fire a pulse through it.',
  },
]

/** The one that loads at `/`. The row is oldest to newest, so it is the last. */
export const newest = experiments[experiments.length - 1]

/** Throws rather than 404s: every slug here is generated from this same list. */
export function bySlug(slug: string): Experiment {
  const found = experiments.find((e) => e.slug === slug)
  if (!found) throw new Error(`experiments: no experiment with slug "${slug}"`)
  return found
}

export const indexOfSlug = (slug: string) => experiments.findIndex((e) => e.slug === slug)
