# features/

One directory per product area — `users/`, `roles/`, `analytics/`, and so on. This is where
the work happens; `app/` holds only routing and layouts.

A feature owns its own `components/`, `dialogs/`, `hooks/`, `services/`, `schemas/` and
`types/`. See SSOT §12 for the full shape.

## The one rule

**A feature must never import from another feature.**

If two features need the same thing, it moves to `components/`, `lib/`, `hooks/`, `services/`,
`types/` or `schemas/`. There is no exception; "just this once" is how a feature-based
structure decays into a dependency ball, and it decays quietly.

This is the frontend counterpart of the backend's module boundary (SSOT §1.6 R2), and like
that one it is enforced mechanically rather than by good intentions — see the
`no-restricted-imports` block in `eslint.config.mjs`.

## Import conventions

- **Within your feature** — relative: `./user-table`, `../hooks/use-users`.
- **Anything shared** — the alias: `@/components/ui/button`, `@/lib/api/client`.
- **Another feature** — not allowed. Lift the shared part out instead.
