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
];

export const affixMap = new Map(
  affixDefinitions.map((affix) => [affix.id, affix]),
);

export function getAffixName(affixId: string, locale: Locale) {
  const affix = affixMap.get(affixId);

  return affix ? pickLocalizedText(locale, affix.name) : affixId;
}
