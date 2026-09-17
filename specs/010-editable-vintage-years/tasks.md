---

description: "Task list for the Editable Vintage Year Stat Cards feature"
---

# Tasks: Editable Vintage Year Stat Cards

**Input**: Design documents from `specs/010-editable-vintage-years/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/profile-tracked-years.md, quickstart.md (all present)

**Tests**: Not requested and none exist elsewhere in this project (Constitution Principle I — no automated test suite). Verification tasks below are explicit manual checks against `quickstart.md`, run on the Netlify PR branch-deploy preview, per that principle.

**Organization**: Tasks are grouped by user story (spec.md) so each can be delivered and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on an incomplete task)
- **[Story]**: Maps to spec.md's user stories — US1, US2, US3
- Setup and Foundational tasks carry no story label (they block all stories equally)

## Path Conventions

Single Vite + Netlify Functions project — paths are relative to the repository root (`supabase/`, `js/`, `css/`), matching `plan.md`'s Project Structure.

---

## Phase 1: Setup

**Purpose**: Create the database artifacts this feature needs, before any app code touches them.

- [X] T001 [P] Create `supabase/migrations/add_tracked_vintage_years.sql`: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tracked_vintage_year_1 INTEGER, ADD COLUMN IF NOT EXISTS tracked_vintage_year_2 INTEGER, ADD COLUMN IF NOT EXISTS tracked_vintage_year_3 INTEGER;` plus a `COMMENT ON COLUMN` for each (nullable, no default — `NULL` means "use the app default for this slot"), matching the style of the existing `supabase/migrations/add_drinking_window.sql`
- [X] T002 [P] Update the `profiles` table definition in `supabase/schema.sql` to include the same three nullable `INTEGER` columns (`tracked_vintage_year_1/2/3`), keeping the full-schema reference in sync with T001

**Checkpoint**: Migration ready to apply; schema reference doc matches it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Widen the shared data/type/derivation layer so every user story has something to build on. Ends with the app compiling and the stats bar rendering exactly as it does today (dynamically, via the new path, but still showing 2016/2018/2023 for every existing user via fallback) — no user-visible change yet.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `js/types.ts`, add three fields to `UserProfile`: `tracked_vintage_year_1: number | null`, `tracked_vintage_year_2: number | null`, `tracked_vintage_year_3: number | null` (nullable per data-model.md — `NULL` is the "not customized yet" state, not an error state)
- [X] T004 In `js/types.ts`, remove `Stats.count2016` / `Stats.count2018` / `Stats.count2023` and add `Stats.trackedYearCounts: { year: number; count: number }[]` (always exactly 3 entries, in slot order, per data-model.md)
- [X] T005 In `js/utils.ts`, widen `computeStats` to `computeStats(wines: Wine[], trackedYears: [number, number, number]): Stats`, replacing the three hardcoded `bottles.filter(w => w.vintage === '2016').length`-style lines with a loop over `trackedYears` that applies the same exact-string-match rule per year (a wine with vintage `"NV"` or blank never matches, per data-model.md) and populates `trackedYearCounts`
- [X] T006 In `js/App.tsx`, derive `trackedYears: [number, number, number]` from `profile` with per-slot fallback — `profile?.tracked_vintage_year_1 ?? 2016`, `?? 2018`, `?? 2023` (data-model.md) — and update the existing `stats` `useMemo` call site to pass `trackedYears` as `computeStats`'s second argument (only call site, confirmed in contracts/profile-tracked-years.md)
- [X] T007 In `js/components/StatsBar.tsx`, replace the three hardcoded `<StatCard v={stats.count2016} l="2016 Bottles" />`-style cards with a map over `stats.trackedYearCounts`, rendering each as `` `${year} Bottles` `` with its `count` — read-only at this point, no edit affordance yet

**Checkpoint**: App builds; stats bar is now driven by the dynamic path end-to-end but looks identical to before for every existing user. Ready for user story work.

---

## Phase 3: User Story 1 - Change which vintage a stat card tracks (Priority: P1) 🎯 MVP

**Goal**: A user can click an edit affordance on any tracked-year card, enter a new year, confirm, and see the card update instantly (optimistic), with invalid input rejected and a failed save gracefully reverted.

**Independent Test**: `quickstart.md` Scenario 1 (edit + zero-count case), Scenario 4 (invalid input), Scenario 5 (failed save).

### Implementation for User Story 1

- [X] T008 [US1] In `js/components/StatsBar.tsx`, add a `YearStatCard` helper component (colocated in this file, alongside the existing `StatCard` helper — matches the `Badge`-inside-`CellarView.tsx` pattern) with local `useState` for `editingSlot: 1 | 2 | 3 | null` and `draftValue: string`
- [X] T009 [US1] Add an edit icon to each `YearStatCard`; clicking it sets `editingSlot` to that card's slot and swaps the card's label for an inline `<input type="number">` pre-filled with the card's current year
- [X] T010 [US1] On confirm (Enter key or a confirm control), validate `draftValue`: MUST be a 4-digit integer and MUST be within `1900`–`2100` inclusive (the same bound already used by Drink From/To in `AddWineModal.tsx`, per data-model.md); on failure, show a brief inline message and leave the card's previous value in place — do not call the update handler
- [X] T011 [US1] In `js/App.tsx`, implement `updateTrackedYear(slot: 1 | 2 | 3, newYear: number)`: update local `profile` state for that slot immediately (optimistic, per spec FR-003), matching the pattern already used by `updateInventory()`
- [X] T012 [US1] In `updateTrackedYear`, after the optimistic update, call `supabase.from('profiles').update({ [\`tracked_vintage_year_${slot}\`]: newYear }).eq('id', session.user.id)` exactly as documented in `contracts/profile-tracked-years.md` (single column per call — the other two slots are untouched)
- [X] T013 [US1] On write failure in `updateTrackedYear`, revert the local `profile` state for that slot to its last successfully-saved value and show a `sonner` error toast (FR-007), matching the revert-and-notify shape used elsewhere in the app; on success, do nothing further (the optimistic value is already correct)
- [X] T014 [US1] Wire `YearStatCard`'s confirm control to call `updateTrackedYear(slot, parsedYear)` (after T010's validation passes) and exit edit mode (`editingSlot = null`)

**Checkpoint**: A signed-in user can edit any of the 3 cards end-to-end, with validation and failure-handling both working.

---

## Phase 4: User Story 2 - Chosen years persist across visits (Priority: P1)

**Goal**: Confirm that a customized year survives reloads and different devices/sessions, and that a never-customized user still sees the defaults — both already true as a consequence of Phase 2 (read path with fallback) and Phase 3 (write path), so this phase is verification, not new code.

**Independent Test**: `quickstart.md` Scenario 2.

### Verification for User Story 2

> **Not runnable in this sandbox**: T015/T016/T020 require a live Supabase-backed session (real sign-in, a real profile row) and/or a deployed Netlify PR preview, neither of which exist in this environment (no `.env`, no Supabase project). Left unchecked rather than falsely marked done — run these on the actual PR branch-deploy preview per Constitution Principle I before merging.

- [ ] T015 [P] [US2] Manually verify `quickstart.md` Scenario 2 steps 1–4 (edit a card, reload, confirm it persists; sign out and back in, confirm it still persists) — validates that T006's read/fallback path and T012's write path are correctly wired to the same columns
- [ ] T016 [P] [US2] Manually verify `quickstart.md` Scenario 2 steps 5–6 (a brand-new account, never touched this feature, sees the unmodified defaults 2016/2018/2023) — validates T006's per-slot `?? 2016` / `?? 2018` / `?? 2023` fallback

**Checkpoint**: Persistence confirmed across reload and account state; no regressions found.

---

## Phase 5: User Story 3 - Cancel an edit without changing anything (Priority: P3)

**Goal**: A user can back out of an in-progress edit (Escape, an explicit cancel control, or clicking away) without persisting anything.

**Independent Test**: `quickstart.md` Scenario 3.

### Implementation for User Story 3

- [X] T017 [US3] In `YearStatCard` (`js/components/StatsBar.tsx`), add an explicit cancel control (e.g. a ✕ icon next to the confirm control) and an Escape-key handler on the input — both reset `draftValue` to the card's current year and set `editingSlot = null` without calling `updateTrackedYear` — *implemented alongside T008–T010/T014 as one `YearStatCard` component rather than as a separate follow-up edit, since splitting the diff would have meant shipping a strictly-worse intermediate version (edit mode with no way to exit) for no benefit*
- [X] T018 [US3] Add blur/click-away handling on the edit input that behaves identically to T017's cancel (discard draft, exit edit mode, no persistence) — per spec FR-006, clicking away is not an accidental silent-save

**Checkpoint**: All three cancel paths (Escape, explicit control, click-away) leave the card and the database untouched.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Visual consistency and final end-to-end sign-off.

- [X] T019 [P] Add `ge-*`-prefixed CSS classes for the new edit affordance, inline input, and confirm/cancel controls to `css/styles.css`, matching the existing button/input styling conventions (Constitution Principle IV — no new CSS pattern)
- [ ] T020 [P] Run the full `quickstart.md` script (all 5 scenarios, including "Done when") end-to-end on the feature's Netlify PR branch-deploy preview before merging — this is the project's actual verification gate (Constitution Principle I: no automated test suite)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001 and T002 can start immediately, in parallel.
- **Foundational (Phase 2)**: Depends on Setup (the migration must exist before the app code that reads/writes those columns is meaningful, though TypeScript compilation itself doesn't require the DB to be live). T003 → T004 (same file, sequential) → T005 (needs the `Stats` shape from T004) → T006 (needs `computeStats`'s new signature from T005) → T007 (needs `stats.trackedYearCounts` from T006).
- **User Stories (Phase 3+)**: All depend on Foundational completing. US1 (Phase 3) has no dependency on US2 or US3. US2 (Phase 4) depends only on Foundational + US1 already being in place (it verifies their combination — it adds no code of its own). US3 (Phase 5) depends on US1's edit-mode state machine (T008–T010) existing, since it adds cancel behavior to that same state machine.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Phase 3 (User Story 1)

T008 → T009 → T010 → T011 → T012 → T013 → T014 (each builds on the previous; all touch one of two files — `StatsBar.tsx` or `App.tsx` — with real sequential dependencies, not just file overlap).

### Parallel Opportunities

- T001 and T002 (Setup) — different files, no dependency.
- T015 and T016 (US2 verification) — independent checks, either order.
- T019 and T020 (Polish) — different concerns (CSS vs. end-to-end QA).
- No other tasks are safely parallel: Phase 2 is a strict chain (each task depends on the previous task's output in the same small set of files), and Phase 3/5 tasks modify the same two files in a meaningful order.

---

## Parallel Example: Setup

```bash
Task: "Create supabase/migrations/add_tracked_vintage_years.sql"
Task: "Update the profiles table definition in supabase/schema.sql"
```

## Parallel Example: User Story 2 Verification

```bash
Task: "Manually verify quickstart.md Scenario 2 steps 1-4 (persistence across reload/session)"
Task: "Manually verify quickstart.md Scenario 2 steps 5-6 (new-user defaults)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational) — required, not optional, since Foundational is what makes the stats bar data-driven at all.
2. Complete Phase 3 (User Story 1) — a user can now customize their tracked years.
3. **STOP and VALIDATE**: run `quickstart.md` Scenarios 1, 4, and 5.
4. This is already a complete, shippable increment — US2 (persistence) is automatically true once Phase 2 + Phase 3 are done, and US3 (cancel) is a P3 nicety, not a blocker.

### Incremental Delivery

1. Setup + Foundational → app unchanged from a user's perspective, but data-driven underneath.
2. Add US1 → users can customize their tracked years (MVP).
3. Verify US2 → confirms persistence needs no extra code (spend the phase on verification, not implementation).
4. Add US3 → adds the safety net of cancelling an edit cleanly.
5. Polish → visual consistency pass and full manual QA sign-off before merge.

---

## Notes

- No test-writing tasks exist anywhere in this file — Constitution Principle I means there is no automated test suite to add to; every "Independent Test" above is a manual `quickstart.md` script run against a real branch-deploy preview, not an automated test task.
- US2 having no implementation tasks of its own is intentional, not an oversight — see Phase 4's Goal note. Re-verify this is still true if Phase 2 or Phase 3 change during implementation.
- Task IDs are sequential across the whole file (T001–T020), not restarted per phase, so they stay stable if a phase is skipped or reordered during implementation.
