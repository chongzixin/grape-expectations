# Implementation Plan: Guest Wine Pairing

**Branch**: `002-guest-wine-pairing` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-guest-wine-pairing/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

A single self-contained component (`GuestPage.tsx`) renders instead of `AuthPage` when `App.tsx`'s `guestMode` flag is set. It owns its own `dish`/`result`/`loading` state and calls the shared `callClaude()` proxy helper with a guest-specific system prompt (`GUEST_SYSTEM`, built from `SOMMELIER_SYSTEM` + `LOCAL_CUISINE_KNOWLEDGE` + guest-only rules). No Supabase calls are made anywhere in this component.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `react-markdown` + `remark-gfm` (response rendering), shared `callClaude`/`useWittyLoader` utils from `js/utils.ts`

**Storage**: N/A — stateless, nothing persisted

**Testing**: None — no automated test suite (Constitution Principle I); verified manually

**Target Platform**: Web (desktop + mobile), served via Netlify

**Project Type**: Single-page web app; this feature is a pure frontend + serverless-proxy round trip, no new backend endpoint

**Performance Goals**: Perceived responsiveness via immediate loading state + rotating status messages (`useWittyLoader`) rather than a bare spinner, since Claude latency (1-3s typical) is the dominant cost

**Constraints**: Response length capped at ~200 words (`maxTokens: 500` at the proxy call) to keep the guest experience fast and skimmable

**Scale/Scope**: Single screen, single interaction pattern (dish in → pairing out); no pagination, no history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: N/A — no database access occurs in this feature at all.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: PASS — `GuestPage.tsx` calls `callClaude()` from `js/utils.ts`, which posts to `/.netlify/functions/claude`; no direct Anthropic SDK usage in the browser.
- **Principle IV (Follow Existing Conventions)**: PASS — plain `useState`/`useRef`/`useEffect`, `ge-guest-*` CSS class prefix consistent with the `ge-` convention.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — this is already a fully extracted component (`js/components/GuestPage.tsx`), toggled by a single boolean owned in `App.tsx`.

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-guest-wine-pairing/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                    # `guestMode` state; renders GuestPage vs AuthPage when signed out
├── AuthPage.tsx                 # Entry point link into guest mode ("Try a recommendation…")
├── constants.ts                 # SOMMELIER_SYSTEM base persona string, reused here
├── localCuisine.ts               # LOCAL_CUISINE_KNOWLEDGE, reused here
├── utils.ts                      # callClaude(), useWittyLoader()
└── components/
    └── GuestPage.tsx              # This feature's entire implementation
```

**Structure Decision**: Single-component feature; no further decomposition needed given its scope (one form, one result view).

## Key Flow (as built)

1. `AuthPage` renders a "Try a recommendation without signing up →" link when given an `onGuestMode` prop; clicking it flips `App.tsx`'s `guestMode` state to `true`.
2. `App.tsx`'s signed-out render branch checks `guestMode` first and renders `<GuestPage onSignIn={() => setGuestMode(false)} />` instead of `<AuthPage />`.
3. `GuestPage` builds `GUEST_SYSTEM` once at module scope by concatenating `SOMMELIER_SYSTEM`, `LOCAL_CUISINE_KNOWLEDGE`, and a guest-specific rules block (varietal rationale, exactly 3 SG-purchasable wines w/ retailer, ~200-word cap, markdown format).
4. On submit (form submit or quick-dish chip click), `handleSubmit(dishName)` guards against empty/duplicate-in-flight requests, then calls `callClaude({ system: GUEST_SYSTEM, messages: [{ role: 'user', content: \`What wine pairs well with ${d}?\` }], maxTokens: 500 })`.
5. Result is rendered via `ReactMarkdown` with custom `strong`/`a` renderers matching the app's gold-accent styling; a `useEffect` scrolls the result into view once it lands.
6. Both `onSignIn` call sites (top bar, post-result CTA) call the same prop, returning control to `App.tsx` which flips `guestMode` back to `false`, re-rendering `AuthPage`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
