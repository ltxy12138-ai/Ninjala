-- CreateTable
CREATE TABLE "Blessing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "targetPlayerId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "goldGranted" INTEGER NOT NULL,
    "expGranted" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blessing_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Blessing_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Blessing_targetPlayerId_dayKey_idx" ON "Blessing"("targetPlayerId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "Blessing_playerId_dayKey_key" ON "Blessing"("playerId", "dayKey");
