import { describe, expect, it } from "vitest";

import {
  estimateBestSetPowerForRegion,
  estimateRegionBalanceWindow,
} from "@/lib/game/balance-estimate";

describe("late-game balance window", () => {
  it("lets each late-game region's optimistic set touch the next gate", () => {
    const balanceWindow = estimateRegionBalanceWindow();

    for (const estimate of balanceWindow) {
      if (!estimate.nextRegionRecommendedPower) {
        continue;
      }

      expect(estimate.bestSetPower).toBeGreaterThanOrEqual(
        estimate.nextRegionRecommendedPower,
      );
    }
  });

  it("keeps the final boss above the final gate while remaining beatable for a full abyss build", () => {
    const abyssSetPower = estimateBestSetPowerForRegion("region_010");
    const finalRegion = estimateRegionBalanceWindow().at(-1);

    expect(finalRegion).not.toBeUndefined();
    expect(finalRegion!.bossPower).toBeGreaterThan(finalRegion!.recommendedPower);
    expect(abyssSetPower).toBeGreaterThan(finalRegion!.bossPower);
  });
});
