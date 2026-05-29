import { describe, expect, it } from "vitest";

import {
  calculateDropRollCount,
  calculateItemStatBounds,
  generateEquipmentDrop,
  generateEquipmentDropForSlot,
  getEquipmentMechanicsSummary,
  generateReforgedEquipment,
  rollRarity,
} from "@/lib/game/loot";

function createSequenceRandom(values: number[]) {
  let index = 0;

  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;

    return value;
  };
}

describe("loot generation", () => {
  it("keeps generated stats within configured bounds", () => {
    const item = generateEquipmentDrop(
      "drops_snow_mine",
      createSequenceRandom([0.9, 0.751, 0.1, 0.3, 0.2, 0.4, 0.6, 0.8, 0.5, 0.7]),
    );
    const bounds = calculateItemStatBounds(
      item.baseItemId,
      item.rarity,
      item.affixIds,
    );

    for (const [statKey, value] of Object.entries(item.stats)) {
      expect(value).toBeGreaterThanOrEqual(bounds[statKey as keyof typeof bounds].min);
      expect(value).toBeLessThanOrEqual(bounds[statKey as keyof typeof bounds].max);
    }
  });

  it("uses the configured rarity weight boundaries", () => {
    const weights = {
      common: 7500,
      rare: 2000,
      epic: 450,
      legendary: 50,
    } as const;

    expect(rollRarity(weights, () => 0)).toBe("common");
    expect(rollRarity(weights, () => 0.75)).toBe("rare");
    expect(rollRarity(weights, () => 0.95)).toBe("epic");
    expect(rollRarity(weights, () => 0.995)).toBe("legendary");
  });

  it("gives one drop roll for a 60-minute bamboo grove claim", () => {
    expect(calculateDropRollCount(60, 1, () => 0)).toBe(1);
  });

  it("can forge a targeted slot from a drop table", () => {
    const item = generateEquipmentDropForSlot(
      "drops_bamboo_grove",
      "weapon",
      createSequenceRandom([0.1, 0.2, 0.1, 0.3, 0.5, 0.7]),
    );

    expect(item.slot).toBe("weapon");
  });

  it("keeps base item and rarity stable when reforging", () => {
    const item = generateReforgedEquipment(
      {
        dropTableId: "drops_snow_mine",
        baseItemId: "weapon_ice_hook",
        rarity: "epic",
      },
      createSequenceRandom([0.1, 0.4, 0.8, 0.2, 0.6, 0.3, 0.7]),
    );

    expect(item.baseItemId).toBe("weapon_ice_hook");
    expect(item.rarity).toBe("epic");
    expect(item.slot).toBe("weapon");
    expect(item.affixIds.length).toBe(2);
  });

  it("rebuilds reforged names from the new affixes", () => {
    const item = generateReforgedEquipment(
      {
        dropTableId: "drops_snow_mine",
        baseItemId: "weapon_ice_hook",
        rarity: "rare",
      },
      createSequenceRandom([0.1, 0.2, 0.7, 0.4, 0.6]),
    );
    const mechanics = getEquipmentMechanicsSummary(
      {
        baseItemId: item.baseItemId,
        rarity: item.rarity,
        affixIds: item.affixIds,
        sourceRegionId: "region_004",
        stats: item.stats,
        affixStats: item.affixStats,
      },
      "zh",
    );

    expect(mechanics.affixNames.length).toBeGreaterThan(0);
    expect(item.name).toContain(mechanics.affixNames[0] ?? "");
  });
});
