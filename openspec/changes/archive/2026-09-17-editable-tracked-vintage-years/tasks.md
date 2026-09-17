## 1. Database

- [x] 1.1 Add `supabase/migrations/add_tracked_vintage_years.sql`: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tracked_vintage_years INTEGER[] NOT NULL DEFAULT '{2016,2018,2023}'`, plus an explicit `UPDATE profiles SET tracked_vintage_years = '{2016,2018,2023}' WHERE tracked_vintage_years IS NULL` to backfill any pre-existing rows — verify: migration runs cleanly against the current schema and existing profile rows end up with the default array.

## 2. Types and stats computation

- [x] 2.1 Update `UserProfile` in `js/types.ts` to include `tracked_vintage_years: number[]`.
- [x] 2.2 Replace `count2016`/`count2018`/`count2023` in the `Stats` interface (`js/types.ts`) with `trackedYearCounts: number[]`.
- [x] 2.3 Update `computeStats()` in `js/utils.ts` to accept `trackedYears: number[]` and return `trackedYearCounts` computed over that input in the same order, instead of the three hardcoded vintage filters — verify: existing behavior for 2016/2018/2023 is unchanged when those are the input years.

## 3. UI: editable stat cards

- [x] 3.1 Update `js/App.tsx`'s `computeStats` call site to pass the user's `tracked_vintage_years` (falling back to `[2016, 2018, 2023]` if the profile value is missing).
- [x] 3.2 Update `js/components/StatsBar.tsx` so the three vintage cards render from `trackedYears`/`trackedYearCounts` (zipped by index) instead of the three hardcoded `StatCard` calls.
- [x] 3.3 Add an edit affordance to each of the three vintage cards; clicking it swaps the label for a numeric year input.
- [x] 3.4 On confirming an edit (blur or Enter): validate the value is a plausible 4-digit year and does not match either of the other two cards' current years — if either check fails, show a visible inline error state (e.g. red border plus a brief message) and keep the previous year, clearing the error on the next edit; otherwise update local state immediately so the card's label and count reflect the new year right away — verify: entering a non-numeric/non-4-digit value, or a year already used by another card, leaves the card unchanged and shows the error state.
- [x] 3.5 Persist the full updated 3-year array to `profiles.tracked_vintage_years` via Supabase after a valid edit, following the existing optimistic-update-then-persist pattern — verify: reloading the app (or signing in on another session) shows the previously edited years, not the defaults.

## 4. Integration verification

- [x] 4.1 Verify end-to-end with `npm start`: sign in, edit one of the three vintage cards to a year present in the cellar, confirm the count updates immediately and matches the actual bottle count for that vintage; reload the page and confirm the edited year and count persist.
