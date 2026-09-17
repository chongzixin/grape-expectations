## Purpose
Surfaces computed statistics and visual breakdowns of the active cellar, plus an on-demand AI-generated narrative summary of the collection's health.

## ADDED Requirements

### Requirement: Cellar statistics computation
The app SHALL compute aggregate statistics over the active (inventory > 0) wines: total bottle count, unique wine count, average price, most common country and style, and bottle counts in the `approaching_end` and `past_peak` drinking-window statuses.

#### Scenario: Empty cellar
- **WHEN** the active wine list is empty
- **THEN** `computeStats` returns zeroed counts, `null` average price, and `'—'` for the mode country and style, without throwing

#### Scenario: Bottle-weighted aggregation
- **WHEN** computing totals and modes across wines with `inventory` greater than 1
- **THEN** each wine is expanded to one entry per bottle before counting, so a wine with 3 bottles contributes 3 toward `totalBottles` and toward its country/style mode counts

#### Scenario: Average price excludes unpriced wines
- **WHEN** computing `avgPrice`
- **THEN** only wines with a non-null, non-zero `price` are included in the average, rounded to the nearest whole number

### Requirement: Visual breakdowns
The analytics view SHALL render donut charts and ranked lists breaking the active cellar down by type, drinking-window status, country, varietal (style), and vintage, each weighted by bottle count.

#### Scenario: Drinking-window donut omits empty statuses
- **WHEN** rendering the "By Drinking Window" donut chart
- **THEN** any status (too young / prime / drink soon / past peak) with zero bottles is excluded from the chart rather than shown as a zero-width slice

#### Scenario: Vintage list sort order
- **WHEN** rendering the "By Vintage" breakdown
- **THEN** entries are sorted by vintage descending (most recent vintage first)

### Requirement: AI-generated Cellar Health Snapshot
Users SHALL be able to request a one-time AI-generated narrative summary of their cellar's health, generated on demand and cached in memory for the session rather than regenerated on every view.

#### Scenario: Generation is on-demand and not repeated
- **WHEN** a user clicks "Generate AI Assessment" and a summary has not already been loaded or is not currently loading
- **THEN** the app requests a summary from Claude; subsequent calls to the same load function while a summary already exists are a no-op

#### Scenario: Summary content and constraints
- **WHEN** the app builds the Cellar Health Snapshot prompt
- **THEN** it supplies the full active wine list, the exact bottle counts per drinking-window status (prime/drink soon/past peak/too young), and the local cuisine knowledge base, and requests 150-180 words across 2-3 short paragraphs with no headers, bullets, bold text, or title, covering the cellar's stylistic identity, near-term drinking priorities, style balance, drinking-window spread, and specific gaps to fill

#### Scenario: Generation failure
- **WHEN** the Claude request for a summary fails
- **THEN** the app shows a fallback message telling the user the summary could not be generated and to check their connection, instead of leaving the view stuck loading
