import type { BlockRawData } from "@/types/block";

/**
 * Статус самосбора у блока.
 *
 * - `true` / `false` — постоянный (задан вручную)
 * - `"temporary_true"` / `"temporary_false"` — временный (получен от мода, истекает)
 * - `"expired"` — данные от мода устарели (истёк срок)
 * - `undefined` — неизвестно
 */
export type CanCreateStatus =
  | true
  | false
  | "temporary_true"
  | "temporary_false"
  | "expired"
  | undefined;

/** Срок жизни временного статуса по умолчанию (в минутах). */
export const CAN_CREATE_TEMPORARY_MINUTES = 5;

/** Срок жизни временного статуса по умолчанию (в часах). */
export const CAN_CREATE_TEMPORARY_HOURS = CAN_CREATE_TEMPORARY_MINUTES / 60;

/** ISO-дата истечения временного статуса. */
export const getCanCreateExpiry = (hours = CAN_CREATE_TEMPORARY_HOURS): string =>
  new Date(Date.now() + hours * 3_600_000).toISOString();

/** Истёк ли срок временного статуса. */
export const isCanCreateExpired = (block: Pick<BlockRawData, "can_create_expires_at">): boolean => {
  if (!block.can_create_expires_at) return false;
  return new Date(block.can_create_expires_at).getTime() <= Date.now();
};

/** Временный ли статус (срок ещё не истёк). */
export const isCanCreateTemporary = (
  block: Pick<BlockRawData, "can_create_expires_at">,
): boolean => {
  if (!block.can_create_expires_at) return false;
  return new Date(block.can_create_expires_at).getTime() > Date.now();
};

/**
 * Получить вычисленный статус самосбора блока.
 * Если данные временные и срок истёк — возвращает `"expired"`.
 */
export const getCanCreateStatus = (
  block: Pick<BlockRawData, "can_create_block" | "can_create_expires_at">,
): CanCreateStatus => {
  const isTemp = isCanCreateTemporary(block);
  const isExpired = isCanCreateExpired(block);

  if (isExpired) return "expired";
  if (isTemp) return block.can_create_block ? "temporary_true" : "temporary_false";
  return block.can_create_block;
};
