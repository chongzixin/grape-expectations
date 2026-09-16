# Implementation Plan: Cellar Analytics & AI Health Summary

**Branch**: `008-cellar-analytics` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-cellar-analytics/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

All numeric breakdowns are pure client-side derivations (`computeStats()` plus inline `reduce`/`Object.entries` groupings in `AnalyticsView.tsx`) over `activeWines`, requiring no network round-trip. The one AI-backed piece — the narrative "Cellar Health Snapshot" — is a single `callClaude()` call triggered on first Analytics-tab visit and cached in component state for the session.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `react-markdown` + `remark-gfm` (summary rendering), inline SVG donut chart (`DonutChart.tsx`, no charting library dependency), shared `callClaude()`/`useWittyLoader()`

**Storage**: Read-only over the `wines` table (via `activeWines`, already fetched for the Cellar tab) — no new tables

**Testing**: None — no automated test suite (Constitution Principle I); `computeStats()`'s aggregate math was verified manually against sample data during development

**Target Platform**: Web (desktop + mobile)

**Performance Goals**: Stats/breakdowns are `useMemo`-derived so they only recompute when `activeWines` changes, not on every render; charts are pure SVG (no canvas/WebGL charting library) to keep bundle size down

**Constraints**: `maxTokens: 800` bounds the summary generation call; the 150–180 word target is enforced only via prompt instruction, not truncation

**Scale/Scope**: Designed for a personal cellar's scale (same as spec 003); breakdown lists are unpaginated (assumed to stay short — bounded by the number of distinct countries/varietals/vintages, not raw bottle count)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — no new queries beyond the existing RLS-scoped `wines` fetch already covered in spec 003; analytics reads only from already-fetched, already-scoped client state.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: PASS — `loadSummary()` uses `callClaude()`.
- **Principle IV (Follow Existing Conventions)**: PASS — plain hooks (`useMemo` for `stats`, `useState` for `aiSummary`/`summaryLoading`); `ge-stat*`/`brk-*`/`ai-box` CSS classes; `TYPE_STYLE`/`TYPE_STYLE_LIGHT` reused from the existing type-color system rather than a separate analytics palette.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — `StatsBar.tsx`, `AnalyticsView.tsx`, `DonutChart.tsx` are already extracted, cleanly separable presentational pieces; `stats` (the memo) and `loadSummary()` remain in `App.tsx`.

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/008-cellar-analytics/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                      # stats useMemo, loadSummary(), aiSummary/summaryLoading state
├── utils.ts                      # computeStats()
├── types.ts                      # Stats type
└── components/
    ├── StatsBar.tsx                # Always-visible summary stat cards
    ├── AnalyticsView.tsx             # Tab content: AI summary box + breakdown grid
    └── DonutChart.tsx                 # Reusable inline-SVG donut chart
```

**Structure Decision**: Charting is a small in-house `DonutChart` component rather than a charting library dependency — consistent with the project's minimal-dependency footprint (no Tailwind, no CSS-in-JS, and by extension no heavy charting library either).

## Key Flows (as built)

1. **Stats**: `computeStats(activeWines)` (pure function, `js/utils.ts`) expands wines into a flat "one entry per bottle" array (`flatMap`) for correct bottle-weighted counting, then derives all `Stats` fields from that expansion plus simple filters/reduces.
2. **Stats bar**: `StatsBar.tsx` renders 8 `StatCard`s from the memoized `stats`; the last two (Drink Soon, Past Peak) pass an `onClick` that calls `setTab('cellar')` and `setSort('window')`.
3. **Analytics tab trigger**: the Cellar/Analytics tab button's `onClick` calls both `setTab('analytics')` and `loadSummary()` together, so switching to the tab is what triggers generation (rather than a `useEffect` keyed on `tab`).
4. **Summary generation**: `loadSummary()` guards on `if (aiSummary || summaryLoading) return` for the once-per-session cache, builds a cellar list string plus exact prime/drink-soon/past-peak/too-young bottle counts (via `getDrinkingStatus` reduces), and calls `callClaude()` with a detailed structure/length/content prompt including `LOCAL_FLAVOUR_REFS`/`LOCAL_CUISINE_KNOWLEDGE` for the Singapore-context framing.
5. **Breakdown charts/lists**: `AnalyticsView.tsx` computes type/window/country/varietal/vintage groupings inline via `Object.entries(...reduce(...))` sorted descending by count (vintage sorted descending by string value instead), feeding the type and window breakdowns into two `DonutChart` instances and rendering the rest as ranked `brk-row` lists.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
