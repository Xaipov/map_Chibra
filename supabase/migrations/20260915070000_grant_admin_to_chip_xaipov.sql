-- Grant admin access to the existing Discord account chip_xaipov.
-- The migration is intentionally a no-op until that account has authenticated.
do $$
declare
  target_user_id uuid;
begin
  select id
    into target_user_id
  from auth.users
  where lower(coalesce(raw_user_meta_data->>'username', '')) = 'chip_xaipov'
     or lower(coalesce(raw_user_meta_data->>'user_name', '')) = 'chip_xaipov'
     or lower(coalesce(raw_user_meta_data->'custom_claims'->>'global_name', '')) = 'chip_xaipov'
     or lower(coalesce(raw_user_meta_data->>'full_name', '')) = 'chip_xaipov'
  order by created_at
  limit 1;

  if target_user_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (target_user_id, 'admin')
    on conflict (user_id, role_id) do nothing;
  end if;
end
$$;
