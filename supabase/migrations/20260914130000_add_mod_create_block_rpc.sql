-- RPC для создания нового блока из мода Minecraft.
-- Используется с service_role ключом — RLS обходится, anon/authenticated вызвать не могут.
--
-- Аргументы:
--   p_name           — название блока (например "A-01")
--   p_position_x     — координата X в блочных единицах
--   p_position_y     — координата Y в блочных единицах
--   p_layer          — слой (высота в мире)
--   p_min_floor      — нижний этаж (по умолчанию 0)
--   p_max_floor      — верхний этаж (по умолчанию 0)
--   p_direction      — ориентация: "up" | "right" | "down" | "left" (по умолчанию "up")
--   p_can_create     — можно ли создать новый блок рядом (по умолчанию null = неизвестно)
--   p_expires_hours  — через сколько часов статус can_create устареет (0 = постоянный)
--
-- Возвращает id созданного блока.

create or replace function public.create_block_from_mod(
  p_name           text,
  p_position_x     integer,
  p_position_y     integer,
  p_layer          integer default 0,
  p_min_floor      integer default 0,
  p_max_floor      integer default 0,
  p_direction      text    default 'up',
  p_can_create     boolean default null,
  p_expires_hours  float   default 0
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires_at text;
  v_data       jsonb;
  v_id         bigint;
begin
  -- Собираем expires_at только если нужен временный статус
  if p_expires_hours > 0 and p_can_create is not null then
    v_expires_at := (
      (now() + (p_expires_hours || ' hours')::interval) at time zone 'UTC'
    )::text;
  else
    v_expires_at := null;
  end if;

  -- Базовый data-объект блока (минимальный, как при ручном создании через карту)
  v_data := jsonb_build_object(
    'name',                  p_name,
    'direction',             p_direction,
    'position_x',            p_position_x,
    'position_y',            p_position_y,
    'layer',                 p_layer,
    'min_floor',             p_min_floor,
    'max_floor',             p_max_floor,
    'places',                '[]'::jsonb,
    'can_create_block',      p_can_create,
    'can_create_expires_at', v_expires_at
  );

  insert into blocks (data, position_x, position_y, layer, updated_at)
  values (v_data, p_position_x, p_position_y, p_layer, now())
  returning id into v_id;

  return v_id;
end;
$$;

-- Только service_role
revoke all on function public.create_block_from_mod(text, integer, integer, integer, integer, integer, text, boolean, float) from public;
revoke all on function public.create_block_from_mod(text, integer, integer, integer, integer, integer, text, boolean, float) from anon;
revoke all on function public.create_block_from_mod(text, integer, integer, integer, integer, integer, text, boolean, float) from authenticated;
grant execute on function public.create_block_from_mod(text, integer, integer, integer, integer, integer, text, boolean, float) to service_role;
