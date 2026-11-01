-- Local development seed only. Never run against production.
-- Creates demo@example.com / password123 with a few contacts and follow-ups.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
  'demo@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"display_name":"Demo User"}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@example.com"}', 'email', now(), now(), now()
);

insert into public.contacts (id, owner_id, first_name, last_name, email, phone, company, job_title, status, notes) values
  ('22222222-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Maya', 'Chen', 'maya@northwind.example', '555-0101', 'Northwind', 'Head of Operations', 'active', 'Met at the logistics expo. Interested in reporting automation.'),
  ('22222222-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Jordan', 'Reyes', 'jordan@acme.example', null, 'Acme', 'CTO', 'lead', 'Referred by Maya.'),
  ('22222222-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Priya', 'Natarajan', 'priya@globex.example', '555-0103', 'Globex', null, 'customer', 'Renewal due in Q1.'),
  ('22222222-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Sam', 'Okafor', null, null, 'Acme', 'Product Manager', 'lead', null),
  ('22222222-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Lena', 'Fischer', 'lena@initech.example', null, 'Initech', 'Founder', 'inactive', 'Paused evaluation last spring.');

insert into public.tasks (owner_id, contact_id, title, due_at, notes) values
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000001', 'Send expo follow-up deck', now() - interval '2 days', null),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000002', 'Intro call with Jordan', now() + interval '3 days', 'Ask about current tooling.'),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000003', 'Prepare renewal proposal', now() + interval '10 days', null);
