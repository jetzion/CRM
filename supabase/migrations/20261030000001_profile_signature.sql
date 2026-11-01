-- Email signature appended to outreach drafts.

alter table public.profiles
  add column signature text not null default '' check (char_length(signature) <= 1000);
