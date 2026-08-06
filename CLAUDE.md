@AGENTS.md

# GenLink KH — Admin Portal

Staff-facing admin dashboard. Next.js 16 (App Router), TypeScript strict, Tailwind v4,
shadcn/ui, pnpm. Separate application from the Flutter mobile app; talks to the Spring Boot
backend at `/api/v1/admin/**`.

## Read before writing code

This repository does not define its own architecture. The approved design and the task
breakdown live in the sibling `genlink_kh_fullstack` workspace:

| Document | What it is |
|---|---|
| `docs/admin-dashboard.md` | **The SSOT.** Approved, dated, governs this repo |
| `docs/admin-dashboard/implementation-order.md` | What to work on next, in dependency order |
| `docs/admin-dashboard/frontend-tasks.md` | This repo's queue and working agreements |
| `docs/admin-dashboard/phase-0.md` … `phase-6.md` | The ADM task definitions (ID, DoD, acceptance criteria) |
| `docs/admin-dashboard/testing-plan.md` | Test strategy |

**If the SSOT looks wrong, stop and say so.** It is amended additively and dated, never
silently — and never as a side effect of implementation.

## Rules

- Work one ADM task at a time, in dependency order. Each has explicit acceptance criteria.
- **A feature never imports another feature.** Shared code moves to `components/` or `lib/`.
- `'use client'` on the leaf, not the page.
- `lib/config/env.ts` is the only file that reads `process.env`. No hostname, IP, port or
  scheme anywhere in code.
- All timestamps through the single `Asia/Phnom_Penh` formatter — `toLocaleString()` elsewhere
  renders in the browser's zone and the bug is invisible from Phnom Penh.
- Map `errorCode`; never parse `message`.
- Client-side permission checks are UX only. The server enforces.
- Every list needs loading, empty **and** error states.

## Verification

Nothing is done until these pass:

```bash
pnpm lint && pnpm typecheck && pnpm build
```

## Tooling gotchas

- **shadcn CLI: use `npx`, not `pnpm dlx`** — the CLI has a missing `fs-extra` dependency that
  pnpm's strict layout exposes.
- **Next 16's own docs are in `node_modules/next/dist/docs/`** and are authoritative over
  memory. Notably `middleware` is now `proxy`.
