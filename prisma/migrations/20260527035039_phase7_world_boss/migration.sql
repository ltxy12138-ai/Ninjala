-- CreateTable
CREATE TABLE "WorldBossState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleDay" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "defeatedAt" DATETIME,
    "lastHitPlayerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorldBossAttackLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldBossStateId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "cycleDay" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "damage" INTEGER NOT NULL DEFAULT 0,
    "isFinalBlow" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorldBossAttackLog_worldBossStateId_fkey" FOREIGN KEY ("worldBossStateId") REFERENCES "WorldBossState" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldBossAttackLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldBossState_cycleDay_key" ON "WorldBossState"("cycleDay");

-- CreateIndex
CREATE INDEX "WorldBossState_status_cycleDay_idx" ON "WorldBossState"("status", "cycleDay");

-- CreateIndex
CREATE INDEX "WorldBossAttackLog_worldBossStateId_createdAt_idx" ON "WorldBossAttackLog"("worldBossStateId", "createdAt");

-- CreateIndex
CREATE INDEX "WorldBossAttackLog_playerId_cycleDay_eventType_idx" ON "WorldBossAttackLog"("playerId", "cycleDay", "eventType");
