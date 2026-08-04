import ExperimentView from '@/components/ExperimentView'
import { newest } from '@/content/experiments'

// `/` serves the newest experiment, so the lab opens on something running
// rather than on an index screen. It renders the same subtree as
// `/<newest.slug>/`; both URLs are legitimate and the timeline marks the same
// item either way, because LabShell falls back to the newest when the path
// carries no slug.
export default function Page() {
  return <ExperimentView slug={newest.slug} />
}
