# hannesmoser

Two deployables in one repository, with separate toolchains, separate installs
and separate pipelines.

|  | Root | `apps/lab` |
|---|---|---|
| What | Jekyll 4 personal site and blog | Next 16 static export, live experiments |
| Serves | www.hannesmoser.at | lab.hannesmoser.at |
| Dev | `bin/dev` (foreman runs jekyll and vite together) | `pnpm dev`, from inside `apps/lab` |
| Build | `bundle exec jekyll build`, output `_site/` | `pnpm build`, output `out/` |
| CSS | Tailwind 3 with `tailwind.config.js` | Tailwind 4, no config file |
| Packages | pnpm at the root | pnpm inside `apps/lab`, own lockfile |

## Traps

Two Tailwind majors live here. The root site configures itself in
`tailwind.config.js`; the lab has no config file and declares its theme with
`@theme inline` in `app/globals.css`. An answer for one is wrong for the other.

`apps/lab` is NOT a member of the root pnpm workspace. It carries its own
`package.json`, lockfile and `pnpm-workspace.yaml`. Run pnpm from inside that
directory, never from the root.

Both Jenkinsfiles deploy from `main` only and each decides by changed path. The
lab builds when a changed path starts with `apps/lab/`. The site builds when
ANY changed path does not start with `apps/`, so touching `.claude/`, `docs/`
or this file redeploys the site.

`apps/lab/AGENTS.md` is written by `next dev` itself, and `apps/lab/CLAUDE.md`
only imports it. Do not delete the block it owns. Commit the regenerated file
with your work, otherwise the tree never comes clean.

## The site

Ruby is pinned to 4.0.6. Use `bundle exec` for jekyll and rubocop.

Posts live in `_posts`, the journey collection in `_journey` (sorted by date),
and standalone pages are `.md` files at the repository root. Layouts are in
`_layouts`.

Frontend assets live in `_frontend` and reach Jekyll through `vite-plugin-ruby`,
so a new script or stylesheet needs an entrypoint under `_frontend/entrypoints`
before a template can reference it.

`_config.yml` excludes `apps`, so Jekyll never tries to build the lab into the
site. Anything new at the root that is not content belongs in that exclude list.

## The lab

Adding an experiment, or debugging one that draws the wrong thing, has its own
skill: `adding-an-experiment`. Read it first. It carries the wiring, the shape
a live component takes, and the reason to verify a simulation under node before
the browser.
