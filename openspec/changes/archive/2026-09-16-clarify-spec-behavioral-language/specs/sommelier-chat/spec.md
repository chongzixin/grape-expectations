## RENAMED Requirements
- FROM: `### Requirement: Hidden WINES_JSON metadata block`
- TO: `### Requirement: Recommendation responses carry structured per-wine metadata`

## MODIFIED Requirements

### Requirement: Cellar-aware recommendation chat
Signed-in users SHALL be able to ask a free-text question and receive a response recommending exactly 3 wines from their cellar and 2 wines not in their cellar, tailored to Singapore local cuisine.

#### Scenario: First message in a new session
- **WHEN** a signed-in user sends their first chat message
- **THEN** the app starts a new conversation and saves the message, so the conversation can be continued and looked back on later

#### Scenario: Cellar context sent to the model
- **WHEN** the app builds a recommendation
- **THEN** it considers every wine currently in the user's cellar — including its quantity, price, and drinking-window status — alongside its Singapore cuisine knowledge

#### Scenario: Response structure
- **WHEN** the AI returns a recommendation response
- **THEN** it names exactly 3 wines from the cellar under a "From your cellar:" section and exactly 2 wines not in the cellar (of a different varietal than the cellar picks) under a "Worth seeking out:" section, each with an SGD price, and ends with a "Verdict" section listing all 5 wines as bullets

#### Scenario: Drinking window prioritization
- **WHEN** the AI selects which cellar wines to recommend
- **THEN** it prioritizes wines past their peak first, then those approaching the end of their window, then wines in their prime, then wines too young to drink, leaving wines with no known window as the lowest priority

### Requirement: Recommendation responses carry structured per-wine metadata
Every recommendation response SHALL include structured data identifying each of the 5 recommended wines — including whether it's a cellar pick and which cellar record it corresponds to — so the app can render accurate per-wine feedback controls, without that data appearing in the message shown to the user.

#### Scenario: Block format and content
- **WHEN** the AI finishes a recommendation response
- **THEN** it includes, for each of the 5 recommended wines, whether it's from the cellar and which cellar record it matches (if any), in the same order they were recommended in

#### Scenario: Parsing and stripping for display
- **WHEN** the app renders an assistant's recommendation message
- **THEN** it uses the per-wine metadata only to power feedback controls, and displays only the conversational text — the metadata itself is never shown to the user

### Requirement: Per-wine feedback (thumbs up/down)
Signed-in users SHALL be able to give thumbs up/down feedback on each individual wine listed in the Verdict section of an assistant message.

#### Scenario: First vote on a wine
- **WHEN** a user clicks thumbs up or thumbs down on a wine in a message that has finished saving
- **THEN** the app records the feedback for that wine on that message, including whether it was a cellar pick, which cellar wine it matches (if any), the vote given, and the question the user originally asked

#### Scenario: Clicking the same vote again removes it
- **WHEN** a user clicks the same thumbs value they already selected for that wine on that message
- **THEN** the app removes their vote instead of recording it again

#### Scenario: Feedback requires a persisted message id
- **WHEN** a user tries to vote on a wine before the message has finished saving, or while not signed in
- **THEN** the vote is not recorded

### Requirement: Guest recommendation mode
Unauthenticated visitors SHALL be able to get a wine pairing suggestion for a named dish without creating an account, using a separate, shorter interaction that has no access to any cellar data.

#### Scenario: Dish-only guest query
- **WHEN** a guest enters a dish name and submits
- **THEN** the app returns 2-3 paired wine varietals with reasoning tied to the dish's specific flavours, plus exactly 3 purchasable Singapore wine suggestions with retailer names and SGD price estimates, in under 200 words, with no access to any cellar data

#### Scenario: Guest has no feedback or persistence
- **WHEN** a guest receives a recommendation
- **THEN** nothing about the conversation is saved, and no per-wine feedback controls are shown, since there is no signed-in account or saved message to attach them to
