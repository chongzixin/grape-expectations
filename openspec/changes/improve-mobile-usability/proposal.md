# Proposal

## Why

Most users are on mobile, but a design audit found the cellar UI falls short of basic mobile accessibility standards: the tracked-year "edit vintage" control has an ~17x17px invisible tap target (versus the 44x44px Apple HIG / 48x48px Material minimum), several muted-text/background pairs fall below WCAG AA contrast (4.36:1 vs. the 4.5:1 floor), form inputs render at 15px which triggers Safari's auto-zoom-on-focus on iOS, and the cellar table already hides 4 of 7 columns on narrow viewports with no way to recover that data short of rotating to desktop.

## What Changes

- Expand the tap target of icon-only controls (tracked-year edit pencil in the stats header, cellar row inventory +/- buttons) to at least 44x44px via an invisible expanded hit-area, without enlarging their visual footprint or the card/row layout.
- Give the tracked-year edit pencil a visible affordance (a faint background chip) so it reads as tappable instead of decorative.
- Raise the `--fs-xs` / `--fs-sm` design tokens slightly (12px→13px, 13px→14px) to clear the low end of the mobile legibility floor.
- Force all `<input>` / `<select>` elements to render at >=16px on mobile viewports, fixing the iOS Safari auto-zoom-on-focus bug on the search box and manual-entry form fields.
- Adjust the `--muted` color token in both themes so muted-text-on-card combinations clear WCAG AA (4.5:1) for normal-size text.
- Add tap-to-expand cellar rows on mobile: tapping a row reveals the columns currently dropped by the `hide-m` breakpoint (Type, Region, Price, Drinking Window) inline, instead of that data being unreachable except by widening the viewport.

## Capabilities

### New Capabilities
- `mobile-accessibility`: Cross-cutting presentation requirements for the app's mobile experience — minimum touch target sizing for interactive controls, minimum text contrast on card surfaces, prevention of unwanted viewport zoom on form focus, and progressive disclosure for cellar data hidden on narrow viewports.

### Modified Capabilities
_(none — the changes affect presentation/accessibility of controls already described in `cellar-inventory` and `cellar-analytics`, but do not change those capabilities' existing SHALL-level behavior. The tap-to-expand row addition is genuinely new externally-observable behavior, but it's a presentation-layer capability of the cellar table rather than a change to the data operations `cellar-inventory` specifies, so it is captured under `mobile-accessibility` rather than as a delta to `cellar-inventory`.)_

## Impact

- `js/components/StatsBar.tsx` — tracked-year edit button markup/affordance.
- `js/components/CellarView.tsx` — row expand/collapse interaction, inventory button markup.
- `css/styles.css` — `--fs-xs`/`--fs-sm`/`--muted` tokens (both themes), `.ge-stat-edit`, `.ivb`, input/select mobile font-size, new expanded-row styles, `@media (max-width: 700px)` block.
- No database, API, or serverless function changes. No new dependencies.
