# Implementation Plan: App Shell & Appearance

**Branch**: `009-app-shell-appearance` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-app-shell-appearance/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

Theme mode is a `useState` in `App.tsx`, re-derived from `Date` on a `setInterval(60_000)` unless a `useRef` flag records a manual override; the resolved mode is applied as a `data-theme` attribute on `<html>`, which CSS custom properties in `css/styles.css` key off of. `Header.tsx` is the single persistent navigation/action surface, with mobile/desktop layouts driven by CSS class visibility rather than a JS breakpoint. Two distinct full-screen loading views gate rendering before the real app appears.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: Plain React hooks only; no animation/UI-chrome library

**Storage**: N/A — nothing in this feature touches the database; theme/menu state is transient client state

**Testing**: None — no automated test suite (Constitution Principle I); the day/night boundary logic and manual-override suppression were verified manually by adjusting the system clock during development

**Target Platform**: Web (desktop + mobile browsers)

**Performance Goals**: The theme re-check runs on a coarse 60-second interval (not per-render or per-second), since minute-level precision is all the feature needs

**Constraints**: No `localStorage`/server persistence of theme choice (see spec.md Assumptions) — this is an accepted simplicity trade-off, not an oversight to fix under this plan

**Scale/Scope**: Applies uniformly across the whole authenticated app shell; not per-screen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: N/A — no data access in this feature.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: N/A — no AI calls in this feature.
- **Principle IV (Follow Existing Conventions)**: PASS — plain `useState`/`useRef`/`useEffect`; theming via CSS variables on `:root`/`[data-theme="light"]` exactly as mandated by CLAUDE.md's Styling section; `ge-*`/`hbg-*` CSS classes.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — theme state and the loading-screen gating logic remain in `App.tsx` (they gate what `App.tsx` itself renders); `Header.tsx` is already a clean, previously-extracted component.

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/009-app-shell-appearance/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                    # themeMode state, themeManualRef, time-based theme effect,
│                               #   data-theme attribute effect, toggleTheme(), branded loading screens,
│                               #   menuOpen state
└── components/
    └── Header.tsx               # Desktop header controls + mobile hamburger menu, Sun/Moon icons

css/
└── styles.css                    # :root (dark) / [data-theme="light"] CSS variables, show-m/hide-m rules
```

**Structure Decision**: Consistent with the constitution's Styling mandate — no theming library, no CSS-in-JS; the entire theme system is a single `data-theme` attribute toggle plus existing CSS variables.

## Key Flows (as built)

1. **Auto theme**: an effect computes `total = hours*60 + minutes` and sets `dark` when `total >= 390 && total < 1170` (390min = 6:30am, 1170min = 7:30pm — note the comparison is inverted from the "dark at night" framing: light is the `390–1170` daytime band, dark is everything outside it), runs once on mount and every 60s via `setInterval`, but only `if (!themeManualRef.current)`.
2. **Manual override**: `toggleTheme()` sets `themeManualRef.current = true` before flipping `themeMode`, permanently (for the session) disabling the effect above's writes.
3. **Apply**: a separate effect sets `document.documentElement.setAttribute('data-theme', themeMode)` whenever `themeMode` changes.
4. **Header**: receives `themeMode`, `toggleTheme`, `menuOpen`/`setMenuOpen`, `handleSignOut`, `setShowAdd`, `estimateDrinkingWindows`-related props from `App.tsx`; renders Sun/Moon SVG icons inline (no icon library) based on current mode.
5. **Loading screens**: `App.tsx`'s render short-circuits — `!sessionReady` renders the first branded loading view; `!session` renders `AuthPage`/`GuestPage`; `loading` (post-auth cellar fetch) renders the second branded loading view with the "Decanting your cellar..." line; only once all three gates pass does the real app render.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
