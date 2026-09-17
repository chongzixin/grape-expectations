## Why

Grape Expectations has been shipping in production since February 2026 without any spec-driven documentation of its behavior. The cellar inventory feature (add via manual entry or photo/invoice OCR, duplicate merging, bottle counts, AI-estimated drinking windows) exists only as implementation in `js/App.tsx`, `js/utils.ts`, and `js/components/AddWineModal.tsx` — there is no written record of the intended behavior to check future changes against. This baseline capture documents the feature as currently implemented so it can serve as the starting spec for future proposals.

## What Changes

No behavior changes. This documents the existing, already-shipped cellar inventory management feature as an OpenSpec capability spec, establishing a baseline that future changes can add requirements to or modify.

## Capabilities

### New Capabilities
- `cellar-inventory`: Adding wines to the cellar (manual entry and photo/invoice OCR scan), duplicate detection and bottle-count merging, updating and deleting bottles, and AI-estimated drinking windows with status classification.

### Modified Capabilities
(none)

## Impact

- Documentation only — no code changes.
- Grounded in: `js/App.tsx`, `js/utils.ts` (`mapDbWine`, `getDrinkingStatus`, `winesAreDuplicates`, `compressImage`), `js/components/AddWineModal.tsx`, `js/components/DuplicateWineModal.tsx`, `js/types.ts`, `supabase/schema.sql` (`wines` table).
