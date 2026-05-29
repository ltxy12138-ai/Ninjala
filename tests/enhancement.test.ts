import { describe, expect, it } from "vitest";

import {
  applyEnhancementStats,
  getEnhancementIncrements,
  getEnhancementPreview,
} from "@/lib/game/enhancement";
import { calculatePower } from "@/lib/game/power";

describe("equipment enhancement", () => {
  it("builds enhancement cost from region, rarity, and level", () => {
    const preview = getEnhancementPreview({
      id: "item-1",
      name: "Bamboo Spear",
      sourceRegionId: "region_003",
      rarity: "rare",
      enhancementLevel: 2,
      attack: 10,
    });

    expect(preview.materialId).toBe("iron_ore");
    expect(preview.materialCost).toBe(33);
    expect(preview.goldCost).toBe(1215);
    expect(preview.nextLevel).toBe(3);
  });

  it("adds at least one point to every positive stat", () => {
    const increments = getEnhancementIncrements({
      attack: 8,
      defense: 5,
      hp: 12,
      luck: 1,
      crit: 0,
      goldBonus: 2,
    });

    expect(increments.attack).toBeGreaterThanOrEqual(1);
    expect(increments.defense).toBeGreaterThanOrEqual(1);
    expect(increments.hp).toBeGreaterThanOrEqual(1);
    expect(increments.luck).toBeGreaterThanOrEqual(1);
    expect(increments.crit).toBe(0);
    expect(increments.goldBonus).toBeGreaterThanOrEqual(1);
  });

  it("raises power after enhancing a combat item", () => {
    const before = {
      attack: 10,
      defense: 6,
      hp: 20,
      luck: 2,
    };
    const after = applyEnhancementStats(before);

    expect(calculatePower(after)).toBeGreaterThan(calculatePower(before));
  });

  it("gives later-region combat gear a steeper enhancement slope", () => {
    const early = getEnhancementIncrements({
      sourceRegionId: "region_003",
      attack: 20,
      defense: 10,
      hp: 40,
      crit: 10,
    });
    const late = getEnhancementIncrements({
      sourceRegionId: "region_010",
      attack: 20,
      defense: 10,
      hp: 40,
      crit: 10,
    });

    expect(late.attack).toBeGreaterThan(early.attack);
    expect(late.defense).toBeGreaterThan(early.defense);
    expect(late.hp).toBeGreaterThan(early.hp);
    expect(late.crit).toBeGreaterThan(early.crit);
  });

  it("flags items at max level", () => {
    const preview = getEnhancementPreview({
      id: "item-2",
      name: "Legendary Bead",
      sourceRegionId: "region_005",
      rarity: "legendary",
      enhancementLevel: 10,
      attack: 12,
      goldBonus: 6,
    });

    expect(preview.isMaxLevel).toBe(true);
    expect(preview.nextLevel).toBe(10);
  });
});
