---

description: "Backfilled task record for the Cellar Inventory Management feature — documents work already completed, not a forward plan"
---

# Tasks: Cellar Inventory Management

**Input**: Design documents from `specs/003-cellar-inventory-management/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — verification was manual.

## Phase 1: Foundational

- [X] T001 Add `wines` table with RLS policies in `supabase/schema.sql`
- [X] T002 Add `Wine`/`NewWineForm` types in `js/types.ts`
- [X] T003 Add `mapDbWine()` snake_case→camelCase mapper in `js/utils.ts`
- [X] T004 Add `wines` state + `activeWines` derived memo in `App.tsx`

**Checkpoint**: Data layer + base state ready.

---

## Phase 2: User Story 1 — Add a wine manually (P1)

- [X] T005 [US1] Build Manual Entry tab form fields in `AddWineModal.tsx`
- [X] T006 [US1] Implement `App.addWineToDb()` insert with `source: 'manual'`
- [X] T007 [US1] Implement `App.addWine()` handler with empty-name guard
- [X] T008 [US1] Wire vintage field to `handleVintageChange` for auto drinking-window estimation

**Checkpoint**: Manual add works end-to-end.

---

## Phase 3: User Story 2 — Adjust bottle count (P1)

- [X] T009 [US2] Add +/− stepper UI to `CellarView.tsx` table rows
- [X] T010 [US2] Implement `App.updateInventory()` with optimistic update + floor of 0
- [X] T011 [US2] Filter to `inventory > 0` everywhere active wines are used (table, stats, analytics, chat context)

**Checkpoint**: Inventory adjustments persist and zero-inventory wines drop out of active views.

---

## Phase 4: User Story 3 — Avoid accidental duplicates (P2)

- [X] T012 [US3] Implement `normalizeWineName()` + `levenshteinDistance()` in `js/utils.ts`
- [X] T013 [US3] Implement `winesAreDuplicates()` matching rule (exact vintage + fuzzy name/winery)
- [X] T014 [US3] Build `DuplicateWineModal.tsx` with merge/add-as-new/cancel actions and merge preview
- [X] T015 [US3] Implement `App.mergeWithExisting()` (weighted-average price, summed inventory)
- [X] T016 [US3] Wire duplicate check into both `addWine()` and `confirmCurrentWine()` (photo-scan path) via `duplicatePending` state

**Checkpoint**: Both manual and photo-scan add paths route through duplicate detection.

---

## Phase 5: User Story 4 — Find a specific wine quickly (P2)

- [X] T017 [US4] Add type filter chips to `CellarView.tsx`
- [X] T018 [US4] Add free-text search across name/winery/region/country/style/sub-region
- [X] T019 [US4] Add sort dropdown + sortable column headers (name/vintage/price/type/window)
- [X] T020 [US4] Add empty-state message when filters yield no results
- [X] T021 [US4] Wire stat-card clicks (Drink Soon / Past Peak) to switch tab + set sort to "window"

**Checkpoint**: Filter/search/sort fully functional over the active wine list.

---

## Phase 6: User Story 5 — Share the cellar (P3)

- [X] T022 [US5] Implement `formatCellarText()` grouped-by-type, sorted-by-window text formatter
- [X] T023 [US5] Add native `navigator.share` path with feature detection
- [X] T024 [US5] Add fallback share modal with copy-to-clipboard and WhatsApp link
- [X] T025 [US5] Disable Share button when the filtered list is empty

**Checkpoint**: Cellar list can be shared via all three channels.

---

## Dependencies & Execution Order

- Phase 1 blocks all user stories.
- US3 (duplicate detection) depends on US1's add-wine path existing, and is also consumed by the photo-scan feature (spec 004) — implemented once, shared by both entry points.
- US2, US4, US5 have no dependency on each other beyond the Foundational phase.

## Notes

- No delete-wine task exists by design (see spec.md Assumptions) — there is no task for it because no such feature was built.
