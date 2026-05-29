import { bossDefinitions } from "@/data/bosses";
import { affixMap, affixSupportsSlot } from "@/data/affixes";
import { dropTableDefinitions } from "@/data/drop-tables";
import { itemBaseMap } from "@/data/item-bases";
import { regionDefinitions } from "@/data/regions";
import {
  applyEnhancementLevels,
  enhancementCaps,
} from "@/lib/game/enhancement";
import { calculatePower } from "@/lib/game/power";
import {
  createEmptyStats,
  statKeys,
  type EquipmentStats,
  type ItemSlot,
  type StatKey,
} from "@/lib/game/types";

type EstimatedItemCandidate = {
  slot: ItemSlot;
  power: number;
};

export type RegionBalanceEstimate = {
  regionId: string;
  recommendedPower: number;
  bossPower: number;
  bestSetPower: number;
  nextRegionId: string | null;
  nextRegionRecommendedPower: number | null;
  gapToBoss: number;
  gapToNextRegion: number | null;
};

function maxStatsFromRanges(
  statRanges: Partial<Record<StatKey, { min: number; max: number }>>,
) {
  const result = createEmptyStats();

  for (const statKey of statKeys) {
    result[statKey] = statRanges[statKey]?.max ?? 0;
  }

  return result;
}

function sumStats(parts: EquipmentStats[]) {
  const total = createEmptyStats();

  for (const part of parts) {
    for (const statKey of statKeys) {
      total[statKey] += part[statKey];
    }
  }

  return total;
}

function buildCombinations<TValue>(
  values: TValue[],
  size: number,
): TValue[][] {
  if (size <= 0 || values.length === 0) {
    return [[]];
  }

  if (size === 1) {
    return values.map((value) => [value]);
  }

  const results: TValue[][] = [];

  for (let index = 0; index <= values.length - size; index += 1) {
    const head = values[index]!;
    const tails = buildCombinations(values.slice(index + 1), size - 1);

    for (const tail of tails) {
      results.push([head, ...tail]);
    }
  }

  return results;
}

function getBestCandidatePowerForBaseItem(
  regionId: string,
  baseItemId: string,
  affixPoolIds: string[],
) {
  const baseItem = itemBaseMap.get(baseItemId);

  if (!baseItem) {
    return null;
  }

  const compatibleAffixes = affixPoolIds
    .map((affixId) => affixMap.get(affixId))
    .filter((affix) => affix !== undefined)
    .filter((affix) => affixSupportsSlot(affix, baseItem.slot));
  const affixCount = Math.min(
    enhancementCaps.legendary - 7,
    compatibleAffixes.length,
  );
  const affixCombinations =
    affixCount > 0 ? buildCombinations(compatibleAffixes, affixCount) : [[]];
  let bestPower = 0;

  for (const affixes of affixCombinations) {
    const stats = sumStats([
      maxStatsFromRanges(baseItem.statRanges),
      ...affixes.map((affix) => maxStatsFromRanges(affix.statRanges)),
    ]);
    const enhancedStats = applyEnhancementLevels(
      {
        ...stats,
        sourceRegionId: regionId,
      },
      enhancementCaps.legendary,
    );
    const power = calculatePower(enhancedStats);

    if (power > bestPower) {
      bestPower = power;
    }
  }

  return {
    slot: baseItem.slot,
    power: bestPower,
  } satisfies EstimatedItemCandidate;
}

export function estimateBestSetPowerForRegion(regionId: string) {
  const region = regionDefinitions.find((entry) => entry.id === regionId);

  if (!region) {
    return 0;
  }

  const dropTable = dropTableDefinitions.find(
    (entry) => entry.id === region.dropTableId,
  );

  if (!dropTable) {
    return 0;
  }

  const slotCandidates = new Map<ItemSlot, number[]>();

  for (const itemBaseId of dropTable.itemBaseIds) {
    const candidate = getBestCandidatePowerForBaseItem(
      region.id,
      itemBaseId,
      dropTable.affixPoolIds,
    );

    if (!candidate) {
      continue;
    }

    const powers = slotCandidates.get(candidate.slot) ?? [];
    powers.push(candidate.power);
    powers.sort((left, right) => right - left);
    slotCandidates.set(
      candidate.slot,
      candidate.slot === "ring" ? powers.slice(0, 2) : powers.slice(0, 1),
    );
  }

  return Array.from(slotCandidates.values())
    .flat()
    .reduce((sum, power) => sum + power, 0);
}

export function estimateRegionBalanceWindow(startRegionIndex = 5) {
  return regionDefinitions.slice(startRegionIndex).map((region) => {
    const boss = bossDefinitions.find((entry) => entry.regionId === region.id);
    const bestSetPower = estimateBestSetPowerForRegion(region.id);
    const nextRegion = region.unlocksRegionId
      ? regionDefinitions.find((entry) => entry.id === region.unlocksRegionId) ?? null
      : null;

    return {
      regionId: region.id,
      recommendedPower: region.recommendedPower,
      bossPower: boss?.power ?? 0,
      bestSetPower,
      nextRegionId: nextRegion?.id ?? null,
      nextRegionRecommendedPower: nextRegion?.recommendedPower ?? null,
      gapToBoss: bestSetPower - (boss?.power ?? 0),
      gapToNextRegion: nextRegion ? bestSetPower - nextRegion.recommendedPower : null,
    } satisfies RegionBalanceEstimate;
  });
}
