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
import {
  generateEquipmentDrop,
  generateEquipmentDropForSlot,
  type GeneratedEquipment,
} from "@/lib/game/loot";
import type { Locale } from "@/lib/i18n";
import {
  getHighestUnlockedRegionId,
  isRegionUnlocked,
  normalizeUnlockedRegionIds,
} from "@/lib/game/progression";
import { getRegionById } from "@/lib/game/regions";
import { generateGlobalFlavor } from "@/lib/ai/global-log";

export type BossActionErrorCode =
  | "PLAYER_NOT_FOUND"
  | "BOSS_NOT_FOUND"
  | "REGION_NOT_UNLOCKED"
  | "DAILY_LIMIT"
  | "POWER_GATE";

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

export type BossBattleTurn = {
  actor: "system" | "player" | "boss";
  message: string;
  playerHp: number;
  bossHp: number;
  emphasis?: "crit" | "reward" | "unlock" | "danger" | "finish";
};

export type BossBattleSummary = {
  playerName: string;
  bossName: string;
  regionName: string;
  unlockTargetName: string | null;
  playerPower: number;
  bossPower: number;
  playerStyle: string;
  bossStyle: string;
  playerStartHp: number;
  playerEndHp: number;
  bossStartHp: number;
  bossEndHp: number;
  didWin: boolean;
  critTriggered: boolean;
  battleTurns: BossBattleTurn[];
  rewardSummary: {
    gold: number;
    exp: number;
    materials: string[];
    items: string[];
    unlockText: string | null;
  };
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

export function serializeBossBattleSummary(summary: BossBattleSummary) {
  return Buffer.from(JSON.stringify(summary), "utf8").toString("base64url");
}

export function deserializeBossBattleSummary(serialized: string | null) {
  if (!serialized) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(serialized, "base64url").toString("utf8"),
    ) as BossBattleSummary;
  } catch {
    return null;
  }
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

function getPlayerBattleStyle(
  effectStats: Partial<RewardEffectStats>,
  locale: Locale,
) {
  const critScore = effectStats.crit ?? 0;
  const farmingScore =
    (effectStats.goldBonus ?? 0) + (effectStats.expBonus ?? 0) + (effectStats.dropBonus ?? 0);
  const luckScore = effectStats.luck ?? 0;

  if (critScore >= 4) {
    return locale === "zh" ? "暴击压制" : "Critical Pressure";
  }

  if (farmingScore >= 8) {
    return locale === "zh" ? "收益偏重" : "Reward Lean";
  }

  if (luckScore >= 5) {
    return locale === "zh" ? "灵巧周旋" : "Skirmish Flow";
  }

  return locale === "zh" ? "均衡推进" : "Balanced Push";
}

function getBossBattleStyle(bossPower: number, locale: Locale) {
  if (bossPower >= 4000) {
    return locale === "zh" ? "终段守门者" : "Late-Game Gatekeeper";
  }

  if (bossPower >= 2000) {
    return locale === "zh" ? "重压型首领" : "Heavy Pressure Boss";
  }

  return locale === "zh" ? "区域守门者" : "Regional Gatekeeper";
}

function buildBossBattleSummary(input: {
  player: BossPlayerSnapshot;
  bossName: string;
  bossPower: number;
  regionName: string;
  unlockTargetName: string | null;
  locale: Locale;
  didWin: boolean;
  winChance: number;
  gold: number;
  exp: number;
  materials: { materialId: string; amount: number }[];
  items: Array<GeneratedEquipment & { sourceRegionId: string }>;
}) {
  const {
    player,
    bossName,
    bossPower,
    regionName,
    unlockTargetName,
    locale,
    didWin,
    winChance,
    gold,
    exp,
    materials,
    items,
  } = input;
  const critTriggered =
    (player.effectStats.crit ?? 0) >= 3 ||
    ((player.effectStats.luck ?? 0) >= 4 && didWin) ||
    winChance >= 0.72;
  const playerStyle = getPlayerBattleStyle(player.effectStats, locale);
  const bossStyle = getBossBattleStyle(bossPower, locale);
  const playerStartHp = Math.max(180, Math.round(180 + player.power * 0.85));
  const bossStartHp = Math.max(240, Math.round(240 + bossPower * 0.72));
  const battleTurns: BossBattleTurn[] = [];

  const pushTurn = (
    actor: BossBattleTurn["actor"],
    message: string,
    playerHp: number,
    bossHp: number,
    emphasis?: BossBattleTurn["emphasis"],
  ) => {
    battleTurns.push({
      actor,
      message,
      playerHp: Math.max(0, playerHp),
      bossHp: Math.max(0, bossHp),
      emphasis,
    });
  };

  pushTurn(
    "system",
    locale === "zh"
      ? `${player.name} 在 ${regionName} 对上了 ${bossName}，双方先拉开架势。`
      : `${player.name} engages ${bossName} in ${regionName}.`,
    playerStartHp,
    bossStartHp,
  );

  if (didWin) {
    const bossHpAfterFirstHit = Math.max(
      1,
      Math.round(bossStartHp * (0.72 - Math.min(0.08, winChance * 0.05))),
    );
    const playerHpAfterCounter = Math.max(
      1,
      Math.round(playerStartHp * (0.78 + Math.min(0.1, winChance * 0.08))),
    );
    const bossHpAfterBurst = critTriggered
      ? Math.max(1, Math.round(bossHpAfterFirstHit * 0.34))
      : Math.max(1, Math.round(bossHpAfterFirstHit * 0.52));
    const playerHpBeforeFinish = Math.max(
      1,
      Math.round(playerHpAfterCounter * (critTriggered ? 0.92 : 0.84)),
    );
    const playerEndHp = Math.max(
      1,
      Math.round(playerHpBeforeFinish * (0.96 + Math.min(0.03, winChance * 0.02))),
    );

    pushTurn(
      "player",
      locale === "zh"
        ? `${player.name} 率先压上，打出一轮试探进攻。`
        : `${player.name} opens with a probing strike.`,
      playerStartHp,
      bossHpAfterFirstHit,
    );
    pushTurn(
      "boss",
      locale === "zh"
        ? `${bossName} 顶着攻势反扑，逼得你后撤半步。`
        : `${bossName} pushes back and forces a short retreat.`,
      playerHpAfterCounter,
      bossHpAfterFirstHit,
      "danger",
    );
    pushTurn(
      critTriggered ? "player" : "boss",
      critTriggered
        ? locale === "zh"
          ? `你抓到破绽打出关键一击，战局开始倾斜。`
          : `You find an opening and land a decisive burst.`
        : locale === "zh"
          ? `${bossName} 持续施压，但你仍稳住了节奏。`
          : `${bossName} keeps the pressure on, but you steady the pace.`,
      critTriggered ? playerHpAfterCounter : playerHpBeforeFinish,
      bossHpAfterBurst,
      critTriggered ? "crit" : undefined,
    );
    pushTurn(
      "player",
      locale === "zh"
        ? `${player.name} 完成收招，${bossName} 被彻底击溃。`
        : `${player.name} closes the fight and defeats ${bossName}.`,
      playerEndHp,
      0,
      "finish",
    );
    pushTurn(
      "system",
      unlockTargetName
        ? locale === "zh"
          ? `战利品已经结算，新区域 ${unlockTargetName} 已可继续推进。`
          : `Rewards have been granted and ${unlockTargetName} is now open.`
        : locale === "zh"
          ? "战利品已经结算，这一战没有新的区域可解锁。"
          : "Rewards have been granted and no further region unlock remains.",
      playerEndHp,
      0,
      unlockTargetName ? "unlock" : "reward",
    );

    return {
      playerName: player.name,
      bossName,
      regionName,
      unlockTargetName,
      playerPower: player.power,
      bossPower,
      playerStyle,
      bossStyle,
      playerStartHp,
      playerEndHp,
      bossStartHp,
      bossEndHp: 0,
      didWin,
      critTriggered,
      battleTurns,
      rewardSummary: {
        gold,
        exp,
        materials: materials.map(
          (material) => `${getMaterialName(material.materialId, locale)} x${material.amount}`,
        ),
        items: items.map((item) => item.name),
        unlockText: unlockTargetName
          ? locale === "zh"
            ? `解锁区域：${unlockTargetName}`
            : `Unlocked region: ${unlockTargetName}`
          : null,
      },
    } satisfies BossBattleSummary;
  }

  const bossHpAfterFirstHit = Math.max(1, Math.round(bossStartHp * 0.84));
  const playerHpAfterCounter = Math.max(1, Math.round(playerStartHp * 0.68));
  const bossHpAfterLastPush = Math.max(1, Math.round(bossStartHp * 0.72));

  pushTurn(
    "player",
    locale === "zh"
      ? `${player.name} 先手突进，但没能撕开 ${bossName} 的防线。`
      : `${player.name} strikes first but fails to break the defense.`,
    playerStartHp,
    bossHpAfterFirstHit,
  );
  pushTurn(
    "boss",
    locale === "zh"
      ? `${bossName} 很快回敬一击，正面压制住了节奏。`
      : `${bossName} answers quickly and takes over the pace.`,
    playerHpAfterCounter,
    bossHpAfterFirstHit,
    "danger",
  );
  pushTurn(
    "player",
    locale === "zh"
      ? `你尝试再次抢回主动，但输出仍旧不够彻底。`
      : `You try to seize the initiative again, but the damage is not enough.`,
    Math.max(1, Math.round(playerHpAfterCounter * 0.64)),
    bossHpAfterLastPush,
  );
  pushTurn(
    "boss",
    locale === "zh"
      ? `${bossName} 用最后一轮重击终结了这次挑战。`
      : `${bossName} ends the challenge with one last heavy blow.`,
    0,
    bossHpAfterLastPush,
    "finish",
  );
  pushTurn(
    "system",
    locale === "zh"
      ? "这次没能突破守门战，继续提升练度后再回来挑战。"
      : "You fail this time. Build more power and try again.",
    0,
    bossHpAfterLastPush,
  );

  return {
    playerName: player.name,
    bossName,
    regionName,
    unlockTargetName,
    playerPower: player.power,
    bossPower,
    playerStyle,
    bossStyle,
    playerStartHp,
    playerEndHp: 0,
    bossStartHp,
    bossEndHp: bossHpAfterLastPush,
    didWin,
    critTriggered,
    battleTurns,
    rewardSummary: {
      gold: 0,
      exp: 0,
      materials: [],
      items: [],
      unlockText: null,
    },
  } satisfies BossBattleSummary;
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

  const bossProgress = await repository.getBossProgress(player.id, boss.id);

  const unlockTargetRegion = targetRegion.unlocksRegionId
    ? getRegionById(targetRegion.unlocksRegionId)
    : null;

  if (
    unlockTargetRegion &&
    !isRegionUnlocked(unlockTargetRegion.id, unlockedRegionIds, player.currentRegionId) &&
    player.power < unlockTargetRegion.recommendedPower
  ) {
    throw new BossActionError("POWER_GATE", "Challenge gate power not met.");
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
  const isFirstWin = didWin && (bossProgress?.clearCount ?? 0) === 0;
  const items = didWin
    ? Array.from({ length: rewardItemCount }, () => ({
        ...generateEquipmentDrop(
          boss.rewardDropTableId,
          random,
          locale,
          player.effectStats,
        ),
        sourceRegionId: boss.regionId,
      })).concat(
        isFirstWin && boss.firstClearRewardSlot
          ? [
              {
                ...generateEquipmentDropForSlot(
                  boss.rewardDropTableId,
                  boss.firstClearRewardSlot,
                  random,
                  locale,
                  player.effectStats,
                  {
                    minRarity: boss.firstClearRewardMinRarity,
                  },
                ),
                sourceRegionId: boss.regionId,
              },
            ]
          : [],
      )
    : [];
  const unlockedRegionId = didWin ? targetRegion.unlocksRegionId : null;
  const unlockedRegion = unlockedRegionId ? getRegionById(unlockedRegionId) : null;
  const bossName = getBossName(boss, locale);
  const regionName = getRegionName(targetRegion, locale);
  const materialSummary = summarizeMaterials(materials, locale);
  const itemSummary = summarizeItems(items, locale);
  const battleSummary = buildBossBattleSummary({
    player,
    bossName,
    bossPower: boss.power,
    regionName,
    unlockTargetName: unlockTargetRegion
      ? getRegionName(unlockTargetRegion, locale)
      : null,
    locale,
    didWin,
    winChance,
    gold,
    exp,
    materials,
    items,
  });

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

  // Enrich rare drop messages with AI flavor
  const enrichedRareDropMessages = rareDropMessages.length > 0
    ? await Promise.all(
        rareDropMessages.map(async (_, index) => {
          const item = items.filter(
            (i) => i.rarity === "epic" || i.rarity === "legendary",
          )[index]!;
          const result = await generateGlobalFlavor({
            locale,
            eventType: "RARE_DROP",
            playerName: player.name,
            bossName,
            itemName: item.name,
            itemRarity: item.rarity,
          });
          return result.message;
        }),
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
      battleSummary,
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
    rareDropMessages: enrichedRareDropMessages,
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
    battleSummary,
    unlockedRegionId: applyResult.unlockedRegionId,
    wasFirstClear: applyResult.wasFirstClear,
    clearCount: applyResult.clearCount,
  };
}
