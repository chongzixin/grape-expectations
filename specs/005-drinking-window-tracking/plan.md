# Implementation Plan: Drinking Window Tracking

**Branch**: `005-drinking-window-tracking` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-drinking-window-tracking/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

Drinking-window *status* is a pure, derived value (`getDrinkingStatus()` in `js/utils.ts`) computed from two nullable integer columns and the current year — never stored. Drinking-window *estimation* is a small, single-purpose Claude call (tiny JSON in/out) triggered three ways: debounced on vintage entry, eagerly per wine after a photo scan (spec 004), and in a sequential cellar-wide batch from the header.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: Plain React hooks (`useRef` for debounce/race-guard bookkeeping), shared `callClaude()` proxy helper

**Storage**: `wines.drink_from` / `wines.drink_by` (nullable `INTEGER` columns, `supabase/schema.sql`)

**Testing**: None — no automated test suite (Constitution Principle I); `getDrinkingStatus()`'s boundary logic was verified manually against known examples during development, not via unit tests

**Target Platform**: Web (desktop + mobile)

**Performance Goals**: Status computation is O(1) per wine and re-run on every render (cheap enough not to memoize per-wine); estimation calls use a tiny `maxTokens: 60` budget to keep latency low

**Constraints**: Sequential (non-parallel) batch estimation, by design, to avoid bursting the shared proxy (see spec.md Assumptions)

**Scale/Scope**: Applies uniformly to every wine in a user's cellar; batch estimation scales linearly with the number of wines missing a window

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — batch/individual window updates use `supabase.from('wines').update(...).eq('id', wine.id)`, relying on the existing RLS `UPDATE` policy (`schema.sql:53-54`) rather than any app-level ownership check.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: PASS — all three estimation call sites use `callClaude()`.
- **Principle IV (Follow Existing Conventions)**: PASS — plain hooks; `BADGE_STYLES`/`DRINKING_STATUS_PRIORITY`/`DRINKING_STATUS_DESCRIPTIONS` centralized in `constants.ts` rather than scattered inline, matching how other shared lookup tables (`TYPE_STYLE`, `FLAGS`) are organized.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — `DrinkingWindowBadge.tsx` is a small, clearly-separable presentational component already extracted; the estimation handlers remain in `App.tsx` alongside the rest of the cellar mutation logic.

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-drinking-window-tracking/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── constants.ts                       # DRINKING_STATUS_PRIORITY, DRINKING_STATUS_DESCRIPTIONS, BADGE_STYLES
├── utils.ts                            # getDrinkingStatus() — pure status derivation
├── App.tsx                              # estimateDrinkingWindow(), fetchDrinkingWindow(),
│                                        #   handleVintageChange() (debounced single estimate),
│                                        #   estimateDrinkingWindows() (sequential batch)
└── components/
    ├── DrinkingWindowBadge.tsx           # Status → colored badge + tooltip
    ├── CellarView.tsx                     # window sort option, share-text grouping by priority
    ├── Header.tsx                          # "Estimate Windows" batch trigger + progress label
    └── StatsBar.tsx                        # Drink Soon / Past Peak stat cards (see spec 008)

supabase/
└── schema.sql                              # wines.drink_from / wines.drink_by columns
```

**Structure Decision**: Status logic is a single pure function reused everywhere (no duplicated status-computation logic per component); estimation is three thin call sites into one shared `estimateDrinkingWindow()`-shaped prompt pattern (single-wine estimate in `App.tsx`, invoked directly for the vintage-field case and looped for the batch case; the photo-scan case in spec 004 has its own near-identical inline call for historical reasons rather than sharing this exact function).

## Key Flows (as built)

1. **Status derivation**: `getDrinkingStatus(wine)` — `unknown` if both null; otherwise treats a missing `drinkFrom` as `-Infinity` and missing `drinkBy` as `+Infinity`, then: `too_young` if `CURRENT_YEAR < from`; `past_peak` if `CURRENT_YEAR > by`; `approaching_end` if `drinkBy - CURRENT_YEAR <= 2` (only checked when `drinkBy` is actually set); otherwise `prime`.
2. **Debounced single estimate**: `handleVintageChange(value)` clears the window fields immediately, validates the new value is a 4-digit year, then sets a 700ms `setTimeout` (via `vintageDebounceRef`) that calls `estimateDrinkingWindow()` and applies the result only `if (reqId === windowReqRef.current)` — an incrementing ref-counter race guard so a later keystroke's request always wins over an earlier, slower one.
3. **Batch estimate**: `estimateDrinkingWindows()` filters wines with both fields null, then `for`-loops (sequential `await`) calling the same estimate prompt, updating `windowEstimationProgress` before each call and persisting + merging into local state after each success; a caught error per-iteration lets the loop continue.
4. **Display**: `DrinkingWindowBadge` looks up `BADGE_STYLES[status]` for background/color/label and formats `${drinkFrom ?? '?'}–${drinkBy ?? '?'}` as a secondary label + `title` tooltip when at least one bound is known.
5. **Sort/share integration**: `CellarView`'s sort comparator and `formatCellarText()`'s per-type grouping both use `DRINKING_STATUS_PRIORITY[getDrinkingStatus(w)]` as the primary sort key with `drinkBy ?? 9999` as the tiebreaker.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
