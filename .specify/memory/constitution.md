<!--
Sync Impact Report
- Version change: (none) → 1.0.0 (initial ratification)
- Modified principles: n/a (new document)
- Added sections: Core Principles (I-V), Technology & Architecture Constraints,
  Development Workflow, Governance
- Removed sections: none
- Templates requiring updates: .specify/templates/plan-template.md (✅ no changes
  needed — Constitution Check gate reads this file at runtime), spec-template.md
  (✅ compatible), tasks-template.md (✅ compatible)
- Follow-up TODOs: none — all placeholders resolved from CLAUDE.md
-->

# Grape Expectations Constitution

## Core Principles

### I. Manual Verification, No Test Suite
There is no automated test suite and no linting tooling (ESLint, Prettier)
configured; TypeScript strict mode is the only automated safety net. Every
change MUST be validated manually, and PRs MUST be smoke-tested on their
Netlify branch-deploy preview before merging. Plans and tasks MUST include
explicit manual verification steps instead of assuming a CI test gate exists.

Rationale: this is a deliberate, current constraint of the project, not an
oversight. Pretending otherwise produces plans with untestable "write tests"
tasks that never get executed.

### II. RLS Is the Authorization Boundary
All Supabase tables have Row Level Security enabled and enforce per-user
access at the database level. Application code MUST NOT duplicate, bypass,
or work around RLS with manual user-id filtering hacks client-side.

Rationale: RLS is already the source of truth for authorization; re-deriving
it in application code is redundant and can silently diverge from the DB
policy.

### III. AI Calls Go Through the Serverless Proxy Only
The frontend MUST NOT call the Anthropic API directly; all Claude calls go
through the `/.netlify/functions/claude` proxy (`netlify/functions/claude.js`).
The sommelier chat's hidden `WINES_JSON` comment block MUST NOT be removed or
reformatted, since `parseRecommendedWines()` / `stripWinesJson()` in
`App.tsx` depend on its exact shape.

Rationale: keeps the Anthropic API key server-side only, and preserves a
documented, working contract other code depends on.

### IV. Follow Existing Conventions Over Introducing New Patterns
State management MUST stay plain React hooks (`useState`, `useMemo`,
`useCallback`, `useRef`) — no new state libraries (Redux, Context API,
Zustand). CSS MUST use the `ge-` class prefix and the existing CSS-variable
theming (no Tailwind, no CSS-in-JS). DB columns are `snake_case`; TypeScript
fields are `camelCase`, converted via `mapDbWine()`.

Rationale: this is a small app with one dominant pattern per concern; a
second competing pattern raises cognitive load for no benefit.

### V. Don't Split App.tsx Prematurely
`App.tsx` is intentionally monolithic today. New UI/logic MUST follow
existing patterns within it unless a feature's spec/plan explicitly scopes a
component extraction (e.g. `CellarView`, `AnalyticsView`, `SommelierChat`,
`WineCard`, `AddWineModal`).

Rationale: the refactor is a known, tracked priority (see CLAUDE.md Current
Priorities), but ad hoc partial splits during unrelated feature work create
inconsistent structure.

## Technology & Architecture Constraints

React 18.3.1 + TypeScript (Vite 5.4.2) frontend, Netlify Functions backend,
Supabase (Postgres + Auth) as the only datastore, Claude Sonnet (currently
`claude-sonnet-4-6`) as the only AI model integration, Sonner for
notifications, react-markdown + remark-gfm for markdown rendering. `npm
start` (`netlify dev`) MUST be used for any work touching AI or serverless
functions; `npm run dev` alone does not serve functions and AI features will
appear broken under it.

## Development Workflow

No CI test gate exists. PRs get automatic Netlify branch-deploy previews and
MUST be smoke-tested there before merging. DB schema changes go through
`supabase/migrations/`, auto-applied to production on push to `main` via
`.github/workflows/migrate.yml` — migrations MUST be additive / backward
compatible at merge time, since there is no automated rollback gate.

## Governance

This constitution supersedes ad hoc practice. Amendments go through
`/speckit-constitution`, MUST update the version per semantic versioning
(MAJOR: incompatible principle removal/redefinition; MINOR: new
principle/section or materially expanded guidance; PATCH: clarifications and
wording), and MUST record a Sync Impact Report. Specs and plans should note
any deliberate deviation from a principle and its justification; complexity
that conflicts with a principle must be justified in the plan's Complexity
Tracking section rather than silently introduced.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
