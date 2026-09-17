## Why

The four baseline capability specs (`cellar-inventory`, `sommelier-chat`, `cellar-analytics`, `auth`) were captured by reading the implementation directly, which pulled in internal function names (`computeStats`, `parseRecommendedWines`, `stripWinesJson`), database table/column names (`wines`, `recommendation_feedback`, `drink_from`, `user_id`), vendor/library specifics (`supabase.auth.signInWithOAuth`, "Claude"), and an internal constant (`DRINKING_STATUS_PRIORITY`). This violates OpenSpec's own authoring guidance to keep specs to externally observable behavior — the test being "if the implementation can change without changing externally visible behavior, it likely does not belong in the spec." As written, renaming a function or restructuring a table would feel like it requires a spec edit even though no user-facing behavior changed.

## What Changes

No behavior changes — this is a wording pass. Every requirement is reworded to describe what the system does and guarantees, not how it's implemented internally. The AI vendor ("Claude") is generalized to "the AI" throughout, since the specific model is an implementation choice already versioned separately (see `CLAUDE.md`). The hidden per-wine recommendation metadata is described by its purpose and guarantee (drives feedback controls, never shown to the user) rather than its exact comment-syntax wire format — including renaming its requirement from "Hidden WINES_JSON metadata block" to drop the internal token name. Every other requirement name is unchanged; only bodies change.

## Capabilities

### Modified Capabilities
- `cellar-inventory`: reword all requirements to drop table/column names, the fuzzy-matching algorithm name, and internal variable names; keep drinking-window status names as plain domain language.
- `sommelier-chat`: reword all requirements to drop table names, function names, the internal priority-order constant name, and the literal `WINES_JSON` comment syntax, replacing the latter with a description of its purpose and guarantee.
- `cellar-analytics`: reword all requirements to drop the `computeStats` function name and internal field names.
- `auth`: reword all requirements to drop Supabase SDK method names, table names, and the trigger name; describe guarantees instead.

## Impact

- Documentation only — no code changes.
