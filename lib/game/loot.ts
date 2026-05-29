import {
  affixDefinitions,
  getAffixDescription,
  affixMap,
  getAffixName,
  type AffixDefinition,
} from "@/data/affixes";
import {
  dropTableDefinitions,
  dropTableMap,
  type DropTableDefinition,
} from "@/data/drop-tables";
import {
  getItemBaseDescription,
  getItemBaseName,
  itemBaseDefinitions,
  itemBaseMap,
  type ItemBaseDefinition,
} from "@/data/item-bases";
import { getRegionName } from "@/data/regions";
import { adjustRarityWeights, scaleDropRollCount, type RewardEffectStats } from "@/lib/game/effects";
import { getRegionById } from "@/lib/game/regions";
import type { Locale } from "@/lib/i18n";
import {
  coerceStats,
  createEmptyStats,
  formatRarityLabel,
  itemRarities,
  statKeys,
  type EquipmentStats,
  type ItemRarity,
  type ItemSlot,
  type StatKey,
} from "@/lib/game/types";

const rarityConfig: Record<
  ItemRarity,
  {
    multiplier: number;
    affixCount: number;
  }
> = {
  common: { multiplier: 1, affixCount: 0 },
  rare: { multiplier: 1.2, affixCount: 1 },
  epic: { multiplier: 1.45, affixCount: 2 },
  legendary: { multiplier: 1.75, affixCount: 3 },
};

export type GeneratedEquipment = {
  baseItemId: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  stats: EquipmentStats;
  affixIds: string[];
};

export type WeightedEntry<TValue extends string> = {
  value: TValue;
  weight: number;
};

export type EquipmentMechanicsSummary = {
  baseItemName: string;
  baseItemDescription: string;
  affixNames: string[];
  affixSummaries: Array<{
    name: string;
    description: string;
  }>;
  sourceRegionName: string;
  rarityLabel: string;
  affixCount: number;
  expectedAffixCount: number;
  baseStatKeys: StatKey[];
  affixStatKeys: StatKey[];
};

function rollInt(min: number, max: number, random: () => number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function chooseWeighted<TValue extends string>(
  entries: Array<WeightedEntry<TValue>>,
  random: () => number,
) {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    throw new Error("Weighted choice requires a positive total weight.");
  }

  let threshold = random() * totalWeight;

  for (const entry of entries) {
    threshold -= entry.weight;

    if (threshold < 0) {
      return entry.value;
    }
  }

  return entries[entries.length - 1]!.value;
}

export function getDropTableById(dropTableId: string) {
  return dropTableMap.get(dropTableId) ?? null;
}

export function rollRarity(
  rarityWeights: Record<ItemRarity, number>,
  random: () => number,
) {
  return chooseWeighted(
    itemRarities.map((rarity) => ({
      value: rarity,
      weight: rarityWeights[rarity],
    })),
    random,
  );
}

export function calculateDropRollCount(
  claimableMinutes: number,
  rollsPerHour: number,
  random: () => number,
) {
  const rawRolls = (claimableMinutes * rollsPerHour) / 60;
  const guaranteedRolls = Math.floor(rawRolls);
  const remainder = rawRolls - guaranteedRolls;

  return guaranteedRolls + (random() < remainder ? 1 : 0);
}

function rollStatBlock(
  statRanges: Partial<Record<StatKey, { min: number; max: number }>>,
  multiplier: number,
  random: () => number,
) {
  const result = createEmptyStats();

  for (const statKey of statKeys) {
    const range = statRanges[statKey];

    if (!range) {
      continue;
    }

    result[statKey] = Math.round(rollInt(range.min, range.max, random) * multiplier);
  }

  return result;
}

function sumStats(parts: EquipmentStats[]) {
  const result = createEmptyStats();

  for (const part of parts) {
    for (const statKey of statKeys) {
      result[statKey] += part[statKey];
    }
  }

  return result;
}

function getAvailableAffixes(
  dropTable: DropTableDefinition,
  slot: ItemSlot,
  excludedAffixIds: string[],
) {
  return dropTable.affixPoolIds
    .map((affixId) => affixMap.get(affixId))
    .filter(
      (affix): affix is AffixDefinition =>
        Boolean(
          affix &&
            affix.allowedSlots.includes(slot) &&
            !excludedAffixIds.includes(affix.id),
        ),
    );
}

function buildItemName(
  rarity: ItemRarity,
  baseItem: ItemBaseDefinition,
  affixes: AffixDefinition[],
  locale: Locale,
) {
  const prefixes = affixes
    .filter((affix) => affix.placement === "prefix")
    .map((affix) => getAffixName(affix.id, locale));
  const suffixes = affixes
    .filter((affix) => affix.placement === "suffix")
    .map((affix) => getAffixName(affix.id, locale));
  const visibleModifiers = [...prefixes, ...suffixes].filter(Boolean);
  const fallbackModifier =
    visibleModifiers[0] ??
    affixes
      .map((affix) => getAffixName(affix.id, locale))
      .find(Boolean) ??
    (rarity === "common" ? "" : formatRarityLabel(rarity, locale));

  if (locale === "zh") {
    return [
      prefixes.length > 0 ? prefixes.join("") : rarity === "common" ? "" : fallbackModifier,
      getItemBaseName(baseItem.id, locale),
      suffixes.length > 0 ? `·${suffixes.join("·")}` : "",
      rarity === "legendary" ? "【传说】" : "",
    ]
      .filter(Boolean)
      .join("");
  }

  const englishPrefixes = prefixes.length > 0 ? prefixes : rarity === "common" ? [] : [fallbackModifier];

  return [
    rarity.charAt(0).toUpperCase() + rarity.slice(1),
    ...englishPrefixes,
    getItemBaseName(baseItem.id, locale),
    ...suffixes,
  ].join(" ");
}

export function getRarityAffixCount(rarity: ItemRarity) {
  return rarityConfig[rarity].affixCount;
}

export function getEquipmentMechanicsSummary(
  input: {
    baseItemId: string;
    rarity: ItemRarity;
    affixIds: string[];
    sourceRegionId: string;
  },
  locale: Locale = "zh",
): EquipmentMechanicsSummary {
  const baseItem = itemBaseMap.get(input.baseItemId);
  const region = getRegionById(input.sourceRegionId);
  const affixes = input.affixIds
    .map((affixId) => affixMap.get(affixId))
    .filter((affix): affix is AffixDefinition => Boolean(affix));
  const baseStatKeys = statKeys.filter(
    (statKey) => (baseItem?.statRanges[statKey]?.max ?? 0) > 0,
  );
  const affixStatKeySet = new Set<StatKey>();

  for (const affix of affixes) {
    for (const statKey of statKeys) {
      if ((affix.statRanges[statKey]?.max ?? 0) > 0) {
        affixStatKeySet.add(statKey);
      }
    }
  }

  return {
    baseItemName: getItemBaseName(input.baseItemId, locale),
    baseItemDescription: getItemBaseDescription(input.baseItemId, locale),
    affixNames: affixes.map((affix) => getAffixName(affix.id, locale)),
    affixSummaries: affixes.map((affix) => ({
      name: getAffixName(affix.id, locale),
      description: getAffixDescription(affix.id, locale),
    })),
    sourceRegionName: region ? getRegionName(region, locale) : input.sourceRegionId,
    rarityLabel: formatRarityLabel(input.rarity, locale),
    affixCount: affixes.length,
    expectedAffixCount: getRarityAffixCount(input.rarity),
    baseStatKeys,
    affixStatKeys: Array.from(affixStatKeySet),
  };
}

export function calculateItemStatBounds(
  baseItemId: string,
  rarity: ItemRarity,
  affixIds: string[],
) {
  const baseItem = itemBaseMap.get(baseItemId);

  if (!baseItem) {
    throw new Error(`Unknown base item: ${baseItemId}`);
  }

  const rarityMultiplier = rarityConfig[rarity].multiplier;
  const result = statKeys.reduce<
    Record<StatKey, { min: number; max: number }>
  >((bounds, statKey) => {
    bounds[statKey] = { min: 0, max: 0 };

    return bounds;
  }, {} as Record<StatKey, { min: number; max: number }>);

  for (const statKey of statKeys) {
    const baseRange = baseItem.statRanges[statKey];

    if (baseRange) {
      result[statKey].min += Math.round(baseRange.min * rarityMultiplier);
      result[statKey].max += Math.round(baseRange.max * rarityMultiplier);
    }
  }

  for (const affixId of affixIds) {
    const affix = affixMap.get(affixId);

    if (!affix) {
      continue;
    }

    for (const statKey of statKeys) {
      const range = affix.statRanges[statKey];

      if (!range) {
        continue;
      }

      result[statKey].min += Math.round(range.min * rarityMultiplier);
      result[statKey].max += Math.round(range.max * rarityMultiplier);
    }
  }

  return result;
}

export function generateEquipmentDrop(
  dropTableId: string,
  random: () => number = Math.random,
  locale: Locale = "zh",
  effects: Partial<RewardEffectStats> = {},
) {
  const dropTable = dropTableMap.get(dropTableId);

  if (!dropTable) {
    throw new Error(`Unknown drop table: ${dropTableId}`);
  }

  const baseItemId = dropTable.itemBaseIds[Math.floor(random() * dropTable.itemBaseIds.length)];
  const baseItem = itemBaseMap.get(baseItemId);

  if (!baseItem) {
    throw new Error(`Unknown base item: ${baseItemId}`);
  }

  const rarity = rollRarity(adjustRarityWeights(dropTable.rarityWeights, effects), random);
  const rarityMultiplier = rarityConfig[rarity].multiplier;
  const selectedAffixes: AffixDefinition[] = [];

  for (let index = 0; index < rarityConfig[rarity].affixCount; index += 1) {
    const availableAffixes = getAvailableAffixes(
      dropTable,
      baseItem.slot,
      selectedAffixes.map((affix) => affix.id),
    );

    if (availableAffixes.length === 0) {
      break;
    }

    selectedAffixes.push(
      availableAffixes[Math.floor(random() * availableAffixes.length)]!,
    );
  }

  const baseStats = rollStatBlock(baseItem.statRanges, rarityMultiplier, random);
  const affixStats = selectedAffixes.map((affix) =>
    rollStatBlock(affix.statRanges, rarityMultiplier, random),
  );
  const stats = coerceStats(sumStats([baseStats, ...affixStats]));

  return {
    baseItemId: baseItem.id,
    name: buildItemName(rarity, baseItem, selectedAffixes, locale),
    slot: baseItem.slot,
    rarity,
    stats,
    affixIds: selectedAffixes.map((affix) => affix.id),
  } satisfies GeneratedEquipment;
}

export function generateEquipmentDropForSlot(
  dropTableId: string,
  slot: ItemSlot,
  random: () => number = Math.random,
  locale: Locale = "zh",
  effects: Partial<RewardEffectStats> = {},
) {
  const dropTable = dropTableMap.get(dropTableId);

  if (!dropTable) {
    throw new Error(`Unknown drop table: ${dropTableId}`);
  }

  const matchingBaseIds = dropTable.itemBaseIds.filter((baseItemId) => {
    const baseItem = itemBaseMap.get(baseItemId);

    return baseItem?.slot === slot;
  });

  if (matchingBaseIds.length === 0) {
    throw new Error(`Drop table ${dropTableId} has no base items for slot ${slot}.`);
  }

  const baseItemId = matchingBaseIds[Math.floor(random() * matchingBaseIds.length)];
  const baseItem = itemBaseMap.get(baseItemId);

  if (!baseItem) {
    throw new Error(`Unknown base item: ${baseItemId}`);
  }

  const rarity = rollRarity(adjustRarityWeights(dropTable.rarityWeights, effects), random);
  const rarityMultiplier = rarityConfig[rarity].multiplier;
  const selectedAffixes: AffixDefinition[] = [];

  for (let index = 0; index < rarityConfig[rarity].affixCount; index += 1) {
    const availableAffixes = getAvailableAffixes(
      dropTable,
      baseItem.slot,
      selectedAffixes.map((affix) => affix.id),
    );

    if (availableAffixes.length === 0) {
      break;
    }

    selectedAffixes.push(
      availableAffixes[Math.floor(random() * availableAffixes.length)]!,
    );
  }

  const baseStats = rollStatBlock(baseItem.statRanges, rarityMultiplier, random);
  const affixStats = selectedAffixes.map((affix) =>
    rollStatBlock(affix.statRanges, rarityMultiplier, random),
  );
  const stats = coerceStats(sumStats([baseStats, ...affixStats]));

  return {
    baseItemId: baseItem.id,
    name: buildItemName(rarity, baseItem, selectedAffixes, locale),
    slot: baseItem.slot,
    rarity,
    stats,
    affixIds: selectedAffixes.map((affix) => affix.id),
  } satisfies GeneratedEquipment;
}

export function generateReforgedEquipment(
  input: {
    dropTableId: string;
    baseItemId: string;
    rarity: ItemRarity;
  },
  random: () => number = Math.random,
  locale: Locale = "zh",
) {
  const dropTable = dropTableMap.get(input.dropTableId);

  if (!dropTable) {
    throw new Error(`Unknown drop table: ${input.dropTableId}`);
  }

  const baseItem = itemBaseMap.get(input.baseItemId);

  if (!baseItem) {
    throw new Error(`Unknown base item: ${input.baseItemId}`);
  }

  const rarityMultiplier = rarityConfig[input.rarity].multiplier;
  const selectedAffixes: AffixDefinition[] = [];

  for (let index = 0; index < rarityConfig[input.rarity].affixCount; index += 1) {
    const availableAffixes = getAvailableAffixes(
      dropTable,
      baseItem.slot,
      selectedAffixes.map((affix) => affix.id),
    );

    if (availableAffixes.length === 0) {
      break;
    }

    selectedAffixes.push(
      availableAffixes[Math.floor(random() * availableAffixes.length)]!,
    );
  }

  const baseStats = rollStatBlock(baseItem.statRanges, rarityMultiplier, random);
  const affixStats = selectedAffixes.map((affix) =>
    rollStatBlock(affix.statRanges, rarityMultiplier, random),
  );
  const stats = coerceStats(sumStats([baseStats, ...affixStats]));

  return {
    baseItemId: baseItem.id,
    name: buildItemName(input.rarity, baseItem, selectedAffixes, locale),
    slot: baseItem.slot,
    rarity: input.rarity,
    stats,
    affixIds: selectedAffixes.map((affix) => affix.id),
  } satisfies GeneratedEquipment;
}

export function generateRegionDrops(
  dropTableId: string,
  claimableMinutes: number,
  random: () => number = Math.random,
  locale: Locale = "zh",
  effects: Partial<RewardEffectStats> = {},
) {
  const dropTable = dropTableMap.get(dropTableId);

  if (!dropTable) {
    throw new Error(`Unknown drop table: ${dropTableId}`);
  }

  const baseRollCount = calculateDropRollCount(
    claimableMinutes,
    dropTable.rollsPerHour,
    random,
  );
  const rollCount = scaleDropRollCount(baseRollCount, effects, random);

  return Array.from({ length: rollCount }, () =>
    generateEquipmentDrop(dropTableId, random, locale, effects),
  );
}

export function getAllLootData() {
  return {
    itemBaseDefinitions,
    affixDefinitions,
    dropTableDefinitions,
  };
}
