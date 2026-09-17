# Tasks

## 1. Design tokens (font floor & contrast)

- [ ] 1.1 Raise `--fs-xs` (12px→13px) and `--fs-sm` (13px→14px) in `css/styles.css` `:root`, and verify no layout overlap/wrapping regressions on the stats bar, table badges, and filter pills at 375px width via `npm start`
- [ ] 1.2 Recalculate `--muted` in both `:root` (dark) and `[data-theme="light"]` to clear a 4.5:1 contrast ratio against `--card` in that theme, and verify with a contrast-ratio calculation (e.g. a quick script or browser devtools contrast checker) for both themes
- [ ] 1.3 Visually spot-check both themes in the running app (`npm start`) to confirm the muted-text hierarchy still reads as "secondary" and no color shift looks broken

## 2. Form input zoom fix

- [ ] 2.1 Add `font-size: 16px` for `input`, `select`, `textarea` inside the `@media (max-width: 700px)` block in `css/styles.css`, and verify the cellar search box, sort select, and manual-entry form fields render at 16px in mobile devtools emulation
- [ ] 2.2 Verify on an iOS Safari device or simulator that focusing the search input no longer triggers viewport auto-zoom

## 3. Touch targets and affordance — tracked-year edit control

- [ ] 3.1 Add an expanded `::before` hit-area (min 44x44px, centered over the visible glyph) to `.ge-stat-edit` in `css/styles.css`, and verify via devtools that the computed tappable region is at least 44x44 CSS pixels at the 700px breakpoint
- [ ] 3.2 Add a visible background chip (circular, ~28px, themed for both light/dark) to `.ge-stat-edit` so the control is visually distinguishable at rest, not just on hover, and verify by inspecting the rendered stat card in both themes
- [ ] 3.3 Confirm `aria-label` on the button (already present in `StatsBar.tsx`) still accurately describes the action after the visual change

## 4. Touch targets — inventory buttons

- [ ] 4.1 Add an expanded `::before` hit-area (min 44x44px) to `.ivb` in `css/styles.css`, and verify via devtools that the +/− buttons each have a 44x44px tappable region without visually growing the circle
- [ ] 4.2 Verify the expanded hit-areas of adjacent − and + buttons (8px visual gap) do not visually overlap or create ambiguous tap zones at the narrowest supported viewport (320px)

## 5. Progressive disclosure — expandable cellar rows

- [ ] 5.1 Add `expandedIds` state (`Set<string>`) to `CellarView.tsx` and a toggle handler for a wine's row
- [ ] 5.2 Make the row (outside of the inventory control and any other interactive element) tappable to toggle expansion, calling `e.stopPropagation()` from the inventory buttons' click handlers so they don't also toggle the row
- [ ] 5.3 Render an additional `<tr>` with a `colSpan`-ed `<td>` beneath an expanded row, showing Type, Region, Price, and Drinking Window (the same data currently hidden via `.hide-m`), styled consistently with existing badge/label patterns
- [ ] 5.4 Scope the expand/collapse affordance to the `max-width: 700px` breakpoint only — verify desktop table layout (`hide-m` columns already visible) is completely unaffected
- [ ] 5.5 Verify with `npm start` on a mobile-width viewport: tapping a row reveals Type/Region/Price/Window inline, tapping again collapses it, and tapping +/- only changes the bottle count

## 6. Verification

- [ ] 6.1 Manually walk through every scenario in `specs/mobile-accessibility/spec.md` on a mobile-width viewport (or real device) and confirm each passes
- [ ] 6.2 Push to a branch and smoke-test on the Netlify PR preview per project convention (no automated test suite exists)
