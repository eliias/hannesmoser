// The three experiments, oldest to newest. This is the order the timeline
// renders left to right; the newest entry (highest index) is the one that
// loads first. Source: design_handoff_lab/lab-prototype/content/experiments.json.
export type Experiment = {
  number: string // "01", zero padded, rendered with tabular figures
  date: string // ISO publication date
  title: string // short, must fit the nav without truncation
  kind: 'live' | 'case-study'
  abstract: string // one line, timeline nav only
  link?: string // external URL, case studies only
  lede?: string // longer standfirst, a container's title block only (both
  // kinds). Distinct from `abstract`: Lab.dc.html:77/116/187 give each
  // container its own sentence here, not a repeat of the nav line.
}

export const experiments: Experiment[] = [
  {
    number: '01',
    date: '2026-02-11',
    title: 'Postindex',
    kind: 'case-study',
    abstract: 'Static postal index, sub-frame queries',
    lede: 'A static index of every Austrian postal district, queryable in under a frame — no server, no database.',
    link: 'https://postindex.hannesmoser.at',
  },
  {
    number: '02',
    date: '2026-04-28',
    title: 'Robovac',
    kind: 'case-study',
    abstract: 'Local telemetry and coverage maps',
    lede: 'Local telemetry for a vacuum robot: coverage maps, run history, and a floor plan it drew itself.',
    link: 'https://robovac.hannesmoser.at',
  },
  {
    number: '03',
    date: '2026-07-19',
    title: 'Image dissolve',
    kind: 'live',
    abstract: 'Particles, gravity, pulse waves',
    lede: 'Drop an image, push it with the pointer, let it fall apart into a cloud, then fire a pulse through it.',
  },
]
