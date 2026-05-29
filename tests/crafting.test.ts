import { describe, expect, it } from "vitest";

import {
  getBulkDismantlePreview,
  canAffordRecipe,
  getDismantlePreview,
  getForgePreview,
  getMaterialRecipeById,
  getReforgePreview,
} from "@/lib/game/crafting";
import { getRegionById } from "@/lib/game/regions";

describe("crafting and dismantling", () => {
  it("returns more dismantle materials for rarer and enhanced items", () => {
    const commonPreview = getDismantlePreview({
      id: "item-1",
      name: "Common Spear",
      sourceRegionId: "region_001",
      rarity: "common",
      enhancementLevel: 0,
    });
    const epicPreview = getDismantlePreview({
      id: "item-2",
      name: "Epic Spear",
      sourceRegionId: "region_003",
      rarity: "epic",
      enhancementLevel: 2,
    });

    expect(commonPreview.materialId).toBe("bamboo_shoot");
    expect(epicPreview.materialId).toBe("iron_ore");
    expect(epicPreview.amount).toBeGreaterThan(commonPreview.amount);
  });

  it("aggregates one-click dismantle rewards across multiple items", () => {
    const preview = getBulkDismantlePreview([
      {
        id: "item-1",
        name: "Common Spear",
        sourceRegionId: "region_001",
        rarity: "common",
        enhancementLevel: 0,
      },
      {
        id: "item-2",
        name: "Rare Spear",
        sourceRegionId: "region_001",
        rarity: "rare",
        enhancementLevel: 1,
      },
    ]);

    expect(preview.itemCount).toBe(2);
    expect(preview.materials).toEqual([
      {
        materialId: "bamboo_shoot",
        amount: 7,
      },
    ]);
  });

  it("allows crafting only when every ingredient threshold is met", () => {
    const recipe = getMaterialRecipeById("craft_iron_ore");

    expect(recipe).not.toBeNull();
    expect(
      canAffordRecipe(
        recipe!,
        new Map([
          ["frost_scale", 6],
          ["river_stone", 3],
        ]),
      ),
    ).toBe(true);
    expect(
      canAffordRecipe(
        recipe!,
        new Map([
          ["frost_scale", 5],
          ["river_stone", 3],
        ]),
      ),
    ).toBe(false);
  });

  it("keeps recipe outputs stable", () => {
    const recipe = getMaterialRecipeById("craft_ember_core");

    expect(recipe?.output).toEqual({
      materialId: "ember_core",
      amount: 2,
    });
  });

  it("builds a stable forge preview for a slot", () => {
    const region = getRegionById("region_003");

    expect(region).not.toBeNull();

    const preview = getForgePreview(region!, "weapon", "zh");

    expect(preview.regionId).toBe("region_003");
    expect(preview.slot).toBe("weapon");
    expect(preview.ingredients.length).toBeGreaterThan(0);
    expect(preview.goldCost).toBeGreaterThan(0);
  });

  it("scales reforge preview cost with rarity and enhancement", () => {
    const basePreview = getReforgePreview({
      id: "item-1",
      name: "Common Spear",
      sourceRegionId: "region_001",
      rarity: "common",
      enhancementLevel: 0,
    });
    const upgradedPreview = getReforgePreview({
      id: "item-2",
      name: "Epic Spear",
      sourceRegionId: "region_003",
      rarity: "epic",
      enhancementLevel: 3,
    });

    expect(basePreview.goldCost).toBeGreaterThan(0);
    expect(basePreview.ingredients.length).toBeGreaterThan(0);
    expect(upgradedPreview.goldCost).toBeGreaterThan(basePreview.goldCost);
    expect(upgradedPreview.ingredients[0]?.amount).toBeGreaterThan(
      basePreview.ingredients[0]?.amount ?? 0,
    );
  });
});
