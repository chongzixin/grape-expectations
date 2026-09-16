---

description: "Backfilled task record for the Drinking Window Tracking feature — documents work already completed, not a forward plan"
---

# Tasks: Drinking Window Tracking

**Input**: Design documents from `specs/005-drinking-window-tracking/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — verification was manual against known year-boundary examples.

## Phase 1: Foundational

- [X] T001 Add `drink_from`/`drink_by` nullable integer columns to `wines` table in `supabase/schema.sql`
- [X] T002 Define `DrinkingStatus` type + `DRINKING_STATUS_PRIORITY`/`DRINKING_STATUS_DESCRIPTIONS`/`BADGE_STYLES` in `js/types.ts` / `js/constants.ts`
- [X] T003 Implement pure `getDrinkingStatus()` in `js/utils.ts`

**Checkpoint**: Status derivation available for use everywhere.

---

## Phase 2: User Story 1 — See status at a glance (P1)

- [X] T004 [US1] Build `DrinkingWindowBadge.tsx` (label + color + year-range tooltip)
- [X] T005 [US1] Render badge in `CellarView.tsx` desktop column and mobile inline row
- [X] T006 [US1] Render window breakdown donut in `AnalyticsView.tsx` (see spec 008)

**Checkpoint**: Every wine shows a correctly-derived badge everywhere it's listed.

---

## Phase 3: User Story 2 — Prioritize by urgency (P2)

- [X] T007 [US2] Add "Drinking Window" sort option + column-header sort to `CellarView.tsx`
- [X] T008 [US2] Use `DRINKING_STATUS_PRIORITY` + `drinkBy` tiebreak in the sort comparator
- [X] T009 [US2] Use the same priority ordering inside `formatCellarText()`'s per-type grouping
- [X] T010 [US2] Wire Drink Soon / Past Peak stat-card clicks to switch tab + set sort to "window"

**Checkpoint**: Sorting and sharing both surface urgent bottles first.

---

## Phase 4: User Story 3 — Auto-estimate on entry (P1)

- [X] T011 [US3] Implement `App.estimateDrinkingWindow()` single-wine tiny-JSON prompt call
- [X] T012 [US3] Implement `handleVintageChange()` with 700ms debounce, field-clear-on-change, and `windowReqRef` race guard
- [X] T013 [US3] Wire vintage input `onChange` in `AddWineModal.tsx` (both Manual Entry and Scan Photo review) to `handleVintageChange`

**Checkpoint**: Typing a vintage auto-fills the window without an explicit action.

---

## Phase 5: User Story 4 — Batch backfill for existing cellar (P2)

- [X] T014 [US4] Implement `App.estimateDrinkingWindows()` sequential batch loop with per-wine progress state and per-iteration error tolerance
- [X] T015 [US4] Add "Estimate Windows" button to `Header.tsx`, visible only when ≥1 wine lacks a window
- [X] T016 [US4] Render "Estimating… X/N" progress label and disable the button during the run

**Checkpoint**: A full cellar can be backfilled in one click with visible progress.

---

## Dependencies & Execution Order

- Phase 1 blocks all user stories.
- US1 (display) has no dependency on US3/US4 (estimation) — a wine can show "Unknown" correctly with zero estimation code present; they were nonetheless built together since estimation is what makes the badges useful in practice.
- US3 and US4 both call the same underlying single-wine estimate logic but are independent trigger points; neither depends on the other.

## Notes

- No task exists for user-facing "correct this estimate" UI beyond direct field editing — see spec.md Assumptions.
