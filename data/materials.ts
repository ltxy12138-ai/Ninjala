import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";

export type MaterialDefinition = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
};

export const materialDefinitions: MaterialDefinition[] = [
  {
    id: "bamboo_shoot",
    name: { zh: "竹笋", en: "Bamboo Shoot" },
    description: {
      zh: "从竹林里采回来的清脆修行食材。",
      en: "A crisp training ingredient gathered from the grove.",
    },
  },
  {
    id: "river_stone",
    name: { zh: "河磨石", en: "River Stone" },
    description: {
      zh: "用来打磨初阶武器的光滑卵石。",
      en: "A smooth pebble used for simple weapon polishing.",
    },
  },
  {
    id: "frost_scale",
    name: { zh: "霜鳞", en: "Frost Scale" },
    description: {
      zh: "冰鱼河猎手常拿来交换物资的寒鳞。",
      en: "A cold scale traded by the river hunters.",
    },
  },
  {
    id: "iron_ore",
    name: { zh: "铁矿", en: "Iron Ore" },
    description: {
      zh: "从更深的矿洞里挖出的粗矿石。",
      en: "Raw ore pulled from the deeper mountain tunnels.",
    },
  },
  {
    id: "ember_core",
    name: { zh: "余烬核", en: "Ember Core" },
    description: {
      zh: "在火山山脊附近采到的温热晶核碎片。",
      en: "A warm crystal shard from the volcano ridge.",
    },
  },
  {
    id: "storm_plume",
    name: { zh: "雷羽", en: "Storm Plume" },
    description: {
      zh: "在风暴沼泽里拾到的带电羽片，会微微发亮。",
      en: "A charged feather shard recovered from the storm marsh.",
    },
  },
  {
    id: "moon_amber",
    name: { zh: "月珀", en: "Moon Amber" },
    description: {
      zh: "月影神社的供台附近常能找到的温润树脂结晶。",
      en: "A soft resin crystal often found near the moon shrine altars.",
    },
  },
  {
    id: "venom_sac",
    name: { zh: "蚀毒囊", en: "Venom Sac" },
    description: {
      zh: "毒林怪物体内常见的腐蚀囊袋，仍保留刺激性气味。",
      en: "A corrosive sac harvested from the creatures of the poison woods.",
    },
  },
  {
    id: "star_shard",
    name: { zh: "星晶片", en: "Star Shard" },
    description: {
      zh: "裂谷深处剥落的冷光晶片，边缘像镜面一样锋利。",
      en: "A cold luminous shard broken from the deeper crystal rift.",
    },
  },
  {
    id: "abyss_steel",
    name: { zh: "渊钢", en: "Abyss Steel" },
    description: {
      zh: "渊火王城遗迹里残留的沉重金属，兼具灼热与阴冷。",
      en: "A dense relic metal from the abyssfire bastion, both hot and cold to the touch.",
    },
  },
];

export const materialMap = new Map(
  materialDefinitions.map((material) => [material.id, material]),
);

export function getMaterialName(materialId: string, locale: Locale) {
  const material = materialMap.get(materialId);

  return material ? pickLocalizedText(locale, material.name) : materialId;
}

export function getMaterialDescription(materialId: string, locale: Locale) {
  const material = materialMap.get(materialId);

  return material ? pickLocalizedText(locale, material.description) : "";
}
