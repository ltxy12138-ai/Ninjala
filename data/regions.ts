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
    unlocksRegionId: "region_006",
    materialRates: [
      { materialId: "ember_core", amountPerHour: 5 },
      { materialId: "iron_ore", amountPerHour: 4 },
    ],
  },
  {
    id: "region_006",
    name: { zh: "雷沼泽", en: "Stormfen Marsh" },
    description: {
      zh: "湿重迷雾与雷暴交织的深沼，适合刷取更偏暴击和推进向的装备。",
      en: "A thunder-soaked marsh where crit-leaning and push gear starts to shine.",
    },
    recommendedPower: 900,
    goldPerMinute: 6,
    expPerMinute: 6,
    dropTableId: "drops_stormfen_marsh",
    bossId: "boss_storm_croc",
    unlocksRegionId: "region_007",
    materialRates: [
      { materialId: "storm_plume", amountPerHour: 4 },
      { materialId: "ember_core", amountPerHour: 3 },
    ],
  },
  {
    id: "region_007",
    name: { zh: "月影神社", en: "Moonshadow Shrine" },
    description: {
      zh: "残破神社在夜色中依然明亮，更适合拉长养成线与经验收益。",
      en: "A broken shrine lit by moonlight, favoring longer progression and exp-focused farming.",
    },
    recommendedPower: 1350,
    goldPerMinute: 7,
    expPerMinute: 7,
    dropTableId: "drops_moonshadow_shrine",
    bossId: "boss_moon_guardian",
    unlocksRegionId: "region_008",
    materialRates: [
      { materialId: "moon_amber", amountPerHour: 4 },
      { materialId: "storm_plume", amountPerHour: 3 },
    ],
  },
  {
    id: "region_008",
    name: { zh: "蚀雾毒林", en: "Venom Mistwood" },
    description: {
      zh: "雾气浓得看不清远处，适合掉宝与猎装路线，但推进压力明显上升。",
      en: "A poisonous forest of thick mist where hunting gear improves, but pressure rises sharply.",
    },
    recommendedPower: 2000,
    goldPerMinute: 8,
    expPerMinute: 8,
    dropTableId: "drops_venom_mistwood",
    bossId: "boss_venom_mantis",
    unlocksRegionId: "region_009",
    materialRates: [
      { materialId: "venom_sac", amountPerHour: 5 },
      { materialId: "moon_amber", amountPerHour: 3 },
    ],
  },
  {
    id: "region_009",
    name: { zh: "星晶裂谷", en: "Starcrystal Rift" },
    description: {
      zh: "裂谷中的晶柱会反射整片天光，掉落更稀有，战斗也更吃整体练度。",
      en: "A crystalline rift with rarer drops and a much heavier demand for full-build progression.",
    },
    recommendedPower: 2900,
    goldPerMinute: 9,
    expPerMinute: 9,
    dropTableId: "drops_starcrystal_rift",
    bossId: "boss_crystal_drake",
    unlocksRegionId: "region_010",
    materialRates: [
      { materialId: "star_shard", amountPerHour: 5 },
      { materialId: "venom_sac", amountPerHour: 3 },
    ],
  },
  {
    id: "region_010",
    name: { zh: "渊火王城", en: "Abyssfire Bastion" },
    description: {
      zh: "目前主线最深处的遗迹王城，收益稳定但推进门槛极高。",
      en: "The current deepest stronghold of the main route, stable in reward but brutal in progression demand.",
    },
    recommendedPower: 4100,
    goldPerMinute: 10,
    expPerMinute: 10,
    dropTableId: "drops_abyssfire_bastion",
    bossId: "boss_abyss_lion",
    unlocksRegionId: null,
    materialRates: [
      { materialId: "abyss_steel", amountPerHour: 5 },
      { materialId: "star_shard", amountPerHour: 4 },
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
