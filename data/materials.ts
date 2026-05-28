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
