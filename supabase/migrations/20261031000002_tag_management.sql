-- Rename or delete a tag on all of the caller's contacts. Matching ignores case.
-- Renaming onto a tag a contact already has merges them. security invoker keeps RLS in force.
create function public.rename_contact_tag(old_tag text, new_tag text) returns void
language sql security invoker set search_path = '' as $$
  update public.contacts
  set tags = array(
    select t from (
      select distinct on (lower(t)) t, ord
      from unnest(tags) with ordinality as u(x, ord),
        lateral (select case when lower(x) = lower(old_tag) then new_tag else x end as t) as renamed
      order by lower(t), ord
    ) as merged
    order by ord
  )
  where exists (select 1 from unnest(tags) as x where lower(x) = lower(old_tag));
$$;

create function public.delete_contact_tag(old_tag text) returns void
language sql security invoker set search_path = '' as $$
  update public.contacts
  set tags = array(
    select x from unnest(tags) with ordinality as u(x, ord)
    where lower(x) <> lower(old_tag)
    order by ord
  )
  where exists (select 1 from unnest(tags) as x where lower(x) = lower(old_tag));
$$;
