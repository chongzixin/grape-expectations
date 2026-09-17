# Implementation Plan: AI Sommelier Chat & Wine Pairing Recommendations

**Branch**: `006-sommelier-chat-recommendations` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-sommelier-chat-recommendations/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

`App.sendChat()` builds a large, structured system prompt per request (base persona + full cellar inventory + local cuisine knowledge + a detailed recommendation-rules and output-format block, including the `WINES_JSON` contract) and sends it with the full message history to the shared Claude proxy. `ChatDrawer.tsx` is purely presentational, rendering markdown, splitting out the Verdict section to attach per-wine feedback controls, and handling copy/quick-prompts. Persistence is two lazily-created Supabase tables.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `react-markdown` + `remark-gfm`, `@supabase/supabase-js`, shared `callClaude()`/`parseRecommendedWines()`/`stripWinesJson()` utils

**Storage**: Supabase Postgres — `recommendation_sessions`, `recommendation_messages` (both RLS-scoped to `auth.uid() = user_id`)

**Testing**: None — no automated test suite (Constitution Principle I); the prompt's output structure was iterated on and verified manually against real responses during development

**Target Platform**: Web (desktop + mobile)

**Performance Goals**: `maxTokens: 1800` caps response length/latency; the ~500-word cap in the prompt itself is the primary lever for response speed and readability, not a hard token truncation

**Constraints**: The `WINES_JSON` block's exact format is a hard contract with `parseRecommendedWines()`'s regex (`/<!-- WINES_JSON\n([\s\S]*?)\n-->/`) — any prompt change to this block's shape breaks parsing (Constitution Principle III explicitly calls this out)

**Scale/Scope**: One request = one full cellar snapshot + full conversation history in the prompt; no pagination/summarization of either

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — `recommendation_sessions`/`recommendation_messages` inserts pass `user_id: session.user.id` to satisfy `WITH CHECK`, relying on RLS for actual enforcement (`schema.sql:67-92`); reads are never manually filtered by user id client-side.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: PASS — `sendChat()` uses `callClaude()`; the `WINES_JSON` block format is preserved exactly as the constitution requires, and this plan documents it rather than proposing any change to it.
- **Principle IV (Follow Existing Conventions)**: PASS — plain hooks; `ge-chat-*`/`cm-*` CSS classes; no new state library introduced for chat despite its relative complexity (history, loading, feedback keyed by `messageId:wineName`).
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — `ChatDrawer.tsx` is already extracted as a presentational component; `sendChat()`, the large system-prompt builder, and message persistence remain in `App.tsx`, consistent with the rest of the app's state-in-App.tsx / presentation-in-components split.

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/006-sommelier-chat-recommendations/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                        # sendChat(), system-prompt construction, session/message persistence,
│                                   #   copyMessage(), chat-related state
├── constants.ts                     # SOMMELIER_SYSTEM base persona, DRINKING_STATUS_PRIORITY/DESCRIPTIONS
│                                    #   (used to build the "DRINKING WINDOW PRIORITY" prompt section)
├── localCuisine.ts                   # LOCAL_CUISINE_KNOWLEDGE
├── utils.ts                          # callClaude(), parseRecommendedWines(), stripWinesJson(), useWittyLoader()
├── types.ts                          # ChatMessage, RecommendedWine
└── components/
    └── ChatDrawer.tsx                 # Drawer UI, Verdict-bullet splitting, quick prompts, copy button

supabase/
└── schema.sql                          # recommendation_sessions, recommendation_messages + RLS
```

**Structure Decision**: The recommendation-rules prompt (rules 1–12 in `sendChat()`) is authored inline in `App.tsx` rather than in a separate prompts module — consistent with how `SOMMELIER_SYSTEM` and the guest/enrichment prompts are also authored inline near their call sites elsewhere in the app.

## Key Flows (as built)

1. **Send**: `sendChat(prefill?)` trims input, appends a user `ChatMessage` to local state, opens the drawer, sets loading. If no `chatSessionId` yet, it inserts a `recommendation_sessions` row and stores the returned id; the user message is inserted into `recommendation_messages` (fire-and-forget, not awaited before the AI call).
2. **Prompt assembly**: cellar context is built as one line per active wine (`[id:uuid] Name | Winery | Vintage | Type (Style) | Region | N bottles | Price | Window: from–by [status]`); the system prompt concatenates persona + cellar + `LOCAL_CUISINE_KNOWLEDGE` + the numbered recommendation-rules block (including the literal `WINES_JSON` comment template) + a drinking-window priority list derived from `DRINKING_STATUS_PRIORITY`/`DRINKING_STATUS_DESCRIPTIONS`.
3. **Call**: `callClaude({ system, messages: history, maxTokens: 1800 })` where `history` is the full `chatMessages` array (+ the new user message) reduced to `{role, content}`.
4. **Response handling**: `parseRecommendedWines(txt)` extracts the `WINES_JSON` array; a client-generated `assistantMsgId` (`crypto.randomUUID()`) is used both for the Supabase insert's `id` and the in-memory `ChatMessage.messageId`, per the CLAUDE.md gotcha ensuring `messageId` is always set even if the insert itself fails.
5. **Rendering**: `ChatDrawer` calls `stripWinesJson()` before display, then regex-splits the text into "everything before Verdict" and "Verdict body", further splitting Verdict into bullet lines matched 1:1 by array index against `msg.recommendedWines` to attach thumbs controls per line (see `specs/007-recommendation-feedback/spec.md`).
6. **Copy**: `copyMessage()` strips `**bold**` markers from the already-WINES_JSON-stripped display text and writes to the clipboard via the Clipboard API.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
