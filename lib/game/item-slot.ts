import { itemBaseMap } from "@/data/item-bases";
import type { Locale } from "@/lib/i18n";
import { formatSlotLabel, itemSlots, type ItemSlot } from "@/lib/game/types";

export function isItemSlot(value: string): value is ItemSlot {
  return itemSlots.includes(value as ItemSlot);
}

export function normalizeStoredItemSlot(
  slot: string,
  baseItemId?: string | null,
): ItemSlot {
  if (isItemSlot(slot)) {
    return slot;
  }

  if (slot === "accessory" && baseItemId) {
    return itemBaseMap.get(baseItemId)?.slot ?? "ring";
  }

  return "weapon";
}

export function getEquipSlotLabel(
  slot: ItemSlot,
  equipSlotIndex: number,
  locale: Locale,
) {
  if (slot === "ring") {
    if (locale === "zh") {
      return equipSlotIndex === 0 ? "戒指 A" : "戒指 B";
    }

    return equipSlotIndex === 0 ? "Ring A" : "Ring B";
  }

  return formatSlotLabel(slot, locale);
}
