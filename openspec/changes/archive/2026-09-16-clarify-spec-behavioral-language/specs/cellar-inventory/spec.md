## MODIFIED Requirements

### Requirement: Manual wine entry
Users SHALL be able to add a wine to their cellar by filling in a form with name, winery, vintage, price, bottle count, style, country, region, sub-region, and type.

#### Scenario: Minimum required fields
- **WHEN** a user submits the add-wine form with at least a name
- **THEN** a new wine is saved to their personal cellar, tagged as manually entered, with the bottle count defaulting to 1 and the wine type defaulting to Red if left blank

### Requirement: Photo and invoice OCR scan
Users SHALL be able to add wines by photographing a label or invoice; the app reads the photo and extracts structured wine details automatically.

#### Scenario: Single label photo
- **WHEN** a user uploads a photo containing a single wine label
- **THEN** the app extracts the wine's details from the label and prefills the add-wine form with them for the user to review before saving

#### Scenario: Multi-bottle photo or invoice
- **WHEN** a user uploads a photo containing multiple bottle labels or an invoice listing multiple wines
- **THEN** the app extracts one wine record per detected bottle or invoice line item and lets the user step through and confirm or skip each one before saving

#### Scenario: Unparseable image
- **WHEN** the app cannot make sense of the photo
- **THEN** it tells the user the label could not be read and switches the add-wine modal to manual entry so they can complete the details themselves

#### Scenario: Invoice price extraction
- **WHEN** an invoice shows both a per-bottle unit price and a line-item subtotal, optionally with a discount applied to that line
- **THEN** the app records the per-bottle price (net of any line discount) as the wine's price, never the line-item subtotal

### Requirement: Duplicate wine detection and merge
Before saving a new wine, the app SHALL check whether it matches a wine already in the user's cellar and offer to merge instead of creating a duplicate entry.

#### Scenario: Matching vintage, name, and winery
- **WHEN** a new wine has the same vintage as one already in the cellar, and its name and winery are each an exact match or close enough in spelling to plausibly be the same wine
- **THEN** the app treats it as a duplicate and prompts the user to merge rather than silently creating a second entry

#### Scenario: Merge increases inventory and reprices
- **WHEN** the user confirms a merge with an existing wine
- **THEN** the existing wine's bottle count increases by the new quantity, and its recorded price becomes the quantity-weighted average of the old and new price (or whichever price is known, if only one of the two was provided)

### Requirement: Bottle count adjustment and removal
Users SHALL be able to increment or decrement a wine's bottle count from the cellar view.

#### Scenario: Decrement below zero is clamped
- **WHEN** a user decrements a wine's bottle count
- **THEN** the count never goes below zero, and the wine's last-updated record reflects the change

#### Scenario: Zero-inventory wines are hidden from active views
- **WHEN** a wine's bottle count reaches zero
- **THEN** it is excluded from the active cellar list, statistics, and sommelier recommendations, though its record is preserved for history

### Requirement: AI-estimated drinking windows
The app SHALL be able to estimate a drinking window (a start and end year) for a wine using the AI, both for a single wine and in bulk for every wine missing one.

#### Scenario: Single-wine estimation on the add form
- **WHEN** a user enters a valid vintage year and wine name while adding a wine
- **THEN** the app estimates a drinking window shortly after and prefills the start/end year fields, as long as the user hasn't changed those details again in the meantime

#### Scenario: Bulk estimation for existing cellar
- **WHEN** a user triggers drinking-window estimation for their whole cellar
- **THEN** the app estimates a window for every active wine that doesn't already have one, saves each successful estimate, and moves on to the next wine if an individual estimate fails

### Requirement: Drinking window status classification
Each wine's drinking window SHALL be classified into exactly one status based on the current year: no window set, too young, past its peak, approaching the end of its window, or in its prime.

#### Scenario: No window set
- **WHEN** a wine has no drinking window recorded
- **THEN** its status is "no window set"

#### Scenario: Before the window opens
- **WHEN** the current year is before the wine's drinking window opens
- **THEN** its status is "too young"

#### Scenario: After the window closes
- **WHEN** the current year is after the wine's drinking window closes
- **THEN** its status is "past its peak"

#### Scenario: Within 2 years of the window closing
- **WHEN** the current year is within the window and 2 years or less remain before it closes
- **THEN** its status is "approaching the end of its window"

#### Scenario: Comfortably within the window
- **WHEN** the current year is within the window with more than 2 years remaining
- **THEN** its status is "in its prime"

### Requirement: Row Level Security on wine data
A user's wine data SHALL be private to them — no other user can read or modify it, even if the client application attempts to.

#### Scenario: Cross-user isolation
- **WHEN** a signed-in user reads or modifies wine data
- **THEN** the system enforces at the database level that they can only access their own wines, regardless of what the client application requests
