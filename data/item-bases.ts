import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";
import type { ItemSlot, StatKey, StatRange } from "@/lib/game/types";

export type ItemBaseDefinition = {
  id: string;
  name: LocalizedText;
  slot: ItemSlot;
  statRanges: Partial<Record<StatKey, StatRange>>;
};

export const itemBaseDefinitions: ItemBaseDefinition[] = [
  {
    id: "weapon_bamboo_spear",
    name: { zh: "青竹枪", en: "Bamboo Spear" },
    slot: "weapon",
    statRanges: {
      attack: { min: 5, max: 8 },
      luck: { min: 0, max: 1 },
    },
  },
  {
    id: "weapon_ice_hook",
    name: { zh: "寒钩", en: "Ice Hook" },
    slot: "weapon",
    statRanges: {
      attack: { min: 7, max: 10 },
      crit: { min: 1, max: 3 },
    },
  },
  {
    id: "weapon_reed_knife",
    name: { zh: "芦叶短刃", en: "Reed Knife" },
    slot: "weapon",
    statRanges: {
      attack: { min: 4, max: 7 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "weapon_river_trident",
    name: { zh: "巡河叉", en: "River Trident" },
    slot: "weapon",
    statRanges: {
      attack: { min: 6, max: 9 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "weapon_dojo_blade",
    name: { zh: "影纹木刀", en: "Dojo Blade" },
    slot: "weapon",
    statRanges: {
      attack: { min: 8, max: 12 },
      crit: { min: 1, max: 3 },
    },
  },
  {
    id: "weapon_ember_halberd",
    name: { zh: "余烬戟", en: "Ember Halberd" },
    slot: "weapon",
    statRanges: {
      attack: { min: 11, max: 15 },
      goldBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "helmet_training_hood",
    name: { zh: "练习兜帽", en: "Training Hood" },
    slot: "helmet",
    statRanges: {
      defense: { min: 2, max: 4 },
      hp: { min: 8, max: 14 },
    },
  },
  {
    id: "helmet_river_mask",
    name: { zh: "河面具", en: "River Mask" },
    slot: "helmet",
    statRanges: {
      defense: { min: 3, max: 5 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_bamboo_hat",
    name: { zh: "竹编斗笠", en: "Bamboo Hat" },
    slot: "helmet",
    statRanges: {
      defense: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_mine_visor",
    name: { zh: "矿洞护额", en: "Mine Visor" },
    slot: "helmet",
    statRanges: {
      defense: { min: 4, max: 6 },
      hp: { min: 10, max: 16 },
    },
  },
  {
    id: "helmet_dojo_circlet",
    name: { zh: "道场束额", en: "Dojo Circlet" },
    slot: "helmet",
    statRanges: {
      defense: { min: 3, max: 5 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_ember_crest",
    name: { zh: "火羽冠", en: "Ember Crest" },
    slot: "helmet",
    statRanges: {
      defense: { min: 5, max: 7 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "armor_padded_gi",
    name: { zh: "厚棉忍衣", en: "Padded Gi" },
    slot: "armor",
    statRanges: {
      defense: { min: 4, max: 7 },
      hp: { min: 12, max: 20 },
    },
  },
  {
    id: "armor_frost_mail",
    name: { zh: "霜鳞甲", en: "Frost Mail" },
    slot: "armor",
    statRanges: {
      defense: { min: 6, max: 9 },
      hp: { min: 16, max: 24 },
    },
  },
  {
    id: "armor_bamboo_wrap",
    name: { zh: "竹节护衣", en: "Bamboo Wrap" },
    slot: "armor",
    statRanges: {
      defense: { min: 3, max: 6 },
      hp: { min: 10, max: 18 },
    },
  },
  {
    id: "armor_river_vest",
    name: { zh: "河鳞背心", en: "Riverscale Vest" },
    slot: "armor",
    statRanges: {
      defense: { min: 5, max: 8 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "armor_dojo_plate",
    name: { zh: "旧道胴甲", en: "Dojo Plate" },
    slot: "armor",
    statRanges: {
      defense: { min: 6, max: 9 },
      hp: { min: 14, max: 22 },
    },
  },
  {
    id: "armor_ember_plate",
    name: { zh: "余烬重甲", en: "Ember Plate" },
    slot: "armor",
    statRanges: {
      defense: { min: 8, max: 11 },
      goldBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "boots_pathrunner",
    name: { zh: "疾行靴", en: "Pathrunner Boots" },
    slot: "boots",
    statRanges: {
      defense: { min: 2, max: 4 },
      luck: { min: 1, max: 3 },
    },
  },
  {
    id: "boots_snowstep",
    name: { zh: "踏雪屐", en: "Snowstep Sandals" },
    slot: "boots",
    statRanges: {
      defense: { min: 3, max: 5 },
      hp: { min: 6, max: 10 },
    },
  },
  {
    id: "boots_reedstep",
    name: { zh: "芦影履", en: "Reedstep Shoes" },
    slot: "boots",
    statRanges: {
      defense: { min: 2, max: 4 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "boots_river_drift",
    name: { zh: "漂河屐", en: "Riverdrift Sandals" },
    slot: "boots",
    statRanges: {
      defense: { min: 3, max: 5 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "boots_dojo_treads",
    name: { zh: "道纹战履", en: "Dojo Treads" },
    slot: "boots",
    statRanges: {
      defense: { min: 4, max: 6 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "boots_emberstride",
    name: { zh: "烬行靴", en: "Emberstride Boots" },
    slot: "boots",
    statRanges: {
      defense: { min: 4, max: 6 },
      goldBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_bone_charm",
    name: { zh: "骨符", en: "Bone Charm" },
    slot: "accessory",
    statRanges: {
      attack: { min: 1, max: 2 },
      luck: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_ember_bead",
    name: { zh: "余烬珠", en: "Ember Bead" },
    slot: "accessory",
    statRanges: {
      attack: { min: 2, max: 4 },
      goldBonus: { min: 2, max: 5 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_river_whistle",
    name: { zh: "河哨", en: "River Whistle" },
    slot: "accessory",
    statRanges: {
      attack: { min: 1, max: 3 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_dojo_token",
    name: { zh: "道场牌", en: "Dojo Token" },
    slot: "accessory",
    statRanges: {
      crit: { min: 1, max: 3 },
      luck: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_ore_talisman",
    name: { zh: "矿灯符", en: "Ore Talisman" },
    slot: "accessory",
    statRanges: {
      goldBonus: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_crow_plume",
    name: { zh: "鸦羽佩", en: "Crow Plume" },
    slot: "accessory",
    statRanges: {
      attack: { min: 2, max: 4 },
      crit: { min: 1, max: 3 },
      expBonus: { min: 1, max: 2 },
    },
  },
];

export const itemBaseMap = new Map(
  itemBaseDefinitions.map((itemBase) => [itemBase.id, itemBase]),
);

export function getItemBaseName(baseItemId: string, locale: Locale) {
  const itemBase = itemBaseMap.get(baseItemId);

  return itemBase ? pickLocalizedText(locale, itemBase.name) : baseItemId;
}
