-- AlterTable
ALTER TABLE "ItemInstance" ADD COLUMN "equipSlotIndex" INTEGER;

-- Backfill pre-existing equipped items into the first slot position.
UPDATE "ItemInstance"
SET "equipSlotIndex" = 0
WHERE "equippedAt" IS NOT NULL
  AND "equipSlotIndex" IS NULL;

-- CreateIndex
CREATE INDEX "ItemInstance_playerId_slot_equipSlotIndex_idx" ON "ItemInstance"("playerId", "slot", "equipSlotIndex");
