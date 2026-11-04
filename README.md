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
- npm or Yarn 4
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB and type generation)

## Getting started

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .example.env .env

# Start the dev server (Turbopack)
npm run dev
```

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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser + server client) |
| `SUPABASE_SECRET_KEY` | Service role key (server-only admin operations) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run test` | Run the Vitest test suite |
| `npm run sb:db:types` | Regenerate `src/types/supabase-schema.ts` from local Supabase |

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
supabase start

# Apply migrations
supabase db push

# Regenerate TypeScript types after schema changes
npm run sb:db:types
```

Migrations use 14-digit UTC timestamps: `YYYYMMDDHHmmss_description.sql`. All tables must have RLS enabled. See `.cursor/rules/supabase-db.mdc` for policy conventions.

## Code quality

- **ESLint** + **Prettier** — run `npm run lint` before committing
- **Husky** pre-commit hooks via lint-staged
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

## AI change workflow

How we make a change with an AI agent (Claude Code, Codex, Cursor, Windsurf). The agent does the typing; you own the result. Every step ends with a check you do yourself.

Agent rules live in `CLAUDE.md`, `AGENTS.md`, `CODEX.md`, `.windsurfrules`, and `.cursor/rules/*.mdc`.

### The cycle

#### 1. Plan

Ask the agent to read the relevant code and propose the change **before** it edits anything.

- Give it the goal and the Jira key, e.g. "SBT-43: fix the `set-state-in-effect` lint error in `use-mobile.ts`".
- Check: the plan names the files it will touch and who uses them, keeps the change small, and adds no new dependencies or schema/auth changes without asking.

#### 2. Code

Let the agent make the change on its own branch from `dev` (e.g. `fix/sbt-43-...`).

- Check: no secrets in code, no direct Supabase or `fetch` calls in UI, and file names in kebab-case. See the agent rules.

#### 3. Review the diff

Read every line of `git diff` before you run anything.

- Does the diff do only what the plan said?
- Is the old behavior kept, unless the plan changed it on purpose?
- Are new tests testing real behavior, not just mocks?
- Do the agent's checks pass: `npx eslint <changed files>`, `npx tsc --noEmit`, and `yarn test`?

#### 4. Run

Check it in the real app, not just in tests.

- `yarn build` passes.
- `yarn dev`, then use the feature the way a user would. Unit tests can't show you this.
- Check the `yarn dev` terminal and the browser console for new errors.

#### 5. Review

Open a PR into `dev` that links the Jira ticket, describes the change, and gives "How to verify" steps. A teammate reviews it. Then move the ticket to **To Review** and add a comment with the PR link.

### Worked example: SBT-43

**Change:** `src/hooks/use-mobile.ts` called `setState` directly inside `useEffect`, which the `react-hooks/set-state-in-effect` lint rule flags.

| Step | What happened |
|------|---------------|
| Plan | The agent found the only consumer (`components/ui/sidebar.tsx`) and proposed `useSyncExternalStore` with `matchMedia`, with no new dependencies. The server snapshot returns `false` to keep the old desktop-first render. |
| Code | It rewrote the hook as `subscribe` / `getSnapshot` / `getServerSnapshot` helpers and added `use-mobile.test.ts` (node environment, stubbed `window.matchMedia`). |
| Review the diff | We confirmed `matches` on `(max-width: 767px)` equals the old `innerWidth < 768`, and that cleanup removes the same listener. ESLint, `tsc`, and tests (34) pass. |
| Run | `yarn build` passes. A developer checked it manually: signed in, opened `/dashboard`, and resized the browser across 768px. The sidebar switches between the mobile sheet and the desktop rail, with no new errors in the console or the `yarn dev` terminal. |
| Review | The PR goes into `dev` and links SBT-43. |
