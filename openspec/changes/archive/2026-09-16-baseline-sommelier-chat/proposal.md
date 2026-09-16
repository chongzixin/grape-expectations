## Why

The AI sommelier chat — the core differentiator of Grape Expectations — exists only as prompt strings and handlers in `js/App.tsx` and `js/components/GuestPage.tsx`, with no written spec. Documenting it as a baseline capability lets future prompt or behavior changes be proposed as deltas against a known-good description, instead of against tribal knowledge of the current prompt.

## What Changes

No behavior changes. This documents the existing, already-shipped sommelier chat feature (signed-in recommendation chat plus the unauthenticated guest pairing mode) as an OpenSpec capability spec.

## Capabilities

### New Capabilities
- `sommelier-chat`: Conversational wine recommendations tailored to Singapore local cuisine, backed by the full cellar inventory for signed-in users; a lighter unauthenticated guest mode; the hidden `WINES_JSON` metadata block used to drive per-wine UI; and per-wine thumbs up/down feedback.

### Modified Capabilities
(none)

## Impact

- Documentation only — no code changes.
- Grounded in: `js/App.tsx` (`sendChat`, `submitWineFeedback`), `js/components/GuestPage.tsx`, `js/utils.ts` (`parseRecommendedWines`, `stripWinesJson`), `js/localCuisine.ts`, `js/constants.ts` (`SOMMELIER_SYSTEM`, `DRINKING_STATUS_PRIORITY`), `netlify/functions/claude.js`, `supabase/schema.sql` (`recommendation_sessions`, `recommendation_messages`, `recommendation_feedback`).
