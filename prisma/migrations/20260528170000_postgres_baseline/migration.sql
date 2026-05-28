-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."InviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "inviteCodeId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "power" INTEGER NOT NULL DEFAULT 0,
    "currentRegionId" TEXT NOT NULL DEFAULT 'region_001',
    "lastClaimAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaterialStack" (
    "playerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MaterialStack_pkey" PRIMARY KEY ("playerId","materialId")
);

-- CreateTable
CREATE TABLE "public"."ItemInstance" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "baseItemId" TEXT NOT NULL,
    "sourceRegionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "enhancementLevel" INTEGER NOT NULL DEFAULT 0,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 0,
    "luck" INTEGER NOT NULL DEFAULT 0,
    "crit" INTEGER NOT NULL DEFAULT 0,
    "goldBonus" INTEGER NOT NULL DEFAULT 0,
    "expBonus" INTEGER NOT NULL DEFAULT 0,
    "dropBonus" INTEGER NOT NULL DEFAULT 0,
    "affixIds" TEXT NOT NULL DEFAULT '[]',
    "equippedAt" TIMESTAMP(3),
    "equipSlotIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerUnlockedRegion" (
    "playerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerUnlockedRegion_pkey" PRIMARY KEY ("playerId","regionId")
);

-- CreateTable
CREATE TABLE "public"."PlayerBossProgress" (
    "playerId" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "challengeDay" TEXT,
    "challengesUsed" INTEGER NOT NULL DEFAULT 0,
    "clearCount" INTEGER NOT NULL DEFAULT 0,
    "firstClearedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerBossProgress_pkey" PRIMARY KEY ("playerId","bossId")
);

-- CreateTable
CREATE TABLE "public"."WorldBossState" (
    "id" TEXT NOT NULL,
    "cycleDay" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "defeatedAt" TIMESTAMP(3),
    "lastHitPlayerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldBossState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorldBossAttackLog" (
    "id" TEXT NOT NULL,
    "worldBossStateId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "cycleDay" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "damage" INTEGER NOT NULL DEFAULT 0,
    "isFinalBlow" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldBossAttackLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blessing" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "targetPlayerId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "goldGranted" INTEGER NOT NULL,
    "expGranted" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blessing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "public"."InviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCodeId_key" ON "public"."User"("inviteCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "public"."Player"("userId");

-- CreateIndex
CREATE INDEX "ItemInstance_playerId_slot_idx" ON "public"."ItemInstance"("playerId", "slot");

-- CreateIndex
CREATE INDEX "ItemInstance_playerId_equippedAt_idx" ON "public"."ItemInstance"("playerId", "equippedAt");

-- CreateIndex
CREATE INDEX "ItemInstance_playerId_slot_equipSlotIndex_idx" ON "public"."ItemInstance"("playerId", "slot", "equipSlotIndex");

-- CreateIndex
CREATE INDEX "PlayerUnlockedRegion_playerId_unlockedAt_idx" ON "public"."PlayerUnlockedRegion"("playerId", "unlockedAt");

-- CreateIndex
CREATE INDEX "PlayerBossProgress_playerId_updatedAt_idx" ON "public"."PlayerBossProgress"("playerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorldBossState_cycleDay_key" ON "public"."WorldBossState"("cycleDay");

-- CreateIndex
CREATE INDEX "WorldBossState_status_cycleDay_idx" ON "public"."WorldBossState"("status", "cycleDay");

-- CreateIndex
CREATE INDEX "WorldBossAttackLog_worldBossStateId_createdAt_idx" ON "public"."WorldBossAttackLog"("worldBossStateId", "createdAt");

-- CreateIndex
CREATE INDEX "WorldBossAttackLog_playerId_cycleDay_eventType_idx" ON "public"."WorldBossAttackLog"("playerId", "cycleDay", "eventType");

-- CreateIndex
CREATE INDEX "Blessing_targetPlayerId_dayKey_idx" ON "public"."Blessing"("targetPlayerId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "Blessing_playerId_dayKey_key" ON "public"."Blessing"("playerId", "dayKey");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "public"."InviteCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameLog" ADD CONSTRAINT "GameLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialStack" ADD CONSTRAINT "MaterialStack_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemInstance" ADD CONSTRAINT "ItemInstance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerUnlockedRegion" ADD CONSTRAINT "PlayerUnlockedRegion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerBossProgress" ADD CONSTRAINT "PlayerBossProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorldBossAttackLog" ADD CONSTRAINT "WorldBossAttackLog_worldBossStateId_fkey" FOREIGN KEY ("worldBossStateId") REFERENCES "public"."WorldBossState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorldBossAttackLog" ADD CONSTRAINT "WorldBossAttackLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blessing" ADD CONSTRAINT "Blessing_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blessing" ADD CONSTRAINT "Blessing_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
