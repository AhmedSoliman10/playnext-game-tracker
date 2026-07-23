alter table public.profiles
add column if not exists is_private boolean not null default false;

create index if not exists profiles_is_private_idx
on public.profiles (is_private);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text;
  normalized_name text;
begin
  chosen_name := nullif(
    regexp_replace(
      trim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Player')),
      '\s+',
      ' ',
      'g'
    ),
    ''
  );

  if chosen_name is null then
    chosen_name := 'Player';
  end if;

  normalized_name := lower(chosen_name);

  insert into public.profiles (
    id,
    display_name,
    display_name_normalized,
    display_name_changed_at,
    is_private
  )
  values (
    new.id,
    chosen_name,
    normalized_name,
    now(),
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
