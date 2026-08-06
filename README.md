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

Then the checks CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm build
```

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
  `process.env`. A search for the droplet's IP must return nothing.
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
