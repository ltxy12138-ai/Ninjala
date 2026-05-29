import { estimateRegionBalanceWindow } from "../lib/game/balance-estimate";

console.log("=== late-game balance window ===");

for (const estimate of estimateRegionBalanceWindow()) {
  console.log({
    regionId: estimate.regionId,
    recommendedPower: estimate.recommendedPower,
    bossPower: estimate.bossPower,
    bestSetPower: estimate.bestSetPower,
    gapToBoss: estimate.gapToBoss,
    nextRegionId: estimate.nextRegionId,
    nextRegionRecommendedPower: estimate.nextRegionRecommendedPower,
    gapToNextRegion: estimate.gapToNextRegion,
  });
}
