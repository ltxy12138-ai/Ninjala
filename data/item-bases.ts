import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";
import type { ItemSlot, StatKey, StatRange } from "@/lib/game/types";

export type ItemBaseDefinition = {
  id: string;
  name: LocalizedText;
  slot: ItemSlot;
  statRanges: Partial<Record<StatKey, StatRange>>;
  family?: string;
  familyName?: LocalizedText;
  themeTags?: string[];
  allowedRegionIds?: string[];
  weight?: number;
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
    id: "weapon_frost_pick",
    name: { zh: "冰矿镐", en: "Frost Pick" },
    slot: "weapon",
    statRanges: {
      attack: { min: 10, max: 14 },
      hp: { min: 4, max: 8 },
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
    id: "bracer_bamboo_wrapguard",
    name: { zh: "青藤护腕", en: "Vinewrap Bracers" },
    slot: "bracer",
    statRanges: {
      defense: { min: 2, max: 4 },
      hp: { min: 6, max: 10 },
    },
  },
  {
    id: "bracer_river_bindings",
    name: { zh: "河鳞臂缚", en: "Riverscale Bindings" },
    slot: "bracer",
    statRanges: {
      defense: { min: 3, max: 5 },
      luck: { min: 1, max: 2 },
    },
  },
  {
    id: "bracer_dojo_wraps",
    name: { zh: "道练护臂", en: "Dojo Wraps" },
    slot: "bracer",
    statRanges: {
      attack: { min: 1, max: 3 },
      defense: { min: 2, max: 4 },
    },
  },
  {
    id: "bracer_mine_manacles",
    name: { zh: "矿纹护腕", en: "Minebound Manacles" },
    slot: "bracer",
    statRanges: {
      defense: { min: 4, max: 6 },
      hp: { min: 8, max: 14 },
    },
  },
  {
    id: "bracer_ember_cuffs",
    name: { zh: "烬火护腕", en: "Ember Cuffs" },
    slot: "bracer",
    statRanges: {
      attack: { min: 2, max: 4 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_bone_charm",
    name: { zh: "骨符", en: "Bone Charm" },
    slot: "ring",
    statRanges: {
      attack: { min: 1, max: 2 },
      luck: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_ember_bead",
    name: { zh: "余烬珠", en: "Ember Bead" },
    slot: "amulet",
    statRanges: {
      attack: { min: 2, max: 4 },
      goldBonus: { min: 2, max: 5 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_river_whistle",
    name: { zh: "河哨", en: "River Whistle" },
    slot: "amulet",
    statRanges: {
      attack: { min: 1, max: 3 },
      expBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_dojo_token",
    name: { zh: "道场牌", en: "Dojo Token" },
    slot: "ring",
    statRanges: {
      crit: { min: 1, max: 3 },
      luck: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_ore_talisman",
    name: { zh: "矿灯符", en: "Ore Talisman" },
    slot: "amulet",
    statRanges: {
      goldBonus: { min: 2, max: 4 },
      dropBonus: { min: 1, max: 3 },
    },
  },
  {
    id: "accessory_crow_plume",
    name: { zh: "鸦羽佩", en: "Crow Plume" },
    slot: "ring",
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
      attack: { min: 18, max: 23 },
      crit: { min: 3, max: 5 },
    },
  },
  {
    id: "helmet_mire_crown",
    name: { zh: "泽王冠", en: "Mire Crown" },
    slot: "helmet",
    statRanges: {
      defense: { min: 8, max: 11 },
      hp: { min: 8, max: 14 },
      crit: { min: 2, max: 4 },
    },
  },
  {
    id: "armor_thunder_wrap",
    name: { zh: "雷纹护缚", en: "Thunder Wrap" },
    slot: "armor",
    statRanges: {
      defense: { min: 12, max: 16 },
      hp: { min: 26, max: 38 },
      attack: { min: 2, max: 4 },
    },
  },
  {
    id: "boots_bog_treads",
    name: { zh: "沼行战靴", en: "Bog Treads" },
    slot: "boots",
    statRanges: {
      defense: { min: 6, max: 9 },
      luck: { min: 3, max: 5 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_storm_plume",
    name: { zh: "雷翎坠", en: "Storm Plume Talisman" },
    slot: "ring",
    statRanges: {
      crit: { min: 3, max: 5 },
      attack: { min: 4, max: 6 },
      luck: { min: 1, max: 2 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "weapon_moon_katana",
    name: { zh: "月纹太刀", en: "Moon Katana" },
    slot: "weapon",
    statRanges: {
      attack: { min: 22, max: 27 },
      crit: { min: 1, max: 3 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_shrine_veil",
    name: { zh: "神社薄纱", en: "Shrine Veil" },
    slot: "helmet",
    statRanges: {
      defense: { min: 9, max: 12 },
      hp: { min: 10, max: 18 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "armor_lunar_robe",
    name: { zh: "月祈长衣", en: "Lunar Robe" },
    slot: "armor",
    statRanges: {
      defense: { min: 13, max: 17 },
      hp: { min: 30, max: 44 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "boots_moonstep",
    name: { zh: "踏月履", en: "Moonstep Sandals" },
    slot: "boots",
    statRanges: {
      defense: { min: 7, max: 10 },
      luck: { min: 2, max: 4 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_moon_amber",
    name: { zh: "月珀铃", en: "Moon Amber Bell" },
    slot: "amulet",
    statRanges: {
      attack: { min: 2, max: 4 },
      expBonus: { min: 2, max: 4 },
      luck: { min: 3, max: 5 },
    },
  },
  {
    id: "weapon_venom_fang",
    name: { zh: "蚀牙双刃", en: "Venom Fang Blades" },
    slot: "weapon",
    statRanges: {
      attack: { min: 27, max: 33 },
      crit: { min: 1, max: 3 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_mist_goggles",
    name: { zh: "雾猎目镜", en: "Mist Goggles" },
    slot: "helmet",
    statRanges: {
      defense: { min: 10, max: 13 },
      crit: { min: 1, max: 2 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "armor_toxic_harness",
    name: { zh: "毒蚀束甲", en: "Toxic Harness" },
    slot: "armor",
    statRanges: {
      defense: { min: 15, max: 19 },
      hp: { min: 34, max: 48 },
      attack: { min: 4, max: 6 },
    },
  },
  {
    id: "boots_fogskippers",
    name: { zh: "越雾靴", en: "Fogskippers" },
    slot: "boots",
    statRanges: {
      defense: { min: 8, max: 11 },
      luck: { min: 3, max: 6 },
      crit: { min: 1, max: 2 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_venom_sac",
    name: { zh: "毒囊佩", en: "Venom Sac Charm" },
    slot: "ring",
    statRanges: {
      attack: { min: 5, max: 8 },
      dropBonus: { min: 1, max: 3 },
      crit: { min: 2, max: 4 },
    },
  },
  {
    id: "weapon_crystal_lance",
    name: { zh: "裂晶枪", en: "Crystal Lance" },
    slot: "weapon",
    statRanges: {
      attack: { min: 34, max: 40 },
      crit: { min: 4, max: 6 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_star_visor",
    name: { zh: "星镜护额", en: "Star Visor" },
    slot: "helmet",
    statRanges: {
      defense: { min: 12, max: 15 },
      crit: { min: 3, max: 5 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "armor_rift_mail",
    name: { zh: "裂谷晶甲", en: "Rift Mail" },
    slot: "armor",
    statRanges: {
      defense: { min: 18, max: 23 },
      hp: { min: 42, max: 58 },
      crit: { min: 1, max: 3 },
    },
  },
  {
    id: "boots_shardwalkers",
    name: { zh: "碎星行靴", en: "Shardwalkers" },
    slot: "boots",
    statRanges: {
      defense: { min: 10, max: 13 },
      crit: { min: 2, max: 4 },
      luck: { min: 1, max: 3 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_star_shard",
    name: { zh: "星晶针", en: "Star Shard Pin" },
    slot: "ring",
    statRanges: {
      attack: { min: 3, max: 5 },
      crit: { min: 4, max: 6 },
      expBonus: { min: 2, max: 4 },
    },
  },
  {
    id: "weapon_abyss_blade",
    name: { zh: "渊火王刃", en: "Abyssfire Blade" },
    slot: "weapon",
    statRanges: {
      attack: { min: 42, max: 50 },
      crit: { min: 5, max: 8 },
      goldBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "helmet_bastion_crown",
    name: { zh: "王城冕盔", en: "Bastion Crown" },
    slot: "helmet",
    statRanges: {
      defense: { min: 14, max: 18 },
      hp: { min: 30, max: 42 },
      crit: { min: 2, max: 4 },
    },
  },
  {
    id: "armor_abyss_plate",
    name: { zh: "渊火重铠", en: "Abyss Plate" },
    slot: "armor",
    statRanges: {
      defense: { min: 22, max: 28 },
      hp: { min: 58, max: 78 },
      attack: { min: 3, max: 5 },
      goldBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "boots_cinder_march",
    name: { zh: "烬踏战靴", en: "Cinder March Boots" },
    slot: "boots",
    statRanges: {
      defense: { min: 11, max: 14 },
      luck: { min: 3, max: 5 },
      crit: { min: 2, max: 3 },
      goldBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "accessory_abyss_sigil",
    name: { zh: "渊火印", en: "Abyss Sigil" },
    slot: "amulet",
    statRanges: {
      attack: { min: 7, max: 10 },
      crit: { min: 4, max: 6 },
      luck: { min: 1, max: 2 },
      goldBonus: { min: 2, max: 3 },
    },
  },
  {
    id: "bracer_storm_braces",
    name: { zh: "雷纹护臂", en: "Storm Braces" },
    slot: "bracer",
    statRanges: {
      attack: { min: 3, max: 5 },
      defense: { min: 5, max: 8 },
      crit: { min: 1, max: 2 },
    },
  },
  {
    id: "bracer_moon_bindings",
    name: { zh: "月祈缚手", en: "Moonlit Bindings" },
    slot: "bracer",
    statRanges: {
      defense: { min: 6, max: 9 },
      expBonus: { min: 1, max: 2 },
      luck: { min: 2, max: 4 },
    },
  },
  {
    id: "bracer_venom_grips",
    name: { zh: "毒刺握缚", en: "Venom Grips" },
    slot: "bracer",
    statRanges: {
      attack: { min: 4, max: 6 },
      defense: { min: 6, max: 9 },
      dropBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "bracer_crystal_guards",
    name: { zh: "星晶护臂", en: "Crystal Guards" },
    slot: "bracer",
    statRanges: {
      defense: { min: 8, max: 11 },
      crit: { min: 2, max: 4 },
      expBonus: { min: 1, max: 2 },
    },
  },
  {
    id: "bracer_abyss_manacles",
    name: { zh: "渊焰臂甲", en: "Abyss Manacles" },
    slot: "bracer",
    statRanges: {
      attack: { min: 5, max: 7 },
      defense: { min: 10, max: 13 },
      goldBonus: { min: 1, max: 2 },
    },
  },
];

const familyLabels = {
  bamboo: { zh: "竹巡系", en: "Bamboo Scout Line" },
  river: { zh: "河猎系", en: "River Hunter Line" },
  dojo: { zh: "道场系", en: "Dojo Line" },
  mine: { zh: "矿守系", en: "Mine Warden Line" },
  ember: { zh: "余烬系", en: "Ember Line" },
  storm: { zh: "雷沼系", en: "Stormfen Line" },
  moon: { zh: "月社系", en: "Moonshadow Line" },
  venom: { zh: "毒林系", en: "Venomwood Line" },
  crystal: { zh: "裂晶系", en: "Starcrystal Line" },
  abyss: { zh: "渊焰系", en: "Abyssfire Line" },
} satisfies Record<string, LocalizedText>;

type RegionFamily = keyof typeof familyLabels;

const familyRegionIds = {
  bamboo: ["region_001"],
  river: ["region_001", "region_002"],
  dojo: ["region_002", "region_003"],
  mine: ["region_003", "region_004"],
  ember: ["region_004", "region_005"],
  storm: ["region_006"],
  moon: ["region_007"],
  venom: ["region_008"],
  crystal: ["region_009"],
  abyss: ["region_010"],
} satisfies Record<RegionFamily, string[]>;

function inferItemFamily(itemBaseId: string): RegionFamily {
  if (itemBaseId.includes("abyss")) {
    return "abyss";
  }

  if (itemBaseId.includes("crystal") || itemBaseId.includes("star") || itemBaseId.includes("rift")) {
    return "crystal";
  }

  if (itemBaseId.includes("venom") || itemBaseId.includes("mist") || itemBaseId.includes("toxic") || itemBaseId.includes("fog")) {
    return "venom";
  }

  if (itemBaseId.includes("moon") || itemBaseId.includes("shrine") || itemBaseId.includes("lunar")) {
    return "moon";
  }

  if (itemBaseId.includes("storm") || itemBaseId.includes("mire") || itemBaseId.includes("bog") || itemBaseId.includes("thunder")) {
    return "storm";
  }

  if (itemBaseId.includes("ember") || itemBaseId.includes("crow") || itemBaseId.includes("cinder")) {
    return "ember";
  }

  if (itemBaseId.includes("mine") || itemBaseId.includes("ore") || itemBaseId.includes("frost") || itemBaseId.includes("snow")) {
    return "mine";
  }

  if (itemBaseId.includes("dojo")) {
    return "dojo";
  }

  if (itemBaseId.includes("river") || itemBaseId.includes("ice") || itemBaseId.includes("whistle")) {
    return "river";
  }

  return "bamboo";
}

function inferThemeTags(itemBase: ItemBaseDefinition) {
  const family = inferItemFamily(itemBase.id);
  const tags = new Set<string>([family]);

  if (itemBase.slot === "weapon") {
    tags.add("offense");
  }

  if (itemBase.slot === "helmet" || itemBase.slot === "armor" || itemBase.slot === "bracer") {
    tags.add("defense");
  }

  if (itemBase.slot === "boots") {
    tags.add("tempo");
  }

  if (itemBase.slot === "ring") {
    tags.add("burst");
  }

  if (itemBase.slot === "amulet") {
    tags.add("utility");
  }

  for (const statKey of Object.keys(itemBase.statRanges) as StatKey[]) {
    if (statKey === "attack" || statKey === "crit") {
      tags.add("offense");
    }

    if (statKey === "defense" || statKey === "hp") {
      tags.add("defense");
    }

    if (statKey === "luck") {
      tags.add("luck");
    }

    if (statKey === "goldBonus" || statKey === "expBonus" || statKey === "dropBonus") {
      tags.add("utility");
    }
  }

  return Array.from(tags);
}

function decorateItemBase(itemBase: ItemBaseDefinition): ItemBaseDefinition {
  const family = (itemBase.family as RegionFamily | undefined) ?? inferItemFamily(itemBase.id);

  return {
    ...itemBase,
    family,
    familyName: itemBase.familyName ?? familyLabels[family],
    themeTags: itemBase.themeTags ?? inferThemeTags(itemBase),
    allowedRegionIds: itemBase.allowedRegionIds ?? familyRegionIds[family],
    weight: itemBase.weight ?? 100,
  };
}

export const decoratedItemBaseDefinitions = itemBaseDefinitions.map(decorateItemBase);

export const itemBaseMap = new Map(
  decoratedItemBaseDefinitions.map((itemBase) => [itemBase.id, itemBase]),
);

const statFocusLabels = {
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

function joinFocusLabels(labels: string[], locale: Locale) {
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

function getBaseItemPlaystyle(statKeys: StatKey[], locale: Locale) {
  const keySet = new Set(statKeys);
  const hasResource = keySet.has("goldBonus") || keySet.has("expBonus") || keySet.has("dropBonus");
  const hasOffense = keySet.has("attack") || keySet.has("crit");
  const hasDefense = keySet.has("defense") || keySet.has("hp");
  const hasLuck = keySet.has("luck");

  if (hasResource && hasOffense) {
    return locale === "zh"
      ? "兼顾刷图收益与主线推进"
      : "It balances farming value with forward progression.";
  }

  if (hasResource) {
    return locale === "zh"
      ? "更适合挂机、刷图和长线养成"
      : "It leans toward idle farming and long-term growth.";
  }

  if (hasOffense && !hasDefense) {
    return locale === "zh"
      ? "更适合推进主线和挑战 Boss"
      : "It is best suited for pushing story gates and bosses.";
  }

  if (hasDefense && !hasOffense) {
    return locale === "zh"
      ? "更适合稳住战线和硬吃压力"
      : "It is built for steadier survivability under pressure.";
  }

  if (hasLuck) {
    return locale === "zh"
      ? "适合补足过渡期的灵活度"
      : "It is a flexible piece for smoothing out transition builds.";
  }

  return locale === "zh"
    ? "适合补齐当前配装的基础短板"
    : "It helps patch the basic gaps in a build.";
}

function getBaseItemSlotLead(slot: ItemSlot, locale: Locale) {
  if (locale === "zh") {
    switch (slot) {
      case "weapon":
        return "这是一件偏主动推进的武器";
      case "helmet":
        return "这是一件用来稳住前排的头部装备";
      case "armor":
        return "这是一件负责扛线的护甲";
      case "boots":
        return "这是一件用来补节奏的靴子";
      case "bracer":
        return "这是一件用来补强攻防节奏的护腕";
      case "amulet":
        return "这是一件偏向收益与路线身份的项链";
      case "ring":
        return "这是一件负责补足爆发与细节的戒指";
    }
  }

  switch (slot) {
    case "weapon":
      return "This weapon is meant to drive your pushes";
    case "helmet":
      return "This headpiece is meant to steady the front line";
    case "armor":
      return "This armor is meant to anchor your build";
    case "boots":
      return "These boots are meant to smooth out your tempo";
    case "bracer":
      return "These bracers are meant to tighten your combat rhythm";
    case "amulet":
      return "This amulet is meant to carry identity and utility";
    case "ring":
      return "This ring is meant to sharpen burst and finishing detail";
  }
}

export function getItemBaseName(baseItemId: string, locale: Locale) {
  const itemBase = itemBaseMap.get(baseItemId);

  return itemBase ? pickLocalizedText(locale, itemBase.name) : baseItemId;
}

export function getItemBaseDescription(baseItemId: string, locale: Locale) {
  const itemBase = itemBaseMap.get(baseItemId);

  if (!itemBase) {
    return baseItemId;
  }

  const activeStatKeys = (Object.keys(itemBase.statRanges) as StatKey[]).filter(
    (statKey) => itemBase.statRanges[statKey],
  );
  const focus = joinFocusLabels(
    activeStatKeys.map((statKey) => statFocusLabels[locale][statKey]),
    locale,
  );
  const playstyle = getBaseItemPlaystyle(activeStatKeys, locale);
  const lead = getBaseItemSlotLead(itemBase.slot, locale);

  if (locale === "zh") {
    return `${lead}，主要强化${focus}，${playstyle}。`;
  }

  return `${lead}, with a focus on ${focus}. ${playstyle}`;
}
