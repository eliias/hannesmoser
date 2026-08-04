> Committed for the record, as delivered by the designer. Two things in this
> document are superseded: it recommends the `magnetic` navigation, and
> `fisheye` was chosen instead. Its claim that no value falls outside the
> tokens is not true of the delivered prototype, so this port adds the
> missing tokens. See docs/superpowers/plans/2026-08-04-lab-design-port.md.
> Its port path and component map below describe the prototype's intent,
> not the shipped app: `theme.ts` was never spread into a `tailwind.config.ts`
> (Tailwind 4 has no such file), there is no MDX body, no `variant` prop, no
> three navigation variants, and no stress toggle.

# lab.hannesmoser.at — prototype

One viewport, one ink, a timeline at the bottom. The running prototype is `Lab.dc.html`
at the project root: open it in a browser, no build step. This folder holds the parts that
port into `apps/lab` (tokens, brand, content) and the decisions behind them.

## How to run

Prototype: open `Lab.dc.html`. Everything is in that one file — shell, three navigation
variants, both containers, and experiment 03.

Target app (`apps/lab`, Next.js + React + Tailwind):

```
pnpm install
pnpm dev            # localhost:3000
```

Port path: `tokens/tokens.css` is imported once in the root layout, `tokens/theme.ts` is
spread into `tailwind.config.ts`, `content/experiments.json` becomes the content module,
`brand/` ships as-is. The components in the prototype are written with inline style values
that all come from the tokens, so the Tailwind rewrite is mechanical.

## Typeface

**Schibsted Grotesk** (SIL OFL, self-hostable, variable 400–900, tabular figures).
It is a true grotesk with slightly narrow, high-waisted forms — classy without the
neutrality-by-committee feel of the banned list, and the variable axis means the active
timeline item is marked with weight instead of colour.

**JetBrains Mono** earns its place, narrowly: it carries only numbers, dates, labels, and
the technical detail lists. That is a real job here — the case studies are full of
enumerable facts, and the timeline is a column of dates. Everything that is prose is
grotesk. If the second face has to go, the fallback is Schibsted's tabular figures with
uppercase tracking, which loses precision but nothing structural.

Fonts are loaded from a CDN **in the prototype only** for portability. In `apps/lab` they
are self-hosted woff2 with `font-display: swap` and a subset to latin.

## Token map

| Token | Meaning | Used by |
|---|---|---|
| `--paper`, `--ink` | the only two colours | everything |
| `--o-1..4` | 1 / .55 / .32 / .12 — greys are opacity of the ink | secondary copy, metadata, hairlines |
| `--grotesk`, `--mono` | the two faces | prose / numbers and labels |
| `--t-xs..2xl` | type scale | labels → case-study titles |
| `--s-1..8` | 4px-based space scale | all padding, all gaps |
| `--hair` | hairline weight | nav top rule, link box, dividers |
| `--rail-h` | **derived** from the three type lines the item holds | timeline rail |
| `--nav-h` | `--rail-h` + vertical padding + hairline | shell grid row |
| `--dur-1/2`, `--ease-out` | CSS transitions (opacity only) | active bar, control toggle |
| `--spring-k`, `--spring-d` | stiffness / damping of the JS springs | all three nav variants |

No component contains a colour, a size, or a duration that is not one of these.

## Component map

| Component | Does | Needs | Depends on |
|---|---|---|---|
| `Shell` | 100vh grid: mark rail / content / navigation. Never scrolls. | children | tokens |
| `Mark` | generated 4×4 mark + typed wordmark, links to lab root. Wordmark drops below 16px. | `size` | `brand/mark.ts` |
| `Timeline` | the strip: data, active state, keyboard, pointer, one rAF loop | `experiments`, `active`, `onSelect`, `variant` | tokens |
| `ContainerA` | frame + title block + control bar for a live experiment | `experiment`, children | tokens |
| `ContainerB` | typographic case study, scrolls inside itself | `experiment`, MDX body | tokens, mono |
| `ImageDissolve` | experiment 03: drop, distort, dissolve, pulse | canvas frame size | none |
| `Control` | one style for slider / toggle / button, monochrome | — | tokens |

The three variants are not three components — they are three branches of one rAF loop
inside `Timeline`, sharing one DOM. That is deliberate: it is what makes them comparable
in the same session, and it keeps the DOM cost identical across the comparison.

## The mark rule

```js
const opacity = (r, c) => (r === c ? 1 : (r + c) % 2 === 0 ? 0.4 : 0.12)
// all 16 cells drawn: x = c * 26, y = r * 26, w = h = 18, viewBox 0 0 96 96
```

Full ink on the main diagonal, a two-step dither everywhere else. It reads as an axis
against a field of samples — a measurement, which is what a lab is. Same grid, same three
opacity steps as `postindex`, same flat two-value construction as `robovac`, and the rule
is one line. Generator: `brand/mark.ts`. Output: `brand/mark.svg`, `brand/wordmark.svg`.

## The three navigation variants

Switch them at runtime with the **nav** buttons in the top right of the prototype
(`fisheye / magnetic / kinetic`). Next to them, **3 items / 20 items** swaps the sample
content for a 20-item stress set — the row has to survive that, not just today's three.

- **Fisheye redistribution.** Items share the rail width. The item nearest the cursor
  takes width on a Gaussian falloff, reveals its abstract, and the neighbours give the
  width back. Springs with overshoot (k .20, d .68).
- **Magnetic content in fixed cells.** Cells never move. Inside them the number, title,
  and date are pulled toward the cursor on three springs with different damping
  (.76 / .86 / .92), so the row ripples and settles like a curtain.
- **Kinetic drag timeline.** The track is wider than the rail. Throw it, it decelerates
  (0.94/frame), and it settles on the nearest experiment, which becomes active.

**Recommendation: magnetic.** It is the only one of the three that is honest about the
timeline. Cell positions are fixed, so the dates stay a readable column at 3 items and at
20, and nothing moves under your finger before you commit to it. It also has the lowest
frame cost — it writes only `transform` and `opacity`, never a layout property — which
matters because an experiment is running in the same frame. The Yugop debt is paid in the
physics (mass, pre-response, overshoot, never quite still), not in the layout jumping
around.

Fisheye is the most charming and the most expensive: it animates the width of absolutely
positioned items, which reflows each item (not its siblings). It holds 60fps at 3–20 items
on a five-year-old laptop, but it is the first thing to give if an experiment gets hungry,
and at 20 items the shrunken neighbours clip to nearly nothing. Kinetic is the right answer
at 40+ experiments and the wrong one at 3, where there is nothing to throw; it also hides
part of the timeline off-screen, which costs the "you are here" reading.

## Tried and rejected

- **Vertical timeline on the right.** Read better as a list, worse as time; also stole
  width from the experiments.
- **A second colour for the active item.** Instantly cheapened it. Weight + a 2px rule does
  the same job in one ink.
- **Nav height 100px, hardcoded.** Wrong at small viewports. It is now derived from the
  three type lines it holds (`--rail-h`).
- **Hover-scrub preview of each experiment in the strip.** Two canvases at once for a
  decoration. Removed.
- **CRT/Flash costume** (scanlines, chrome bevels, easing that bounces twice). The trace of
  that era belongs in the physics only.
- **Mono for the whole site.** Looked like a terminal toy, not a workshop.

## Where the link back sits

Top right, on the mark rail, in mono at `--o-2`. It is identity and navigation, so it
belongs next to the mark, not in the footer — the bottom edge is the timeline's and nothing
else may compete there. It is the quietest element on the page that is still findable in
one glance.

## Unfinished / next

- Experiment 03 is a reference implementation, not a finished piece: no image
  re-composition, no audio, ~15k particles at grain 4, CPU canvas (no dpr scaling, so it is
  soft on retina). A WebGL point-sprite version is the real one.
- Reduced motion: springs snap to target and the pulse still fires. It needs one more pass
  to make the dissolve legible as a state change without motion.
- Timeline: no deep links yet (`/03-image-dissolve`), no year separators — those matter
  once there are two years of experiments.
- Touch: drag/momentum/snap works in kinetic; fisheye and magnetic fall back to
  tap-to-select on touch, which is correct but plain. Magnetic could take a
  long-press-and-drag scrub.
- Container B images are placeholders. Real screenshots will change the column rhythm.
