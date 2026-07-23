alter table public.profiles
add column if not exists display_name_normalized text,
add column if not exists display_name_changed_at timestamptz not null default now();

update public.profiles
set display_name_normalized = lower(trim(display_name))
where display_name is not null
  and display_name_normalized is null;

with ranked_profiles as (
  select
    id,
    display_name,
    row_number() over (
      partition by lower(trim(display_name))
      order by created_at, id
    ) as duplicate_rank
  from public.profiles
  where display_name is not null and trim(display_name) <> ''
)
update public.profiles
set
  display_name = ranked_profiles.display_name || '-' || ranked_profiles.duplicate_rank,
  display_name_normalized = lower(trim(ranked_profiles.display_name || '-' || ranked_profiles.duplicate_rank))
from ranked_profiles
where public.profiles.id = ranked_profiles.id
  and ranked_profiles.duplicate_rank > 1;

create unique index if not exists profiles_display_name_normalized_unique
on public.profiles (display_name_normalized)
where display_name_normalized is not null and display_name_normalized <> '';

create index if not exists profiles_display_name_idx
on public.profiles (display_name_normalized);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

alter table public.follows enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated"
on public.follows for select
to authenticated
using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
on public.follows for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
on public.follows for delete
to authenticated
using (auth.uid() = follower_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text;
  base_name text;
  normalized_name text;
  suffix integer := 1;
begin
  base_name := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));
  chosen_name := base_name;
  normalized_name := lower(trim(chosen_name));

  while exists (
    select 1
    from public.profiles
    where display_name_normalized = normalized_name
  ) loop
    suffix := suffix + 1;
    chosen_name := base_name || '-' || suffix;
    normalized_name := lower(trim(chosen_name));
  end loop;

  insert into public.profiles (
    id,
    display_name,
    display_name_normalized,
    display_name_changed_at
  )
  values (
    new.id,
    chosen_name,
    normalized_name,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
