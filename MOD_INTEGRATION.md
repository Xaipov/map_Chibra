# Интеграция с Minecraft-модом (САМОСБОР)

Мод может обновлять статус «Можно создать блок» (`can_create_block`) напрямую через
Supabase REST API. Данные от мода помечаются как **временные**: поле
`can_create_expires_at` задаёт время истечения, после которого карта показывает
предупреждение «данные устарели».

---

## Структура данных

В поле `data` (JSONB) таблицы `blocks` теперь есть два связанных поля:

```json
{
  "can_create_block": true,
  "can_create_expires_at": "2026-09-14T12:00:00.000Z"
}
```

| Поле | Тип | Описание |
|---|---|---|
| `can_create_block` | `boolean \| null` | Можно ли создать блок рядом |
| `can_create_expires_at` | `ISO string \| null` | До какого момента данные актуальны. `null` — постоянный статус (задан вручную) |

---

## Обновление из мода (Supabase REST API)

### Аутентификация

Мод использует **service_role** ключ Supabase (обходит RLS). Храни его на сервере,
не в клиентском коде.

```
POST https://<PROJECT_REF>.supabase.co/rest/v1/rpc/update_can_create_from_mod
Authorization: Bearer <service_role_key>
Content-Type: application/json
```

### Вариант A — RPC-функция (рекомендуется)

Создай функцию в Supabase (добавь в миграцию):

```sql
create or replace function public.update_can_create_from_mod(
  p_block_id bigint,
  p_can_create boolean,
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
      to_jsonb((now() + (p_expires_hours || ' hours')::interval)::text)
    ),
    updated_at = now()
  where id = p_block_id;
end;
$$;
```

Вызов из мода:

```http
POST /rest/v1/rpc/update_can_create_from_mod
Content-Type: application/json

{
  "p_block_id": 42,
  "p_can_create": true,
  "p_expires_hours": 1.0
}
```

### Вариант B — PATCH напрямую

Мод патчит `data` через стандартный Supabase PATCH. Недостаток: нужно
отправлять весь JSONB объекта `data`, либо использовать `jsonb_set` через RPC.

```http
PATCH /rest/v1/blocks?id=eq.42
Content-Type: application/json
Authorization: Bearer <service_role_key>
Prefer: return=minimal

{
  "data": { ...весь data блока...,
    "can_create_block": true,
    "can_create_expires_at": "2026-09-14T13:00:00.000Z"
  },
  "updated_at": "2026-09-14T12:00:00.000Z"
}
```

### Вариант C — Webhook через отдельный endpoint

Если не хочешь давать моду прямой доступ к Supabase, можно поднять
Edge Function или отдельный сервер-прокси:

```
POST https://<PROJECT_REF>.supabase.co/functions/v1/mod-webhook
x-mod-secret: <shared_secret>
Content-Type: application/json

{
  "block_id": 42,
  "can_create": true,
  "expires_hours": 1
}
```

Edge Function (`supabase/functions/mod-webhook/index.ts`):

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const secret = req.headers.get("x-mod-secret");
  if (secret !== Deno.env.get("MOD_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { block_id, can_create, expires_hours = 1 } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase.rpc("update_can_create_from_mod", {
    p_block_id: block_id,
    p_can_create: can_create,
    p_expires_hours: expires_hours,
  });

  if (error) return new Response(error.message, { status: 500 });
  return new Response("ok");
});
```


| Состояние | Отображение в карточке |
|---|---|
| `can_create_block: true`, без срока | «Да» |
| `can_create_block: false`, без срока | «Нет» |
| Временный, не истёк | «Да / Нет» + бейдж **⏱ временный** с временем истечения |
| Временный, истёк | «Да / Нет» + бейдж **⚠ устарел** |

Realtime Supabase обновляет карточку автоматически при поступлении данных от мода.
