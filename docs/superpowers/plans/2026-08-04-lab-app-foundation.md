# Lab App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `apps/lab` Next.js app to this monorepo that builds to static files, ships as its own container, and deploys to the Dokku app `lab` through its own Jenkins job, without disturbing the Jekyll site at the repo root.

**Architecture:** The Jekyll site stays at the repo root. `apps/lab` sits beside it and shares nothing: its own `package.json`, its own `pnpm-lock.yaml`, its own `Dockerfile`, its own `Jenkinsfile`. Both apps produce the same container shape, a build stage followed by `nginx:1-alpine` serving static files. Two Jenkins multibranch jobs read the same repo through different Jenkinsfile paths, and each one gates on the paths that changed in the build.

**Tech Stack:** Next.js 16.3.0 (App Router, `output: 'export'`), React 19.2.8, Tailwind CSS 4.3.3, TypeScript 5.9.3, Node 26, pnpm 11, Docker, nginx, Jenkins, Dokku.

## Global Constraints

- The lab is **not** part of the root pnpm workspace. Do not add `apps/*` to `pnpm-workspace.yaml`. `apps/lab` carries its own `pnpm-lock.yaml`.
- Exact dependency versions, pinned without a range prefix: `next` 16.3.0, `react` 19.2.8, `react-dom` 19.2.8, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `@types/node` 26.1.2, `@types/react` 19.2.18, `@types/react-dom` 19.2.4.
- TypeScript is pinned to 5.9.3, not the current 7.0.2. TypeScript 7 is the native rewrite and it has not been verified against Next 16.3. If you want 7, change it in Task 2 and fall back to 5.9.3 the moment the build complains.
- Docker image name is `registry.conc.at/lab`. Dokku app name is `lab`. This matches the existing 1:1 image-to-app convention of the root site (`hannesmoser` / `hannesmoser`).
- Node base image is `node:26-alpine`. Install pnpm with `npm install -g pnpm@11`, the same way the root `Dockerfile` does. Do not use corepack.
- The lab is a static site. No Node server runs in production. `next build` with `output: 'export'` writes `out/`, and nginx serves that directory.
- Build **no design**. No fonts, no logo, no navigation, no containers, no colors beyond browser defaults. The placeholder page exists only to prove the pipeline. The design brief in `docs/lab/design-brief.md` is delivered separately by a designer.
- `apps/lab/pnpm-workspace.yaml` is required and committed. pnpm 11 ships a `minimumReleaseAge` guard that refuses packages published very recently. `next@16.3.0` was published 2026-08-03, so pnpm wrote a `minimumReleaseAgeExclude` list covering `next@16.3.0` and its nine `@next/swc-*` binaries. Hannes ruled on 2026-08-04 to keep 16.3.0 and accept the override. Without this file in the Docker build context, `pnpm install --frozen-lockfile` fails in the image. The file carries no `packages:` key, so it configures settings only and does not make `apps/lab` a workspace root with members. Regenerate the exclusion list whenever `next` is bumped.
- `next build` must be idempotent against the working tree. Next 16 rewrites `apps/lab/tsconfig.json` on every build, so the committed file must already match what Next produces (see Task 1 Step 3). After any build, `git status --porcelain` must be empty.
- Commit after every task. Squash the branch into one commit before you open the PR, per the repo convention that a PR is always a single commit.
- Write commit messages in Conventional Commits style.

## File Structure

**Created:**

| File | Responsibility |
| --- | --- |
| `apps/lab/package.json` | Dependencies and scripts for the lab, isolated from the root |
| `apps/lab/pnpm-lock.yaml` | The lab's own lockfile, generated in Task 2 |
| `apps/lab/pnpm-workspace.yaml` | Settings only, no `packages:` key. Holds the `minimumReleaseAge` override for `next@16.3.0`. Generated in Task 2 |
| `apps/lab/tsconfig.json` | TypeScript config for the App Router |
| `apps/lab/next.config.ts` | Turns on static export |
| `apps/lab/postcss.config.mjs` | Wires Tailwind 4 into the build |
| `apps/lab/.gitignore` | Keeps build output and `node_modules` out of git |
| `apps/lab/app/layout.tsx` | The root HTML document and metadata |
| `apps/lab/app/page.tsx` | The placeholder page |
| `apps/lab/app/globals.css` | The single Tailwind entry point, and where the designer's tokens will live |
| `apps/lab/Dockerfile` | Two-stage build: Node builder, then nginx |
| `apps/lab/.dockerignore` | Keeps `node_modules` and build output out of the image context |
| `apps/lab/app.json` | Dokku app metadata and health check |
| `apps/lab/Jenkinsfile` | Build and deploy the lab, gated on `apps/lab/` changes |

**Modified:**

| File | Change |
| --- | --- |
| `_config.yml` | Add `apps` to `exclude`, so Jekyll never copies the lab into `_site` |
| `.dockerignore` | Add `apps`, so the lab never enters the root build context |
| `Jenkinsfile` | Gate the deploy on changes outside `apps/` |
| `_includes/navigation.html` | Add the link to the lab |

---

### Task 1: Lab source exists and stays out of the main site

Creates the Next.js source files, then proves that Jekyll and the root Docker build both ignore them. The order matters: create the files first so the guard rail has something real to fail on.

**Files:**
- Create: `apps/lab/package.json`
- Create: `apps/lab/tsconfig.json`
- Create: `apps/lab/next.config.ts`
- Create: `apps/lab/postcss.config.mjs`
- Create: `apps/lab/.gitignore`
- Create: `apps/lab/app/layout.tsx`
- Create: `apps/lab/app/page.tsx`
- Create: `apps/lab/app/globals.css`
- Modify: `_config.yml` (the `exclude:` list)
- Modify: `.dockerignore`

**Interfaces:**
- Consumes: nothing.
- Produces: the directory `apps/lab` with a runnable Next.js source tree. Task 2 installs and builds it. Task 3 containerizes it.

- [ ] **Step 0: Branch off main**

The repo default branch is `main` and work does not land on it directly.

```bash
git switch -c feat/lab-app-foundation main
```

- [ ] **Step 1: Create `apps/lab/package.json`**

Do not run `pnpm install` yet. Task 2 does that, and installing now would put a large `node_modules` tree in front of the Jekyll check in Step 9.

```json
{
  "name": "lab",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "26.1.2",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3"
  }
}
```

- [ ] **Step 2: Create `apps/lab/next.config.ts`**

`output: 'export'` makes `next build` write static files to `out/` with no server. `trailingSlash: true` makes every route a directory with an `index.html`, which nginx serves without any rewrite rules. `images.unoptimized` is required, because the Next image optimizer needs a running server.

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

- [ ] **Step 3: Create `apps/lab/tsconfig.json`**

Write this exactly. It is the shape Next 16 itself produces, including the expanded array formatting.

Next 16 rewrites this file on **every** `next build`. It forces `"jsx": "react-jsx"` (Next 16 uses the React automatic runtime, so `"preserve"` is rejected), it appends `.next/dev/types/**/*.ts` to `include`, and it reformats every inline array onto separate lines. Seeding the file with Next's own output makes the build idempotent. Any other formatting leaves the working tree dirty after each build and breaks the clean-tree gate in Task 7.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

- [ ] **Step 4: Create `apps/lab/postcss.config.mjs`**

Tailwind 4 ships its PostCSS integration as a separate package. This is the whole config.

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 5: Create `apps/lab/app/globals.css`**

One import. No tokens yet. The designer's `@theme` block lands in this file, which is why it stays deliberately empty.

```css
@import "tailwindcss";

/* Design tokens go here, in an @theme block.
   See docs/lab/design-brief.md, section "Delivery". */
```

- [ ] **Step 6: Create `apps/lab/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'lab.hannesmoser.at',
  description: 'Experiments by Hannes Moser',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Create `apps/lab/app/page.tsx`**

```tsx
export default function Page() {
  return (
    <main>
      <h1>lab</h1>
      <p>Placeholder. The design lands here.</p>
    </main>
  )
}
```

- [ ] **Step 8: Create `apps/lab/.gitignore`**

```gitignore
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 9: Run the failing check**

Jekyll copies any file it does not recognise into `_site`. The lab source is not excluded yet, so it leaks.

Run:

```bash
bundle exec jekyll build && ls _site/apps/lab
```

Expected: FAIL the intent, PASS the shell command. `ls` lists `app`, `next.config.ts`, `package.json` and the rest. That output is the bug. If `ls` reports "No such file or directory", stop and find out why, because the guard rail in the next step would then be untested.

- [ ] **Step 10: Add `apps` to the Jekyll exclude list**

In `_config.yml`, inside the `exclude:` block, add one entry. Put it next to the other directory entries, right after `- config`:

```yaml
exclude:
  - bin
  - config
  - apps
  - vite.config.ts
```

- [ ] **Step 11: Run the check again**

Run:

```bash
bundle exec jekyll build && test ! -e _site/apps && echo "PASS: apps is excluded"
```

Expected: PASS, and the line `PASS: apps is excluded`.

- [ ] **Step 12: Add `apps` to the root `.dockerignore`**

This keeps the lab source out of the root image build context. Without it every lab commit invalidates the root Docker cache. Append one line to `.dockerignore`:

```gitignore
.git
node_modules
_site
.jekyll-cache
.claude
apps
```

- [ ] **Step 13: Verify the root build context no longer carries the lab**

This checks the build context itself with a throwaway busybox image. Do not run the real root `Dockerfile` for this: it installs gems, installs node packages and builds Jekyll, which takes minutes and tells you nothing extra.

```bash
docker build -t root-context-check -f - . <<'EOF'
FROM busybox
COPY . /ctx
RUN test ! -e /ctx/apps && echo "PASS: apps is not in the root build context"
EOF
docker image rm root-context-check
```

Expected: the build log contains `PASS: apps is not in the root build context`. If `apps` still reaches the context the `RUN` fails and the build stops with a non-zero exit.

- [ ] **Step 14: Commit**

```bash
git add apps/lab _config.yml .dockerignore
git commit -m "feat(lab): add next.js source and keep it out of the main site

Jekyll copies unrecognised files into _site, so the lab source would have
been published on www.hannesmoser.at. The exclude entry stops that. The
.dockerignore entry keeps lab commits from busting the root image cache."
```

---

### Task 2: The lab builds to static files

**Files:**
- Create: `apps/lab/pnpm-lock.yaml` (generated)
- Create: `apps/lab/pnpm-workspace.yaml` (generated by pnpm, see Global Constraints)
- Test: none. The build output is the assertion.

**Interfaces:**
- Consumes: the source tree from Task 1.
- Produces: `apps/lab/out/index.html`, the artifact that Task 3 copies into nginx. Also `apps/lab/pnpm-lock.yaml` and `apps/lab/pnpm-workspace.yaml`, both of which Task 3's Dockerfile must copy before it runs `pnpm install --frozen-lockfile`.

- [ ] **Step 1: Run the failing check**

Run:

```bash
cd apps/lab && test -f out/index.html && echo PASS || echo "FAIL: no build output"
```

Expected: `FAIL: no build output`.

- [ ] **Step 2: Install dependencies**

Run from `apps/lab`, not from the repo root. The lab is deliberately outside the root pnpm workspace, so a root install does nothing for it.

`--ignore-workspace` is required. pnpm walks up the directory tree, finds `pnpm-workspace.yaml` at the repo root, and would otherwise resolve against it. The flag makes `apps/lab` a standalone project and produces a plain single-project lockfile, which is exactly what the Dockerfile in Task 3 installs from.

```bash
cd apps/lab && pnpm install --ignore-workspace
```

Expected: an install summary, and a new `apps/lab/pnpm-lock.yaml`.

This flag was needed for this first install only, because `apps/lab/pnpm-workspace.yaml` did not exist yet. Once this step creates that file, pnpm finds it inside `apps/lab` and stops walking up, so later `pnpm install` and `pnpm add` calls inside `apps/lab` do not need the flag. Inside the container there is no workspace file in the build context either, so the Dockerfile does not need it.

- [ ] **Step 3: Build**

```bash
cd apps/lab && pnpm build
```

Expected: a route table listing `/` as static, and the message that the export finished.

If the build fails inside TypeScript, check the installed version with `cd apps/lab && pnpm list typescript`. It must be 5.9.3.

- [ ] **Step 4: Run the check again**

```bash
cd apps/lab && test -f out/index.html && grep -q "Placeholder" out/index.html && echo "PASS: static export works"
```

Expected: PASS, and the line `PASS: static export works`.

- [ ] **Step 5: Confirm the root lockfile is untouched**

This is the whole point of keeping the two apps apart, so prove it.

```bash
git status --porcelain pnpm-lock.yaml pnpm-workspace.yaml package.json
```

Expected: no output at all.

- [ ] **Step 6: Commit**

```bash
git add apps/lab/pnpm-lock.yaml apps/lab/pnpm-workspace.yaml
git commit -m "build(lab): add lockfile for the isolated lab install

pnpm 11 blocks packages published in the last few days. next@16.3.0 shipped
2026-08-03, so pnpm wrote a minimumReleaseAgeExclude list into
apps/lab/pnpm-workspace.yaml. The file has no packages: key, so it carries
settings only. The docker build needs it or the install fails."
```

---

### Task 3: The lab ships as a container

**Files:**
- Create: `apps/lab/Dockerfile`
- Create: `apps/lab/.dockerignore`
- Create: `apps/lab/app.json`

**Interfaces:**
- Consumes: `apps/lab/package.json`, `apps/lab/pnpm-lock.yaml`, `apps/lab/pnpm-workspace.yaml`, and the source tree.
- Produces: a container image that serves the lab on port 80. Task 4's Jenkinsfile builds it with `apps/lab` as the build context, so every path inside the Dockerfile is relative to `apps/lab`.

- [ ] **Step 1: Create `apps/lab/.dockerignore`**

Write this before the Dockerfile. Without it, `COPY . ./` drags the local `node_modules` and `out/` into the image and the build is both slow and wrong.

```gitignore
.git
node_modules
.next
out
```

- [ ] **Step 2: Create `apps/lab/Dockerfile`**

Same two-stage shape as the root `Dockerfile`, and the same pnpm install method, so the two images stay one concept.

```dockerfile
FROM node:26-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . ./

RUN pnpm build

FROM nginx:1-alpine

RUN mkdir -p /app
COPY app.json /app/app.json

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/out .

EXPOSE 80
```

- [ ] **Step 3: Create `apps/lab/app.json`**

Same shape as the root `app.json`, with the lab's name.

```json
{
  "name": "lab",
  "description": "Experiments by Hannes Moser",
  "keywords": [
    "hannesmoser",
    "lab"
  ],
  "formation": {
    "web": {
      "quantity": 1
    }
  },
  "healthchecks": {
    "web": [
      {
        "type": "startup",
        "name": "web check",
        "description": "Checking if the web app responds to the / endpoint.",
        "path": "/",
        "attempts": 5
      }
    ]
  }
}
```

- [ ] **Step 4: Build the image**

Note the build context is `apps/lab`, not the repo root.

```bash
docker build -t lab:plan-check apps/lab
```

Expected: a successful build ending in a final image id.

- [ ] **Step 5: Run it and check that it serves the page**

```bash
docker run --rm -d -p 8099:80 --name lab-plan-check lab:plan-check
sleep 2
curl -sf http://localhost:8099/ | grep -q "Placeholder" \
  && echo "PASS: container serves the lab" \
  || echo "FAIL: the container did not serve the placeholder page"
docker stop lab-plan-check
```

Expected: the line `PASS: container serves the lab`. The `docker stop` runs whether the check passed or failed, so the container never leaks.

- [ ] **Step 6: Check that `app.json` reached the runtime image**

Dokku reads this file from `/app/app.json` inside the running container. If it is missing, the health check silently does not exist.

```bash
docker run --rm lab:plan-check cat /app/app.json | grep -q '"name": "lab"' \
  && echo "PASS: app.json is in the image"
```

Expected: PASS, and the line `PASS: app.json is in the image`.

- [ ] **Step 7: Clean up the check image**

```bash
docker image rm lab:plan-check
```

- [ ] **Step 8: Commit**

```bash
git add apps/lab/Dockerfile apps/lab/.dockerignore apps/lab/app.json
git commit -m "build(lab): containerize the lab behind nginx

Static export means no node process in production, so the runtime image is
the same nginx:1-alpine shape the root site already uses. Build context is
apps/lab, so the image never sees the jekyll site."
```

---

### Task 4: The lab deploys from its own Jenkins job

**Files:**
- Create: `apps/lab/Jenkinsfile`

**Interfaces:**
- Consumes: `apps/lab/Dockerfile`.
- Produces: two Groovy helper functions, `changedPaths()` and `labChanged()`. Task 5 writes the mirror image of these in the root `Jenkinsfile`, named `changedPaths()` and `siteChanged()`. Both files carry their own private copy. There is no shared library, and copying nine lines is cheaper than adding one.

**On testing:** a Jenkinsfile has no cheap local test. The path logic is deliberately kept to two tiny pure functions so it can be read and checked by eye. Real verification happens on the first run of the Jenkins job, in Step 5.

- [ ] **Step 1: Create `apps/lab/Jenkinsfile`**

`currentBuild.changeSets` covers every commit in the build, not only the newest one. That matters when a push carries five commits, or when a merge lands a batch. An empty changeset means Jenkins cannot tell what changed, which happens on the first build of a branch, on a manual run, and on a replay. In that case we deploy. Building too much is safe; skipping a real change is not.

```groovy
pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  stages {
    stage("Environment") {
      steps {
        script {
          env.BUILD_TAG = env.BRANCH_NAME.toString().hashCode()
          env.LAB_CHANGED = labChanged().toString()
          echo "lab changed: ${env.LAB_CHANGED}"
        }
      }
    }

    stage("Build & Deploy") {
      when {
        allOf {
          branch 'main'
          expression { env.LAB_CHANGED == "true" }
        }
      }

      steps {
        sh label: 'container', script: ''' #!/usr/bin/env bash
        # build and tag release artifact
        sudo docker build \
          -t lab:$BUILD_NUMBER \
          -t lab:latest \
          -t registry.conc.at/lab:$BUILD_NUMBER \
          -t registry.conc.at/lab:latest \
          apps/lab

        sudo docker push registry.conc.at/lab:$BUILD_NUMBER
        sudo docker push registry.conc.at/lab:latest
        '''

        sh label: 'deploy', script: ''' #!/usr/bin/env bash
        # deploy
        ssh dokku@projects.conc.at "git:from-image lab registry.conc.at/lab:$BUILD_NUMBER"
        '''
      }
    }
  }
}

// Every path touched by every commit in this build.
// Empty when Jenkins cannot tell: first build of a branch, manual run, replay.
def changedPaths() {
  return currentBuild.changeSets.collectMany { set ->
    set.items.collectMany { commit -> commit.affectedPaths }
  }
}

// Deploy the lab when the lab changed, or when we cannot tell what changed.
def labChanged() {
  def paths = changedPaths()
  return paths.isEmpty() || paths.any { it.startsWith("apps/lab/") }
}
```

- [ ] **Step 2: Check the Groovy parses**

If `groovy` is on your machine this catches a syntax error in a second. If it is not installed, skip this step. It is a convenience, not a gate.

```bash
command -v groovy >/dev/null \
  && groovy -e 'new GroovyShell().parse(new File("apps/lab/Jenkinsfile")); println "PASS: parses"' \
  || echo "SKIP: groovy not installed, Jenkins will report syntax errors on the first run"
```

Expected: `PASS: parses`, or the SKIP line.

- [ ] **Step 3: Commit**

```bash
git add apps/lab/Jenkinsfile
git commit -m "ci(lab): add path-gated pipeline for the lab

Reads currentBuild.changeSets rather than the when{changeset} directive, so
a push carrying several commits is handled as one set. An empty changeset
deploys: building too much is safe, skipping a real change is not."
```

- [ ] **Step 4: Confirm the Jenkins job exists**

Hannes creates a second multibranch pipeline job pointing at this repo with the Jenkinsfile path `apps/lab/Jenkinsfile`. This step is a checkpoint, not work for the implementer. Do not proceed to Task 5 assuming it is done. Ask.

- [x] **Step 4b: Confirm the Dokku prerequisites for `lab.hannesmoser.at`**

This step is a checkpoint, not work for the implementer. Hannes confirmed on 2026-08-04 that all of these are already done on `projects.conc.at`:

- DNS for `lab.hannesmoser.at` resolves to the host.
- `dokku apps:create lab` has run.
- `dokku domains:set lab lab.hannesmoser.at` has run.
- The Let's Encrypt certificate for `lab.hannesmoser.at` is issued.

Recorded here so the next reader knows the deploy already has a target and does not need to rediscover it.

- [ ] **Step 5: Watch the first run**

After the branch merges to `main`, check the job console output for the line `lab changed: true`, then confirm that `registry.conc.at/lab` received a tag and that `https://lab.hannesmoser.at` serves the placeholder page.

If the run fails with a Jenkins sandbox rejection on `changeSets`, `affectedPaths`, or `collectMany`, approve the signature in **Manage Jenkins → In-process Script Approval**. This is expected the first time these methods are used on a Jenkins controller.

---

### Task 5: The root job ignores lab-only changes

**Files:**
- Modify: `Jenkinsfile`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `changedPaths()` and `siteChanged()` in the root `Jenkinsfile`. `changedPaths()` is byte-identical to the one in `apps/lab/Jenkinsfile`.

**Why not `when { changeset }`:** the declarative `changeset` directive matches a glob. It cannot express "any path except `apps/`". A commit that touches both trees must deploy both apps, and a negated glob would deploy the wrong set. The four-line helper says exactly what we mean.

- [ ] **Step 1: Add the two helper functions to the bottom of `Jenkinsfile`**

Append below the closing brace of the `pipeline` block.

```groovy
// Every path touched by every commit in this build.
// Empty when Jenkins cannot tell: first build of a branch, manual run, replay.
def changedPaths() {
  return currentBuild.changeSets.collectMany { set ->
    set.items.collectMany { commit -> commit.affectedPaths }
  }
}

// Deploy the site when anything outside apps/ changed, or when we cannot tell.
def siteChanged() {
  def paths = changedPaths()
  return paths.isEmpty() || paths.any { !it.startsWith("apps/") }
}
```

- [ ] **Step 2: Set the flag in the Environment stage**

Replace the body of the existing `script` block in the `Environment` stage:

```groovy
        script {
          env.BUILD_TAG = env.BRANCH_NAME.toString().hashCode()
          env.SITE_CHANGED = siteChanged().toString()
          echo "site changed: ${env.SITE_CHANGED}"
        }
```

- [ ] **Step 3: Gate the deploy stage**

Replace the existing `when` block of the `Build & Deploy` stage:

```groovy
      when {
        allOf {
          branch 'main'
          expression { env.SITE_CHANGED == "true" }
        }
      }
```

- [ ] **Step 4: Check the Groovy parses**

```bash
command -v groovy >/dev/null \
  && groovy -e 'new GroovyShell().parse(new File("Jenkinsfile")); println "PASS: parses"' \
  || echo "SKIP: groovy not installed"
```

Expected: `PASS: parses`, or the SKIP line.

- [ ] **Step 5: Check both files agree on `changedPaths`**

The two copies must not drift.

```bash
diff <(sed -n '/^def changedPaths/,/^}/p' Jenkinsfile) \
     <(sed -n '/^def changedPaths/,/^}/p' apps/lab/Jenkinsfile) \
  && echo "PASS: changedPaths is identical in both files"
```

Expected: PASS, and the line `PASS: changedPaths is identical in both files`.

- [ ] **Step 6: Commit**

```bash
git add Jenkinsfile
git commit -m "ci: skip the site deploy when only apps/ changed

The when{changeset} directive matches a glob and cannot express 'anything
except apps/', so a commit touching both trees would deploy the wrong set.
The helper reads currentBuild.changeSets instead."
```

---

### Task 6: The main site links to the lab

**Files:**
- Modify: `_includes/navigation.html`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing that later tasks use. This is the last task.

- [ ] **Step 1: Run the failing check**

```bash
bundle exec jekyll build && grep -q "lab.hannesmoser.at" _site/index.html \
  && echo PASS || echo "FAIL: no lab link in the navigation"
```

Expected: `FAIL: no lab link in the navigation`.

- [ ] **Step 2: Add the link**

In `_includes/navigation.html`, add one anchor after the Projects link. It is an absolute URL, because the lab is a different host, so the `site.baseurl` prefix used by the other links does not apply. The class list matches the neighbouring links exactly.

```html
  <a class="text-lg font-medium" href="https://lab.hannesmoser.at">Lab</a>
```

The block then reads:

```html
  <a class="text-lg font-medium" href={{"/projects/" | prepend: site.baseurl }}>Projects</a>
  <a class="text-lg font-medium" href="https://lab.hannesmoser.at">Lab</a>
  <a class="text-lg font-medium" href={{"/lectures/" | prepend: site.baseurl }}>Lectures</a>
```

- [ ] **Step 3: Run the check again**

```bash
bundle exec jekyll build && grep -q "lab.hannesmoser.at" _site/index.html \
  && echo "PASS: the lab link is in the navigation"
```

Expected: PASS, and the line `PASS: the lab link is in the navigation`.

- [ ] **Step 4: Commit**

```bash
git add _includes/navigation.html
git commit -m "feat: link the lab from the main navigation"
```

---

### Task 7: Squash and open the PR

The repo convention is one commit per PR, at every point in the PR's life, not only before merge.

- [ ] **Step 1: Confirm every check still passes from a clean tree**

```bash
bundle exec jekyll build \
  && test ! -e _site/apps \
  && grep -q "lab.hannesmoser.at" _site/index.html \
  && (cd apps/lab && pnpm build && test -f out/index.html) \
  && echo "PASS: all checks green"
```

Expected: PASS, and the line `PASS: all checks green`.

- [ ] **Step 1b: Confirm the build left the tree clean**

Run this from the repo root, after the build in Step 1. Next 16 rewrites `tsconfig.json` on every build, so this catches the case where the committed file drifted from what Next produces.

```bash
git status --porcelain && echo "PASS: build is idempotent, tree is clean"
```

Expected: no file listing at all, then the line `PASS: build is idempotent, tree is clean`. Any ` M apps/lab/tsconfig.json` line means the committed tsconfig does not match Next's output. Commit Next's version rather than reverting it.

- [ ] **Step 2: Squash the branch into one commit**

```bash
git reset --soft $(git merge-base HEAD main)
git commit
```

Write the message as a single Conventional Commit. Body carries the same content as the PR description: the problem in one or two sentences, then the facts. Under about 120 words.

- [ ] **Step 3: Push and open the PR**

```bash
git push --force-with-lease -u origin HEAD
gh pr create --fill
```

---

## Notes for the reviewer

Three decisions that are not obvious from the diff:

**The lab is outside the root pnpm workspace.** The two apps share no code and no dependencies. A shared lockfile would mean a lab dependency bump rewrites the root lockfile, which invalidates the root Docker layer cache and rebuilds the Jekyll site for nothing. The cost of keeping them apart is one extra `pnpm install`.

**`changedPaths()` is duplicated in both Jenkinsfiles.** A shared library is a Jenkins controller configuration, a separate repo or a `vars/` directory, and a versioning decision. That is a lot of machinery for nine lines. Copy it. Task 5 Step 5 checked that the two copies matched at the time of writing, but that check is a plan step, not automation: nothing re-runs it after this branch merges, so the copies can drift apart without warning.

**An empty changeset deploys.** Jenkins reports no changes on the first build of a branch, on a manual run, and on a replay. Treating that as "nothing changed" would silently skip a real deploy, so both jobs treat it as "deploy".

## Follow-ups, deliberately not in this plan

- Linting and formatting for `apps/lab`. The designer's prototype will arrive with its own opinions, so choosing now is speculative.
- A test runner for `apps/lab`. There is nothing to test until there are components.
- Moving the Jekyll site to `apps/www` for symmetry. Churn with no payoff today.
- Upgrading `apps/lab` to TypeScript 7.
