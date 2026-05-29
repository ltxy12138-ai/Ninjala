import { describe, expect, it } from "vitest";

import { calculatePower, sumEquipmentStats } from "@/lib/game/power";

describe("power calculation", () => {
  it("stays stable for the shared late-game formula", () => {
    expect(
      calculatePower({
        attack: 10,
        defense: 8,
        hp: 50,
        luck: 4,
        crit: 2,
      }),
    ).toBe(51);
  });

  it("sums equipment stats before power is calculated", () => {
    const totals = sumEquipmentStats([
      { attack: 4, defense: 2, hp: 10, luck: 1 },
      { attack: 6, defense: 3, hp: 15, luck: 2 },
    ]);

    expect(totals).toMatchObject({
      attack: 10,
      defense: 5,
      hp: 25,
      luck: 3,
    });
  });

  it("counts crit while keeping reward stats out of displayed power", () => {
    const combat = calculatePower({
      attack: 20,
      defense: 10,
      hp: 40,
      luck: 4,
      crit: 6,
    });
    const rewardHeavy = calculatePower({
      attack: 20,
      defense: 10,
      hp: 40,
      luck: 4,
      crit: 6,
      goldBonus: 20,
      expBonus: 20,
      dropBonus: 20,
    });

    expect(combat).toBe(rewardHeavy);
  });
});
