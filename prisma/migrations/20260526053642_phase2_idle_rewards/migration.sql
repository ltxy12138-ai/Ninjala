-- CreateTable
CREATE TABLE "MaterialStack" (
    "playerId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("playerId", "materialId"),
    CONSTRAINT "MaterialStack_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
