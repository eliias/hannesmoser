import type { CSSProperties, ReactNode } from 'react'

// The control bar's one visual language, in five shapes: a button (three
// variants), a slider, and a toggle. Every value is a token
// (apps/lab/app/globals.css) — no raw px, colour, or duration here.
// Source: design_handoff_lab/README.md "Container A", Lab.dc.html:81-100.
//
// Unwired on purpose: Task 8 owns the click/change handlers (DISSOLVE,
// PULSE, RESET, GRAVITY, GRAIN, INVERT). These primitives only know how to
// look like a control; the experiment decides what they do.

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

const BUTTON_BASE =
  'inline-flex items-center rounded-full border-[var(--hair)] border-ink px-4 py-2 font-mono text-xs tracking-[.06em] uppercase cursor-pointer'

// Tertiary is the one shape whose border needs its own alpha (ink at --o-3)
// independent of the box opacity (--o-2) sitting on top of it — matching
// the prototype's `border-color: rgba(...,.32); opacity: .55` (Lab.dc.html:85).
// color-mix keeps the border on the ink/paper token pair instead of a
// literal rgba, following the precedent in ContainerB's divider.
const BUTTON_VARIANT: Record<ButtonVariant, { className: string; style?: CSSProperties }> = {
  primary: { className: 'bg-ink text-paper' },
  secondary: { className: 'bg-transparent text-ink' },
  tertiary: {
    className: 'bg-transparent text-ink opacity-[var(--o-2)]',
    style: { borderColor: 'color-mix(in srgb, var(--ink) calc(var(--o-3) * 100%), transparent)' },
  },
}

interface ControlButtonProps {
  variant?: ButtonVariant
  onClick?: () => void
  children: ReactNode
}

export function ControlButton({ variant = 'secondary', onClick, children }: ControlButtonProps) {
  const v = BUTTON_VARIANT[variant]
  return (
    <button type="button" onClick={onClick} className={`${BUTTON_BASE} ${v.className}`} style={v.style}>
      {children}
    </button>
  )
}

interface ControlSliderProps {
  label: string
  /** Width token: --slider-w-lg (GRAVITY) or --slider-w-sm (GRAIN). */
  size?: 'lg' | 'sm'
  min: number
  max: number
  step: number
  value: number
  onChange?: (value: number) => void
}

export function ControlSlider({
  label,
  size = 'lg',
  min,
  max,
  step,
  value,
  onChange,
}: ControlSliderProps) {
  return (
    <label className="flex items-center gap-3 font-mono text-xs tracking-[.06em] opacity-[var(--o-2)]">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{
          width: size === 'lg' ? 'var(--slider-w-lg)' : 'var(--slider-w-sm)',
          height: 'var(--slider-track)',
          accentColor: 'var(--ink)',
        }}
      />
    </label>
  )
}

interface ControlToggleProps {
  label: string
  checked: boolean
  onChange?: (checked: boolean) => void
}

export function ControlToggle({ label, checked, onChange }: ControlToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      aria-pressed={checked}
      className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-mono text-xs tracking-[.06em] opacity-[var(--o-2)]"
    >
      <span
        className="relative block"
        style={{
          width: 'var(--toggle-w)',
          height: 'var(--toggle-h)',
          border: 'var(--hair) solid var(--ink)',
        }}
      >
        <span
          className="absolute bg-ink transition-transform duration-[var(--dur-1)] ease-out"
          style={{
            top: 'var(--hair)',
            bottom: 'var(--hair)',
            width: 'var(--toggle-block)',
            transform: `translateX(${checked ? 'var(--toggle-travel)' : 'var(--hair)'})`,
          }}
        />
      </span>
      <span>{label}</span>
    </button>
  )
}
