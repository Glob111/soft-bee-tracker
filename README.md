# Soft Bee Tracker

Production Next.js application for crew time tracking, project management, and reporting. Built with Supabase for auth and data, Zustand and TanStack Query for state management, and shadcn/ui for the interface.

## Tech stack

| Layer | Tools |
|-------|-------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/) |
| Database & auth | [Supabase](https://supabase.com/) (Postgres, RLS, SSR cookies) |
| State management | [Zustand 5](https://zustand.docs.pmnd.rs/) typed stores, [TanStack Query](https://tanstack.com/query) |
| Auth flows | Supabase Auth, TanStack Query mutations in `lib/api/auth` |
| Forms & validation | React Hook Form, Zod |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |

## Prerequisites

- Node.js 20+
- Yarn 4 (via `corepack enable`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker (for local DB and type generation)

## Getting started

```bash
# Install dependencies
yarn install

# Start local Supabase and apply all migrations + seeds
yarn sb:start
yarn sb:reset

# Copy the local env template, then paste "Publishable key" and "Secret key" from `yarn sb:status`
cp .example.env .env.local

# Start the dev server (Turbopack)
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with one of the [test accounts](#test-accounts).

### Environments

Local/test and production settings never share a file.

| Environment | Template | Where values live | Supabase |
|-------------|----------|-------------------|----------|
| Local development | `.example.env` | `.env.local` (gitignored) | Local stack, `http://127.0.0.1:54321` |
| Automated tests (Vitest, Playwright, CI) | `.example.env` (`PLAYWRIGHT_*` section) | `vitest.setup.ts`, `playwright.config.ts`, `.github/workflows/ci.yml` — placeholder keys only | Local only — non-local URLs are rejected (`src/lib/supabase/env-safeguards.ts`) |
| Production | Same variable names as `.example.env` | Hosting provider env settings, never in the repo | Production project (Settings → API Keys) |

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key (browser + server client) |
| `SUPABASE_SECRET_KEY` | Secret / service role key — **server-only**, bypasses RLS, never `NEXT_PUBLIC_` |

All `.env` and `.env.*` files are gitignored; only the `.example.env` template (no secrets) is committed.

### Test accounts

Created by `supabase/seeds/01_users.sql` on every `yarn sb:reset`. Local only — seeds are never applied to production.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@softbee.dev` | `Password1` |
| Manager | `manager@softbee.dev` | `Password1` |
| Staff (`worker` role) | `worker@softbee.dev` | `Password1` |

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Production build |
| `yarn start` | Serve production build |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Auto-fix ESLint issues |
| `yarn test` | Run the Vitest test suite |
| `yarn test:e2e` / `yarn test:e2e:ui` | Run Playwright E2E tests (headless / UI mode) |
| `yarn sb:start` / `yarn sb:stop` | Start / stop the local Supabase stack (Docker) |
| `yarn sb:status` | Show local URLs and keys |
| `yarn sb:reset` | Recreate the local DB: apply all migrations, then seeds |
| `yarn sb:test` | Run pgTAP database tests from `supabase/tests/` against the local DB |
| `yarn sb:db:types` | Regenerate `src/types/supabase-schema.ts` from local Supabase |

## Project structure

```text
src/
├── app/                  # Next.js App Router (pages, layouts, globals)
│   └── lib/              # App-scoped utilities (supabase clients, legacy api)
├── components/
│   └── ui/               # shadcn/ui primitives
├── constants/            # Route lists and shared constants
├── features/             # Feature UI modules
├── lib/
│   ├── api/              # Domain data access and Zustand stores
│   └── utils.ts          # Shared helpers (cn, etc.)
├── providers/            # React context providers (QueryClient)
└── types/                # Shared TypeScript types (Database, ApiError)

supabase/
├── config.toml           # Local Supabase configuration
├── migrations/           # SQL migrations (YYYYMMDDHHmmss_description.sql)
└── tests/database/       # pgTAP tests (`yarn sb:test`)

epics/                    # Feature epics and task specifications
.cursor/rules/            # AI agent coding standards
```

## Architecture

### Data access (`lib/api`)

Each domain gets a folder under `src/lib/api/<feature>/`:

```text
src/lib/api/users/
  index.ts       # Public barrel — components import from here only
  queries.ts     # Read helpers
  mutations.ts   # Write helpers
  store.ts       # Optional typed Zustand state and async actions
  types.ts       # Optional aliases and Pick/Omit of generated database types
  mappers.ts     # Only when a value changes at runtime
```

Components import hooks from `@/lib/api/<feature>`. They must not call Supabase, `fetch`, or Axios directly. Domain types alias generated database types. A mapper exists only when a value changes at runtime. See `.cursor/rules/lib-services.mdc`.

### State management

| Concern | Where |
|---------|-------|
| Project and project-rate async state | Zustand stores in `lib/api/<feature>/store.ts` |
| Cached server data | TanStack Query hooks in `lib/api/**` |
| Ephemeral UI state | Zustand stores in `features/<name>/store/` |
| Auth mutations | `useSignIn`, `useSignUp`, `useSignOut` in `lib/api/auth` |

See `.cursor/rules/state-manager.mdc` for full patterns.

### UI components

- shadcn/ui primitives live in `src/components/ui/`
- Compose with Tailwind utilities and the `cn()` helper from `@/lib/utils`
- Add new primitives: `npx shadcn@latest add <component>`

## Supabase

```bash
# Start local Supabase (requires Docker)
yarn sb:start

# Apply migrations + seeds to the local DB (drops local data)
yarn sb:reset

# Apply migrations to the local database
supabase db push

# Apply migrations to the linked hosted project (asks for confirmation)
supabase db push --remote

# Regenerate TypeScript types after schema changes
yarn sb:db:types
```

### Production migrations

> **Warning:** `supabase db push` targets the **local** database. The linked hosted project needs `supabase db push --remote`, and the CLI asks for confirmation.

Production migrations are deployed **manually only**: after the migrations are merged to `main`, the person responsible for the release opens **Actions → Deploy database migrations → Run workflow** with the `main` branch selected (other branches are skipped). Nothing deploys automatically on merge.

1. `validate-db.yml` runs first: all migrations + seeds on a clean database, schema lint, pgTAP tests (`supabase/tests`), DB types.
2. The `deploy` job waits for approval in the `production` GitHub Environment, prints the pending migrations (`db push --dry-run`) and applies them. Seeds are never applied to production.

Repository setup (owner, one time): create the `production` environment under **Settings → Environments**, add required reviewers, and add the `SUPABASE_DB_URL` secret (production connection string) to it.

Manual fallback, by the person responsible for the release:

```bash
supabase link --project-ref <production-project-ref>
supabase db push --remote --dry-run   # review pending migrations
supabase db push --remote             # applies migrations only; asks for confirmation. Seeds are not applied
```

Migrations use 14-digit UTC timestamps: `YYYYMMDDHHmmss_description.sql`. All tables must have RLS enabled. See `.cursor/rules/supabase-db.mdc` for policy conventions.

## Code quality

- **ESLint** + **Prettier** — run `yarn lint` before committing
- **Husky** pre-commit hooks via lint-staged
- **CI** (`.github/workflows/ci.yml`) — lint, unit tests, build, secret-leak scan and Playwright safeguards on every PR, plus `validate-db.yml` in parallel: all migrations + seeds on a clean database, `supabase db lint`, pgTAP tests (`yarn sb:test`: seeded test accounts, RLS on every public table), and a check that `src/types/supabase-schema.ts` is up to date
- **DB deploy** (`.github/workflows/deploy-db.yml`) — manually triggered, validated, approval-gated `supabase db push` to production from `main`
- Path alias: `@/*` → `src/*`

## Agent / contributor docs

| File | Purpose |
|------|---------|
| `.cursor/rules/ai-standing-orders.mdc` | Global coding standards |
| `.cursor/rules/state-manager.mdc` | TanStack Query + Zustand patterns |
| `.cursor/rules/lib-services.mdc` | `lib/api` module layout |
| `.cursor/rules/naming-conventions.mdc` | File and folder naming (`kebab-case`) |
| `CLAUDE.md` | Claude-specific standing orders |
| `epics/` | Feature epics (auth, tracker, workspace layout) |

## Planned routes

| Route | Purpose |
|-------|---------|
| `/login` | Authentication |
| `/register` | User registration |
| `/dashboard` | Post-login landing |
| `/tracker` | Time tracking |
| `/crew` | Crew management |
| `/projects` | Project management |
| `/reports` | Reporting |
| `/profile` | User profile settings |
