do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'notification_type'
  ) then
    create type public.notification_type as enum (
      'followed_you',
      'reaction',
      'comment',
      'system'
    );
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  game_id uuid references public.games(id) on delete set null,
  notification_type public.notification_type not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 280),
  link_href text check (link_href is null or link_href like '/%'),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index if not exists notifications_recipient_created_at_idx
on public.notifications (recipient_user_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
on public.notifications (recipient_user_id, read_at)
where read_at is null;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (auth.uid() = recipient_user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (auth.uid() = recipient_user_id)
with check (auth.uid() = recipient_user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications for delete
to authenticated
using (auth.uid() = recipient_user_id);
