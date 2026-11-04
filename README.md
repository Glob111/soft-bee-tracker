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
- Yarn 4 (`corepack enable`; version pinned in `package.json`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB and type generation)

## Getting started

```bash
# Install dependencies
yarn install

# Copy environment template and fill in values
cp .example.env .env

# Start the dev server (Turbopack)
yarn dev
```

Restart `yarn dev` after editing `.env` — env files are read at startup. `.env` is gitignored; never commit it.

To develop against local Supabase (`supabase start`), create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and the publishable and secret keys printed by `supabase status`. Next.js loads `.env.local` after `.env`, so it overrides the hosted values; delete it to switch back.

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL, exactly `https://<project-ref>.supabase.co` (local: `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser + server client) |
| `SUPABASE_SECRET_KEY` | Service role key — server-only, used only by `createServiceClient()` in `src/lib/supabase/server.ts`. Never prefix it with `NEXT_PUBLIC_`. |

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Production build |
| `yarn start` | Serve production build |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Auto-fix ESLint issues |
| `yarn test` | Run the Vitest test suite |
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
└── migrations/           # SQL migrations (YYYYMMDDHHmmss_description.sql)

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
  types.ts       # Optional request/response interfaces
  mappers.ts     # Optional DB row ↔ domain mapping
```

Components import hooks from `@/lib/api/<feature>`. They must not call Supabase, `fetch`, or Axios directly.

### State management

| Concern | Where |
|---------|-------|
| Project, project-rate, and auth-profile async state | Zustand stores in `lib/api/<feature>/store.ts` or `<operation>.store.ts` |
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
supabase start

# Apply migrations
supabase db push

# Regenerate TypeScript types after schema changes
yarn sb:db:types
```

Migrations use 14-digit UTC timestamps: `YYYYMMDDHHmmss_description.sql`. All tables must have RLS enabled. See `.cursor/rules/supabase-db.mdc` for policy conventions.

## Code quality

- **ESLint** + **Prettier** — run `yarn lint` before committing
- **Husky** pre-commit hooks via lint-staged
- Path alias: `@/*` → `src/*`

## AI agent setup

Each team member configures their own AI tool. Every tool reads the same project rules (structure, commands, style, data access, and secrets) from its own instruction file:

| Tool | Instruction files |
|------|-------------------|
| Claude Code | `CLAUDE.md` |
| Codex and other `AGENTS.md`-aware agents | `AGENTS.md`, `CODEX.md` |
| Cursor | `.cursor/rules/*.mdc` |
| Windsurf | `.windsurfrules` |

Detailed Cursor rules, referenced by the other files:

| File | Purpose |
|------|---------|
| `.cursor/rules/ai-standing-orders.mdc` | Global coding standards |
| `.cursor/rules/state-manager.mdc` | TanStack Query + Zustand patterns |
| `.cursor/rules/lib-services.mdc` | `lib/api` module layout |
| `.cursor/rules/components-ui.mdc` | Component and UI conventions |
| `.cursor/rules/app-nextjs.mdc` | App Router page conventions |
| `.cursor/rules/supabase-db.mdc` | Migrations, RLS, and Postgres functions |
| `.cursor/rules/naming-conventions.mdc` | File and folder naming (`kebab-case`) |
| `epics/` | Feature epics (auth, tracker, workspace layout) |

When you change a shared rule, update every instruction file that states it so the tools stay in agreement.

### Verify your setup

1. `yarn install && yarn test` passes.
2. `yarn dev` starts and `/login` loads without a Supabase env error.
3. `git status` does not list `.env`.
4. Ask your agent: *"What are this repo's rules for data access and secrets?"* The answer should mention importing from `@/lib/api/<entity>` only, no direct Supabase or `fetch` calls in UI, and that `SUPABASE_SECRET_KEY` is server-only.

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
