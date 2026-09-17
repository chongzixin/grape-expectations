## Why

The cellar analytics view (breakdown charts plus the AI-generated "Cellar Health Snapshot") is live in production but undocumented as a spec. Capturing it as a baseline lets future analytics changes (new breakdowns, a different summary prompt) be proposed as deltas against known behavior.

## What Changes

No behavior changes. This documents the existing, already-shipped cellar analytics feature as an OpenSpec capability spec.

## Capabilities

### New Capabilities
- `cellar-analytics`: Computed cellar statistics (`computeStats`), visual breakdowns by type/drinking-window/country/varietal/vintage, and the on-demand AI-generated Cellar Health Snapshot summary.

### Modified Capabilities
(none)

## Impact

- Documentation only — no code changes.
- Grounded in: `js/App.tsx` (`loadSummary`), `js/utils.ts` (`computeStats`), `js/components/AnalyticsView.tsx`, `js/components/StatsBar.tsx`, `js/components/DonutChart.tsx`.
