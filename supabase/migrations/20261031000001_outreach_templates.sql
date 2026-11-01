-- Saved outreach: a brief plus email steps with {{placeholders}}, reusable for new campaigns.
-- Versions are immutable rows sharing a family_id; editing saves the next version.
create table public.outreach_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  family_id uuid not null,
  version integer not null check (version >= 1),
  name text not null check (char_length(name) between 1 and 200),
  brief jsonb not null,
  steps jsonb not null,
  created_at timestamptz not null default now(),
  unique (family_id, version)
);

create index outreach_templates_owner_idx on public.outreach_templates (owner_id, created_at desc);

alter table public.outreach_templates enable row level security;

create policy "Users manage own outreach templates" on public.outreach_templates
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
