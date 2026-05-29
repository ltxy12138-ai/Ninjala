"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { sendBlessing, BlessingActionError } from "@/lib/game/blessing";
import { coerceRewardEffectStats } from "@/lib/game/effects";
import { calculatePowerFromEquippedItems } from "@/lib/game/equipment";
import { normalizeStoredItemSlot } from "@/lib/game/item-slot";
import { applyExpReward } from "@/lib/game/leveling";
import { getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";

function buildRankingsRedirectUrl(
  values: Record<string, string | number | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();

  return query ? `/rankings?${query}` : "/rankings";
}

function getRankingsContextFromFormData(formData: FormData) {
  return {
    tab: String(formData.get("tab") ?? ""),
    page: String(formData.get("page") ?? ""),
  };
}

function toBlessingErrorCode(error: unknown) {
  if (error instanceof BlessingActionError) {
    return error.code;
  }

  return "UNKNOWN";
}

function createBlessingRepository() {
  const db = getDb();

  return {
    async findPlayerById(playerId: string) {
      const player = await db.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!player) {
        return null;
      }

      const equippedItems = await db.itemInstance.findMany({
        where: {
          playerId,
          equippedAt: { not: null },
        },
        select: {
          id: true,
          baseItemId: true,
          slot: true,
          equippedAt: true,
          equipSlotIndex: true,
          attack: true,
          defense: true,
          hp: true,
          luck: true,
          crit: true,
          goldBonus: true,
          expBonus: true,
          dropBonus: true,
        },
      });
      const totalStats = calculatePowerFromEquippedItems(
        equippedItems.map((item) => ({
          ...item,
          slot: normalizeStoredItemSlot(item.slot, item.baseItemId),
        })),
      ).totalStats;

      return {
        ...player,
        effectStats: coerceRewardEffectStats(totalStats),
      };
    },
    async applyBlessing(input: {
      playerId: string;
      targetPlayerId: string;
      dayKey: string;
      goldGranted: number;
      expGranted: number;
      targetLogMessage: string;
      globalLogMessage: string;
    }) {
      return db.$transaction(async (tx) => {
        const existing = await tx.blessing.findUnique({
          where: {
            playerId_dayKey: {
              playerId: input.playerId,
              dayKey: input.dayKey,
            },
          },
        });

        if (existing) {
          return {
            status: "daily_limit" as const,
          };
        }

        const targetPlayer = await tx.player.findUnique({
          where: { id: input.targetPlayerId },
          select: {
            exp: true,
          },
        });

        if (!targetPlayer) {
          return {
            status: "daily_limit" as const,
          };
        }

        const nextProgress = applyExpReward(targetPlayer.exp, input.expGranted);

        await tx.player.update({
          where: { id: input.targetPlayerId },
          data: {
            gold: {
              increment: input.goldGranted,
            },
            exp: nextProgress.exp,
            level: nextProgress.level,
          },
        });

        await tx.blessing.create({
          data: {
            playerId: input.playerId,
            targetPlayerId: input.targetPlayerId,
            dayKey: input.dayKey,
            goldGranted: input.goldGranted,
            expGranted: input.expGranted,
          },
        });

        await tx.gameLog.create({
          data: {
            playerId: input.targetPlayerId,
            type: "BLESSING",
            message: input.targetLogMessage,
          },
        });

        await tx.gameLog.create({
          data: {
            playerId: null,
            type: "BLESSING",
            message: input.globalLogMessage,
          },
        });

        return {
          status: "sent" as const,
        };
      });
    },
  };
}

export async function sendBlessingAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getRankingsContextFromFormData(formData);
  const targetPlayerId = String(formData.get("targetPlayerId") ?? "");
  const repository = createBlessingRepository();
  let result: Awaited<ReturnType<typeof sendBlessing>>;

  try {
    result = await sendBlessing(repository, {
      playerId: player.id,
      targetPlayerId,
      locale,
    });
  } catch (error) {
    redirect(
      buildRankingsRedirectUrl({
        ...context,
        bless: "error",
        error: toBlessingErrorCode(error),
      }),
    );
  }

  revalidatePath("/home");
  revalidatePath("/idle");
  revalidatePath("/rankings");
  revalidatePath("/logs");

  redirect(
    buildRankingsRedirectUrl({
      ...context,
      bless: "success",
      target: result.target.name,
    }),
  );
}
