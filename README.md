# SimpleCRM

A small CRM for contacts, follow-up tasks, and AI-assisted outreach drafts. Each account's data is private and protected by Postgres row-level security. The app never sends email: drafts are reviewed, edited, and approved by the user.

Stack: Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Supabase (Postgres, Auth, RLS), AI SDK 7 with OpenRouter (free models first, paid fallback).

## Local setup

Requirements: Node 22+, Docker.

```bash
npm install
npx supabase start          # local Postgres, Auth, and Mailpit (applies migrations and seed)
cp .env.example .env.local  # then fill in values from `npx supabase status`
npm run dev
```

Open http://localhost:3000. The seed creates `demo@example.com` / `password123`. Auth emails, such as password resets, appear in Mailpit at http://127.0.0.1:54324.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Supabase publishable (anon) key |
| `OPENROUTER_API_KEY` | server only | OpenRouter key for the outreach assistant. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | server only | Google OAuth client for creating Gmail drafts (scope `gmail.compose`). Redirect URI: `<site>/api/gmail/callback`. |

Never expose the Supabase service-role key or the AI key in browser code.

## Database

Migrations live in `supabase/migrations`. `supabase/seed.sql` is for local development only.

```bash
npx supabase migration new <name>   # create a migration
npx supabase migration up           # apply new migrations locally
npx supabase db reset               # rebuild local DB from migrations and seed
```

## Deploying to Vercel

1. Create a hosted Supabase project, then apply migrations: `npx supabase link --project-ref <ref>` and `npx supabase db push`. Do not run the seed.
2. Push this repo to Git and import it into Vercel.
3. Set the five environment variables above for Production and Preview. In the Google OAuth client, add `https://<production-domain>/api/gmail/callback` as an authorized redirect URI.
4. In Supabase Auth URL settings, set the Site URL to the production URL and add redirect URLs for production and previews (for example `https://<app>.vercel.app/**` and `https://*-<team>.vercel.app/**`).
5. Deploy, then verify sign-up, password reset, contacts, tasks, and that a second account cannot see the first account's data.
