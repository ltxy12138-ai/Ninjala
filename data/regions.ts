import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";

export type RegionMaterialRate = {
  materialId: string;
  amountPerHour: number;
};

export type RegionDefinition = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  recommendedPower: number;
  goldPerMinute: number;
  expPerMinute: number;
  dropTableId: string;
  bossId: string;
  unlocksRegionId: string | null;
  materialRates: RegionMaterialRate[];
};

export const regionDefinitions: RegionDefinition[] = [
  {
    id: "region_001",
    name: { zh: "新手竹林", en: "Bamboo Grove" },
    description: {
      zh: "适合起步挂机，能稳定拿到草材和石料。",
      en: "Steady beginner farming with simple herbs and stones.",
    },
    recommendedPower: 0,
    goldPerMinute: 2,
    expPerMinute: 1,
    dropTableId: "drops_bamboo_grove",
    bossId: "boss_bamboo_wolf",
    unlocksRegionId: "region_002",
    materialRates: [
      { materialId: "bamboo_shoot", amountPerHour: 6 },
      { materialId: "river_stone", amountPerHour: 3 },
    ],
  },
  {
    id: "region_002",
    name: { zh: "冰鱼河", en: "Icefish River" },
    description: {
      zh: "气温更低，修行更快，也能刷到更稀有的霜鳞。",
      en: "A chilly stream with faster training and rarer scales.",
    },
    recommendedPower: 45,
    goldPerMinute: 2,
    expPerMinute: 2,
    dropTableId: "drops_icefish_river",
    bossId: "boss_icefish_king",
    unlocksRegionId: "region_003",
    materialRates: [
      { materialId: "frost_scale", amountPerHour: 4 },
      { materialId: "river_stone", amountPerHour: 2 },
    ],
  },
  {
    id: "region_003",
    name: { zh: "废弃道场", en: "Abandoned Dojo" },
    description: {
      zh: "破败的练武场依然适合高频刷取，收益更扎实。",
      en: "Broken sparring halls that reward disciplined runs.",
    },
    recommendedPower: 150,
    goldPerMinute: 3,
    expPerMinute: 3,
    dropTableId: "drops_abandoned_dojo",
    bossId: "boss_dojo_puppet",
    unlocksRegionId: "region_004",
    materialRates: [
      { materialId: "iron_ore", amountPerHour: 5 },
      { materialId: "bamboo_shoot", amountPerHour: 2 },
    ],
  },
  {
    id: "region_004",
    name: { zh: "雪山矿洞", en: "Snow Mine" },
    description: {
      zh: "冰冷矿道里藏着更厚的矿脉，也有更难缠的怪物。",
      en: "Cold tunnels with heavy ore veins and tougher monsters.",
    },
    recommendedPower: 320,
    goldPerMinute: 4,
    expPerMinute: 4,
    dropTableId: "drops_snow_mine",
    bossId: "boss_frost_yeti",
    unlocksRegionId: "region_005",
    materialRates: [
      { materialId: "iron_ore", amountPerHour: 8 },
      { materialId: "frost_scale", amountPerHour: 6 },
    ],
  },
  {
    id: "region_005",
    name: { zh: "余烬峰", en: "Ember Peak" },
    description: {
      zh: "后期高压区域，危险更高，但能稳定产出火山晶核。",
      en: "A dangerous late-game ridge rich in volcanic fragments.",
    },
    recommendedPower: 550,
    goldPerMinute: 5,
    expPerMinute: 5,
    dropTableId: "drops_ember_peak",
    bossId: "boss_ember_crow",
    unlocksRegionId: null,
    materialRates: [
      { materialId: "ember_core", amountPerHour: 5 },
      { materialId: "iron_ore", amountPerHour: 4 },
    ],
  },
];

export function getRegionName(region: RegionDefinition, locale: Locale) {
  return pickLocalizedText(locale, region.name);
}

export function getRegionDescription(region: RegionDefinition, locale: Locale) {
  return pickLocalizedText(locale, region.description);
}

export function getRegionOrder(regionId: string) {
  return regionDefinitions.findIndex((region) => region.id === regionId);
}
