"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { generateIdleFlavorLog } from "@/lib/ai/idle-log";
import { IdleActionError, serializeMaterials } from "@/lib/game/idle";
import { coerceRewardEffectStats } from "@/lib/game/effects";
import { changeIdleRegion, claimIdleRewards } from "@/lib/game/idle-service";
import { calculatePowerFromEquippedItems } from "@/lib/game/equipment";
import { applyExpReward } from "@/lib/game/leveling";
import { getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";
import { statKeys, type ItemSlot } from "@/lib/game/types";

function toIdleErrorCode(error: unknown) {
  if (error instanceof IdleActionError) {
    return error.code;
  }

  return "UNKNOWN";
}

function buildIdleRedirectUrl(
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

  return query ? `/idle?${query}` : "/idle";
}

function getIdleContextFromFormData(formData: FormData) {
  return {
    tab: String(formData.get("tab") ?? ""),
    regionView: String(formData.get("regionView") ?? ""),
  };
}

function serializeItemNames(
  items: Array<{
    name: string;
    rarity: string;
  }>,
) {
  return items.map((item) => `${item.rarity}:${item.name}`).join("|");
}

function createIdleRepository() {
  const db = getDb();

  return {
    async findPlayerById(playerId: string) {
      const player = await db.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          name: true,
          power: true,
          currentRegionId: true,
          lastClaimAt: true,
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
          slot: item.slot as ItemSlot,
        })),
      ).totalStats;

      return {
        ...player,
        effectStats: coerceRewardEffectStats(totalStats),
      };
    },
    async getUnlockedRegionIds(playerId: string) {
      const rows = await db.playerUnlockedRegion.findMany({
        where: { playerId },
        select: { regionId: true },
      });

      return rows.map((row) => row.regionId);
    },
    async applyClaim(input: {
      playerId: string;
      expectedLastClaimAt: Date;
      nextLastClaimAt: Date;
      goldDelta: number;
      expDelta: number;
      materials: {
        materialId: string;
        amount: number;
      }[];
      items: Array<{
        baseItemId: string;
        sourceRegionId: string;
        name: string;
        slot: string;
        rarity: string;
        affixIds: string[];
        stats: Record<(typeof statKeys)[number], number>;
      }>;
      logMessage: string;
      logPayload: string;
    }) {
      return db.$transaction(async (tx) => {
        const currentPlayer = await tx.player.findUnique({
          where: { id: input.playerId },
          select: {
            id: true,
            exp: true,
            lastClaimAt: true,
          },
        });

        if (
          !currentPlayer ||
          currentPlayer.lastClaimAt.getTime() !== input.expectedLastClaimAt.getTime()
        ) {
          return null;
        }

        const nextProgress = applyExpReward(currentPlayer.exp, input.expDelta);

        await tx.player.update({
          where: {
            id: input.playerId,
          },
          data: {
            gold: {
              increment: input.goldDelta,
            },
            exp: nextProgress.exp,
            level: nextProgress.level,
            lastClaimAt: input.nextLastClaimAt,
          },
        });

        for (const material of input.materials) {
          await tx.materialStack.upsert({
            where: {
              playerId_materialId: {
                playerId: input.playerId,
                materialId: material.materialId,
              },
            },
            update: {
              amount: {
                increment: material.amount,
              },
            },
            create: {
              playerId: input.playerId,
              materialId: material.materialId,
              amount: material.amount,
            },
          });
        }

        for (const item of input.items) {
          await tx.itemInstance.create({
            data: {
              playerId: input.playerId,
              baseItemId: item.baseItemId,
              sourceRegionId: item.sourceRegionId,
              name: item.name,
              slot: item.slot,
              rarity: item.rarity,
              attack: item.stats.attack,
              defense: item.stats.defense,
              hp: item.stats.hp,
              luck: item.stats.luck,
              crit: item.stats.crit,
              goldBonus: item.stats.goldBonus,
              expBonus: item.stats.expBonus,
              dropBonus: item.stats.dropBonus,
              affixIds: JSON.stringify(item.affixIds),
            },
          });
        }

        const log = await tx.gameLog.create({
          data: {
            playerId: input.playerId,
            type: "IDLE_CLAIM",
            message: input.logMessage,
            payload: input.logPayload,
          },
        });

        return log.id;
      });
    },
    async updateCurrentRegion(input: { playerId: string; regionId: string }) {
      await db.player.update({
        where: { id: input.playerId },
        data: {
          currentRegionId: input.regionId,
        },
      });
    },
  };
}

export async function claimIdleRewardsAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getIdleContextFromFormData(formData);
  const repository = createIdleRepository();
  let result: Awaited<ReturnType<typeof claimIdleRewards>>;

  try {
    result = await claimIdleRewards(repository, {
      playerId: player.id,
      locale,
    });
  } catch (error) {
    redirect(
      buildIdleRedirectUrl({
        ...context,
        claim: "error",
        error: toIdleErrorCode(error),
      }),
    );
  }

  const existingLog = await getDb().gameLog.findUnique({
    where: { id: result.logId },
    select: {
      id: true,
      payload: true,
    },
  });

  if (existingLog) {
    const flavor = await generateIdleFlavorLog({
      locale,
      playerName: player.name,
      regionName: result.regionName,
      regionDescription: result.regionDescription,
      claimableMinutes: result.claimableMinutes,
      gold: result.gold,
      exp: result.exp,
      materials: result.materials,
      items: result.items.map((item) => ({
        name: item.name,
        slot: item.slot,
        rarity: item.rarity,
      })),
      fallbackMessage: result.message,
    }, {
      apiKey: process.env.OPENAI_API_KEY,
    });

    let nextPayload: Record<string, unknown> = {};

    if (existingLog.payload) {
      try {
        nextPayload = JSON.parse(existingLog.payload) as Record<string, unknown>;
      } catch {
        nextPayload = {};
      }
    }

    nextPayload.flavorSource = flavor.source;
    nextPayload.flavorReason = flavor.reason;

    await getDb().gameLog.update({
      where: { id: existingLog.id },
      data: {
        message: flavor.message,
        payload: JSON.stringify(nextPayload),
      },
    });
  }

  revalidatePath("/home");
  revalidatePath("/idle");
  revalidatePath("/logs");

  redirect(
    buildIdleRedirectUrl({
      ...context,
      claim: "success",
      minutes: result.claimableMinutes,
      gold: result.gold,
      exp: result.exp,
      materials: serializeMaterials(result.materials),
      items: serializeItemNames(result.items),
      region: result.regionId,
    }),
  );
}

export async function changeIdleRegionAction(formData: FormData) {
  const { player } = await requireCurrentPlayer();
  const context = getIdleContextFromFormData(formData);
  const regionId = String(formData.get("regionId") ?? "");
  const repository = createIdleRepository();
  let region: Awaited<ReturnType<typeof changeIdleRegion>>;

  try {
    region = await changeIdleRegion(repository, {
      playerId: player.id,
      regionId,
    });
  } catch (error) {
    redirect(
      buildIdleRedirectUrl({
        ...context,
        regionChange: "error",
        error: toIdleErrorCode(error),
        region: regionId,
      }),
    );
  }

  revalidatePath("/home");
  revalidatePath("/idle");

  redirect(
    buildIdleRedirectUrl({
      ...context,
      regionChange: "success",
      region: region.id,
    }),
  );
}
