# Repository guidance

## System Architecture & Constraints

Stamped is a local-first personal travel map. User maps, notes, and theme live in
browser `localStorage`. Public shares are reduced snapshots created and read
through `app/api/share/` and stored in Upstash Redis. Map boundaries and the
city catalog are bundled static data under `public/`.

Read [`STEERING.md`](STEERING.md) for product, data, privacy, and operational
decisions that are not evident from source code. This file is the authoritative
implementation workflow.

### Primary Languages

TypeScript, Next.js 15.5 (App Router, Turbopack), React 19

### Type Safety & Style

Strict TypeScript (`tsconfig.json` has `strict: true`), prefer zero `any`,
Tailwind CSS 4 + shadcn/ui-style primitives, fonts via Geist Sans / Geist Mono /
Outfit (wordmark). ESLint 9 uses Next core-web-vitals and TypeScript
configurations; Prettier handles formatting.

Do not weaken compiler or lint settings to make a change pass. Preserve the
existing App Router, path alias (`@/*`), Tailwind, shadcn/ui, and local-first
conventions.

Before changing Next.js, React, App Router, route handler, metadata, image, or
other framework-specific code, read the relevant documentation installed with
the project (and the matching official documentation when needed).

### Database / State

- **Client state:** browser `localStorage` for travel maps, notes, and theme
- **Share snapshots:** Upstash Redis via `app/lib/shareStore.ts` and
  `app/lib/redis.ts`
- **Static geography:** bundled data under `public/`; regenerate cities with
  `npm run build:cities` (`scripts/build-city-catalog.mjs`)

There is no application PostgreSQL, Drizzle, or TanStack Query layer. Do not
introduce one without an explicit product decision.

### Layout conventions

- `app/` — routes, layouts, API handlers, feature components, hooks, contexts,
  server helpers, and application types
- Keep route and UI code in `app/page.tsx`, route folders, and
  `app/components/`; keep business logic out of components
- Pure domain logic in `app/utils/`, shared constants in `app/constants/`,
  server-only share persistence in `app/lib/`

## Execution & Verification Commands

```bash
npm install          # Install Dependencies
npm run dev          # Run Local Server (Turbopack)
npm run test         # Run Test Suite (Vitest; no network)
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
npm run validate     # Local Validation: lint, TypeScript, and unit tests
npm run build        # Production build (when verifying deployability)
```

`npm test` / `npm run test` runs the backend and business-logic unit suite
without network access. Prefer those tests when adding coverage; frontend
component tests are optional unless complex UI state makes them worthwhile.

## Core Agent Boundaries

- **Dependency Guard:** Do not install external libraries, wrappers, or
  utilities to solve trivial tasks. Write clean, native helper functions first.
  If a package is necessary, request explicit approval.
- **Architectural Isolation:** Keep concerns strictly separated. Do not mix
  business logic with UI rendering files. Group modules logically by domain
  (utils / lib / components / API), not by dumping unrelated helpers together.
- **Git Hygiene:** Never commit directly to default branches (`main`). Create
  clean, short-lived feature branches prefixed with `feat/` or `fix/`.
- **Secrets (hard rule):** Do not open `.env` files. Do not open, read, print,
  parse, diff, copy, modify, or otherwise access any `.env*` file (including
  `.env`, `.env.local`, `.env.development.local`, `.env.production.local`, and
  similar). This applies even when debugging, writing docs, or the user asks
  you to "check env" — refuse and ask them to paste only the non-secret names
  or values they intentionally share. Use only documented variable names from
  `.env.example` / README and ask the user to configure secret values.
- **External-service safety:** Treat Upstash Redis, Vercel environments,
  browser storage, and bundled/generated geographic data as production-
  sensitive. Never flush, delete, or otherwise destructively modify production
  data. Design migrations with dry-run support; run a dry run first. Request
  explicit approval before any external mutation, including Redis writes,
  Vercel environment/deployment changes, or migration execution.

## Pull Request Workflow

- **Template:** When preparing a pull request, use
  [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
- **Review Tier:** Recommend exactly one review tier based on the highest-risk
  change in the pull request:
  - **Auto-approve** — formatting, generated output, or standard documentation
    only
  - **Spot-check** — isolated low-risk UI or mechanical changes
  - **Full review** — architecture, business logic, auth, permissions,
    database/Redis behavior, APIs, AI behavior, dependencies, or migrations
- **Human Control:** A recommended Auto-approve tier never authorizes an agent
  to merge. Only the user may approve, mark ready, or merge a pull request.
- **Evidence:** Include screenshots for user-visible changes when reliable
  local capture is available; otherwise state why screenshots are unavailable.
- **Clickable handoffs:** In every user-facing handoff, provide clickable
  Markdown links for all available deliverables and relevant artifacts,
  including pull requests, preview deployments, local HTML walkthroughs, and
  changed files. Do not leave a bare local path when a clickable link can be
  rendered.
- **Local walkthroughs:** The explain-diff-html skill writes its HTML report to
  `/tmp` on local disk; that file is available only to the current user session.
  Link it in the user-facing handoff, but do not add the local `/tmp` link (or
  its filesystem path) to the pull-request description. Include a walkthrough in
  the PR only when it has a durable, reviewer-accessible URL.
- **Draft Deliverable:** For substantial work that belongs on a feature branch,
  commit the completed work, push the branch, and publish a draft pull request
  using the template. The draft PR is the final deliverable. Small changes and
  experiments do not require a new draft PR; add them to an existing relevant
  draft when appropriate.

## Definition of "Done"

Before you present a task as complete or draft a pull request, execute these
validation gates in order:

1. **Local Validation:** Run `npm run validate` and ensure linting, TypeScript,
   and unit tests have zero errors. Run `npm run build` when deployability or
   framework behavior is in doubt.
2. **Diff Explanation:** For substantial or high-risk changes, call the
   explain-diff-html skill (output lands under `/tmp` locally; share that link
   in the handoff only—never in the PR description). For small follow-up fixes,
   produce a clean terminal diff detailing exactly which files were altered and
   why, highlighting any potential architectural risks. In both cases, run
   `git diff --check`.
3. **Draft PR for Feature Work:** For substantial feature-branch work, commit
   and push the validated changes, then publish the required draft PR. Do not
   mark it ready for review, approve it, or merge it.
