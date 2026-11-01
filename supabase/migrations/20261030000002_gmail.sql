-- Gmail connection per user, and the Gmail draft created from each outreach draft.

create table public.gmail_connections (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  email text not null,
  refresh_token text not null,
  created_at timestamptz not null default now()
);

alter table public.gmail_connections enable row level security;

create policy "Users manage own Gmail connection" on public.gmail_connections
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

alter table public.outreach_drafts add column gmail_draft_id text;
