# Feature Specification: Guest Wine Pairing

**Feature Branch**: `002-guest-wine-pairing` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/components/GuestPage.tsx` and `js/AuthPage.tsx`, per user request to backfill SpecKit specs for all existing features.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get a wine pairing for tonight's dish without an account (Priority: P1)

A prospective user who has not signed up types in what they're eating and instantly gets a wine pairing suggestion, with no account creation required.

**Why this priority**: This is the entire point of the feature — a zero-friction taste of the product's core value (Singapore-cuisine-aware wine pairing) to drive sign-up conversion.

**Independent Test**: From the guest landing page, type a dish name (or tap a quick-dish chip), submit, and confirm a formatted pairing recommendation appears without ever being asked to sign in.

**Acceptance Scenarios**:

1. **Given** a visitor on the guest page, **When** they type a dish name and submit, **Then** the app shows a loading state (spinner + rotating witty message) and then renders a markdown-formatted response naming 2–3 wine varietals with WSET-style rationale and exactly 3 specific wines available in Singapore (each with an SGD price estimate and a named Singapore retailer).
2. **Given** the guest page's quick-dish chips (e.g. "Laksa Lemak", "Char Kway Teow"), **When** a visitor taps one, **Then** the same pairing flow runs immediately using that dish name, without needing to also press submit.
3. **Given** the response has rendered, **When** the page updates, **Then** the view scrolls smoothly to bring the result into view.
4. **Given** the pairing request fails (network/API error), **When** the error occurs, **Then** a plain "Sorry, something went wrong. Please try again." message is shown in place of a result — no unhandled crash.

---

### User Story 2 - Convert from guest to signed-in user (Priority: P2)

Having seen a useful pairing, the visitor decides to create a full account to manage their own cellar and get personalized recommendations.

**Why this priority**: Conversion is the business reason this feature exists; without a clear path back to sign-in, the guest experience is a dead end.

**Independent Test**: From any point in the guest page (top CTA bar, or the CTA below a completed result), click a "Sign in" call-to-action and confirm it returns to the standard auth page.

**Acceptance Scenarios**:

1. **Given** a visitor on the guest page (before submitting anything), **When** they click "Sign in free →" in the top CTA bar, **Then** the app returns to the standard auth page (Google OAuth / Magic Link).
2. **Given** a visitor who has just received a pairing result, **When** they click "Sign in to manage your cellar & get personalised pairings →" below the result, **Then** the app returns to the standard auth page.

### Edge Cases

- What happens when the visitor submits an empty or whitespace-only dish name? The submit button is disabled and the request is not sent (`handleSubmit` also no-ops on empty trimmed input as a second guard).
- What happens if the visitor submits again while a request is already loading? A second submit is a no-op (`if (!d || loading) return`) — no duplicate/overlapping requests.
- What happens if the AI names a wine or retailer that's inaccurate? Out of scope for this feature to validate — the guest prompt asks the model to only reference real, known Singapore retailers, but no server-side verification exists.
- No conversation memory: each guest submission is a single independent request/response — there is no multi-turn guest chat, unlike the authenticated sommelier chat (spec 006).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let an unauthenticated visitor request a wine pairing for a single named dish without creating an account or a Supabase session.
- **FR-002**: The system MUST provide a set of quick-select example dishes (Singapore/regional hawker and zi char staples) that trigger the same flow as manual text entry.
- **FR-003**: Each pairing response MUST name 2–3 wine varietals with a WSET-style rationale (acidity/tannin/sweetness vs. the dish's specific flavour compounds, using named local flavour cues, not generic "Asian food" language) and exactly 3 concrete, purchasable-in-Singapore wine suggestions, each with an SGD price estimate and a named Singapore retailer.
- **FR-004**: The response MUST be capped at roughly 200 words and rendered as formatted markdown (bold wine names, no extra headers).
- **FR-005**: The system MUST show a loading indicator with rotating "witty" messages while the AI request is in flight, and MUST prevent duplicate concurrent submissions for the same request.
- **FR-006**: The system MUST surface a user-friendly fallback message if the pairing request fails, rather than leaving the UI in a stuck loading state or throwing an unhandled error.
- **FR-007**: The guest page MUST provide at least one visible path back to standard sign-in at all times: before any result (top CTA bar) and after a result is shown (result CTA).
- **FR-008**: The guest experience MUST NOT read or write any per-user data (no cellar, no chat history, no feedback) — it is entirely stateless from request to request client-side, and makes no Supabase calls.
- **FR-009**: The guest pairing request MUST go through the same serverless Claude proxy as all other AI calls (Constitution Principle III) — no direct client-to-Anthropic call.

### Key Entities

- No persisted entities — this feature is intentionally stateless. The only "entity" is the ephemeral in-memory `{ dish, result }` pair held in component state for the duration of one visit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from landing on the guest page to seeing a wine pairing recommendation in under 15 seconds of interaction time (excluding AI response latency).
- **SC-002**: 100% of guest pairing responses list exactly 3 Singapore-purchasable wine suggestions with a retailer named for each.
- **SC-003**: Every screen state of the guest flow (empty, loading, result, error) offers a visible, one-click path to standard sign-in.
- **SC-004**: No network request in the guest flow touches Supabase — verified by the guest flow's code path making zero `supabase.*` calls.

## Assumptions

- The list of six quick-dish chips (Teochew Suckling Pig, Mutton Biryani, Laksa Lemak, Char Kway Teow, Beef Rendang, Hainanese Chicken Rice) is a fixed, hand-curated set rather than dynamically generated; refreshing/rotating it is out of scope.
- The named Singapore retailers (Cold Storage, RedMart, Vinothèque, 1855 The Wine Bar, Benchmark Wines, Bottles & Bottles, The Fine Wine Experience) are illustrative examples supplied to the model, not a verified/maintained retailer database or affiliate integration.
- Rate limiting / abuse prevention for the unauthenticated endpoint is not implemented and is assumed to be an accepted risk at current traffic levels, not a requirement of this feature.
- The guest page is reached only via the auth page's "Try a recommendation" link and has no direct/bookmarkable URL of its own (it's a client-side render-mode toggle in `App.tsx`, not a route).
