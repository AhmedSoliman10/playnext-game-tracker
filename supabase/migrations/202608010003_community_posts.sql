create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  visibility text not null default 'public' check (visibility in ('public', 'followers')),
  mood text not null default 'discussion' check (
    mood in ('discussion', 'playing', 'completed', 'backlog', 'recommendation')
  ),
  image_url text check (
    image_url is null
    or (
      char_length(image_url) <= 1000
      and image_url ~* '^https://'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'hype', 'played_it', 'backlog')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_post_bookmarks (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.moderation_reports
add column if not exists post_id uuid references public.community_posts(id) on delete set null,
add column if not exists post_comment_id uuid references public.community_post_comments(id) on delete set null;

alter table public.moderation_reports
drop constraint if exists moderation_reports_report_type_check;

alter table public.moderation_reports
add constraint moderation_reports_report_type_check
check (report_type in ('profile', 'review', 'activity', 'comment', 'post', 'game'));

alter table public.community_posts enable row level security;
alter table public.community_post_reactions enable row level security;
alter table public.community_post_comments enable row level security;
alter table public.community_post_bookmarks enable row level security;

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
before update on public.community_posts
for each row execute function public.set_updated_at();

drop trigger if exists community_post_comments_set_updated_at on public.community_post_comments;
create trigger community_post_comments_set_updated_at
before update on public.community_post_comments
for each row execute function public.set_updated_at();

drop policy if exists "community_posts_select_visible" on public.community_posts;
create policy "community_posts_select_visible"
on public.community_posts for select
using (
  auth.role() = 'authenticated'
  and not exists (
    select 1 from public.user_blocks
    where (
      user_blocks.blocker_user_id = auth.uid()
      and user_blocks.blocked_user_id = community_posts.user_id
    )
    or (
      user_blocks.blocked_user_id = auth.uid()
      and user_blocks.blocker_user_id = community_posts.user_id
    )
  )
  and (
    community_posts.visibility = 'public'
    or community_posts.user_id = auth.uid()
    or (
      community_posts.visibility = 'followers'
      and exists (
        select 1 from public.follows
        where follows.follower_id = auth.uid()
          and follows.following_id = community_posts.user_id
      )
    )
  )
);

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
on public.community_posts for insert
with check (auth.uid() = user_id);

drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own"
on public.community_posts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own"
on public.community_posts for delete
using (auth.uid() = user_id);

drop policy if exists "community_post_reactions_select_visible_post" on public.community_post_reactions;
create policy "community_post_reactions_select_visible_post"
on public.community_post_reactions for select
using (
  exists (
    select 1 from public.community_posts
    where community_posts.id = community_post_reactions.post_id
  )
);

drop policy if exists "community_post_reactions_insert_own_visible_post" on public.community_post_reactions;
create policy "community_post_reactions_insert_own_visible_post"
on public.community_post_reactions for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.community_posts
    where community_posts.id = community_post_reactions.post_id
  )
);

drop policy if exists "community_post_reactions_update_own" on public.community_post_reactions;
create policy "community_post_reactions_update_own"
on public.community_post_reactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_post_reactions_delete_own" on public.community_post_reactions;
create policy "community_post_reactions_delete_own"
on public.community_post_reactions for delete
using (auth.uid() = user_id);

drop policy if exists "community_post_comments_select_visible_post" on public.community_post_comments;
create policy "community_post_comments_select_visible_post"
on public.community_post_comments for select
using (
  exists (
    select 1 from public.community_posts
    where community_posts.id = community_post_comments.post_id
  )
);

drop policy if exists "community_post_comments_insert_own_visible_post" on public.community_post_comments;
create policy "community_post_comments_insert_own_visible_post"
on public.community_post_comments for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.community_posts
    where community_posts.id = community_post_comments.post_id
  )
);

drop policy if exists "community_post_comments_update_own" on public.community_post_comments;
create policy "community_post_comments_update_own"
on public.community_post_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_post_comments_delete_own" on public.community_post_comments;
create policy "community_post_comments_delete_own"
on public.community_post_comments for delete
using (auth.uid() = user_id);

drop policy if exists "community_post_bookmarks_select_own" on public.community_post_bookmarks;
create policy "community_post_bookmarks_select_own"
on public.community_post_bookmarks for select
using (auth.uid() = user_id);

drop policy if exists "community_post_bookmarks_insert_own_visible_post" on public.community_post_bookmarks;
create policy "community_post_bookmarks_insert_own_visible_post"
on public.community_post_bookmarks for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.community_posts
    where community_posts.id = community_post_bookmarks.post_id
  )
);

drop policy if exists "community_post_bookmarks_delete_own" on public.community_post_bookmarks;
create policy "community_post_bookmarks_delete_own"
on public.community_post_bookmarks for delete
using (auth.uid() = user_id);

create index if not exists community_posts_created_idx
on public.community_posts (created_at desc);

create index if not exists community_posts_user_created_idx
on public.community_posts (user_id, created_at desc);

create index if not exists community_posts_game_created_idx
on public.community_posts (game_id, created_at desc)
where game_id is not null;

create index if not exists community_posts_visibility_idx
on public.community_posts (visibility);

create index if not exists community_post_reactions_post_idx
on public.community_post_reactions (post_id);

create index if not exists community_post_comments_post_created_idx
on public.community_post_comments (post_id, created_at desc);

create index if not exists community_post_bookmarks_user_created_idx
on public.community_post_bookmarks (user_id, created_at desc);
