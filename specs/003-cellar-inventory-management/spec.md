# Feature Specification: Cellar Inventory Management

**Feature Branch**: `003-cellar-inventory-management` (documentation-only backfill — already shipped on `main`; no code branch)

**Created**: 2026-09-16

**Status**: Implemented (Backfilled)

**Input**: Retroactive specification of already-shipped functionality, written by reading `js/App.tsx`, `js/components/CellarView.tsx`, `js/components/AddWineModal.tsx`, `js/components/DuplicateWineModal.tsx`, `js/utils.ts`, and `supabase/schema.sql`, per user request to backfill SpecKit specs for all existing features. Manual entry only — see `specs/004-photo-label-scanning/spec.md` for the OCR capture path, which feeds into this same add-wine form.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a wine manually (Priority: P1)

A collector adds a bottle to their cellar by typing in its details directly, without a photo.

**Why this priority**: The baseline way to populate a cellar; every other capture method (photo scan) ultimately writes through this same form and save path.

**Independent Test**: Open "Add Wine" → "Manual Entry", fill in name and type (the only required fields), save, and confirm the wine appears in the cellar table.

**Acceptance Scenarios**:

1. **Given** the Add Wine modal's Manual Entry tab, **When** the user enters at least a wine name and clicks "Add to Cellar", **Then** a new row is inserted into their cellar scoped to their user id, with `source = 'manual'`, and appears in the cellar table without a page reload.
2. **Given** the Manual Entry form, **When** the user submits with an empty name, **Then** the system blocks the save and prompts for a wine name.
3. **Given** the Manual Entry form, **When** the user leaves optional fields (winery, price, region, etc.) blank, **Then** the wine is still saved with those fields empty/null rather than blocking the save.
4. **Given** a valid vintage year is entered, **When** the user pauses typing, **Then** the system automatically attempts to estimate a drinking window for the field (see `specs/005-drinking-window-tracking/spec.md`) without the user requesting it explicitly.

---

### User Story 2 - Adjust bottle count as bottles are drunk or acquired (Priority: P1)

A collector updates how many bottles of a wine they have as they drink them or buy more, directly from the cellar table.

**Why this priority**: The single most frequent interaction with an established cellar — this is the "keep the inventory honest" loop.

**Independent Test**: In the cellar table, click − on a wine with more than 0 bottles and confirm the count decreases by one and persists after a page reload.

**Acceptance Scenarios**:

1. **Given** a wine with `inventory > 0`, **When** the user clicks the "−" stepper, **Then** the displayed count decreases by 1 immediately (optimistic update) and the change is persisted to the database.
2. **Given** a wine with `inventory = 0`, **When** the user clicks "−", **Then** the count does not go negative (floor of 0).
3. **Given** any wine, **When** the user clicks "+", **Then** the displayed count increases by 1 immediately and persists.
4. **Given** a wine's inventory reaches 0, **When** the cellar view re-renders, **Then** that wine is excluded from the active cellar list, stats, and analytics (it remains in the database but is filtered out of `activeWines` everywhere) rather than being deleted.

---

### User Story 3 - Avoid accidental duplicate entries (Priority: P2)

While adding a wine that closely matches one already in the cellar (e.g. re-scanning a bottle from a case already logged), the collector is offered a merge instead of silently creating a duplicate row.

**Why this priority**: Prevents cellar data from fragmenting into near-duplicate rows, which would corrupt stats, analytics, and chat recommendations that read from the cellar list.

**Independent Test**: Add a wine with the same name/winery/vintage as an existing entry (small spelling variations allowed) and confirm a "Duplicate Found" prompt appears instead of an immediate save.

**Acceptance Scenarios**:

1. **Given** a new wine's name, winery, and vintage closely match (exact or near-match, see Key Entities) an existing cellar wine, **When** the user attempts to save, **Then** a "Duplicate Found" modal shows the existing entry and a preview of the resulting merged inventory/price before any write occurs.
2. **Given** the Duplicate Found modal, **When** the user chooses "Merge — update existing entry", **Then** the existing wine's `inventory` increases by the new quantity and its `price` becomes the quantity-weighted average of old and new price (or whichever of the two is non-null if only one has a price), and no new row is created.
3. **Given** the Duplicate Found modal, **When** the user chooses "Add as separate entry", **Then** a new row is created anyway despite the match (user override).
4. **Given** the Duplicate Found modal, **When** the user chooses "Cancel", **Then** no write occurs and the user returns to the form they were on (photo preview or manual entry) with their entered data intact.
5. **Given** a vintage mismatch between the new wine and an existing entry, **When** duplicate detection runs, **Then** they are never considered duplicates regardless of name/winery similarity (vintage must match exactly, after normalization).

---

### User Story 4 - Find a specific wine quickly (Priority: P2)

A collector with dozens of wines filters, searches, and sorts the cellar table to find what they're looking for.

**Why this priority**: Table usability degrades fast past a handful of wines without filtering/search; this keeps the core inventory view usable at realistic collection sizes.

**Independent Test**: With a mixed cellar, type part of a wine or winery name into the search box and confirm only matching rows remain; then switch the type filter and sort order and confirm the table updates accordingly.

**Acceptance Scenarios**:

1. **Given** the cellar table, **When** the user types into the search box, **Then** rows are filtered live to those whose name, winery, region, country, style, or sub-region contains the query (case-insensitive).
2. **Given** the cellar table, **When** the user clicks a wine-type filter chip (e.g. "Red"), **Then** only wines of that type are shown; "All" resets the filter.
3. **Given** the cellar table, **When** the user changes the sort dropdown (Name / Vintage / Price / Type / Drinking Window), **Then** the table re-sorts accordingly; clicking a sortable column header does the same.
4. **Given** the "Drink Soon" or "Past Peak" stat card is clicked (see `specs/008-cellar-analytics/spec.md`), **When** the click is handled, **Then** the cellar tab opens with sort set to "Drinking Window" so the most urgent bottles surface first.
5. **Given** no wines match the current filter/search combination, **When** the table would render, **Then** an empty state ("No wines found — Adjust filters or add wines to your cellar.") is shown instead of a blank table.

---

### User Story 5 - Share the cellar list outside the app (Priority: P3)

A collector shares their current (filtered) cellar list with a friend via WhatsApp or by copying formatted text.

**Why this priority**: A convenience/social feature layered on top of the core inventory, not required for personal cellar management to function.

**Independent Test**: With at least one wine visible, click "Share", and confirm a formatted, grouped-by-type text summary is available to copy or send via WhatsApp.

**Acceptance Scenarios**:

1. **Given** the browser supports the native Web Share API, **When** the user clicks "Share", **Then** the OS-native share sheet opens directly with the formatted cellar text.
2. **Given** the browser does not support native sharing, **When** the user clicks "Share", **Then** a modal opens showing the formatted text in a read-only textarea with "Copy" and "WhatsApp" buttons.
3. **Given** the share modal is open, **When** the user clicks "Copy", **Then** the text is copied to the clipboard and the button briefly shows "✓ Copied!".
4. **Given** the share modal is open, **When** the user clicks "WhatsApp", **Then** a WhatsApp share link opens in a new tab pre-filled with the formatted text.
5. **Given** the currently filtered/searched wine list is empty, **When** the user views the toolbar, **Then** the Share button is disabled.
6. **Given** the share text is generated, **When** built, **Then** wines are grouped by type in a fixed canonical order (Red, White, Sparkling, Rosé, Dessert, Fortified, then any other type alphabetically) and, within each type, sorted by drinking-window urgency.

### Edge Cases

- What happens when two devices update the same wine's inventory concurrently? The last write wins (simple `UPDATE ... SET inventory = next`); there is no optimistic-concurrency/version check.
- What happens when a duplicate match's winery field is blank on both sides? Two blank winery fields are still treated as a winery match (empty-vs-empty is not a mismatch) — only name + vintage need to align in that case.
- What happens if `addWineToDb` fails (network/DB error)? The function returns `null`, the wine is not added to local state, and the modal does not advance/close — the user's entered data remains visible so they can retry (no error toast is currently shown for a plain manual-entry failure, unlike scan-related failures).
- How is "delete a wine" handled? There is no delete action — a wine is retired from the active view by reducing its inventory to 0; the row remains in the database indefinitely.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let an authenticated user add a wine by manually entering its fields, requiring only a name (type defaults to "Red" if unset).
- **FR-002**: The system MUST let a user increment or decrement a wine's bottle count from the cellar table, persisting the change immediately, with a floor of 0.
- **FR-003**: The system MUST treat any wine with `inventory = 0` as inactive: excluded from the cellar table, search results, stats, analytics, and the sommelier chat's cellar context, while remaining in storage.
- **FR-004**: Before inserting a new wine, the system MUST check it against the user's existing cellar for a likely duplicate (matching vintage exactly, and a fuzzy/near match on both name and winery) and, if found, MUST present the user a choice to merge, add anyway, or cancel rather than silently creating a duplicate row.
- **FR-005**: On merge, the system MUST sum the inventories and compute a quantity-weighted average price when both entries have a price, otherwise keep whichever single price is available.
- **FR-006**: The cellar view MUST support free-text search across name, winery, region, country, style, and sub-region; a type filter; and sorting by name, vintage, price, type, or drinking-window urgency.
- **FR-007**: The system MUST let a user export/share their current (filtered) cellar as human-readable text, grouped by wine type and sorted by drinking-window urgency within each group, via native share, clipboard copy, or a WhatsApp deep link.
- **FR-008**: All wine records MUST be scoped to their owning user via Postgres RLS (Constitution Principle II); the client performs no manual `user_id` filtering on reads.

### Key Entities

- **Wine** (`wines` table): `id`, `user_id`, `name`, `winery`, `vintage` (text — allows "NV"), `price` (nullable numeric), `inventory` (int, default 1), `style`, `country`, `region`, `sub_region`, `type` (Red/White/Sparkling/Rosé/Dessert/Fortified), `source` (`manual` | `photo_scan` | `import`), `drink_from`/`drink_by` (nullable ints), timestamps. Mapped to the camelCase `Wine` TS type via `mapDbWine()`.
- **Duplicate match**: not a stored entity — a runtime comparison (`winesAreDuplicates()`) using normalized-string equality/Levenshtein distance ≤ 2 on name and winery, plus exact normalized vintage equality.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a manually-entered wine and see it reflected in the cellar table in under 5 seconds, with no full-page reload.
- **SC-002**: Bottle-count adjustments reflect in the UI within one interaction (optimistic update) and are durably persisted (survive a page reload).
- **SC-003**: At least 95% of genuine re-entries of an already-cellared wine (same bottle, retyped or rescanned) are caught by duplicate detection rather than silently creating a second row.
- **SC-004**: A cellar of 100+ wines remains searchable/filterable with results updating as the user types, without a perceptible lag on typical hardware.

## Assumptions

- There is no wine-deletion capability by design — reducing inventory to 0 is the supported way to retire a wine from view, keeping historical data for potential future re-stocking or reporting.
- Duplicate detection is a heuristic (Levenshtein distance ≤ 2, exact vintage match) tuned for catching OCR/typo variation, not a guarantee — false negatives (missed duplicates) and, more rarely, false positives are accepted trade-offs.
- No bulk-edit or CSV import capability exists; each wine is added one at a time through the modal (the `source = 'import'` enum value is reserved/defined in the schema but not currently written by any code path).
- The share feature's text format (numbered list grouped by type) is optimized for pasting into a chat app, not for structured re-import elsewhere.
