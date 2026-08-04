// Robovac case-study body: everything below ContainerB's meta row, title
// block and live-project link. Those are identical across case studies and
// owned by ContainerB, driven by the Experiment record.
//
// Prose ported verbatim from design_handoff_lab/Lab.dc.html:176-245 (the
// Robovac <sc-if> block). The imagery below is the handoff's own
// placeholder: striped SVG blocks, not real screenshots.
//
// Mixed row: detail list LEFT, image RIGHT. Mirrored from Postindex (01) so
// consecutive visits do not read identically.
export default function RobovacBody() {
  return (
    <>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(30ch,1fr))] gap-6">
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            The robot speaks a local protocol and keeps roughly a week of runs. Everything past
            that was thrown away by the vendor app, so this one records it: a small collector on
            the network, a file per run, no cloud account in the path.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            Coverage is the only metric that turned out to matter. Runtime and dust volume are
            vanity; the question is which square metres were missed twice in a row.
          </p>
        </div>
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            Paths arrive as polylines with a heading and a confidence value. Rasterised at 5 cm
            they become a coverage field, and two runs differenced give a miss map — the whole
            interface is that difference, drawn in one ink.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            The floor plan is emergent: walls are wherever the robot stopped turning, accumulated
            over sixty runs.
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
              id="rv-s"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-45)"
            >
              <rect width="1" height="8" fill="var(--ink)" opacity="0.32" />
            </pattern>
          </defs>
          <rect width="1200" height="420" fill="url(#rv-s)" opacity="0.5" />
          <rect width="1200" height="420" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="24" y="34" fontFamily="var(--mono)" fontSize="13" fill="var(--ink)" opacity="0.55">
            screenshot — coverage map, full bleed, 1200×420
          </text>
        </svg>
        <figcaption className="mt-2 font-mono text-xs opacity-(--o-3)">
          Sixty runs accumulated; darker cells were cleaned more often.
        </figcaption>
      </figure>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(26ch,1fr))] items-start gap-6">
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            Run history is a column of tabular figures and nothing else. At a glance you read the
            pattern of a household, which is more information than a chart would give.
          </p>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 font-mono text-xs tracking-[.04em]">
            <dt className="uppercase opacity-(--o-3)">stack</dt>
            <dd className="m-0">Go collector · SQLite · Next.js</dd>
            <dt className="uppercase opacity-(--o-3)">runs</dt>
            <dd className="m-0 tabular-nums">1,240 recorded</dd>
            <dt className="uppercase opacity-(--o-3)">shipped</dt>
            <dd className="m-0 tabular-nums">2026-04-28</dd>
            <dt className="uppercase opacity-(--o-3)">status</dt>
            <dd className="m-0">live · running at home</dd>
          </dl>
        </div>
        <figure className="m-0">
          <svg viewBox="0 0 480 320" preserveAspectRatio="none" className="block h-auto w-full">
            <rect width="480" height="320" fill="url(#rv-s)" opacity="0.5" />
            <rect width="480" height="320" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
            <text x="16" y="28" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
              detail — run history, 480×320
            </text>
          </svg>
        </figure>
      </div>
    </>
  )
}
