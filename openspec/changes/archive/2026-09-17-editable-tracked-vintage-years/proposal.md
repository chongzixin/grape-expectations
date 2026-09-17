## Why

The stats header currently shows three bottle-count cards hardcoded to the vintages 2016, 2018, and 2023. These years are meaningful to one specific collector (personal milestones), not derived from the data or configurable — every other user sees the same three fixed years, which may be irrelevant to their cellar. The user wants to edit which vintages those cards track, from an edit control on the card itself, with the count updating immediately to reflect the newly chosen year.

## What Changes

- The three fixed-vintage stat cards ("2016 Bottles", "2018 Bottles", "2023 Bottles") become editable: each shows an edit affordance that lets the user type in a different vintage year for that card.
- Each card's label and count update to reflect its currently selected year (e.g. "2019 Bottles" showing the count of bottles with vintage 2019).
- The three selected years are saved per signed-in user and persist across sessions and devices (per the clarifying answer: synced via Supabase, not just local browser storage).
- This only affects the signed-in cellar view — the stats header (and this feature) is not shown in guest mode, which has no cellar to track.

## Capabilities

### Modified Capabilities
- `cellar-analytics`: the stats header's three vintage-count cards change from fixed years to user-editable, per-user-persisted years; the underlying statistics computation generalizes from three hardcoded vintages to three user-chosen ones.

## Impact

- `js/types.ts`: `Stats` shape changes from fixed `count2016`/`count2018`/`count2023` fields to a generalized per-year count keyed by the user's chosen years; `UserProfile` gains the stored preference.
- `js/utils.ts`: `computeStats` takes the three tracked years as an input instead of hardcoding them.
- `js/components/StatsBar.tsx`: stat cards gain an edit affordance and inline year input.
- `supabase/schema.sql` / `supabase/migrations/`: new migration adding a tracked-years column to `profiles`.
- `js/App.tsx`: loads/saves the tracked years alongside the rest of the user's profile data.
