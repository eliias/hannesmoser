# lab.hannesmoser.at

A public workshop for experiments

Keywords: monochrome, grotesk, single viewport, timeline navigation, Yugop

## tl;dr

Design and build an interactive prototype for `lab.hannesmoser.at`. One viewport, the shell never scrolls. Monochrome, one open source grotesk. A full-width timeline navigation sits at the bottom and holds the experiments. Two content containers: one runs an experiment live, one presents a linked project as typography. Deliver a Next.js + React + Tailwind folder with design tokens and a README, not a design file.

## Context

Hannes Moser is a software engineer. The main site `www.hannesmoser.at` is a Jekyll blog and CV. It is calm and it stays calm.

The lab is the other half. It is where experiments go: shaders, particle systems, physics toys, retrieval demos, audio. Some of them run in the browser. Some of them are real products that live somewhere else, and the lab only presents them.

The lab is a sub-app in the same monorepo, at `apps/lab`. It deploys on its own. The main site gets one navigation link to it.

Hannes trained during the Flash and ActionScript era. The lab should carry a small trace of that (see Navigation), without becoming a costume.

## The one rule

Restraint beats spectacle.

Every choice must survive one question: does this make the work read better, or does it only make the site look busy? A retro nod is welcome. It is never the point. When in doubt, remove it.

The experiments are the loud part. The shell around them is quiet.

## Mark

Two recent projects, `postindex` and `robovac`, share one mark system. The lab mark joins that family. This part is a hard constraint.

The system:

- A 4x4 grid of squares. Cell 18 to 19 units, gap 8 units, pitch 26 to 27 units. The full mark is 96 to 100 units square.
- No cell is drawn by hand. A rule fills the cells. `robovac` fills every cell where `row + col <= 3`, which gives 10 cells and an anti-diagonal edge. `postindex` fills all 16 cells and uses three opacity steps (0.12, 0.4, 1.0) to draw a cross with one bright cell.
- Two values only, flat. No gradient, no outline, no container shape.
- The wordmark is typed, not drawn. Clear space is one cell pitch on every side.

**Example (robovac, the whole spec in five lines):**

```js
const filled = []
for (let r = 0; r < 4; r++)
  for (let c = 0; c < 4; c++)
    if (r + c <= 3) filled.push([r, c])
// each cell: x = c * 26, y = r * 26, w = h = 18, viewBox 0 0 96 96
```

**The ask:** keep the grid. Find the rule that means "lab". You must be able to write it in one line of code. Deliver the mark as SVG plus the generator function that produced it.

Below 16px the wordmark drops and the mark stands alone.

## Type

One typeface carries the whole site. A second monospace face is allowed for numbers, labels, and technical detail, but only if it earns its place. Argue for it in the README or leave it out.

Hard requirements:

- Free or open source, and self-hostable. No Adobe Fonts, no Google Fonts CDN, no paid licence.
- A true grotesk. Classy, not friendly, not quirky.
- A variable weight axis, or three weights minimum.
- Tabular figures. The experiment numbers and dates align in a column in the navigation, so proportional figures break the grid.

Banned as stereotypical: Inter, Helvetica and its clones (Arimo, Liberation Sans), Roboto, Montserrat, Poppins, Space Grotesk, Work Sans.

Neighbourhoods worth a look, as a direction and not a shortlist: Schibsted Grotesk, Familjen Grotesk, Archivo, Instrument Sans, Host Grotesk, and the Fontshare grotesks (Switzer, General Sans, Cabinet Grotesk). Pick one, name it in the README, and give one sentence on why.

## Color

Monochrome. One ink on one paper.

Bright, near-white background. Near-black detail. No dark mode, no light mode, no toggle, no `prefers-color-scheme` branch. The site has one appearance.

Grey steps are allowed, and they should come from opacity of the single ink, not from separate grey values. Keep the number of steps small (three or four).

No accent color. If something must be marked as active, mark it with weight, size, position, or motion.

## Layout

The shell fills the viewport: 100% width, 100% height. The shell itself never scrolls. Content inside a container may scroll.

Three fixed regions:

1. **Mark**, top left. It links to the lab root. Small, quiet, always present.
2. **Content**, everything between the mark and the navigation. This is where the two containers render.
3. **Navigation**, a full-width strip at the bottom. Roughly 100px tall, but do not hardcode that. Derive it from the type scale and the content it holds, so it stays right at every viewport size.

A single link back to `www.hannesmoser.at` belongs somewhere calm. Place it and defend the placement.

**First load:** the newest experiment fills the content area and starts running immediately. There is no splash, no index screen, no empty state. The navigation already shows where you are.

## Navigation

This is the heart of the design, and it is open.

The strip is a **timeline**, left to right, oldest to newest. New experiments enter at the right. Each item carries the experiment number, a date, and a short title. It must be obvious which item is active.

The reference is the Yugop menu, from Yugo Nakamura's MONO\*crafts around 1999 to 2001. What matters from it is not the look. It is the physics: elements have mass, they respond before you touch them, they overshoot and settle, and the row is never completely still.

**Deliver three variants**, switchable at runtime so they can be compared side by side in the same session. Candidate directions, and you may replace any of them with something better:

- **Fisheye redistribution.** Items share a fixed total width. The item under the cursor grows and reveals more metadata, its neighbours shrink. Spring easing, overshoot, slow settle.
- **Magnetic content in fixed cells.** Cell widths never change. Inside each cell the number and title get pulled toward the cursor on a spring, each with its own damping, so the row ripples like a curtain.
- **Kinetic drag timeline.** The strip is longer than the viewport. You throw it with momentum, it decelerates, and it snaps elastically to the nearest experiment.

Rules that hold for all three:

- The navigation must read well at 3 items and at 20 items. Three items today is not the test.
- Touch is first class (see Motion and performance). A pointer variant that has no touch answer is not finished.
- Keyboard works: arrow keys move between experiments, Enter opens, Tab reaches every item.
- The strip never hides the content behind it.

## Container A: live experiment

The experiment runs directly in the content area. Three.js, WebGL, WebGPU, canvas, audio, physics.

The container gives the experiment the full content area and stays out of its way. It provides:

- A frame that the experiment fills, with a known size that survives a window resize.
- A place for the title, number, and one line of description, readable but not dominant. It may fade out while you interact.
- A place for controls, when an experiment has them. Design one control style (a slider, a toggle, a button) and keep it monochrome.
- A start or reset affordance.

The experiment may be loud. The container may not.

## Container B: case study

For projects that cannot run inside the lab. This is a typographic layout, and it should be high class.

It holds:

- A title, the experiment number, and a date.
- Body text, and it may run in multiple columns on wide viewports.
- Embedded images, at more than one size. Some sit inline, some break wider.
- **A clear, obvious link to the live project.** Visiting the real thing must be easy. Do not bury it.
- Small technical detail: stack, dates, status. This is a good place for the monospace face, if you keep one.

This container may scroll inside itself. The shell around it does not move.

## Sample content

Build against these three. Two are real and shipping, one is new.

| #  | Title          | Kind       | Link                     |
|----|----------------|------------|--------------------------|
| 01 | Postindex      | case study | postindex.linear.dev     |
| 02 | Robovac        | case study | robovac.hannesmoser.at   |
| 03 | Image dissolve | live       | none                     |

Pick plausible dates in 2026 for all three. We replace them with the real ones later. Use dates that are far enough apart to show how the timeline reads.

`postindex` and `robovac` are real projects with their own marks in the same 4x4 grid family. Look at both before you design Container B. They are the test: the layout must make two quite different technical projects look good without a redesign.

**Experiment 03, image dissolve.** Drop an image file into the browser. Distort it with the pointer or a finger. Dissolve it into a particle cloud that falls under gravity. Fire a pulse wave through the cloud. This is the reference implementation for Container A, so build enough of it to prove the container works. It does not have to be finished.

Field shape for an experiment:

```ts
{
  number: string      // "01", zero padded, tabular figures
  date: string        // ISO date, the publication date
  title: string       // short, fits the navigation without truncation
  kind: 'live' | 'case-study'
  abstract: string    // one line
  link?: string       // external URL, case studies only
}
```

## Motion and performance

Touch gets full parity. The navigation works with drag, momentum, and snap. The experiments work with touch input. This is a real constraint on the navigation design, so solve it early and not at the end.

`prefers-reduced-motion: reduce` removes all decorative motion. Springs become instant state changes. The site stays fully usable, and nothing depends on an animation to be understood.

The navigation holds 60fps on a five year old laptop and on a mid-range phone. Animate `transform` and `opacity`. Do not animate layout properties. If a variant cannot hold the frame budget, say so in the README rather than shipping it quietly.

The experiment and the navigation run at the same time, so the navigation cannot be expensive.

## Delivery

A folder named `lab-prototype/`:

```
lab-prototype/
  README.md
  tokens/           design tokens: CSS custom properties + Tailwind theme
  app/              Next.js App Router
  components/       both containers, the navigation variants, the shell
  brand/            mark.svg, wordmark.svg, and the generator function
  content/          the three sample experiments
```

Stack: Next.js, React, Tailwind. It must start with one command after `pnpm install`. This is the same stack as the target app, so components port over almost unchanged.

Design tokens are the interface, not a suggestion. Every color, size, space, duration, and easing value lives in `tokens/` as CSS custom properties, mirrored into the Tailwind theme. No magic numbers in components.

The `README.md` covers:

- How to run it.
- The typeface, and one sentence on why.
- The token map: what each token means and where it is used.
- The component map: what each component does, what it needs, what it depends on.
- The mark rule, in code.
- The three navigation variants: how to switch between them, and which one you recommend, with the reason.
- What you tried and rejected, briefly. This is useful.
- What is unfinished, and what you would do next.

## Out of scope

- Dark mode, light mode, any theme switch.
- A CMS or an admin interface. Experiments are files in the repo.
- Any backend. The lab is static.
- Deployment, CI, and infrastructure. That is handled separately.
- Experiment code beyond enough of experiment 03 to prove Container A.
- The main site. It is not changing, apart from one navigation link.

## Open items

- The exact height of the navigation strip. Derive it, do not pick it.
- Whether a second monospace face earns its place.
- Where the link back to `www.hannesmoser.at` sits.
- Which navigation variant wins. That is the decision this prototype exists to make.
