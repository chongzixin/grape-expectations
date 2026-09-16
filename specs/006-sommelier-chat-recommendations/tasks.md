---

description: "Backfilled task record for the AI Sommelier Chat & Wine Pairing Recommendations feature — documents work already completed, not a forward plan"
---

# Tasks: AI Sommelier Chat & Wine Pairing Recommendations

**Input**: Design documents from `specs/006-sommelier-chat-recommendations/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — the prompt/output structure was iterated on and verified manually.

## Phase 1: Foundational

- [X] T001 Add `recommendation_sessions` + `recommendation_messages` tables with RLS in `supabase/schema.sql`
- [X] T002 Add `ChatMessage`/`RecommendedWine` types in `js/types.ts`
- [X] T003 Implement `parseRecommendedWines()` / `stripWinesJson()` in `js/utils.ts`
- [X] T004 Add chat-related state (`chatOpen`, `chatMessages`, `chatSessionId`, etc.) to `App.tsx`

**Checkpoint**: Persistence + parsing plumbing ready.

---

## Phase 2: User Story 1 — Cellar-aware pairing recommendations (P1)

- [X] T005 [US1] Build cellar-context line formatter (id/name/winery/vintage/type/region/inventory/price/window) in `sendChat()`
- [X] T006 [US1] Author the recommendation-rules system prompt (3 cellar + 2 non-cellar, WSET rationale, structured sections, `WINES_JSON` contract, 500-word cap)
- [X] T007 [US1] Build `ChatDrawer.tsx` message list, floating action button, and open/close drawer UI
- [X] T008 [US1] Implement Verdict-section splitting + per-line rendering in `ChatDrawer.tsx`
- [X] T009 [US1] Add loading state (animated dots + `useWittyLoader` message) while awaiting a response
- [X] T010 [US1] Add generic error-fallback assistant message on request failure

**Checkpoint**: A dish-based question returns a correctly-structured 5-wine recommendation.

---

## Phase 3: User Story 2 — Multi-turn conversation with persistence (P2)

- [X] T011 [US2] Implement lazy `recommendation_sessions` row creation on first message of a chat
- [X] T012 [US2] Persist every user and assistant message to `recommendation_messages`, using a client-generated `id` for assistant messages (`crypto.randomUUID()`, per CLAUDE.md gotcha)
- [X] T013 [US2] Send full `chatMessages` history (not just latest message) on every request

**Checkpoint**: Follow-up messages carry prior context and every turn is durably persisted.

---

## Phase 4: User Story 3 — Quick-start prompts (P3)

- [X] T014 [US3] Add `QUICK_PROMPTS` chip list shown only when `chatMessages` is empty
- [X] T015 [US3] Wire chip click to fill input and send immediately via the same `sendChat(prefill)` path

**Checkpoint**: A new user can start a conversation with one click.

---

## Phase 5: User Story 4 — Copy a response (P3)

- [X] T016 [US4] Implement `copyMessage()` (strip `**bold**`, write to clipboard)
- [X] T017 [US4] Add copy icon with 2-second "Copied!" confirmation state to each assistant message

**Checkpoint**: Any response can be copied for sharing outside the app.

---

## Dependencies & Execution Order

- Phase 1 blocks all user stories.
- US1 is the core path all others build on; US2 (persistence/history) was built alongside it rather than after, since both draw from the same `sendChat()` call.
- US3 and US4 are independent additions layered on top of US1's message rendering.
- Per-wine thumbs feedback referenced in US1's Verdict rendering is a separate feature — see `specs/007-recommendation-feedback/tasks.md`.

## Notes

- No task exists for "resume a past conversation on reload" — not part of the shipped feature (see spec.md Assumptions).
