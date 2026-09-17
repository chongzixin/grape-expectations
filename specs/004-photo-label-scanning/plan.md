# Implementation Plan: Photo & Invoice Label Scanning

**Branch**: `004-photo-label-scanning` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-photo-label-scanning/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

A photo is compressed client-side, sent as base64 image data to the shared Claude proxy with an extraction prompt requesting a raw JSON array, then parsed into `scannedWines: Partial<Wine>[]` state in `App.tsx`. `AddWineModal.tsx`'s Scan Photo tab renders the capture UI, per-wine pagination, and the pre-filled review form (shared with Manual Entry). Two further background enrichment calls (drinking window, optional sommelier notes) are fired per extracted wine and merged into the same state as they resolve.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: Browser `Canvas`/`Image` APIs (client-side compression), shared `callClaude()` proxy helper, `@anthropic-ai/sdk` (server-side, in the Netlify function)

**Storage**: Extracted data held only in transient React state until confirmed; confirmed wines are persisted via the same `addWineToDb()` path as manual entry (`wines` table)

**Testing**: None — no automated test suite (Constitution Principle I); verified manually with real label/invoice photos during development

**Target Platform**: Web (mobile browsers primarily, for camera capture; desktop via gallery upload)

**Performance Goals**: Image compression caps upload size regardless of source photo resolution (max 2400px longest edge, JPEG q0.85) to keep the vision call latency and request size bounded

**Constraints**: `maxTokens: 1500` on the extraction call bounds how many wines/how much detail can be returned per photo; `maxTokens: 600` for enrichment; `maxTokens: 60` for the drinking-window estimate (a tiny JSON object)

**Scale/Scope**: One photo → typically 1–10 extracted wines; no explicit hard cap enforced

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — scanning itself makes no DB calls; the eventual save goes through the same RLS-scoped `wines` insert as manual entry.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: PASS — extraction, enrichment, and drinking-window calls all go through `callClaude()` → `/.netlify/functions/claude`; the Anthropic API key is only ever read server-side (`netlify/functions/claude.js`, `process.env.ANTHROPIC_API_KEY`).
- **Principle IV (Follow Existing Conventions)**: PASS — plain hooks (`useState`, `useRef` for `previewIndexRef`/`windowReqRef` to avoid stale closures in async callbacks), `ge-*`/`wpc-*`/`scan-*` CSS classes.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — the photo-scan handlers (`handlePhoto`, `enrichWine`, `fetchDrinkingWindow`, `advancePreview`, `confirmCurrentWine`) live in `App.tsx`; `AddWineModal.tsx` is presentational, receiving all of this as props (consistent with the rest of the cellar-management surface).

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-photo-label-scanning/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                    # handlePhoto, enrichWine, estimateDrinkingWindow, fetchDrinkingWindow,
│                               #   advancePreview, confirmCurrentWine, populateFormFromWine
├── utils.ts                     # compressImage(), callClaude()
├── constants.ts                  # SOMMELIER_SYSTEM (base persona reused in extraction/enrichment prompts)
├── localCuisine.ts                # LOCAL_CUISINE_KNOWLEDGE, LOCAL_FLAVOUR_REFS (enrichment prompt)
└── components/
    └── AddWineModal.tsx            # Scan Photo tab: capture buttons, pagination, review form, notes panel

netlify/functions/
└── claude.js                       # Shared proxy; branches on presence of `imageData` to build the
                                     #   vision-capable message shape
```

**Structure Decision**: No dedicated "scan service" module — extraction/enrichment/window-estimation are three separate `callClaude()` invocations with different prompts and `maxTokens`, called directly from `App.tsx` handlers, consistent with how the rest of the app makes AI calls (no shared AI-orchestration layer exists yet).

## Key Flows (as built)

1. **Capture**: `AddWineModal` has two hidden `<input type="file">` elements — one with `capture="environment"` (camera) and one without (gallery) — both calling `App.handlePhoto(file)` on change.
2. **Compression**: `compressImage(file, 2400)` draws the image to an off-screen `<canvas>`, scales to a max 2400px dimension if needed, and re-encodes as JPEG (0.85 quality), returning `{ data: base64, mimeType: 'image/jpeg' }`.
3. **Extraction**: `callClaude({ imageData, messages: [...] })` — the Netlify function builds a vision message (`type: 'image'` + `type: 'text'`) when `imageData` is present. The prompt enumerates the three scenarios (single label / multi-bottle / invoice) and strict field rules (name excludes producer/vintage; price uses unit price net of discount). Response is regex-matched for a JSON array/object and parsed.
4. **State population**: `setScannedWines(parsed)`, `populateFormFromWine(parsed[0])` pre-fills `newWine`, then `fetchDrinkingWindow` is fired for every extracted wine (`forEach`), and `enrichWine` similarly if `wantSommelierNotes` was checked — both keyed by array index and guarded against races via `previewIndexRef` (only apply to the visible form if the response's index still matches the currently-previewed index) and `windowReqRef`/per-wine `_windowFetched`/`_enriched` flags.
5. **Pagination**: `advancePreview(nextIdx)` either closes the modal (past the end) or updates `previewIndex`, repopulates the form from `scannedWines[nextIdx]`, and — if that wine's data hasn't been fetched yet — kicks off its window/enrichment calls at that point instead of eagerly for all wines (enrichment is only eager if `wantSommelierNotes` was on at scan time; window estimation is eager for all wines regardless).
6. **Confirm/skip**: `confirmCurrentWine()` runs the same duplicate check as manual `addWine()` (spec 003) before insert; on success or on "Skip", `advancePreview(previewIndex + 1)` is called.
7. **Failure fallback**: `handlePhoto`'s catch block shows a native `alert()` and calls `setAddTab('manual')`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
