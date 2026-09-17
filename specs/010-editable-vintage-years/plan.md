# Implementation Plan: Editable Vintage Year Stat Cards

**Branch**: `010-editable-vintage-years` (spec directory name; no separate git branch — this session commits directly to `claude/speckit-integration-mdw108` per its branch policy) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-editable-vintage-years/spec.md`

## Summary

Let a signed-in user edit which year each of the three vintage-count stat cards tracks (default 2016/2018/2023), inline on the card itself, with the choice persisted per-user in Supabase and the displayed count updating optimistically. This is implemented by adding three nullable integer columns to the existing `profiles` table, extending `computeStats()` to accept the user's chosen years instead of hardcoding them, and adding inline edit UI to the existing `StatsBar.tsx` component — no new Netlify function, no new top-level component, no new state-management pattern.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `@supabase/supabase-js` (existing), `sonner` (existing, for the failed-save toast) — no new dependencies

**Storage**: Supabase Postgres — three new nullable `INTEGER` columns on the existing `profiles` table (RLS already scoped to `auth.uid() = id`)

**Testing**: None — no automated test suite exists (Constitution Principle I). Verified manually per `quickstart.md`, via Netlify PR branch-deploy preview.

**Target Platform**: Web (desktop + mobile), matching the rest of the stats bar / cellar UI

**Project Type**: Single Vite + Netlify Functions web app (no separate frontend/backend repos) — this feature adds no new Netlify function

**Performance Goals**: Perceived-instant update on confirm (optimistic), per spec SC-001 — no network round-trip in the critical UI path

**Constraints**: Must reuse the app's existing optimistic-update pattern, existing 1900–2100 year-validation bound, existing toast-based failure notification, and existing RLS-only authorization — no new pattern introduced (Constitution Principle IV)

**Scale/Scope**: Three additional scalar fields on one existing per-user row; no measurable scale impact

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Manual Verification, No Test Suite)**: PASS — no test tasks are planned; `quickstart.md` (Phase 1) is the manual verification script, and tasks.md (next command) will include explicit manual-check steps instead of test-writing steps.
- **Principle II (RLS Is the Authorization Boundary)**: PASS — the three new columns live on `profiles`, which already has `SELECT`/`UPDATE` RLS policies scoped to `auth.uid() = id`. No new policy is needed and no client-side user-id filtering is introduced; the update call passes `.eq('id', session.user.id)` only to target the row, not to enforce authorization.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: N/A — this feature makes no Claude/Anthropic calls.
- **Principle IV (Follow Existing Conventions)**: PASS — plain `useState` for the in-progress edit's local UI state (which card is open, draft value); reuses the optimistic-update pattern already used by `updateInventory()`; reuses the 1900–2100 bound already used by Drink From/To; reuses the existing `sonner` toast pattern for the failed-save case; `ge-*` CSS classes for the new edit UI; no new state library, no new validation library.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — the new persistence handler (`updateTrackedYear`) is added to `App.tsx` alongside the existing `updateInventory`/`addWineToDb` handlers; the edit UI is added inside the already-extracted `StatsBar.tsx`, as a small inline helper component (matching the existing `Badge`-inside-`CellarView.tsx` pattern) rather than a new file under `js/components/`.

No violations — Complexity Tracking is intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/010-editable-vintage-years/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md          # Phase 1 output
├── contracts/               # Phase 1 output
│   └── profile-tracked-years.md
└── tasks.md                  # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
supabase/
├── schema.sql                          # Updated: document the 3 new profiles columns
└── migrations/
    └── add_tracked_vintage_years.sql     # New: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS (x3)

js/
├── types.ts                              # Updated: UserProfile gains 3 nullable year fields;
│                                          #   Stats.count2016/2018/2023 replaced by
│                                          #   Stats.trackedYearCounts: { year: number; count: number }[]
├── utils.ts                               # Updated: computeStats(wines, trackedYears) — years now
│                                          #   a parameter instead of hardcoded literals
├── App.tsx                                 # Updated: derive trackedYears from profile (fallback
│                                          #   [2016,2018,2023] when unset); new updateTrackedYear()
│                                          #   handler (optimistic write + revert-on-failure)
└── components/
    └── StatsBar.tsx                         # Updated: render trackedYearCounts instead of 3 fixed
                                             #   StatCards; new inline YearStatCard helper component
                                             #   (edit icon → inline input → confirm/cancel)
```

**Structure Decision**: No new files under `js/components/` and no new Netlify function. This is a small, self-contained extension of the existing stats/profile machinery — three new DB columns, one widened pure function signature, one new handler in `App.tsx`, and inline UI in the one component that already owns this part of the screen.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
