import { regionDefinitions, type RegionDefinition } from "@/data/regions";
import { isRegionUnlocked } from "@/lib/game/progression";

export function getRegionById(regionId: string) {
  return regionDefinitions.find((region) => region.id === regionId) ?? null;
}

export function isRegionAccessible(
  region: RegionDefinition,
  playerPower: number,
  unlockedRegionIds: string[],
  currentRegionId?: string,
) {
  return (
    isRegionUnlocked(region.id, unlockedRegionIds, currentRegionId) &&
    (region.recommendedPower <= playerPower || region.id === currentRegionId)
  );
}

export function listRegionsForPlayer(
  playerPower: number,
  unlockedRegionIds: string[],
  currentRegionId: string,
) {
  return regionDefinitions.map((region) => ({
    ...region,
    isActive: region.id === currentRegionId,
    isUnlocked: isRegionUnlocked(region.id, unlockedRegionIds, currentRegionId),
    isAccessible: isRegionAccessible(
      region,
      playerPower,
      unlockedRegionIds,
      currentRegionId,
    ),
  }));
}
