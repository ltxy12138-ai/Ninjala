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
  {
    id: "weapon_storm_glaive",
    name: { zh: "奔雷戈", en: "Storm Glaive" },
    slot: "weapon",
    statRanges: {
      attack: { min: 15, max: 19 },
      crit: { min: 2, max: 4 },
    },
  },
  {
    id: "helmet_mire_crown",
    name: { zh: "泽王冠", en: "Mire Crown" },
    slot: "helmet",
    statRanges: {
      defense: { min: 6, max: 8 },
      crit: { min: 1, max: 3 },
    },
  },
  {
    id: "armor_thunder_wrap",
    name: { zh: "雷纹护缚", en: "Thunder Wrap" },
    slot: "armor",
    statRanges: {
      defense: { min: 9, max: 12 },
      hp: { min: 18, max: 28 },
    },
  },
  {
    id: "boots_bog_treads",
    name: { zh: "沼行战靴", en: "Bog Treads" },
    slot: "boots",
    statRanges: {
      defense: { min: 5, max: 7 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "accessory_storm_plume",
    name: { zh: "雷翎坠", en: "Storm Plume Talisman" },
    slot: "accessory",
    statRanges: {
      crit: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 3 },
      attack: { min: 2, max: 3 },
    },
  },
  {
    id: "weapon_moon_katana",
    name: { zh: "月纹太刀", en: "Moon Katana" },
    slot: "weapon",
    statRanges: {
      attack: { min: 18, max: 22 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "helmet_shrine_veil",
    name: { zh: "神社薄纱", en: "Shrine Veil" },
    slot: "helmet",
    statRanges: {
      defense: { min: 7, max: 9 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "armor_lunar_robe",
    name: { zh: "月祈长衣", en: "Lunar Robe" },
    slot: "armor",
    statRanges: {
      defense: { min: 10, max: 13 },
      hp: { min: 22, max: 32 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "boots_moonstep",
    name: { zh: "踏月履", en: "Moonstep Sandals" },
    slot: "boots",
    statRanges: {
      defense: { min: 6, max: 8 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_moon_amber",
    name: { zh: "月珀铃", en: "Moon Amber Bell" },
    slot: "accessory",
    statRanges: {
      expBonus: { min: 2, max: 4 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "weapon_venom_fang",
    name: { zh: "蚀牙双刃", en: "Venom Fang Blades" },
    slot: "weapon",
    statRanges: {
      attack: { min: 22, max: 27 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "helmet_mist_goggles",
    name: { zh: "雾猎目镜", en: "Mist Goggles" },
    slot: "helmet",
    statRanges: {
      defense: { min: 8, max: 10 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "armor_toxic_harness",
    name: { zh: "毒蚀束甲", en: "Toxic Harness" },
    slot: "armor",
    statRanges: {
      defense: { min: 11, max: 14 },
      hp: { min: 24, max: 36 },
      attack: { min: 2, max: 4 },
    },
  },
  {
    id: "boots_fogskippers",
    name: { zh: "越雾靴", en: "Fogskippers" },
    slot: "boots",
    statRanges: {
      defense: { min: 7, max: 9 },
      luck: { min: 2, max: 5 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_venom_sac",
    name: { zh: "毒囊佩", en: "Venom Sac Charm" },
    slot: "accessory",
    statRanges: {
      attack: { min: 3, max: 5 },
      dropBonus: { min: 1, max: 3 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "weapon_crystal_lance",
    name: { zh: "裂晶枪", en: "Crystal Lance" },
    slot: "weapon",
    statRanges: {
      attack: { min: 27, max: 32 },
      crit: { min: 2, max: 4 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_star_visor",
    name: { zh: "星镜护额", en: "Star Visor" },
    slot: "helmet",
    statRanges: {
      defense: { min: 9, max: 11 },
      crit: { min: 1, max: 3 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "armor_rift_mail",
    name: { zh: "裂谷晶甲", en: "Rift Mail" },
    slot: "armor",
    statRanges: {
      defense: { min: 13, max: 16 },
      hp: { min: 30, max: 42 },
    },
  },
  {
    id: "boots_shardwalkers",
    name: { zh: "碎星行靴", en: "Shardwalkers" },
    slot: "boots",
    statRanges: {
      defense: { min: 8, max: 10 },
      crit: { min: 1, max: 3 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_star_shard",
    name: { zh: "星晶针", en: "Star Shard Pin" },
    slot: "accessory",
    statRanges: {
      crit: { min: 2, max: 4 },
      expBonus: { min: 2, max: 4 },
    },
  },
  {
    id: "weapon_abyss_blade",
    name: { zh: "渊火王刃", en: "Abyssfire Blade" },
    slot: "weapon",
    statRanges: {
      attack: { min: 33, max: 39 },
      crit: { min: 2, max: 5 },
      goldBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_bastion_crown",
    name: { zh: "王城冕盔", en: "Bastion Crown" },
    slot: "helmet",
    statRanges: {
      defense: { min: 10, max: 13 },
      hp: { min: 18, max: 28 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "armor_abyss_plate",
    name: { zh: "渊火重铠", en: "Abyss Plate" },
    slot: "armor",
    statRanges: {
      defense: { min: 15, max: 19 },
      hp: { min: 36, max: 50 },
      goldBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "boots_cinder_march",
    name: { zh: "烬踏战靴", en: "Cinder March Boots" },
    slot: "boots",
    statRanges: {
      defense: { min: 9, max: 12 },
      luck: { min: 2, max: 4 },
      goldBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_abyss_sigil",
    name: { zh: "渊火印", en: "Abyss Sigil" },
    slot: "accessory",
    statRanges: {
      attack: { min: 4, max: 6 },
      crit: { min: 2, max: 4 },
      goldBonus: { min: 2, max: 4 },
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
