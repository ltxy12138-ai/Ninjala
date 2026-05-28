import { getBossDescription, getBossName, bossDefinitions } from "@/data/bosses";
import { getMaterialName } from "@/data/materials";
import { getRegionName } from "@/data/regions";
import {
  applyExpBonus,
  applyGoldBonus,
  calculateBossWinChanceBonus,
  scaleDropRollCount,
  type RewardEffectStats,
} from "@/lib/game/effects";
import { generateEquipmentDrop, type GeneratedEquipment } from "@/lib/game/loot";
import type { Locale } from "@/lib/i18n";
import {
  getHighestUnlockedRegionId,
  isRegionUnlocked,
  normalizeUnlockedRegionIds,
} from "@/lib/game/progression";
import { getRegionById } from "@/lib/game/regions";

export type BossActionErrorCode =
  | "PLAYER_NOT_FOUND"
  | "BOSS_NOT_FOUND"
  | "REGION_NOT_UNLOCKED"
  | "DAILY_LIMIT";

export class BossActionError extends Error {
  constructor(
    readonly code: BossActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BossActionError";
  }
}

export type BossPlayerSnapshot = {
  id: string;
  name: string;
  power: number;
  currentRegionId: string;
  effectStats: RewardEffectStats;
};

export type BossProgressSnapshot = {
  bossId: string;
  challengeDay: string | null;
  challengesUsed: number;
  clearCount: number;
  firstClearedAt: Date | null;
};

export type BossChallengeRepository = {
  findPlayerById(playerId: string): Promise<BossPlayerSnapshot | null>;
  getUnlockedRegionIds(playerId: string): Promise<string[]>;
  getBossProgress(playerId: string, bossId: string): Promise<BossProgressSnapshot | null>;
  applyBossChallenge(input: {
    playerId: string;
    bossId: string;
    challengeDay: string;
    dailyChallengeLimit: number;
    didWin: boolean;
    gold: number;
    exp: number;
    materials: { materialId: string; amount: number }[];
    items: Array<GeneratedEquipment & { sourceRegionId: string }>;
    playerLogMessage: string;
    playerLogPayload: string;
    firstClearGlobalMessage: string | null;
    unlockGlobalMessage: string | null;
    rareDropMessages: string[];
    unlockedRegionId: string | null;
  }): Promise<{
    status: "applied" | "daily_limit";
    remainingChallenges: number;
    clearCount: number;
    unlockedRegionId: string | null;
    wasFirstClear: boolean;
  }>;
};

export function clampWinChance(value: number) {
  return Math.max(0.1, Math.min(0.95, value));
}

export function calculateBossWinChance(playerPower: number, bossPower: number) {
  if (bossPower <= 0) {
    return 0.95;
  }

  return clampWinChance(playerPower / bossPower);
}

export function calculateBossCombatWinChance(
  playerPower: number,
  bossPower: number,
  effectStats: Partial<RewardEffectStats>,
) {
  return clampWinChance(
    calculateBossWinChance(playerPower, bossPower) +
      calculateBossWinChanceBonus(effectStats),
  );
}

export function formatChallengeDay(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getBossByRegionId(regionId: string) {
  return bossDefinitions.find((boss) => boss.regionId === regionId) ?? null;
}

export function getBossById(bossId: string) {
  return bossDefinitions.find((boss) => boss.id === bossId) ?? null;
}

function summarizeMaterials(
  materials: { materialId: string; amount: number }[],
  locale: Locale,
) {
  if (materials.length === 0) {
    return locale === "zh" ? "无" : "none";
  }

  return materials
    .map((material) => `${getMaterialName(material.materialId, locale)} x${material.amount}`)
    .join(locale === "zh" ? "、" : ", ");
}

function summarizeItems(
  items: Array<GeneratedEquipment & { sourceRegionId: string }>,
  locale: Locale,
) {
  if (items.length === 0) {
    return locale === "zh" ? "无" : "none";
  }

  return items.map((item) => item.name).join(locale === "zh" ? "、" : ", ");
}

export async function challengeBoss(
  repository: BossChallengeRepository,
  input: {
    playerId: string;
    locale?: Locale;
    now?: Date;
    random?: () => number;
  },
) {
  const locale = input.locale ?? "zh";
  const now = input.now ?? new Date();
  const random = input.random ?? Math.random;
  const player = await repository.findPlayerById(input.playerId);

  if (!player) {
    throw new BossActionError("PLAYER_NOT_FOUND", "Player not found.");
  }

  const unlockedRegionIds = normalizeUnlockedRegionIds(
    await repository.getUnlockedRegionIds(player.id),
    player.currentRegionId,
  );
  const targetRegionId = getHighestUnlockedRegionId(
    unlockedRegionIds,
    player.currentRegionId,
  );
  const targetRegion = getRegionById(targetRegionId);

  if (
    !targetRegion ||
    !isRegionUnlocked(targetRegion.id, unlockedRegionIds, player.currentRegionId)
  ) {
    throw new BossActionError("REGION_NOT_UNLOCKED", "Region is not unlocked.");
  }

  const boss = getBossById(targetRegion.bossId);

  if (!boss) {
    throw new BossActionError("BOSS_NOT_FOUND", "Boss not found.");
  }

  const challengeDay = formatChallengeDay(now);
  const winChance = calculateBossCombatWinChance(
    player.power,
    boss.power,
    player.effectStats,
  );
  const didWin = random() < winChance;
  const gold = didWin ? applyGoldBonus(boss.rewardGold, player.effectStats) : 0;
  const exp = didWin ? applyExpBonus(boss.rewardExp, player.effectStats) : 0;
  const rewardItemCount = didWin
    ? scaleDropRollCount(boss.rewardItemCount, player.effectStats, random)
    : 0;
  const materials = didWin ? boss.rewardMaterials : [];
  const items = didWin
    ? Array.from({ length: rewardItemCount }, () => ({
        ...generateEquipmentDrop(
          boss.rewardDropTableId,
          random,
          locale,
          player.effectStats,
        ),
        sourceRegionId: boss.regionId,
      }))
    : [];
  const unlockedRegionId = didWin ? targetRegion.unlocksRegionId : null;
  const unlockedRegion = unlockedRegionId ? getRegionById(unlockedRegionId) : null;
  const bossName = getBossName(boss, locale);
  const regionName = getRegionName(targetRegion, locale);
  const materialSummary = summarizeMaterials(materials, locale);
  const itemSummary = summarizeItems(items, locale);

  const playerLogMessage = didWin
    ? locale === "zh"
      ? `击败了 ${bossName}，获得 ${gold} 金币、${exp} 经验，材料 ${materialSummary}，装备 ${itemSummary}。`
      : `Defeated ${bossName} and earned ${gold} gold, ${exp} exp, materials ${materialSummary}, and items ${itemSummary}.`
    : locale === "zh"
      ? `挑战 ${bossName} 失败了，这次没能突破 ${regionName}。`
      : `Lost the challenge against ${bossName}.`;

  const rareDropMessages = didWin
    ? items
        .filter((item) => item.rarity === "epic" || item.rarity === "legendary")
        .map((item) =>
          locale === "zh"
            ? `${player.name} 击败 ${bossName} 后掉落了稀有装备 ${item.name}。`
            : `${player.name} defeated ${bossName} and found rare gear ${item.name}.`,
        )
    : [];

  const applyResult = await repository.applyBossChallenge({
    playerId: player.id,
    bossId: boss.id,
    challengeDay,
    dailyChallengeLimit: boss.dailyChallengeLimit,
    didWin,
    gold,
    exp,
    materials,
    items,
    playerLogMessage,
    playerLogPayload: JSON.stringify({
      bossId: boss.id,
      bossName,
      regionId: targetRegion.id,
      regionName,
      didWin,
      winChance,
      gold,
      exp,
      materials,
      items: items.map((item) => ({
        name: item.name,
        slot: item.slot,
        rarity: item.rarity,
      })),
      challengeDay,
    }),
    firstClearGlobalMessage:
      locale === "zh"
        ? `${player.name} 首次击败了 ${bossName}。`
        : `${player.name} cleared ${bossName} for the first time.`,
    unlockGlobalMessage:
      didWin && unlockedRegion
        ? locale === "zh"
          ? `${player.name} 解锁了新区 ${getRegionName(unlockedRegion, locale)}。`
          : `${player.name} unlocked ${getRegionName(unlockedRegion, locale)}.`
        : null,
    rareDropMessages,
    unlockedRegionId,
  });

  if (applyResult.status === "daily_limit") {
    throw new BossActionError("DAILY_LIMIT", "Daily challenge limit reached.");
  }

  return {
    boss,
    bossName,
    bossDescription: getBossDescription(boss, locale),
    region: targetRegion,
    regionName,
    didWin,
    winChance,
    remainingChallenges: applyResult.remainingChallenges,
    dailyChallengeLimit: boss.dailyChallengeLimit,
    rewards: {
      gold,
      exp,
      materials,
      items,
    },
    unlockedRegionId: applyResult.unlockedRegionId,
    wasFirstClear: applyResult.wasFirstClear,
    clearCount: applyResult.clearCount,
  };
}
