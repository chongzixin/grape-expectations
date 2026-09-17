# Feature Specification: Cellar Analytics & AI Health Summary

**Feature Branch**: `008-cellar-analytics` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx` (`loadSummary`, `computeStats`), `js/components/StatsBar.tsx`, `js/components/AnalyticsView.tsx`, and `js/components/DonutChart.tsx`, per user request to backfill SpecKit specs for all existing features.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See cellar totals at a glance (Priority: P1)

A collector viewing their cellar immediately sees summary numbers (total bottles, unique wines, average price, notable vintage counts, and urgency counts) without opening a separate analytics screen.

**Why this priority**: This is always-visible, zero-interaction information available the instant the app loads — the lowest-friction way to answer "how big/valuable is my cellar" and "what needs attention."

**Independent Test**: Load the app with a populated cellar and confirm the stats bar shows correct totals matching the underlying wine list, above both the Cellar and Analytics tabs.

**Acceptance Scenarios**:

1. **Given** a cellar with active wines, **When** the app renders, **Then** the stats bar shows total bottle count (sum of inventory, not unique wine count), unique wine count, average price (rounded, across only priced wines), and counts of bottles from vintages 2016/2018/2023.
2. **Given** the stats bar, **When** rendered, **Then** it also shows a "Drink Soon" count and a "Past Peak" count, each accent-colored (amber/red) to draw attention.
3. **Given** the "Drink Soon" or "Past Peak" stat card, **When** clicked, **Then** the app switches to the Cellar tab with sort set to "Drinking Window" so the relevant wines are immediately visible (shared behavior documented in `specs/005-drinking-window-tracking/spec.md`).
4. **Given** an empty cellar (no active wines), **When** stats are computed, **Then** all counts show 0 and average price shows an em-dash rather than erroring or showing "NaN".

---

### User Story 2 - Explore cellar composition visually (Priority: P2)

A collector switches to the Analytics tab to see how their cellar breaks down by wine type, drinking-window status, country, varietal, and vintage.

**Why this priority**: Deeper exploration than the always-visible stats bar; useful for deliberate "what does my collection look like" sessions rather than passive at-a-glance info.

**Independent Test**: Switch to the Analytics tab and confirm donut charts for type and drinking-window breakdown render, alongside ranked lists for country, varietal, and vintage.

**Acceptance Scenarios**:

1. **Given** the Analytics tab, **When** opened, **Then** a donut chart shows bottle counts by wine type, colored consistently with the type-color system used elsewhere in the app (light/dark theme aware).
2. **Given** the Analytics tab, **When** opened, **Then** a second donut chart shows bottle counts by drinking-window status (Too Young / In Prime / Drink Soon / Past Peak), omitting any status with zero bottles rather than showing an empty slice.
3. **Given** the Analytics tab, **When** opened, **Then** ranked lists (highest count first) are shown for country (with flag emoji), varietal/style, and vintage (most recent first among ties... specifically sorted descending by vintage string).
4. **Given** all breakdowns, **When** computed, **Then** they count by bottle (`inventory`), not by unique wine row, consistent with the stats bar's "total bottles" framing.

---

### User Story 3 - Get a written assessment of the cellar (Priority: P2)

A collector requests an AI-written narrative summary of their cellar's character, strengths, and gaps, phrased with Singapore-context references.

**Why this priority**: Turns raw numbers into an interpretive narrative a non-expert collector can act on ("what should I buy next"), which the charts alone don't provide; secondary to the charts because it requires an explicit request (or tab visit) and AI latency.

**Independent Test**: Open the Analytics tab (or click "Generate AI Assessment") and confirm a 150–180 word narrative appears covering the cellar's dominant styles, near-term drinking priorities, style balance, and gaps.

**Acceptance Scenarios**:

1. **Given** the Analytics tab is opened for the first time in this session, **When** it renders, **Then** the summary generation is triggered automatically (no separate click required on first visit).
2. **Given** no summary has been generated yet and generation hasn't started, **When** the "✦ Generate AI Assessment" button is shown instead (e.g. if auto-trigger didn't fire), **Then** clicking it starts generation.
3. **Given** generation is in progress, **When** shown, **Then** a loading spinner with a rotating witty status message is displayed in place of the summary text.
4. **Given** generation completes, **When** rendered, **Then** the summary is 150–180 words across 2–3 flowing paragraphs with no headers, no bullet points, and no bold title — covering the cellar's dominant styles/regions, which bottles are in-prime and deserve near-term attention (using exact computed counts), style balance, drinking-window spread concerns, and specific gaps worth filling — with 1–2 natural references to Singapore food/occasions woven in.
5. **Given** a summary has already been generated in this session, **When** the Analytics tab is revisited, **Then** the existing summary is shown immediately without regenerating (no duplicate AI call for the same session).
6. **Given** the summary generation fails, **When** the error occurs, **Then** a plain fallback message ("Unable to generate summary — please check your connection.") is shown in place of the narrative, without crashing the tab.

### Edge Cases

- What happens if the cellar has wines but none are priced? `avgPrice` is `null` (computed only over `wines.filter(w => w.price)`), displayed as an em-dash in the stats bar rather than $0 or an error.
- What happens if a wine's `style` or `country` is blank? It's grouped under "Unknown" in the relevant analytics breakdown rather than being silently dropped from the counts.
- What happens if the user switches away from Analytics and back within the same session? The summary is cached in component state (`aiSummary`) for the lifetime of the mounted app — no re-fetch, per Acceptance Scenario 5 above.
- What happens to analytics/stats when inventory is adjusted while the Analytics tab is open? Both `stats` and the Analytics breakdowns are `useMemo`-derived from `activeWines`, so they recompute reactively on any inventory change without needing a manual refresh — but the already-generated AI summary text does not auto-regenerate to reflect the change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display, at all times above the tab content, summary stats for the active cellar: total bottles, unique wines, average price (of priced wines only), and bottle counts for vintages 2016, 2018, and 2023.
- **FR-002**: The system MUST display "Drink Soon" and "Past Peak" bottle counts in the stats bar, each clickable to jump to the Cellar tab sorted by drinking-window urgency.
- **FR-003**: The Analytics tab MUST show a donut-chart breakdown of active bottles by wine type and a separate donut-chart breakdown by drinking-window status (omitting zero-count statuses), both using the app's existing type/status color systems.
- **FR-004**: The Analytics tab MUST show ranked (highest-count-first) breakdowns of active bottles by country, by varietal/style, and by vintage.
- **FR-005**: All analytics and stats computations MUST count by bottle quantity (`inventory`), not by number of distinct wine rows.
- **FR-006**: The system MUST generate a one-time-per-session AI narrative cellar summary (150–180 words, 2–3 paragraphs, no headers/bullets/bold title) automatically on first visiting the Analytics tab, covering dominant styles/regions, near-term drinking priorities (using exact computed prime/drink-soon/past-peak/too-young counts), style balance, window-spread concerns, and specific collection gaps, with light Singapore-context framing.
- **FR-007**: The system MUST cache the generated summary for the remainder of the session (no regeneration on repeat tab visits) and MUST show a graceful fallback message if generation fails.
- **FR-008**: The AI summary generation call MUST go through the shared serverless Claude proxy (Constitution Principle III).

### Key Entities

- **Stats** (`js/types.ts`, computed not stored): `totalBottles`, `uniqueWines`, `avgPrice`, `count2016`/`count2018`/`count2023`, `modeCountry`, `modeStyle`, `drinkSoon`, `pastPeak` — produced by `computeStats(activeWines)`.
- No new persisted entities — this feature is a read/derive-only view over `Wine` rows already documented in `specs/003-cellar-inventory-management/spec.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Stats bar figures always exactly match a manual recount of the currently active wine list (verified by construction — `computeStats` is a pure function over `activeWines`, not an independently-tracked counter that could drift).
- **SC-002**: The Analytics tab's charts and lists render immediately (client-side computation only) with no loading delay, independent of whether the AI summary has finished generating.
- **SC-003**: The AI summary lands within the specified 150–180 word range and required structure in the large majority of generations (prompt-enforced, not programmatically validated/retried).
- **SC-004**: A user never sees more than one AI summary generation per Analytics-tab session — confirmed by the `if (aiSummary || summaryLoading) return;` guard at the top of `loadSummary()`.

## Assumptions

- The 2016/2018/2023 vintage-specific stat cards are fixed, hand-picked years (not configurable or dynamically chosen based on the user's actual cellar composition) — likely notable vintages for the app's target collector base rather than a generic "top 3 vintages" computation.
- "Mode country" / "mode style" (`Stats.modeCountry`/`modeStyle`) are computed but not currently surfaced anywhere in the UI (`StatsBar` and `AnalyticsView` don't render them) — they exist in the `Stats` type and `computeStats()` output for potential future use.
- The AI summary is not persisted to the database — it exists only in client memory for the current page session and is regenerated from scratch (losing the old one) on a full page reload.
