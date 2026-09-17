---

description: "Backfilled task record for the Per-Wine Recommendation Feedback feature — documents work already completed, not a forward plan"
---

# Tasks: Per-Wine Recommendation Feedback

**Input**: Design documents from `specs/007-recommendation-feedback/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — toggle/upsert behavior verified manually.

## Phase 1: Foundational

- [X] T001 Add `recommendation_feedback` table (unique on `user_id, message_id, wine_name`) with RLS in `supabase/schema.sql`
- [X] T002 Add `RecommendationFeedback` type in `js/types.ts`
- [X] T003 Add `wineFeedback` keyed-record state + `lastUserQuery` tracking to `App.tsx`

**Checkpoint**: Data layer and client state ready.

---

## Phase 2: User Story 1 — React to an individual wine (P1)

- [X] T004 [US1] Implement `submitWineFeedback()` with toggle-off-on-repeat-click and switch-directly-on-opposite-click semantics
- [X] T005 [US1] Render per-Verdict-bullet 👍/👎 buttons in `ChatDrawer.tsx`, keyed by `messageId:wineName`
- [X] T006 [US1] Style active/inactive button states from `wineFeedback` prop
- [X] T007 [US1] Guard rendering: no controls shown when a message lacks `recommendedWines` or `messageId`

**Checkpoint**: Independent thumbs per wine work with correct toggle semantics.

---

## Phase 3: User Story 2 — Capture context for future use (P2)

- [X] T008 [US2] Pass `in_cellar` / `cellar_wine_id` from the parsed `WINES_JSON` wine object into the feedback upsert
- [X] T009 [US2] Pass `context_query` (`lastUserQuery`) into the feedback upsert
- [X] T010 [US2] Use `onConflict: 'user_id,message_id,wine_name'` to upsert rather than duplicate on repeat submissions

**Checkpoint**: Every persisted feedback row carries full context for later analysis.

---

## Dependencies & Execution Order

- Phase 1 blocks both user stories.
- US2's fields (T008–T010) are threaded through the same `submitWineFeedback()` call built in US1 (T004) — implemented together, not sequentially staged.
- This entire feature depends on `specs/006-sommelier-chat-recommendations`'s Verdict/`WINES_JSON` parsing already existing.

## Notes

- No task exists for a personalization consumer of this data, or for a feedback-history view — neither is part of the shipped feature (see spec.md Assumptions).
