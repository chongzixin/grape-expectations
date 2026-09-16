## Purpose
Provides conversational, Singapore-cuisine-aware wine pairing recommendations, for both signed-in users (using their real cellar) and unauthenticated guests (generic suggestions only), plus a feedback mechanism on individual recommended wines.

## ADDED Requirements

### Requirement: Cellar-aware recommendation chat
Signed-in users SHALL be able to ask a free-text question and receive a response recommending exactly 3 wines from their cellar and 2 wines not in their cellar, tailored to Singapore local cuisine.

#### Scenario: First message in a new session
- **WHEN** a signed-in user sends their first chat message
- **THEN** the app creates a row in `recommendation_sessions` for that user, persists the user message to `recommendation_messages`, and uses the returned session id for subsequent messages in the conversation

#### Scenario: Cellar context sent to the model
- **WHEN** the app builds the request to Claude for a recommendation
- **THEN** the system prompt includes every active (inventory > 0) wine's id, name, winery, vintage, type, style, region, inventory count, price, and drinking-window status, plus the local cuisine knowledge base

#### Scenario: Response structure
- **WHEN** Claude returns a recommendation response
- **THEN** it names exactly 3 wines from the cellar under a "From your cellar:" section and exactly 2 wines not in the cellar (of a different varietal than the cellar picks) under a "Worth seeking out:" section, each with an SGD price, and ends with a "Verdict" section listing all 5 wines as bullets

#### Scenario: Drinking window prioritization
- **WHEN** Claude selects which cellar wines to recommend
- **THEN** it prioritizes wines by drinking-window status in the order defined by `DRINKING_STATUS_PRIORITY`

### Requirement: Hidden WINES_JSON metadata block
Every recommendation response SHALL end with a hidden HTML-comment block containing structured JSON for the 5 recommended wines, which the UI uses to drive per-wine feedback controls and which is never shown to the user.

#### Scenario: Block format and content
- **WHEN** Claude finishes a recommendation response
- **THEN** it appends a block of the exact form `<!-- WINES_JSON\n[...]\n-->` containing one object per recommended wine with `name`, `winery`, `in_cellar`, and `cellar_wine_id` (the cellar wine's UUID for in-cellar picks, `null` otherwise), in the same order as the Verdict section

#### Scenario: Parsing and stripping for display
- **WHEN** the app renders an assistant message
- **THEN** it parses the `WINES_JSON` block with `parseRecommendedWines()` to populate `recommendedWines` on the message, and renders only the text produced by `stripWinesJson()`, which removes the block entirely

### Requirement: Per-wine feedback (thumbs up/down)
Signed-in users SHALL be able to give thumbs up/down feedback on each individual wine listed in the Verdict section of an assistant message.

#### Scenario: First vote on a wine
- **WHEN** a user clicks thumbs up or thumbs down on a wine in a message that has a persisted `messageId`
- **THEN** the app upserts a row into `recommendation_feedback` keyed on `(user_id, message_id, wine_name)`, storing the winery, whether the wine was an in-cellar pick, its `cellar_wine_id` if any, the feedback value, and the user's original query as `context_query`

#### Scenario: Clicking the same vote again removes it
- **WHEN** a user clicks the same thumbs value they already selected for that wine on that message
- **THEN** the app deletes the feedback row for that `(user_id, message_id, wine_name)` combination instead of re-submitting it

#### Scenario: Feedback requires a persisted message id
- **WHEN** an assistant message has no `messageId` (e.g. the Supabase insert has not completed) or there is no active session
- **THEN** feedback submission is a no-op

### Requirement: Guest recommendation mode
Unauthenticated visitors SHALL be able to get a wine pairing suggestion for a named dish without creating an account, using a separate, shorter prompt that has no access to any cellar data.

#### Scenario: Dish-only guest query
- **WHEN** a guest enters a dish name and submits
- **THEN** the app calls Claude with a guest-only system prompt (no cellar inventory, no session/message persistence) that returns 2-3 paired varietals with WSET-style rationale and exactly 3 purchasable Singapore wine suggestions with retailer names and SGD price estimates, capped under 200 words

#### Scenario: Guest has no feedback or persistence
- **WHEN** a guest receives a recommendation
- **THEN** no row is written to `recommendation_sessions`, `recommendation_messages`, or `recommendation_feedback`, and no `WINES_JSON` block or per-wine thumbs controls are shown
