import type { Locale } from "@/lib/i18n";
import {
  applyExpBonus,
  applyGoldBonus,
  type RewardEffectStats,
} from "@/lib/game/effects";
import { formatWorldBossDay } from "@/lib/game/world-boss";

export type BlessingActionErrorCode =
  | "PLAYER_NOT_FOUND"
  | "TARGET_NOT_FOUND"
  | "SELF_TARGET"
  | "DAILY_LIMIT";

export class BlessingActionError extends Error {
  constructor(
    readonly code: BlessingActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BlessingActionError";
  }
}

export type BlessingPlayerSnapshot = {
  id: string;
  name: string;
  effectStats: RewardEffectStats;
};

export type BlessingRepository = {
  findPlayerById(playerId: string): Promise<BlessingPlayerSnapshot | null>;
  applyBlessing(input: {
    playerId: string;
    targetPlayerId: string;
    dayKey: string;
    goldGranted: number;
    expGranted: number;
    targetLogMessage: string;
    globalLogMessage: string;
  }): Promise<{
    status: "sent" | "daily_limit";
  }>;
};

export const dailyBlessingReward = {
  gold: 40,
  exp: 30,
};

export async function sendBlessing(
  repository: BlessingRepository,
  input: {
    playerId: string;
    targetPlayerId: string;
    locale?: Locale;
    now?: Date;
  },
) {
  const locale = input.locale ?? "zh";
  const now = input.now ?? new Date();
  const dayKey = formatWorldBossDay(now);
  const sender = await repository.findPlayerById(input.playerId);

  if (!sender) {
    throw new BlessingActionError("PLAYER_NOT_FOUND", "Player not found.");
  }

  const target = await repository.findPlayerById(input.targetPlayerId);

  if (!target) {
    throw new BlessingActionError("TARGET_NOT_FOUND", "Target player not found.");
  }

  if (sender.id === target.id) {
    throw new BlessingActionError("SELF_TARGET", "Cannot bless yourself.");
  }

  const goldGranted = applyGoldBonus(dailyBlessingReward.gold, target.effectStats);
  const expGranted = applyExpBonus(dailyBlessingReward.exp, target.effectStats);

  const result = await repository.applyBlessing({
    playerId: sender.id,
    targetPlayerId: target.id,
    dayKey,
    goldGranted,
    expGranted,
    targetLogMessage:
      locale === "zh"
        ? `${sender.name} 给你送来了今日祝福，你额外获得 ${goldGranted} 金币和 ${expGranted} 经验。`
        : `${sender.name} sent you today's blessing. You gained ${goldGranted} gold and ${expGranted} exp.`,
    globalLogMessage:
      locale === "zh"
        ? `${sender.name} 向 ${target.name} 送出了今日祝福。`
        : `${sender.name} sent today's blessing to ${target.name}.`,
  });

  if (result.status === "daily_limit") {
    throw new BlessingActionError("DAILY_LIMIT", "Daily blessing limit reached.");
  }

  return {
    sender,
    target,
    goldGranted,
    expGranted,
    dayKey,
  };
}
