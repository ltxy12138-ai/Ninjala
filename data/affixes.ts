import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";
import type { ItemSlot, StatKey, StatRange } from "@/lib/game/types";

export type AffixDefinition = {
  id: string;
  name: LocalizedText;
  placement: "prefix" | "suffix";
  allowedSlots: Array<ItemSlot | "accessory">;
  statRanges: Partial<Record<StatKey, StatRange>>;
  family?: string;
  tier?: 1 | 2 | 3;
  themeTags?: string[];
  regionBias?: string[];
  weight?: number;
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
      attack: { min: 3, max: 6 },
      crit: { min: 3, max: 5 },
    },
  },
  {
    id: "moonlit",
    name: { zh: "月照", en: "Moonlit" },
    placement: "prefix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      expBonus: { min: 2, max: 4 },
      luck: { min: 3, max: 6 },
    },
  },
  {
    id: "venomous",
    name: { zh: "蚀毒", en: "Venomous" },
    placement: "prefix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 4, max: 7 },
      crit: { min: 1, max: 2 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "crystalline",
    name: { zh: "晶护", en: "Crystalline" },
    placement: "prefix",
    allowedSlots: ["helmet", "armor", "accessory"],
    statRanges: {
      defense: { min: 3, max: 6 },
      hp: { min: 10, max: 18 },
      crit: { min: 2, max: 4 },
    },
  },
  {
    id: "abyssal",
    name: { zh: "渊焰", en: "Abyssal" },
    placement: "prefix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 5, max: 8 },
      hp: { min: 12, max: 22 },
      crit: { min: 1, max: 3 },
    },
  },
  {
    id: "of_storms",
    name: { zh: "雷岚", en: "of Storms" },
    placement: "suffix",
    allowedSlots: ["weapon", "boots", "accessory"],
    statRanges: {
      crit: { min: 3, max: 6 },
      goldBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "of_mist",
    name: { zh: "雾踪", en: "of Mist" },
    placement: "suffix",
    allowedSlots: ["helmet", "boots", "accessory"],
    statRanges: {
      luck: { min: 3, max: 5 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "of_rites",
    name: { zh: "祭仪", en: "of Rites" },
    placement: "suffix",
    allowedSlots: ["helmet", "armor", "accessory"],
    statRanges: {
      defense: { min: 2, max: 4 },
      expBonus: { min: 2, max: 4 },
      hp: { min: 12, max: 20 },
    },
  },
  {
    id: "of_crystals",
    name: { zh: "裂晶", en: "of Crystals" },
    placement: "suffix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      defense: { min: 3, max: 6 },
      crit: { min: 1, max: 2 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "of_ruin",
    name: { zh: "残王", en: "of Ruin" },
    placement: "suffix",
    allowedSlots: ["weapon", "armor", "accessory"],
    statRanges: {
      attack: { min: 4, max: 7 },
      crit: { min: 2, max: 4 },
      goldBonus: { min: 1, max: 2 },
    },
  },
];

export const affixMap = new Map(
  affixDefinitions.map((affix) => [affix.id, decorateAffix(affix)]),
);

function inferAffixFamily(affixId: string) {
  if (affixId.startsWith("of_")) {
    return affixId.replace("of_", "");
  }

  return affixId;
}

function inferAffixThemeTags(affix: AffixDefinition) {
  const tags = new Set<string>();

  for (const statKey of Object.keys(affix.statRanges) as StatKey[]) {
    if (statKey === "attack" || statKey === "crit") {
      tags.add("offense");
    }

    if (statKey === "defense" || statKey === "hp") {
      tags.add("defense");
    }

    if (statKey === "luck") {
      tags.add("luck");
    }

    if (statKey === "goldBonus") {
      tags.add("gold");
      tags.add("utility");
    }

    if (statKey === "expBonus") {
      tags.add("exp");
      tags.add("utility");
    }

    if (statKey === "dropBonus") {
      tags.add("drop");
      tags.add("utility");
    }
  }

  if (affix.id.includes("storm")) {
    tags.add("storm");
  }
  if (affix.id.includes("moon") || affix.id.includes("mist") || affix.id.includes("rites")) {
    tags.add("moon");
  }
  if (affix.id.includes("venom")) {
    tags.add("venom");
  }
  if (affix.id.includes("crystal")) {
    tags.add("crystal");
  }
  if (affix.id.includes("abyss") || affix.id.includes("ruin")) {
    tags.add("abyss");
  }

  return Array.from(tags);
}

function inferAffixTier(affix: AffixDefinition): 1 | 2 | 3 {
  if (affix.id.includes("storm") || affix.id.includes("moon") || affix.id.includes("venom") || affix.id.includes("crystal") || affix.id.includes("abyss") || affix.id.includes("mist") || affix.id.includes("rites") || affix.id.includes("ruin")) {
    return 3;
  }

  if (affix.id.includes("flames") || affix.id.includes("focus") || affix.id.includes("wealth") || affix.id.includes("hunt") || affix.id.includes("frozen") || affix.id.includes("ironhide")) {
    return 2;
  }

  return 1;
}

function inferAffixRegionBias(affix: AffixDefinition) {
  if (affix.id.includes("storm")) {
    return ["region_006"];
  }

  if (affix.id.includes("moon") || affix.id.includes("mist") || affix.id.includes("rites")) {
    return ["region_007"];
  }

  if (affix.id.includes("venom")) {
    return ["region_008"];
  }

  if (affix.id.includes("crystal")) {
    return ["region_009"];
  }

  if (affix.id.includes("abyss") || affix.id.includes("ruin")) {
    return ["region_010"];
  }

  return [];
}

function decorateAffix(affix: AffixDefinition): AffixDefinition {
  return {
    ...affix,
    family: affix.family ?? inferAffixFamily(affix.id),
    tier: affix.tier ?? inferAffixTier(affix),
    themeTags: affix.themeTags ?? inferAffixThemeTags(affix),
    regionBias: affix.regionBias ?? inferAffixRegionBias(affix),
    weight: affix.weight ?? 100,
  };
}

export function affixSupportsSlot(
  affix: AffixDefinition,
  slot: ItemSlot,
) {
  if (affix.allowedSlots.includes(slot)) {
    return true;
  }

  if ((slot === "ring" || slot === "amulet") && affix.allowedSlots.includes("accessory")) {
    return true;
  }

  if (slot !== "bracer") {
    return false;
  }

  const statKeys = Object.keys(affix.statRanges) as StatKey[];
  const hasCombatStats = statKeys.some((statKey) =>
    ["attack", "defense", "hp", "crit", "luck"].includes(statKey),
  );

  return hasCombatStats && !affix.allowedSlots.includes("boots");
}

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
