# Implementation Plan: Cellar Inventory Management

**Branch**: `003-cellar-inventory-management` (backfilled; shipped directly on `main`) | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-cellar-inventory-management/spec.md`

**Note**: Retroactive plan documenting the architecture as shipped.

## Summary

Cellar state (`wines: Wine[]`) lives in `App.tsx` and is derived into `activeWines` (inventory > 0) via `useMemo`. `CellarView.tsx` owns filter/search/sort/share UI over that derived list; `AddWineModal.tsx` owns the manual-entry form; `DuplicateWineModal.tsx` intercepts saves that match an existing wine. All writes go through Supabase's JS client directly from `App.tsx` handlers, with RLS enforcing per-user scoping.

## Technical Context

**Language/Version**: TypeScript (React 18.3.1, Vite 5.4.2)

**Primary Dependencies**: `@supabase/supabase-js`, plain React hooks

**Storage**: Supabase Postgres `wines` table (RLS-scoped to `auth.uid() = user_id`)

**Testing**: None — no automated test suite (Constitution Principle I); verified manually via Netlify PR previews

**Target Platform**: Web (desktop + mobile)

**Project Type**: Single-page web app; no new backend endpoints (writes go directly to Supabase from the client, authorized by RLS)

**Performance Goals**: Inventory +/- and add-wine are optimistic (local state updates immediately, DB write happens async) so the UI never blocks on network round-trip for these interactions

**Constraints**: No delete endpoint by design (see spec.md Assumptions) — inventory floor of 0 is the retirement mechanism

**Scale/Scope**: Designed for a personal collector's cellar (tens to low hundreds of unique wines), not a commercial/warehouse inventory scale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle II (RLS Is the Authorization Boundary)**: PASS — every `wines` query relies on the table's RLS policies (`schema.sql:47-57`); `App.tsx` never adds a manual `.eq('user_id', ...)` filter on reads, and inserts pass `user_id: session.user.id` only to satisfy the `WITH CHECK` policy, not as an authorization mechanism of its own.
- **Principle III (AI Calls Go Through the Serverless Proxy Only)**: PASS (partially applicable) — the drinking-window auto-estimation triggered from this form (`handleVintageChange`) calls `callClaude()`, which goes through the proxy; see `specs/005-drinking-window-tracking/spec.md` for that sub-feature's own plan.
- **Principle IV (Follow Existing Conventions)**: PASS — `ge-*` CSS classes throughout `CellarView.tsx`/`AddWineModal.tsx`/`DuplicateWineModal.tsx`; plain hooks; snake_case DB ↔ camelCase TS via `mapDbWine()`.
- **Principle V (Don't Split App.tsx Prematurely)**: PASS — `CellarView`, `AddWineModal`, `DuplicateWineModal`, `DrinkingWindowBadge` are already extracted as components; the state and mutation handlers they're driven by remain in `App.tsx`, which is the existing accepted pattern (props down, callbacks up).

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-cellar-inventory-management/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
js/
├── App.tsx                          # wines state, activeWines memo, updateInventory, addWineToDb,
│                                     #   mergeWithExisting, addWine, duplicate-resolution handlers
├── types.ts                          # Wine, NewWineForm types
├── utils.ts                          # mapDbWine, winesAreDuplicates, normalizeWineName, levenshteinDistance
└── components/
    ├── CellarView.tsx                 # Filter/search/sort table, share modal, formatCellarText()
    ├── AddWineModal.tsx                # Manual Entry tab (shared with photo-scan preview, spec 004)
    └── DuplicateWineModal.tsx           # Merge / Add as new / Cancel prompt

supabase/
└── schema.sql                          # wines table + RLS policies
```

**Structure Decision**: Existing component-extraction pattern followed — presentational table/modal components receive state and callbacks as props from `App.tsx` rather than owning Supabase calls themselves (only `CellarView`'s share feature is fully self-contained since it needs no persistence).

## Key Flows (as built)

1. **Manual add**: `AddWineModal` (Manual Entry tab) edits `newWine: NewWineForm` (all-string form state) via `setNewWine`. On submit, `App.addWine()` validates the name is non-empty, checks `winesAreDuplicates()` against all existing wines, and either opens `DuplicateWineModal` (via `duplicatePending` state) or calls `addWineToDb(newWine, 'manual')` and appends the returned `Wine` to local state.
2. **Inventory step**: `CellarView` renders `−`/`+` buttons calling `App.updateInventory(id, delta)`, which computes `Math.max(0, wine.inventory + delta)`, updates local state immediately, then fires an async `supabase.from('wines').update(...)`.
3. **Duplicate resolution**: `winesAreDuplicates(existing, form)` in `utils.ts` normalizes vintage/name/winery (NFD-strip diacritics, lowercase, strip non-alphanumerics) and requires exact vintage match + (exact or Levenshtein ≤ 2) name match + (exact, Levenshtein ≤ 2, or both-empty) winery match. `App.mergeWithExisting()` computes the merged inventory/price; `DuplicateWineModal` previews the same computation independently for display.
4. **Filter/search/sort**: `CellarView` computes `filteredWines` via `useMemo` over `wines` (already pre-filtered to `activeWines` by the caller), `filter`, `search`, `sort` — all client-side, no server round-trip.
5. **Share**: `formatCellarText()` (pure function in `CellarView.tsx`) groups `filteredWines` by type in `TYPE_ORDER`, sorts within group by `DRINKING_STATUS_PRIORITY` then `drinkBy`, and builds a plain-text numbered summary consumed by clipboard copy, `navigator.share`, or a `wa.me` link.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — table intentionally omitted.
