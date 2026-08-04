// Postindex case-study body: everything below ContainerB's meta row, title
// block and live-project link. Those are identical across case studies and
// owned by ContainerB, driven by the Experiment record.
//
// Prose ported verbatim from design_handoff_lab/Lab.dc.html:133-171 (the
// Postindex <sc-if> block). The imagery below is the handoff's own
// placeholder: striped SVG blocks, not real screenshots.
//
// Mixed row: image LEFT, detail list RIGHT. Mirrored on Robovac (02) so
// consecutive visits do not read identically.
export default function PostindexBody() {
  return (
    <>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(30ch,1fr))] gap-6">
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            The dataset is small enough to be honest about: roughly 2,900 postal codes, each
            with a district, a state, and a centroid. Everything else — prefix search, fuzzy
            match, ranking — is a build step that ships as one compressed payload and a tiny
            reader.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            The interesting constraint was latency, not size. A query has to resolve while the
            key is still travelling, which rules out asking anything of the network after first
            paint.
          </p>
        </div>
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            The index is a sorted key table plus a trigram bitset. Lookup walks the table, the
            bitset filters candidates, and results are scored by prefix depth. It fits in a
            worker and never blocks input.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            The map is a decoration that turned out to be useful: centroids at low precision,
            drawn as flat cells, so the result set has a shape.
          </p>
        </div>
      </div>

      <figure className="m-0 mb-6">
        <svg
          viewBox="0 0 1200 420"
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height: 'min(38vh, 380px)' }}
        >
          <defs>
            <pattern
              id="pi-s"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="1" height="8" fill="var(--ink)" opacity="0.32" />
            </pattern>
          </defs>
          <rect width="1200" height="420" fill="url(#pi-s)" opacity="0.5" />
          <rect width="1200" height="420" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="24" y="34" fontFamily="var(--mono)" fontSize="13" fill="var(--ink)" opacity="0.55">
            screenshot — search view, full bleed, 1200×420
          </text>
        </svg>
        <figcaption className="mt-2 font-mono text-xs opacity-(--o-3)">
          Query resolves on keydown; the map redraws from the same result set.
        </figcaption>
      </figure>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(26ch,1fr))] items-start gap-6">
        <figure className="m-0">
          <svg viewBox="0 0 480 320" preserveAspectRatio="none" className="block h-auto w-full">
            <rect width="480" height="320" fill="url(#pi-s)" opacity="0.5" />
            <rect width="480" height="320" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
            <text x="16" y="28" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
              detail — result row, 480×320
            </text>
          </svg>
        </figure>
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            Typography does the ranking work: the matched prefix is the only thing set in a
            heavier weight, and the district drops to a lighter step of the same ink.
          </p>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 font-mono text-xs tracking-[.04em]">
            <dt className="uppercase opacity-(--o-3)">stack</dt>
            <dd className="m-0">Astro · TypeScript · Web Worker</dd>
            <dt className="uppercase opacity-(--o-3)">payload</dt>
            <dd className="m-0 tabular-nums">184 kB brotli</dd>
            <dt className="uppercase opacity-(--o-3)">shipped</dt>
            <dd className="m-0 tabular-nums">2026-02-11</dd>
            <dt className="uppercase opacity-(--o-3)">status</dt>
            <dd className="m-0">live · maintained</dd>
          </dl>
        </div>
      </div>
    </>
  )
}
