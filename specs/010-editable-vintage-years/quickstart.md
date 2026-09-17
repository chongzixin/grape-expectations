# Quickstart: Validating Editable Vintage Year Stat Cards

Manual validation script (Constitution Principle I — no automated test suite; this is the verification record for this feature, run against the Netlify PR branch-deploy preview before merging).

## Prerequisites

1. Apply the migration: run `supabase/migrations/add_tracked_vintage_years.sql` against your Supabase project (or let it auto-apply on push to `main` via `.github/workflows/migrate.yml` — but validate locally/on the PR preview first).
2. `npm start` (not `npm run dev` — this feature's writes go through Supabase directly, but sign-in/session and the rest of the app still need the full `netlify dev` stack per CLAUDE.md).
3. A signed-in test account with at least: one active wine vintage `2016`, one vintage `2018`, zero wines vintage `2023` (to exercise both the "has bottles" and "zero bottles" paths), and one wine with vintage `NV`.

## Scenario 1 — Edit a card (US1)

1. Load the cellar view; confirm the stats bar shows "2016 Bottles", "2018 Bottles", "2023 Bottles" with correct counts (baseline, matches today's behavior).
2. Click the edit affordance on the "2023" card.
3. Enter `2016` and confirm.
4. **Expect**: the card now reads "2016 Bottles" with the same count as the existing 2016 card (duplicate years allowed, spec FR-008) — updates appear immediately (no visible network wait).
5. Edit the same card again to `2019` (a year with zero matching bottles).
6. **Expect**: card shows "2019 Bottles" — `0`, not an error, not hidden.

## Scenario 2 — Persistence (US2)

1. After Scenario 1, reload the page.
2. **Expect**: the card still shows `2019` (not reset to `2023`).
3. Sign out, sign back in (simulates a different device/session).
4. **Expect**: same result — `2019` persists.
5. Sign in as a brand-new test account that has never touched this feature.
6. **Expect**: sees the unmodified defaults, `2016`/`2018`/`2023`.

## Scenario 3 — Cancel (US3)

1. Click edit on any card, type a different year, then press Escape.
2. **Expect**: card reverts to its prior year/count; reload the page and confirm nothing was persisted.
3. Repeat, but click elsewhere on the page instead of pressing Escape.
4. **Expect**: same revert-without-save behavior.

## Scenario 4 — Invalid input

1. Click edit on a card, type `abc`, attempt to confirm.
2. **Expect**: rejected, inline message shown, previous year/count still displayed.
3. Repeat with `1500` and with `3000` (out of the 1900–2100 bound).
4. **Expect**: both rejected the same way.

## Scenario 5 — Failed save

1. Click edit on a card, enter a valid year, and — before confirming — use browser devtools to go offline (or block the Supabase request).
2. Confirm the edit.
3. **Expect**: the card briefly shows the new year/count (optimistic), then reverts to the last saved value once the write fails, with an error toast shown (spec FR-007 / SC-004).
4. Go back online and repeat the edit normally to confirm it now succeeds and persists.

## Done when

- All five scenarios behave as described above on the PR's Netlify branch-deploy preview.
- No console errors during any of the above.
- The existing stats bar fields unaffected by this feature (Total Bottles, Unique Wines, Avg Price, Drink Soon, Past Peak) still show correct values — confirms `computeStats()`'s signature change didn't regress anything else in `Stats`.
