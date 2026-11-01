-- Core CRM tables: profiles, contacts, tasks. All rows are private to their owner.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 50),
  company text check (char_length(company) <= 200),
  job_title text check (char_length(job_title) <= 200),
  status text not null default 'lead' check (status in ('lead', 'active', 'customer', 'inactive')),
  notes text check (char_length(notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index contacts_owner_updated_idx on public.contacts (owner_id, updated_at desc);
create index contacts_owner_company_idx on public.contacts (owner_id, company);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  due_at timestamptz,
  completed_at timestamptz,
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now()
);

create index tasks_owner_due_idx on public.tasks (owner_id, due_at);
create index tasks_contact_idx on public.tasks (contact_id);

-- Keep updated_at current.
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

-- Create a profile for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-level security.
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;

create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Users manage own contacts" on public.contacts
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Users manage own tasks on own contacts" on public.tasks
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.contacts c
      where c.id = contact_id and c.owner_id = (select auth.uid())
    )
  );
