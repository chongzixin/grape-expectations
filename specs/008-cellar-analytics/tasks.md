---

description: "Backfilled task record for the Cellar Analytics & AI Health Summary feature — documents work already completed, not a forward plan"
---

# Tasks: Cellar Analytics & AI Health Summary

**Input**: Design documents from `specs/008-cellar-analytics/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — aggregate math verified manually.

## Phase 1: Foundational

- [X] T001 Define `Stats` type in `js/types.ts`
- [X] T002 Implement `computeStats()` pure aggregate function in `js/utils.ts`
- [X] T003 Add `stats` `useMemo` over `activeWines` in `App.tsx`

**Checkpoint**: Aggregate stats available for use everywhere.

---

## Phase 2: User Story 1 — Cellar totals at a glance (P1)

- [X] T004 [US1] Build `StatsBar.tsx` with 8 `StatCard`s (total bottles, unique wines, avg price, 2016/2018/2023 counts, drink soon, past peak)
- [X] T005 [US1] Wire Drink Soon / Past Peak cards to `setTab('cellar')` + `setSort('window')`
- [X] T006 [US1] Handle zero-wine cellar gracefully (0 counts, em-dash avg price) in `computeStats()`

**Checkpoint**: Stats bar always shows correct, always-visible totals.

---

## Phase 3: User Story 2 — Explore composition visually (P2)

- [X] T007 [US2] Build reusable inline-SVG `DonutChart.tsx` component
- [X] T008 [US2] Build `AnalyticsView.tsx` breakdown grid: by-type and by-window donuts, by-country/varietal/vintage ranked lists
- [X] T009 [US2] Reuse `TYPE_STYLE`/`TYPE_STYLE_LIGHT` for type-donut coloring (theme-aware)
- [X] T010 [US2] Omit zero-count drinking-window slices from that donut

**Checkpoint**: Analytics tab renders all breakdowns correctly from live cellar data.

---

## Phase 4: User Story 3 — AI cellar health summary (P2)

- [X] T011 [US3] Author the Cellar Health Snapshot prompt (150–180 words, 2–3 paragraphs, no headers/bullets, exact drinking-window counts, Singapore-context framing)
- [X] T012 [US3] Implement `loadSummary()` with once-per-session cache guard (`aiSummary || summaryLoading`)
- [X] T013 [US3] Wire Analytics tab click to trigger `loadSummary()` alongside `setTab('analytics')`
- [X] T014 [US3] Add loading state (spinner + witty message) and manual "Generate AI Assessment" fallback button
- [X] T015 [US3] Add graceful error fallback message on generation failure
- [X] T016 [US3] Render summary as markdown (bold/link styling matching the app's gold-accent convention)

**Checkpoint**: A written cellar assessment generates once per session and degrades gracefully on failure.

---

## Dependencies & Execution Order

- Phase 1 blocks Phases 2–4.
- US1 (stats bar) has no dependency on US2/US3 — it renders from the same `stats` memo independently.
- US3 (AI summary) is independent of US2 (charts) — both live in `AnalyticsView.tsx` but neither blocks the other's rendering.

## Notes

- No task exists for persisting the AI summary or for surfacing `modeCountry`/`modeStyle` in the UI — neither is part of the shipped feature (see spec.md Assumptions).
