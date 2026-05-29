-- CreateTable
CREATE TABLE "public"."PlayerDailyTask" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerDailyTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerDailyTask_playerId_dayKey_idx" ON "public"."PlayerDailyTask"("playerId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerDailyTask_playerId_taskId_dayKey_key" ON "public"."PlayerDailyTask"("playerId", "taskId", "dayKey");

-- AddForeignKey
ALTER TABLE "public"."PlayerDailyTask" ADD CONSTRAINT "PlayerDailyTask_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
