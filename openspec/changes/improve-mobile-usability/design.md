# Design

## Context

See `proposal.md` - Why for motivation. Relevant current state:

- Touch targets: `.ge-stat-edit` (`css/styles.css:222-237`) is a bare-glyph button, `font-size: var(--fs-sm)` (13px) + `padding: 2px`, absolutely positioned `top: 8px; right: 8px` inside a `.ge-stat` card. `.ivb` (`css/styles.css:429-444`) is a 24x24px circle. Neither gets a mobile-specific override in the `@media (max-width: 700px)` block (`css/styles.css:1135-1162`).
- Tokens: `--fs-xs: 12px`, `--fs-sm: 13px`, `--fs-base: 15px`, `--muted: #8a7a6a` (dark) / `#5A4830` (light), defined once on `:root` and `[data-theme="light"]` (`css/styles.css:6-44`).
- Cellar table: `js/components/CellarView.tsx` renders a real `<table>`; `.hide-m` / `.show-m` (driven by the same 700px breakpoint) permanently hide Type, Region, Price, and Drinking Window columns on mobile — there's no way to see them without widening the viewport.
- No test suite or linter (per CLAUDE.md); validation is manual + Netlify PR branch deploys.

## Goals / Non-Goals

**Goals:**
- Meet the touch-target, contrast, and no-zoom requirements in `specs/mobile-accessibility/spec.md` without changing desktop layout or visual density.
- Recover the data currently hidden on mobile (Type, Region, Price, Drinking Window) via an opt-in expand, not a permanent layout change.
- Keep every fix a token-level or localized-component change — no new dependencies, no build config changes.

**Non-Goals:**
- Not redesigning the cellar table into a card-based mobile layout (bigger effort, not needed to clear the accessibility bar; can be a future change).
- Not doing a full WCAG audit of the whole app (chat drawer, analytics charts, auth page) — scoped to the cellar view + stats bar surfaces the proposal names.
- Not changing `--fs-base`/`--fs-md`/`--fs-lg`/`--fs-xl` — only the two smallest tokens and the `--muted` color are in scope.

## Decisions

**Expanded hit-area via `::before`, not larger visible icons.** Both `.ge-stat-edit` and `.ivb` get a `::before` pseudo-element sized to at least 44x44px (`min-width`/`min-height` with negative-inset centering) with `content: ''` positioned absolutely over the visible control. This is the standard technique for "small icon, big tap target" and requires no layout reflow, since the pseudo-element is out of flow. Alternative considered: enlarging the buttons themselves — rejected because it would force `.ge-stat` cards and table rows to grow, working against the mobile density that filtering columns already protects.

**Background chip on the edit pencil is a real element style, not a hover-only effect.** `.ge-stat-edit` gets a permanent `background: rgba(...)` circular chip (visible in both themes) sized ~28px, with the expanded `::before` hit-area layered on top of that. This satisfies "visible affordance" without inflating the glyph's font-size (which would fight the stat card's tight vertical rhythm).

**Token-only fixes for font floor and contrast.** `--fs-xs` 12→13px, `--fs-sm` 13→14px, and `--muted` recalculated to clear 4.5:1 against `--card` in both themes (kept as close as possible to the existing hue so the muted/secondary visual hierarchy doesn't shift noticeably). Because every "secondary text" style in the app already keys off these tokens, this is a two-to-three line change that propagates everywhere the requirement applies, instead of patching each call site.

**Input zoom fix scoped to the mobile media query.** Add `font-size: 16px` to `input`, `select`, `textarea` inside `@media (max-width: 700px)` rather than raising `--fs-base` globally (which is used for chat messages and other body text where 15px is an intentional, already-passing choice). This is the minimal fix for the documented iOS Safari behavior (zoom triggers below 16px on a focused form control).

**Row expansion state lives in `CellarView` local state, not global app state.** A `Set<string>` (or single `expandedId` if only one row should be open at a time — chosen: `Set<string>` to allow multiple open rows, since users may want to compare a couple of wines) keyed by wine id, `useState` inside `CellarView`. No persistence, no new Supabase field — purely a client-side UI affordance, consistent with "plain React hooks only" (CLAUDE.md). Row tap toggles membership; inventory buttons call `e.stopPropagation()` so tapping +/- doesn't also toggle the row (per the spec's third scenario for this requirement).

**Expansion is rendered as an extra `<tr>` under the row, not an inline `<div>` inside the same `<td>`.** Keeps the semantic table structure valid (a `<td>` can't contain a `<tr>`) and lets the expanded content span the full table width via `colSpan`.

## Risks / Trade-offs

- [Recalculating `--muted` shifts its exact hue slightly in both themes] → Keep the change to the smallest delta that clears 4.5:1; spot-check both themes visually via `npm start` before merging, since there's no automated contrast check in CI.
- [Expanded hit-areas on `::before` can overlap a neighboring control if two small buttons sit close together] → `.ivb` buttons already have 8px gap; verify the 44px hit-area circles don't visually or functionally overlap between the − and + buttons at the smallest supported viewport (checked manually, no automated layout test available).
- [No test suite] → Validate all of this manually against real touch targets and a contrast checker on a Netlify PR branch deploy, per existing project convention; no way to regression-test contrast/target-size automatically today.
- [Row-expansion is new interaction surface] → Scope creep risk if it grows into a full alternate mobile layout; Non-Goals above caps it at "reveal already-computed data inline," not a redesign.
