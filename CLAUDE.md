# Grape Expectations — CLAUDE.md

## What This App Is

Grape Expectations is a **Singaporean wine cellar management and AI sommelier** web app. Users can:
- Manage their wine cellar inventory (add via photo label OCR or manual entry, update bottle counts)
- Get AI-powered wine pairing recommendations tailored to **Singapore local cuisine** (hawker food, zi char, etc.)
- View cellar analytics with an AI-generated "cellar health" summary
- Track drinking windows (`drink_from` / `drink_by` years) per wine

Target users: wine collectors in Singapore. The app launched in its current form in February 2026.

---

## Product Goals

What problem does this solve, for whom, and what does success look like?

_TODO: fill in — e.g. target user persona, core job-to-be-done, success metrics_

---

## Feature Roadmap / Backlog

What features are planned, what has been intentionally cut, and what has been tried and abandoned?

_TODO: fill in — e.g. upcoming features, deprioritised ideas, past experiments and why they were dropped_

---

## User Research & Feedback

Known pain points, observed usage patterns, and recurring user requests.

_TODO: fill in — e.g. feedback collected, support themes, things users consistently ask for_

---

## Business Constraints

Pricing model, partnerships, regulatory considerations, or non-negotiable product requirements.

_TODO: fill in — e.g. free vs. paid tiers, third-party dependencies, any hard constraints on the product_

---

## Metrics

What is being measured and what numbers actually matter for the product?

_TODO: fill in — e.g. key KPIs, events tracked, what "healthy growth" looks like_

---

## Design Decisions & Rationale

Key product trade-offs and the reasoning behind them.

_TODO: fill in — e.g. why Singapore cuisine focus, why no social/sharing features, why conversational UI over search_

---

## Competitive Context

How Grape Expectations differentiates from alternatives like Vivino, CellarTracker, and others.

_TODO: fill in — e.g. positioning, key differentiators, what competitors do that this app deliberately does not_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3.1 + TypeScript, Vite 5.4.2 |
| Backend | Netlify Functions (serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + Magic Link) |
| AI | Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| Styling | Custom CSS with variables (no Tailwind, no CSS-in-JS) |
| Notifications | Sonner |
| Markdown | react-markdown + remark-gfm |

---

## Project Structure

```
grape-expectations/
├── js/                        # React/TypeScript source
│   ├── App.tsx                # Top-level state + handlers (~840 lines); composes the components below
│   ├── AuthPage.tsx           # Google OAuth + Magic Link auth UI
│   ├── types.ts               # TypeScript interfaces (Wine, ChatMessage, Stats…)
│   ├── constants.ts           # Shared lookup tables (TYPE_STYLE, BADGE_STYLES, SOMMELIER_SYSTEM…)
│   ├── utils.ts                # Pure helpers (getDrinkingStatus, computeStats, mapDbWine, callClaude…)
│   ├── supabaseClient.ts      # Supabase singleton (initialized once, imported everywhere)
│   ├── localCuisine.ts        # Singapore cuisine ↔ wine pairing knowledge base
│   ├── loadingMessages.ts     # Witty loading messages shown during AI calls
│   ├── main.tsx               # React entry point
│   └── components/            # Feature-scoped presentational components
│       ├── Header.tsx           # Desktop header + mobile hamburger menu
│       ├── StatsBar.tsx          # Always-visible cellar summary stats
│       ├── CellarView.tsx        # Filter/search/sort table + share
│       ├── AnalyticsView.tsx      # Breakdown charts + AI cellar health summary
│       ├── AddWineModal.tsx       # Photo-scan + manual-entry add flow
│       ├── DuplicateWineModal.tsx  # Merge/add-as-new/cancel prompt
│       ├── ChatDrawer.tsx          # Sommelier chat UI
│       ├── GuestPage.tsx           # Unauthenticated single-dish pairing
│       ├── DrinkingWindowBadge.tsx  # Status badge
│       ├── DonutChart.tsx           # Reusable inline-SVG donut chart
│       └── RichText.tsx              # Small markdown-ish inline renderer
├── css/
│   └── styles.css             # All styles; CSS variables; ge-* class prefix
├── netlify/
│   └── functions/
│       └── claude.js          # Serverless proxy to Anthropic API
├── supabase/
│   ├── schema.sql             # Full DB schema with RLS policies
│   └── migrations/            # Incremental SQL migrations
├── .github/
│   └── workflows/
│       └── migrate.yml        # Auto-applies SQL migrations on push to main
├── index.html
├── vite.config.ts
├── tsconfig.json
└── netlify.toml               # Build config; Node 18; functions dir
```

---

## Local Development

### Prerequisites
You need three environment variables. Create a `.env` file at the project root (gitignored):

```
VITE_SUPABASE_URL=...         # Supabase project URL
VITE_SUPABASE_ANON_KEY=...    # Supabase anon/public key
ANTHROPIC_API_KEY=...         # Anthropic API key (used server-side only)
```

### Commands

| Command | What it does |
|---|---|
| `npm start` | **Use this for full-stack dev.** Runs `netlify dev` — serves the Vite frontend AND the serverless functions together. AI features require this. |
| `npm run dev` | Vite only. Frontend works but all Claude API calls fail (no functions). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Preview the production build locally. |

> **Always use `npm start`** if you're working on anything that touches the AI or serverless functions.

---

## Spec-Driven Development (SpecKit)

This repo uses [GitHub Spec Kit](https://github.com/github/spec-kit) for Spec-Driven Development on non-trivial features. It's installed for the Claude Code integration only (`.claude/skills/speckit-*`), with bash scripts (`.specify/scripts/bash/`).

- **`.specify/memory/constitution.md`** — the project's non-negotiable principles (derived from this file). Every spec/plan is checked against it.
- **`.specify/templates/`** — templates for specs, plans, tasks, and checklists.
- Feature work happens on a numbered branch (e.g. `001-add-tasting-notes`) with its own `specs/<NNN-feature>/` directory holding `spec.md`, `plan.md`, `tasks.md`.

Workflow, in order:
1. `/speckit-specify` — describe the feature; generates `spec.md` (the *what* and *why*, no implementation detail).
2. `/speckit-clarify` *(optional but recommended)* — resolves ambiguous areas in the spec before planning.
3. `/speckit-plan` — generates `plan.md` (the *how*: architecture, data model, contracts), checked against the constitution.
4. `/speckit-tasks` — breaks the plan into an ordered, dependency-aware `tasks.md`.
5. `/speckit-analyze` *(optional)* — cross-checks spec/plan/tasks for consistency before implementing.
6. `/speckit-implement` — executes the tasks.

Use `/speckit-constitution` to amend the constitution itself (never hand-edit `.specify/memory/constitution.md` directly — it must go through that command so the version/Sync Impact Report stay correct).

For small, obvious changes (a copy tweak, a one-line bug fix), skip the ceremony and just make the change — SpecKit is for features substantial enough to need a spec.

---

## Deployment & CI/CD

- **Production**: Netlify, auto-deploys on push to `main`.
- **PR previews**: Netlify creates a branch deploy automatically for every PR — use these to test before merging.
- **DB migrations**: `.github/workflows/migrate.yml` auto-applies any new SQL files in `supabase/migrations/` on push to `main`. GitHub secrets required: `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`.
- `ANTHROPIC_API_KEY` is set in the Netlify dashboard (not in GitHub secrets).

---

## Architecture & Conventions

### Component Structure
Feature-scoped UI lives in `js/components/*.tsx` (see [Project Structure](#project-structure) above) as presentational components that receive state and callbacks as props. Top-level state and the handlers that mutate it (Supabase calls, `callClaude()` calls, duplicate detection, etc.) stay in `js/App.tsx`, which composes the components together. When adding a new feature, prefer this same split — a new component under `js/components/` driven by state/handlers in `App.tsx` — over growing an existing component or adding a second state-management pattern.

### State Management
Plain React hooks only — no Redux, no Context API, no Zustand.
- `useState` for all app state
- `useMemo` for derived data (filtered wine lists, cellar stats)
- `useCallback` for stable handler references
- `useRef` for DOM refs and tracking internal state without re-renders

### Data Flow
1. Supabase client (`js/supabaseClient.ts`) accessed directly from `App.tsx`
2. DB rows fetched → converted to TypeScript types via `mapDbWine()` (snake_case DB → camelCase TS)
3. State updated optimistically in UI, then persisted to Supabase

### Naming Conventions
- **Files**: PascalCase for React components (`App.tsx`), camelCase for utilities (`supabaseClient.ts`)
- **Functions**: `handle*` for event handlers, `compute*` for calculations, `get*` for getters
- **CSS classes**: `ge-*` prefix (e.g., `ge-btn`, `ge-stat`, `ge-hdr`, `ge-wine-card`)
- **DB columns**: `snake_case`; **TypeScript fields**: `camelCase`

### TypeScript
- Strict mode is enabled (`tsconfig.json`). No linting tools (ESLint, Prettier) are configured — TypeScript is the only automated safety net.
- All shared types live in `js/types.ts`.

---

## Database Schema

All tables have **Row Level Security (RLS)** enabled — users can only access their own rows.

| Table | Purpose |
|---|---|
| `profiles` | User display_name, avatar_url (auto-created on signup via trigger) |
| `wines` | Cellar inventory. Key fields: `name`, `winery`, `vintage`, `type`, `style`, `country`, `region`, `sub_region`, `price`, `inventory`, `drink_from`, `drink_by`, `source` |
| `recommendation_sessions` | One row per chat conversation |
| `recommendation_messages` | Individual messages in a session (role: `user` \| `assistant`) |
| `recommendation_feedback` | Per-wine thumbs up/down on Verdict bullets. Key fields: `wine_name`, `winery`, `feedback` (`thumbs_up` \| `thumbs_down`), `in_cellar`, `cellar_wine_id`, `context_query`, `message_id`. One row per (user, message, wine). |

`wines.source` values: `'manual'` | `'photo_scan'` | `'import'`

Drinking window status (`getDrinkingStatus()`): `prime` | `approaching_end` | `past_peak` | `too_young` | `unknown`

---

## AI Integration

All Claude calls go through a serverless proxy at `/.netlify/functions/claude` (`netlify/functions/claude.js`). The frontend never calls the Anthropic API directly.

**Proxy interface:**
```typescript
// POST /.netlify/functions/claude
{
  messages: { role: 'user' | 'assistant', content: string }[],
  system: string,
  maxTokens?: number,     // default: 1800
  imageData?: { base64: string, mediaType: string }
}
// Response: { content: string }
```

**Use cases:**
- **Label OCR**: User photographs a wine label/invoice → image compressed client-side (canvas, max 1600px, 0.85 JPEG quality) → sent to Claude vision → returns structured wine JSON
- **Sommelier chat**: Full cellar inventory + Singapore cuisine knowledge (`localCuisine.ts`) injected into system prompt
- **Cellar analytics**: AI generates a 150–180 word cellar health summary
- **Model**: `claude-sonnet-4-6`

**WINES_JSON block (sommelier responses only):**
Every recommendation response includes a hidden comment block appended after the Verdict:
```
<!-- WINES_JSON
[{"name":"Wine Name","winery":"Winery","in_cellar":true,"cellar_wine_id":"uuid-or-null"},...]
-->
```
This is parsed by `parseRecommendedWines()` (`js/utils.ts`, called from `App.tsx`) to extract per-wine metadata for the feedback system, then stripped from displayed text by `stripWinesJson()`. The Verdict section is split into individual bullet lines in `ChatDrawer.tsx` so 👍/👎 buttons render inline per wine. Do not remove or reformat this block in the system prompt.


---

## Styling

- **No Tailwind, no CSS-in-JS.** All styles in `css/styles.css`.
- **Theming**: CSS variables on `:root` (dark) and `[data-theme="light"]` (light). Dark is the default.
- **Auto-switching**: Theme toggles automatically by time of day — dark 7:30pm–6:30am, light otherwise.
- **Class naming**: `ge-` prefix for all app-specific classes. Modifiers: `btn-o` (outline), `btn-g` (gold/green), `on` (active tab), `show-m` / `hide-m` (mobile visibility).
- **Wine type colors**: Each wine type (Red, White, Sparkling, Rosé, Dessert, Fortified) has a distinct accent color in both themes, defined in `TYPE_STYLE` / `TYPE_STYLE_LIGHT` in `js/constants.ts`.

---

## Gotchas & Things to Avoid

- **`npm run dev` alone breaks AI features.** Always use `npm start` for local development.
- **No test suite.** Validate changes manually; use PR branch deploys on Netlify to smoke-test before merging.
- **RLS is enforced at the DB level.** Don't bypass it client-side — queries automatically filter by the authenticated user.
- **App.tsx holds all top-level state and handlers.** Feature UI itself is already split into `js/components/*.tsx`; new features should follow the same pattern (a new component driven by state/handlers added to `App.tsx`) rather than growing an existing component or introducing a second state-management approach.
- **`recommendation_messages.id` is generated client-side** via `crypto.randomUUID()` before the Supabase insert, and passed explicitly as the `id` field. This ensures `msg.messageId` is always set so per-wine feedback thumbs always render, even if the DB insert fails. Do not change this back to reading the ID from the insert response.

---

## Current Priorities

The `App.tsx` component-extraction refactor is complete — `CellarView`, `AnalyticsView`, `ChatDrawer`, `AddWineModal`, `DuplicateWineModal`, `GuestPage`, `Header`, `StatsBar`, `DrinkingWindowBadge`, `DonutChart`, and `RichText` are all extracted into `js/components/`, with `App.tsx` down to ~840 lines of top-level state and handlers. No other priorities are currently tracked here — see the TODO sections above (Product Goals, Feature Roadmap, etc.) for what's still unfilled.
