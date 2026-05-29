import { describe, expect, it } from "vitest";

import {
  adjustRarityWeights,
  applyExpBonus,
  applyGoldBonus,
  calculateBossWinChanceBonus,
  scaleDropRollCount,
} from "@/lib/game/effects";
import { calculateBossCombatWinChance } from "@/lib/game/boss";

describe("reward effects", () => {
  it("applies gold and exp bonus as multiplicative reward modifiers", () => {
    expect(
      applyGoldBonus(100, {
        goldBonus: 15,
      }),
    ).toBe(115);
    expect(
      applyExpBonus(80, {
        expBonus: 25,
      }),
    ).toBe(100);
  });

  it("turns drop bonus into extra roll chances", () => {
    expect(
      scaleDropRollCount(
        2,
        {
          dropBonus: 50,
        },
        () => 0,
      ),
    ).toBe(3);
  });

  it("lets crit and luck improve main boss win chance", () => {
    const plain = calculateBossCombatWinChance(120, 200, {});
    const boosted = calculateBossCombatWinChance(120, 200, {
      crit: 10,
      luck: 5,
      goldBonus: 0,
      expBonus: 0,
      dropBonus: 0,
    });

    expect(boosted).toBeGreaterThan(plain);
    expect(calculateBossWinChanceBonus({ crit: 10, luck: 5 })).toBeGreaterThan(0);
  });

  it("lets luck bias rarity weights toward better drops", () => {
    const adjusted = adjustRarityWeights(
      {
        common: 7500,
        rare: 2000,
        epic: 450,
        legendary: 50,
      },
      {
        luck: 20,
        crit: 0,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      },
    );

    expect(adjusted.common).toBeLessThan(7500);
    expect(adjusted.rare).toBeGreaterThan(2000);
    expect(adjusted.epic).toBeGreaterThan(450);
    expect(adjusted.legendary).toBeGreaterThan(50);
  });
});
