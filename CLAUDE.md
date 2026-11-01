@AGENTS.md

# SimpleCRM

Small private CRM: contacts, follow-up tasks, AI outreach drafts, campaigns, and Gmail drafts. See `README.md` for setup and `PLAN.md` for scope.

## Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, Supabase (Postgres, Auth, RLS), AI SDK 7 with OpenRouter, zod 4.

## Commands

- `npm run dev` - dev server (hot reload).
- `npm run build && npm run start` - production server. Port 3000 is often a long-running `npm run start`; it serves the last build, so rebuild and restart it to see changes.
- `npx tsc --noEmit && npx eslint src` - check before reporting done.
- `npx supabase start | status | migration up | db reset` - local database.

## Layout

- `src/app/(app)/<area>/` - pages, `actions.ts` server actions, and small client components per area (contacts, tasks, outreach, campaigns, settings).
- `src/app/api/outreach/route.ts` - AI chat endpoint. `src/app/api/gmail/` - Google OAuth connect and callback.
- `src/lib/outreach.ts` - plan schema, AI tool, and `{{placeholder}}` merge fields. `src/lib/outreach-prompt.ts` - system prompt.
- `src/lib/templates.ts` - saved outreach (brief + email steps with placeholders). Versions are immutable rows sharing `family_id`; editing inserts the next version.
- `src/lib/gmail.ts` - Gmail REST calls (`gmail.compose` scope only).
- `supabase/migrations/` - schema and RLS. Every user table has `owner_id` referencing `auth.users` with `on delete cascade`.

## Rules

- The app never sends email. Gmail integration only creates drafts.
- Only approved drafts go to Gmail. AI drafts start as "draft"; drafts written by the user with "Skip AI Assists Review" are saved approved, with only placeholders filled in. Campaigns created from saved outreach start as "draft" too.
- Contact email and phone are never sent to the AI (`AI_FIELDS`).
- Server actions take ids from hidden form inputs, never `.bind()` (bound actions hang on no-JS posts).
- Decide deterministic things in code, not in the prompt (for example the sign-off line). Free models follow conditional instructions unreliably.
- Use `requireUser()` from `src/lib/supabase/server` in actions and pages; rely on RLS for ownership.

## Testing in the browser

Use the local Supabase (`enable_confirmations = false`), so a throwaway user can sign up at `/signup` with any `test+<n>@example.com`. Drive it with Playwright from the scratchpad, not the repo. Remove test users afterwards with `delete from auth.users where email = '...'` via `docker exec supabase_db_CRM psql -U postgres`; their data cascades.
