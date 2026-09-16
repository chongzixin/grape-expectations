# Phase 1 Data Model: Editable Vintage Year Stat Cards

## Entity: Tracked Vintage Year (extension of the existing `Profile` entity)

Not a new table — three new nullable columns on the existing `profiles` table (see `specs/001-authentication/spec.md` for the base `Profile` entity).

| Column | Type | Nullable | Default | Meaning |
|---|---|---|---|---|
| `tracked_vintage_year_1` | `INTEGER` | yes | `NULL` | Year shown by stat-card slot 1. `NULL` → display falls back to the app default (2016). |
| `tracked_vintage_year_2` | `INTEGER` | yes | `NULL` | Year shown by stat-card slot 2. `NULL` → fallback default (2018). |
| `tracked_vintage_year_3` | `INTEGER` | yes | `NULL` | Year shown by stat-card slot 3. `NULL` → fallback default (2023). |

**Validation rules** (enforced client-side before any write is attempted; not enforced by a DB constraint, consistent with how `wines.drink_from`/`drink_by` are validated client-side only):
- Must be a 4-digit integer.
- Must be within `1900`–`2100` inclusive (spec FR-005, reusing the existing Drink From/To bound).
- No uniqueness constraint across the three columns (spec FR-008) — any two or all three may hold the same value.

**Lifecycle**: Created implicitly as `NULL` for every user via the existing `handle_new_user()` trigger (no trigger change needed — new columns simply default to `NULL` for new and existing rows alike). Deleted via the existing `profiles` `ON DELETE CASCADE` from `auth.users` — no new cleanup logic needed.

**Relationship to `Wine`**: Read-only, indirect. A tracked year is never a foreign key into `wines`; it's compared against `wines.vintage` (exact string/int match, per spec FR-003 and Assumptions) purely at render time to compute a count. Deleting or changing wines never modifies a tracked year, and changing a tracked year never modifies any wine row.

## Derived (not persisted): `TrackedYearCounts`

Computed client-side per render from `(activeWines, trackedYears)`; not stored anywhere.

```
type TrackedYearCount = { year: number; count: number }
// trackedYearCounts: TrackedYearCount[]  — always exactly 3 entries, one per slot, in slot order
```

Replaces the previously hardcoded `Stats.count2016` / `Stats.count2018` / `Stats.count2023` fields (see `specs/008-cellar-analytics/spec.md` for the pre-existing `Stats` shape this supersedes for these three fields only — all other `Stats` fields are unchanged).

**Computation rule** (unchanged from the existing fixed-year counts, just parameterized): for each tracked year, count active bottles (`inventory > 0`) whose `vintage` exactly equals that year as a string; a wine with `vintage` of `"NV"` or blank never contributes to any tracked-year count.

## Client-side state shape (`App.tsx`)

```
trackedYears: [number, number, number]
// Derived each render from profile, with per-slot fallback:
//   profile?.tracked_vintage_year_1 ?? 2016
//   profile?.tracked_vintage_year_2 ?? 2018
//   profile?.tracked_vintage_year_3 ?? 2023
```

No new top-level `useState` is needed for the persisted value itself — it derives from the existing `profile` state (already fetched on session load, per `specs/001-authentication/plan.md`). A local `useState` inside `StatsBar.tsx` tracks only the transient in-progress edit (which slot, if any, is currently in edit mode, and its draft input value) — this is UI state, never persisted, and is discarded on cancel or after a successful/failed confirm.
