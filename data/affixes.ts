import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";
import type { ItemSlot, StatKey, StatRange } from "@/lib/game/types";

export type AffixDefinition = {
  id: string;
  name: LocalizedText;
  placement: "prefix" | "suffix";
  allowedSlots: ItemSlot[];
  statRanges: Partial<Record<StatKey, StatRange>>;
};

export const affixDefinitions: AffixDefinition[] = [
  {
    id: "steady",
    name: { zh: "沉稳", en: "Steady" },
    placement: "prefix",
    allowedSlots: ["weapon", "helmet", "armor", "boots"],
    statRanges: {
      defense: { min: 1, max: 3 },
    },
  },
  {
    id: "keen",
    name: { zh: "锋锐", en: "Keen" },
    placement: "prefix",
    allowedSlots: ["weapon", "accessory"],
    statRanges: {
      attack: { min: 2, max: 4 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "lucky",
    name: { zh: "鸿运", en: "Lucky" },
    placement: "prefix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      luck: { min: 2, max: 5 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "guarding",
    name: { zh: "守御", en: "Guarding" },
    placement: "prefix",
    allowedSlots: ["helmet", "armor"],
    statRanges: {
      defense: { min: 2, max: 5 },
      hp: { min: 6, max: 12 },
    },
  },
  {
    id: "swift",
    name: { zh: "迅捷", en: "Swift" },
    placement: "prefix",
    allowedSlots: ["weapon", "boots", "accessory"],
    statRanges: {
      luck: { min: 1, max: 3 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "disciplined",
    name: { zh: "严整", en: "Disciplined" },
    placement: "prefix",
    allowedSlots: ["weapon", "helmet", "armor"],
    statRanges: {
      attack: { min: 1, max: 3 },
      defense: { min: 1, max: 3 },
    },
  },
  {
    id: "frozen",
    name: { zh: "霜咬", en: "Frozen" },
    placement: "prefix",
    allowedSlots: ["weapon", "helmet", "accessory"],
    statRanges: {
      crit: { min: 1, max: 3 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "ironhide",
    name: { zh: "铁壁", en: "Ironhide" },
    placement: "prefix",
    allowedSlots: ["helmet", "armor", "boots"],
    statRanges: {
      defense: { min: 2, max: 4 },
      hp: { min: 4, max: 10 },
    },
  },
  {
    id: "watchful",
    name: { zh: "警觉", en: "Watchful" },
    placement: "prefix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      defense: { min: 1, max: 2 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "glittering",
    name: { zh: "金辉", en: "Glittering" },
    placement: "prefix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      goldBonus: { min: 1, max: 3 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "of_flames",
    name: { zh: "燃印", en: "of Flames" },
    placement: "suffix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 2, max: 5 },
      goldBonus: { min: 1, max: 4 },
    },
  },
  {
    id: "of_focus",
    name: { zh: "专注", en: "of Focus" },
    placement: "suffix",
    allowedSlots: ["weapon", "helmet", "accessory"],
    statRanges: {
      crit: { min: 2, max: 4 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "of_vigor",
    name: { zh: "强生", en: "of Vigor" },
    placement: "suffix",
    allowedSlots: ["helmet", "armor", "boots"],
    statRanges: {
      hp: { min: 8, max: 16 },
    },
  },
  {
    id: "of_plenty",
    name: { zh: "丰收", en: "of Plenty" },
    placement: "suffix",
    allowedSlots: ["boots", "accessory"],
    statRanges: {
      goldBonus: { min: 2, max: 5 },
      expBonus: { min: 2, max: 5 },
    },
  },
  {
    id: "of_tides",
    name: { zh: "潮息", en: "of Tides" },
    placement: "suffix",
    allowedSlots: ["weapon", "boots", "accessory"],
    statRanges: {
      luck: { min: 1, max: 3 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "of_thorns",
    name: { zh: "棘护", en: "of Thorns" },
    placement: "suffix",
    allowedSlots: ["helmet", "armor", "boots"],
    statRanges: {
      defense: { min: 1, max: 3 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "of_echoes",
    name: { zh: "回声", en: "of Echoes" },
    placement: "suffix",
    allowedSlots: ["weapon", "helmet", "accessory"],
    statRanges: {
      crit: { min: 1, max: 3 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "of_mending",
    name: { zh: "回春", en: "of Mending" },
    placement: "suffix",
    allowedSlots: ["helmet", "armor", "accessory"],
    statRanges: {
      hp: { min: 6, max: 12 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "of_wealth",
    name: { zh: "富藏", en: "of Wealth" },
    placement: "suffix",
    allowedSlots: ["armor", "boots", "accessory"],
    statRanges: {
      goldBonus: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "of_hunt",
    name: { zh: "追猎", en: "of Hunt" },
    placement: "suffix",
    allowedSlots: ["weapon", "boots", "accessory"],
    statRanges: {
      attack: { min: 1, max: 3 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "stormbound",
    name: { zh: "奔雷", en: "Stormbound" },
    placement: "prefix",
    allowedSlots: ["weapon", "boots", "accessory"],
    statRanges: {
      attack: { min: 2, max: 4 },
      crit: { min: 2, max: 4 },
    },
  },
  {
    id: "moonlit",
    name: { zh: "月照", en: "Moonlit" },
    placement: "prefix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      expBonus: { min: 2, max: 4 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "venomous",
    name: { zh: "蚀毒", en: "Venomous" },
    placement: "prefix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 2, max: 5 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "crystalline",
    name: { zh: "晶护", en: "Crystalline" },
    placement: "prefix",
    allowedSlots: ["helmet", "armor", "accessory"],
    statRanges: {
      defense: { min: 2, max: 4 },
      crit: { min: 1, max: 3 },
    },
  },
  {
    id: "abyssal",
    name: { zh: "渊焰", en: "Abyssal" },
    placement: "prefix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 3, max: 6 },
      hp: { min: 6, max: 12 },
    },
  },
  {
    id: "of_storms",
    name: { zh: "雷岚", en: "of Storms" },
    placement: "suffix",
    allowedSlots: ["weapon", "boots", "accessory"],
    statRanges: {
      crit: { min: 2, max: 4 },
      goldBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "of_mist",
    name: { zh: "雾踪", en: "of Mist" },
    placement: "suffix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      luck: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "of_rites",
    name: { zh: "祭仪", en: "of Rites" },
    placement: "suffix",
    allowedSlots: ["helmet", "armor", "accessory"],
    statRanges: {
      expBonus: { min: 2, max: 4 },
      hp: { min: 8, max: 16 },
    },
  },
  {
    id: "of_crystals",
    name: { zh: "裂晶", en: "of Crystals" },
    placement: "suffix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      defense: { min: 2, max: 4 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "of_ruin",
    name: { zh: "残王", en: "of Ruin" },
    placement: "suffix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 2, max: 5 },
      crit: { min: 1, max: 3 },
      goldBonus: { min: 1, max: 2 },
    },
  },
];

export const affixMap = new Map(
  affixDefinitions.map((affix) => [affix.id, affix]),
);

const affixStatFocusLabels = {
  zh: {
    attack: "进攻",
    defense: "防守",
    hp: "生存",
    luck: "幸运",
    crit: "爆发",
    goldBonus: "金币收益",
    expBonus: "经验收益",
    dropBonus: "掉落收益",
  },
  en: {
    attack: "attack",
    defense: "defense",
    hp: "survivability",
    luck: "luck",
    crit: "burst",
    goldBonus: "gold income",
    expBonus: "experience gain",
    dropBonus: "drop gain",
  },
} satisfies Record<Locale, Record<StatKey, string>>;

function joinAffixFocusLabels(labels: string[], locale: Locale) {
  if (labels.length === 0) {
    return locale === "zh" ? "基础能力" : "core basics";
  }

  if (labels.length === 1) {
    return labels[0]!;
  }

  if (labels.length === 2) {
    return locale === "zh" ? `${labels[0]}与${labels[1]}` : `${labels[0]} and ${labels[1]}`;
  }

  const head = labels.slice(0, -1).join(locale === "zh" ? "、" : ", ");
  const tail = labels[labels.length - 1]!;

  return locale === "zh" ? `${head}与${tail}` : `${head}, and ${tail}`;
}

export function getAffixName(affixId: string, locale: Locale) {
  const affix = affixMap.get(affixId);

  return affix ? pickLocalizedText(locale, affix.name) : affixId;
}

export function getAffixDescription(affixId: string, locale: Locale) {
  const affix = affixMap.get(affixId);

  if (!affix) {
    return affixId;
  }

  const activeStatKeys = (Object.keys(affix.statRanges) as StatKey[]).filter(
    (statKey) => affix.statRanges[statKey],
  );
  const focus = joinAffixFocusLabels(
    activeStatKeys.map((statKey) => affixStatFocusLabels[locale][statKey]),
    locale,
  );
  const keySet = new Set(activeStatKeys);
  const hasResource = keySet.has("goldBonus") || keySet.has("expBonus") || keySet.has("dropBonus");
  const hasOffense = keySet.has("attack") || keySet.has("crit");
  const hasDefense = keySet.has("defense") || keySet.has("hp");

  if (locale === "zh") {
    if (hasResource && hasOffense) {
      return `这个词缀主要补强${focus}，偏向收益与推进两头兼顾。`;
    }

    if (hasResource) {
      return `这个词缀主要补强${focus}，更适合刷图和养成节奏。`;
    }

    if (hasOffense && !hasDefense) {
      return `这个词缀主要补强${focus}，更适合打出推进与爆发。`;
    }

    if (hasDefense && !hasOffense) {
      return `这个词缀主要补强${focus}，更适合稳住生存线。`;
    }

    return `这个词缀主要补强${focus}，适合拿来补足当前配装。`;
  }

  if (hasResource && hasOffense) {
    return `This affix boosts ${focus} and balances farming value with pushing power.`;
  }

  if (hasResource) {
    return `This affix boosts ${focus} and is better for farming and long-term growth.`;
  }

  if (hasOffense && !hasDefense) {
    return `This affix boosts ${focus} and leans toward pressure and burst.`;
  }

  if (hasDefense && !hasOffense) {
    return `This affix boosts ${focus} and leans toward steadier survival.`;
  }

  return `This affix boosts ${focus} and helps round out the build.`;
}
