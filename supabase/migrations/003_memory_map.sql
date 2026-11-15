-- =====================================================================
-- Memory Map — geographical scrapbook for meaningful places
-- =====================================================================

create table if not exists public.memory_places (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  category text not null default 'Other',
  memory_date date not null default current_date,
  image_paths jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

alter table public.memory_places enable row level security;
alter table public.memory_places replica identity full;

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------
create or replace function public.can_view_memory_place(p_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memory_places m
    join public.members mem on mem.user_id = m.created_by
    where m.id = p_id
      and (public.is_member()
           or (public.is_public_site() and exists (select 1 from public.settings s where s.is_public = true)))
  );
$$;

create or replace function public.public_memories_visible()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_public from public.settings limit 1), false);
$$;

-- ---------------------------------------------------------------------
-- Policies
-- Members always can read their own memories
-- When site is public, anyone can view published memories
-- Only members can insert/update/delete
-- ---------------------------------------------------------------------
drop policy if exists memory_places_select on public.memory_places;
create policy memory_places_select on public.memory_places
  for select using (
    public.is_member()
    or (public.is_public_site() = true)
  );

drop policy if exists memory_places_insert on public.memory_places;
create policy memory_places_insert on public.memory_places
  for insert to authenticated
  with check (public.is_member() and created_by = auth.uid());

drop policy if exists memory_places_update on public.memory_places;
create policy memory_places_update on public.memory_places
  for update to authenticated
  using (public.is_member() and created_by = auth.uid())
  with check (public.is_member() and created_by = auth.uid());

drop policy if exists memory_places_delete on public.memory_places;
create policy memory_places_delete on public.memory_places
  for delete to authenticated
  using (public.is_member() and created_by = auth.uid());

-- ---------------------------------------------------------------------
-- Version bump trigger (same pattern as schema.sql generic triggers)
-- ---------------------------------------------------------------------
drop trigger if exists memory_places_bump on public.memory_places;
create trigger memory_places_bump
  before update on public.memory_places
  for each row
  execute function public.bump_version();

-- ---------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.memory_places;
  exception when duplicate_object then
    null;
  end;
end $$;
