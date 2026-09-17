# Feature Specification: Authentication

**Feature Branch**: `001-authentication` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx`, `js/AuthPage.tsx`, `js/supabaseClient.ts`, and `supabase/schema.sql`, per user request to backfill SpecKit specs for all existing features.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in with Google (Priority: P1)

A wine collector visiting the app for the first time signs in with their existing Google account in one click, without creating a new password.

**Why this priority**: Google OAuth is the fastest path to a working cellar and is the first option shown; it removes the biggest signup-friction barrier.

**Independent Test**: From the signed-out landing page, click "Continue with Google", complete the Google consent screen, and land inside the app with an empty cellar ready to populate.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on the auth page, **When** they click "Continue with Google", **Then** they are redirected to Google's OAuth consent screen and, on approval, are redirected back to the app origin and land inside the authenticated app.
2. **Given** a returning user who previously signed in with Google, **When** they click "Continue with Google" again, **Then** they are signed in without re-entering credentials (browser/Google session permitting).
3. **Given** the OAuth call fails (e.g. network error), **When** the error is returned, **Then** the auth page displays the error message inline and the user remains on the auth page.

---

### User Story 2 - Sign in with Magic Link (Priority: P2)

A collector without (or who prefers not to use) a Google account signs in by email, using a passwordless one-time link.

**Why this priority**: Provides an account-creation path independent of a Google account; secondary to OAuth because it requires a context switch to email.

**Independent Test**: Enter an email address, submit, confirm the "check your email" state appears, then follow the emailed link to land inside the authenticated app.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on the auth page, **When** they enter a valid email and submit the Magic Link form, **Then** the button shows a "Sending…" state, a one-time sign-in email is dispatched to that address, and the page switches to a "Check your email" confirmation view naming the address.
2. **Given** the confirmation view is showing, **When** the user clicks "Use a different email", **Then** the form resets to the empty email input.
3. **Given** the magic-link request fails (e.g. invalid email rejected server-side), **When** the error is returned, **Then** the inline error message is shown and the form remains editable (does not switch to the confirmation view).
4. **Given** a user clicks a valid magic link from their email client, **When** the link is opened, **Then** they land inside the authenticated app with an active session.

---

### User Story 3 - Session persistence across visits (Priority: P1)

A signed-in user closes the browser tab and returns later (or reloads the page); they remain signed in without re-authenticating.

**Why this priority**: A cellar-management app used repeatedly (adding bottles, checking pairings) is unusable if every visit demands a fresh sign-in.

**Independent Test**: Sign in, close and reopen the browser tab to the app URL, and confirm the cellar loads directly without showing the auth page.

**Acceptance Scenarios**:

1. **Given** a previously-authenticated browser, **When** the app loads, **Then** it shows a branded loading screen while resolving the existing session, then renders the authenticated app directly (no auth page flash) if a valid session is found.
2. **Given** the resolved session belongs to a user with no `profiles` row yet (edge case; normally auto-created), **When** the app loads, **Then** the app still renders using `session.user.email` as a profile-name fallback in the header rather than failing.
3. **Given** a session that is signed out from another tab or expires, **When** the auth state change fires `SIGNED_OUT`, **Then** the app clears cellar, profile, and chat state in this tab and returns to the auth page.

---

### User Story 4 - Sign out (Priority: P2)

A signed-in user deliberately ends their session from a shared or public device.

**Why this priority**: Necessary for account hygiene and trust, but exercised far less often than sign-in.

**Independent Test**: While signed in, click the avatar (desktop) or the "Sign out" menu item (mobile hamburger menu), and confirm the app returns to the auth page and cellar data is no longer visible.

**Acceptance Scenarios**:

1. **Given** a signed-in user on desktop, **When** they click their profile avatar (or the "Sign out" button when no avatar is set) in the header, **Then** their Supabase session ends and the app returns to the auth page.
2. **Given** a signed-in user on mobile, **When** they open the hamburger menu and tap "Sign out", **Then** the same sign-out behavior occurs and the menu closes.

---

### User Story 5 - Try the app without an account (Priority: P3)

A prospective user who does not want to sign up yet tries a single wine-pairing recommendation as a guest, then is offered a path to sign in.

**Why this priority**: A conversion/acquisition aid layered on top of auth, not required for the core authenticated product to function. See `specs/002-guest-wine-pairing/spec.md` for the full guest-mode behavior; this story covers only the auth-page entry point and return path.

**Independent Test**: From the auth page, click "Try a recommendation without signing up →" and confirm the guest experience opens; from the guest experience, click any "Sign in" call-to-action and confirm it returns to the auth page.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on the auth page, **When** they click "Try a recommendation without signing up →", **Then** the app shows the guest experience instead of the auth form, without creating any account or session.
2. **Given** a visitor in the guest experience, **When** they click a "Sign in" call-to-action, **Then** the app returns to the auth page (Google/Magic Link options).

### Edge Cases

- What happens when a user closes the tab mid-Google-OAuth-redirect? They land back on the auth page unauthenticated on next visit; no partial session is created.
- What happens if Supabase Auth is unreachable when the app first loads? The initial `Promise.all` fetch never resolves; the app remains on the branded loading screen indefinitely (no explicit timeout/error UI is implemented for this case today).
- How does the system handle a Magic Link clicked on a different device/browser than it was requested from? Supabase issues the session to whichever browser opens the link; this is standard Supabase Auth behavior and not app-specific handling.
- What happens to in-flight chat/cellar state on `SIGNED_OUT`? Chat messages, chat session ID, and per-wine feedback state are explicitly cleared client-side so a subsequent sign-in (possibly as a different user) starts clean.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST offer Google OAuth as a sign-in method, redirecting back to the app's own origin on completion.
- **FR-002**: The system MUST offer passwordless email sign-in ("Magic Link") as an alternative to Google OAuth.
- **FR-003**: The system MUST surface authentication errors (from either method) inline on the auth page without navigating away.
- **FR-004**: The system MUST persist the authenticated session across page reloads and new browser tabs using Supabase Auth's session storage, without requiring re-authentication.
- **FR-005**: On session resolution, the system MUST show a distinct branded loading state before the auth page or the authenticated app is decided, to avoid a flash of the wrong screen.
- **FR-006**: The system MUST fetch the user's cellar (`wines`) and `profiles` row in parallel with session resolution on initial load, and again on a fresh `SIGNED_IN` event, to minimize time-to-usable-app.
- **FR-007**: The system MUST auto-provision a `profiles` row (display name, avatar URL from OAuth metadata) for every new `auth.users` row via a database trigger, with no explicit signup step required from the user.
- **FR-008**: The system MUST let a signed-in user end their session (sign out) from both the desktop header and the mobile hamburger menu.
- **FR-009**: On sign-out, the system MUST clear all locally-held cellar, profile, and chat state so no data from the previous session is visible to whoever uses the browser next.
- **FR-010**: The system MUST offer an unauthenticated "guest mode" entry point from the auth page that does not require completing sign-in first (see `specs/002-guest-wine-pairing/spec.md`).
- **FR-011**: All cellar and profile data access MUST be scoped to the authenticated user via Postgres Row Level Security (RLS) — the client never filters by user id itself; RLS is the enforcement boundary (Constitution Principle II).

### Key Entities

- **Session** (Supabase Auth, not an app-owned table): the authenticated identity for the current browser; carries `user.id` and `user.email`, used to scope every subsequent Supabase query.
- **Profile** (`profiles` table): one row per user — `id` (= `auth.users.id`), `display_name`, `avatar_url`. Auto-created by the `handle_new_user()` trigger from OAuth metadata (`full_name`, `avatar_url`) on first sign-up; not user-editable today.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can go from landing on the auth page to viewing an (empty) authenticated cellar in under 30 seconds via Google OAuth.
- **SC-002**: A returning user with an existing session never sees the sign-in form — the app resolves directly to the authenticated view on every reload.
- **SC-003**: 100% of cellar, chat, and profile data is inaccessible to any user other than its owner, verified via RLS policies rather than client-side checks.
- **SC-004**: Sign-out fully clears visible app state (cellar, chat, feedback) in under 1 second, with no stale data flash for the next user of a shared device.

## Assumptions

- Google OAuth and Magic Link are the only two sign-in methods in scope; there is no username/password flow.
- Supabase Auth's own session/token storage and refresh mechanics are relied upon as-is; the app does not implement its own token refresh or expiry handling.
- The auth redirect target is always `window.location.origin` (no deep-link-to-original-page support after OAuth).
- Profile editing (changing display name/avatar after signup) is out of scope — the profile row is populated once at signup and only read thereafter.
- There is no explicit "forgot password" flow because there is no password-based sign-in to begin with.
