import { getRegionDescription, getRegionName } from "@/data/regions";
import { applyExpBonus, applyGoldBonus, type RewardEffectStats } from "@/lib/game/effects";
import { getRegionById, isRegionAccessible } from "@/lib/game/regions";
import {
  IdleActionError,
  MINIMUM_CLAIM_MINUTES,
  calculateIdleRewards,
  describeMaterialRewards,
} from "@/lib/game/idle";
import { generateRegionDrops, type GeneratedEquipment } from "@/lib/game/loot";
import type { Locale } from "@/lib/i18n";
import { isRegionUnlocked, normalizeUnlockedRegionIds } from "@/lib/game/progression";

export type IdlePlayerSnapshot = {
  id: string;
  name: string;
  power: number;
  currentRegionId: string;
  lastClaimAt: Date;
  effectStats: RewardEffectStats;
};

type ClaimGeneratedItem = GeneratedEquipment & {
  sourceRegionId: string;
};

export type IdleClaimResult = {
  logId: string;
  regionId: string;
  regionName: string;
  regionDescription: string;
  claimableMinutes: number;
  gold: number;
  exp: number;
  materials: {
    materialId: string;
    amount: number;
  }[];
  items: ClaimGeneratedItem[];
  message: string;
};

export type IdleRepository = {
  findPlayerById(playerId: string): Promise<IdlePlayerSnapshot | null>;
  getUnlockedRegionIds(playerId: string): Promise<string[]>;
  applyClaim(input: {
    playerId: string;
    expectedLastClaimAt: Date;
    nextLastClaimAt: Date;
    goldDelta: number;
    expDelta: number;
    materials: {
      materialId: string;
      amount: number;
    }[];
    items: ClaimGeneratedItem[];
    logMessage: string;
    logPayload: string;
  }): Promise<string | null>;
  updateCurrentRegion(input: {
    playerId: string;
    regionId: string;
  }): Promise<void>;
};

export async function claimIdleRewards(
  repository: IdleRepository,
  input: {
    playerId: string;
    now?: Date;
    locale?: Locale;
  },
) {
  const locale = input.locale ?? "zh";
  const player = await repository.findPlayerById(input.playerId);

  if (!player) {
    throw new IdleActionError("PLAYER_NOT_FOUND", "Player not found.");
  }

  const region = getRegionById(player.currentRegionId);

  if (!region) {
    throw new IdleActionError("REGION_NOT_FOUND", "Region not found.");
  }

  const now = input.now ?? new Date();
  const rewards = calculateIdleRewards(region, now.getTime() - player.lastClaimAt.getTime());
  const gold = applyGoldBonus(rewards.gold, player.effectStats);
  const exp = applyExpBonus(rewards.exp, player.effectStats);
  const items = generateRegionDrops(
    region.dropTableId,
    rewards.claimableMinutes,
    Math.random,
    locale,
    player.effectStats,
  ).map((item) => ({
    ...item,
    sourceRegionId: region.id,
  }));

  if (rewards.claimableMinutes < MINIMUM_CLAIM_MINUTES) {
    throw new IdleActionError(
      "NOT_READY",
      "At least 1 minute is required before claiming rewards.",
    );
  }

  const regionName = getRegionName(region, locale);
  const regionDescription = getRegionDescription(region, locale);
  const itemSummary =
    items.length > 0
      ? locale === "zh"
        ? `装备 ${items.length} 件`
        : `${items.length} gear drops`
      : locale === "zh"
        ? "没有装备掉落"
        : "no equipment found";
  const message =
    locale === "zh"
      ? `在 ${regionName} 挂机 ${rewards.claimableMinutes} 分钟，获得 ${gold} 金币、${exp} 经验、${describeMaterialRewards(rewards.materials, locale)}，${itemSummary}。`
      : `Farmed in ${regionName} for ${rewards.claimableMinutes} minutes and earned ${gold} gold, ${exp} exp, ${describeMaterialRewards(rewards.materials, locale)}, with ${itemSummary}.`;

  const logId = await repository.applyClaim({
    playerId: player.id,
    expectedLastClaimAt: player.lastClaimAt,
    nextLastClaimAt: now,
    goldDelta: gold,
    expDelta: exp,
    materials: rewards.materials,
    items,
    logMessage: message,
    logPayload: JSON.stringify({
      regionId: region.id,
      regionName,
      regionDescription,
      claimableMinutes: rewards.claimableMinutes,
      gold,
      exp,
      materials: rewards.materials,
      items: items.map((item) => ({
        name: item.name,
        slot: item.slot,
        rarity: item.rarity,
      })),
      claimedAt: now.toISOString(),
    }),
  });

  if (!logId) {
    throw new IdleActionError(
      "DUPLICATE_CLAIM",
      "This idle reward window has already been claimed.",
    );
  }

  return {
    logId,
    regionId: region.id,
    regionName,
    regionDescription,
    claimableMinutes: rewards.claimableMinutes,
    gold,
    exp,
    materials: rewards.materials,
    items,
    message,
  } satisfies IdleClaimResult;
}

export async function changeIdleRegion(
  repository: IdleRepository,
  input: {
    playerId: string;
    regionId: string;
  },
) {
  const player = await repository.findPlayerById(input.playerId);

  if (!player) {
    throw new IdleActionError("PLAYER_NOT_FOUND", "Player not found.");
  }

  const region = getRegionById(input.regionId);

  if (!region) {
    throw new IdleActionError("REGION_NOT_FOUND", "Region not found.");
  }

  const unlockedRegionIds = normalizeUnlockedRegionIds(
    await repository.getUnlockedRegionIds(player.id),
    player.currentRegionId,
  );

  if (!isRegionUnlocked(region.id, unlockedRegionIds, player.currentRegionId)) {
    throw new IdleActionError(
      "POWER_GATE",
      "This region has not been unlocked yet.",
    );
  }

  if (
    !isRegionAccessible(
      region,
      player.power,
      unlockedRegionIds,
      player.currentRegionId,
    )
  ) {
    throw new IdleActionError(
      "POWER_GATE",
      "Your power is too low for this region.",
    );
  }

  await repository.updateCurrentRegion({
    playerId: player.id,
    regionId: region.id,
  });

  return region;
}
