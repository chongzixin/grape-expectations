---

description: "Backfilled task record for the Photo & Invoice Label Scanning feature — documents work already completed, not a forward plan"
---

# Tasks: Photo & Invoice Label Scanning

**Input**: Design documents from `specs/004-photo-label-scanning/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — verification was manual with real photos.

## Phase 1: Foundational

- [X] T001 Implement `compressImage()` canvas-based downscale/JPEG-encode in `js/utils.ts`
- [X] T002 Extend `netlify/functions/claude.js` to accept `imageData` and build a vision-capable message
- [X] T003 Add Scan Photo / Manual Entry tab switcher to `AddWineModal.tsx`

**Checkpoint**: Image capture and vision plumbing ready.

---

## Phase 2: User Story 1 — Add a wine by photographing its label (P1)

- [X] T004 [US1] Add camera-capture and gallery-upload buttons + hidden file inputs
- [X] T005 [US1] Write single/multi/invoice extraction prompt with strict field rules (name excludes producer/vintage; unit price over line subtotal)
- [X] T006 [US1] Implement `App.handlePhoto()`: compress → extract → parse JSON → `setScannedWines`
- [X] T007 [US1] Implement `populateFormFromWine()` pre-fill into shared `newWine` form state
- [X] T008 [US1] Add scan failure fallback: alert + switch to Manual Entry tab

**Checkpoint**: Single-label scan → review → save works end-to-end.

---

## Phase 3: User Story 2 — Add multiple wines from one photo or invoice (P1)

- [X] T009 [US2] Extend extraction prompt to emit one object per bottle/line-item for multi-bottle and invoice photos
- [X] T010 [US2] Add pagination UI ("Wine N of M", ← / → controls) to `AddWineModal.tsx`
- [X] T011 [US2] Implement `App.advancePreview()` (repopulate form, close modal past the end)
- [X] T012 [US2] Implement `App.confirmCurrentWine()` (save current + auto-advance)
- [X] T013 [US2] Add "✗ Skip" action (advance without saving) shown only when multiple wines detected

**Checkpoint**: Multi-wine batches are fully reviewable and individually save/skip-able.

---

## Phase 4: User Story 4 — Drinking window pre-fill (P2)

*(Numbered to match spec.md's priority ordering, not build order — window estimation was implemented alongside extraction.)*

- [X] T014 [US4] Implement `App.estimateDrinkingWindow()` (single wine → `{drinkFrom, drinkBy}` via tiny JSON prompt)
- [X] T015 [US4] Implement `App.fetchDrinkingWindow()` with per-wine `_windowFetched` guard and `previewIndexRef` race guard
- [X] T016 [US4] Fire window estimation for every extracted wine automatically after extraction
- [X] T017 [US4] Add "Estimating drinking window…" inline indicator and failure toast

**Checkpoint**: Drinking windows populate automatically for wines with a usable vintage.

---

## Phase 5: User Story 3 — Sommelier notes & local pairings (P3)

- [X] T018 [US3] Add "Include sommelier notes & pairings" opt-in checkbox to the upload screen
- [X] T019 [US3] Write enrichment prompt (wine/winery summary, tasting notes, 3 local-dish pairings)
- [X] T020 [US3] Implement `App.enrichWine()` with `_enriched` guard and `previewIndexRef` race guard
- [X] T021 [US3] Render sommelier-notes panel with loading state and failure toast in `AddWineModal.tsx`

**Checkpoint**: Opt-in enrichment surfaces alongside extracted fields without blocking save.

---

## Dependencies & Execution Order

- Phase 1 blocks all user stories.
- US1 is the base single-wine path; US2 (pagination/multi-wine) extends it rather than replacing it — the same form and save path is reused per wine.
- US4 (window) and US3 (enrichment) are both independent background enrichments layered on top of US1/US2's extraction result; neither blocks the other or the base save flow.
- Saving (in US1/US2) depends on `specs/003-cellar-inventory-management`'s duplicate-detection and insert path (T012–T016 there).

## Notes

- No task exists for a "confidence score" or "low-confidence" UI — not part of the shipped feature (see spec.md Edge Cases).
