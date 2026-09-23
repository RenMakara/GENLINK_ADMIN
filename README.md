# GenLink KH — Admin Portal

The staff-facing admin dashboard for GenLink KH. A **separate application** from the Flutter
mobile app, driving the same Spring Boot backend through a dedicated `/api/v1/admin/**` surface.

> **This repository does not define its own architecture.** The design lives outside it and
> governs everything here — see [Source of truth](#source-of-truth) before writing code.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix) |
| Package manager | pnpm |
| Node | See `.nvmrc` |

## Getting started

```bash
pnpm install
pnpm dev
```

Then open **http://localhost:3000/admin** — not `/`.

The portal is served under a base path (SSOT §1.7): one nginx origin serves both it and the
API, which removes CORS from the MVP entirely. `/` redirects to `/admin` so a bare visit still
lands somewhere useful, and the path comes from `NEXT_PUBLIC_BASE_PATH` — set it empty once
the portal has its own subdomain.

Then the checks CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm check:contrast && pnpm build
```

## Running against the backend

The portal talks to the Spring API through the **relative** path `/api/v1`, because in
production nginx serves both from one origin (SSOT §1.7) — which is what removes CORS from the
MVP entirely.

In development there is no nginx, so `next.config.ts` proxies `/api/v1/**` to
`ADMIN_API_ORIGIN` (default `http://localhost:8888`). That keeps the base URL relative in both
environments, so no code branches on which one it is.

**The backend needs one setting for local development:**

```
ADMIN_CORS_ORIGINS=http://localhost:3000
```

Without it every admin API call answers `403 Invalid CORS request`. That is not a bug — it is
ADM-028's allow-list working. In development the browser is `localhost:3000` and Spring is
`localhost:8888`, which is genuinely cross-origin; in production they share an origin, the
browser's `Origin` matches the host, and Spring does not treat the request as CORS at all.

> Leave `ADMIN_CORS_ORIGINS` **empty** in production under path-based routing. It is only
> populated when the portal moves to its own subdomain.

## CI

`.github/workflows/ci.yml` runs those five gates on every pull request, and again on `main`
after merge — a PR is tested against its own head, so two that each pass can still break `main`
together.

Every gate runs even after an earlier one fails, so a push gets the complete list of problems
in one round trip rather than one per attempt.

**The test job runs with `TZ=America/New_York`, deliberately.** The display timezone is fixed to
Asia/Phnom_Penh (SSOT §9.5), and every machine on this team is set to it — which is exactly the
configuration in which a date formatted without an explicit `timeZone` looks correct. With the
pinning removed the date suite passes 24/24 locally and fails 9 assertions under a disagreeing
clock. Do not "fix" that variable to match production.

### Repository setting that is not in this repo

CI can only block a merge once **branch protection** is configured on GitHub, which is a
setting rather than a file. On `main`, require the status check **`Lint, typecheck, test,
build`** to pass before merging.

Until that is switched on the workflow reports failures but does not prevent anyone merging
through them.

## Source of truth

The design and the implementation plan live in the **`genlink_kh_fullstack` workspace**, not in
this repository. Both repos sit side by side:

```
genlink_kh_fullstack/
├─ backend/        Spring Boot API
├─ genlink-admin/  ← you are here
└─ docs/
   ├─ admin-dashboard.md              ← THE SSOT. Approved; governs this repo.
   └─ admin-dashboard/                ← implementation plan
      ├─ implementation-roadmap.md    phases, critical path, task conventions
      ├─ implementation-order.md      what to work on, in order
      ├─ phase-0.md … phase-6.md      the 120 ADM task definitions
      ├─ frontend-tasks.md            this repo's queue and working agreements
      └─ testing-plan.md              test strategy
```

They are deliberately *not* linked relatively: this repository can be cloned on its own, and a
relative link would break. Ask for the workspace if you do not have it.

**If something here contradicts the SSOT, the SSOT wins.** If the SSOT looks wrong, raise it —
do not work around it in code. It is amended additively and dated, never silently.

## Conventions worth knowing before your first commit

These are the ones that are expensive to unpick later. The full list is in
`docs/admin-dashboard/frontend-tasks.md`.

- **A feature never imports another feature.** Shared code moves to `components/` or `lib/`.
  Enforced by ESLint, not by good intentions.
- **`'use client'` goes on the leaf**, not the page. Pushing it to the top of a route throws
  away the App Router's main benefit.
- **No hostname, IP, port or scheme in code.** `lib/config/env.ts` is the only file that reads
  `process.env`. A search for the EC2 instance's IP must return nothing.
- **Every timestamp renders through one `Asia/Phnom_Penh` formatter.** `toLocaleString()`
  elsewhere silently uses the *browser's* zone, and the bug is invisible when reviewed from
  Phnom Penh — where the two agree.
- **`errorCode` maps to messages.** Never parse `message`; it is not a contract.
- **Permission checks in the UI are UX, never security.** The server enforces; the client only
  avoids rendering buttons that would 403.

## Notes on tooling

- **Use `npx` for the shadcn CLI, not `pnpm dlx`.** The CLI has a missing `fs-extra`
  dependency that pnpm's strict `node_modules` layout exposes and npm's hoisting hides.
- **Next 16 ships its own docs** at `node_modules/next/dist/docs/`. They are authoritative over
  anything you or an assistant remembers about Next.js — 16 renamed `middleware` to `proxy`,
  among other changes.

## Repository status

Scaffolded during ADM-011. Not yet pushed to a remote; when it is, `main` should be protected
and require the CI checks from ADM-019 to pass.
