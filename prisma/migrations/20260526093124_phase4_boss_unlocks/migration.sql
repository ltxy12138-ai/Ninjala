-- CreateTable
CREATE TABLE "PlayerUnlockedRegion" (
    "playerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("playerId", "regionId"),
    CONSTRAINT "PlayerUnlockedRegion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerBossProgress" (
    "playerId" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "challengeDay" TEXT,
    "challengesUsed" INTEGER NOT NULL DEFAULT 0,
    "clearCount" INTEGER NOT NULL DEFAULT 0,
    "firstClearedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("playerId", "bossId"),
    CONSTRAINT "PlayerBossProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlayerUnlockedRegion_playerId_unlockedAt_idx" ON "PlayerUnlockedRegion"("playerId", "unlockedAt");

-- CreateIndex
CREATE INDEX "PlayerBossProgress_playerId_updatedAt_idx" ON "PlayerBossProgress"("playerId", "updatedAt");
