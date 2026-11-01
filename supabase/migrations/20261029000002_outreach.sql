-- Outreach: campaigns, the contacts in them, and email drafts. Nothing here is ever sent.

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  goal text not null default '' check (char_length(goal) <= 2000),
  audience_notes text check (char_length(audience_notes) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_owner_updated_idx on public.campaigns (owner_id, updated_at desc);

create trigger campaigns_set_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.campaign_contacts (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stage text not null default 'planned' check (stage in ('planned', 'contacted', 'replied', 'done')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  primary key (campaign_id, contact_id)
);

create index campaign_contacts_contact_idx on public.campaign_contacts (contact_id);

-- A draft is one email: optionally for a contact, optionally a step in a campaign sequence.
create table public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete cascade,
  step integer check (step between 1 and 20),
  day_offset integer check (day_offset between 0 and 365),
  subject text not null check (char_length(subject) <= 300),
  body text not null check (char_length(body) <= 20000),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_drafts_campaign_idx on public.outreach_drafts (campaign_id, step);
create index outreach_drafts_owner_idx on public.outreach_drafts (owner_id, updated_at desc);

create trigger outreach_drafts_set_updated_at before update on public.outreach_drafts
  for each row execute function public.set_updated_at();

-- Ownership checks used by the policies below.
create function public.owns_contact(cid uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.contacts where id = cid and owner_id = (select auth.uid()));
$$;

create function public.owns_campaign(cid uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.campaigns where id = cid and owner_id = (select auth.uid()));
$$;

alter table public.campaigns enable row level security;
alter table public.campaign_contacts enable row level security;
alter table public.outreach_drafts enable row level security;

create policy "Users manage own campaigns" on public.campaigns
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Users manage own campaign contacts" on public.campaign_contacts
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and public.owns_campaign(campaign_id)
    and public.owns_contact(contact_id)
  );

create policy "Users manage own drafts" on public.outreach_drafts
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (contact_id is null or public.owns_contact(contact_id))
    and (campaign_id is null or public.owns_campaign(campaign_id))
  );
