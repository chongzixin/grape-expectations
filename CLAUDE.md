# Grape Expectations — CLAUDE.md

## What This App Is

Grape Expectations is a **Singaporean wine cellar management and AI sommelier** web app. Users can:
- Manage their wine cellar inventory (add via photo label OCR or manual entry, update bottle counts)
- Get AI-powered wine pairing recommendations tailored to **Singapore local cuisine** (hawker food, zi char, etc.)
- View cellar analytics with an AI-generated "cellar health" summary
- Track drinking windows (`drink_from` / `drink_by` years) per wine

Target users: wine collectors in Singapore. The app launched in its current form in February 2026.

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
│   ├── App.tsx                # Main component — all feature logic (~2000 lines)
│   ├── AuthPage.tsx           # Google OAuth + Magic Link auth UI
│   ├── types.ts               # TypeScript interfaces (Wine, ChatMessage, Stats…)
│   ├── supabaseClient.ts      # Supabase singleton (initialized once, imported everywhere)
│   ├── localCuisine.ts        # Singapore cuisine ↔ wine pairing knowledge base
│   ├── loadingMessages.ts     # Witty loading messages shown during AI calls
│   └── main.tsx               # React entry point
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

## Deployment & CI/CD

- **Production**: Netlify, auto-deploys on push to `main`.
- **PR previews**: Netlify creates a branch deploy automatically for every PR — use these to test before merging.
- **DB migrations**: `.github/workflows/migrate.yml` auto-applies any new SQL files in `supabase/migrations/` on push to `main`. GitHub secrets required: `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`.
- `ANTHROPIC_API_KEY` is set in the Netlify dashboard (not in GitHub secrets).

---

## Architecture & Conventions

### Component Structure
`js/App.tsx` is intentionally monolithic. All state, all feature logic, all UI live here. **The first priority task is to refactor this into smaller components** (see [Current Priorities](#current-priorities) below).

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
| `recommendation_feedback` | Thumbs up/down on AI-recommended wines (for future personalization) |

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

---

## Styling

- **No Tailwind, no CSS-in-JS.** All styles in `css/styles.css`.
- **Theming**: CSS variables on `:root` (dark) and `[data-theme="light"]` (light). Dark is the default.
- **Auto-switching**: Theme toggles automatically by time of day — dark 7:30pm–6:30am, light otherwise.
- **Class naming**: `ge-` prefix for all app-specific classes. Modifiers: `btn-o` (outline), `btn-g` (gold/green), `on` (active tab), `show-m` / `hide-m` (mobile visibility).
- **Wine type colors**: Each wine type (Red, White, Sparkling, Rosé, Dessert, Fortified) has a distinct accent color in both themes, defined in `TYPE_STYLE` in `App.tsx`.

---

## Gotchas & Things to Avoid

- **`googleapis` and `apify-client`** are legacy unused dependencies from earlier scraper/sheets integrations (see Current Priorities).
- **`npm run dev` alone breaks AI features.** Always use `npm start` for local development.
- **No test suite.** Validate changes manually; use PR branch deploys on Netlify to smoke-test before merging.
- **RLS is enforced at the DB level.** Don't bypass it client-side — queries automatically filter by the authenticated user.
- **App.tsx is very large.** Until the refactor happens, add new UI/logic there and follow existing patterns. Don't split prematurely without a plan.

---

## Current Priorities

1. **Refactor `js/App.tsx` into smaller components.** The file is ~2000 lines. Break it into feature-scoped components (e.g., `CellarView`, `AnalyticsView`, `SommelierChat`, `WineCard`, `AddWineModal`) while keeping the top-level state in `App.tsx` or moving to a lightweight context if needed.
2. **Remove unused legacy dependencies.** `googleapis` and `apify-client` are remnants of earlier scraper/Google Sheets integrations and are not used anywhere in the current codebase. Remove them from `package.json` and run `npm install`.
