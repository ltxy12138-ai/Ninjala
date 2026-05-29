import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { materialDefinitions } from "@/data/materials";
import { regionDefinitions } from "@/data/regions";
import { applyLevelDelta } from "@/lib/game/leveling";
import { STARTING_REGION_ID } from "@/lib/game/progression";

type DbLike = PrismaClient | Prisma.TransactionClient;

export const adminRoutePaths = [
  "/admin",
  "/home",
  "/idle",
  "/inventory",
  "/characters",
  "/boss",
  "/rankings",
  "/logs",
];

export function parseAdminInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

export async function resetPlayerProgress(
  db: DbLike,
  input: {
    playerId: string;
    nickname: string;
  },
) {
  await db.blessing.deleteMany({
    where: {
      OR: [{ playerId: input.playerId }, { targetPlayerId: input.playerId }],
    },
  });
  await db.worldBossAttackLog.deleteMany({
    where: { playerId: input.playerId },
  });
  await db.playerBossProgress.deleteMany({
    where: { playerId: input.playerId },
  });
  await db.playerUnlockedRegion.deleteMany({
    where: { playerId: input.playerId },
  });
  await db.itemInstance.deleteMany({
    where: { playerId: input.playerId },
  });
  await db.materialStack.deleteMany({
    where: { playerId: input.playerId },
  });
  await db.gameLog.deleteMany({
    where: { playerId: input.playerId },
  });
  await db.player.update({
    where: { id: input.playerId },
    data: {
      name: input.nickname,
      level: 1,
      exp: 0,
      gold: 0,
      power: 0,
      currentRegionId: STARTING_REGION_ID,
      lastClaimAt: new Date(),
    },
  });
  await db.playerUnlockedRegion.create({
    data: {
      playerId: input.playerId,
      regionId: STARTING_REGION_ID,
    },
  });
}

export async function resetAllPlayerProgress(db: DbLike) {
  const players = await db.player.findMany({
    include: {
      user: true,
    },
  });

  await db.blessing.deleteMany();
  await db.worldBossAttackLog.deleteMany();
  await db.worldBossState.deleteMany();
  await db.playerBossProgress.deleteMany();
  await db.playerUnlockedRegion.deleteMany();
  await db.itemInstance.deleteMany();
  await db.materialStack.deleteMany();
  await db.gameLog.deleteMany();

  for (const player of players) {
    await db.player.update({
      where: { id: player.id },
      data: {
        name: player.user.nickname,
        level: 1,
        exp: 0,
        gold: 0,
        power: 0,
        currentRegionId: STARTING_REGION_ID,
        lastClaimAt: new Date(),
      },
    });
  }

  if (players.length > 0) {
    await db.playerUnlockedRegion.createMany({
      data: players.map((player) => ({
        playerId: player.id,
        regionId: STARTING_REGION_ID,
      })),
    });
  }
}

export async function clearAllAccounts(db: DbLike) {
  await db.blessing.deleteMany();
  await db.worldBossAttackLog.deleteMany();
  await db.worldBossState.deleteMany();
  await db.playerBossProgress.deleteMany();
  await db.playerUnlockedRegion.deleteMany();
  await db.itemInstance.deleteMany();
  await db.materialStack.deleteMany();
  await db.gameLog.deleteMany();
  await db.player.deleteMany();
  await db.user.deleteMany();
}

export async function grantTestResources(
  db: DbLike,
  input: {
    playerId: string;
    gold: number;
    exp: number;
    levelDelta: number;
    idleMinutes: number;
    currentRegionId: string | null;
    unlockRegionId: string | null;
    materialAmounts: Record<string, number>;
  },
) {
  const player = await db.player.findUnique({
    where: { id: input.playerId },
    select: {
      id: true,
      currentRegionId: true,
      lastClaimAt: true,
      exp: true,
      level: true,
    },
  });

  if (!player) {
    return false;
  }

  const validCurrentRegionId =
    input.currentRegionId &&
    regionDefinitions.some((region) => region.id === input.currentRegionId)
      ? input.currentRegionId
      : null;
  const validUnlockRegionId =
    input.unlockRegionId &&
    regionDefinitions.some((region) => region.id === input.unlockRegionId)
      ? input.unlockRegionId
      : null;
  const nextProgress = applyLevelDelta(
    player.exp + Math.max(0, input.exp),
    player.level,
    input.levelDelta,
  );

  await db.player.update({
    where: { id: input.playerId },
    data: {
      gold: {
        increment: Math.max(0, input.gold),
      },
      exp: nextProgress.exp,
      level: nextProgress.level,
      currentRegionId: validCurrentRegionId ?? player.currentRegionId,
      lastClaimAt:
        input.idleMinutes > 0
          ? new Date(
              player.lastClaimAt.getTime() - Math.max(0, input.idleMinutes) * 60_000,
            )
          : player.lastClaimAt,
    },
  });

  for (const material of materialDefinitions) {
    const amount = Math.max(0, input.materialAmounts[material.id] ?? 0);

    if (amount < 1) {
      continue;
    }

    await db.materialStack.upsert({
      where: {
        playerId_materialId: {
          playerId: input.playerId,
          materialId: material.id,
        },
      },
      update: {
        amount: {
          increment: amount,
        },
      },
      create: {
        playerId: input.playerId,
        materialId: material.id,
        amount,
      },
    });
  }

  for (const regionId of [validUnlockRegionId, validCurrentRegionId]) {
    if (!regionId) {
      continue;
    }

    await db.playerUnlockedRegion.upsert({
      where: {
        playerId_regionId: {
          playerId: input.playerId,
          regionId,
        },
      },
      update: {},
      create: {
        playerId: input.playerId,
        regionId,
      },
    });
  }

  return true;
}
