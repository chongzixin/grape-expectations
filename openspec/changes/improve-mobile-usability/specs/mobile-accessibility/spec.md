# Spec Delta

## Purpose

Defines cross-cutting mobile usability and accessibility guarantees — touch target sizing, control affordance, text contrast, form-focus zoom behavior, and progressive disclosure of data hidden on narrow viewports — that apply across the app's UI regardless of which feature capability owns a given screen.

## ADDED Requirements

### Requirement: Minimum touch target size
Interactive icon controls and inline stepper buttons SHALL provide a tappable area of at least 44x44 CSS pixels on viewports narrower than 700px, regardless of the visible icon's rendered size.

#### Scenario: Tracked-year edit control
- **WHEN** a user views a tracked-year stat card on a viewport narrower than 700px
- **THEN** the edit control's tappable area is at least 44x44 CSS pixels, even though its visible glyph remains small

#### Scenario: Inventory count buttons
- **WHEN** a user views a wine row in the cellar table on a viewport narrower than 700px
- **THEN** each +/- inventory button's tappable area is at least 44x44 CSS pixels

### Requirement: Visible affordance for icon-only controls
Icon-only interactive controls SHALL be visually distinguishable from static or decorative icons through a background, border, or equivalent visual treatment, rather than relying on icon color alone.

#### Scenario: Tracked-year edit pencil
- **WHEN** a user views a tracked-year stat card
- **THEN** the edit pencil renders inside a visible background chip so it reads as an actionable control rather than decorative text

### Requirement: Minimum text contrast on card surfaces
Secondary or muted text rendered on card-colored backgrounds SHALL meet a contrast ratio of at least 4.5:1 against that background, in both the light and dark themes.

#### Scenario: Muted text in the dark theme
- **WHEN** muted secondary text (for example, a wine's winery line, or a stat card's label) is rendered on the dark theme's card background
- **THEN** its contrast ratio against that background is at least 4.5:1

#### Scenario: Muted text in the light theme
- **WHEN** muted secondary text is rendered on the light theme's card background
- **THEN** its contrast ratio against that background is at least 4.5:1

### Requirement: No unintended zoom on form focus
Text inputs and select controls SHALL NOT trigger a mobile browser's automatic zoom-on-focus behavior.

#### Scenario: Focusing the cellar search box on a mobile viewport
- **WHEN** a user on a mobile viewport taps the cellar search input, the sort select, or a manual wine-entry form field
- **THEN** the viewport does not automatically zoom in

### Requirement: Progressive disclosure of hidden cellar columns
On viewports narrower than 700px, where the cellar table hides the Type, Region, Price, and Drinking Window columns, users SHALL be able to reveal that data for an individual wine without changing the viewport size.

#### Scenario: Expanding a row
- **WHEN** a user taps a wine row in the cellar table on a viewport narrower than 700px
- **THEN** the row expands to show that wine's Type, Region, Price, and Drinking Window inline, without leaving the cellar view

#### Scenario: Collapsing a row
- **WHEN** a user taps an already-expanded wine row
- **THEN** the row collapses back to its compact form

#### Scenario: Tapping inventory or edit controls does not toggle the row
- **WHEN** a user taps the inventory +/- buttons within a row
- **THEN** the bottle count changes but the row's expanded/collapsed state does not toggle
