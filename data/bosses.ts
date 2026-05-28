import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";

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
  },
  {
    id: "boss_ember_crow",
    regionId: "region_005",
    name: { zh: "余烬鸦王", en: "Ember Crow" },
    description: {
      zh: "盘踞余烬峰顶的火羽霸主，会把整片山脊点成红色。",
      en: "The blazing ruler of Ember Peak, leaving the ridge glowing red.",
    },
    power: 920,
    dailyChallengeLimit: 2,
    rewardGold: 380,
    rewardExp: 240,
    rewardMaterials: [{ materialId: "ember_core", amount: 12 }],
    rewardDropTableId: "drops_ember_peak",
    rewardItemCount: 1,
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
