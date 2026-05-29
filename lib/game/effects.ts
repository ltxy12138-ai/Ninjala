import type { EquipmentStats, ItemRarity } from "@/lib/game/types";

export type RewardEffectStats = Pick<
  EquipmentStats,
  "luck" | "crit" | "goldBonus" | "expBonus" | "dropBonus"
>;

export function coerceRewardEffectStats(
  partial: Partial<RewardEffectStats>,
): RewardEffectStats {
  return {
    luck: partial.luck ?? 0,
    crit: partial.crit ?? 0,
    goldBonus: partial.goldBonus ?? 0,
    expBonus: partial.expBonus ?? 0,
    dropBonus: partial.dropBonus ?? 0,
  };
}

function applyPercentMultiplier(value: number, percent: number) {
  return Math.max(0, Math.round(value * (1 + percent / 100)));
}

export function applyGoldBonus(
  baseGold: number,
  stats: Partial<RewardEffectStats>,
) {
  const safeStats = coerceRewardEffectStats(stats);

  return applyPercentMultiplier(baseGold, safeStats.goldBonus);
}

export function applyExpBonus(
  baseExp: number,
  stats: Partial<RewardEffectStats>,
) {
  const safeStats = coerceRewardEffectStats(stats);

  return applyPercentMultiplier(baseExp, safeStats.expBonus);
}

export function scaleDropRollCount(
  baseRollCount: number,
  stats: Partial<RewardEffectStats>,
  random: () => number,
) {
  const safeStats = coerceRewardEffectStats(stats);
  const scaledRollCount = Math.max(
    0,
    baseRollCount * (1 + safeStats.dropBonus / 100),
  );
  const guaranteedRolls = Math.floor(scaledRollCount);
  const remainder = scaledRollCount - guaranteedRolls;

  return guaranteedRolls + (random() < remainder ? 1 : 0);
}

export function calculateBossWinChanceBonus(
  stats: Partial<RewardEffectStats>,
) {
  const safeStats = coerceRewardEffectStats(stats);

  return safeStats.crit * 0.003 + safeStats.luck * 0.0015;
}

export function calculateWorldBossDamageMultiplier(
  stats: Partial<RewardEffectStats>,
) {
  const safeStats = coerceRewardEffectStats(stats);

  return 1 + safeStats.crit * 0.01 + safeStats.luck * 0.003;
}

export function adjustRarityWeights(
  rarityWeights: Record<ItemRarity, number>,
  stats: Partial<RewardEffectStats>,
) {
  const safeStats = coerceRewardEffectStats(stats);
  const commonPenalty = Math.max(0.55, 1 - safeStats.luck * 0.01);
  const rareBonus = 1 + safeStats.luck * 0.015;
  const epicBonus = 1 + safeStats.luck * 0.025;
  const legendaryBonus = 1 + safeStats.luck * 0.035;

  return {
    common: Math.max(1, Math.round(rarityWeights.common * commonPenalty)),
    rare: Math.max(1, Math.round(rarityWeights.rare * rareBonus)),
    epic: Math.max(1, Math.round(rarityWeights.epic * epicBonus)),
    legendary: Math.max(1, Math.round(rarityWeights.legendary * legendaryBonus)),
  } satisfies Record<ItemRarity, number>;
}
