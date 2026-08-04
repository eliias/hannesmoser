import Link from 'next/link'
import { cells, SIZE } from '@/brand/mark'
import { inkRgba } from '@/lib/ink'

// Handoff spec (not in the prototype): below this rendered size the
// wordmark drops and the mark stands alone.
const WORDMARK_MIN_SIZE = 16

interface MarkProps {
  /** Rendered size in px. Callers pick --mark-sm (rail) or --mark-lg (case study). */
  size: number
  /** Show the wordmark next to the mark, subject to the WORDMARK_MIN_SIZE drop. */
  wordmark?: boolean
}

export default function Mark({ size, wordmark = true }: MarkProps) {
  const showWordmark = wordmark && size >= WORDMARK_MIN_SIZE

  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={showWordmark ? undefined : 'lab.hannesmoser.at'}
        aria-hidden={showWordmark ? true : undefined}
      >
        <g fill={inkRgba(1)}>
          {cells().map(({ x, y, w, h, opacity }) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} opacity={opacity} />
          ))}
        </g>
      </svg>
      {showWordmark && (
        <span className="font-grotesk text-sm font-medium tracking-[-0.01em] text-ink">
          lab.
        </span>
      )}
    </Link>
  )
}
