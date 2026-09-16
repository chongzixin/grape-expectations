# Implementation Plan: Authentication

**Branch**: `001-authentication` (backfilled; shipped directly on `main`, no feature branch was used) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-authentication/spec.md`

**Note**: This plan is a retroactive record of the architecture actually shipped, written by reading the implementation rather than designing new work. Sections that a forward-looking plan would leave as open research questions are instead filled in with what was actually decided/built.

## Summary

Authentication is delegated entirely to Supabase Auth: Google OAuth and email Magic Link as the two sign-in methods, with `js/AuthPage.tsx` as the presentation layer and `js/App.tsx`'s top-level `useEffect` as the session-resolution/subscription logic. Authorization for all data access is enforced by Postgres RLS policies (`supabase/schema.sql`), not by application code.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `@supabase/supabase-js` (Auth client + Postgres client), React hooks (no state library)

**Storage**: Supabase Postgres — `auth.users` (managed by Supabase Auth), `profiles` (app-owned, trigger-populated)

**Testing**: None — no automated test suite exists for this project (Constitution Principle I). Verified manually via Netlify PR branch-deploy previews.

**Target Platform**: Web (desktop + mobile browsers), served via Netlify

**Project Type**: Single-page web app (Vite + Netlify Functions backend, no separate frontend/backend repos)

**Performance Goals**: Session resolution + first cellar fetch complete in parallel on load (`Promise.all`) rather than sequentially, to minimize time-to-interactive.

**Constraints**: No password storage/handling in the app at all (delegated to Supabase Auth / Google). No custom session-refresh logic — relies on `@supabase/supabase-js` defaults.

**Scale/Scope**: Single-tenant-per-row multi-tenant app (each row user-scoped via RLS); no admin/impersonation surface.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — `profiles` RLS policies (`schema.sql:17-21`) restrict `SELECT`/`UPDATE` to `auth.uid() = id`; no client-side user-id filtering is used anywhere in `App.tsx`.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: N/A — this feature makes no Claude/Anthropic calls.
- **Principle IV (Follow Existing Conventions)**: PASS — plain `useState`/`useEffect`/`useRef` only; `AuthPage.tsx` uses inline styles rather than the `ge-` CSS system for its own layout (a pre-existing, accepted deviation — see Complexity Tracking) while its "Try a recommendation" link and the rest of the app follow `ge-` conventions.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — auth state and the session-resolution effect live in `App.tsx`; `AuthPage.tsx` and `GuestPage.tsx` are already extracted, matching the "extract when it's a clearly separate concern" spirit even though the broader component-extraction priority is still in progress for other areas.

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-authentication/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Backfilled task record
```

### Source Code (repository root)

```text
js/
├── App.tsx              # Session state, auth subscription (useEffect), sign-out handler, auth-gated render branch
├── AuthPage.tsx          # Google OAuth button, Magic Link form, "try as guest" entry point
├── supabaseClient.ts      # Singleton Supabase client (imported everywhere)
└── components/
    └── GuestPage.tsx      # Landing point when guest mode is chosen (see spec 002)

supabase/
└── schema.sql             # profiles table + RLS policies + handle_new_user() trigger
```

**Structure Decision**: No dedicated `auth/` module exists — this is intentional for the app's size (Constitution Principle V): auth state is a handful of `useState` hooks colocated with the rest of top-level app state in `App.tsx`, with only the two presentational auth screens (`AuthPage`, `GuestPage`) extracted as components.

## Key Flows (as built)

1. **Initial load**: `App.tsx` fires `Promise.all([supabase.auth.getSession(), supabase.from('wines').select('*')])`. If a session exists, it also fetches `profiles` for that user. `sessionReady` gates rendering between the branded loading screen and the auth-vs-app decision; `loading` separately gates the cellar-specific "Decanting your cellar..." screen.
2. **Auth state subscription**: `supabase.auth.onAuthStateChange` listens for `SIGNED_IN` (re-fetches wines + profile) and `SIGNED_OUT` (clears `wines`, `profile`, `chatMessages`, `chatSessionId`, `wineFeedback`).
3. **Google OAuth**: `AuthPage.handleGoogle` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
4. **Magic Link**: `AuthPage.handleMagicLink` calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })`, then shows a "check your email" confirmation state (`sent` local state).
5. **Sign-out**: `App.handleSignOut` calls `supabase.auth.signOut()`; the `SIGNED_OUT` branch of the subscription above does the actual state cleanup.
6. **Guest mode**: a purely client-side `guestMode` boolean in `App.tsx` (no Supabase interaction) toggles rendering `GuestPage` instead of `AuthPage` when signed out.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `AuthPage.tsx` uses inline `style={{...}}` instead of `ge-*` CSS classes | Pre-existing implementation choice for this single full-page, one-off layout | N/A — flagged here for visibility, not proposing a change; a future touch-up could migrate it to `ge-*` classes for consistency but was not required to ship the feature |
