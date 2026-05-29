import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";
import type { ItemRarity, ItemSlot } from "@/lib/game/types";

export type BossRewardMaterial = {
  materialId: string;
  amount: number;
};

export type BossDefinition = {
  id: string;
  regionId: string;
  name: LocalizedText;
  description: LocalizedText;
  power: number;
  dailyChallengeLimit: number;
  rewardGold: number;
  rewardExp: number;
  rewardMaterials: BossRewardMaterial[];
  rewardDropTableId: string;
  rewardItemCount: number;
  firstClearRewardSlot?: ItemSlot;
  firstClearRewardMinRarity?: ItemRarity;
};

export const bossDefinitions: BossDefinition[] = [
  {
    id: "boss_bamboo_wolf",
    regionId: "region_001",
    name: { zh: "竹林恶狼", en: "Bamboo Wolf" },
    description: {
      zh: "它在竹林边缘徘徊，专门袭击刚入村的新人。",
      en: "A restless wolf that stalks the edge of the beginner grove.",
    },
    power: 55,
    dailyChallengeLimit: 2,
    rewardGold: 60,
    rewardExp: 35,
    rewardMaterials: [{ materialId: "bamboo_shoot", amount: 6 }],
    rewardDropTableId: "drops_bamboo_grove",
    rewardItemCount: 1,
    firstClearRewardSlot: "amulet",
    firstClearRewardMinRarity: "rare",
  },
  {
    id: "boss_icefish_king",
    regionId: "region_002",
    name: { zh: "冰鱼王", en: "Icefish King" },
    description: {
      zh: "统治整条冰鱼河的巨鱼王，寒气逼人。",
      en: "The giant fish ruler of Icefish River, surrounded by freezing mist.",
    },
    power: 130,
    dailyChallengeLimit: 2,
    rewardGold: 100,
    rewardExp: 65,
    rewardMaterials: [{ materialId: "frost_scale", amount: 8 }],
    rewardDropTableId: "drops_icefish_river",
    rewardItemCount: 1,
    firstClearRewardSlot: "ring",
    firstClearRewardMinRarity: "rare",
  },
  {
    id: "boss_dojo_puppet",
    regionId: "region_003",
    name: { zh: "道场傀儡", en: "Dojo Puppet" },
    description: {
      zh: "废弃道场留下的自动战斗机关，招式依旧精准。",
      en: "An abandoned training automaton whose movements are still precise.",
    },
    power: 330,
    dailyChallengeLimit: 2,
    rewardGold: 170,
    rewardExp: 105,
    rewardMaterials: [{ materialId: "iron_ore", amount: 10 }],
    rewardDropTableId: "drops_abandoned_dojo",
    rewardItemCount: 1,
    firstClearRewardSlot: "bracer",
    firstClearRewardMinRarity: "epic",
  },
  {
    id: "boss_frost_yeti",
    regionId: "region_004",
    name: { zh: "雪洞巨猿", en: "Frost Yeti" },
    description: {
      zh: "盘踞雪山矿洞的巨猿，力量足以震落整片矿壁。",
      en: "A hulking beast in the snow mine strong enough to shake ore from the walls.",
    },
    power: 650,
    dailyChallengeLimit: 2,
    rewardGold: 260,
    rewardExp: 170,
    rewardMaterials: [{ materialId: "iron_ore", amount: 14 }],
    rewardDropTableId: "drops_snow_mine",
    rewardItemCount: 1,
    firstClearRewardSlot: "amulet",
    firstClearRewardMinRarity: "epic",
  },
  {
    id: "boss_ember_crow",
    regionId: "region_005",
    name: { zh: "余烬鸦王", en: "Ember Crow" },
    description: {
      zh: "盘踞余烬峰顶的火羽霸主，会把整片山脊点成红色。",
      en: "The blazing ruler of Ember Peak, leaving the ridge glowing red.",
    },
    power: 840,
    dailyChallengeLimit: 2,
    rewardGold: 380,
    rewardExp: 240,
    rewardMaterials: [{ materialId: "ember_core", amount: 12 }],
    rewardDropTableId: "drops_ember_peak",
    rewardItemCount: 1,
    firstClearRewardSlot: "ring",
    firstClearRewardMinRarity: "epic",
  },
  {
    id: "boss_storm_croc",
    regionId: "region_006",
    name: { zh: "雷泽鳄王", en: "Storm Crocodile" },
    description: {
      zh: "栖在雷沼中心的巨鳄，每次翻身都能掀起带电泥浪。",
      en: "A thunder-fed giant crocodile that turns the marsh itself into a weapon.",
    },
    power: 1050,
    dailyChallengeLimit: 2,
    rewardGold: 520,
    rewardExp: 310,
    rewardMaterials: [{ materialId: "storm_plume", amount: 14 }],
    rewardDropTableId: "drops_stormfen_marsh",
    rewardItemCount: 1,
    firstClearRewardSlot: "bracer",
    firstClearRewardMinRarity: "epic",
  },
  {
    id: "boss_moon_guardian",
    regionId: "region_007",
    name: { zh: "月守石像", en: "Moon Guardian" },
    description: {
      zh: "古老神社留下的守卫石像，在月光下会短暂苏醒并巡视全境。",
      en: "An ancient shrine sentinel that wakes fully under moonlight.",
    },
    power: 1300,
    dailyChallengeLimit: 2,
    rewardGold: 700,
    rewardExp: 430,
    rewardMaterials: [{ materialId: "moon_amber", amount: 16 }],
    rewardDropTableId: "drops_moonshadow_shrine",
    rewardItemCount: 1,
    firstClearRewardSlot: "amulet",
    firstClearRewardMinRarity: "legendary",
  },
  {
    id: "boss_venom_mantis",
    regionId: "region_008",
    name: { zh: "蚀毒螳王", en: "Venom Mantis" },
    description: {
      zh: "盘踞毒林深处的螳王，出手极快，毒刃总是从视野边缘袭来。",
      en: "A razor-fast mantis lord whose poison blades strike from the misted edge.",
    },
    power: 1600,
    dailyChallengeLimit: 2,
    rewardGold: 920,
    rewardExp: 560,
    rewardMaterials: [{ materialId: "venom_sac", amount: 18 }],
    rewardDropTableId: "drops_venom_mistwood",
    rewardItemCount: 1,
    firstClearRewardSlot: "ring",
    firstClearRewardMinRarity: "legendary",
  },
  {
    id: "boss_crystal_drake",
    regionId: "region_009",
    name: { zh: "裂晶飞龙", en: "Crystal Drake" },
    description: {
      zh: "飞掠裂谷上空的晶龙会把碎晶风暴压向地面，逼迫对手硬吃冲击。",
      en: "A crystal drake that drives shard storms down into the rift below.",
    },
    power: 1950,
    dailyChallengeLimit: 2,
    rewardGold: 1220,
    rewardExp: 760,
    rewardMaterials: [{ materialId: "star_shard", amount: 20 }],
    rewardDropTableId: "drops_starcrystal_rift",
    rewardItemCount: 1,
    firstClearRewardSlot: "bracer",
    firstClearRewardMinRarity: "legendary",
  },
  {
    id: "boss_abyss_lion",
    regionId: "region_010",
    name: { zh: "渊火狮王", en: "Abyssfire Lion" },
    description: {
      zh: "王城遗迹的终段守门者，吐息灼热而沉重，几乎不给人喘息机会。",
      en: "The final gatekeeper of the ruined bastion, relentless and ablaze with crushing force.",
    },
    power: 2400,
    dailyChallengeLimit: 2,
    rewardGold: 1600,
    rewardExp: 980,
    rewardMaterials: [{ materialId: "abyss_steel", amount: 24 }],
    rewardDropTableId: "drops_abyssfire_bastion",
    rewardItemCount: 2,
    firstClearRewardSlot: "amulet",
    firstClearRewardMinRarity: "legendary",
  },
];

export const bossMap = new Map(
  bossDefinitions.map((boss) => [boss.id, boss]),
);

export function getBossName(boss: BossDefinition, locale: Locale) {
  return pickLocalizedText(locale, boss.name);
}

export function getBossDescription(boss: BossDefinition, locale: Locale) {
  return pickLocalizedText(locale, boss.description);
}
