## Context

The stats header (`js/components/StatsBar.tsx`) renders three vintage-count cards driven by `Stats.count2016`/`count2018`/`count2023`, computed in `computeStats()` (`js/utils.ts`) by filtering `wines` on hardcoded vintage strings. There is no per-user preference storage for this today — `profiles` only holds `display_name` and `avatar_url` (see `openspec/specs/auth/spec.md`). See proposal.md for why this needs to change.

## Goals / Non-Goals

**Goals:**
- Let a signed-in user set which 3 years the header tracks, edited inline on each card.
- Persist the choice per user, synced via Supabase (per the clarifying decision in proposal.md).
- Keep exactly 3 cards/years — this is a re-skin of an existing fixed-3-card layout, not a variable-length list.

**Non-Goals:**
- Adding/removing the number of tracked-year cards (still exactly 3).
- Any guest-mode version of this feature (guest mode has no stats header at all).
- Migrating existing `drink_from`/`drink_by` per-wine drinking-window logic — unrelated and untouched.

## Decisions

### Decision 1: Store the three years as a single array column on `profiles`
Add `tracked_vintage_years INTEGER[]` to `profiles`, defaulting to `'{2016,2018,2023}'`, rather than three separate integer columns (`tracked_year_1/2/3`).

Rationale: the three years are inherently an ordered triple with no independent identity — a single array column avoids three near-duplicate columns and three near-duplicate update statements, and keeps the migration to one line. Order in the array maps directly to card position (index 0 → first card, etc.).

Alternative considered: three scalar columns, matching the more common convention elsewhere in the schema (e.g. `drink_from`/`drink_by`). Rejected because those two columns represent two *distinct* concepts (start/end of a range), whereas these three are interchangeable slots of the same kind — an array is the more natural fit and simpler to extend later if the card count ever changes.

### Decision 2: Generalize `Stats` from three named fields to one ordered array
Replace `count2016: number; count2018: number; count2023: number;` in `Stats` (`js/types.ts`) with `trackedYearCounts: number[]`, and change `computeStats()` to accept the tracked years as a parameter: `computeStats(wines: Wine[], trackedYears: number[])`, returning counts in the same order as the input years.

Rationale: keeps `computeStats` a pure function of its inputs (wines + years) rather than reading a global default; `StatsBar` zips `trackedYears` (from the profile) with `trackedYearCounts` (from `Stats`) by index to render each card's label and count.

### Decision 3: Client-side fallback default
If `profile.tracked_vintage_years` is null (e.g. a profile row created before this migration ran, before the DB default backfills it), the client falls back to `[2016, 2018, 2023]` in memory. This avoids a hard dependency on migration timing and matches the "Default years" scenario in the spec.

### Decision 4: Edit interaction and persistence
Each card gets a small edit affordance. Clicking it swaps the label for a bounded numeric input (4-digit year). On confirm (blur or Enter):
1. Validate the value is a plausible 4-digit year; if not, discard the edit and keep the previous year (no error dialog — silently revert, consistent with how `estimateDrinkingWindow` in the app already just ignores implausible year input in the add-wine flow).
2. Update local state optimistically (card re-renders with the new year and recomputed count immediately, since `computeStats` re-runs from already-loaded wines).
3. Persist the full 3-year array to `profiles.tracked_vintage_years` via a single Supabase `update`, following the existing optimistic-update-then-persist pattern used for wine inventory changes.

## Risks / Trade-offs

- **[Risk]** A user could set all three cards to the same year, making two cards redundant. → **Mitigation**: none enforced; this is a low-stakes personal display preference, not worth the added validation complexity for a first version.
- **[Risk]** Existing profile rows won't have `tracked_vintage_years` populated until the migration's `DEFAULT` applies (new rows only, not retroactively, unless the migration backfills existing rows). → **Mitigation**: migration explicitly backfills existing NULL rows to `{2016,2018,2023}` in addition to setting the column default, so behavior is identical to today until a user actively changes it.

## Migration Plan
1. Add `supabase/migrations/add_tracked_vintage_years.sql`: adds the column with a default, and backfills existing rows.
2. Ship the client changes in the same change (no phased rollout needed — old and new client code can't run simultaneously against this schema in a way that matters for a single-maintainer app with no versioned API).
3. No rollback concerns beyond dropping the column if needed; no destructive change to existing data.
