# Phase 0 Research: Editable Vintage Year Stat Cards

No `NEEDS CLARIFICATION` markers remain in the Technical Context — the stack, storage, and conventions are all fixed by this existing repo (single Vite + Netlify Functions + Supabase app), and the two real behavioral ambiguities were already resolved in `/speckit-clarify` (see spec.md's Clarifications section). This document instead records the concrete design decisions made while translating the spec into a plan, and the alternatives rejected for each, so they don't need to be re-litigated during `/speckit-tasks` or `/speckit-implement`.

## Decision 1: Storage shape for the three tracked years

**Decision**: Three separate nullable `INTEGER` columns on the existing `profiles` table: `tracked_vintage_year_1`, `tracked_vintage_year_2`, `tracked_vintage_year_3` (slot order = card display order).

**Rationale**: Matches the schema's existing convention of explicit, individually-typed columns (e.g. `wines.drink_from` / `wines.drink_by`) rather than introducing a new pattern. `profiles` is already the natural home for per-user preferences (it exists for exactly this purpose today: `display_name`, `avatar_url`). Three fixed slots need no relational structure.

**Alternatives considered**:
- A Postgres array column (`tracked_vintage_years INTEGER[]`): rejected — no array-typed column exists anywhere else in `schema.sql`; would require new client-side parsing logic for a fixed-size-3 list that doesn't benefit from being an array.
- A separate `tracked_vintage_years` table (one row per user, or one row per user+slot): rejected — over-engineered for three scalar values that belong naturally on the user's own profile row; would need its own RLS policies duplicating what `profiles` already has.

## Decision 2: Optimistic update mechanics

**Decision**: Reuse the exact optimistic pattern already implemented by `App.updateInventory()`: update local state immediately, fire an async Supabase `update`, and on failure revert the local state and show a `sonner` error toast.

**Rationale**: Resolved by `/speckit-clarify` Q1 (spec.md FR-003/FR-007). Constitution Principle IV requires following existing conventions rather than introducing a second update pattern; `updateInventory()` is the closest existing precedent for "small per-row edit, optimistic, revert on failure."

**Alternatives considered**: Confirm-first (loading state, only show the new value once saved) — this was Option B in the clarify question and was explicitly not chosen.

## Decision 3: Year validation bound

**Decision**: Reuse the 1900–2100 bound already applied to the Drink From / Drink To fields in `AddWineModal.tsx`, applied identically here (reject non-numeric or out-of-range input, leave the card's previous value in place, show an inline message).

**Rationale**: Spec Assumptions explicitly call for reusing this bound rather than inventing a new one; keeps validation behavior consistent across every year-shaped input field in the app.

**Alternatives considered**: A narrower, "plausible collecting range" bound (e.g. 1950–current year) — rejected as an unnecessary second validation rule for what's still just an integer year field; the existing bound is already generous enough to not need product judgment calls about what counts as a "real" vintage.

## Decision 4: UI placement

**Decision**: Add the edit affordance as a small inline helper component inside `StatsBar.tsx` (e.g. `YearStatCard`), rendered for each of the three tracked-year slots, rather than a new file under `js/components/`.

**Rationale**: Constitution Principle V — don't split `App.tsx`/existing components prematurely. `StatsBar.tsx` already owns this exact part of the screen and already has a `StatCard` inline helper; a sibling `YearStatCard` helper for the editable variant follows the same established pattern (compare `Badge` as an inline helper inside `CellarView.tsx`).

**Alternatives considered**: A standalone `EditableYearCard.tsx` component — rejected as an unnecessary extra file for ~30–40 lines of UI that is tightly coupled to `StatsBar.tsx`'s existing rendering and has no reuse case elsewhere.

## Decision 5: No new Netlify function

**Decision**: Write the year change directly via `supabase.from('profiles').update({ [column]: newYear }).eq('id', userId)` from the client, same as every other non-AI mutation in the app (`wines`, `recommendation_feedback`, etc.).

**Rationale**: Constitution Principle III's serverless-proxy requirement applies specifically to Claude/Anthropic calls (to keep the API key server-side); it does not apply to ordinary Supabase CRUD, which is already authorized end-to-end by RLS. Routing a plain column update through a Netlify function would add indirection with no security or architectural benefit.

**Alternatives considered**: A dedicated `/.netlify/functions/update-tracked-years` endpoint — rejected as inconsistent with how every other piece of user data in this app is written (direct client → Supabase, RLS-authorized).
