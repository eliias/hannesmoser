---
name: adding-an-experiment
description: Use when adding an experiment to apps/lab, wiring one into the timeline or its URL, or when a live experiment draws the wrong thing, runs slow, or looks frozen in the browser.
---

# Adding an experiment

## Overview

The lab is a static Next export. An experiment is one registry entry plus one
component that renders its own container. The simulation itself belongs in
`lib/`, free of the DOM, so you can run and measure it without a browser.

## Wiring

Five places, in this order. Nothing else needs to change.

| File | What to add |
|---|---|
| `content/experiments.ts` | The entry. `number` is zero padded, `date` is ISO. The LAST entry is `newest` and is what `/` serves. |
| `components/<Title>.tsx` | The experiment. Props are `{ experiment, titleRef }`. It renders its own container. |
| `components/ExperimentView.tsx` | A row in `LIVE_BODIES` (or `CASE_STUDY_BODIES`), keyed by slug. A missing row throws. |
| `lib/*.ts` | The simulation and any heavy renderer. No DOM, no React. |
| a container | Reuse `ContainerA` (canvas over its own control bar) or `ContainerC` (full bleed, chrome floats on the canvas). |

`slug` is the URL, so never change one: numbering has already shifted once and
a shared link has to survive it. `app/[slug]/page.tsx` builds the static page
from the registry by itself.

A new layout gets a NEW container. A mode flag on `ContainerA` braids two
layouts into one component.

## The live experiment shape

Read `ImageDissolve.tsx` or `NavierStokes.tsx` first. Both hold this shape:

- A `SIM` object, `as const`, holding every tuned number. Colours, spacing and
  durations are not tuned numbers: those are tokens in `globals.css`.
- A `Sim` type holding everything the 60 fps loop touches, none of it React
  state. A re-render per frame is the one thing these cannot afford.
- ONE `useEffect` owning every browser resource: context, rAF, ResizeObserver,
  listeners. One setup, one cleanup.
- Each control is React state mirrored into `Sim` by a one line effect. A value
  the loop reads live must not rebuild; a value that changes structure must.
- `useState<number>(SIM.x)` needs the explicit type, or `as const` infers the
  literal and the slider can never leave it.
- Pointer handlers write into `Sim` directly. Nothing at pointer rate goes
  through React.
- Title fade contract: the container attaches `titleRef`, the experiment writes
  `titleRef.current.style.opacity` on pointerdown and pointerup. The container
  adds no pointer handlers.

## Verify outside the browser first

The highest value rule here. Node strips the types, so anything in `lib/` runs
with `node probe.ts` (a throwaway in your scratchpad, never in the repo). Stub
what the DOM would provide:

```ts
class FakePath { moveTo(){} quadraticCurveTo(){} closePath(){} }
;(globalThis as unknown as { Path2D: unknown }).Path2D = FakePath
```

Measure invariants instead of looking at pictures: does it settle, is any value
NaN, where did the mass go, how long is one step. Measure the opening seconds
too. A state that looks broken for three seconds on load is a defect, and it is
the one every visitor sees first.

## Debugging a live experiment

| Symptom | First move |
|---|---|
| Draws something wrong | Add a debug view that draws the raw state (particles, cells, vectors) under the finished render. One screenshot then separates a wrong model from a wrong drawing. |
| Frozen or crawling under browser automation | rAF is throttled whenever the tab is not the foreground window. Screenshots still paint. Measure in Node. |
| Nothing appears at all | Check zero initialization. A fresh `Uint8Array` is all zeros, so the zero value MUST mean the empty or default state. |
| Slow | Profile the stages in Node before changing anything. Canvas path fills submit in ~0.1 ms because the raster is on the GPU, so it is rarely the cost. |

## Two easy ones to get wrong

Scale by `devicePixelRatio` when the canvas draws paths. Skip it when the canvas
blits a pixel buffer, where it only multiplies the work.

Run a fixed timestep with an accumulator, and cap the catch up steps per frame.
Elapsed time decides how many steps run, never how big they are.

## Before you call it done

- `pnpm exec tsc --noEmit`
- `pnpm build`, and check the new slug appears in the route list
- Load the OTHER experiments. A shared container or the title block may have moved.
- Load `/`, which must serve the new entry if it is the newest.
