# Feature Specification: AI Sommelier Chat & Wine Pairing Recommendations

**Feature Branch**: `006-sommelier-chat-recommendations` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx` (`sendChat`, prompt construction), `js/components/ChatDrawer.tsx`, `js/utils.ts` (`parseRecommendedWines`, `stripWinesJson`), and `supabase/schema.sql` (`recommendation_sessions`/`recommendation_messages`), per user request to backfill SpecKit specs for all existing features. Per-wine thumbs feedback is a closely related but separately specified capability — see `specs/007-recommendation-feedback/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask for a wine pairing and get cellar-aware recommendations (Priority: P1)

A signed-in collector asks the sommelier chat what to drink with a specific dish or occasion, and gets back a mix of bottles they already own and bottles worth seeking out, each with a clear rationale.

**Why this priority**: This is the core AI feature of the authenticated app — the reason a user would open the chat drawer at all.

**Independent Test**: Open the chat drawer, type a dish-based question (e.g. "light red for zichar tonight"), and confirm the response names exactly 3 cellar wines and 2 non-cellar wines, each with a reason grounded in local-dish flavour cues.

**Acceptance Scenarios**:

1. **Given** the chat drawer is closed, **When** the user sends a message (via typed input, Enter key, or a quick-prompt chip), **Then** the drawer opens automatically, the user's message appears immediately, and a loading indicator (animated dots + rotating witty message) shows while the response is generated.
2. **Given** a cellar-aware request, **When** the AI responds, **Then** the response recommends exactly 3 bottles from the user's cellar (each named specifically, with price and drinking-window status) and exactly 2 bottles not in the cellar, of a different varietal than any cellar pick, each with an SGD price estimate.
3. **Given** the response, **When** rendered, **Then** it is structured as: a 1–2 sentence intro naming specific local dish characteristics, a "From your cellar:" bulleted section, a "Worth seeking out:" bulleted section, a closing follow-up question, and a "Verdict" section summarizing all 5 picks in one line each — with cellar and non-cellar wines never mixed within a section.
4. **Given** the user's cellar inventory, **When** included in the prompt, **Then** the model is given each active wine's id, name, winery, vintage, type/style, region, inventory count, price, and drinking-window status/range so recommendations can reference real stock and urgency.
5. **Given** the response text, **When** displayed, **Then** the internal `WINES_JSON` bookkeeping comment is never shown to the user (stripped before render) while still being used internally to power the Verdict's per-wine thumbs feedback (spec 007).

---

### User Story 2 - Continue a conversation with follow-up context (Priority: P2)

A collector refines their request in a follow-up message (e.g. "actually make it something sparkling") without having to restate everything from scratch.

**Why this priority**: Natural chat behavior; without conversation history, every message would need to be a fully standalone request, which is a worse experience for a "sommelier conversation" framing.

**Independent Test**: Send an initial pairing request, then send a short follow-up refining it, and confirm the response accounts for the prior turn's context.

**Acceptance Scenarios**:

1. **Given** prior messages exist in the current chat, **When** a new message is sent, **Then** the full message history (user and assistant turns) is sent to the model as conversation context, not just the latest message.
2. **Given** an ongoing chat, **When** each user and assistant message is sent, **Then** it is persisted to `recommendation_messages` under a single `recommendation_sessions` row created lazily on the first message of that session.
3. **Given** the chat drawer is reopened later in the same page load, **When** viewed, **Then** previously sent messages in this session remain visible (in-memory state; see Assumptions for reload behavior).

---

### User Story 3 - Get quick-start prompts for common pairing scenarios (Priority: P3)

A collector unsure what to ask uses a suggested prompt instead of composing their own question.

**Why this priority**: Reduces friction/blank-page problem for first-time chat users; not required for the chat to function since free-text input always works.

**Independent Test**: Open the chat drawer with no messages yet, confirm quick-prompt chips are shown, and click one to confirm it sends immediately as if typed.

**Acceptance Scenarios**:

1. **Given** an empty chat (no messages yet), **When** the drawer is open, **Then** a set of example prompts referencing specific local dishes/occasions is shown alongside an inviting header.
2. **Given** the quick-prompt chips, **When** one is clicked, **Then** it is sent immediately using the same path as manually typed input (fills the input and sends), and the chips disappear once the conversation has started.

---

### User Story 4 - Copy a recommendation to share elsewhere (Priority: P3)

A collector copies the sommelier's response text to paste into a message to a friend or a note.

**Why this priority**: A convenience layered on the core chat, not required for the chat's primary value.

**Independent Test**: Send a message, receive a response, click the copy icon, and confirm the response text (markdown bold markers stripped) is placed on the clipboard with a brief "Copied!" confirmation.

**Acceptance Scenarios**:

1. **Given** an assistant message is shown, **When** the user clicks its copy icon, **Then** the displayed text (WINES_JSON block already stripped, `**bold**` markers stripped) is copied to the clipboard.
2. **Given** the copy succeeds, **When** it completes, **Then** the icon shows "Copied!" for 2 seconds before reverting.

### Edge Cases

- What happens if the chat request fails (network/API error)? A generic "Apologies, I encountered an error. Please try again." assistant message is appended to the conversation, and the loading state clears — the conversation is not lost or reset.
- What happens if the model's response doesn't include a parseable `WINES_JSON` block (e.g. a purely conversational follow-up with no new recommendations)? `parseRecommendedWines()` returns an empty array; the message renders as plain markdown with no per-wine thumbs UI, and no Verdict-specific rendering is attempted.
- What happens if the user's cellar is empty when they ask for a pairing? The cellar context sent to the model is an empty string; the model is still instructed to recommend 3 "from your cellar" picks, which — given no real stock — would not be grounded in actual inventory (an accepted, low-frequency edge case since a near-empty cellar is an early-adoption state, not steady-state usage).
- What happens to the chat if the user signs out mid-conversation? All chat state (`chatMessages`, `chatSessionId`) is cleared as part of the `SIGNED_OUT` handling (see `specs/001-authentication/spec.md`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a signed-in user ask free-text wine-pairing questions via a persistent chat affordance (floating action button when closed, drawer when open).
- **FR-002**: Each pairing response MUST recommend exactly 3 wines from the user's active cellar and exactly 2 wines not in the cellar (of a differing varietal from the cellar picks), each with a stated rationale grounded in Singapore/SEA cuisine-specific flavour characteristics (not generic "Asian food" language) and SGD pricing.
- **FR-003**: The system MUST inject the user's full active cellar inventory (id, name, winery, vintage, type, style, region, inventory count, price, drinking-window status) into the model's context for every chat request, so recommendations can reference real stock and urgency (integrating with `specs/005-drinking-window-tracking/spec.md`'s status/priority model).
- **FR-004**: The system MUST inject Singapore/SEA local-cuisine pairing knowledge into the model's context for every chat request, per the same knowledge base used elsewhere in the app (`localCuisine.ts`).
- **FR-005**: The system MUST send the full prior conversation history (not just the latest message) with every new chat request so responses account for context.
- **FR-006**: The system MUST persist every user and assistant message to the database under a per-conversation session row, creating that session row lazily on the first message.
- **FR-007**: Every recommendation response MUST end with a "Verdict" section (plain bullets, one line per recommended wine, never a markdown table) followed by a hidden `WINES_JSON` metadata block naming each recommended wine, whether it's a cellar pick, and its cellar row id if so; this block MUST be stripped from what the user sees but MUST remain in the persisted message content and MUST be parsed client-side to drive per-wine feedback (spec 007).
- **FR-008**: The response MUST be capped at roughly 500 words and MUST use a fixed structure (intro, "From your cellar:", "Worth seeking out:", follow-up question, Verdict) so the UI can reliably parse out the Verdict bullets for inline feedback controls.
- **FR-009**: The system MUST offer quick-start example prompts when a chat has no messages yet, sending on click exactly as if typed and submitted.
- **FR-010**: The system MUST let the user copy any assistant response's displayed text to the clipboard.
- **FR-011**: All chat/recommendation calls MUST go through the shared serverless Claude proxy (Constitution Principle III); the `WINES_JSON` block's format MUST NOT be removed or reformatted, since client-side parsing depends on its exact shape (Constitution Principle III, explicit carve-out).
- **FR-012**: `recommendation_sessions` and `recommendation_messages` rows MUST be scoped to their owning user via RLS (Constitution Principle II), matching the pattern used for `wines`.

### Key Entities

- **RecommendationSession** (`recommendation_sessions` table): one row per chat conversation — `id`, `user_id`, `created_at`. Created lazily on first message, held in `chatSessionId` client state for the lifetime of the open chat.
- **RecommendationMessage** (`recommendation_messages` table): one row per turn — `id` (client-generated via `crypto.randomUUID()` before insert — see CLAUDE.md Gotchas for why), `session_id`, `user_id`, `role` (`user`|`assistant`), `content`, `created_at`.
- **ChatMessage** (client-only type, `js/types.ts`): `{ role, content, messageId?, recommendedWines? }` — the in-memory representation driving the UI; `recommendedWines` is the parsed `WINES_JSON` payload for assistant messages.
- **RecommendedWine** (parsed, not stored separately): `{ name, winery, in_cellar, cellar_wine_id }` — one per wine named in a response's Verdict/WINES_JSON block.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sending a dish-based pairing question receives a response naming exactly 5 wines (3 cellar + 2 non-cellar) with rationale, in the large majority of well-formed requests.
- **SC-002**: 100% of assistant responses persisted to the database retain the `WINES_JSON` block verbatim, even though it is never shown to the user.
- **SC-003**: A follow-up message in the same session reflects awareness of the prior turn (verified qualitatively — the model is given full history, not evaluated by an automated metric here since no test suite exists).
- **SC-004**: Chat drawer open → first response for a typical request completes without the user needing to leave the page or lose their place in the cellar view.

## Assumptions

- Chat history is not reloaded from the database on a fresh page load — `chatMessages` starts empty each time the app mounts, even though every message was persisted; there is no "resume my last conversation" UI reading from `recommendation_sessions`/`recommendation_messages` today (those tables exist partly for this future use and partly, per `schema.sql`'s comments, for future ML/personalization use).
- The model is trusted to self-enforce the "exactly 3 cellar + 2 non-cellar, different varietal" structure via prompt instructions; there is no server-side or client-side validation that rejects a malformed count and retries.
- The Verdict-bullet-to-WINES_JSON-entry mapping in `ChatDrawer.tsx` assumes both lists are the same length and in the same order — a response where the model's Verdict bullet count and `WINES_JSON` array length diverge would misalign feedback controls (accepted risk, not defended against defensively).
- "Cellar-aware" means the full active cellar is sent on every request regardless of size; there is no summarization/truncation for very large cellars today.
