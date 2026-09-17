# Feature Specification: Editable Vintage Year Stat Cards

**Feature Branch**: `010-editable-vintage-years` (spec directory name; no separate git branch was created — this session commits directly to `claude/speckit-integration-mdw108` per its branch policy)

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "create a new feature to allow the user to change the meaningful years they want to track on the header bar. It is currently 2016, 2018, 2023 on the current version because these are meaningful years for me. Allow the user to change the year directly by clicking on an edit button on the card itself, thereafter the number below should change accordingly to count the number of bottles in that year"

## Clarifications

### Session 2026-09-16

- Q: When the user confirms a new year on a card, should the count update right away, or only after the save to the server succeeds? → A: Optimistic — card shows the new year/count immediately on confirm; if the save fails, it reverts and an error toast appears (matches the existing inventory +/− and add-wine behavior).
- Q: Should there be a way to reset a card back to its original default year (2016/2018/2023), or is manually retyping the old year the only way back? → A: No dedicated reset control — going back to a default (or any prior year) is just retyping it, same as any other edit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Change which vintage a stat card tracks (Priority: P1)

A collector looks at their three vintage-count stat cards (currently fixed at 2016, 2018, 2023) and changes one to a year that's actually meaningful to them — an anniversary vintage, a birth year, a first-bottle-bought year — directly from the card.

**Why this priority**: This is the entire feature. Without it, the three tracked years stay hard-coded and meaningless to any collector whose personal milestones don't happen to be 2016/2018/2023.

**Independent Test**: Click the edit affordance on a vintage-year stat card, enter a different 4-digit year, confirm, and verify the card now shows that year and a bottle count matching the collector's actual inventory for that vintage.

**Acceptance Scenarios**:

1. **Given** the stats bar showing a vintage-year card (e.g. "2016 Bottles"), **When** the user clicks the edit button on that card, **Then** the card's year becomes directly editable in place (no separate page or modal).
2. **Given** a card in edit mode, **When** the user enters a valid 4-digit year and confirms (e.g. presses Enter or a confirm control), **Then** the card immediately shows the new year as its label and the count of active bottles whose vintage exactly matches that year.
3. **Given** a card showing a newly-chosen year, **When** the underlying cellar has no active wines of that vintage, **Then** the card shows a count of 0 rather than hiding the card or showing an error.
4. **Given** three vintage-year cards, **When** the user edits one of them, **Then** the other two cards and their counts are unaffected.
5. **Given** a card already showing a custom year, **When** the user edits it again to a different year, **Then** the card updates to the newest choice (edits are not limited to a single change).

---

### User Story 2 - Chosen years persist across visits (Priority: P1)

Having set a card to a personally meaningful year, the collector expects it to still show that year the next time they open the app — not reset back to 2016/2018/2023.

**Why this priority**: A customization that doesn't survive a page reload isn't a real customization — this is what makes User Story 1 durable rather than a one-off party trick.

**Independent Test**: Change a card's year, reload the page (or sign in from a different browser/device), and confirm the same custom year is still shown for that card.

**Acceptance Scenarios**:

1. **Given** a user has changed one or more of their tracked years, **When** they reload the app, **Then** the stats bar shows their previously-chosen years, not the defaults.
2. **Given** a user has changed their tracked years on one device, **When** they sign in on a different device/browser, **Then** the same tracked years appear there too.
3. **Given** a brand-new user who has never customized their tracked years, **When** they view the stats bar for the first time, **Then** they see the existing default years (2016, 2018, 2023) with no setup required.

---

### User Story 3 - Cancel an edit without changing anything (Priority: P3)

A collector opens edit mode on a card, changes their mind, and backs out without altering the tracked year.

**Why this priority**: Prevents accidental changes from an exploratory click; not required for the core capability to deliver value, but a normal expectation of any inline-edit control.

**Independent Test**: Open edit mode on a card, then cancel (e.g. press Escape or click a cancel control) without confirming, and verify the card still shows its original year and count.

**Acceptance Scenarios**:

1. **Given** a card in edit mode, **When** the user presses Escape or clicks a cancel control, **Then** the card reverts to displaying its previous year and count, and nothing is persisted.
2. **Given** a card in edit mode, **When** the user clicks away from the card without confirming or cancelling, **Then** the edit is discarded the same as an explicit cancel (no accidental silent-save).

### Edge Cases

- What happens when the user types a non-numeric value, a partial year, or a year outside a plausible range (e.g. "abc", "202", "1500", "3000")? The system MUST reject it, keep the card's previous value, and show a brief inline validation message rather than saving garbage or crashing.
- What happens if two cards are set to the same year? Both are allowed to show the same year and the same count independently — no uniqueness is enforced across the three cards.
- What happens if the user is offline or the save request fails? The optimistic update is rolled back — the card reverts to its last known-persisted year and count — and the user sees an indication the change didn't save (see FR-007).
- What happens to a custom year if the collector later removes every wine of that vintage from their cellar? The card keeps tracking that year and simply shows a count of 0 — the tracked year itself is a user preference, not derived from what's currently in the cellar.
- What happens if a user wants to return a card to one of the original default years (2016/2018/2023)? There is no dedicated "reset to default" control — they retype the desired year the same way as any other edit (FR-001).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a signed-in user edit the year tracked by each of the three vintage-count stat cards, triggered by an edit affordance on the card itself, with the year editable in place (no navigation away from the stats bar).
- **FR-002**: A user who has not customized their tracked years MUST see the current default years (2016, 2018, 2023), matching today's behavior with zero setup required.
- **FR-003**: Confirming a new year MUST update that card's displayed year and count optimistically — immediately, before the save to the server is confirmed — to the number of bottles still in the user's cellar whose vintage exactly matches the newly-chosen year, using the same matching behavior as the existing 2016/2018/2023 counts.
- **FR-004**: Each user's chosen tracked years MUST be persisted so they remain in effect across page reloads and across devices/sessions for that user — not reset per session.
- **FR-005**: The system MUST validate an entered year against a plausible range (consistent with the range already used elsewhere in the app for vintage-adjacent year fields: 1900–2100) and MUST reject out-of-range or non-numeric input with a visible message, leaving the card's previous value in place.
- **FR-006**: The system MUST let the user cancel an in-progress edit (explicit cancel or clicking away) without persisting any change.
- **FR-007**: If the save triggered by FR-003 fails, the card MUST revert to its last successfully-saved year and count, and the system MUST show a visible error indication (consistent with how other save failures are surfaced in the app, e.g. a toast) rather than leaving the optimistic value showing as if it had saved.
- **FR-008**: The system MUST NOT require the three tracked years to be distinct from each other.
- **FR-009**: Each user's tracked years MUST be private to that user — isolated the same way the rest of their cellar and account data already is — so no user can view or change another user's tracked years.

### Key Entities

- **Tracked Vintage Year** (per user, one per stat-card slot — three per user): the year value a given vintage-count stat card is currently configured to display for that user. Defaults to 2016 / 2018 / 2023 for a user who hasn't customized it. Independent of the `Wine` entity (`specs/003-cellar-inventory-management/spec.md`) it's used to filter/count against — changing a tracked year never modifies any wine record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user sees a stat card's year and count update instantly (perceived as immediate, not waiting on a network round-trip) on confirming an edit, without leaving the stats view.
- **SC-002**: 100% of a user's customized tracked years are still in effect the next time they open the app, on the same or a different device.
- **SC-003**: 100% of invalid year entries are rejected with a visible message, and never leave a card showing a broken, partial, or non-numeric year.
- **SC-004**: 100% of failed saves are visibly surfaced to the user and leave the card showing its last successfully-saved year and count, never the failed optimistic value.
- **SC-005**: A brand-new user sees the existing default experience (2016/2018/2023) with no required setup, preserving today's zero-configuration behavior for anyone who never touches this feature.

## Assumptions

- This is a per-user, backend-persisted preference (synced across the user's devices/sessions), consistent with how the app already persists other meaningful user data (cellar, chat, feedback) — not a browser-local-only preference like the theme toggle (`specs/009-app-shell-appearance/spec.md`), since a deliberately chosen "meaningful year" is the kind of personal customization a collector would expect to follow them, not reset per browser.
- The stats bar keeps exactly three vintage-count cards; this feature changes which year each one tracks, not how many such cards exist or their position in the stats bar. Letting users add/remove cards entirely is out of scope for this spec.
- There is no dedicated "reset to default" control. A user who wants a card back on 2016, 2018, or 2023 retypes it like any other edit — out of scope for this spec to add a separate reset affordance.
- Editing happens inline on the card itself (an edit icon reveals an editable year field directly in place) rather than via a separate modal or settings page, matching the request's "directly... on the card itself" framing and the app's existing preference for lightweight in-place controls (e.g. the inventory +/− steppers) over modals for small edits.
- The valid year range (1900–2100) reuses the bound already applied to the Drink From / Drink To fields elsewhere in the app, rather than introducing a new one.
- Vintage matching for the count reuses the same exact-year-match behavior already used by the existing fixed 2016/2018/2023 counts — a wine with vintage "NV" or left blank never matches a specific tracked year.
