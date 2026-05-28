import { describe, expect, it } from "vitest";

import { regionDefinitions } from "@/data/regions";
import {
  MAXIMUM_CLAIM_MINUTES,
  calculateClaimableMinutes,
  calculateIdleRewards,
} from "@/lib/game/idle";
import { claimIdleRewards } from "@/lib/game/idle-service";
import { isRegionAccessible } from "@/lib/game/regions";

describe("idle rewards", () => {
  it("calculates a 60-minute reward from the current region", () => {
    const rewards = calculateIdleRewards(regionDefinitions[0], 60 * 60000);

    expect(rewards).toEqual({
      claimableMinutes: 60,
      gold: 120,
      exp: 60,
      materials: [
        { materialId: "bamboo_shoot", amount: 6 },
        { materialId: "river_stone", amount: 3 },
      ],
    });
  });

  it("caps claimable time at 12 hours", () => {
    expect(calculateClaimableMinutes(24 * 60 * 60000)).toBe(
      MAXIMUM_CLAIM_MINUTES,
    );
  });

  it("changes reward source after switching regions", () => {
    const groveRewards = calculateIdleRewards(regionDefinitions[0], 60 * 60000);
    const riverRewards = calculateIdleRewards(regionDefinitions[1], 60 * 60000);

    expect(groveRewards.materials).not.toEqual(riverRewards.materials);
    expect(riverRewards.exp).toBeGreaterThan(groveRewards.exp);
  });

  it("blocks advanced regions when power is too low", () => {
    expect(isRegionAccessible(regionDefinitions[4], 20, ["region_005"])).toBe(false);
    expect(isRegionAccessible(regionDefinitions[4], 600, ["region_005"])).toBe(true);
  });

  it("prevents duplicate claims when the persistence guard rejects the update", async () => {
    await expect(
      claimIdleRewards(
        {
          async findPlayerById() {
            return {
              id: "player-1",
              name: "Li",
              power: 0,
              currentRegionId: "region_001",
              lastClaimAt: new Date("2026-05-26T00:00:00.000Z"),
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
          async applyClaim() {
            return null;
          },
          async updateCurrentRegion() {},
        },
        {
          playerId: "player-1",
          now: new Date("2026-05-26T01:00:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({
      code: "DUPLICATE_CLAIM",
    });
  });

  it("applies equipped gold and exp bonus to idle rewards", async () => {
    const result = await claimIdleRewards(
      {
        async findPlayerById() {
          return {
            id: "player-1",
            name: "Li",
            power: 0,
            currentRegionId: "region_001",
            lastClaimAt: new Date("2026-05-26T00:00:00.000Z"),
            effectStats: {
              luck: 0,
              crit: 0,
              goldBonus: 10,
              expBonus: 20,
              dropBonus: 0,
            },
          };
        },
        async getUnlockedRegionIds() {
          return ["region_001"];
        },
        async applyClaim() {
          return "log-1";
        },
        async updateCurrentRegion() {},
      },
      {
        playerId: "player-1",
        now: new Date("2026-05-26T01:00:00.000Z"),
      },
    );

    expect(result.gold).toBe(132);
    expect(result.exp).toBe(72);
  });
});
