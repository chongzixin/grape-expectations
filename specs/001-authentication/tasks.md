---

description: "Backfilled task record for the Authentication feature — documents work already completed, not a forward plan"
---

# Tasks: Authentication

**Input**: Design documents from `specs/001-authentication/`

**Status**: All tasks below describe work already implemented and shipped. This file is a retroactive record (per the SpecKit backfill request), not a plan for new work. No tests exist for any task (Constitution Principle I — no test suite); verification was manual.

## Phase 1: Foundational

- [X] T001 Add `profiles` table with RLS policies in `supabase/schema.sql`
- [X] T002 Add `handle_new_user()` trigger + `on_auth_user_created` to auto-populate `profiles` from OAuth metadata in `supabase/schema.sql`
- [X] T003 Create singleton Supabase client in `js/supabaseClient.ts`
- [X] T004 Add `Session`/`UserProfile` types in `js/types.ts`

**Checkpoint**: Backend + client plumbing ready for sign-in UI.

---

## Phase 2: User Story 1 — Sign in with Google (P1)

- [X] T005 [US1] Build `AuthPage.tsx` Google OAuth button with branded logo/layout
- [X] T006 [US1] Wire `handleGoogle` to `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: window.location.origin })`
- [X] T007 [US1] Surface OAuth errors inline on the auth page

**Checkpoint**: Google sign-in works end-to-end.

---

## Phase 3: User Story 2 — Sign in with Magic Link (P2)

- [X] T008 [US2] Build Magic Link email form with loading/disabled state in `AuthPage.tsx`
- [X] T009 [US2] Wire `handleMagicLink` to `supabase.auth.signInWithOtp(...)`
- [X] T010 [US2] Add "check your email" confirmation view (`sent` state) with "use a different email" reset

**Checkpoint**: Magic Link sign-in works end-to-end.

---

## Phase 4: User Story 3 — Session persistence (P1)

- [X] T011 [US3] Implement combined `Promise.all(getSession(), wines fetch)` on initial load in `App.tsx`
- [X] T012 [US3] Add `sessionReady` / `loading` gated loading screens to avoid auth-page flash
- [X] T013 [US3] Subscribe to `supabase.auth.onAuthStateChange`; re-fetch wines + profile on `SIGNED_IN`
- [X] T014 [US3] Clear `wines`, `profile`, `chatMessages`, `chatSessionId`, `wineFeedback` on `SIGNED_OUT`

**Checkpoint**: Session persists across reloads; sign-out fully clears state.

---

## Phase 5: User Story 4 — Sign out (P2)

- [X] T015 [US4] Add avatar-click / "Sign out" button to desktop header (`Header.tsx`)
- [X] T016 [US4] Add "Sign out" item to mobile hamburger menu (`Header.tsx`)
- [X] T017 [US4] Wire both to `App.handleSignOut` → `supabase.auth.signOut()`

**Checkpoint**: Sign-out reachable from both desktop and mobile.

---

## Phase 6: User Story 5 — Guest entry point (P3)

- [X] T018 [US5] Add "Try a recommendation without signing up →" link to `AuthPage.tsx`, gated on `onGuestMode` prop
- [X] T019 [US5] Add `guestMode` boolean state in `App.tsx` to render `GuestPage` instead of `AuthPage`
- [X] T020 [US5] Add "Sign in" CTAs inside `GuestPage.tsx` that call `onSignIn` to return to `AuthPage`

**Checkpoint**: Full guest → sign-in loop works without creating a session.

---

## Dependencies & Execution Order

- Phase 1 (Foundational) blocks all user stories.
- US1–US5 were implemented together as a single initial auth surface rather than incrementally, but remain independently testable per the Independent Test in each spec.md story.

## Notes

- No `[P]`-parallel markers are meaningful here in retrospect since this was built as one cohesive pass, not a staffed multi-track effort.
- Future work in this area (e.g. profile editing, password-based fallback) is out of scope per spec.md Assumptions and would warrant a new feature spec, not an amendment to this one.
