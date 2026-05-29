import { getMaterialName } from "@/data/materials";
import { getRegionName, type RegionDefinition } from "@/data/regions";
import { getHighestUnlockedRegionId } from "@/lib/game/progression";
import { getRegionById } from "@/lib/game/regions";
import type { Locale } from "@/lib/i18n";
import { itemSlots, type ItemRarity, type ItemSlot } from "@/lib/game/types";

export type MaterialIngredient = {
  materialId: string;
  amount: number;
};

export type MaterialRecipeDefinition = {
  id: string;
  output: MaterialIngredient;
  ingredients: MaterialIngredient[];
  title: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
};

export type DismantlePreview = {
  materialId: string;
  amount: number;
};

export type BulkDismantlePreview = {
  itemCount: number;
  materials: MaterialIngredient[];
};

export type ForgePreview = {
  slot: ItemSlot;
  regionId: string;
  regionName: string;
  goldCost: number;
  ingredients: MaterialIngredient[];
};

export type ReforgePreview = {
  goldCost: number;
  ingredients: MaterialIngredient[];
};

export type DismantleItemSnapshot = {
  id: string;
  name: string;
  sourceRegionId: string;
  rarity: ItemRarity;
  enhancementLevel: number;
};

const dismantleBaseByRarity: Record<ItemRarity, number> = {
  common: 2,
  rare: 4,
  epic: 7,
  legendary: 11,
};

const slotForgeFactors: Record<ItemSlot, number> = {
  weapon: 3,
  helmet: 2,
  armor: 3,
  boots: 2,
  bracer: 2,
  amulet: 2,
  ring: 2,
};

const rarityReforgeFactors: Record<ItemRarity, number> = {
  common: 1,
  rare: 2,
  epic: 4,
  legendary: 6,
};

const forgeSlotLabels = {
  zh: {
    weapon: "武器",
    helmet: "头部",
    armor: "护甲",
    boots: "靴子",
    bracer: "护腕",
    amulet: "项链",
    ring: "戒指",
  },
  en: {
    weapon: "Weapon",
    helmet: "Helmet",
    armor: "Armor",
    boots: "Boots",
    bracer: "Bracer",
    amulet: "Amulet",
    ring: "Ring",
  },
} satisfies Record<Locale, Record<ItemSlot, string>>;

export const materialRecipeDefinitions: MaterialRecipeDefinition[] = [
  {
    id: "craft_frost_scale",
    output: { materialId: "frost_scale", amount: 2 },
    ingredients: [
      { materialId: "bamboo_shoot", amount: 6 },
      { materialId: "river_stone", amount: 3 },
    ],
    title: {
      zh: "凝霜鳞片",
      en: "Condense Frost Scales",
    },
    description: {
      zh: "把竹林和河边材料压成更适合中期强化的霜鳞。",
      en: "Press early-game materials into mid-tier frost scales for upgrades.",
    },
  },
  {
    id: "craft_iron_ore",
    output: { materialId: "iron_ore", amount: 2 },
    ingredients: [
      { materialId: "frost_scale", amount: 6 },
      { materialId: "river_stone", amount: 3 },
    ],
    title: {
      zh: "锻压铁矿",
      en: "Forge Iron Ore",
    },
    description: {
      zh: "把冰鱼河的素材进一步压缩成道场和雪矿会用到的铁矿。",
      en: "Compress river materials into iron ore for later upgrades.",
    },
  },
  {
    id: "craft_ember_core",
    output: { materialId: "ember_core", amount: 2 },
    ingredients: [
      { materialId: "iron_ore", amount: 8 },
      { materialId: "frost_scale", amount: 4 },
    ],
    title: {
      zh: "熔铸余烬核",
      en: "Smelt Ember Cores",
    },
    description: {
      zh: "把中后期材料熔成高阶余烬核，给最终区域装备做准备。",
      en: "Smelt mid-to-late materials into ember cores for top-tier gear.",
    },
  },
];

export function getMaterialRecipeById(recipeId: string) {
  return materialRecipeDefinitions.find((recipe) => recipe.id === recipeId) ?? null;
}

export function getRecipeTitle(
  recipe: MaterialRecipeDefinition,
  locale: Locale,
) {
  return recipe.title[locale];
}

export function getRecipeDescription(
  recipe: MaterialRecipeDefinition,
  locale: Locale,
) {
  return recipe.description[locale];
}

export function getDismantleMaterialId(item: DismantleItemSnapshot) {
  const region = getRegionById(item.sourceRegionId);

  return region?.materialRates[0]?.materialId ?? "iron_ore";
}

export function getDismantlePreview(item: DismantleItemSnapshot): DismantlePreview {
  return {
    materialId: getDismantleMaterialId(item),
    amount:
      dismantleBaseByRarity[item.rarity] +
      Math.max(0, item.enhancementLevel),
  };
}

export function getBulkDismantlePreview(items: DismantleItemSnapshot[]) {
  const totals = new Map<string, number>();

  for (const item of items) {
    const preview = getDismantlePreview(item);
    totals.set(preview.materialId, (totals.get(preview.materialId) ?? 0) + preview.amount);
  }

  return {
    itemCount: items.length,
    materials: Array.from(totals.entries()).map(([materialId, amount]) => ({
      materialId,
      amount,
    })),
  } satisfies BulkDismantlePreview;
}

export function canAffordRecipe(
  recipe: MaterialRecipeDefinition,
  materialAmounts: Map<string, number>,
) {
  return recipe.ingredients.every(
    (ingredient) =>
      (materialAmounts.get(ingredient.materialId) ?? 0) >= ingredient.amount,
  );
}

function buildForgeIngredients(region: RegionDefinition, slot: ItemSlot) {
  const slotFactor = slotForgeFactors[slot];
  const primaryRate = region.materialRates[0];
  const secondaryRate = region.materialRates[1];
  const tier = Math.max(1, region.materialRates.length + region.goldPerMinute / 2);
  const ingredients: MaterialIngredient[] = [
    {
      materialId: primaryRate.materialId,
      amount: Math.max(2, Math.round(slotFactor * tier)),
    },
  ];

  if (secondaryRate) {
    ingredients.push({
      materialId: secondaryRate.materialId,
      amount: Math.max(1, slotFactor + Math.round(tier) - 1),
    });
  }

  return ingredients;
}

export function getForgePreview(
  region: RegionDefinition,
  slot: ItemSlot,
  locale: Locale,
): ForgePreview {
  const slotFactor = slotForgeFactors[slot];
  const tier = Math.max(1, region.goldPerMinute / 2);

  return {
    slot,
    regionId: region.id,
    regionName: getRegionName(region, locale),
    goldCost: Math.round(80 * tier * slotFactor),
    ingredients: buildForgeIngredients(region, slot),
  };
}

export function getForgePreviewsForUnlockedRegions(
  unlockedRegionIds: string[],
  currentRegionId: string,
  locale: Locale,
) {
  const highestUnlockedRegionId = getHighestUnlockedRegionId(
    unlockedRegionIds,
    currentRegionId,
  );
  const region = getRegionById(highestUnlockedRegionId);

  if (!region) {
    return [];
  }

  return itemSlots.map((slot) => getForgePreview(region, slot, locale));
}

export function getReforgePreview(item: DismantleItemSnapshot) {
  const region = getRegionById(item.sourceRegionId);

  if (!region) {
    return {
      goldCost: 100,
      ingredients: [{ materialId: "iron_ore", amount: 2 }],
    } satisfies ReforgePreview;
  }

  const rarityFactor = rarityReforgeFactors[item.rarity];
  const primaryRate = region.materialRates[0];
  const secondaryRate = region.materialRates[1];
  const ingredients: MaterialIngredient[] = [
    {
      materialId: primaryRate.materialId,
      amount: rarityFactor + Math.max(1, item.enhancementLevel),
    },
  ];

  if (secondaryRate) {
    ingredients.push({
      materialId: secondaryRate.materialId,
      amount: Math.max(1, Math.ceil(rarityFactor / 2)),
    });
  }

  return {
    goldCost: 60 * rarityFactor + item.enhancementLevel * 30,
    ingredients,
  } satisfies ReforgePreview;
}

export function canAffordIngredients(
  ingredients: MaterialIngredient[],
  materialAmounts: Map<string, number>,
) {
  return ingredients.every(
    (ingredient) =>
      (materialAmounts.get(ingredient.materialId) ?? 0) >= ingredient.amount,
  );
}

export function buildCraftLogMessage(
  recipe: MaterialRecipeDefinition,
  locale: Locale,
) {
  const outputName = getMaterialName(recipe.output.materialId, locale);

  return locale === "zh"
    ? `合成了 ${outputName} x${recipe.output.amount}。`
    : `Crafted ${outputName} x${recipe.output.amount}.`;
}

export function buildDismantleLogMessage(
  item: DismantleItemSnapshot,
  preview: DismantlePreview,
  locale: Locale,
) {
  const materialName = getMaterialName(preview.materialId, locale);

  return locale === "zh"
    ? `分解了 ${item.name}，回收 ${materialName} x${preview.amount}。`
    : `Dismantled ${item.name} and recovered ${materialName} x${preview.amount}.`;
}

export function buildBulkDismantleLogMessage(
  preview: BulkDismantlePreview,
  locale: Locale,
) {
  const materialSummary = preview.materials
    .map((material) => `${getMaterialName(material.materialId, locale)} x${material.amount}`)
    .join(locale === "zh" ? "、" : ", ");

  return locale === "zh"
    ? `分解了 ${preview.itemCount} 件装备，回收 ${materialSummary}。`
    : `Dismantled ${preview.itemCount} items and recovered ${materialSummary}.`;
}

export function buildForgeLogMessage(
  itemName: string,
  preview: ForgePreview,
  locale: Locale,
) {
  return locale === "zh"
    ? `锻造了 ${forgeSlotLabels.zh[preview.slot]}装备 ${itemName}，来自 ${preview.regionName} 工坊。`
    : `Forged a ${forgeSlotLabels.en[preview.slot]} item ${itemName} from the ${preview.regionName} workshop.`;
}

export function buildReforgeLogMessage(
  itemName: string,
  locale: Locale,
) {
  return locale === "zh"
    ? `重铸了 ${itemName}，词缀和数值已经刷新。`
    : `Reforged ${itemName}, refreshing its affixes and stats.`;
}
