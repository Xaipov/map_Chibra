-- Функция для обновления статуса самосбора из мода Minecraft.
-- Использует security definer + service_role — вызывается только из доверенного кода мода.
--
-- Аргументы:
--   p_block_id       — id блока в таблице blocks
--   p_can_create     — true/false (можно/нельзя создать блок)
--   p_expires_hours  — через сколько часов статус считается устаревшим (по умолчанию 1 час)

create or replace function public.update_can_create_from_mod(
  p_block_id      bigint,
  p_can_create    boolean,
  p_expires_hours float default 1.0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update blocks
  set
    data = jsonb_set(
      jsonb_set(
        data,
        '{can_create_block}',
        to_jsonb(p_can_create)
      ),
      '{can_create_expires_at}',
      to_jsonb(
        (now() + (p_expires_hours || ' hours')::interval) at time zone 'UTC'
      )::jsonb
    ),
    updated_at = now()
  where id = p_block_id;
end;
$$;

-- Доступ только для service_role (анон и авторизованные пользователи вызвать не могут)
revoke all on function public.update_can_create_from_mod(bigint, boolean, float) from public;
revoke all on function public.update_can_create_from_mod(bigint, boolean, float) from anon;
revoke all on function public.update_can_create_from_mod(bigint, boolean, float) from authenticated;
grant execute on function public.update_can_create_from_mod(bigint, boolean, float) to service_role;
