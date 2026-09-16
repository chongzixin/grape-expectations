# auth Specification

## Purpose
Authenticates users via Supabase Auth (Google OAuth or passwordless magic link), auto-provisions their profile, allows unauthenticated guest access to a limited feature, and enforces per-user data isolation at the database level.

## Requirements

### Requirement: Google OAuth sign-in
Users SHALL be able to sign in with their Google account.

#### Scenario: Successful OAuth redirect
- **WHEN** a user clicks "Continue with Google"
- **THEN** the app calls `supabase.auth.signInWithOAuth` with provider `google` and `redirectTo` set to the app's own origin

#### Scenario: OAuth failure
- **WHEN** `signInWithOAuth` returns an error
- **THEN** the error message is shown on the auth page

### Requirement: Magic link (passwordless) sign-in
Users SHALL be able to sign in by entering their email and receiving a magic link, without a password.

#### Scenario: Valid email submitted
- **WHEN** a user submits the magic-link form with a non-empty email
- **THEN** the app calls `supabase.auth.signInWithOtp` with `emailRedirectTo` set to the app's origin, and on success shows a "check your email" confirmation screen with the entered address

#### Scenario: Request failure
- **WHEN** `signInWithOtp` returns an error
- **THEN** the error message is shown instead of the confirmation screen, and the user can retry

#### Scenario: Changing email after sending
- **WHEN** a user is on the "check your email" confirmation screen and clicks "Use a different email"
- **THEN** the form resets to the email-entry state with the email field cleared

### Requirement: Automatic profile provisioning
A `profiles` row SHALL be created automatically the first time a user signs up, without any explicit client-side insert.

#### Scenario: First sign-up
- **WHEN** a new row is inserted into `auth.users` (i.e. a user signs up via any provider)
- **THEN** the `on_auth_user_created` trigger inserts a corresponding `profiles` row populated with `display_name` and `avatar_url` from the auth provider's metadata, doing nothing if a profile with that id already exists

### Requirement: Guest access without an account
Unauthenticated visitors SHALL be able to use the guest wine-pairing feature without signing in or creating an account.

#### Scenario: Entering guest mode
- **WHEN** an unauthenticated visitor clicks "Try a recommendation without signing up" on the auth page
- **THEN** the app shows the guest pairing page without requiring authentication, and no cellar, session, or feedback data is created for them

#### Scenario: Returning to sign-in from guest mode
- **WHEN** a guest wants to sign in
- **THEN** they can return to the auth page from guest mode to authenticate via Google or magic link

### Requirement: Per-user data isolation via Row Level Security
Every table holding user-owned data (`wines`, `recommendation_sessions`, `recommendation_messages`, `recommendation_feedback`, `profiles`) SHALL enforce row-level access restricted to the authenticated owner via Postgres RLS policies, independent of any client-side filtering.

#### Scenario: Policy scope
- **WHEN** a signed-in user performs any SELECT, INSERT, UPDATE, or DELETE against a user-owned table
- **THEN** the corresponding RLS policy restricts the operation to rows where the table's user-identifying column (`user_id`, or `id` for `profiles`) equals `auth.uid()`
