import {
  affixSupportsSlot,
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
  getItemBaseName,
  itemBaseMap,
  decoratedItemBaseDefinitions,
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
  affixStats: EquipmentStats[];
};

export type WeightedEntry<TValue extends string> = {
  value: TValue;
  weight: number;
};

export type EquipmentMechanicsSummary = {
  baseItemName: string;
  familyName: string;
  affixNames: string[];
  affixLines: Array<{
    name: string;
    stats: Array<{ statKey: StatKey; label: string; value: number }>;
  }>;
  sourceRegionName: string;
  rarityLabel: string;
  affixCount: number;
  expectedAffixCount: number;
  baseStatLines: Array<{ statKey: StatKey; label: string; value: number }>;
  affixStatLabels: string[];
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

const statLabels = {
  zh: {
    attack: "攻击",
    defense: "防御",
    hp: "生命",
    luck: "幸运",
    crit: "暴击",
    goldBonus: "金币%",
    expBonus: "经验%",
    dropBonus: "掉落%",
  },
  en: {
    attack: "ATK",
    defense: "DEF",
    hp: "HP",
    luck: "LUK",
    crit: "CRIT",
    goldBonus: "GOLD%",
    expBonus: "EXP%",
    dropBonus: "DROP%",
  },
} satisfies Record<Locale, Record<StatKey, string>>;

function getStatLabel(statKey: StatKey, locale: Locale) {
  return statLabels[locale][statKey];
}

function countTagMatches(candidateTags: string[] | undefined, requestedTags: string[] | undefined) {
  if (!candidateTags || !requestedTags || requestedTags.length === 0) {
    return 0;
  }

  const candidateTagSet = new Set(candidateTags);

  return requestedTags.reduce(
    (sum, tag) => sum + (candidateTagSet.has(tag) ? 1 : 0),
    0,
  );
}

function getAvailableAffixes(
  dropTable: DropTableDefinition,
  slot: ItemSlot,
  excludedAffixIds: string[],
  options: {
    preferredThemeTags?: string[];
    regionId?: string;
  } = {},
) {
  return dropTable.affixPoolIds
    .map((affixId) => affixMap.get(affixId))
    .filter(
      (affix): affix is AffixDefinition =>
        Boolean(
          affix &&
            affixSupportsSlot(affix, slot) &&
            !excludedAffixIds.includes(affix.id),
        ),
    )
    .map((affix) => ({
      affix,
      weight:
        (affix.weight ?? 100) +
        countTagMatches(affix.themeTags, options.preferredThemeTags) * 30 +
        ((options.regionId && affix.regionBias?.includes(options.regionId)) ? 25 : 0),
    }));
}

function getEligibleClans(
  dropTable: DropTableDefinition,
  slot?: ItemSlot,
) {
  if (!slot) {
    return dropTable.clans;
  }

  const slotEligibleClans = dropTable.clans.filter((clan) => {
    if (clan.favoredSlots?.includes(slot)) {
      return true;
    }

    return dropTable.itemBaseIds.some((baseItemId) => {
      const baseItem = itemBaseMap.get(baseItemId);

      return (
        baseItem?.slot === slot &&
        countTagMatches(baseItem.themeTags, clan.itemThemeTags) > 0
      );
    });
  });

  return slotEligibleClans.length > 0 ? slotEligibleClans : dropTable.clans;
}

function chooseDropClan(
  dropTable: DropTableDefinition,
  random: () => number,
  slot?: ItemSlot,
) {
  const clans = getEligibleClans(dropTable, slot);

  return clans.length > 0
    ? clans.find((clan) => clan.id === chooseWeighted(
        clans.map((clan) => ({ value: clan.id, weight: clan.weight })),
        random,
      )) ?? clans[0]!
    : null;
}

function chooseBaseItemFromDropTable(
  dropTable: DropTableDefinition,
  random: () => number,
  options: {
    slot?: ItemSlot;
    clanThemeTags?: string[];
    regionId?: string;
  } = {},
) {
  const candidates = dropTable.itemBaseIds
    .map((baseItemId) => itemBaseMap.get(baseItemId))
    .filter((baseItem): baseItem is ItemBaseDefinition => Boolean(baseItem))
    .filter((baseItem) => (options.slot ? baseItem.slot === options.slot : true));

  if (candidates.length === 0) {
    throw new Error(
      `Drop table ${dropTable.id} has no base items${options.slot ? ` for slot ${options.slot}` : ""}.`,
    );
  }

  const weightedCandidates = candidates.map((baseItem) => {
    const tagMatchCount = countTagMatches(baseItem.themeTags, options.clanThemeTags);
    const regionMatch = options.regionId
      ? (baseItem.allowedRegionIds?.includes(options.regionId) ? 1 : 0)
      : 0;

    return {
      value: baseItem.id,
      weight: (baseItem.weight ?? 100) + tagMatchCount * 35 + regionMatch * 25,
    };
  });

  const selectedBaseItemId = chooseWeighted(weightedCandidates, random);
  const selectedBaseItem = itemBaseMap.get(selectedBaseItemId);

  if (!selectedBaseItem) {
    throw new Error(`Unknown base item: ${selectedBaseItemId}`);
  }

  return selectedBaseItem;
}

function resolveGeneratedRarity(
  dropTable: DropTableDefinition,
  random: () => number,
  effects: Partial<RewardEffectStats>,
  options: {
    forcedRarity?: ItemRarity;
    minRarity?: ItemRarity;
  } = {},
) {
  if (options.forcedRarity) {
    return options.forcedRarity;
  }

  const rolledRarity = rollRarity(
    adjustRarityWeights(dropTable.rarityWeights, effects),
    random,
  );

  if (!options.minRarity) {
    return rolledRarity;
  }

  const rolledIndex = itemRarities.indexOf(rolledRarity);
  const minimumIndex = itemRarities.indexOf(options.minRarity);

  return itemRarities[Math.max(rolledIndex, minimumIndex)]!;
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
    stats: Partial<EquipmentStats>;
    affixStats?: Partial<EquipmentStats>[];
  },
  locale: Locale = "zh",
): EquipmentMechanicsSummary {
  const baseItem = itemBaseMap.get(input.baseItemId);
  const region = getRegionById(input.sourceRegionId);
  const affixes = input.affixIds
    .map((affixId) => affixMap.get(affixId))
    .filter((affix): affix is AffixDefinition => Boolean(affix));
  const totalStats = coerceStats(input.stats);
  const affixStatBlocks = (input.affixStats ?? []).map((statBlock) => coerceStats(statBlock));
  const summedAffixStats = sumStats(affixStatBlocks);
  const baseStats = coerceStats(
    statKeys.reduce<Partial<EquipmentStats>>((result, statKey) => {
      result[statKey] = Math.max(0, totalStats[statKey] - summedAffixStats[statKey]);

      return result;
    }, {}),
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
    familyName: baseItem?.familyName ? baseItem.familyName[locale] : getItemBaseName(input.baseItemId, locale),
    affixNames: affixes.map((affix) => getAffixName(affix.id, locale)),
    affixLines: affixes.map((affix, index) => {
      const statBlock = affixStatBlocks[index] ?? createEmptyStats();

      return {
        name: getAffixName(affix.id, locale),
        stats: statKeys
          .filter((statKey) => statBlock[statKey] > 0)
          .map((statKey) => ({
            statKey,
            label: getStatLabel(statKey, locale),
            value: statBlock[statKey],
          })),
      };
    }),
    sourceRegionName: region ? getRegionName(region, locale) : input.sourceRegionId,
    rarityLabel: formatRarityLabel(input.rarity, locale),
    affixCount: affixes.length,
    expectedAffixCount: getRarityAffixCount(input.rarity),
    baseStatLines: statKeys
      .filter((statKey) => baseStats[statKey] > 0)
      .map((statKey) => ({
        statKey,
        label: getStatLabel(statKey, locale),
        value: baseStats[statKey],
      })),
    affixStatLabels: Array.from(affixStatKeySet).map((statKey) => getStatLabel(statKey, locale)),
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
  options: {
    forcedRarity?: ItemRarity;
    minRarity?: ItemRarity;
    slot?: ItemSlot;
  } = {},
) {
  const dropTable = dropTableMap.get(dropTableId);

  if (!dropTable) {
    throw new Error(`Unknown drop table: ${dropTableId}`);
  }

  const clan = chooseDropClan(dropTable, random, options.slot);
  const baseItem = chooseBaseItemFromDropTable(dropTable, random, {
    slot: options.slot,
    clanThemeTags: clan?.itemThemeTags,
    regionId: dropTable.regionId,
  });
  const rarity = resolveGeneratedRarity(dropTable, random, effects, options);
  const rarityMultiplier = rarityConfig[rarity].multiplier;
  const selectedAffixes: AffixDefinition[] = [];
  const affixStatBlocks: EquipmentStats[] = [];

  for (let index = 0; index < rarityConfig[rarity].affixCount; index += 1) {
    const availableAffixes = getAvailableAffixes(
      dropTable,
      baseItem.slot,
      selectedAffixes.map((affix) => affix.id),
      {
        preferredThemeTags: clan?.affixThemeTags,
        regionId: dropTable.regionId,
      },
    );

    if (availableAffixes.length === 0) {
      break;
    }

    const chosenAffixId = chooseWeighted(
      availableAffixes.map(({ affix, weight }) => ({
        value: affix.id,
        weight,
      })),
      random,
    );
    const chosenAffix = affixMap.get(chosenAffixId);

    if (!chosenAffix) {
      break;
    }

    selectedAffixes.push(chosenAffix);
  }

  const baseStats = rollStatBlock(baseItem.statRanges, rarityMultiplier, random);
  for (const affix of selectedAffixes) {
    affixStatBlocks.push(
      rollStatBlock(affix.statRanges, rarityMultiplier, random),
    );
  }
  const stats = coerceStats(sumStats([baseStats, ...affixStatBlocks]));

  return {
    baseItemId: baseItem.id,
    name: buildItemName(rarity, baseItem, selectedAffixes, locale),
    slot: baseItem.slot,
    rarity,
    stats,
    affixIds: selectedAffixes.map((affix) => affix.id),
    affixStats: affixStatBlocks,
  } satisfies GeneratedEquipment;
}

export function generateEquipmentDropForSlot(
  dropTableId: string,
  slot: ItemSlot,
  random: () => number = Math.random,
  locale: Locale = "zh",
  effects: Partial<RewardEffectStats> = {},
  options: {
    forcedRarity?: ItemRarity;
    minRarity?: ItemRarity;
  } = {},
) {
  return generateEquipmentDrop(dropTableId, random, locale, effects, {
    ...options,
    slot,
  });
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
  const affixStatBlocks: EquipmentStats[] = [];
  const clan = chooseDropClan(dropTable, random, baseItem.slot);

  for (let index = 0; index < rarityConfig[input.rarity].affixCount; index += 1) {
    const availableAffixes = getAvailableAffixes(
      dropTable,
      baseItem.slot,
      selectedAffixes.map((affix) => affix.id),
      {
        preferredThemeTags: clan?.affixThemeTags,
        regionId: dropTable.regionId,
      },
    );

    if (availableAffixes.length === 0) {
      break;
    }

    const chosenAffixId = chooseWeighted(
      availableAffixes.map(({ affix, weight }) => ({
        value: affix.id,
        weight,
      })),
      random,
    );
    const chosenAffix = affixMap.get(chosenAffixId);

    if (!chosenAffix) {
      break;
    }

    selectedAffixes.push(chosenAffix);
  }

  const baseStats = rollStatBlock(baseItem.statRanges, rarityMultiplier, random);
  for (const affix of selectedAffixes) {
    affixStatBlocks.push(
      rollStatBlock(affix.statRanges, rarityMultiplier, random),
    );
  }
  const stats = coerceStats(sumStats([baseStats, ...affixStatBlocks]));

  return {
    baseItemId: baseItem.id,
    name: buildItemName(input.rarity, baseItem, selectedAffixes, locale),
    slot: baseItem.slot,
    rarity: input.rarity,
    stats,
    affixIds: selectedAffixes.map((affix) => affix.id),
    affixStats: affixStatBlocks,
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
    itemBaseDefinitions: decoratedItemBaseDefinitions,
    affixDefinitions: Array.from(affixMap.values()),
    dropTableDefinitions,
  };
}
