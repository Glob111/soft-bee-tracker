<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Project context and commands

- Stack: Next.js 16, React 19, TypeScript 6, Supabase, TanStack Query, Zustand 5, and Vitest.
- Package manager: Yarn 4.
- Run unit tests with `yarn test`.
- Run targeted ESLint for touched files before broader validation; the repository may contain unrelated legacy formatting findings.

## Data and state architecture

- Keep Supabase access in `src/lib/api/<entity>/queries.ts` and `mutations.ts`; UI code must not call Supabase directly.
- Export each domain's public contract through `src/lib/api/<entity>/index.ts`.
- Zustand-backed domains keep typed stores beside their API files under `src/lib/api/<entity>/`.
- Keep independent async operations in independent stores (for example, project loading and project creation); do not share one `isLoading` or `error` lifecycle between unrelated operations.
- Keep entities separate: `projects` and `project-rates` must not share a store or domain types.
- Do not duplicate the same server data in both TanStack Query and Zustand. Follow the state owner already selected for that domain.

## Database / RLS

- Follow `.cursor/rules/supabase-db.mdc` for migrations and RLS.
- Role checks in RLS must use JWT helpers (`private.is_manager_or_admin()`, `private.jwt_role()`), never `select … from public.users` for role.

## Secrets and environments (strict)

- Keep local secrets in `.env` (gitignored by `.env` and `.env.*`); `.example.env` lists variable names only, never values.
- Never commit, log, print, or paste secret values. Agents must not read or echo `.env` values; when debugging, check only whether each variable is set.
- `SUPABASE_SECRET_KEY` is server-only: read it only in `createServiceClient()` in `src/lib/supabase/server.ts`. Never import `lib/supabase/server` from `"use client"` modules or from `lib/supabase/client`.
- Never expose a secret through a `NEXT_PUBLIC_*` variable; only the Supabase URL and anon key are public.
- Each developer works against their own environment (local Supabase via `supabase start` or a personal dev project). Do not run migrations or write SQL against shared or production projects without team agreement.
- Ask before changing auth, security-sensitive behavior, or database schema.

## Scope filter for frontend conventions

- Apply the function conventions below only when editing `src/components/**` and `src/app/**/page.tsx`.
- For changes outside those paths, prioritize local file conventions and existing project rules.

## Function conventions for scoped files

- Follow `.cursor/rules/naming-conventions.mdc` for file and folder paths (`kebab-case` only).
- Prefer named function declarations and extracted handler functions over inline JSX lambdas.
- For callbacks that must return `void`, keep async work in a separate function and invoke it via a `void`-safe wrapper.
