import { regionDefinitions } from "../data/regions";
import { calculateIdleRewards, formatMinutes } from "../lib/game/idle";
import { generateRegionDrops } from "../lib/game/loot";
import { getRegionName } from "../data/regions";

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

for (const region of regionDefinitions) {
  console.log(`\n=== ${getRegionName(region, "en")} (${region.id}) ===`);

  for (const minutes of [60, 360, 720]) {
    const rewards = calculateIdleRewards(region, minutes * 60000);
    const dropSamples = Array.from({ length: 1000 }, () =>
      generateRegionDrops(region.dropTableId, rewards.claimableMinutes, Math.random, "en").length,
    );

    console.log(
      [
        `${formatMinutes(minutes)}`,
        `gold=${rewards.gold}`,
        `exp=${rewards.exp}`,
        `materials=${rewards.materials.map((material) => `${material.materialId}:${material.amount}`).join("|") || "none"}`,
        `avgDrops=${average(dropSamples).toFixed(2)}`,
      ].join(" | "),
    );
  }
}
