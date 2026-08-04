// Robovac case-study body: everything below ContainerB's meta row, title
// block and live-project link. Those are identical across case studies and
// owned by ContainerB, driven by the Experiment record.
//
// Written from the repo at ~/src/github.com/eliias/robovac and from the
// deployed site. Citations:
//   the trigger formula                lib/core/model.ts:27-29
//   the token bucket, 55/25/20 mix     lib/core/model.ts:54-66, :37-42 (stated assumption)
//   cost-limit ladder, delay fallback  lib/core/optimize.ts:46, :343-364
//   sense / classify / solve / prove   lib/core/optimize.ts, section headers
//   gates 1, 2 and 4                   lib/core/optimize.ts:422-451, :474-499
//   "Kept current: the proposal would" lib/core/optimize.ts, prove() reason strings
//   index bypass, 32 MB item cap       lib/core/optimize.ts:579-618, :588
//   freeze_min_age is half an interval lib/core/optimize.ts:285-292
//   15 settings, 34 terms              lib/core/settings.ts, lib/terms.ts (counted, and
//                                      matching the deployed stat strip)
//   stored nowhere, fragment carries   robovac.hannesmoser.at footnote 1
//
// The handoff's prose described telemetry for a robot vacuum cleaner. The
// project tunes PostgreSQL's VACUUM.
//
// The war stories in docs/research/09-war-stories.md are other companies'
// public postmortems, cited there as background research. They are not
// robovac's own usage numbers and are not presented as such here.
//
// Mixed row: detail list LEFT, image RIGHT. Mirrored from Postindex (01) so
// consecutive visits do not read identically.

/** Dead rows pile up, then one vacuum pass drops them to zero. */
function saw(x0: number, x1: number, baseline: number, peak: number, period: number) {
  let d = `M${x0} ${baseline}`
  for (let x = x0; x < x1; x += period) {
    const end = Math.min(x + period, x1)
    d += ` L${end} ${peak} L${end} ${baseline}`
  }
  return d
}

// The freeze runway, drawn to scale. 2^31 transactions is where Postgres
// stops accepting writes; the tunable knobs sit in the first tenth of it.
const RUNWAY = 2_147_483_648
const BAR_X = 10
const BAR_W = 452
const at = (xid: number) => BAR_X + (xid / RUNWAY) * BAR_W

export default function RobovacBody() {
  return (
    <>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(30ch,1fr))] gap-6">
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            Postgres does not remove old row versions in place. Every delete and every update
            leaves a dead row behind, and autovacuum comes along later to reclaim them. When it
            comes along is decided by one formula, a fixed threshold plus a scale factor times
            the live row count, and that scale factor still defaults to twenty percent. On a
            table with forty million rows that is eight million dead rows before anything fires
            at all. Most large tables discover here that the honest answer is every three weeks.
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            So robovac picks a cadence in time and solves that formula backward, then rounds to a
            number someone would actually type. The duration comes from Postgres's own token
            bucket: pages times a weighted page price, over the cost limit, times the delay. The
            55/25/20 split of cache hits, misses and dirtied pages is robovac's stated assumption
            rather than a Postgres constant, and the code says so at the place it is used. The
            cost limit is chosen off a ladder of six values people really set, and when none of
            them fits inside the replication lag budget it stops moving that knob and solves for
            the delay instead.
          </p>
        </div>
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            The interesting part is that it does not trust its own answer. The optimizer runs in
            four stages, sense, classify, solve, then prove, and prove is a second pass over
            solve's output that may veto it one setting at a time. If a proposal would lift peak
            dead rows by more than ten percent, or make the pass slower without buying back any
            bloat, or push this table's daily vacuum seconds past four times its current load,
            that setting quietly reverts and its reason string begins "Kept current".
          </p>
          <p className="text-md leading-[1.55] opacity-(--o-2)">
            Index bypass is the least obvious thing it computes. Postgres skips the index scan
            when dead line pointers sit on under two percent of pages, but the threshold counts
            tuples and the bypass counts pages, and nothing in a statistics snapshot says how
            they are clustered. So it assumes the worst, one dead tuple per page, and it will
            veto the cheap outcome on the 32 MB dead-item cap alone even when the page fraction
            looks fine. Past that point a lower threshold buys more heap passes and leaves the
            index passes exactly as frequent.
          </p>
        </div>
      </div>

      <figure className="m-0 mb-6">
        <svg
          viewBox="0 0 1200 420"
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
          role="img"
          aria-label="Dead rows over sixty days. The dashed line climbs high and drops rarely under the current settings. The solid line stays low and drops often under the proposal."
          style={{ height: 'min(38vh, 380px)' }}
        >
          <text x="20" y="52" fontFamily="var(--mono)" fontSize="13" fill="var(--ink)" opacity="0.55">
            fig. 1 — dead rows, 60 days
          </text>

          <line x1="20" y1="340" x2="1180" y2="340" stroke="var(--ink)" strokeOpacity="0.32" />

          <path
            d={saw(20, 1180, 340, 96, 290)}
            fill="none"
            stroke="var(--ink)"
            strokeOpacity="0.32"
            strokeDasharray="4 4"
          />
          <text
            x={1180}
            y={88}
            textAnchor="end"
            fontFamily="var(--mono)"
            fontSize="12"
            fill="var(--ink)"
            opacity="0.32"
          >
            current
          </text>

          <path d={saw(20, 1180, 340, 268, 48)} fill="none" stroke="var(--ink)" />
          <text x={20} y={258} fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
            proposed
          </text>

          <text x="20" y="372" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.32">
            day 0
          </text>
          <text
            x={1180}
            y="372"
            textAnchor="end"
            fontFamily="var(--mono)"
            fontSize="12"
            fill="var(--ink)"
            opacity="0.32"
          >
            day 60
          </text>
        </svg>
        <figcaption className="mt-2 font-mono text-xs opacity-(--o-3)">
          Every tooth is one vacuum pass. The mark on this project is the same shape, cut on the
          anti-diagonal.
        </figcaption>
      </figure>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(26ch,1fr))] items-start gap-6">
        <div>
          <p className="mb-4 text-md leading-[1.55]">
            The freeze chain has one number worth explaining.{' '}
            <code>vacuum_freeze_min_age</code> is set to half a vacuum interval's worth of
            transaction ids, not a whole one, and the reason is a trap. Make the cutoff wider
            than one interval and a page can go all-visible while every row on it is still
            younger than the cutoff. Normal vacuums skip all-visible pages, so that page is now
            visible, unfrozen, and invisible to every later normal pass. Only the aggressive
            vacuum ever touches it again. Half an interval is the margin that stops it.
          </p>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 font-mono text-xs tracking-[.04em]">
            <dt className="uppercase opacity-(--o-3)">stack</dt>
            <dd className="m-0">Next.js · TypeScript · MCP · Redis</dd>
            <dt className="uppercase opacity-(--o-3)">tunes</dt>
            <dd className="m-0 tabular-nums">15 settings · 34 explained terms</dd>
            <dt className="uppercase opacity-(--o-3)">access</dt>
            <dd className="m-0">none · statistics only, no locks</dd>
            <dt className="uppercase opacity-(--o-3)">stores</dt>
            <dd className="m-0">nothing · the url fragment carries the snapshot</dd>
            <dt className="uppercase opacity-(--o-3)">started</dt>
            <dd className="m-0 tabular-nums">2026-07-30</dd>
            <dt className="uppercase opacity-(--o-3)">status</dt>
            <dd className="m-0">live · actively developed</dd>
          </dl>
        </div>
        <figure className="m-0">
          <svg
            viewBox="0 0 480 320"
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto w-full"
            role="img"
            aria-label="The freeze runway drawn to scale, from zero to two to the thirty-first transactions. Both tunable freeze settings sit inside the first tenth. The failsafe begins at 1.6 billion and writes stop at the end."
          >
            <text x="0" y="14" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.32">
              fig. 2 — the freeze runway, to scale
            </text>

            {/* the two knobs you can actually set */}
            <text x={BAR_X} y="76" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)">
              freeze_table_age 150M
            </text>
            <text x={BAR_X} y="94" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)">
              freeze_max_age 200M
            </text>
            <line x1={at(150e6)} y1="104" x2={at(150e6)} y2="150" stroke="var(--ink)" strokeOpacity="0.32" />
            <line x1={at(200e6)} y1="104" x2={at(200e6)} y2="150" stroke="var(--ink)" strokeOpacity="0.32" />

            {/* the runway */}
            <rect x={BAR_X} y="150" width={BAR_W} height="30" fill="none" stroke="var(--ink)" strokeOpacity="0.32" />
            <rect
              x={at(1.6e9)}
              y="150"
              width={BAR_X + BAR_W - at(1.6e9)}
              height="30"
              fill="var(--ink)"
              fillOpacity="0.12"
            />
            <rect x={BAR_X} y="150" width={at(200e6) - BAR_X} height="30" fill="var(--ink)" fillOpacity="0.4" />

            {/* the two limits you cannot move. Failsafe sits above the bar and
                the wraparound below it, because at this scale they are close
                enough that two labels on the same baseline collide. */}
            <text
              x={at(1.6e9)}
              y="118"
              textAnchor="middle"
              fontFamily="var(--mono)"
              fontSize="12"
              fill="var(--ink)"
              opacity="0.55"
            >
              failsafe 1.6B
            </text>
            <line x1={at(1.6e9)} y1="126" x2={at(1.6e9)} y2="150" stroke="var(--ink)" strokeOpacity="0.32" />

            <line x1={BAR_X + BAR_W} y1="180" x2={BAR_X + BAR_W} y2="206" stroke="var(--ink)" strokeOpacity="0.32" />
            <text x={BAR_X + BAR_W} y="224" textAnchor="end" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)">
              writes stop
            </text>
            <text
              x={BAR_X + BAR_W}
              y="242"
              textAnchor="end"
              fontFamily="var(--mono)"
              fontSize="12"
              fill="var(--ink)"
              opacity="0.32"
            >
              2^31
            </text>

            <text x={BAR_X} y="282" fontFamily="var(--mono)" fontSize="12" fill="var(--ink)" opacity="0.55">
              everything you can tune is the block on the left
            </text>
          </svg>
          <figcaption className="mt-2 font-mono text-xs opacity-(--o-3)">
            Both freeze settings live inside the first tenth of the runway. Lowering the ceiling
            does not move them closer, it only shortens what is left.
          </figcaption>
        </figure>
      </div>
    </>
  )
}
