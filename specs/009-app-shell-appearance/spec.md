# Feature Specification: App Shell & Appearance

**Feature Branch**: `009-app-shell-appearance` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx` (theme/loading-screen logic), `js/components/Header.tsx`, and `css/styles.css` (theme variables, referenced from CLAUDE.md), per user request to backfill SpecKit specs for all existing features. This is cross-cutting UI chrome underlying every other feature's screens, not a standalone user-facing "feature" in the product-pitch sense, but documented per the request to cover all existing behavior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The app looks right for the time of day automatically (Priority: P2)

A collector opens the app in the evening and it's in a dark, moody theme; opening it again at midday shows a light theme — without ever touching a setting.

**Why this priority**: A nice ambient touch that suits the cellar/sommelier aesthetic, but the app is fully usable in either theme, so this is a polish feature, not core functionality.

**Independent Test**: Set the system clock to a time within 7:30pm–6:30am, load the app, and confirm dark theme is active; set it to a daytime hour and confirm light theme is active (absent any manual override).

**Acceptance Scenarios**:

1. **Given** no manual theme override has occurred this session, **When** the local time is between 7:30pm and 6:30am, **Then** the app renders in dark theme.
2. **Given** no manual theme override has occurred this session, **When** the local time is between 6:30am and 7:30pm, **Then** the app renders in light theme.
3. **Given** the app remains open across a day/night boundary, **When** the boundary is crossed, **Then** the theme switches automatically within one minute (re-evaluated on a 60-second interval), without a page reload.
4. **Given** the user has manually toggled the theme this session, **When** the time-based check re-runs, **Then** it no longer overrides the user's manual choice for the remainder of the session.

---

### User Story 2 - Override the theme manually (Priority: P3)

A collector prefers dark mode during the day (or light mode at night) and switches it manually.

**Why this priority**: A convenience override on top of the automatic behavior; most users are expected to accept the automatic default.

**Independent Test**: Click the theme toggle (sun/moon icon) and confirm the theme flips immediately and does not revert on its own afterward.

**Acceptance Scenarios**:

1. **Given** any current theme, **When** the user clicks the theme toggle (desktop header icon, or the mobile hamburger-menu item), **Then** the theme flips (dark→light or light→dark) immediately.
2. **Given** a manual toggle has occurred, **When** the automatic time-based check would otherwise fire, **Then** it is suppressed for the rest of the session (see User Story 1, Scenario 4) — the user's explicit choice sticks.
3. **Given** the mobile hamburger menu is open, **When** the user selects the theme item, **Then** the same toggle occurs and the menu closes.

---

### User Story 3 - Navigate and act from a consistent header (Priority: P1)

From any screen, a collector can add a wine, see if a bottle-count/vintage they're looking at needs a drinking-window estimate, sign out, or (on mobile) reach the same actions from a hamburger menu.

**Why this priority**: The header is the one piece of UI present on every authenticated screen — without it being reliable, core actions (Add Wine, sign out) would be unreachable.

**Independent Test**: On both a desktop-width and mobile-width viewport, confirm the header exposes Add Wine, theme toggle, and sign-out, with mobile-only controls collapsing into a hamburger menu.

**Acceptance Scenarios**:

1. **Given** any authenticated screen, **When** the header renders, **Then** it shows the app logo/name, an "Add Wine" button, and (desktop) the theme toggle and sign-out/avatar controls directly, or (mobile) a hamburger icon that reveals the same theme/sign-out actions in a dropdown menu.
2. **Given** a desktop viewport, **When** the header renders and the user has an avatar (from OAuth profile), **Then** clicking the avatar signs out; if no avatar is set, a labeled "Sign out" button is shown instead.
3. **Given** at least one wine lacks a drinking window, **When** the header renders on desktop, **Then** an "Estimate Windows" button is shown (see `specs/005-drinking-window-tracking/spec.md`); it is hidden on mobile and hidden entirely once no wine needs it.

---

### User Story 4 - See a branded loading state instead of a blank screen (Priority: P3)

While the app resolves the user's session or fetches their cellar, the collector sees a branded loading screen rather than a flash of blank white/black or a half-rendered layout.

**Why this priority**: Pure perceived-polish; the app would still function without it, just with a jankier first paint.

**Independent Test**: Reload the app and observe a branded loading screen (logo + animated GIF) appears before either the auth page or the cellar view renders.

**Acceptance Scenarios**:

1. **Given** the app has just loaded and the session hasn't resolved yet, **When** rendering, **Then** a full-screen branded loading view (title + champagne GIF) is shown instead of any other content.
2. **Given** the session has resolved to an authenticated user but the cellar fetch is still in flight, **When** rendering, **Then** a similar branded loading view is shown with an additional "Decanting your cellar..." status line, distinguishing it from the session-resolution step.

### Edge Cases

- What happens if the user's system clock is wrong? Theme timing is entirely based on the browser's local `Date`, so an incorrect system clock produces an incorrect (but internally consistent) theme — no server-side time source is consulted.
- What happens if a user resizes their browser across the mobile/desktop breakpoint while the hamburger menu is open? Not specially handled — CSS class-based show/hide (`show-m`/`hide-m`) means controls appear/disappear per the new width on next render, but there's no explicit menu-close-on-resize logic.
- What happens to the manual-override flag across a full page reload? It resets — `themeManualRef` is an in-memory ref, not persisted (e.g. not written to `localStorage`), so a reloaded page always starts back on automatic time-based theming.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST automatically select dark theme between 7:30pm and 6:30am local time (inclusive of 7:30pm, exclusive of 6:30am) and light theme otherwise, re-evaluated at least once per minute while the app is open.
- **FR-002**: The system MUST let the user manually toggle between dark and light theme from both the desktop header and the mobile menu, and MUST suppress further automatic time-based switching for the remainder of the session once a manual toggle has occurred.
- **FR-003**: The system MUST render a persistent header on every authenticated screen exposing, at minimum: app branding, an "Add Wine" action, theme toggle, and sign-out — adapting layout between a direct-controls desktop header and a hamburger-menu mobile header.
- **FR-004**: The header MUST conditionally show an "Estimate Windows" action only when at least one wine in the cellar lacks a drinking window (desktop only).
- **FR-005**: The system MUST show a distinct, branded loading screen during initial session resolution, and a second, distinguishable branded loading state while the cellar is being fetched post-authentication, rather than rendering blank or partial content.
- **FR-006**: Theme selection MUST be reflected by setting a `data-theme` attribute on the document root element, driving the CSS custom-property-based theme system (dark by default per Constitution "Technology & Architecture Constraints").

### Key Entities

- No persisted entities — theme mode (`'light' | 'dark'`) and the manual-override flag are purely client-side, in-memory (`useState`/`useRef`) and not synced to the database or `localStorage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The app's theme matches the expected time-of-day rule (dark 7:30pm–6:30am, light otherwise) in 100% of automatic (non-overridden) cases, verified against the local clock.
- **SC-002**: A manual theme toggle takes effect immediately (perceived as instant, no loading state) and never silently reverts within the same session.
- **SC-003**: Every authenticated screen — Cellar, Analytics, any open modal — has the header's core actions (Add Wine, sign out) reachable within one interaction, at both desktop and mobile widths.
- **SC-004**: No screen is ever shown fully blank/unstyled during load — one of the two branded loading states or the final rendered view is always present.

## Assumptions

- Theme preference is not persisted across sessions/devices by design — every fresh page load re-derives it from the current time, which is treated as an acceptable, intentionally simple default rather than a gap to close.
- The 7:30pm/6:30am boundaries are fixed constants, not derived from the user's actual local sunrise/sunset (despite the code comment referencing "sunrise ~6:30am / sunset ~7:30pm") and not configurable per-user.
- The hamburger menu and direct-header-controls are mutually exclusive by viewport width (CSS `show-m`/`hide-m` classes), not a runtime JS breakpoint check — this spec treats that CSS-driven behavior as the intended design, not a bug.
