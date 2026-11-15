-- =====================================================================
-- OUR LITTLE WORLD — Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 0. Access control: only two allow-listed emails can ever become members
-- ---------------------------------------------------------------------
create table if not exists public.allowed_emails (
  email text primary key
);

create table if not exists public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  slot smallint unique check (slot in (1, 2)),
  created_at timestamptz not null default now()
);

-- When an auth user is created, make them a member only if allow-listed
-- and only if there is a free slot (max 2 members, ever).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_slot smallint;
begin
  if exists (select 1 from public.allowed_emails a where lower(a.email) = lower(new.email)) then
    select s into free_slot from generate_series(1, 2) s
      where s not in (select slot from public.members where slot is not null)
      order by s limit 1;
    if free_slot is not null then
      insert into public.members (user_id, email, slot) values (new.id, new.email, free_slot)
      on conflict (user_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_member()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;

create or replace function public.my_slot()
returns smallint
language sql stable security definer
set search_path = public
as $$
  select slot from public.members where user_id = auth.uid();
$$;

-- Server clock, so the browser can show countdowns without trusting the device clock.
create or replace function public.server_now()
returns timestamptz
language sql stable
as $$ select now(); $$;

-- Public (view-only) site switch lives in settings
create table if not exists public.settings (
  id smallint primary key default 1 check (id = 1),
  name_one text not null default 'Partner One',
  name_two text not null default 'Partner Two',
  anniversary timestamptz not null default now(),
  welcome_message text not null default 'Welcome to our little world.',
  featured_photo_path text,
  is_public boolean not null default false,
  theme jsonb not null default '{"accent":"#e8899f","mode":"system","particles":true}'::jsonb,
  excluded_album_ids uuid[] not null default '{}',
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

create or replace function public.is_public_site()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_public from public.settings where id = 1), false);
$$;

-- ---------------------------------------------------------------------
-- Generic triggers: updated_at + version bump (optimistic locking)
-- ---------------------------------------------------------------------
create or replace function public.bump_version()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 0) + 1;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Biographies (one row per slot)
-- ---------------------------------------------------------------------
create table if not exists public.bios (
  slot smallint primary key check (slot in (1, 2)),
  nickname text not null default '',
  full_name text not null default '',
  birthday date,
  avatar_path text,
  bio text not null default '',
  personality text not null default '',
  hobbies text[] not null default '{}',
  favorite_music text not null default '',
  favorite_food text not null default '',
  favorite_memories text not null default '',
  custom_fields jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.bios (slot) values (1), (2) on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2. Albums and media
-- ---------------------------------------------------------------------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default '',
  cover_media_id uuid,
  exclude_from_random boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums(id) on delete set null,
  kind text not null check (kind in ('image', 'video')),
  storage_path text not null unique,
  caption text not null default '',
  description text not null default '',
  taken_at date not null default current_date,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists media_album_idx on public.media(album_id);
create index if not exists media_taken_idx on public.media(taken_at desc);

-- ---------------------------------------------------------------------
-- 3. Timeline
-- ---------------------------------------------------------------------
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  description text not null default '',
  photo_paths text[] not null default '{}',
  video_path text,
  decoration text not null default 'heart',
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Music
-- ---------------------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default '',
  source_kind text not null default 'file' check (source_kind in ('file', 'url', 'embed')),
  audio_path text,           -- file uploaded to storage
  audio_url text,            -- direct URL of a legally hosted file
  embed_url text,            -- YouTube / Spotify / SoundCloud embed URL
  artwork_path text,
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Bucket list
-- ---------------------------------------------------------------------
create table if not exists public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Adventures'
    check (category in ('Travel','Dates','Food','Adventures','Celebrations','Personal Goals','Future Dreams')),
  target_date date,
  cover_path text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Letters — metadata and body are separate so the BODY can be
--    locked by the database itself until unlock_at (server clock).
-- ---------------------------------------------------------------------
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled letter',
  -- 'self'    = private to the author
  -- 'partner' = from author to the other person
  -- 'both'    = shared letter to our future selves
  audience text not null default 'both' check (audience in ('self', 'partner', 'both')),
  status text not null default 'draft' check (status in ('draft', 'sealed')),
  unlock_at timestamptz,
  sealed_at timestamptz,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint sealed_needs_date check (status = 'draft' or unlock_at is not null)
);

create table if not exists public.letter_bodies (
  letter_id uuid primary key references public.letters(id) on delete cascade,
  body text not null default '',
  photo_paths text[] not null default '{}'
);

-- Can the current user see that this letter EXISTS (title, countdown)?
create or replace function public.can_see_letter(l public.letters)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_member() and (
    l.author_id = auth.uid()
    or (l.status = 'sealed' and l.audience in ('partner', 'both'))
  );
$$;

-- Can the current user READ the body? Drafts: author only.
-- Sealed: only once the SERVER clock has reached unlock_at.
create or replace function public.can_read_letter_body(letter uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.letters l
    where l.id = letter
      and public.is_member()
      and (
        (l.status = 'draft' and l.author_id = auth.uid())
        or (l.status = 'sealed' and l.unlock_at <= now() and public.can_see_letter(l))
      )
  );
$$;

-- Lock rules enforced server-side: sealed letters are immutable
-- (except version/updated_at), and a seal date must be in the future.
create or replace function public.letters_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'sealed' then
      raise exception 'Create letters as drafts, then seal them.';
    end if;
    return new;
  end if;

  if old.status = 'sealed' then
    raise exception 'This letter is sealed and cannot be changed.';
  end if;

  if new.status = 'sealed' and old.status = 'draft' then
    if new.unlock_at is null or new.unlock_at <= now() then
      raise exception 'Choose an opening date in the future before sealing.';
    end if;
    new.sealed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists letters_guard_trg on public.letters;
create trigger letters_guard_trg
  before insert or update on public.letters
  for each row execute function public.letters_guard();

create or replace function public.letter_bodies_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.letters l where l.id = new.letter_id and l.status = 'sealed') then
    raise exception 'This letter is sealed and cannot be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists letter_bodies_guard_trg on public.letter_bodies;
create trigger letter_bodies_guard_trg
  before insert or update on public.letter_bodies
  for each row execute function public.letter_bodies_guard();

-- ---------------------------------------------------------------------
-- Version triggers on all editable tables
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'settings','bios','albums','media','timeline_events',
    'tracks','bucket_items','letters'
  ] loop
    execute format('drop trigger if exists %I_bump on public.%I', t, t);
    execute format(
      'create trigger %I_bump before update on public.%I
         for each row execute function public.bump_version()', t, t);
  end loop;
end $$;

-- Completed date for bucket list set server-side
create or replace function public.bucket_completion()
returns trigger
language plpgsql
as $$
begin
  if new.completed and (old.completed is distinct from true) then
    new.completed_at = now();
  elsif not new.completed then
    new.completed_at = null;
  end if;
  return new;
end;
$$;
drop trigger if exists bucket_completion_trg on public.bucket_items;
create trigger bucket_completion_trg
  before update on public.bucket_items
  for each row execute function public.bucket_completion();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.allowed_emails  enable row level security;
alter table public.members         enable row level security;
alter table public.settings        enable row level security;
alter table public.bios            enable row level security;
alter table public.albums          enable row level security;
alter table public.media           enable row level security;
alter table public.timeline_events enable row level security;
alter table public.tracks          enable row level security;
alter table public.bucket_items    enable row level security;
alter table public.letters         enable row level security;
alter table public.letter_bodies   enable row level security;

-- allowed_emails: nobody from the client (manage in SQL editor only)
-- (no policies = no access)

-- members: members can see each other (to show who is who)
drop policy if exists members_select on public.members;
create policy members_select on public.members
  for select to authenticated using (public.is_member());

-- Shared content tables: members full access; public read only if is_public
do $$
declare t text;
begin
  foreach t in array array[
    'settings','bios','albums','media','timeline_events','tracks','bucket_items'
  ] loop
    execute format('drop policy if exists %I_member_all on public.%I', t, t);
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format(
      'create policy %I_member_all on public.%I for all to authenticated
         using (public.is_member()) with check (public.is_member())', t, t);
    execute format(
      'create policy %I_public_read on public.%I for select to anon
         using (public.is_public_site())', t, t);
  end loop;
end $$;

-- settings may never be inserted/deleted by clients (single row)
drop policy if exists settings_member_all on public.settings;
create policy settings_member_select on public.settings
  for select to authenticated using (public.is_member());
create policy settings_member_update on public.settings
  for update to authenticated using (public.is_member()) with check (public.is_member());

-- bios: a person may edit their own slot; either may edit if they choose to
-- (kept member-wide so couples can help each other; tighten with slot = my_slot() if desired)

-- Letters
drop policy if exists letters_select on public.letters;
create policy letters_select on public.letters
  for select to authenticated using (public.can_see_letter(letters));

drop policy if exists letters_insert on public.letters;
create policy letters_insert on public.letters
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());

drop policy if exists letters_update on public.letters;
create policy letters_update on public.letters
  for update to authenticated
  using (public.is_member() and author_id = auth.uid())
  with check (public.is_member() and author_id = auth.uid());

drop policy if exists letters_delete on public.letters;
create policy letters_delete on public.letters
  for delete to authenticated
  using (public.is_member() and author_id = auth.uid() and status = 'draft');

drop policy if exists letter_bodies_select on public.letter_bodies;
create policy letter_bodies_select on public.letter_bodies
  for select to authenticated using (public.can_read_letter_body(letter_id));

drop policy if exists letter_bodies_write on public.letter_bodies;
create policy letter_bodies_write on public.letter_bodies
  for all to authenticated
  using (exists (select 1 from public.letters l
                 where l.id = letter_id and l.author_id = auth.uid() and l.status = 'draft'))
  with check (exists (select 1 from public.letters l
                 where l.id = letter_id and l.author_id = auth.uid() and l.status = 'draft'));

-- ---------------------------------------------------------------------
-- STORAGE (single public-read bucket; only members can write)
-- File paths are random UUIDs, and database rows are hidden from the public
-- unless settings.is_public = true, so URLs are effectively unguessable.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('couple-media', 'couple-media', true, 52428800)  -- 50 MB = Supabase free-tier cap
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "couple media read"   on storage.objects;
drop policy if exists "couple media insert" on storage.objects;
drop policy if exists "couple media update" on storage.objects;
drop policy if exists "couple media delete" on storage.objects;

create policy "couple media read" on storage.objects
  for select using (bucket_id = 'couple-media');
create policy "couple media insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'couple-media' and public.is_member());
create policy "couple media update" on storage.objects
  for update to authenticated using (bucket_id = 'couple-media' and public.is_member());
create policy "couple media delete" on storage.objects
  for delete to authenticated using (bucket_id = 'couple-media' and public.is_member());

-- ---------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'settings','bios','albums','media','timeline_events',
    'tracks','bucket_items','letters','letter_bodies'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Needed so DELETE events carry the row id under RLS
alter table public.albums          replica identity full;
alter table public.media           replica identity full;
alter table public.timeline_events replica identity full;
alter table public.tracks          replica identity full;
alter table public.bucket_items    replica identity full;
alter table public.letters         replica identity full;

-- ---------------------------------------------------------------------
-- LAST STEP (edit then run separately): allow-list the two accounts
-- ---------------------------------------------------------------------
-- insert into public.allowed_emails (email) values
--   ('you@example.com'),
--   ('her@example.com');
