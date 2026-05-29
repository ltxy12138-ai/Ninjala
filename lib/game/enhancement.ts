import { getMaterialName } from "@/data/materials";
import { getRegionOrder } from "@/data/regions";
import { getRegionById } from "@/lib/game/regions";
import type { Locale } from "@/lib/i18n";
import { statKeys, type EquipmentStats, type ItemRarity } from "@/lib/game/types";

export const enhancementCaps: Record<ItemRarity, number> = {
  common: 5,
  rare: 6,
  epic: 8,
  legendary: 10,
};

const rarityCostMultipliers: Record<ItemRarity, number> = {
  common: 1,
  rare: 3,
  epic: 6,
  legendary: 9,
};

export type EnhancementItemSnapshot = Partial<EquipmentStats> & {
  id: string;
  name: string;
  sourceRegionId: string;
  rarity: ItemRarity;
  enhancementLevel: number;
};

export type EnhancementPreview = {
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
  materialId: string;
  materialCost: number;
  goldCost: number;
  isMaxLevel: boolean;
};

export class EnhancementActionError extends Error {
  constructor(
    readonly code:
      | "PLAYER_NOT_FOUND"
      | "ITEM_NOT_FOUND"
      | "MAX_LEVEL"
      | "INSUFFICIENT_GOLD"
      | "INSUFFICIENT_MATERIAL",
    message: string,
  ) {
    super(message);
    this.name = "EnhancementActionError";
  }
}

function getRegionTier(regionId: string) {
  return Math.max(1, getRegionOrder(regionId) + 1);
}

export function getEnhancementMaterialId(item: EnhancementItemSnapshot) {
  const region = getRegionById(item.sourceRegionId);

  return region?.materialRates[0]?.materialId ?? "iron_ore";
}

export function getEnhancementPreview(item: EnhancementItemSnapshot): EnhancementPreview {
  const currentLevel = item.enhancementLevel ?? 0;
  const maxLevel = enhancementCaps[item.rarity];
  const isMaxLevel = currentLevel >= maxLevel;
  const nextLevel = Math.min(currentLevel + 1, maxLevel);
  const tier = getRegionTier(item.sourceRegionId);
  const rarityMultiplier = rarityCostMultipliers[item.rarity];

  return {
    currentLevel,
    nextLevel,
    maxLevel,
    materialId: getEnhancementMaterialId(item),
    materialCost: Math.ceil(
      tier * rarityMultiplier * Math.max(1, currentLevel + 1) * 1.2,
    ),
    goldCost: 45 * tier * rarityMultiplier * Math.max(1, currentLevel + 1),
    isMaxLevel,
  };
}

type EnhancementStatInput = Partial<EquipmentStats> & {
  sourceRegionId?: string;
};

function getEnhancementRate(
  statKey: (typeof statKeys)[number],
  regionTier: number,
) {
  const lateGameTierBonus = Math.max(0, regionTier - 5);

  switch (statKey) {
    case "attack":
    case "defense":
    case "hp":
      return 0.1 + lateGameTierBonus * 0.02;
    case "luck":
    case "crit":
      return 0.1 + lateGameTierBonus * 0.015;
    default:
      return 0.1;
  }
}

export function getEnhancementIncrements(item: EnhancementStatInput) {
  const result = {} as Record<(typeof statKeys)[number], number>;
  const regionTier = item.sourceRegionId ? getRegionTier(item.sourceRegionId) : 1;

  for (const statKey of statKeys) {
    const currentValue = item[statKey] ?? 0;
    const rate = getEnhancementRate(statKey, regionTier);
    result[statKey] =
      currentValue > 0 ? Math.max(1, Math.ceil(currentValue * rate)) : 0;
  }

  return result;
}

export function applyEnhancementStats(item: EnhancementStatInput) {
  const increments = getEnhancementIncrements(item);
  const nextStats = {} as Record<(typeof statKeys)[number], number>;

  for (const statKey of statKeys) {
    nextStats[statKey] = (item[statKey] ?? 0) + increments[statKey];
  }

  return nextStats;
}

export function applyEnhancementLevels(
  stats: EnhancementStatInput,
  enhancementLevel: number,
) {
  const sourceRegionId = stats.sourceRegionId;
  let nextStats = {
    attack: stats.attack ?? 0,
    defense: stats.defense ?? 0,
    hp: stats.hp ?? 0,
    luck: stats.luck ?? 0,
    crit: stats.crit ?? 0,
    goldBonus: stats.goldBonus ?? 0,
    expBonus: stats.expBonus ?? 0,
    dropBonus: stats.dropBonus ?? 0,
  };

  for (let level = 0; level < enhancementLevel; level += 1) {
    nextStats = applyEnhancementStats({
      ...nextStats,
      sourceRegionId,
    });
  }

  return nextStats;
}

export function buildEnhancementLogMessage(
  item: EnhancementItemSnapshot,
  preview: EnhancementPreview,
  locale: Locale,
) {
  const materialName = getMaterialName(preview.materialId, locale);

  return locale === "zh"
    ? `强化了 ${item.name} 至 +${preview.nextLevel}，消耗 ${preview.goldCost} 金币和 ${materialName} x${preview.materialCost}。`
    : `Enhanced ${item.name} to +${preview.nextLevel}, spending ${preview.goldCost} gold and ${materialName} x${preview.materialCost}.`;
}
