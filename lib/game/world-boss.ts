import {
  getWorldBossDescription,
  getWorldBossName,
  worldBossDefinitions,
} from "@/data/world-bosses";
import { getMaterialName } from "@/data/materials";
import {
  applyExpBonus,
  applyGoldBonus,
  calculateWorldBossDamageMultiplier,
  type RewardEffectStats,
} from "@/lib/game/effects";
import type { Locale } from "@/lib/i18n";
import { generateGlobalFlavor } from "@/lib/ai/global-log";

export type WorldBossActionErrorCode =
  | "PLAYER_NOT_FOUND"
  | "ATTACK_LIMIT"
  | "BOSS_DEFEATED"
  | "NOT_PARTICIPANT"
  | "BOSS_NOT_DEFEATED"
  | "REWARD_ALREADY_CLAIMED";

export class WorldBossActionError extends Error {
  constructor(
    readonly code: WorldBossActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WorldBossActionError";
  }
}

export type WorldBossPlayerSnapshot = {
  id: string;
  name: string;
  power: number;
  effectStats: RewardEffectStats;
};

export type WorldBossStateSnapshot = {
  id: string;
  bossId: string;
  cycleDay: string;
  currentHp: number;
  maxHp: number;
  status: string;
  defeatedAt: Date | null;
  lastHitPlayerId: string | null;
};

export type WorldBossRepository = {
  findPlayerById(playerId: string): Promise<WorldBossPlayerSnapshot | null>;
  ensureWorldBossState(input: {
    cycleDay: string;
    bossId: string;
    maxHp: number;
  }): Promise<WorldBossStateSnapshot>;
  applyWorldBossAttack(input: {
    playerId: string;
    cycleDay: string;
    worldBossStateId: string;
    bossId: string;
    dailyAttackLimit: number;
    damage: number;
    attackLogMessage: string;
    clearGlobalMessage: string;
  }): Promise<{
    status: "applied" | "attack_limit" | "boss_defeated";
    damageDealt: number;
    remainingHp: number;
    attacksUsed: number;
    isFinalBlow: boolean;
    lastHitPlayerId: string | null;
  }>;
  claimWorldBossReward(input: {
    playerId: string;
    cycleDay: string;
    worldBossStateId: string;
    rewardGold: number;
    rewardExp: number;
    rewardMaterials: {
      materialId: string;
      amount: number;
    }[];
    rewardLogMessage: string;
  }): Promise<{
    status:
      | "claimed"
      | "not_participant"
      | "boss_not_defeated"
      | "reward_already_claimed";
  }>;
};

export function formatWorldBossDay(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaySeed(dayKey: string) {
  return dayKey
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getWorldBossForDay(dayKey: string) {
  const index = getDaySeed(dayKey) % worldBossDefinitions.length;

  return worldBossDefinitions[index]!;
}

export function calculateWorldBossDamage(
  playerPower: number,
  effectStats: Partial<RewardEffectStats> = {},
) {
  const baseDamage = Math.max(1, Math.round(Math.max(10, playerPower) * 0.9));

  return Math.max(
    1,
    Math.round(baseDamage * calculateWorldBossDamageMultiplier(effectStats)),
  );
}

export function clampWorldBossHp(currentHp: number, damage: number) {
  return Math.max(0, currentHp - Math.max(0, damage));
}

function summarizeWorldBossMaterials(
  materials: {
    materialId: string;
    amount: number;
  }[],
  locale: Locale,
) {
  return materials
    .map(
      (material) =>
        `${getMaterialName(material.materialId, locale)} x${material.amount}`,
    )
    .join(locale === "zh" ? "、" : ", ");
}

export async function attackWorldBoss(
  repository: WorldBossRepository,
  input: {
    playerId: string;
    locale?: Locale;
    now?: Date;
  },
) {
  const locale = input.locale ?? "zh";
  const now = input.now ?? new Date();
  const cycleDay = formatWorldBossDay(now);
  const player = await repository.findPlayerById(input.playerId);

  if (!player) {
    throw new WorldBossActionError("PLAYER_NOT_FOUND", "Player not found.");
  }

  const boss = getWorldBossForDay(cycleDay);
  const bossName = getWorldBossName(boss, locale);
  const state = await repository.ensureWorldBossState({
    cycleDay,
    bossId: boss.id,
    maxHp: boss.maxHp,
  });

  const desiredDamage = calculateWorldBossDamage(player.power, player.effectStats);
  const damage = Math.min(desiredDamage, state.currentHp);

  // Build attack log message
  const attackLogMessage =
    locale === "zh"
      ? `${player.name} 对世界 Boss ${bossName} 造成了 ${damage} 点伤害。`
      : `${player.name} dealt ${damage} damage to the world boss ${bossName}.`;

  // Enrich world boss clear message with AI flavor
  const enrichedClearMessage = (await generateGlobalFlavor({
    locale,
    eventType: "WORLD_BOSS_CLEAR",
    playerName: player.name,
    bossName,
  })).message;

  const applyResult = await repository.applyWorldBossAttack({
    playerId: player.id,
    cycleDay,
    worldBossStateId: state.id,
    bossId: boss.id,
    dailyAttackLimit: boss.dailyAttackLimit,
    damage,
    attackLogMessage,
    clearGlobalMessage: enrichedClearMessage,
  });

  if (applyResult.status === "attack_limit") {
    throw new WorldBossActionError("ATTACK_LIMIT", "Daily attack limit reached.");
  }

  if (applyResult.status === "boss_defeated") {
    throw new WorldBossActionError("BOSS_DEFEATED", "World boss is already defeated.");
  }

  return {
    boss,
    bossName,
    bossDescription: getWorldBossDescription(boss, locale),
    cycleDay,
    damageDealt: applyResult.damageDealt,
    remainingHp: applyResult.remainingHp,
    maxHp: boss.maxHp,
    attacksUsed: applyResult.attacksUsed,
    remainingAttacks: Math.max(0, boss.dailyAttackLimit - applyResult.attacksUsed),
    isFinalBlow: applyResult.isFinalBlow,
    rewardGold: boss.rewardGold,
    rewardExp: boss.rewardExp,
    rewardMaterials: boss.rewardMaterials,
  };
}

export async function claimWorldBossRewards(
  repository: WorldBossRepository,
  input: {
    playerId: string;
    locale?: Locale;
    now?: Date;
  },
) {
  const locale = input.locale ?? "zh";
  const now = input.now ?? new Date();
  const cycleDay = formatWorldBossDay(now);
  const player = await repository.findPlayerById(input.playerId);

  if (!player) {
    throw new WorldBossActionError("PLAYER_NOT_FOUND", "Player not found.");
  }

  const boss = getWorldBossForDay(cycleDay);
  const bossName = getWorldBossName(boss, locale);
  const state = await repository.ensureWorldBossState({
    cycleDay,
    bossId: boss.id,
    maxHp: boss.maxHp,
  });

  const rewardGold = applyGoldBonus(boss.rewardGold, player.effectStats);
  const rewardExp = applyExpBonus(boss.rewardExp, player.effectStats);

  const claimResult = await repository.claimWorldBossReward({
    playerId: player.id,
    cycleDay,
    worldBossStateId: state.id,
    rewardGold,
    rewardExp,
    rewardMaterials: boss.rewardMaterials,
    rewardLogMessage:
      locale === "zh"
        ? `${player.name} 领取了世界 Boss ${bossName} 参与奖励：${rewardGold} 金币、${rewardExp} 经验、${summarizeWorldBossMaterials(boss.rewardMaterials, locale)}。`
        : `${player.name} claimed world boss rewards from ${bossName}: ${rewardGold} gold, ${rewardExp} exp, and ${summarizeWorldBossMaterials(boss.rewardMaterials, locale)}.`,
  });

  switch (claimResult.status) {
    case "not_participant":
      throw new WorldBossActionError("NOT_PARTICIPANT", "Player did not participate.");
    case "boss_not_defeated":
      throw new WorldBossActionError("BOSS_NOT_DEFEATED", "World boss is not defeated yet.");
    case "reward_already_claimed":
      throw new WorldBossActionError(
        "REWARD_ALREADY_CLAIMED",
        "World boss reward already claimed.",
      );
    default:
      return {
        boss,
        bossName,
        cycleDay,
        rewardGold,
        rewardExp,
        rewardMaterials: boss.rewardMaterials,
      };
  }
}
