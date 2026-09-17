# cellar-analytics Specification

## Purpose
Surfaces computed statistics and visual breakdowns of the active cellar, plus an on-demand AI-generated narrative summary of the collection's health.

## Requirements

### Requirement: Cellar statistics computation
The app SHALL compute aggregate statistics over the active wines in the cellar: total bottle count, number of unique wines, average price, most common country and style, and how many bottles should be drunk soon or are past their peak.

#### Scenario: Empty cellar
- **WHEN** the cellar has no active wines
- **THEN** the app shows zeroed counts, no average price, and a placeholder for the most common country and style, without erroring

#### Scenario: Bottle-weighted aggregation
- **WHEN** computing totals and most-common values across wines with more than one bottle
- **THEN** each bottle counts individually, so a wine with 3 bottles contributes 3 toward the total count and toward its country/style tallies

#### Scenario: Average price excludes unpriced wines
- **WHEN** computing the average price
- **THEN** only wines with a known price are included, and the result is rounded to the nearest dollar

### Requirement: Visual breakdowns
The analytics view SHALL render donut charts and ranked lists breaking the active cellar down by type, drinking-window status, country, varietal (style), and vintage, each weighted by bottle count.

#### Scenario: Drinking-window donut omits empty statuses
- **WHEN** rendering the "By Drinking Window" donut chart
- **THEN** any status (too young / prime / drink soon / past peak) with zero bottles is excluded from the chart rather than shown as a zero-width slice

#### Scenario: Vintage list sort order
- **WHEN** rendering the "By Vintage" breakdown
- **THEN** entries are sorted by vintage descending (most recent vintage first)

### Requirement: AI-generated Cellar Health Snapshot
Users SHALL be able to request a narrative summary of their cellar's health from the AI, generated on demand once per session rather than regenerated every time the view is opened.

#### Scenario: Generation is on-demand and not repeated
- **WHEN** a user requests an AI assessment and one hasn't already been generated or is not currently loading
- **THEN** the app generates one; while a summary already exists for the session, requesting again does nothing

#### Scenario: Summary content and constraints
- **WHEN** the app builds the Cellar Health Snapshot request
- **THEN** it factors in the full active wine list, the exact bottle counts by drinking-window status, and Singapore cuisine knowledge, and asks for a 150-180 word, 2-3 paragraph write-up with no headers, bullets, bold text, or title, covering the cellar's stylistic identity, near-term drinking priorities, style balance, the spread of drinking windows, and specific gaps worth filling

#### Scenario: Generation failure
- **WHEN** the request for a summary fails
- **THEN** the app shows a message telling the user the summary could not be generated and to check their connection, instead of leaving the view stuck loading

### Requirement: Editable tracked vintage-year counts
Signed-in users SHALL be able to choose which three vintage years the stats header tracks a bottle count for, editing each one directly from its card, with the card's label and count updating immediately to the newly chosen year.

#### Scenario: Default years for a user who hasn't customized them
- **WHEN** a signed-in user has never set their own tracked years
- **THEN** the stats header shows bottle counts for 2016, 2018, and 2023, matching the app's long-standing default

#### Scenario: Editing a card's year
- **WHEN** a user clicks the edit control on one of the three vintage-count cards and enters a different year
- **THEN** that card's label and count update immediately to reflect the newly chosen year, computed over the user's current cellar

#### Scenario: Choice persists across sessions and devices
- **WHEN** a user changes a tracked year
- **THEN** the new selection is saved to their account and is still in effect the next time they sign in, on any device

#### Scenario: Invalid year input is rejected
- **WHEN** a user enters a value that isn't a plausible 4-digit vintage year (or leaves it blank)
- **THEN** the edit is rejected, the card shows a visible error state and keeps its previous year, with no partial or invalid state saved

#### Scenario: Duplicate year is rejected
- **WHEN** a user enters a year that matches the current year already shown on one of the other two cards
- **THEN** the edit is rejected, the card shows a visible error state and keeps its previous year, so the three cards never track the same year twice

#### Scenario: Feature is only available to signed-in users
- **WHEN** an unauthenticated visitor uses guest mode
- **THEN** they do not see the stats header or its tracked-year cards at all, since guest mode has no cellar to track
