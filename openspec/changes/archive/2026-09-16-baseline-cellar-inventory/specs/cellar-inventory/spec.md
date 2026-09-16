## Purpose
Manages a signed-in user's wine cellar inventory: adding bottles by manual entry or photo/invoice OCR, merging duplicates, adjusting bottle counts, and tracking AI-estimated drinking windows per wine.

## ADDED Requirements

### Requirement: Manual wine entry
Users SHALL be able to add a wine to their cellar by filling in a form with name, winery, vintage, price, inventory count, style, country, region, sub-region, and type.

#### Scenario: Minimum required fields
- **WHEN** a user submits the add-wine form with at least a name
- **THEN** a new row is inserted into the `wines` table scoped to the signed-in user's `user_id`, with `source` set to `'manual'`, `inventory` defaulting to 1 if not provided, and `type` defaulting to `'Red'` if not provided

### Requirement: Photo and invoice OCR scan
Users SHALL be able to add wines by photographing a label or invoice; the image is compressed client-side and sent to the Claude vision API to extract structured wine data.

#### Scenario: Single label photo
- **WHEN** a user uploads a photo containing a single wine label
- **THEN** the image is compressed to a max dimension before upload, sent to `/.netlify/functions/claude` with `imageData`, and the response is parsed into one wine record prefilled into the add-wine form for review

#### Scenario: Multi-bottle photo or invoice
- **WHEN** a user uploads a photo containing multiple bottle labels or an invoice listing multiple wines
- **THEN** the app parses one wine record per detected bottle or invoice line item and lets the user step through and confirm or skip each one before saving

#### Scenario: Unparseable image
- **WHEN** the OCR response contains no valid JSON
- **THEN** the app shows an alert telling the user the label could not be read and switches the add-wine modal to the manual-entry tab

#### Scenario: Invoice price extraction
- **WHEN** an invoice shows both a "Unit Price" and an "Amount" column, optionally with a per-line discount
- **THEN** the extracted `price` field SHALL use the per-bottle unit price (discounted if a per-line discount is shown), never the line-item subtotal

### Requirement: Duplicate wine detection and merge
Before inserting a new wine, the app SHALL check whether it matches an existing wine already in the user's cellar and offer to merge instead of creating a duplicate row.

#### Scenario: Matching vintage, name, and winery
- **WHEN** a new wine's normalized vintage matches an existing wine's vintage exactly, and its normalized name and winery are each an exact match or within a Levenshtein distance of 2
- **THEN** the app treats it as a duplicate and prompts the user to merge rather than silently creating a second row

#### Scenario: Merge increases inventory and reprices
- **WHEN** the user confirms a merge with an existing wine
- **THEN** the existing wine's `inventory` is increased by the new quantity, and its `price` becomes the quantity-weighted average of the existing price and the new price (or whichever of the two is non-null if only one is set)

### Requirement: Bottle count adjustment and removal
Users SHALL be able to increment or decrement a wine's bottle count from the cellar view.

#### Scenario: Decrement below zero is clamped
- **WHEN** a user decrements a wine's inventory count
- **THEN** the stored inventory SHALL never go below 0, and the `updated_at` timestamp is refreshed on every change

#### Scenario: Zero-inventory wines are hidden from active views
- **WHEN** a wine's inventory reaches 0
- **THEN** it is excluded from the active cellar list, stats, and AI context (`activeWines`), though the row remains in the database

### Requirement: AI-estimated drinking windows
The app SHALL be able to estimate a `drinkFrom`/`drinkBy` year range for a wine using Claude, both for a single wine and in bulk for every wine missing a window.

#### Scenario: Single-wine estimation on the add form
- **WHEN** a user enters a valid 4-digit vintage year and wine name while adding a wine
- **THEN** the app debounces briefly, then requests a drinking window from Claude and prefills the `drinkFrom`/`drinkBy` fields if a superseding edit has not occurred in the meantime

#### Scenario: Bulk estimation for existing cellar
- **WHEN** a user triggers batch drinking-window estimation
- **THEN** the app iterates over every active wine missing both `drinkFrom` and `drinkBy`, requests an estimate for each, persists any non-null result to the `wines` table, and continues to the next wine if an individual estimate fails

### Requirement: Drinking window status classification
Each wine's drinking window SHALL be classified into exactly one status based on the current year: `unknown`, `too_young`, `past_peak`, `approaching_end`, or `prime`.

#### Scenario: No window set
- **WHEN** both `drinkFrom` and `drinkBy` are null
- **THEN** the status is `unknown`

#### Scenario: Before the window opens
- **WHEN** the current year is before `drinkFrom`
- **THEN** the status is `too_young`

#### Scenario: After the window closes
- **WHEN** the current year is after `drinkBy`
- **THEN** the status is `past_peak`

#### Scenario: Within 2 years of the window closing
- **WHEN** the current year is within the window and `drinkBy` minus the current year is 2 or less
- **THEN** the status is `approaching_end`

#### Scenario: Comfortably within the window
- **WHEN** the current year is within the window and more than 2 years remain before `drinkBy`
- **THEN** the status is `prime`

### Requirement: Row Level Security on wine data
All reads and writes to the `wines` table SHALL be scoped to the authenticated user via Postgres Row Level Security, never filtered client-side alone.

#### Scenario: Cross-user isolation
- **WHEN** a signed-in user queries the `wines` table
- **THEN** Postgres RLS policies restrict every SELECT, INSERT, UPDATE, and DELETE to rows where `user_id` equals `auth.uid()`, regardless of any client-side filtering
