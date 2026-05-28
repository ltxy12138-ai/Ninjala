-- CreateTable
CREATE TABLE "ItemInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "baseItemId" TEXT NOT NULL,
    "sourceRegionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 0,
    "luck" INTEGER NOT NULL DEFAULT 0,
    "crit" INTEGER NOT NULL DEFAULT 0,
    "goldBonus" INTEGER NOT NULL DEFAULT 0,
    "expBonus" INTEGER NOT NULL DEFAULT 0,
    "dropBonus" INTEGER NOT NULL DEFAULT 0,
    "affixIds" TEXT NOT NULL DEFAULT '[]',
    "equippedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemInstance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ItemInstance_playerId_slot_idx" ON "ItemInstance"("playerId", "slot");

-- CreateIndex
CREATE INDEX "ItemInstance_playerId_equippedAt_idx" ON "ItemInstance"("playerId", "equippedAt");
