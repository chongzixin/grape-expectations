## Why

Authentication (Google OAuth, magic link, guest access, and per-user data isolation via RLS) is live in production but undocumented as a spec. Capturing it as a baseline lets future auth changes (new providers, session handling changes) be proposed as deltas against known behavior.

## What Changes

No behavior changes. This documents the existing, already-shipped authentication feature as an OpenSpec capability spec.

## Capabilities

### New Capabilities
- `auth`: Google OAuth and magic-link sign-in via Supabase Auth, automatic profile creation on signup, unauthenticated guest access, and Row Level Security enforcing per-user data isolation across all user-owned tables.

### Modified Capabilities
(none)

## Impact

- Documentation only — no code changes.
- Grounded in: `js/AuthPage.tsx`, `js/components/GuestPage.tsx`, `js/supabaseClient.ts`, `supabase/schema.sql` (`profiles` table, `handle_new_user` trigger, RLS policies).
