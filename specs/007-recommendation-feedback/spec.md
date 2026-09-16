# Feature Specification: Per-Wine Recommendation Feedback

**Feature Branch**: `007-recommendation-feedback` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx` (`submitWineFeedback`), `js/components/ChatDrawer.tsx` (thumbs UI), `js/types.ts` (`RecommendationFeedback`), and `supabase/schema.sql` (`recommendation_feedback`), per user request to backfill SpecKit specs for all existing features. This feature is attached to, and depends on, the Verdict rendering documented in `specs/006-sommelier-chat-recommendations/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - React to an individual wine recommendation (Priority: P1)

After receiving a sommelier chat response naming 5 wines, a collector thumbs-up or thumbs-down a specific one of them (not the whole response) to signal whether that particular pick was good.

**Why this priority**: This is the entire feature — capturing per-wine signal is what distinguishes it from a generic "rate this response" mechanism, and it's the only way the schema's stated future-personalization goal (see `schema.sql` comments) could ever work.

**Independent Test**: Send a chat message that produces a recommendation with a Verdict section, click 👍 on one of the listed wines, and confirm that wine's thumbs-up button becomes visually active while the other wines' buttons remain untouched.

**Acceptance Scenarios**:

1. **Given** an assistant message with a parsed Verdict and `recommendedWines`, **When** rendered, **Then** each Verdict bullet shows its own 👍/👎 buttons alongside that specific wine's line — not one control for the whole message.
2. **Given** a wine's feedback buttons, **When** the user clicks 👍, **Then** that button becomes visually active (and 👎, if previously active, becomes inactive) and the feedback is persisted.
3. **Given** a wine's feedback buttons, **When** the user clicks 👎, **Then** the same behavior applies in reverse (👎 active, 👍 inactive).
4. **Given** a wine already marked 👍, **When** the user clicks 👍 again (same choice), **Then** the feedback is removed entirely (toggled off) rather than staying active or flipping to 👎.
5. **Given** a wine already marked 👍, **When** the user clicks 👎 (the other choice), **Then** the feedback switches directly to 👎 in one click (no need to first un-click 👍).
6. **Given** a message with no parsed `recommendedWines` (e.g. a plain conversational reply), **When** rendered, **Then** no feedback controls are shown at all for that message.

---

### User Story 2 - Feedback captures enough context to be useful later (Priority: P2)

Each piece of feedback records not just "liked/disliked" but which wine, whether it was a cellar pick or a suggestion, and what the user originally asked for — so it could plausibly drive future personalization.

**Why this priority**: Raw thumbs counts without context are of limited analytical value; the schema and capture logic were explicitly designed (per `schema.sql` comments) to support future bias-recommendations-toward-liked-styles work, making the "why/what" context part of this feature's actual scope even though the personalization consumer doesn't exist yet.

**Independent Test**: Submit feedback on a cellar-pick wine and on a non-cellar wine from the same response, then inspect the persisted rows and confirm each captures the correct `in_cellar`/`cellar_wine_id`, `wine_name`/`winery`, and the original user query text.

**Acceptance Scenarios**:

1. **Given** feedback is submitted on a wine that was a cellar pick, **When** persisted, **Then** `in_cellar = true` and `cellar_wine_id` is set to that wine's cellar row id (parsed from the `WINES_JSON` block).
2. **Given** feedback is submitted on a wine that was a "worth seeking out" (non-cellar) suggestion, **When** persisted, **Then** `in_cellar = false` and `cellar_wine_id` is null.
3. **Given** feedback is submitted, **When** persisted, **Then** `context_query` is set to the most recent user message text that produced this recommendation (`lastUserQuery`), so the feedback can later be understood in the context of what was actually asked.
4. **Given** a user submits feedback on the same wine within the same message a second time with the same or different choice, **When** persisted, **Then** the system updates the existing row rather than creating a duplicate (one row per user+message+wine).

### Edge Cases

- What happens if the user is not signed in or the message has no `messageId` yet (e.g. the DB insert that would set it hasn't resolved)? `submitWineFeedback` no-ops silently — no feedback UI action is possible without both a session and a persisted message id.
- What happens if the same wine name appears in two different messages? Feedback is keyed by `(user_id, message_id, wine_name)`, so identical wine names in different messages are tracked independently — feedback on one does not affect the other.
- What happens if the feedback delete (on toggle-off) fails server-side? Local UI state has already optimistically removed the active state; no rollback/retry is implemented — the local and server state could diverge silently in this failure case.
- What happens if two wines in the same Verdict share an identical name (rare but possible if the model repeats itself)? The feedback key is `messageId:wine.name`, so they would collide and share one feedback state — not specially handled.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render independent thumbs-up/thumbs-down controls for each individual wine named in a recommendation response's Verdict section, not a single control for the whole message.
- **FR-002**: The system MUST support exactly three states per (message, wine) pair: no feedback, thumbs-up, thumbs-down — clicking the currently-active choice again MUST clear it back to no feedback; clicking the other choice MUST switch directly to it.
- **FR-003**: The system MUST persist feedback with enough context to later analyze it per-wine: the wine name/winery, whether it was a cellar pick, the cellar row id if so, the feedback direction, and the user's original query text for that turn.
- **FR-004**: The system MUST enforce at most one feedback row per (user, message, wine) combination, upserting on repeat submissions rather than accumulating duplicates.
- **FR-005**: The system MUST reflect the current feedback state visually (active/inactive styling) per wine per message, consistent with what has actually been persisted (or optimistically will be).
- **FR-006**: Feedback controls MUST only appear on messages that have both a persisted `messageId` and at least one parsed recommended wine; feedback MUST require an authenticated session.
- **FR-007**: All `recommendation_feedback` rows MUST be scoped to their owning user via RLS (Constitution Principle II), matching the pattern used elsewhere.

### Key Entities

- **RecommendationFeedback** (`recommendation_feedback` table): `id`, `user_id`, `message_id` (→ `recommendation_messages.id`), `wine_name`, `winery`, `in_cellar`, `cellar_wine_id` (nullable → `wines.id`, `ON DELETE SET NULL`), `feedback` (`thumbs_up`|`thumbs_down`), `context_query`, `created_at`. Unique on `(user_id, message_id, wine_name)`.
- Client-side, feedback state is held as `Record<string, 'thumbs_up' | 'thumbs_down'>` keyed by `` `${messageId}:${wineName}` `` in `App.tsx`'s `wineFeedback` state — not a separate persisted type, just the in-memory projection of the same rows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every wine listed in a response's Verdict section has its own independently-clickable feedback control, verified by a 1:1 correspondence between Verdict bullets and feedback buttons.
- **SC-002**: A feedback toggle (up → off, down → off, up → down, down → up) always completes in a single click, never requiring a two-step "unclick then click" sequence.
- **SC-003**: 100% of persisted feedback rows include a non-null `context_query`, `in_cellar`, and (for cellar picks) `cellar_wine_id`, so retrospective analysis never has to work with incomplete rows for feedback submitted through the UI.
- **SC-004**: No duplicate feedback rows are ever created for the same (user, message, wine) — enforced by both the upsert conflict target and the underlying unique constraint.

## Assumptions

- No consumer currently reads `recommendation_feedback` to influence future recommendations — the schema and capture logic exist ahead of that use case (explicitly noted as forward-looking in `schema.sql`'s own comments); this spec documents the capture mechanism only, not personalization itself.
- There is no UI to view a history of one's own past feedback — feedback state is only visible live, attached to the message it was given on, within the current page session.
- Feedback is scoped to the Verdict section of sommelier-chat responses only; there is no equivalent feedback mechanism for the guest wine-pairing feature (`specs/002-guest-wine-pairing/spec.md`), since guest sessions have no authenticated user or persisted message to attach feedback to.
