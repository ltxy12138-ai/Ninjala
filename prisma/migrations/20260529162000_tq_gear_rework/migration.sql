ALTER TABLE "ItemInstance"
ADD COLUMN "affixStats" TEXT NOT NULL DEFAULT '[]';

UPDATE "ItemInstance"
SET "slot" = 'ring'
WHERE "slot" = 'accessory'
  AND "baseItemId" IN (
    'accessory_bone_charm',
    'accessory_dojo_token',
    'accessory_crow_plume',
    'accessory_storm_plume',
    'accessory_venom_sac',
    'accessory_star_shard'
  );

UPDATE "ItemInstance"
SET "slot" = 'amulet'
WHERE "slot" = 'accessory'
  AND "baseItemId" IN (
    'accessory_ember_bead',
    'accessory_river_whistle',
    'accessory_ore_talisman',
    'accessory_moon_amber',
    'accessory_abyss_sigil'
  );

WITH ranked_amulets AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "playerId", "slot"
      ORDER BY "equippedAt" DESC NULLS LAST, "updatedAt" DESC, "id"
    ) AS rn
  FROM "ItemInstance"
  WHERE "slot" = 'amulet'
    AND "equippedAt" IS NOT NULL
)
UPDATE "ItemInstance" AS item
SET
  "equippedAt" = CASE WHEN ranked_amulets.rn = 1 THEN item."equippedAt" ELSE NULL END,
  "equipSlotIndex" = CASE WHEN ranked_amulets.rn = 1 THEN 0 ELSE NULL END
FROM ranked_amulets
WHERE item."id" = ranked_amulets."id";

UPDATE "ItemInstance"
SET "equipSlotIndex" = COALESCE("equipSlotIndex", 0)
WHERE "slot" IN ('weapon', 'helmet', 'armor', 'boots', 'bracer', 'amulet')
  AND "equippedAt" IS NOT NULL;
