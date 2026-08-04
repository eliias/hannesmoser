// Postindex case-study body: everything below ContainerB's meta row, title
// block and live-project link. Those are identical across case studies and
// owned by ContainerB, driven by the Experiment record.
//
// Written from the repo at ~/src/github.com/eliias/postindex. Citations:
//   roaring containers, 4096 promotion   crates/postindex-core/src/docset.rs:8,11,196
//   intersection per container pair      docs/specs/database.md:190-196
//   the fork-join write path             docs/engine.md:928-940, steps 7-10
//   ranges: candidates, not yet frozen   docs/specs/database.md:198-216
//   full-text has no tokenizer yet       TODO.md:28
//   the capability states below          TODO.md:20-33, verbatim column 2
//   query p95                            docs/engine.md:886-889
//   trace replay                         docs/plans/real-indexeddb-workload.md:98-103
//   zero third-party crates              crates/*/Cargo.toml
// The README's "10x" figure is deliberately absent: TODO.md:262 says not to
// publish it until the scale suite produces it consistently.
//
// The BKD tree is named as the plan, not as shipped. It appears nowhere in
// the repo yet, and the capability figure shows ranges at the faintest step.
//
// Mixed row: image LEFT, detail list RIGHT. Mirrored on Robovac (02) so
// consecutive visits do not read identically.

// Opacity carries the state, the same three steps the mark uses.
const WORKING = 1
const PARTIAL = 0.4
const ABSENT = 0.12

const CAPABILITIES = [
  { label: 'exact filters', state: WORKING },
  { label: 'durable writes', state: WORKING },
  { label: 'immutable segments', state: WORKING },
  { label: 'compaction', state: PARTIAL },
  { label: 'query plan', state: PARTIAL },
  { label: 'multi-tab', state: PARTIAL },
  { label: 'ranges, sort', state: ABSENT },
  { label: 'full-text', state: ABSENT },
]

const SPINE = 215
const LANE_TOP = 130
const LANE_BOTTOM = 300

export default function PostindexBody() {
  return (
    <>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(30ch,1fr))] gap-6">
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            The workload is filters. An issue tracker holds a few hundred thousand documents and
            almost every read is a conjunction over them: two tags, one of three statuses, an
            assignee, a date window. The documents themselves are small. What costs you is
            deciding which ones come back.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            So this is a filter engine before it is a database. Exact fields become posting lists
            held as roaring-style containers, sparse ones as sorted arrays and dense ones as
            bitmaps, promoted at 4096 entries. Intersection dispatches per container pair instead
            of materialising one dense bitmap, and a query can stream matching ids without ever
            building one. Segments are immutable and merge LSM-style. The catalog is a plain
            B-tree map, because it is small and stays in memory.
          </p>
        </div>
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            Against IndexedDB the argument is short. It is a key/value store with no way to
            intersect two filters, so you fetch candidates and filter them in JavaScript. Against
            SQLite compiled to WebAssembly it is much narrower, and not all in one direction:
            SQLite gives you a planner, joins and range scans today, and this gives you none of
            those yet. What it gives instead is a bitmap-shaped intersection path where a row
            store walks tuples.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            The costs are real. Rust on wasm32 with no third-party crates means the codecs, the
            checksums and the WAL framing are all hand written. A virtual filesystem six calls
            wide sits between the engine and OPFS, because wasm cannot hold a file handle itself,
            and the browser can kill the tab mid-write with no warning.
          </p>
        </div>
      </div>

      <figure className="m-0 mb-6">
        <svg
          viewBox="0 0 1200 420"
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
          role="img"
          aria-label="The write path forks. Rust validates and frames the record, then the WAL worker appends and flushes to OPFS while Rust builds the HOT delta at the same time. The two rejoin, and only then is the commit published and the client acknowledged."
          style={{ height: 'min(38vh, 380px)' }}
        >
          <text x="20" y="56" fontFamily="var(--mono)" fontSize="13" fill="var(--ink)" opacity="0.55">
            the write path
          </text>

          {/* main thread */}
          <rect x="20" y={SPINE - 40} width="170" height="80" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="36" y={SPINE - 8} fontFamily="var(--grotesk)" fontSize="17" fill="var(--ink)">
            main thread
          </text>
          <text x="36" y={SPINE + 16} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
            envelope
          </text>

          {/* rust validates and frames, then the path splits */}
          <line x1="190" y1={SPINE} x2="225" y2={SPINE} stroke="var(--ink)" strokeOpacity="0.32" />
          <rect x="225" y={SPINE - 40} width="210" height="80" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="241" y={SPINE - 8} fontFamily="var(--grotesk)" fontSize="17" fill="var(--ink)">
            engine · rust
          </text>
          <text x="241" y={SPINE + 16} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
            validate + frame spans
          </text>

          {/* fork */}
          <line x1="435" y1={SPINE} x2="460" y2={SPINE} stroke="var(--ink)" strokeOpacity="0.32" />
          <line x1="460" y1={LANE_TOP} x2="460" y2={LANE_BOTTOM} stroke="var(--ink)" strokeOpacity="0.32" />
          <line x1="460" y1={LANE_TOP} x2="500" y2={LANE_TOP} stroke="var(--ink)" strokeOpacity="0.32" />
          <line x1="460" y1={LANE_BOTTOM} x2="500" y2={LANE_BOTTOM} stroke="var(--ink)" strokeOpacity="0.32" />

          {/* lane: the wal worker appends and flushes */}
          <rect x="500" y={LANE_TOP - 40} width="240" height="80" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="516" y={LANE_TOP - 8} fontFamily="var(--grotesk)" fontSize="17" fill="var(--ink)">
            wal worker · ts
          </text>
          <text x="516" y={LANE_TOP + 16} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
            append + strict flush
          </text>
          <line x1="740" y1={LANE_TOP} x2="770" y2={LANE_TOP} stroke="var(--ink)" strokeOpacity="0.32" />
          <rect x="770" y={LANE_TOP - 40} width="120" height="80" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="786" y={LANE_TOP + 5} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)">
            opfs
          </text>

          {/* lane: rust builds the hot delta at the same time */}
          <rect x="500" y={LANE_BOTTOM - 40} width="240" height="80" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="516" y={LANE_BOTTOM - 8} fontFamily="var(--grotesk)" fontSize="17" fill="var(--ink)">
            engine · rust
          </text>
          <text x="516" y={LANE_BOTTOM + 16} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
            private HOT delta
          </text>

          {/* the two lanes are the same wall-clock window */}
          <line x1="620" y1={LANE_TOP + 44} x2="620" y2={LANE_BOTTOM - 44} stroke="var(--ink)" strokeOpacity="0.12" strokeDasharray="3 4" />
          <text
            x="632"
            y={SPINE + 4}
            fontFamily="var(--mono)"
            fontSize="12"
            fill="var(--ink)"
            opacity="0.55"
          >
            at the same time
          </text>

          {/* join: nothing publishes until both lanes finish */}
          <line x1="890" y1={LANE_TOP} x2="930" y2={LANE_TOP} stroke="var(--ink)" strokeOpacity="0.32" />
          <line x1="740" y1={LANE_BOTTOM} x2="930" y2={LANE_BOTTOM} stroke="var(--ink)" strokeOpacity="0.32" />
          <line x1="930" y1={LANE_TOP} x2="930" y2={LANE_BOTTOM} stroke="var(--ink)" strokeOpacity="0.32" />
          <line x1="930" y1={SPINE} x2="960" y2={SPINE} stroke="var(--ink)" strokeOpacity="0.32" />
          <path d="M954 210 L962 215 L954 220" fill="none" stroke="var(--ink)" strokeOpacity="0.55" />

          <rect x="960" y={SPINE - 40} width="200" height="80" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
          <text x="976" y={SPINE - 8} fontFamily="var(--grotesk)" fontSize="17" fill="var(--ink)">
            publish + ack
          </text>
          <text x="976" y={SPINE + 16} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
            in commit sequence
          </text>

          <text
            x="600"
            y="392"
            textAnchor="middle"
            fontFamily="var(--mono)"
            fontSize="12"
            fill="var(--ink)"
            opacity="0.55"
          >
            neither lane publishes alone · the commit waits for both
          </text>
        </svg>
        <figcaption className="mt-2 font-mono text-xs opacity-(--o-3)">
          Rust frames the record before the WAL worker may append it, then builds the HOT delta
          while that flush is in flight. The client hears nothing until both have finished.
        </figcaption>
      </figure>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(26ch,1fr))] items-start gap-6">
        <figure className="m-0">
          <svg
            viewBox="0 0 480 320"
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto w-full"
            role="img"
            aria-label="Current state. Exact filters, durable writes and immutable segments work. Compaction, the query plan and multi-tab are partial. Ranges, sort and full-text are specified but not built."
          >
            <text x="0" y="14" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.32">
              where it is
            </text>
            {CAPABILITIES.map((c, i) => {
              const y = 44 + i * 34
              return (
                <g key={c.label}>
                  <rect x="0" y={y - 11} width="14" height="14" fill="var(--ink)" fillOpacity={c.state} />
                  <text x="30" y={y} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)">
                    {c.label}
                  </text>
                  <line x1="0" y1={y + 13} x2="480" y2={y + 13} stroke="var(--ink)" strokeOpacity="0.12" />
                </g>
              )
            })}
            <text x="480" y={44} textAnchor="end" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.32">
              working
            </text>
            <text x="480" y={146} textAnchor="end" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.32">
              partial
            </text>
            <text x="480" y={248} textAnchor="end" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.32">
              specified
            </text>
          </svg>
        </figure>
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            Ranges are the next structure, and the plan is a BKD tree. The spec pushed back on
            picking one, on the grounds that reaching for a tree because established search
            engines use one is not by itself a reason, and that a browser, OPFS and a
            bitmap-heavy workload might want a different layout. BKD answers that on its own
            terms rather than by precedent: it bulk-loads into immutable blocks and merges the
            way the segments here already merge, which is the shape the engine is in anyway.
            Full-text sits behind it, specified, with no tokenizer yet.
          </p>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 font-mono text-xs tracking-[.04em]">
            <dt className="uppercase opacity-(--o-3)">stack</dt>
            <dd className="m-0">Rust (wasm32) · TypeScript · OPFS</dd>
            <dt className="uppercase opacity-(--o-3)">query</dt>
            <dd className="m-0 tabular-nums">11.41 ms p95 at 2,048 docs</dd>
            <dt className="uppercase opacity-(--o-3)">replay</dt>
            <dd className="m-0 tabular-nums">87,110 records · 49,769 reads</dd>
            <dt className="uppercase opacity-(--o-3)">started</dt>
            <dd className="m-0 tabular-nums">2026-07-31</dd>
            <dt className="uppercase opacity-(--o-3)">status</dt>
            <dd className="m-0">experimental · no stable API</dd>
          </dl>
        </div>
      </div>
    </>
  )
}
