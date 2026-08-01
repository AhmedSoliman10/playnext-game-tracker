alter table if exists public.notification_preferences
alter column email_digest_enabled set default true;

insert into public.notification_preferences (
  user_id,
  email_digest_enabled,
  in_app_followed_you,
  in_app_reaction,
  in_app_comment,
  in_app_system,
  quiet_mode_enabled
)
select
  profiles.id,
  true,
  true,
  true,
  true,
  true,
  false
from public.profiles
on conflict (user_id) do update
set
  email_digest_enabled = true,
  updated_at = now();
