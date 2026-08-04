// The only place the ink and paper RGB values are written.
// tokens use these via the custom properties below; JS uses them directly.
export const INK = [17, 17, 16] as const
export const PAPER = [244, 244, 242] as const

export const inkRgba = (alpha: number) => `rgba(${INK[0]},${INK[1]},${INK[2]},${alpha})`
export const paperRgba = (alpha: number) => `rgba(${PAPER[0]},${PAPER[1]},${PAPER[2]},${alpha})`
