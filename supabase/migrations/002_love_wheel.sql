-- =====================================================================
-- OUR LITTLE WORLD — Migration 002: "Spin the Love Wheel"
--
-- ADDITIVE ONLY. Creates three new tables and two helper functions.
-- It does not alter, drop, reset or recreate any existing table, policy,
-- storage bucket or user. Safe to run more than once.
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Requires the original supabase/schema.sql to have been run already
-- (it uses public.is_member() and public.bump_version() from there).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Wheels (a couple can keep several: "Date night", "Silly", ...)
-- ---------------------------------------------------------------------
create table if not exists public.wheel_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  emoji text not null default '💗',
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Options on a wheel (grouped by free-text category)
-- ---------------------------------------------------------------------
create table if not exists public.wheel_options (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid not null references public.wheel_sets(id) on delete cascade,
  category text not null default 'Romantic Surprises' check (char_length(btrim(category)) between 1 and 60),
  label text not null check (char_length(btrim(label)) between 1 and 140),
  emoji text not null default '💗',
  enabled boolean not null default true,
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists wheel_options_wheel_idx on public.wheel_options(wheel_id, position);

-- ---------------------------------------------------------------------
-- 3. History ("Our Little Moments"). Label/emoji/category are copied in
--    so history survives if an option or wheel is later edited or deleted.
-- ---------------------------------------------------------------------
create table if not exists public.wheel_history (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references public.wheel_sets(id) on delete set null,
  wheel_name text not null default '',
  option_id uuid references public.wheel_options(id) on delete set null,
  label text not null,
  emoji text not null default '💗',
  category text not null default '',
  -- spun = just landed there; done = "we did it"; skipped = "not now" (always fine!)
  status text not null default 'spun' check (status in ('spun', 'done', 'skipped')),
  spun_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists wheel_history_created_idx on public.wheel_history(created_at desc);

-- ---------------------------------------------------------------------
-- Version triggers (reuses the existing public.bump_version())
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['wheel_sets', 'wheel_options', 'wheel_history'] loop
    execute format('drop trigger if exists %I_bump on public.%I', t, t);
    execute format(
      'create trigger %I_bump before update on public.%I
         for each row execute function public.bump_version()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Default options (the original 19 ideas). Used to seed the first wheel and
-- by "Reset to defaults". Every one of them is optional and can be edited,
-- disabled or deleted by either partner.
-- ---------------------------------------------------------------------
create or replace function public.love_wheel_defaults()
returns table (category text, emoji text, label text, sort_order integer)
language sql
immutable
as $$
  select * from (values
    ('Affectionate Gestures', '💋', 'A kiss', 1),
    ('Affectionate Gestures', '😘', 'A forehead kiss', 2),
    ('Affectionate Gestures', '🥰', 'A cheek kiss', 3),
    ('Affectionate Gestures', '🤗', 'A hug', 4),
    ('Affectionate Gestures', '🫂', 'A long hug', 5),
    ('Affectionate Gestures', '🤝', 'Hold hands', 6),
    ('Affectionate Gestures', '🧸', 'A cuddle', 7),
    ('Romantic Surprises', '💞', 'Say three things you love about each other', 8),
    ('Romantic Surprises', '🌷', 'Give a sweet compliment', 9),
    ('Romantic Surprises', '💌', 'Write a little love note', 10),
    ('Romantic Surprises', '📖', 'Share a favorite memory', 11),
    ('Romantic Surprises', '🎁', 'Give a surprise message', 12),
    ('Romantic Surprises', '🕯️', 'Have a little date together', 13),
    ('Romantic Surprises', '📸', 'Take a cute couple photo', 14),
    ('Fun Challenges', '🖼️', 'Recreate your favorite photo together', 15),
    ('Fun Challenges', '🎯', 'Let the other person choose the next activity', 16),
    ('Fun Challenges', '😂', 'Share an embarrassing but funny memory', 17),
    ('Fun Challenges', '🏷️', 'Give each other a random nickname', 18),
    ('Fun Challenges', '💃', 'Dance together to your favorite song', 19)
  ) as d(category, emoji, label, sort_order)
$$;

-- Atomically replaces one wheel's options with the defaults (used by "Reset to defaults"
-- and by "New wheel -> start with the original options"). Members only.
create or replace function public.reset_love_wheel(p_wheel uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_member() then
    raise exception 'Only the two of you can change the wheel.';
  end if;
  if not exists (select 1 from public.wheel_sets where id = p_wheel) then
    raise exception 'That wheel no longer exists.';
  end if;

  delete from public.wheel_options where wheel_id = p_wheel;
  insert into public.wheel_options (wheel_id, category, emoji, label, enabled, position, created_by)
    select p_wheel, d.category, d.emoji, d.label, true, d.sort_order, auth.uid()
    from public.love_wheel_defaults() d;
end;
$$;

revoke all on function public.reset_love_wheel(uuid) from public, anon;
grant execute on function public.reset_love_wheel(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Seed the first wheel — only if there are no wheels yet
-- ---------------------------------------------------------------------
do $$
declare w uuid;
begin
  if not exists (select 1 from public.wheel_sets) then
    insert into public.wheel_sets (name, emoji, position) values ('Our Love Wheel', '💗', 0)
      returning id into w;
    insert into public.wheel_options (wheel_id, category, emoji, label, position)
      select w, d.category, d.emoji, d.label, d.sort_order from public.love_wheel_defaults() d;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY — members only (nothing here is ever public)
-- ---------------------------------------------------------------------
alter table public.wheel_sets    enable row level security;
alter table public.wheel_options enable row level security;
alter table public.wheel_history enable row level security;

do $$
declare t text;
begin
  foreach t in array array['wheel_sets', 'wheel_options', 'wheel_history'] loop
    execute format('drop policy if exists %I_member_all on public.%I', t, t);
    execute format(
      'create policy %I_member_all on public.%I for all to authenticated
         using (public.is_member()) with check (public.is_member())', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- REALTIME (both partners see changes instantly)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['wheel_sets', 'wheel_options', 'wheel_history'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

alter table public.wheel_sets    replica identity full;
alter table public.wheel_options replica identity full;
alter table public.wheel_history replica identity full;
