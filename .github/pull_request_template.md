<!--
Title format: [ADM-042] App shell and permission-filtered sidebar
-->

## Task

**ADM-___** — <!-- title -->

Definition of Done and acceptance criteria: `docs/admin-dashboard/phase-N.md` in the
`genlink_kh_fullstack` workspace.

## What changed

<!-- One paragraph. What a reviewer needs to know that the diff does not tell them. -->

## Acceptance criteria

<!-- Copy the task's numbered criteria and tick each one. Anything unticked needs a reason. -->

- [ ]
- [ ]

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Tests pass (if the task added any)

## Checklist

- [ ] No feature imports another feature
- [ ] `'use client'` on leaves, not pages
- [ ] Loading, empty **and** error states for any new list
- [ ] Timestamps go through the `Asia/Phnom_Penh` formatter
- [ ] Errors mapped from `errorCode`, not parsed from `message`
- [ ] No hostname, IP, port or scheme outside `lib/config/env.ts`
- [ ] Keyboard navigable; both light and dark themes checked
- [ ] No secret, token or `.env` file added

## Design deviations

<!--
Anything that departs from the SSOT. If there is none, write "none".
A deviation is not automatically wrong, but it must be visible and agreed — never silent.
-->

none
