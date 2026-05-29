import { pickLocalizedText, type Locale, type LocalizedText } from "@/lib/i18n";

export type WorldBossRewardMaterial = {
  materialId: string;
  amount: number;
};

export type WorldBossDefinition = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  maxHp: number;
  dailyAttackLimit: number;
  rewardGold: number;
  rewardExp: number;
  rewardMaterials: WorldBossRewardMaterial[];
};

export const worldBossDefinitions: WorldBossDefinition[] = [
  {
    id: "world_boss_glacier_tortoise",
    name: { zh: "寒甲巨龟", en: "Glacier Tortoise" },
    description: {
      zh: "背甲像整块冰壁一样厚，只有连续围攻才能把它逼退。",
      en: "Its shell is as thick as a frozen cliff and only sustained group pressure can bring it down.",
    },
    maxHp: 2400,
    dailyAttackLimit: 3,
    rewardGold: 180,
    rewardExp: 90,
    rewardMaterials: [{ materialId: "frost_scale", amount: 10 }],
  },
  {
    id: "world_boss_storm_koi",
    name: { zh: "雷鳍锦鲤王", en: "Storm Koi Sovereign" },
    description: {
      zh: "每次摆尾都会带出电光水幕，是村里公认最难缠的水域霸主。",
      en: "Every tail sweep kicks up a wall of electrified water, making it the river's most troublesome overlord.",
    },
    maxHp: 2800,
    dailyAttackLimit: 3,
    rewardGold: 220,
    rewardExp: 120,
    rewardMaterials: [
      { materialId: "frost_scale", amount: 6 },
      { materialId: "river_stone", amount: 6 },
    ],
  },
  {
    id: "world_boss_ember_colossus",
    name: { zh: "熔羽巨像", en: "Ember Colossus" },
    description: {
      zh: "它从火山口缓慢起身时，整条山脊都会被映成橙红色。",
      en: "When it rises from the crater, the whole ridge glows orange-red beneath it.",
    },
    maxHp: 3200,
    dailyAttackLimit: 3,
    rewardGold: 260,
    rewardExp: 150,
    rewardMaterials: [
      { materialId: "ember_core", amount: 6 },
      { materialId: "iron_ore", amount: 8 },
    ],
  },
];

export function getWorldBossName(
  boss: WorldBossDefinition,
  locale: Locale,
) {
  return pickLocalizedText(locale, boss.name);
}

export function getWorldBossDescription(
  boss: WorldBossDefinition,
  locale: Locale,
) {
  return pickLocalizedText(locale, boss.description);
}
