# Feature Specification: Drinking Window Tracking

**Feature Branch**: `005-drinking-window-tracking` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/utils.ts` (`getDrinkingStatus`), `js/constants.ts` (status priority/descriptions/badge styles), `js/components/DrinkingWindowBadge.tsx`, `js/components/Header.tsx` (batch estimation), and the per-wine estimation calls in `js/App.tsx`, per user request to backfill SpecKit specs for all existing features. The estimation calls themselves are also used by, and documented from the caller's perspective in, `specs/004-photo-label-scanning/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See at a glance which bottles to drink now (Priority: P1)

A collector looks at their cellar table and immediately sees which bottles are in their prime drinking window, which need to be drunk soon, and which are past their peak — without having to know each wine's aging characteristics themselves.

**Why this priority**: This is the core value proposition of window tracking — a cellar collector's biggest fear is letting a bottle go past its best; surfacing this passively is the feature's entire reason to exist.

**Independent Test**: With a cellar containing wines of known drink-from/drink-by years spanning all five statuses, view the cellar table and confirm each wine shows a correctly colored, correctly labeled badge.

**Acceptance Scenarios**:

1. **Given** a wine with `drinkFrom` and `drinkBy` both set, **When** the current year falls within that range and `drinkBy` is more than 2 years away, **Then** its status is "Prime" (green badge).
2. **Given** a wine with `drinkBy` set to within 2 years of the current year (inclusive) and the current year not yet past it, **When** status is computed, **Then** its status is "Drink Soon" (amber badge), taking priority over "Prime".
3. **Given** a wine whose `drinkBy` year has already passed, **When** status is computed, **Then** its status is "Past Peak" (red badge), regardless of how "Prime" the window looked before.
4. **Given** a wine whose `drinkFrom` year is still in the future, **When** status is computed, **Then** its status is "Too Young" (blue badge).
5. **Given** a wine with neither `drinkFrom` nor `drinkBy` set, **When** status is computed, **Then** its status is "Unknown" (grey badge) rather than defaulting to any drinkable state.
6. **Given** a badge with window data, **When** displayed, **Then** it shows both the status label and the raw year range (e.g. "Prime 2022–2030"); hovering shows the same range as a tooltip.

---

### User Story 2 - Prioritize the cellar view by urgency (Priority: P2)

A collector sorts their cellar so the most time-sensitive bottles (needing to be drunk soonest) surface first.

**Why this priority**: Passive badges alone don't help triage a large cellar; active sorting turns the status into an actionable "drink these next" list.

**Independent Test**: Set cellar sort to "Drinking Window" and confirm wines appear ordered Past Peak → Drink Soon → Prime → Too Young → Unknown, with ties broken by nearer `drinkBy` year first.

**Acceptance Scenarios**:

1. **Given** the cellar sort is set to "Drinking Window", **When** the table renders, **Then** wines are ordered by status priority (Past Peak first, then Drink Soon, Prime, Too Young, Unknown last).
2. **Given** two wines share the same status, **When** ordered, **Then** the one with the nearer (smaller) `drinkBy` year is listed first; wines with no `drinkBy` sort after those that have one within the same status group.
3. **Given** the analytics "Drink Soon" or "Past Peak" stat card is clicked, **When** handled, **Then** the app switches to the Cellar tab with sort already set to "Drinking Window" so the relevant wines are surfaced immediately.
4. **Given** the cellar share-text export runs (spec 003), **When** wines are grouped by type, **Then** wines within each type group are also ordered by the same drinking-window priority.

---

### User Story 3 - Get a drinking window without knowing one (Priority: P1)

A collector who doesn't personally know a wine's ideal drinking window gets an AI-estimated one automatically, rather than being forced to research and enter it themselves.

**Why this priority**: Most collectors don't have per-wine aging expertise; without automatic estimation, the entire feature would depend on manual data entry that most users would simply skip, making Prime/Past Peak tracking mostly empty.

**Independent Test**: Enter a wine name, winery, and a plausible 4-digit vintage in the Add Wine form and confirm Drink From / Drink To auto-populate shortly after, without the user pressing an explicit "estimate" button.

**Acceptance Scenarios**:

1. **Given** the Add Wine form (manual or scan-review), **When** the user finishes typing a plausible 4-digit vintage year (debounced ~700ms after the last keystroke) and a wine name is present, **Then** an estimate request fires automatically and, on success, fills the Drink From/To fields.
2. **Given** the user changes the vintage again before a previous estimate finishes, **When** the newer request is triggered, **Then** only the result of the latest request is applied (a stale, superseded response is discarded even if it arrives later).
3. **Given** the user changes the vintage field, **When** the change happens, **Then** any previously-filled Drink From/To values are cleared immediately (not left showing a window for the old vintage) until the new estimate (if any) arrives.
4. **Given** the vintage entered is blank, "NV", or not a valid 4-digit year, **When** the debounce fires, **Then** no estimate request is made and the window fields are simply left for manual entry.
5. **Given** the estimate request fails, **When** the error occurs, **Then** the window fields remain empty/editable with no error interrupting the rest of the form (silent failure for this inline case, unlike the scan-review case which shows a toast — see `specs/004-photo-label-scanning/spec.md`).

---

### User Story 4 - Backfill windows for an entire existing cellar (Priority: P2)

A collector who has wines already in their cellar without a drinking window (added before this feature, or added without one) fills them all in at once instead of editing each wine individually.

**Why this priority**: Without a batch option, users with legacy or bulk-imported cellars would face a tedious wine-by-wine cleanup; this converts window tracking from "only works for new entries" to "works for the whole cellar."

**Independent Test**: With at least one wine missing both `drinkFrom` and `drinkBy`, click "Estimate Windows" in the header and confirm each such wine is updated with a progress indicator shown throughout.

**Acceptance Scenarios**:

1. **Given** at least one wine in the cellar has both `drinkFrom` and `drinkBy` unset, **When** the app renders the header, **Then an** "Estimate Windows" button is visible (desktop only — `hide-m` on mobile); it is hidden entirely when no wine needs it.
2. **Given** the user clicks "Estimate Windows", **When** the batch runs, **Then** wines missing a window are processed one at a time (not in parallel) with a "Estimating… X/N" progress label replacing the button text, and the button is disabled for the duration.
3. **Given** an individual wine's estimate succeeds during the batch, **When** the result arrives, **Then** that wine's `drink_from`/`drink_by` are persisted to the database and reflected in the UI immediately, without waiting for the rest of the batch to finish.
4. **Given** an individual wine's estimate fails during the batch, **When** the error occurs, **Then** the batch continues to the next wine rather than aborting entirely.
5. **Given** the batch completes, **When** finished, **Then** the progress indicator clears and the button reverts to "Estimate Windows" (or disappears if no wine still lacks a window).

### Edge Cases

- What happens for a wine whose `drinkBy` equals the current year exactly? It falls into "Drink Soon" (the ≤ 2 year check includes 0 years remaining), not "Past Peak" — "Past Peak" requires the current year to be strictly greater than `drinkBy`.
- What happens for a wine with only `drinkFrom` set (no `drinkBy`)? Its effective upper bound is treated as infinite for status purposes — it can be "Too Young" or "Prime" but never "Drink Soon" or "Past Peak" from the missing bound alone.
- What happens for a wine with only `drinkBy` set (no `drinkFrom`)? Its effective lower bound is treated as always-already-reached (`-Infinity`), so it can be "Prime", "Drink Soon", or "Past Peak" but never "Too Young".
- What happens if the AI returns an implausible window (e.g. `drinkBy` before `drinkFrom`, or ancient/far-future years)? No validation is performed on the returned values beyond parsing them as integers — they are accepted and stored as-is.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST compute a drinking-window status for every wine from its `drinkFrom`/`drinkBy` fields and the current year, using exactly these five states: Prime, Drink Soon (approaching_end), Past Peak, Too Young, Unknown — with Past Peak and Drink Soon taking precedence over Prime, per the ordering rules in User Story 1.
- **FR-002**: The system MUST render this status as a colored, labeled badge (with the underlying year range as a tooltip/secondary label) everywhere a wine is listed: cellar table (desktop and mobile layouts), analytics breakdowns, and chat cellar context.
- **FR-003**: The system MUST support sorting/grouping the cellar and its share-text export by drinking-window urgency, using a fixed priority order (Past Peak > Drink Soon > Prime > Too Young > Unknown) with nearer `drinkBy` breaking ties.
- **FR-004**: The system MUST automatically request an AI-estimated drinking window when a user enters a plausible vintage for a named wine in the add/edit form, debounced to avoid firing on every keystroke, and MUST discard the result of any estimate request superseded by a newer one for the same field.
- **FR-005**: The system MUST provide a one-click batch action to estimate drinking windows for every wine in the cellar currently missing one, processing sequentially with visible progress, persisting each success immediately, and tolerating individual failures without aborting the batch.
- **FR-006**: Drinking-window estimation MUST go through the shared serverless Claude proxy (Constitution Principle III) and MUST request a minimal structured response (`{"drinkFrom": ..., "drinkBy": ...}` or nulls) rather than free text.
- **FR-007**: The system MUST NOT attempt estimation for a vintage that is blank, "NV", or not a valid 4-digit year.

### Key Entities

- **Wine.drinkFrom / Wine.drinkBy** (nullable integers, stored as `drink_from`/`drink_by` on the `wines` table): the estimated or user-entered start/end years of the wine's drinking window. No separate entity — these are two columns on the existing `Wine` record documented in `specs/003-cellar-inventory-management/spec.md`.
- **DrinkingStatus** (derived, not stored): one of `prime | approaching_end | past_peak | too_young | unknown`, computed on read by `getDrinkingStatus()` — never persisted, always recomputed against the current date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every wine in the cellar table displays a drinking-window badge (including "Unknown" when no data exists) — no wine is ever shown with a missing/blank status indicator.
- **SC-002**: A newly-entered wine with a valid vintage has its drinking window auto-populated without any explicit user action in the common case, within a couple of seconds of the user pausing typing.
- **SC-003**: A cellar-wide "Estimate Windows" run backfills 100% of eligible wines (valid vintage, currently missing a window) that don't individually error, with per-wine progress visible throughout — not a single opaque wait.
- **SC-004**: Sorting by "Drinking Window" always surfaces the most urgent (Past Peak, then Drink Soon) bottles first, verified against the fixed priority order regardless of cellar size.

## Assumptions

- "Current year" for status computation is the browser's local date at render time (`CURRENT_YEAR = new Date().getFullYear()`, computed once at module load) — not the wine's country/region timezone or a server-side clock.
- The 2-year "Drink Soon" threshold is a fixed, non-configurable constant, not a per-user or per-wine-type setting.
- Estimation is advisory only — there is no mechanism for a user to "correct" the AI's estimate other than directly editing the Drink From/To fields, which is treated as authoritative once entered (no re-estimation happens on a field the user has manually set, other than being cleared and re-triggered by a vintage change).
- Batch "Estimate Windows" is sequential by design (one request at a time) rather than parallelized, trading speed for simplicity and to avoid bursting the Claude proxy with concurrent requests from one user action.
