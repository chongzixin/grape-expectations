---

description: "Backfilled task record for the Guest Wine Pairing feature — documents work already completed, not a forward plan"
---

# Tasks: Guest Wine Pairing

**Input**: Design documents from `specs/002-guest-wine-pairing/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — verification was manual.

## Phase 1: Foundational

- [X] T001 Add `guestMode` state + signed-out render branching in `App.tsx`
- [X] T002 Add "Try a recommendation without signing up →" entry link to `AuthPage.tsx` (via `onGuestMode` prop)

**Checkpoint**: Entry point into guest mode exists.

---

## Phase 2: User Story 1 — Get a pairing without an account (P1)

- [X] T003 [US1] Build `GuestPage.tsx` layout: hero, dish input form, quick-dish chips
- [X] T004 [US1] Define `GUEST_SYSTEM` prompt (varietal rationale + exactly 3 SG-purchasable wines w/ retailer, ~200-word cap) in `GuestPage.tsx`
- [X] T005 [US1] Wire `handleSubmit` to `callClaude()` with empty/duplicate-submit guards
- [X] T006 [US1] Add loading state with `useWittyLoader` rotating messages
- [X] T007 [US1] Render markdown result with gold-accent `strong`/link styling via `ReactMarkdown`
- [X] T008 [US1] Auto-scroll result into view on completion
- [X] T009 [US1] Add fallback error message for failed requests

**Checkpoint**: A guest can submit a dish and see a formatted pairing recommendation end to end.

---

## Phase 3: User Story 2 — Convert to sign-in (P2)

- [X] T010 [US2] Add top CTA bar "Sign in free →" calling `onSignIn`
- [X] T011 [US2] Add post-result CTA "Sign in to manage your cellar…" calling `onSignIn`
- [X] T012 [US2] Wire `onSignIn` in `App.tsx` to reset `guestMode` to `false`, returning to `AuthPage`

**Checkpoint**: Guest can return to sign-in from any state of the flow.

---

## Dependencies & Execution Order

- Phase 1 blocks Phases 2–3.
- Phases 2 and 3 were built together as one pass; no cross-story dependency exists (US2's CTAs are static links independent of US1's request/response cycle).

## Notes

- No entities/migrations were needed for this feature — it is entirely stateless (see spec.md Key Entities).
