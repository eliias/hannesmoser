import { inkRgba } from '@/lib/ink'

// lab mark — 4x4 grid, one rule, three opacity steps of a single ink.
// The rule, in one line:
export const opacity = (r: number, c: number): number =>
  r === c ? 1 : (r + c) % 2 === 0 ? 0.4 : 0.12

export const CELL = 18, PITCH = 26, SIZE = 96 // 3 * PITCH + CELL = 96

export interface Cell {
  x: number
  y: number
  w: number
  h: number
  opacity: number
}

// A cell rule returns null to mean "draw nothing here", not opacity 0 — the
// robovac mark omits cells outright rather than painting them invisible.
type CellRule = (r: number, c: number) => number | null

function cellsFor(rule: CellRule): Cell[] {
  const out: Cell[] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const o = rule(r, c)
      if (o !== null) out.push({ x: c * PITCH, y: r * PITCH, w: CELL, h: CELL, opacity: o })
    }
  return out
}

export function cells(): Cell[] {
  return cellsFor(opacity)
}

// postindex — from postindex's own brand file
// (~/src/github.com/eliias/postindex/docs/brand/symbol.svg), not from
// Lab.dc.html. The prototype (Lab.dc.html:118-125) draws a different,
// wrong version of this mark: its designer had no access to the postindex
// repo and approximated it. Since the lab links to the real postindex, its
// own mark wins on purpose. Do not "fix" this back to match the prototype.
// The real mark is a cross: column 2 and row 1 sit at the middle step, the
// row-1/col-2 cell is full ink, everything else is the dimmest step.
export const postindexOpacity: CellRule = (r, c) =>
  r === 1 && c === 2 ? 1 : c === 2 || r === 1 ? 0.4 : 0.12

// robovac — ported verbatim from Lab.dc.html:189-196. A flat triangle at
// full ink; every other cell is omitted, not dimmed.
export const robovacOpacity: CellRule = (r, c) => (r + c <= 3 ? 1 : null)

const PROJECT_MARK_RULES: Record<string, CellRule> = {
  Postindex: postindexOpacity,
  Robovac: robovacOpacity,
}

/** The project's own mark, keyed by its Experiment title. Case studies only. */
export function projectMarkCells(title: string): Cell[] {
  const rule = PROJECT_MARK_RULES[title]
  if (!rule) throw new Error(`brand/mark: no project mark rule for "${title}"`)
  return cellsFor(rule)
}

export function markSvg(ink: string = inkRgba(1)): string {
  const rects = cells()
    .map(k => `<rect x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" opacity="${k.opacity}"/>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}"><g fill="${ink}">${rects}</g></svg>`
}

// Family: robovac fills r + c <= 3 (triangle, flat). postindex fills all 16 and draws a
// cross in three opacity steps. lab fills all 16 and draws the main diagonal at full ink
// through a dithered field: an axis read against samples.
