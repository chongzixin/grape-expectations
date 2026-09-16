## MODIFIED Requirements

### Requirement: Google OAuth sign-in
Users SHALL be able to sign in with their Google account.

#### Scenario: Successful OAuth redirect
- **WHEN** a user clicks "Continue with Google"
- **THEN** the app starts Google's sign-in flow and returns the user to the app once they've authenticated

#### Scenario: OAuth failure
- **WHEN** Google sign-in fails
- **THEN** the error message is shown on the auth page

### Requirement: Magic link (passwordless) sign-in
Users SHALL be able to sign in by entering their email and receiving a magic link, without a password.

#### Scenario: Valid email submitted
- **WHEN** a user submits the magic-link form with a non-empty email
- **THEN** the app sends a sign-in link to that address and shows a "check your email" confirmation screen with the entered address

#### Scenario: Request failure
- **WHEN** sending the magic link fails
- **THEN** the error message is shown instead of the confirmation screen, and the user can retry

#### Scenario: Changing email after sending
- **WHEN** a user is on the "check your email" confirmation screen and clicks "Use a different email"
- **THEN** the form resets to the email-entry state with the email field cleared

### Requirement: Automatic profile provisioning
A profile SHALL be created automatically the first time a user signs up, without any explicit action from the app.

#### Scenario: First sign-up
- **WHEN** a person signs up for the first time, through any sign-in method
- **THEN** a profile is automatically created for them, pre-filled with their display name and avatar from the sign-in provider when available, and signing up again never creates a duplicate profile

### Requirement: Guest access without an account
Unauthenticated visitors SHALL be able to use the guest wine-pairing feature without signing in or creating an account.

#### Scenario: Entering guest mode
- **WHEN** an unauthenticated visitor clicks "Try a recommendation without signing up" on the auth page
- **THEN** the app shows the guest pairing page without requiring authentication, and no cellar, session, or feedback data is created for them

#### Scenario: Returning to sign-in from guest mode
- **WHEN** a guest wants to sign in
- **THEN** they can return to the auth page from guest mode to authenticate via Google or magic link

### Requirement: Per-user data isolation via Row Level Security
A user's data (cellar, chat history, feedback, profile) SHALL be private to them — no other user can read or modify it, even if the client application attempts to.

#### Scenario: Policy scope
- **WHEN** a signed-in user reads or writes any of their own data
- **THEN** the system enforces at the database level that they can only access their own records, regardless of what the client application requests
