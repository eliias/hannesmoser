// The one spring integrator. Every animated value in the lab runs through it.
// Source: Lab.dc.html:351-358 (`spr`), which is the design brief's
// `v = v * d + (target - x) * k; x = x + v` plus two edge cases.
//
// A spring is a plain value object. The caller keeps it, the loop replaces it
// once per frame. It is never React state: the loop writes the result straight
// to the DOM at 60fps.
export type Spring = { x: number; v: number }

/**
 * One frame of the spring.
 *
 * `s` is `null` before the first frame, which snaps to the target instead of
 * accelerating toward it from an arbitrary start. `reduced` is
 * `prefers-reduced-motion: reduce`, which assigns the target directly and
 * leaves the value with no velocity, so nothing overshoots.
 *
 * `k` is stiffness, `d` is damping. A lower `d` overshoots more.
 */
export function step(
  s: Spring | null,
  target: number,
  k: number,
  d: number,
  reduced: boolean,
): Spring {
  if (s === null || reduced) return { x: target, v: 0 }
  const v = s.v * d + (target - s.x) * k
  return { x: s.x + v, v }
}
