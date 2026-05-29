import { describe, expect, it } from "vitest";

import {
  calculatePowerFromEquippedItems,
  chooseBestItemsBySlot,
  sortInventoryItems,
} from "@/lib/game/equipment";

describe("equipment selection", () => {
  it("replaces a weaker item in the same slot", () => {
    const items = [
      {
        id: "weapon-1",
        slot: "weapon" as const,
        equippedAt: new Date("2026-05-26T00:00:00.000Z"),
        equipSlotIndex: 0,
        attack: 3,
        defense: 0,
        hp: 0,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "weapon-2",
        slot: "weapon" as const,
        equippedAt: null,
        equipSlotIndex: null,
        attack: 8,
        defense: 0,
        hp: 0,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
    ];

    expect(chooseBestItemsBySlot(items).get("weapon")?.[0]?.id).toBe("weapon-2");
  });

  it("one-click best equip never lowers power", () => {
    const items = [
      {
        id: "weapon-1",
        slot: "weapon" as const,
        equippedAt: new Date("2026-05-26T00:00:00.000Z"),
        equipSlotIndex: 0,
        attack: 4,
        defense: 0,
        hp: 0,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "weapon-2",
        slot: "weapon" as const,
        equippedAt: null,
        equipSlotIndex: null,
        attack: 6,
        defense: 0,
        hp: 0,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "helmet-1",
        slot: "helmet" as const,
        equippedAt: new Date("2026-05-26T00:00:00.000Z"),
        equipSlotIndex: 0,
        attack: 0,
        defense: 2,
        hp: 8,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "helmet-2",
        slot: "helmet" as const,
        equippedAt: null,
        equipSlotIndex: null,
        attack: 0,
        defense: 3,
        hp: 8,
        luck: 1,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
    ];

    const currentPower = calculatePowerFromEquippedItems(items).power;
    const selectedIds = new Set(
      Array.from(chooseBestItemsBySlot(items).values())
        .flat()
        .map((item) => item.id),
    );
    const nextPower = calculatePowerFromEquippedItems(
      items.map((item) => ({
        ...item,
        equippedAt: selectedIds.has(item.id)
          ? new Date("2026-05-26T00:00:00.000Z")
          : null,
        equipSlotIndex: selectedIds.has(item.id) ? item.equipSlotIndex ?? 0 : null,
      })),
    ).power;

    expect(nextPower).toBeGreaterThanOrEqual(currentPower);
  });

  it("selects the best two accessories instead of only one", () => {
    const items = [
      {
        id: "accessory-1",
        slot: "accessory" as const,
        equippedAt: new Date("2026-05-26T00:00:00.000Z"),
        equipSlotIndex: 0,
        attack: 1,
        defense: 0,
        hp: 0,
        luck: 1,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "accessory-2",
        slot: "accessory" as const,
        equippedAt: null,
        equipSlotIndex: null,
        attack: 4,
        defense: 0,
        hp: 0,
        luck: 2,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "accessory-3",
        slot: "accessory" as const,
        equippedAt: null,
        equipSlotIndex: null,
        attack: 3,
        defense: 0,
        hp: 0,
        luck: 0,
        crit: 2,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
    ];

    const selectedAccessories = chooseBestItemsBySlot(items).get("accessory") ?? [];

    expect(selectedAccessories).toHaveLength(2);
    expect(selectedAccessories.map((item) => item.id)).toEqual([
      "accessory-2",
      "accessory-3",
    ]);
  });

  it("sorts equipped items to the front of the inventory", () => {
    const items = [
      {
        id: "bag-1",
        slot: "weapon" as const,
        equippedAt: null,
        equipSlotIndex: null,
        enhancementLevel: 5,
        createdAt: new Date("2026-05-28T00:00:00.000Z"),
        attack: 10,
        defense: 0,
        hp: 0,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
      {
        id: "eq-1",
        slot: "helmet" as const,
        equippedAt: new Date("2026-05-29T00:00:00.000Z"),
        equipSlotIndex: 0,
        enhancementLevel: 1,
        createdAt: new Date("2026-05-27T00:00:00.000Z"),
        attack: 0,
        defense: 3,
        hp: 8,
        luck: 0,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
    ];

    expect(sortInventoryItems(items).map((item) => item.id)).toEqual([
      "eq-1",
      "bag-1",
    ]);
  });
});
