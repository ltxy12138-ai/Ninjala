import type { Locale } from "@/lib/i18n";

export const itemSlots = [
  "weapon",
  "helmet",
  "armor",
  "boots",
  "accessory",
] as const;

export const itemRarities = [
  "common",
  "rare",
  "epic",
  "legendary",
] as const;

export const statKeys = [
  "attack",
  "defense",
  "hp",
  "luck",
  "crit",
  "goldBonus",
  "expBonus",
  "dropBonus",
] as const;

export type ItemSlot = (typeof itemSlots)[number];
export type ItemRarity = (typeof itemRarities)[number];
export type StatKey = (typeof statKeys)[number];

export type EquipmentStats = Record<StatKey, number>;

export type StatRange = {
  min: number;
  max: number;
};

export function createEmptyStats(): EquipmentStats {
  return {
    attack: 0,
    defense: 0,
    hp: 0,
    luck: 0,
    crit: 0,
    goldBonus: 0,
    expBonus: 0,
    dropBonus: 0,
  };
}

export function coerceStats(
  partial: Partial<Record<StatKey, number>>,
): EquipmentStats {
  return {
    ...createEmptyStats(),
    ...partial,
  };
}

export function formatSlotLabel(slot: ItemSlot, locale: Locale = "zh") {
  switch (slot) {
    case "weapon":
      return locale === "zh" ? "武器" : "Weapon";
    case "helmet":
      return locale === "zh" ? "头部" : "Helmet";
    case "armor":
      return locale === "zh" ? "护甲" : "Armor";
    case "boots":
      return locale === "zh" ? "靴子" : "Boots";
    case "accessory":
      return locale === "zh" ? "饰品" : "Accessory";
  }
}

export function formatRarityLabel(
  rarity: ItemRarity,
  locale: Locale = "zh",
) {
  if (locale === "en") {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  }

  switch (rarity) {
    case "common":
      return "普通";
    case "rare":
      return "稀有";
    case "epic":
      return "史诗";
    case "legendary":
      return "传说";
  }
}
