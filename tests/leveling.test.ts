import { describe, expect, it } from "vitest";

import {
  applyExpReward,
  applyLevelDelta,
  getLevelForTotalExp,
  getRequiredXpForLevel,
  MAX_PLAYER_LEVEL,
} from "@/lib/game/leveling";

describe("leveling curve", () => {
  it("matches the classic early-level thresholds from the formula", () => {
    expect(getRequiredXpForLevel(1)).toBe(0);
    expect(getRequiredXpForLevel(2)).toBe(83);
    expect(getRequiredXpForLevel(8)).toBe(801);
    expect(getRequiredXpForLevel(15)).toBe(2411);
    expect(getRequiredXpForLevel(50)).toBe(101333);
  });

  it("resolves levels from cumulative experience", () => {
    expect(getLevelForTotalExp(0)).toBe(1);
    expect(getLevelForTotalExp(82)).toBe(1);
    expect(getLevelForTotalExp(83)).toBe(2);
    expect(getLevelForTotalExp(801)).toBe(8);
  });

  it("supports progression far beyond the original table", () => {
    expect(getRequiredXpForLevel(121)).toBeGreaterThan(getRequiredXpForLevel(120));
    expect(getRequiredXpForLevel(3000)).toBeGreaterThan(getRequiredXpForLevel(2999));
    expect(getLevelForTotalExp(getRequiredXpForLevel(MAX_PLAYER_LEVEL))).toBe(
      MAX_PLAYER_LEVEL,
    );
  });

  it("updates level automatically when experience is granted", () => {
    const progress = applyExpReward(0, 801);

    expect(progress.exp).toBe(801);
    expect(progress.level).toBe(8);
  });

  it("can raise a player to a target level in admin tools", () => {
    const progress = applyLevelDelta(83, 2, 8);

    expect(progress.level).toBe(10);
    expect(progress.exp).toBe(getRequiredXpForLevel(10));
  });
});
