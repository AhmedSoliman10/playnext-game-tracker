alter table public.profiles
add column if not exists discord_user_id text,
add column if not exists discord_username text,
add column if not exists discord_avatar_url text,
add column if not exists discord_connected_at timestamptz;

create index if not exists profiles_discord_user_id_idx
on public.profiles (discord_user_id)
where discord_user_id is not null;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_followed_you boolean not null default true,
  in_app_reaction boolean not null default true,
  in_app_comment boolean not null default true,
  in_app_system boolean not null default true,
  email_digest_enabled boolean not null default false,
  quiet_mode_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_blocks (
  blocker_user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint user_blocks_no_self_block check (blocker_user_id <> blocked_user_id)
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  game_id uuid references public.games(id) on delete set null,
  activity_id uuid references public.activity_log(id) on delete set null,
  rating_id uuid references public.ratings(id) on delete set null,
  comment_id uuid,
  report_type text not null check (report_type in ('profile', 'review', 'activity', 'comment', 'game')),
  reason text not null check (char_length(reason) between 8 and 800),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activity_log(id) on delete cascade,
  reaction text not null default 'like' check (reaction in ('like')),
  created_at timestamptz not null default now(),
  unique (user_id, activity_id, reaction)
);

create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activity_log(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_slug text not null,
  feedback_type text not null check (
    feedback_type in ('hide_game', 'show_less', 'show_more', 'prefer_shorter', 'prefer_platform')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, game_slug, feedback_type)
);

create table if not exists public.custom_shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  description text check (description is null or char_length(description) <= 240),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_shelf_games (
  shelf_id uuid not null references public.custom_shelves(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (shelf_id, game_id)
);

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists activity_comments_set_updated_at on public.activity_comments;
create trigger activity_comments_set_updated_at
before update on public.activity_comments
for each row execute function public.set_updated_at();

drop trigger if exists custom_shelves_set_updated_at on public.custom_shelves;
create trigger custom_shelves_set_updated_at
before update on public.custom_shelves
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.user_blocks enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.activity_reactions enable row level security;
alter table public.activity_comments enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.custom_shelves enable row level security;
alter table public.custom_shelf_games enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences for select
using (auth.uid() = user_id);

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
on public.notification_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
on public.notification_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own"
on public.user_blocks for select
using (auth.uid() = blocker_user_id);

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
on public.user_blocks for insert
with check (auth.uid() = blocker_user_id);

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
on public.user_blocks for delete
using (auth.uid() = blocker_user_id);

drop policy if exists "moderation_reports_insert_own" on public.moderation_reports;
create policy "moderation_reports_insert_own"
on public.moderation_reports for insert
with check (auth.uid() = reporter_user_id);

drop policy if exists "moderation_reports_select_own" on public.moderation_reports;
create policy "moderation_reports_select_own"
on public.moderation_reports for select
using (auth.uid() = reporter_user_id);

drop policy if exists "activity_reactions_select_authenticated" on public.activity_reactions;
create policy "activity_reactions_select_authenticated"
on public.activity_reactions for select
using (auth.role() = 'authenticated');

drop policy if exists "activity_reactions_insert_own" on public.activity_reactions;
create policy "activity_reactions_insert_own"
on public.activity_reactions for insert
with check (auth.uid() = user_id);

drop policy if exists "activity_reactions_delete_own" on public.activity_reactions;
create policy "activity_reactions_delete_own"
on public.activity_reactions for delete
using (auth.uid() = user_id);

drop policy if exists "activity_comments_select_authenticated" on public.activity_comments;
create policy "activity_comments_select_authenticated"
on public.activity_comments for select
using (auth.role() = 'authenticated');

drop policy if exists "activity_comments_insert_own" on public.activity_comments;
create policy "activity_comments_insert_own"
on public.activity_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "activity_comments_update_own" on public.activity_comments;
create policy "activity_comments_update_own"
on public.activity_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "activity_comments_delete_own" on public.activity_comments;
create policy "activity_comments_delete_own"
on public.activity_comments for delete
using (auth.uid() = user_id);

drop policy if exists "recommendation_feedback_select_own" on public.recommendation_feedback;
create policy "recommendation_feedback_select_own"
on public.recommendation_feedback for select
using (auth.uid() = user_id);

drop policy if exists "recommendation_feedback_insert_own" on public.recommendation_feedback;
create policy "recommendation_feedback_insert_own"
on public.recommendation_feedback for insert
with check (auth.uid() = user_id);

drop policy if exists "recommendation_feedback_update_own" on public.recommendation_feedback;
create policy "recommendation_feedback_update_own"
on public.recommendation_feedback for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "recommendation_feedback_delete_own" on public.recommendation_feedback;
create policy "recommendation_feedback_delete_own"
on public.recommendation_feedback for delete
using (auth.uid() = user_id);

drop policy if exists "custom_shelves_select_public_or_own" on public.custom_shelves;
create policy "custom_shelves_select_public_or_own"
on public.custom_shelves for select
using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "custom_shelves_insert_own" on public.custom_shelves;
create policy "custom_shelves_insert_own"
on public.custom_shelves for insert
with check (auth.uid() = user_id);

drop policy if exists "custom_shelves_update_own" on public.custom_shelves;
create policy "custom_shelves_update_own"
on public.custom_shelves for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "custom_shelves_delete_own" on public.custom_shelves;
create policy "custom_shelves_delete_own"
on public.custom_shelves for delete
using (auth.uid() = user_id);

drop policy if exists "custom_shelf_games_select_visible_shelf" on public.custom_shelf_games;
create policy "custom_shelf_games_select_visible_shelf"
on public.custom_shelf_games for select
using (
  exists (
    select 1 from public.custom_shelves
    where custom_shelves.id = custom_shelf_games.shelf_id
      and (custom_shelves.visibility = 'public' or custom_shelves.user_id = auth.uid())
  )
);

drop policy if exists "custom_shelf_games_insert_own_shelf" on public.custom_shelf_games;
create policy "custom_shelf_games_insert_own_shelf"
on public.custom_shelf_games for insert
with check (
  exists (
    select 1 from public.custom_shelves
    where custom_shelves.id = custom_shelf_games.shelf_id
      and custom_shelves.user_id = auth.uid()
  )
);

drop policy if exists "custom_shelf_games_delete_own_shelf" on public.custom_shelf_games;
create policy "custom_shelf_games_delete_own_shelf"
on public.custom_shelf_games for delete
using (
  exists (
    select 1 from public.custom_shelves
    where custom_shelves.id = custom_shelf_games.shelf_id
      and custom_shelves.user_id = auth.uid()
  )
);

create index if not exists user_blocks_blocked_idx
on public.user_blocks (blocked_user_id);

create index if not exists moderation_reports_reporter_created_idx
on public.moderation_reports (reporter_user_id, created_at desc);

create index if not exists activity_reactions_activity_idx
on public.activity_reactions (activity_id);

create index if not exists activity_comments_activity_created_idx
on public.activity_comments (activity_id, created_at desc);

create index if not exists recommendation_feedback_user_created_idx
on public.recommendation_feedback (user_id, created_at desc);

create index if not exists custom_shelves_user_created_idx
on public.custom_shelves (user_id, created_at desc);
