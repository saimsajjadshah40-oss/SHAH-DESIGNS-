-- =====================================================================
--  SHAH DESIGNS — Supabase database, storage and security setup
--  Run this whole file once in: Supabase Dashboard → SQL Editor → New query → Run
--  It is safe to run again (it skips / updates what already exists).
--
--  BEFORE running: create your admin user in
--    Authentication → Users → Add user → Create new user
--    (email: saimsajjadshah40@gmail.com, your private password, tick "Auto Confirm User")
--  The last statement in this file marks that user as the administrator.
-- =====================================================================

-- ---------- helpers ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins for select to authenticated using (user_id = auth.uid());

-- true when the signed-in user is listed in public.admins
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- tables ----------
create table if not exists public.settings (
  id         text primary key check (id in ('design', 'whatsapp', 'content', 'social', 'seo')),
  data       text not null default '{}' check (char_length(data) <= 200000),
  draft      text not null default '' check (char_length(draft) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slides (
  id         text primary key default gen_random_uuid()::text,
  sort_order integer not null default 0,
  published  boolean not null default false,
  data       text not null default '{}' check (char_length(data) <= 60000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id         text primary key default gen_random_uuid()::text,
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,100}$'),
  category   text not null default 'graphic' check (char_length(category) <= 40),
  published  boolean not null default false,
  featured   boolean not null default false,
  sort_order integer not null default 0,
  data       text not null default '{}' check (char_length(data) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id         text primary key default gen_random_uuid()::text,
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,100}$'),
  published  boolean not null default false,
  sort_order integer not null default 0,
  data       text not null default '{}' check (char_length(data) <= 60000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id         text primary key default gen_random_uuid()::text,
  published  boolean not null default false,
  sort_order integer not null default 0,
  data       text not null default '{}' check (char_length(data) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id         text primary key default gen_random_uuid()::text,
  name       text not null check (char_length(name) between 1 and 100),
  email      text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone      text not null default '' check (char_length(phone) <= 40),
  service    text not null check (char_length(service) between 1 and 100),
  budget     text not null default '' check (char_length(budget) <= 60),
  details    text not null check (char_length(details) between 1 and 5000),
  status     text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'archived')),
  notes      text not null default '' check (char_length(notes) <= 5000),
  read       boolean not null default false,
  source     text not null default 'website' check (char_length(source) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id         text primary key default gen_random_uuid()::text,
  name       text not null default '' check (char_length(name) <= 200),
  file_id    text not null check (char_length(file_id) <= 200),
  url        text not null check (char_length(url) <= 600),
  category   text not null default 'general' check (char_length(category) <= 60),
  kind       text not null default 'image' check (kind in ('image', 'video', 'document')),
  mime       text not null default '' check (char_length(mime) <= 100),
  size       bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index if not exists slides_order_idx       on public.slides (published, sort_order);
create index if not exists projects_order_idx     on public.projects (published, sort_order);
create index if not exists projects_category_idx  on public.projects (category);
create index if not exists services_order_idx     on public.services (published, sort_order);
create index if not exists testimonials_order_idx on public.testimonials (published, sort_order);
create index if not exists messages_created_idx   on public.messages (created_at desc);
create index if not exists messages_read_idx      on public.messages (read);
create index if not exists media_created_idx      on public.media (created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['settings','slides','projects','services','testimonials','messages','media'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- privileges (Row Level Security below decides what each role may really do) ----------
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.slides, public.projects, public.services, public.testimonials to anon;
grant insert on public.messages to anon;
grant select, insert, update, delete on public.settings, public.slides, public.projects, public.services,
  public.testimonials, public.messages, public.media to authenticated;
grant select on public.admins to authenticated;

-- ---------- Row Level Security ----------
alter table public.settings     enable row level security;
alter table public.slides       enable row level security;
alter table public.projects     enable row level security;
alter table public.services     enable row level security;
alter table public.testimonials enable row level security;
alter table public.messages     enable row level security;
alter table public.media        enable row level security;

-- settings: everyone can read, only the admin can change
drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select to anon, authenticated using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- content tables: visitors see published rows only, the admin sees and edits everything
do $$
declare t text;
begin
  foreach t in array array['slides','projects','services','testimonials'] loop
    execute format('drop policy if exists "%s public read" on public.%I', t, t);
    execute format('create policy "%s public read" on public.%I for select to anon, authenticated using (published or public.is_admin())', t, t);
    execute format('drop policy if exists "%s admin write" on public.%I', t, t);
    execute format('create policy "%s admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- messages: anyone can send (insert only, as a new unread message); only the admin can read / manage
drop policy if exists "messages public insert" on public.messages;
create policy "messages public insert" on public.messages for insert to anon, authenticated
  with check (status = 'new' and read = false and notes = '');
drop policy if exists "messages admin manage" on public.messages;
create policy "messages admin manage" on public.messages for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- media library index: admin only
drop policy if exists "media admin manage" on public.media;
create policy "media admin manage" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage bucket "media" (public read, admin upload) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media admin select" on storage.objects;
create policy "media admin select" on storage.objects for select to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------- make your account the administrator ----------
-- (create the user first — see the top of this file. Re-run just this statement if you add the user later.)
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('saimsajjadshah40@gmail.com')
on conflict (user_id) do nothing;

-- check: this should return one row with your email
select u.email, 'is admin' as status from public.admins a join auth.users u on u.id = a.user_id;
