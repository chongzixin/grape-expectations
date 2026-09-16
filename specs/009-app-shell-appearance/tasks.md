---

description: "Backfilled task record for the App Shell & Appearance feature — documents work already completed, not a forward plan"
---

# Tasks: App Shell & Appearance

**Input**: Design documents from `specs/009-app-shell-appearance/`

**Status**: All tasks below describe work already implemented and shipped. Retroactive record; no automated tests exist (Constitution Principle I) — day/night boundary and override behavior verified manually via system clock changes.

## Phase 1: Foundational

- [X] T001 Define `:root` (dark) and `[data-theme="light"]` CSS variable sets in `css/styles.css`
- [X] T002 Add `themeMode` state + `data-theme` attribute-applying effect in `App.tsx`

**Checkpoint**: Theme system wired end-to-end for a static (non-automatic) toggle.

---

## Phase 2: User Story 1 — Automatic day/night theme (P2)

- [X] T003 [US1] Implement time-based theme effect (6:30am–7:30pm light, else dark) on a 60s interval
- [X] T004 [US1] Add `themeManualRef` guard so manual overrides suppress the automatic effect for the session

**Checkpoint**: Theme follows time of day unless manually overridden.

---

## Phase 3: User Story 2 — Manual theme override (P3)

- [X] T005 [US2] Implement `toggleTheme()` (flip mode + set `themeManualRef.current = true`)
- [X] T006 [US2] Add Sun/Moon toggle icon to desktop `Header.tsx`
- [X] T007 [US2] Add theme item to mobile hamburger menu in `Header.tsx`

**Checkpoint**: Manual toggle works from both desktop and mobile and sticks for the session.

---

## Phase 4: User Story 3 — Consistent header navigation (P1)

- [X] T008 [US3] Build desktop header: logo/branding, Add Wine button, theme toggle, avatar/sign-out
- [X] T009 [US3] Build mobile hamburger menu with the same theme/sign-out actions
- [X] T010 [US3] Conditionally render "Estimate Windows" button (desktop only, only when ≥1 wine lacks a window)
- [X] T011 [US3] Wire avatar click (or labeled Sign out button when no avatar) to `handleSignOut`

**Checkpoint**: Every authenticated screen has reachable core actions on both viewport sizes.

---

## Phase 5: User Story 4 — Branded loading states (P3)

- [X] T012 [US4] Build session-resolution loading screen (title + champagne GIF)
- [X] T013 [US4] Build post-auth cellar-fetch loading screen ("Decanting your cellar..." variant)
- [X] T014 [US4] Gate `App.tsx`'s render tree on `sessionReady` → `session` → `loading` in that order

**Checkpoint**: No blank/unstyled screen appears at any point during load.

---

## Dependencies & Execution Order

- Phase 1 blocks Phases 2–3.
- Phase 4 (header) and Phase 5 (loading screens) have no dependency on the theme phases beyond both reading `themeMode` where relevant (the loading screens themselves are theme-agnostic in content, styled by whatever `data-theme` is already set).

## Notes

- No task exists for persisting theme choice (`localStorage`/DB) — not part of the shipped feature (see spec.md Assumptions).
