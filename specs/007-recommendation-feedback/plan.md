# Implementation Plan: Per-Wine Recommendation Feedback

**Branch**: `007-recommendation-feedback` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-recommendation-feedback/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

Feedback state is a small `Record<string, 'thumbs_up'|'thumbs_down'>` keyed by `messageId:wineName`, held in `App.tsx` and mutated by `submitWineFeedback()`, which upserts (or deletes, on toggle-off) a single `recommendation_feedback` row per (user, message, wine). `ChatDrawer.tsx` renders the buttons per Verdict-bullet, reading the same keyed record for active/inactive styling.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `@supabase/supabase-js` (`upsert`/`delete` with `onConflict`)

**Storage**: Supabase Postgres `recommendation_feedback` table, unique on `(user_id, message_id, wine_name)`, RLS-scoped

**Testing**: None — no automated test suite (Constitution Principle I); toggle behavior verified manually

**Target Platform**: Web (desktop + mobile), inline within the chat drawer from `specs/006-sommelier-chat-recommendations/spec.md`

**Performance Goals**: Feedback writes are fire-and-forget from the UI's perspective (optimistic local state update, then an unawaited-by-the-user async write) so clicking thumbs never blocks the chat UI

**Constraints**: Depends entirely on `specs/006-sommelier-chat-recommendations/spec.md`'s `WINES_JSON` block and Verdict-bullet parsing for its `(messageId, wine)` pairing — this feature cannot exist independently of that contract

**Scale/Scope**: At most 5 feedback controls per assistant message (one per recommended wine), unbounded number of messages/feedback rows over time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — `recommendation_feedback` RLS policies (`schema.sql:119-129`) scope all four operations to `auth.uid() = user_id`; `submitWineFeedback` passes `user_id` only to satisfy `WITH CHECK`, not as its own authorization layer.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: N/A — this feature makes no AI calls itself; it only consumes AI output already fetched by spec 006.
- **Principle IV (Follow Existing Conventions)**: PASS — plain `useState`, no new state library despite the keyed-record pattern being slightly more intricate than most other app state.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — `submitWineFeedback` is a small handler colocated with the rest of the chat logic in `App.tsx`; the rendering is inline within the already-extracted `ChatDrawer.tsx`, not a separate component (justified by its small size and tight coupling to Verdict-bullet layout).

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/007-recommendation-feedback/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                     # wineFeedback state, submitWineFeedback(), lastUserQuery tracking
├── types.ts                     # RecommendationFeedback type
└── components/
    └── ChatDrawer.tsx             # Per-Verdict-bullet 👍/👎 buttons, active-state styling via wineFeedback prop

supabase/
└── schema.sql                    # recommendation_feedback table, unique constraint, RLS
```

**Structure Decision**: No dedicated feedback component — folded directly into `ChatDrawer.tsx`'s Verdict-bullet rendering loop (already documented in spec 006's plan) since the two are inseparable in the UI.

## Key Flows (as built)

1. **Track last query**: `App.tsx` sets `lastUserQuery` to the trimmed input text every time `sendChat` runs, so `context_query` reflects what prompted the recommendation currently being reacted to.
2. **Submit**: `submitWineFeedback(msg, wine, thumbs)` builds `fbKey = \`${msg.messageId}:${wine.name}\``. If `wineFeedback[fbKey] === thumbs` (clicking the already-active choice), it deletes the local key and issues a `DELETE` filtered by `user_id`, `message_id`, `wine_name`. Otherwise it sets the local key to `thumbs` and issues an `UPSERT` with `onConflict: 'user_id,message_id,wine_name'`, carrying `wine.in_cellar`, `wine.cellar_wine_id ?? null`, and `context_query: lastUserQuery`.
3. **Render**: `ChatDrawer` computes `fbKey` the same way per Verdict-bullet/wine pairing and passes `wineFeedback[fbKey] === 'thumbs_up'|'thumbs_down'` to each button's `active` class, calling `submitWineFeedback(msg, wine, 'thumbs_up'|'thumbs_down')` on click.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
