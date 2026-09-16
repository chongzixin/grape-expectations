# Contract: Tracked Vintage Years (Supabase `profiles` table)

This app has no REST/GraphQL API layer of its own for non-AI data — the Supabase client, authorized by RLS, *is* the interface boundary (see `specs/003-cellar-inventory-management/plan.md` for the same pattern applied to `wines`). This document is that boundary's contract for the three new columns.

## Read

```ts
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
```

No change to this existing call (already made on session load, per `specs/001-authentication/plan.md`). The returned row now additionally includes:

```ts
{
  // ...existing UserProfile fields...
  tracked_vintage_year_1: number | null;
  tracked_vintage_year_2: number | null;
  tracked_vintage_year_3: number | null;
}
```

Authorization: existing `profiles` RLS `SELECT` policy (`auth.uid() = id`) — unchanged, no new policy needed.

## Write

```ts
const { error } = await supabase
  .from('profiles')
  .update({ [`tracked_vintage_year_${slot}`]: newYear })  // slot: 1 | 2 | 3
  .eq('id', session.user.id);
```

- Exactly one column is written per confirmed edit (the slot the user just edited) — the other two tracked years are untouched by that call.
- `newYear` MUST already have passed client-side validation (4-digit integer, 1900–2100 inclusive) before this call is made — the write itself performs no server-side validation beyond the column's `INTEGER` type.
- Authorization: existing `profiles` RLS `UPDATE` policy (`auth.uid() = id`) — unchanged, no new policy needed. `.eq('id', ...)` targets the row; it is not what makes the write safe — the RLS policy is.
- On success: no response body is needed beyond confirming no `error` — the client already applied the value optimistically (spec FR-003).
- On failure (`error` is set): the caller MUST revert the optimistic local value for that slot and surface a toast (spec FR-007) — this contract does not define retry behavior; a failed write is not automatically retried.

## Client-side derived contract: `computeStats`

Not a network contract, but the other boundary this feature changes — documented here since `/speckit-tasks` will need it.

```ts
// Before (specs/008-cellar-analytics):
function computeStats(wines: Wine[]): Stats

// After:
function computeStats(wines: Wine[], trackedYears: [number, number, number]): Stats
```

`Stats.count2016` / `Stats.count2018` / `Stats.count2023` are removed; `Stats.trackedYearCounts: { year: number; count: number }[]` (always length 3, in slot order) replaces them. Every other `Stats` field and every other caller of `computeStats` is unaffected — `trackedYears` is a new required second argument, so `App.tsx` is the only call site that needs updating (confirmed by search: `computeStats` is called once, in `App.tsx`'s `stats` memo).
