## ADDED Requirements

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
- **THEN** the edit is rejected and the card keeps its previous year, with no partial or invalid state saved

#### Scenario: Feature is only available to signed-in users
- **WHEN** an unauthenticated visitor uses guest mode
- **THEN** they do not see the stats header or its tracked-year cards at all, since guest mode has no cellar to track
