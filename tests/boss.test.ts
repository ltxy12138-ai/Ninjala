import { describe, expect, it } from "vitest";

import {
  BossActionError,
  calculateBossWinChance,
  challengeBoss,
} from "@/lib/game/boss";

describe("boss challenges", () => {
  it("clamps win chance to the lower bound", () => {
    expect(calculateBossWinChance(1, 999)).toBe(0.1);
  });

  it("clamps win chance to the upper bound", () => {
    expect(calculateBossWinChance(999, 10)).toBe(0.95);
  });

  it("gives stronger players a higher win chance", () => {
    expect(calculateBossWinChance(60, 100)).toBeGreaterThan(
      calculateBossWinChance(20, 100),
    );
  });

  it("unlocks the next region after a successful clear", async () => {
    const appliedInputs: Array<{ unlockedRegionId: string | null }> = [];

    const result = await challengeBoss(
      {
        async findPlayerById() {
          return {
            id: "player-1",
            name: "Li",
            power: 999,
            currentRegionId: "region_001",
            effectStats: {
              luck: 0,
              crit: 0,
              goldBonus: 0,
              expBonus: 0,
              dropBonus: 0,
            },
          };
        },
        async getUnlockedRegionIds() {
          return ["region_001"];
        },
        async getBossProgress() {
          return null;
        },
        async applyBossChallenge(input) {
          appliedInputs.push({ unlockedRegionId: input.unlockedRegionId });

          return {
            status: "applied" as const,
            remainingChallenges: 2,
            clearCount: 1,
            unlockedRegionId: input.unlockedRegionId,
            wasFirstClear: true,
          };
        },
      },
      {
        playerId: "player-1",
        random: () => 0,
        now: new Date("2026-05-26T09:00:00.000Z"),
      },
    );

    expect(result.didWin).toBe(true);
    expect(result.unlockedRegionId).toBe("region_002");
    expect(appliedInputs[0]?.unlockedRegionId).toBe("region_002");
  });

  it("does not surface a new unlock on repeated clears", async () => {
    const result = await challengeBoss(
      {
        async findPlayerById() {
          return {
            id: "player-1",
            name: "Li",
            power: 999,
            currentRegionId: "region_003",
            effectStats: {
              luck: 0,
              crit: 0,
              goldBonus: 0,
              expBonus: 0,
              dropBonus: 0,
            },
          };
        },
        async getUnlockedRegionIds() {
          return ["region_001", "region_002", "region_003", "region_004"];
        },
        async getBossProgress() {
          return {
            bossId: "boss_dojo_puppet",
            challengeDay: null,
            challengesUsed: 0,
            clearCount: 2,
            firstClearedAt: new Date("2026-05-20T09:00:00.000Z"),
          };
        },
        async applyBossChallenge() {
          return {
            status: "applied" as const,
            remainingChallenges: 2,
            clearCount: 3,
            unlockedRegionId: null,
            wasFirstClear: false,
          };
        },
      },
      {
        playerId: "player-1",
        random: () => 0,
        now: new Date("2026-05-26T09:00:00.000Z"),
      },
    );

    expect(result.didWin).toBe(true);
    expect(result.unlockedRegionId).toBeNull();
    expect(result.wasFirstClear).toBe(false);
  });

  it("throws when the daily limit has been reached", async () => {
    await expect(
      challengeBoss(
        {
          async findPlayerById() {
            return {
              id: "player-1",
              name: "Li",
              power: 999,
              currentRegionId: "region_001",
              effectStats: {
                luck: 0,
                crit: 0,
                goldBonus: 0,
                expBonus: 0,
                dropBonus: 0,
              },
            };
          },
          async getUnlockedRegionIds() {
            return ["region_001"];
          },
          async getBossProgress() {
            return null;
          },
          async applyBossChallenge() {
            return {
              status: "daily_limit" as const,
              remainingChallenges: 0,
              clearCount: 0,
              unlockedRegionId: null,
              wasFirstClear: false,
            };
          },
        },
        {
          playerId: "player-1",
          random: () => 0,
          now: new Date("2026-05-26T09:00:00.000Z"),
        },
      ),
    ).rejects.toBeInstanceOf(BossActionError);

    await expect(
      challengeBoss(
        {
          async findPlayerById() {
            return {
              id: "player-1",
              name: "Li",
              power: 999,
              currentRegionId: "region_001",
              effectStats: {
                luck: 0,
                crit: 0,
                goldBonus: 0,
                expBonus: 0,
                dropBonus: 0,
              },
            };
          },
          async getUnlockedRegionIds() {
            return ["region_001"];
          },
          async getBossProgress() {
            return null;
          },
          async applyBossChallenge() {
            return {
              status: "daily_limit" as const,
              remainingChallenges: 0,
              clearCount: 0,
              unlockedRegionId: null,
              wasFirstClear: false,
            };
          },
        },
        {
          playerId: "player-1",
          random: () => 0,
          now: new Date("2026-05-26T09:00:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({ code: "DAILY_LIMIT" });
  });

  it("treats the daily limit as shared across the progression route", async () => {
    let applyCalls = 0;

    await expect(
      challengeBoss(
        {
          async findPlayerById() {
            return {
              id: "player-1",
              name: "Li",
              power: 999,
              currentRegionId: "region_001",
              effectStats: {
                luck: 0,
                crit: 0,
                goldBonus: 0,
                expBonus: 0,
                dropBonus: 0,
              },
            };
          },
          async getUnlockedRegionIds() {
            return ["region_001"];
          },
          async getBossProgress() {
            return null;
          },
          async applyBossChallenge() {
            applyCalls += 1;

            return {
              status: "daily_limit" as const,
              remainingChallenges: 0,
              clearCount: 0,
              unlockedRegionId: null,
              wasFirstClear: false,
            };
          },
        },
        {
          playerId: "player-1",
          random: () => 0,
          now: new Date("2026-05-26T09:00:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({ code: "DAILY_LIMIT" });

    expect(applyCalls).toBe(1);
  });
});
