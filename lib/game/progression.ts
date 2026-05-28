import { getRegionOrder } from "@/data/regions";

export const STARTING_REGION_ID = "region_001";

export function normalizeUnlockedRegionIds(
  unlockedRegionIds: string[],
  currentRegionId?: string,
) {
  return Array.from(
    new Set(
      [STARTING_REGION_ID, currentRegionId, ...unlockedRegionIds].filter(
        (regionId): regionId is string => Boolean(regionId),
      ),
    ),
  );
}

export function isRegionUnlocked(
  regionId: string,
  unlockedRegionIds: string[],
  currentRegionId?: string,
) {
  return normalizeUnlockedRegionIds(unlockedRegionIds, currentRegionId).includes(
    regionId,
  );
}

export function getHighestUnlockedRegionId(
  unlockedRegionIds: string[],
  currentRegionId?: string,
) {
  return normalizeUnlockedRegionIds(unlockedRegionIds, currentRegionId).sort(
    (left, right) => getRegionOrder(right) - getRegionOrder(left),
  )[0]!;
}
