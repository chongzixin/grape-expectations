# Feature Specification: Photo & Invoice Label Scanning

**Feature Branch**: `004-photo-label-scanning` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx` (photo-scan handlers) and `js/components/AddWineModal.tsx`, per user request to backfill SpecKit specs for all existing features. This feature produces `NewWineForm` data that is saved through the same add-wine/duplicate-detection path documented in `specs/003-cellar-inventory-management/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a wine by photographing its label (Priority: P1)

A collector photographs a single wine label and the app extracts the wine's details automatically, letting them review and save instead of typing everything by hand.

**Why this priority**: This is the flagship, differentiating capture method for the app — it's the fast path advertised as the primary "Add Wine" option (shown before Manual Entry).

**Independent Test**: Open "Add Wine" (defaults to the Scan Photo tab), take or upload a photo of a single wine label, and confirm a pre-filled, editable wine form appears with a name and type extracted.

**Acceptance Scenarios**:

1. **Given** the Add Wine modal's Scan Photo tab, **When** the user takes a photo (camera capture) or uploads one from their gallery, **Then** the image is shown as a preview and a scanning loading state (spinner + rotating message) appears while it's analyzed.
2. **Given** a photo of a single, legible wine label, **When** analysis completes, **Then** the form is pre-filled with name, winery, vintage, type, style, country, region, and sub-region as separate fields (never with winery or vintage folded into the name field), ready for the user to review, correct, and save.
3. **Given** the pre-filled preview, **When** the user edits any field before saving, **Then** their edits are what gets saved, not the raw AI output.
4. **Given** the image cannot be parsed into any wine JSON (e.g. not a label at all), **When** analysis fails, **Then** the user sees an alert to that effect and the modal falls back to the Manual Entry tab so they can still add the wine by hand.

---

### User Story 2 - Add multiple wines from one photo or an invoice (Priority: P1)

A collector photographs several bottles at once, or a wine shop invoice listing multiple wines, and the app extracts one entry per wine for sequential review.

**Why this priority**: Case/multi-bottle purchases and invoices are a common real-world acquisition pattern; without batch extraction, users would have to scan or type each wine separately.

**Independent Test**: Photograph an invoice listing 3+ wine line items and confirm the app steps through each one as a separate, individually-editable preview before saving.

**Acceptance Scenarios**:

1. **Given** a photo showing multiple bottle labels or an invoice with multiple line items, **When** analysis completes, **Then** the system extracts one wine object per bottle/line-item and shows pagination ("Wine 1 of N") to step through them.
2. **Given** an invoice line item with a "Unit Price" and an "Amount" (line subtotal) column, **When** price is extracted, **Then** the per-bottle unit price is used, not the line subtotal; if a per-line discount is shown, it is subtracted from the unit price first.
3. **Given** the multi-wine preview, **When** the user clicks the ← / → pagination arrows, **Then** the form swaps to show that wine's extracted data (and any already-fetched drinking window / sommelier notes for it) without losing edits already confirmed for other wines.
4. **Given** the multi-wine preview on wine 2 of 3, **When** the user clicks "Add Wine" (confirms the current one), **Then** that wine is saved and the preview automatically advances to wine 3 of 3.
5. **Given** the multi-wine preview, **When** the user clicks "✗ Skip" on a wine they don't want to add, **Then** that wine is not saved and the preview advances to the next one without it.
6. **Given** the last wine in a multi-wine batch is saved or skipped, **When** the advance would go past the end of the list, **Then** the Add Wine modal closes automatically.

---

### User Story 3 - Get sommelier notes and local pairings while scanning (Priority: P3)

A collector opts in to receive AI-generated tasting notes, a producer summary, and Singapore-dish pairing suggestions for each scanned wine, alongside the extracted structured fields.

**Why this priority**: A value-add enrichment on top of the core extraction, explicitly opt-in because it takes longer — not required for the basic capture-and-save flow to work.

**Independent Test**: Enable "Include sommelier notes & pairings" before scanning, scan a label, and confirm tasting notes and 3 local dish pairings appear alongside the extracted fields (after a brief additional wait).

**Acceptance Scenarios**:

1. **Given** the Scan Photo tab's upload screen, **When** the user checks "Include sommelier notes & pairings" before scanning, **Then** each extracted wine additionally receives a one-sentence wine summary, one-sentence winery/producer summary, 2–3 sentences of tasting notes, and exactly 3 Singapore/SEA local-dish pairing suggestions (each tied to a specific flavour rationale).
2. **Given** enrichment is in progress for the currently-previewed wine, **When** the data hasn't arrived yet, **Then** a "Preparing sommelier notes…" loading indicator is shown in place of the notes panel.
3. **Given** enrichment fails for a wine, **When** the error occurs, **Then** an error toast notifies the user but the extracted structured fields (name, winery, etc.) remain usable and saveable regardless.
4. **Given** the checkbox is left unchecked (default), **When** scanning completes, **Then** no enrichment call is made at all — only the structured extraction and drinking-window estimation run.

---

### User Story 4 - Have the drinking window pre-filled from the scan (Priority: P2)

Immediately after a label is scanned, each extracted wine also gets an automatic drinking-window estimate so the collector doesn't have to enter it by hand.

**Why this priority**: Removes a data-entry step the user would otherwise have to do manually or skip; drinking window is core to the app's value (see `specs/005-drinking-window-tracking/spec.md`) and photo scan is the highest-volume entry point.

**Independent Test**: Scan a label with a clear 4-digit vintage and confirm the Drink From / Drink To fields populate without the user touching them, shortly after the rest of the form appears.

**Acceptance Scenarios**:

1. **Given** an extracted wine with a plausible vintage (4-digit year, not "NV" or blank), **When** extraction completes, **Then** a background drinking-window estimate request is fired for it automatically, for every wine in a multi-wine batch.
2. **Given** the estimate is still in flight for the currently-previewed wine, **When** its Drink From/To fields are both still empty, **Then** an "Estimating drinking window…" inline indicator is shown.
3. **Given** the estimate fails, **When** the error occurs, **Then** a toast tells the user to enter dates manually and the rest of the form remains usable.
4. **Given** a wine's vintage is "NV", blank, or not a 4-digit year, **When** extraction completes, **Then** no drinking-window estimate is attempted for it (window fields simply stay empty for manual entry).

### Edge Cases

- What happens when the photo is blurry or the label is in a language the model can't read confidently? The model is instructed to use `null` for any field it can't determine; the user reviews and fills gaps manually before saving — there is no confidence score or "low confidence" warning shown.
- What happens if the user backgrounds the app mid-scan and returns? No explicit handling — the in-flight request either completes and updates state normally when the tab is foregrounded again, or the component may have unmounted, in which case updates are simply not applied (no dangling-request warnings surfaced).
- What happens when switching pagination away from a wine mid-enrichment and back again? `_enriched`/`_windowFetched` flags on the scanned-wine object prevent re-fetching data that has already arrived; if a fetch was still in-flight, switching away doesn't cancel it — its result is applied to that wine's stored data when it lands, and re-displayed if the user navigates back to it.
- What image size/format is sent to the model? Images are downscaled client-side to a maximum dimension of 2400px and re-encoded as JPEG (quality 0.85) before upload, to bound payload size and cost regardless of the source photo's resolution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a user capture a photo via device camera or select one from their photo gallery for wine-label scanning.
- **FR-002**: The system MUST compress/downscale the image client-side (max 2400px longest edge, JPEG ~0.85 quality) before sending it to the AI vision call, to bound upload size.
- **FR-003**: The system MUST extract, per detected wine, at minimum: name (excluding producer and vintage), winery, vintage (4-digit year or "NV"), price (nullable), style, country, region, sub-region (nullable), and type (one of the six supported wine types).
- **FR-004**: The system MUST handle three distinct photo scenarios from a single upload flow: a single label, multiple bottle labels in one frame, and a multi-line invoice — producing one extracted wine object per bottle/line-item in all cases.
- **FR-005**: For invoice price extraction, the system MUST prefer a per-unit price field over a line-subtotal field, and MUST net out any shown per-line discount.
- **FR-006**: When more than one wine is extracted, the system MUST present them one at a time with pagination controls, and MUST let the user confirm (save) or skip each individually, advancing automatically after either action, and closing the modal after the last one.
- **FR-007**: The system MUST pre-fill the manual-entry-style review form from the extracted data while keeping every field user-editable before save; only the user-edited (or accepted) values are what gets persisted.
- **FR-008**: The system MUST automatically request a drinking-window estimate for every extracted wine with a plausible vintage, without requiring the user to trigger it, and MUST not block the rest of the form on that estimate arriving.
- **FR-009**: The system MUST offer an opt-in checkbox to also generate sommelier tasting notes, a wine/producer summary, and exactly 3 Singapore/SEA local-dish pairing suggestions per wine, off by default, and MUST NOT make this additional call when the option is not selected.
- **FR-010**: If the initial extraction call fails or returns no parseable wine data, the system MUST inform the user and fall back to the Manual Entry tab rather than leaving them stuck on a failed scan with no path forward.
- **FR-011**: All extraction and enrichment calls MUST go through the shared serverless Claude proxy (Constitution Principle III), never directly from the browser to Anthropic.
- **FR-012**: Saving a scanned wine MUST go through the same duplicate-detection path as manual entry (`specs/003-cellar-inventory-management/spec.md` FR-004) — scanning does not bypass duplicate checks.

### Key Entities

- **Scanned wine (transient)**: `Partial<Wine>` plus scan-only bookkeeping fields (`_enriched`, `_windowFetched`) and, when enrichment is on, `localPairings: string[]`, `wineSummary`, `winerySummary`, `tastingNotes`. Held only in component state (`scannedWines`) for the duration of the modal session — never written to the DB directly; only the reviewed/confirmed `NewWineForm` per wine is persisted (as a `wines` row, `source = 'photo_scan'`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from opening the Add Wine modal to a saved, correctly-typed wine entry for a single clear label photo in under 20 seconds including AI processing time.
- **SC-002**: An invoice or multi-bottle photo with up to 10 line items is fully paginated and reviewable without the user having to re-photograph or manually re-enter any already-extracted field.
- **SC-003**: At least the wine name and type are correctly extracted (matching what a human reading the same label would enter) for the large majority of clear, well-lit single-label photos.
- **SC-004**: Drinking-window pre-fill arrives without the user needing to press any button, for every wine with a usable vintage, in the common case.

## Assumptions

- No OCR/vision processing happens on-device; all extraction is a single Claude vision call per photo via the serverless proxy — there is no separate, dedicated OCR service.
- The six supported wine types (Red, White, Sparkling, Rosé, Dessert, Fortified) are treated as an exhaustive, fixed enum for extraction purposes; anything else the model returns is not specially validated or rejected client-side.
- There is no maximum enforced on the number of wines extracted from one photo/invoice; very large invoices are assumed to be handled by the model's own output limits (`maxTokens: 1500` for extraction) rather than an explicit app-level cap.
- Enrichment (sommelier notes) and drinking-window estimation are independent, parallel-fired background calls per wine — their relative arrival order in the UI is not guaranteed or specified.
