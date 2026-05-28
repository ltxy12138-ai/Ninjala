-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItemInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "equippedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemInstance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ItemInstance" ("affixIds", "attack", "baseItemId", "createdAt", "crit", "defense", "dropBonus", "equippedAt", "expBonus", "goldBonus", "hp", "id", "luck", "name", "playerId", "rarity", "slot", "sourceRegionId", "updatedAt") SELECT "affixIds", "attack", "baseItemId", "createdAt", "crit", "defense", "dropBonus", "equippedAt", "expBonus", "goldBonus", "hp", "id", "luck", "name", "playerId", "rarity", "slot", "sourceRegionId", "updatedAt" FROM "ItemInstance";
DROP TABLE "ItemInstance";
ALTER TABLE "new_ItemInstance" RENAME TO "ItemInstance";
CREATE INDEX "ItemInstance_playerId_slot_idx" ON "ItemInstance"("playerId", "slot");
CREATE INDEX "ItemInstance_playerId_equippedAt_idx" ON "ItemInstance"("playerId", "equippedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
