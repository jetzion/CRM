-- Free-text tags on contacts.
alter table public.contacts add column tags text[] not null default '{}';

create index contacts_tags_idx on public.contacts using gin (tags);

-- Bulk tag edits. Tags compare case-insensitively; the first spelling wins.
-- security invoker keeps RLS in force, so callers only touch their own contacts.
create function public.add_contact_tags(contact_ids uuid[], new_tags text[]) returns void
language sql security invoker set search_path = '' as $$
  update public.contacts
  set tags = array(
    select t from (
      select distinct on (lower(t)) t, ord from unnest(tags || new_tags) with ordinality as u(t, ord)
      order by lower(t), ord
    ) as first_spelling
    order by ord
  )
  where id = any(contact_ids);
$$;

create function public.remove_contact_tags(contact_ids uuid[], old_tags text[]) returns void
language sql security invoker set search_path = '' as $$
  update public.contacts
  set tags = array(
    select t from unnest(tags) with ordinality as u(t, ord)
    where lower(t) <> all(select lower(o) from unnest(old_tags) as o)
    order by ord
  )
  where id = any(contact_ids);
$$;
