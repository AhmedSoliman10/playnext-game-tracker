create extension if not exists pgcrypto;

create type public.game_status as enum (
  'played',
  'playing',
  'want_to_play',
  'dropped',
  'not_interested',
  'skipped'
);

create type public.discovery_action as enum (
  'played',
  'playing',
  'want_to_play',
  'dropped',
  'not_interested',
  'skipped',
  'favorite',
  'unfavorite'
);

create type public.activity_type as enum (
  'status_changed',
  'rating_saved',
  'favorite_changed'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_game_id text not null,
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  background_image_url text,
  release_date date,
  developer text,
  publisher text,
  external_rating numeric(3, 1) check (external_rating is null or external_rating between 0 and 10),
  estimated_playtime integer check (estimated_playtime is null or estimated_playtime >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_game_id)
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.game_genres (
  game_id uuid not null references public.games(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (game_id, genre_id)
);

create table public.game_platforms (
  game_id uuid not null references public.games(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  primary key (game_id, platform_id)
);

create table public.user_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  status public.game_status not null,
  is_favorite boolean not null default false,
  finished boolean,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  overall_rating numeric(3, 1) not null check (
    overall_rating between 1 and 10 and (overall_rating * 2) = floor(overall_rating * 2)
  ),
  story_rating integer check (story_rating is null or story_rating between 1 and 10),
  gameplay_rating integer check (gameplay_rating is null or gameplay_rating between 1 and 10),
  visuals_rating integer check (visuals_rating is null or visuals_rating between 1 and 10),
  soundtrack_rating integer check (soundtrack_rating is null or soundtrack_rating between 1 and 10),
  difficulty_rating integer check (difficulty_rating is null or difficulty_rating between 1 and 10),
  would_recommend boolean,
  review text check (review is null or char_length(review) <= 800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create table public.discovery_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  action public.discovery_action not null,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  activity_type public.activity_type not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

create trigger user_games_set_updated_at
before update on public.user_games
for each row execute function public.set_updated_at();

create trigger ratings_set_updated_at
before update on public.ratings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.genres enable row level security;
alter table public.platforms enable row level security;
alter table public.game_genres enable row level security;
alter table public.game_platforms enable row level security;
alter table public.user_games enable row level security;
alter table public.ratings enable row level security;
alter table public.discovery_interactions enable row level security;
alter table public.activity_log enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "games_select_authenticated"
on public.games for select
to authenticated
using (true);

create policy "genres_select_authenticated"
on public.genres for select
to authenticated
using (true);

create policy "platforms_select_authenticated"
on public.platforms for select
to authenticated
using (true);

create policy "game_genres_select_authenticated"
on public.game_genres for select
to authenticated
using (true);

create policy "game_platforms_select_authenticated"
on public.game_platforms for select
to authenticated
using (true);

create policy "user_games_select_own"
on public.user_games for select
to authenticated
using (auth.uid() = user_id);

create policy "user_games_insert_own"
on public.user_games for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_games_update_own"
on public.user_games for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_games_delete_own"
on public.user_games for delete
to authenticated
using (auth.uid() = user_id);

create policy "ratings_select_own"
on public.ratings for select
to authenticated
using (auth.uid() = user_id);

create policy "ratings_insert_own"
on public.ratings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "ratings_update_own"
on public.ratings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "ratings_delete_own"
on public.ratings for delete
to authenticated
using (auth.uid() = user_id);

create policy "discovery_interactions_select_own"
on public.discovery_interactions for select
to authenticated
using (auth.uid() = user_id);

create policy "discovery_interactions_insert_own"
on public.discovery_interactions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "discovery_interactions_delete_own"
on public.discovery_interactions for delete
to authenticated
using (auth.uid() = user_id);

create policy "activity_log_select_own"
on public.activity_log for select
to authenticated
using (auth.uid() = user_id);

create policy "activity_log_insert_own"
on public.activity_log for insert
to authenticated
with check (auth.uid() = user_id);

create policy "activity_log_delete_own"
on public.activity_log for delete
to authenticated
using (auth.uid() = user_id);

create index games_slug_idx on public.games (slug);
create index games_provider_idx on public.games (provider, provider_game_id);
create index games_release_date_idx on public.games (release_date desc);
create index games_external_rating_idx on public.games (external_rating desc);
create index user_games_user_status_idx on public.user_games (user_id, status);
create index user_games_user_favorite_idx on public.user_games (user_id, is_favorite);
create index ratings_user_rating_idx on public.ratings (user_id, overall_rating desc);
create index discovery_user_created_idx on public.discovery_interactions (user_id, created_at desc);
create index activity_user_created_idx on public.activity_log (user_id, created_at desc);
