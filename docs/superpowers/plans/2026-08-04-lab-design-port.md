# Lab Design Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **What actually shipped:** this plan was written before implementation. A
> final whole-branch review on 2026-08-04 found six places where the shipped
> code diverged from the plan below, and corrected the text in place: Task
> 9's container nesting, Task 8's `ImageDissolve` signature, Task 3's
> `Experiment` type, Task 2's `mark.ts` edit scope, and the Global
> Constraints' literals exception, which names three cases, not one. Treat
> the corrected text as the record of what shipped.

**Goal:** Recreate the designer's prototype inside `apps/lab` as React components, so `lab.hannesmoser.at` ships the real design: one ink on one paper, a fisheye timeline at the bottom, and two content containers, one of which runs a canvas experiment.

**Architecture:** A single static route. `Shell` owns a `100vh` grid of three rows: mark rail, content, navigation. `Timeline` drives all of its motion from one `requestAnimationFrame` loop writing straight to the DOM through refs, never through React state. The content row swaps between `ContainerB` (typographic case study, scrolls inside itself) and `ContainerA` (a frame plus a control bar, hosting `ImageDissolve`). Tokens live in one file and are the only source of colour, size, duration and easing.

**Tech Stack:** Next.js 16.3.0 App Router with `output: 'export'`, React 19.2.8, Tailwind CSS 4.3.3 (CSS-first `@theme`), TypeScript 5.9.3, Canvas 2D, `@fontsource-variable/*` for self-hosted fonts.

## Source material

The prototype is **outside this repo**, at `/Users/hannes/Downloads/design_handoff_lab/`:

| Path | What it is |
| --- | --- |
| `Lab.dc.html` | the working prototype, ~45KB, one file, all of it |
| `README.md` | the handoff spec: exact CSS values, layout, physics constants |
| `lab-prototype/README.md` | the designer's rationale, token map, component map |
| `lab-prototype/tokens/tokens.css` | the delivered tokens |
| `lab-prototype/brand/` | `mark.svg`, `wordmark.svg`, `mark.ts`, ship as-is |
| `lab-prototype/content/experiments.json` | the three sample experiments |

**Do NOT read `/Users/hannes/Downloads/design_handoff_lab/support.js`.** It is a 69KB generated runtime for the prototype's streaming format and it is irrelevant here.

A porting inventory with line-level citations sits at `/private/tmp/claude-501/-Users-hannes-src-github-com-eliias-hannesmoser/57fdf560-273e-4003-b109-99766cde7525/scratchpad/prototype-inventory.md`. Read the section named in each task. It cites `Lab.dc.html` line numbers for everything.

When a task says "port lines X-Y", read those lines in `Lab.dc.html` and reproduce the behaviour. Do not reproduce the prototype's class-component structure or its custom runtime.

## Global Constraints

- **Fisheye only.** Hannes ruled on 2026-08-04 that fisheye ships. Do not port the `magnetic` or `kinetic` variants, the variant switcher, or the `3 items / 20 items` stress toggle. The prototype's `variant()` already defaults to `'fisheye'`.
- **The handoff contradicts itself and the code wins.** `lab-prototype/README.md` recommends `magnetic`. That recommendation is stale and overruled. Ignore it.
- **Never put animated values in React state.** Cursor position, every spring value, particle arrays, the dissolve phase, the pulse radius, and all DOM handles are instance values held in refs and written directly to the DOM or canvas. Inventory §5 lists every one. Only `active`, `gravity`, `grain` and `invert` are React state.
- **After mount, item `width`, `transform` and colours must never appear in JSX.** This is the single biggest porting risk. The prototype's loop re-asserts `left` every frame because it already lost this fight once, and it has no equivalent guard for `width` or `transform`. React reconciles harder than the prototype's runtime, so any `active` change would stomp the animation. The static fallback (`left`/`width` from the index) may render in JSX for the first paint only. The loop then takes ownership and JSX must stop touching those properties.
- **No new runtime dependencies** beyond the two font packages in Task 1. No animation library, no state library, no MDX toolchain.
- **Static export.** `next build` runs component bodies in Node. Any `window`, `document`, `matchMedia`, `ResizeObserver` or canvas access in a render body throws at build time. All of it belongs in `useEffect`, a ref callback, or an event handler.
- **Every listener, observer, rAF and interval gets a cleanup path.** Inventory §6 marks which ones the prototype leaks. Do not inherit the leaks.
- **Tokens are the interface.** No component may hold a colour, size, duration or easing literal. Where the designer's file lacks a token, add one (Task 1). There are three exceptions, none of them design decisions: `ImageDissolve`'s `SIM` block (tuned physics constants), `ImageDissolve`'s `SOURCE` block (the placeholder artwork's own layout numbers, invented during implementation and documented in the file), and `Timeline.tsx`'s `FISHEYE` block (the Gaussian sigma scale and floor, the bump weight and active bonus, the reveal and ink-flip thresholds, and the date's reveal gain, all of which describe the algorithm's shape rather than the site's look). Each lives in one named constants block with a comment saying why it is not a token.

  One value inside `FISHEYE` deserves its own note, because it looks derivable and is not. The date's opacity climbs from `--o-3` to `.50` on reveal. `.50` is not on the opacity scale, so the gain (`.18`) cannot be expressed as `--o-2 - --o-3`, which would be `.23` and would land on `.55`. The abstract's full-reveal opacity **is** `--o-2` and does read from the token.
- **The ink RGB is written exactly once.** The prototype writes `17,17,16` three separate times (CSS, the fisheye fill string, the canvas LUT). Derive all three from one source.
- **Tailwind 4 has no `tailwind.config.ts`.** Do not port `lab-prototype/tokens/theme.ts`. Its content becomes an `@theme` block in the same CSS file as the custom properties, which collapses the designer's two files into one source of truth.
- Fidelity is high. Colours, type scale, spacing, motion constants and mark geometry match the prototype exactly.
- `next build` must stay idempotent: `git status --porcelain` empty after any build.
- Conventional Commits. Commit per task, then squash to one commit before the PR.

## Known accepted limitations

Do not "fix" these. They are decisions, and re-opening them is scope creep:

- Fisheye has no hover on touch. Tap-to-select is the whole touch story. The designer's warning that this is "correct but plain" is accepted. Do not invent a touch gesture.
- Fisheye's neighbours clip at 20 items. Accepted when fisheye was chosen. Task 9 measures it so we know exactly how bad it is, but does not redesign it.
- `ImageDissolve` has no devicePixelRatio scaling, so it is soft on retina. Documented as unfinished by the designer.
- Reduced motion does not stop the dissolve's fall physics. Known gap, documented.
- Case-study imagery is striped SVG placeholders labelled with their intended size.

## File Structure

```
apps/lab/
  app/
    layout.tsx          # root document, font imports, tokens import, metadata
    page.tsx            # the one route: renders Shell
    globals.css         # tokens as custom properties + Tailwind @theme, one file
  components/
    Shell.tsx           # 100vh grid, mark rail, content slot, nav slot
    Mark.tsx            # generated 4x4 mark + wordmark
    Timeline.tsx        # the strip and the whole rAF loop
    ContainerA.tsx      # live-experiment frame, title block, control bar
    ContainerB.tsx      # case-study typographic layout
    Control.tsx         # button / slider / toggle, one monochrome style
    ImageDissolve.tsx   # experiment 03, canvas 2D
  brand/
    mark.ts             # the generator, ships as-is
    mark.svg
    wordmark.svg
  content/
    experiments.ts      # typed list + Experiment type
    case-studies/
      postindex.tsx     # case-study body as a component
      robovac.tsx
  lib/
    ink.ts              # the one ink/paper RGB source
    spring.ts           # the spring integrator, shared by the loop
docs/lab/
  prototype-README.md   # the designer's rationale, committed for the record
```

---

### Task 1: Tokens, fonts, and the single ink source

Everything else depends on this. Nothing renders yet.

**Files:**
- Modify: `apps/lab/package.json` (two font dependencies)
- Modify: `apps/lab/app/globals.css` (tokens + `@theme`)
- Modify: `apps/lab/app/layout.tsx` (font imports)
- Create: `apps/lab/lib/ink.ts`
- Create: `docs/lab/prototype-README.md`

**Interfaces:**
- Produces: every CSS custom property later tasks consume; `INK`, `PAPER` and `inkRgba(alpha)` from `lib/ink.ts`.

- [ ] **Step 1: Add the fonts**

```bash
cd apps/lab && pnpm add @fontsource-variable/schibsted-grotesk@5.3.0 @fontsource-variable/jetbrains-mono@5.3.0
```

These are self-hosted woff2, which is what the handoff requires. The prototype's Google Fonts CDN links are for its own portability and must NOT be ported.

If pnpm refuses either package on `minimumReleaseAge`, add the exact `name@version` pairs it names to `apps/lab/pnpm-workspace.yaml`'s existing `minimumReleaseAgeExclude` list and say so in your report. Do not disable the guard globally.

- [ ] **Step 2: Create `apps/lab/lib/ink.ts`**

The prototype writes `17,17,16` in three places. This is the one place.

```ts
// The only place the ink and paper RGB values are written.
// tokens use these via the custom properties below; JS uses them directly.
export const INK = [17, 17, 16] as const
export const PAPER = [244, 244, 242] as const

export const inkRgba = (alpha: number) => `rgba(${INK[0]},${INK[1]},${INK[2]},${alpha})`
export const paperRgba = (alpha: number) => `rgba(${PAPER[0]},${PAPER[1]},${PAPER[2]},${alpha})`
```

- [ ] **Step 3: Write `apps/lab/app/globals.css`**

Start from `/Users/hannes/Downloads/design_handoff_lab/lab-prototype/tokens/tokens.css` and reproduce every token in it exactly. Then add the tokens the designer left out, which inventory §7 enumerates:

| New token | Value | Why it is needed |
| --- | --- | --- |
| `--spring-k-reveal` | `.14` | the fisheye reveal spring, `Lab.dc.html:456`, differs from `--spring-k` |
| `--spring-d-reveal` | `.72` | same |
| `--rule-active` | `2px` | the active item's bar, not on the space scale |
| `--slider-w-lg` | `120px` | GRAVITY slider |
| `--slider-w-sm` | `88px` | GRAIN slider |
| `--slider-track` | `2px` | slider height |
| `--toggle-w` | `26px` | toggle track |
| `--toggle-h` | `14px` | toggle track |
| `--toggle-block` | `10px` | toggle inner block |
| `--toggle-travel` | `13px` | inner block translate end (start is `1px`) |
| `--mark-sm` | `22px` | mark on the rail |
| `--mark-lg` | `52px` | project mark in a case study |

Then add the Tailwind 4 theme in the same file. `@theme` maps the custom properties into utility names, replacing the designer's `theme.ts`:

```css
@import "tailwindcss";

:root { /* ...every token, including the new ones above... */ }

@theme inline {
  --color-paper: var(--paper);
  --color-ink: var(--ink);
  --font-grotesk: var(--grotesk);
  --font-mono: var(--mono);
  /* ...spacing, font sizes, durations, easing... */
}
```

Reproduce the reduced-motion rule from `Lab.dc.html:33`:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 1ms !important; }
}
```

- [ ] **Step 4: Import the fonts and tokens in `apps/lab/app/layout.tsx`**

Import both fontsource packages and `./globals.css`. Set `--grotesk` and `--mono` to the family names the packages register. Keep the existing metadata.

- [ ] **Step 5: Copy the designer's rationale into the repo**

```bash
cp /Users/hannes/Downloads/design_handoff_lab/lab-prototype/README.md docs/lab/prototype-README.md
```

Add a note at the very top of the copy, so the next reader is not misled by it:

```markdown
> Committed for the record, as delivered by the designer. Two things in this
> document are superseded: it recommends the `magnetic` navigation, and
> `fisheye` was chosen instead. Its claim that no value falls outside the
> tokens is not true of the delivered prototype, so this port adds the
> missing tokens. See docs/superpowers/plans/2026-08-04-lab-design-port.md.
```

- [ ] **Step 6: Verify**

Run all of this from the repo root, so the paths are unambiguous:

```bash
(cd apps/lab && pnpm build) && test -f apps/lab/out/index.html && echo "PASS: builds with fonts and tokens"
```

Then confirm the fonts are bundled, not fetched. The prototype uses a Google Fonts CDN and that must not survive the port:

```bash
if grep -rqi "fonts.googleapis.com\|fonts.gstatic.com" apps/lab/out/; then
  echo "FAIL: the export still references a font CDN"
else
  echo "PASS: no CDN font references in the export"
fi
echo "woff2 files in the export: $(find apps/lab/out -name '*.woff2' | wc -l | tr -d ' ')"
```

Expected: `PASS: no CDN font references in the export`, and a woff2 count greater than 0.

- [ ] **Step 7: Confirm the build left the tree clean**

```bash
git status --porcelain
```

Expected: only your intended changes, no `tsconfig.json` churn.

- [ ] **Step 8: Commit**

```bash
git add apps/lab docs/lab/prototype-README.md
git commit -m "feat(lab): add design tokens, self-hosted fonts and one ink source

The delivered tokens were missing the fisheye reveal spring and every
Control geometry value, and the ink rgb was written three times. Added the
missing tokens and collapsed the colour to lib/ink.ts. Tailwind 4 takes the
theme from an @theme block in the same file, so the designer's theme.ts has
no port."
```

---

### Task 2: The mark

**Files:**
- Create: `apps/lab/brand/mark.ts`, `apps/lab/brand/mark.svg`, `apps/lab/brand/wordmark.svg`
- Create: `apps/lab/components/Mark.tsx`

**Interfaces:**
- Consumes: `lib/ink.ts` from Task 1.
- Produces: `<Mark size={number} wordmark={boolean} />`, and `cells()` from `brand/mark.ts`.

- [ ] **Step 1: Copy the brand files as-is**

```bash
cp /Users/hannes/Downloads/design_handoff_lab/lab-prototype/brand/mark.ts apps/lab/brand/mark.ts
cp /Users/hannes/Downloads/design_handoff_lab/lab-prototype/brand/mark.svg apps/lab/brand/mark.svg
cp /Users/hannes/Downloads/design_handoff_lab/lab-prototype/brand/wordmark.svg apps/lab/brand/wordmark.svg
```

The handoff says these ship as-is. What actually shipped edits `mark.ts` further than that: besides adding TypeScript types and importing `INK` from `lib/ink.ts` for its default parameter instead of the literal `'#111110'`, it adds `postindexOpacity`, `robovacOpacity` and `projectMarkCells`, and deliberately replaces the postindex mark with the real one. These were ruled decisions during implementation, not scope creep.

- [ ] **Step 2: Prove the generator and the committed SVG agree**

This is the whole point of a generated mark. If they disagree, one of them is wrong.

Extract the cells from the committed SVG, extract them from the generator, normalise both to the same string form, and compare the sorted lists. Normalising matters: the SVG writes `opacity=".12"` while the generator returns the number `0.12`, so a naive comparison always fails.

Write this as a throwaway script under the scratchpad, not in the repo:

```bash
S=/private/tmp/claude-501/-Users-hannes-src-github-com-eliias-hannesmoser/57fdf560-273e-4003-b109-99766cde7525/scratchpad
cat > "$S/mark-check.mjs" <<'EOF'
import { readFileSync } from 'node:fs'

// The rule, restated here on purpose: if this check imported mark.ts it would
// only prove the file is self-consistent, not that the rule is the intended one.
const rule = (r, c) => (r === c ? 1 : (r + c) % 2 === 0 ? 0.4 : 0.12)
const norm = n => String(n).replace(/^0\./, '.')

const expected = []
for (let r = 0; r < 4; r++)
  for (let c = 0; c < 4; c++)
    expected.push(`${c * 26},${r * 26},18,18,${norm(rule(r, c))}`)

const svg = readFileSync(process.argv[2], 'utf8')
const found = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" opacity="([^"]+)"/g)]
  .map(m => `${m[1]},${m[2]},${m[3]},${m[4]},${norm(m[5])}`)

const a = [...expected].sort().join('|')
const b = [...found].sort().join('|')
console.log(`cells in svg: ${found.length} (expected 16)`)
console.log(a === b ? 'PASS: generator rule matches the committed svg'
                    : `FAIL: mismatch\n  expected: ${a}\n  found:    ${b}`)
EOF
node "$S/mark-check.mjs" apps/lab/brand/mark.svg
```

Expected: `cells in svg: 16 (expected 16)` and the PASS line. Run it against `apps/lab/brand/wordmark.svg` too, which embeds the same 16 rects.

If they genuinely differ, report BLOCKED with the mismatch printed. Do not "fix" it by editing the SVG to match, or by editing the rule to match the SVG, until you know which one is wrong.

- [ ] **Step 3: Write `apps/lab/components/Mark.tsx`**

Renders the mark from `cells()`, not from a hardcoded SVG string. Props: `size` (rendered px) and whether to show the wordmark.

Per the handoff: mark 22×22 on the rail with the wordmark `lab.hannesmoser.at` beside it at 13px / weight 500 / `letter-spacing: -0.01em`, gap 12px, linking to the lab root. **Below a rendered mark size of 16px the wordmark drops and the mark stands alone.** Inventory flags that the prototype never implements this drop, so you are implementing it from the spec, not porting it.

- [ ] **Step 4: Verify**

```bash
cd apps/lab && pnpm build && test -f out/index.html && echo "PASS: builds"
```

- [ ] **Step 5: Commit**

```bash
git add apps/lab/brand apps/lab/components/Mark.tsx
git commit -m "feat(lab): add the generated lab mark

The mark is 16 cells from one rule, r === c ? 1 : (r + c) % 2 === 0 ? .4 :
.12, on the same 4x4 grid as postindex and robovac. Mark.tsx renders from
the generator rather than a pasted svg, so the two cannot drift."
```

---

### Task 3: Content model and the two case-study bodies

**Files:**
- Create: `apps/lab/content/experiments.ts`
- Create: `apps/lab/content/case-studies/postindex.tsx`
- Create: `apps/lab/content/case-studies/robovac.tsx`

**Interfaces:**
- Produces: the `Experiment` type, the `experiments` array, and a `body` component per case study. `Timeline`, `ContainerA` and `ContainerB` all consume these.

- [ ] **Step 1: Write `apps/lab/content/experiments.ts`**

Port the three entries from `/Users/hannes/Downloads/design_handoff_lab/lab-prototype/content/experiments.json` exactly, including the dates.

```ts
export type Experiment = {
  number: string          // "01", zero padded, rendered with tabular figures
  date: string            // ISO publication date
  title: string           // short, must fit the nav without truncation
  kind: 'live' | 'case-study'
  abstract: string        // one line
  link?: string           // external URL, case studies only
}

export const experiments: Experiment[] = [ /* the three entries */ ]
```

What actually shipped adds one more field, `lede?: string`, a longer standfirst
that both containers use: `ContainerB` renders it under the title when
present, `ContainerA` falls back to `abstract` when it is absent (experiment
03 has no `lede` yet).

The list is ordered oldest to newest, which is the order the timeline renders left to right. The newest entry is the one that loads first.

- [ ] **Step 2: Write the two case-study bodies**

Read `Lab.dc.html:105-245`. Both case studies' full prose, figures, and technical detail lists are hardcoded there. Port that copy verbatim into two components. Do not invent replacement copy and do not summarise it.

Each module exports a component rendering the body content only, from the two-column prose down. `ContainerB` owns everything above it (meta row, title block, live-project link), because that part is identical between the two and driven by the `Experiment` record.

The technical detail keys are `STACK`, `PAYLOAD` or `RUNS`, `SHIPPED`, `STATUS`.

The mixed row is mirrored between the two: image left on `01`, image right on `02`, so consecutive visits do not read identically. Preserve that.

- [ ] **Step 3: Verify**

Nothing renders these yet, so the build is the only gate available:

```bash
(cd apps/lab && pnpm build) && test -f apps/lab/out/index.html && echo "PASS: builds with the content modules"
```

Then check by eye that the copy actually came across, rather than trusting your own transcription:

```bash
wc -l apps/lab/content/case-studies/postindex.tsx apps/lab/content/case-studies/robovac.tsx
```

Both should be substantial. If either is under about 30 lines you have summarised the prose instead of porting it, which the task forbids. Re-read `Lab.dc.html:105-245` and port it in full.

- [ ] **Step 4: Commit**

```bash
git add apps/lab/content
git commit -m "feat(lab): add the experiment list and both case study bodies

The handoff defines no schema for case study prose, it is hardcoded in the
prototype markup. Each body is a tsx module, which keeps the two column and
mirrored mixed row layouts as real components and needs no mdx toolchain
for two documents."
```

---

### Task 4: Shell and the mark rail

**Files:**
- Create: `apps/lab/components/Shell.tsx`
- Modify: `apps/lab/app/page.tsx`

**Interfaces:**
- Consumes: `Mark` from Task 2, tokens from Task 1.
- Produces: `<Shell nav={ReactNode}>{content}</Shell>`. Tasks 5 to 8 fill the slots.

- [ ] **Step 1: Write `Shell.tsx`**

Port the shell from `Lab.dc.html`, inventory §2 "Shell". The handoff's spec:

- `display: grid` on `100vh` and `100%` width, `grid-template-rows: auto minmax(0,1fr) auto`. Rows are mark rail, content, navigation.
- `overflow: hidden` on both `html` and `body`.
- **The middle row must carry `min-height: 0`, or `minmax(0,1fr)`.** Without it the content region refuses to shrink and the nav is pushed off screen. This is the one layout detail that silently breaks everything.
- Mark rail: `padding: 24px 32px 16px`, `display: flex`, `justify-content: space-between`, `align-items: flex-start`.
- Left: `<Mark size={22} />` linking to the lab root.
- Right, one row, 24px gaps: the link back to `www.hannesmoser.at`, mono 11px, `letter-spacing: 0.04em`, ink at `--o-2`, trailing `↗`.
- **Do not port the variant switcher or the stress toggle.** They are prototype scaffolding.

- [ ] **Step 2: Render it from `page.tsx`**

Pass a placeholder into both slots for now. Tasks 5 to 8 replace them.

- [ ] **Step 3: Verify the shell does not scroll**

```bash
cd apps/lab && pnpm build && test -f out/index.html && echo "PASS: builds"
grep -q "overflow" out/index.html && echo "note: check overflow lands on html and body, not only a wrapper"
```

Then check by eye in `pnpm dev` at a short viewport, for example 600px tall: the page must not scroll and the nav row must stay visible.

- [ ] **Step 4: Commit**

```bash
git add apps/lab/components/Shell.tsx apps/lab/app/page.tsx
git commit -m "feat(lab): add the shell grid and mark rail

Three rows on 100vh, mark rail / content / navigation. The middle row is
minmax(0,1fr): without it the content region will not shrink and the nav is
pushed off screen."
```

---

### Task 5: The fisheye timeline

The hardest task. Read inventory §3 in full before you write anything. It extracts the algorithm with line citations.

**Files:**
- Create: `apps/lab/components/Timeline.tsx`
- Create: `apps/lab/lib/spring.ts`

**Interfaces:**
- Consumes: `Experiment` from Task 3, tokens from Task 1.
- Produces: `<Timeline experiments={Experiment[]} active={number} onSelect={(i: number) => void} />`.

- [ ] **Step 1: Write `lib/spring.ts`**

One integrator, used by every animated value. From `Lab.dc.html:451-452`:

```ts
// x = position, v = velocity, both mutated by the caller's own state object.
// k = stiffness, d = damping. Lower d overshoots more.
export function step(x: number, v: number, target: number, k: number, d: number, reduced: boolean) {
  if (reduced) return { x: target, v: 0 }
  const nv = v * d + (target - x) * k
  return { x: x + nv, v: nv }
}
```

Under `prefers-reduced-motion: reduce` the spring assigns the target directly. That is the whole reduced-motion story for the timeline.

- [ ] **Step 2: Write the item markup and the static fallback**

Each item is a real `<button>`, so `Tab` reaches it natively and no roving-tabindex logic is needed. Structure and exact type values are in the handoff's "Timeline item" table. Contents top to bottom: active rule, number, title, then a baseline-aligned row of date and abstract.

The static fallback matters: before the loop's first frame, item `i` sits at `left: calc(100% * i / n)` with `width: calc(100% / n)`. Keep it. It is what makes the row readable if JS is slow or off, and it is what renders during the static export. **This is the only time `left` and `width` may come from JSX.**

- [ ] **Step 3: Write the rAF loop**

Port `Lab.dc.html:390-470`, fisheye branch only. The core, from the handoff:

```js
const cell = W / n
const sigma = Math.max(cell * 0.85, 90)
const b = px == null ? 0 : Math.exp(-Math.pow((px - (i + 0.5) * cell) / sigma, 2))
const weight = 1 + 2.1 * b + (i === active ? 0.3 : 0)
const targetWidth = W * weight / sumOfWeights   // items always share exactly W
// x target = running sum of target widths
```

Position and width run on `--spring-k` / `--spring-d` (.20 / .68). The reveal value `rv` runs on the **separate** `--spring-k-reveal` / `--spring-d-reveal` (.14 / .72) with target 1 when `b > 0.4` else 0.

Per item per frame, write only:
- `transform: translate3d(x,0,0)` and `width`
- abstract `opacity = rv * 0.55`
- item `background-color = inkRgba(rv)` and `color = rv > 0.5 ? paper : ink`
- date `opacity = 0.32 + 0.18 * rv`
- and re-assert `left = '0px'`, which is what hands ownership over from the static fallback

**Never animate `left`, `margin` or `gap`.** Width is animated on absolutely positioned items so each reflows itself and never its siblings.

Two anti-patterns in the prototype that must NOT be ported: the `document.querySelector('[data-rail]')` fallback at line 361 (use refs only), and starting the loop as a side effect of computing render output at line 697 (start it in an effect on mount).

- [ ] **Step 4: Wire input**

From inventory §6:
- Click an item: it becomes active.
- `ArrowLeft` / `ArrowRight` on the nav: move active and move focus with it, `focus({ preventScroll: true })`.
- `Enter` / `Space`: open the current item's `link` in a new tab, only when `link` exists. Live experiments have none, so it is a no-op there.
- `pointermove` on the nav updates the cursor position, `pointerleave` clears it to `null`.
- Touch: tap to select only. Do not add a drag gesture.

- [ ] **Step 5: Clean up everything**

The loop, the resize listener and the watchdog interval all need cancellation on unmount. The prototype's watchdog restarts a stalled rAF every 400ms. Port it or leave it out, but say which you did and why in your report.

- [ ] **Step 6: Verify**

```bash
cd apps/lab && pnpm build && test -f out/index.html && echo "PASS: builds"
grep -q "calc(100% \* " out/index.html || grep -q "left:" out/index.html && echo "PASS: static fallback rendered into the export"
```

Then in `pnpm dev`, with the browser devtools open:
1. Move the cursor across the nav. Items grow and shrink, the hovered one inverts to ink fill with paper type, the abstract fades in, and the row overshoots and settles.
2. Click an item. The active rule moves. **Confirm the animation does not freeze or jump**, which is the render-stomping failure this plan warns about.
3. Arrow keys move active and focus together.
4. In devtools, enable `prefers-reduced-motion: reduce`. Motion snaps to target with no overshoot and the row is still fully usable.

Report what you saw for each of the four.

- [ ] **Step 7: Commit**

```bash
git add apps/lab/components/Timeline.tsx apps/lab/lib/spring.ts
git commit -m "feat(lab): add the fisheye timeline

One rAF loop writes transform, width and colour straight to the dom through
refs. Those three never go back into jsx after mount: react reconciles
harder than the prototype's runtime and would stomp the loop on every
active change. Width animates on absolutely positioned items so each
reflows itself and never its siblings."
```

---

### Task 6: ContainerB, the case study

**Files:**
- Create: `apps/lab/components/ContainerB.tsx`

**Interfaces:**
- Consumes: `Experiment` from Task 3, the two body components, `Mark` from Task 2.
- Produces: `<ContainerB experiment={Experiment} body={ComponentType} />`.

- [ ] **Step 1: Build the layout**

Port `Lab.dc.html:105-245`. The handoff's section "Container B" gives every value. The order, top to bottom, is meta row, title block, live-project link, two-column body, full-bleed figure, mixed row, technical detail list.

Two things that are easy to get wrong:

- `position: absolute; inset: 0; overflow-y: auto`. **This container scrolls, the shell does not.**
- The two-column body uses `grid-template-columns: repeat(auto-fit, minmax(30ch,1fr))` and **no media queries**. It collapses to one column by itself. Do not add breakpoints.

- [ ] **Step 2: The live-project link**

The brief calls this the loudest element on the page and says it is never buried. Full-width row, 1px ink border, `padding: 16px 24px`, `justify-content: space-between`, "Open the live project" at 22px weight 500, then the bare hostname in mono 13px at `--o-2` with `↗`. Opens in a new tab.

- [ ] **Step 3: Verify**

```bash
cd apps/lab && pnpm build \
  && grep -q "postindex.hannesmoser.at" out/index.html \
  && grep -q "robovac.hannesmoser.at" out/index.html \
  && echo "PASS: both live project links are in the export"
```

Then in `pnpm dev`: select experiment 01, confirm the article scrolls inside itself while the shell does not move, and narrow the window until the two columns collapse to one without a media query.

- [ ] **Step 4: Commit**

```bash
git add apps/lab/components/ContainerB.tsx
git commit -m "feat(lab): add the case study container

Scrolls inside itself while the shell stays fixed. The body columns are
auto-fit minmax(30ch,1fr) with no media queries, so they collapse on their
own."
```

---

### Task 7: ContainerA and Control

**Files:**
- Create: `apps/lab/components/ContainerA.tsx`
- Create: `apps/lab/components/Control.tsx`

**Interfaces:**
- Consumes: `Experiment` from Task 3, tokens from Task 1.
- Produces: `<ContainerA experiment={Experiment} titleRef={RefObject} controls={ReactNode}>{frame}</ContainerA>` and the `Control` primitives. Task 8 fills the frame.

- [ ] **Step 1: Write `Control.tsx`**

One monochrome style, four shapes, all values from the tokens added in Task 1:

- Primary button: ink fill, paper type, 1px ink border, mono 11px, `letter-spacing: .06em`, `padding: 8px 16px`, uppercase label.
- Secondary: same box, transparent fill, ink type.
- Tertiary: same box at `--o-2` with an ink-at-`--o-3` border.
- Slider: native `input[type=range]`, `height: var(--slider-track)`, `accent-color: var(--ink)`, width `--slider-w-lg` or `--slider-w-sm`.
- Toggle: `--toggle-w` × `--toggle-h` 1px ink outline containing a `--toggle-block` ink block translating `1px` → `--toggle-travel`, transition `--dur-1 --ease-out`.

- [ ] **Step 2: Write `ContainerA.tsx`**

`position: absolute; inset: 0; display: grid; grid-template-rows: minmax(0,1fr) auto`: the frame, then the control bar.

The title block sits `position: absolute; left: 32px; top: 8px; max-width: 34ch`, `pointer-events: none`. **It fades to opacity 0.18 on pointerdown and back to 1 on pointerup.**

That fade is driven by the experiment inside the frame, not by `ContainerA`. In the prototype these two components silently coordinate through a shared instance field, which inventory §8 flags as fragile. Here `ContainerA` accepts a `titleRef` and the experiment writes to it. Make the coupling explicit.

The drop hint sits `position: absolute; right: 32px; top: 8px`, mono 11px at `--o-3`: "drop an image file anywhere".

- [ ] **Step 3: Verify**

```bash
cd apps/lab && pnpm build && test -f out/index.html && echo "PASS: builds"
```

Then in `pnpm dev`, select experiment 03 and confirm the control bar renders with all five control shapes, even though nothing is wired to them yet.

- [ ] **Step 4: Commit**

```bash
git add apps/lab/components/ContainerA.tsx apps/lab/components/Control.tsx
git commit -m "feat(lab): add the live experiment container and controls

The title fade on pointerdown belongs to the experiment, not the container,
so ContainerA takes a titleRef instead of the two coordinating through a
shared instance field the way the prototype does."
```

---

### Task 8: ImageDissolve

**Files:**
- Create: `apps/lab/components/ImageDissolve.tsx`

**Interfaces:**
- Consumes: `titleRef` from `ContainerA`, `INK` and `PAPER` from `lib/ink.ts`.
- Produces: `<ImageDissolve experiment={Experiment} titleRef={RefObject} />`, owning its own `gravity`, `grain` and `invert` React state. (This corrects the plan as written, which omitted `experiment`. The component passes it straight through to `ContainerA`.)

Read inventory §4 in full first. It extracts the lifecycle and every constant with line citations.

- [ ] **Step 1: Canvas setup**

Canvas is `position: absolute; inset: 0`, `touch-action: none`, `cursor: crosshair`. Size it from a `ResizeObserver` on the frame. The particle set rebuilds on resize, which is correct here.

Create the observer and disconnect it in **one** `useEffect` with one cleanup path. The prototype splits creation across a ref callback and teardown across a lifecycle method, which inventory §8 flags as a leak path. Do not copy that shape.

- [ ] **Step 2: The particle build**

Fit the source into the frame at `min(W/sw, H/sh) * 0.82`, draw to an offscreen canvas, sample every `grain` pixels. Each sample with alpha ≥ 0.06 becomes a particle carrying its home position and an ink alpha of `1 - luminance`. The image dissolves into the site's single ink rather than keeping its own colours. That is deliberate, not a bug.

Use one `ImageData` buffer written through a `Uint32Array` view. Do not use thousands of `fillRect` calls.

The default source is the lab mark plus a typed label, generated on canvas until the user drops a file.

- [ ] **Step 3: The physics**

All constants from the handoff and inventory §4. Put them in one named block at the top of the file with this comment:

```ts
// Tuned simulation constants, not design tokens. They describe how the
// particles behave, not how the site looks, so they are deliberately not in
// tokens.css. See the plan's Global Constraints.
```

Per frame: pointer repulsion (radius 90 idle, 130 held, force ×1.1 / ×2.4), then either `intact` (spring home, k 0.055, damping 0.87, this is the distortion mode) or `fall` (gravity = slider × 0.5, air drag 0.994 / 0.996, floor bounce −0.22 with 0.72 horizontal loss).

`PULSE` expands a ring from the frame centre at 14px per frame. Particles within 34px of the ring take a radial impulse up to 3.4 plus a slight lift.

Particles draw as `(grain - 1)` px blocks through a 16-step precomputed colour LUT. `INVERT` swaps ink and paper in the LUT. Build the LUT from `INK` and `PAPER` in `lib/ink.ts`, not from fresh literals.

- [ ] **Step 4: Drag and drop**

The whole frame is the target: `dragover` with `preventDefault`, and `drop` accepting images only.

**Fix the leak the prototype has:** it calls `URL.createObjectURL(f)` and never revokes it. Revoke the previous URL when a new image is dropped, and on unmount.

- [ ] **Step 5: Wire the title fade**

On `pointerdown`, set `titleRef.current.style.opacity = '0.18'`. On `pointerup` and `pointerleave`, restore it to `'1'`. Transition is `--dur-2 --ease-out`, which the CSS already carries.

- [ ] **Step 6: Verify**

```bash
cd apps/lab && pnpm build && test -f out/index.html && echo "PASS: builds"
```

The build passing is the important gate here: it proves no canvas or `window` access leaked into a render body, which would throw during the static export's prerender.

Then in `pnpm dev`, on experiment 03:
1. The default source renders as particles.
2. Dragging over the canvas pushes particles away and the title fades to 0.18, then back.
3. `DISSOLVE` drops the particles under gravity, the `GRAVITY` slider changes the fall rate.
4. `PULSE` sends a visible ring outward.
5. `GRAIN` rebuilds the particle set at a different density.
6. `INVERT` swaps ink and paper.
7. `RESET` returns to the intact state.
8. Dropping an image file replaces the source.
9. Resizing the window rebuilds the particles and the canvas still fills the frame.

Report what you saw for each of the nine. If any fails, say so plainly rather than reporting DONE.

- [ ] **Step 7: Commit**

```bash
git add apps/lab/components/ImageDissolve.tsx
git commit -m "feat(lab): add the image dissolve experiment

One ImageData buffer through a Uint32Array view, not thousands of fillRect
calls. The physics constants are tuned simulation values and stay out of
tokens.css on purpose. Unlike the prototype this revokes the object url and
disconnects the resize observer on unmount."
```

---

### Task 9: Wire it together and verify the whole thing

**Files:**
- Modify: `apps/lab/app/page.tsx`

**Interfaces:**
- Consumes: everything.
- Produces: the finished lab.

- [ ] **Step 1: Wire the shell**

`page.tsx` owns `active`, defaulting to the **newest** experiment, which is the last entry in the list. Per the brief, it fills the content area and starts running on first load. No splash, no index screen, no empty state.

Render `ContainerB` when the active experiment's `kind` is `case-study`, `ImageDissolve` when it is `live`. (What shipped inverts the nesting this line describes: `ImageDissolve` renders `ContainerA`, not the other way round. Task 8's own file explains why: `GRAVITY`, `GRAIN` and `INVERT` are the experiment's state, and the control bar that sets them lives in `ContainerA`'s `controls` slot, a different DOM slot from its `children`. One component cannot fill two slots of its own parent, so the experiment wraps the container instead. This was a ruled decision, not a defect.)

- [ ] **Step 2: The full build gate**

```bash
cd apps/lab && pnpm build && test -f out/index.html && echo "PASS: builds"
cd /Users/hannes/src/github.com/eliias/hannesmoser && git status --porcelain && echo "PASS: build is idempotent"
```

- [ ] **Step 3: The 20-item check**

The brief made this a hard rule and the designer warned fisheye degrades here, so measure it rather than assume.

Temporarily extend `experiments.ts` to 20 entries locally, run `pnpm dev`, and record:
- Does every item's number and date stay legible?
- How narrow do the non-hovered items get?
- Does the row still hold a smooth frame rate while an experiment runs?

Then revert to the three real entries. **Do not commit the 20-item list.** Report the answers. If it is bad, that is accepted, not a defect. We need it documented, not fixed.

- [ ] **Step 4: The reduced-motion check**

Enable `prefers-reduced-motion: reduce` in devtools. Confirm:
- The timeline snaps to target with no overshoot and stays fully usable.
- Every CSS transition collapses to 1ms.
- Nothing about the design needs motion to be understood.
- The dissolve's fall physics still animates. **This is the known documented gap. Confirm it, do not fix it.**

- [ ] **Step 5: The accessibility pass**

- `Tab` reaches every timeline item, and they are real `<button>`s.
- Arrow keys move active and focus together.
- `Enter` on a case study opens its live project in a new tab. On experiment 03 it does nothing, which is correct.
- The mark links to the lab root and the back-link to `www.hannesmoser.at`.

- [ ] **Step 6: Commit**

```bash
git add apps/lab/app/page.tsx
git commit -m "feat(lab): wire the shell to the experiments

The newest experiment fills the content area and starts on first load, so
there is no empty state to design."
```

---

### Task 10: Squash and open the PR

- [ ] **Step 1: Final gate**

```bash
cd /Users/hannes/src/github.com/eliias/hannesmoser \
  && bundle exec jekyll build >/dev/null 2>&1 \
  && test ! -e _site/apps \
  && [ "$(grep -rl 'lab.hannesmoser.at' _site --include='*.html' | wc -l | tr -d ' ')" = "7" ] \
  && (cd apps/lab && pnpm build >/dev/null 2>&1 && test -f out/index.html) \
  && git status --porcelain \
  && echo "PASS: all green, tree clean"
```

- [ ] **Step 2: Squash**

```bash
git reset --soft $(git merge-base feat/lab-app-foundation HEAD)
git commit
```

One Conventional Commit. The body carries the PR description. Open with the series line, because this PR is stacked on `feat/lab-app-foundation`.

- [ ] **Step 3: Do not push without asking**

Hannes reviews locally first. Ask before any `git push` or `gh pr create`.

## Notes for the reviewer

**The handoff contradicted itself.** Its root `README.md` says fisheye ships; the designer's own rationale recommends magnetic. The prototype's code defaults to fisheye. Hannes ruled for fisheye. The rationale doc is committed at `docs/lab/prototype-README.md` with a note saying so.

**The handoff's token claim was false.** It states no component holds a value outside the tokens. The delivered prototype has a second untokenized spring, twelve untokenized Control and mark sizes, and the ink RGB written three times. This port adds the missing tokens and collapses the ink to `lib/ink.ts`. `ImageDissolve`'s physics constants are the one deliberate exception.

**`theme.ts` has no port.** Tailwind 4 takes its theme from an `@theme` block in CSS, so the designer's Tailwind 3 style config collapses into `globals.css` alongside the custom properties. One file, one source.

**Timeline item `width` / `transform` / colour must never re-enter JSX after mount.** The prototype re-asserts `left` every frame because it already lost this fight once. React reconciles harder. This is the failure most likely to look like "the animation is janky sometimes" rather than a clean break.

## Follow-ups, deliberately not in this plan

- WebGL point sprites for `ImageDissolve`, and devicePixelRatio scaling.
- A touch gesture giving fisheye the reveal that pointer users get.
- Deep links (`/03-image-dissolve`) and year separators in the timeline.
- Real screenshots replacing the striped placeholder figures, which will change the column rhythm.
- Reduced motion for the dissolve's fall physics.
