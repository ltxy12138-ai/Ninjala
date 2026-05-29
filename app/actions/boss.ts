"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import {
  BossActionError,
  challengeBoss,
  serializeBossBattleSummary,
} from "@/lib/game/boss";
import { coerceRewardEffectStats } from "@/lib/game/effects";
import { calculatePowerFromEquippedItems } from "@/lib/game/equipment";
import { normalizeStoredItemSlot } from "@/lib/game/item-slot";
import { applyExpReward } from "@/lib/game/leveling";
import { getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";
import {
  WorldBossActionError,
  attackWorldBoss,
  claimWorldBossRewards,
} from "@/lib/game/world-boss";

function buildBossRedirectUrl(
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

  return query ? `/boss?${query}` : "/boss";
}

function toBossErrorCode(error: unknown) {
  if (error instanceof BossActionError) {
    return error.code;
  }

  return "UNKNOWN";
}

function toWorldBossErrorCode(error: unknown) {
  if (error instanceof WorldBossActionError) {
    return error.code;
  }

  return "UNKNOWN";
}

function createBossRepository() {
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
    async getUnlockedRegionIds(playerId: string) {
      const rows = await db.playerUnlockedRegion.findMany({
        where: { playerId },
        select: { regionId: true },
      });

      return rows.map((row) => row.regionId);
    },
    async getBossProgress(playerId: string, bossId: string) {
      return db.playerBossProgress.findUnique({
        where: {
          playerId_bossId: {
            playerId,
            bossId,
          },
        },
      });
    },
    async applyBossChallenge(input: {
      playerId: string;
      bossId: string;
      challengeDay: string;
      dailyChallengeLimit: number;
      didWin: boolean;
      gold: number;
      exp: number;
      materials: { materialId: string; amount: number }[];
      items: Array<{
        baseItemId: string;
        sourceRegionId: string;
        name: string;
        slot: string;
        rarity: string;
        affixIds: string[];
        affixStats: Record<string, number>[];
        stats: Record<string, number>;
      }>;
      playerLogMessage: string;
      playerLogPayload: string;
      firstClearGlobalMessage: string | null;
      unlockGlobalMessage: string | null;
      rareDropMessages: string[];
      unlockedRegionId: string | null;
    }) {
      return db.$transaction(async (tx) => {
        const existingProgress = await tx.playerBossProgress.findUnique({
          where: {
            playerId_bossId: {
              playerId: input.playerId,
              bossId: input.bossId,
            },
          },
        });
        const todayProgressRows = await tx.playerBossProgress.findMany({
          where: {
            playerId: input.playerId,
            challengeDay: input.challengeDay,
          },
          select: {
            challengesUsed: true,
          },
        });
        const totalChallengesUsedToday = todayProgressRows.reduce(
          (sum, row) => sum + row.challengesUsed,
          0,
        );

        const challengesUsed =
          existingProgress?.challengeDay === input.challengeDay
            ? existingProgress.challengesUsed
            : 0;

        if (totalChallengesUsedToday >= input.dailyChallengeLimit) {
          return {
            status: "daily_limit" as const,
            remainingChallenges: 0,
            clearCount: existingProgress?.clearCount ?? 0,
            unlockedRegionId: null,
            wasFirstClear: false,
          };
        }

        const nextChallengesUsed = challengesUsed + 1;
        const wasFirstClear = input.didWin && (existingProgress?.clearCount ?? 0) === 0;
        const nextClearCount =
          (existingProgress?.clearCount ?? 0) + (input.didWin ? 1 : 0);
        let wasNewUnlock = false;

        await tx.playerBossProgress.upsert({
          where: {
            playerId_bossId: {
              playerId: input.playerId,
              bossId: input.bossId,
            },
          },
          update: {
            challengeDay: input.challengeDay,
            challengesUsed: nextChallengesUsed,
            clearCount: nextClearCount,
            firstClearedAt:
              wasFirstClear
                ? new Date()
                : existingProgress?.firstClearedAt ?? null,
          },
          create: {
            playerId: input.playerId,
            bossId: input.bossId,
            challengeDay: input.challengeDay,
            challengesUsed: nextChallengesUsed,
            clearCount: nextClearCount,
            firstClearedAt: input.didWin ? new Date() : null,
          },
        });

        if (input.didWin) {
          const currentPlayer = await tx.player.findUnique({
            where: { id: input.playerId },
            select: {
              exp: true,
            },
          });

          if (!currentPlayer) {
            return {
              status: "daily_limit" as const,
              remainingChallenges: 0,
              clearCount: existingProgress?.clearCount ?? 0,
              unlockedRegionId: null,
              wasFirstClear: false,
            };
          }

          const nextProgress = applyExpReward(currentPlayer.exp, input.exp);

          await tx.player.update({
            where: { id: input.playerId },
            data: {
              gold: { increment: input.gold },
              exp: nextProgress.exp,
              level: nextProgress.level,
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
                amount: { increment: material.amount },
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
                attack: item.stats.attack ?? 0,
                defense: item.stats.defense ?? 0,
                hp: item.stats.hp ?? 0,
                luck: item.stats.luck ?? 0,
                crit: item.stats.crit ?? 0,
                goldBonus: item.stats.goldBonus ?? 0,
                expBonus: item.stats.expBonus ?? 0,
                dropBonus: item.stats.dropBonus ?? 0,
                affixIds: JSON.stringify(item.affixIds),
                affixStats: JSON.stringify(item.affixStats),
              },
            });
          }

          if (input.unlockedRegionId) {
            const existingUnlock = await tx.playerUnlockedRegion.findUnique({
              where: {
                playerId_regionId: {
                  playerId: input.playerId,
                  regionId: input.unlockedRegionId,
                },
              },
            });

            await tx.playerUnlockedRegion.upsert({
              where: {
                playerId_regionId: {
                  playerId: input.playerId,
                  regionId: input.unlockedRegionId,
                },
              },
              update: {},
              create: {
                playerId: input.playerId,
                regionId: input.unlockedRegionId,
              },
            });

            wasNewUnlock = !existingUnlock;
          }
        }

        await tx.gameLog.create({
          data: {
            playerId: input.playerId,
            type: "BOSS_CHALLENGE",
            message: input.playerLogMessage,
            payload: input.playerLogPayload,
          },
        });

        if (input.didWin && wasFirstClear && input.firstClearGlobalMessage) {
          await tx.gameLog.create({
            data: {
              playerId: null,
              type: "BOSS_CLEAR",
              message: input.firstClearGlobalMessage,
            },
          });
        }

        if (input.didWin && wasNewUnlock && input.unlockGlobalMessage) {
          await tx.gameLog.create({
            data: {
              playerId: null,
              type: "REGION_UNLOCK",
              message: input.unlockGlobalMessage,
            },
          });
        }

        for (const rareDropMessage of input.rareDropMessages) {
          await tx.gameLog.create({
            data: {
              playerId: null,
              type: "RARE_DROP",
              message: rareDropMessage,
            },
          });
        }

        return {
          status: "applied" as const,
          remainingChallenges:
            input.dailyChallengeLimit - (totalChallengesUsedToday + 1),
          clearCount: nextClearCount,
          unlockedRegionId: input.didWin && wasNewUnlock ? input.unlockedRegionId : null,
          wasFirstClear,
        };
      });
    },
  };
}

function createWorldBossRepository() {
  const db = getDb();

  return {
    async findPlayerById(playerId: string) {
      const player = await db.player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          name: true,
          power: true,
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
    async ensureWorldBossState(input: {
      cycleDay: string;
      bossId: string;
      maxHp: number;
    }) {
      return db.worldBossState.upsert({
        where: {
          cycleDay: input.cycleDay,
        },
        update: {},
        create: {
          cycleDay: input.cycleDay,
          bossId: input.bossId,
          currentHp: input.maxHp,
          maxHp: input.maxHp,
          status: "ACTIVE",
        },
      });
    },
    async applyWorldBossAttack(input: {
      playerId: string;
      cycleDay: string;
      worldBossStateId: string;
      bossId: string;
      dailyAttackLimit: number;
      damage: number;
      attackLogMessage: string;
      clearGlobalMessage: string;
    }) {
      return db.$transaction(async (tx) => {
        const state = await tx.worldBossState.findUnique({
          where: { id: input.worldBossStateId },
        });

        if (!state || state.status === "DEFEATED" || state.currentHp <= 0) {
          return {
            status: "boss_defeated" as const,
            damageDealt: 0,
            remainingHp: 0,
            attacksUsed: 0,
            isFinalBlow: false,
            lastHitPlayerId: state?.lastHitPlayerId ?? null,
          };
        }

        const attacksUsed = await tx.worldBossAttackLog.count({
          where: {
            worldBossStateId: state.id,
            playerId: input.playerId,
            cycleDay: input.cycleDay,
            eventType: "ATTACK",
          },
        });

        if (attacksUsed >= input.dailyAttackLimit) {
          return {
            status: "attack_limit" as const,
            damageDealt: 0,
            remainingHp: state.currentHp,
            attacksUsed,
            isFinalBlow: false,
            lastHitPlayerId: state.lastHitPlayerId,
          };
        }

        const damageDealt = Math.min(input.damage, state.currentHp);
        const remainingHp = Math.max(0, state.currentHp - damageDealt);
        const isFinalBlow = remainingHp === 0;

        await tx.worldBossState.update({
          where: { id: state.id },
          data: {
            currentHp: remainingHp,
            status: isFinalBlow ? "DEFEATED" : state.status,
            defeatedAt: isFinalBlow ? new Date() : state.defeatedAt,
            lastHitPlayerId: isFinalBlow ? input.playerId : state.lastHitPlayerId,
          },
        });

        await tx.worldBossAttackLog.create({
          data: {
            worldBossStateId: state.id,
            playerId: input.playerId,
            cycleDay: input.cycleDay,
            eventType: "ATTACK",
            damage: damageDealt,
            isFinalBlow,
          },
        });

        await tx.gameLog.create({
          data: {
            playerId: input.playerId,
            type: "WORLD_BOSS_ATTACK",
            message: input.attackLogMessage,
          },
        });

        if (isFinalBlow) {
          await tx.gameLog.create({
            data: {
              playerId: null,
              type: "WORLD_BOSS_CLEAR",
              message: input.clearGlobalMessage,
            },
          });
        }

        return {
          status: "applied" as const,
          damageDealt,
          remainingHp,
          attacksUsed: attacksUsed + 1,
          isFinalBlow,
          lastHitPlayerId: isFinalBlow ? input.playerId : state.lastHitPlayerId,
        };
      });
    },
    async claimWorldBossReward(input: {
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
    }) {
      return db.$transaction(async (tx) => {
        const state = await tx.worldBossState.findUnique({
          where: { id: input.worldBossStateId },
        });

        if (!state || state.status !== "DEFEATED" || state.currentHp > 0) {
          return {
            status: "boss_not_defeated" as const,
          };
        }

        const participated = await tx.worldBossAttackLog.findFirst({
          where: {
            worldBossStateId: state.id,
            playerId: input.playerId,
            cycleDay: input.cycleDay,
            eventType: "ATTACK",
          },
        });

        if (!participated) {
          return {
            status: "not_participant" as const,
          };
        }

        const existingClaim = await tx.worldBossAttackLog.findFirst({
          where: {
            worldBossStateId: state.id,
            playerId: input.playerId,
            cycleDay: input.cycleDay,
            eventType: "REWARD_CLAIM",
          },
        });

        if (existingClaim) {
          return {
            status: "reward_already_claimed" as const,
          };
        }

        const currentPlayer = await tx.player.findUnique({
          where: { id: input.playerId },
          select: {
            exp: true,
          },
        });

        if (!currentPlayer) {
          return {
            status: "not_participant" as const,
          };
        }

        const nextProgress = applyExpReward(currentPlayer.exp, input.rewardExp);

        await tx.player.update({
          where: { id: input.playerId },
          data: {
            gold: {
              increment: input.rewardGold,
            },
            exp: nextProgress.exp,
            level: nextProgress.level,
          },
        });

        for (const material of input.rewardMaterials) {
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

        await tx.worldBossAttackLog.create({
          data: {
            worldBossStateId: state.id,
            playerId: input.playerId,
            cycleDay: input.cycleDay,
            eventType: "REWARD_CLAIM",
            rewardClaimedAt: new Date(),
          },
        });

        await tx.gameLog.create({
          data: {
            playerId: input.playerId,
            type: "WORLD_BOSS_REWARD",
            message: input.rewardLogMessage,
          },
        });

        return {
          status: "claimed" as const,
        };
      });
    },
  };
}

export async function challengeBossAction() {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const repository = createBossRepository();
  let result: Awaited<ReturnType<typeof challengeBoss>>;

  try {
    result = await challengeBoss(repository, {
      playerId: player.id,
      locale,
    });
  } catch (error) {
    redirect(
      buildBossRedirectUrl({
        tab: "main",
        result: "error",
        error: toBossErrorCode(error),
      }),
    );
  }

  revalidatePath("/boss");
  revalidatePath("/home");
  revalidatePath("/idle");
  revalidatePath("/inventory");
  revalidatePath("/characters");
  revalidatePath("/logs");
  revalidatePath("/rankings");

  redirect(
    buildBossRedirectUrl({
      tab: "main",
      result: result.didWin ? "win" : "lose",
      bossId: result.boss.id,
      battle: serializeBossBattleSummary(result.battleSummary),
      chance: Math.round(result.winChance * 100),
      remaining: result.remainingChallenges,
      unlocked: result.unlockedRegionId,
      firstClear: result.wasFirstClear ? "1" : null,
    }),
  );
}

export async function attackWorldBossAction() {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const repository = createWorldBossRepository();
  let result: Awaited<ReturnType<typeof attackWorldBoss>>;

  try {
    result = await attackWorldBoss(repository, {
      playerId: player.id,
      locale,
    });
  } catch (error) {
    redirect(
      buildBossRedirectUrl({
        tab: "world",
        worldAction: "attack",
        worldStatus: "error",
        worldError: toWorldBossErrorCode(error),
      }),
    );
  }

  revalidatePath("/boss");
  revalidatePath("/home");
  revalidatePath("/inventory");
  revalidatePath("/idle");
  revalidatePath("/logs");
  revalidatePath("/rankings");

  redirect(
    buildBossRedirectUrl({
      tab: "world",
      worldAction: "attack",
      worldStatus: "success",
      worldDamage: result.damageDealt,
      worldRemainingHp: result.remainingHp,
      worldFinal: result.isFinalBlow ? "1" : null,
    }),
  );
}

export async function claimWorldBossRewardAction() {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const repository = createWorldBossRepository();

  try {
    await claimWorldBossRewards(repository, {
      playerId: player.id,
      locale,
    });
  } catch (error) {
    redirect(
      buildBossRedirectUrl({
        tab: "world",
        worldAction: "claim",
        worldStatus: "error",
        worldError: toWorldBossErrorCode(error),
      }),
    );
  }

  revalidatePath("/boss");
  revalidatePath("/home");
  revalidatePath("/inventory");
  revalidatePath("/idle");
  revalidatePath("/logs");
  revalidatePath("/rankings");

  redirect(
    buildBossRedirectUrl({
      tab: "world",
      worldAction: "claim",
      worldStatus: "success",
    }),
  );
}
