import { bossDefinitions } from "../../data/bosses";
import { dropTableDefinitions } from "../../data/drop-tables";
import { regionDefinitions } from "../../data/regions";
import { dailyBlessingReward } from "../../lib/game/blessing";
import {
  canAffordIngredients,
  getForgePreview,
} from "../../lib/game/crafting";
import { calculateBossCombatWinChance } from "../../lib/game/boss";
import {
  applyExpBonus,
  applyGoldBonus,
  coerceRewardEffectStats,
  scaleDropRollCount,
} from "../../lib/game/effects";
import {
  applyEnhancementStats,
  getEnhancementPreview,
} from "../../lib/game/enhancement";
import {
  calculatePowerFromEquippedItems,
  chooseBestItemsBySlot,
} from "../../lib/game/equipment";
import { calculateIdleRewards } from "../../lib/game/idle";
import {
  generateEquipmentDropForSlot,
  generateEquipmentDrop,
  generateRegionDrops,
  type GeneratedEquipment,
} from "../../lib/game/loot";
import { calculatePower } from "../../lib/game/power";
import {
  getHighestUnlockedRegionId,
  normalizeUnlockedRegionIds,
} from "../../lib/game/progression";
import { getRegionById, isRegionAccessible } from "../../lib/game/regions";
import {
  calculateWorldBossDamage,
  formatWorldBossDay,
  getWorldBossForDay,
} from "../../lib/game/world-boss";
import {
  itemRarities,
  itemSlots,
  type EquipmentStats,
  type ItemRarity,
  type ItemSlot,
} from "../../lib/game/types";

const forgePriority: ItemSlot[] = [
  "weapon",
  "ring",
  "amulet",
  "bracer",
  "armor",
  "boots",
  "helmet",
];

export type SimulationOptions = {
  playerCount?: number;
  days: number;
  claimsPerDay?: number;
  seed?: number;
  locale?: "zh" | "en";
};

type SimItem = EquipmentStats & {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  affixIds: string[];
  baseItemId: string;
  sourceRegionId: string;
  enhancementLevel: number;
  equippedAt: Date | null;
  equipSlotIndex: number | null;
};

type SimPlayer = {
  id: string;
  name: string;
  gold: number;
  exp: number;
  power: number;
  currentRegionId: string;
  unlockedRegionIds: string[];
  materials: Map<string, number>;
  items: SimItem[];
  rarityCounts: Record<ItemRarity, number>;
  idleClaims: number;
  bossWins: number;
  blessingsSent: number;
  blessingsReceived: number;
  worldBossRewards: number;
  worldBossFinalBlows: number;
  dailyBossAttempts: number;
};

export type SimulationSnapshot = {
  day: number;
  averagePower: number;
  averageGold: number;
  averageExp: number;
  finalRegionPlayers: number;
  highestRegions: Record<string, number>;
};

export type SimulationResult = {
  players: SimPlayer[];
  dailySnapshots: SimulationSnapshot[];
  claimsPerDay: number;
  seed: number;
};

function createRarityCounts() {
  return Object.fromEntries(
    itemRarities.map((rarity) => [rarity, 0]),
  ) as Record<ItemRarity, number>;
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return function seededRandom() {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), value | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function addMaterial(
  materialMap: Map<string, number>,
  materialId: string,
  amount: number,
) {
  materialMap.set(materialId, (materialMap.get(materialId) ?? 0) + amount);
}

function createItem(
  id: string,
  item: GeneratedEquipment,
  sourceRegionId: string,
): SimItem {
  return {
    id,
    name: item.name,
    slot: item.slot,
    rarity: item.rarity,
    affixIds: item.affixIds,
    baseItemId: item.baseItemId,
    sourceRegionId,
    enhancementLevel: 0,
    equippedAt: null,
    equipSlotIndex: null,
    attack: item.stats.attack,
    defense: item.stats.defense,
    hp: item.stats.hp,
    luck: item.stats.luck,
    crit: item.stats.crit,
    goldBonus: item.stats.goldBonus,
    expBonus: item.stats.expBonus,
    dropBonus: item.stats.dropBonus,
  };
}

function syncPower(player: SimPlayer) {
  player.power = calculatePowerFromEquippedItems(player.items).power;
}

function getEffectStatsForPlayer(player: SimPlayer) {
  const totalStats = calculatePowerFromEquippedItems(player.items).totalStats;

  return coerceRewardEffectStats(totalStats);
}

function equipBest(player: SimPlayer) {
  for (const item of player.items) {
    item.equippedAt = null;
    item.equipSlotIndex = null;
  }

  const bestItems = chooseBestItemsBySlot(player.items);
  const equippedAt = new Date(0);

  for (const slot of itemSlots) {
    const bestSlotItems = bestItems.get(slot) ?? [];

    for (const [index, bestItem] of bestSlotItems.entries()) {
      const playerItem = player.items.find((item) => item.id === bestItem.id);

      if (playerItem) {
        playerItem.equippedAt = equippedAt;
        playerItem.equipSlotIndex = slot === "ring" ? index : 0;
      }
    }
  }

  syncPower(player);
}

function enhanceEquippedItems(player: SimPlayer) {
  let upgraded = true;

  while (upgraded) {
    upgraded = false;

    for (const slot of itemSlots) {
      const equippedItems = player.items.filter(
        (candidate) => candidate.slot === slot && candidate.equippedAt,
      );

      for (const item of equippedItems) {
        const preview = getEnhancementPreview(item);
        const materialAmount = player.materials.get(preview.materialId) ?? 0;

        if (
          preview.isMaxLevel ||
          player.gold < preview.goldCost ||
          materialAmount < preview.materialCost
        ) {
          continue;
        }

        player.gold -= preview.goldCost;
        player.materials.set(preview.materialId, materialAmount - preview.materialCost);
        item.enhancementLevel += 1;

        const nextStats = applyEnhancementStats(item);
        item.attack = nextStats.attack;
        item.defense = nextStats.defense;
        item.hp = nextStats.hp;
        item.luck = nextStats.luck;
        item.crit = nextStats.crit;
        item.goldBonus = nextStats.goldBonus;
        item.expBonus = nextStats.expBonus;
        item.dropBonus = nextStats.dropBonus;
        upgraded = true;
      }
    }
  }

  syncPower(player);
}

function optimizePlayer(player: SimPlayer) {
  equipBest(player);
  enhanceEquippedItems(player);
  equipBest(player);
}

function getBestFarmRegion(player: SimPlayer) {
  const unlocked = normalizeUnlockedRegionIds(
    player.unlockedRegionIds,
    player.currentRegionId,
  );
  const accessible = regionDefinitions.filter((region) =>
    isRegionAccessible(region, player.power, unlocked, player.currentRegionId),
  );

  if (accessible.length === 0) {
    return getRegionById(player.currentRegionId) ?? regionDefinitions[0]!;
  }

  return accessible[accessible.length - 1]!;
}

function syncCurrentRegion(player: SimPlayer) {
  player.currentRegionId = getBestFarmRegion(player).id;
}

function addGeneratedItems(
  player: SimPlayer,
  sourceRegionId: string,
  items: GeneratedEquipment[],
  itemIdRef: { current: number },
) {
  for (const item of items) {
    player.items.push(createItem(`item_${itemIdRef.current++}`, item, sourceRegionId));
    player.rarityCounts[item.rarity] += 1;
  }
}

function spendMaterials(
  player: SimPlayer,
  ingredients: Array<{ materialId: string; amount: number }>,
) {
  for (const ingredient of ingredients) {
    const currentAmount = player.materials.get(ingredient.materialId) ?? 0;
    player.materials.set(ingredient.materialId, currentAmount - ingredient.amount);
  }
}

function createPlayer(index: number): SimPlayer {
  return {
    id: `player_${index + 1}`,
    name: `Player ${index + 1}`,
    gold: 0,
    exp: 0,
    power: 0,
    currentRegionId: "region_001",
    unlockedRegionIds: ["region_001"],
    materials: new Map<string, number>(),
    items: [],
    rarityCounts: createRarityCounts(),
    idleClaims: 0,
    bossWins: 0,
    blessingsSent: 0,
    blessingsReceived: 0,
    worldBossRewards: 0,
    worldBossFinalBlows: 0,
    dailyBossAttempts: 0,
  };
}

function applyIdleClaim(
  player: SimPlayer,
  claimMinutes: number,
  random: () => number,
  itemIdRef: { current: number },
  locale: "zh" | "en",
) {
  syncCurrentRegion(player);
  const region = getBestFarmRegion(player);
  const effectStats = getEffectStatsForPlayer(player);
  const rewards = calculateIdleRewards(region, claimMinutes * 60000);
  const droppedItems = generateRegionDrops(
    region.dropTableId,
    rewards.claimableMinutes,
    random,
    locale,
    effectStats,
  );

  player.gold += applyGoldBonus(rewards.gold, effectStats);
  player.exp += applyExpBonus(rewards.exp, effectStats);
  player.idleClaims += 1;

  for (const material of rewards.materials) {
    addMaterial(player.materials, material.materialId, material.amount);
  }

  addGeneratedItems(player, region.id, droppedItems, itemIdRef);
  optimizePlayer(player);
}

function attemptBossProgress(
  player: SimPlayer,
  random: () => number,
  itemIdRef: { current: number },
  locale: "zh" | "en",
) {
  let safety = 0;

  while (safety < 20) {
    safety += 1;
    const highestUnlockedRegionId = getHighestUnlockedRegionId(
      player.unlockedRegionIds,
      player.currentRegionId,
    );
    const region = getRegionById(highestUnlockedRegionId);

    if (!region) {
      return;
    }

    const boss = bossDefinitions.find((entry) => entry.regionId === region.id);

    if (!boss) {
      return;
    }

    const unlockTargetRegion = region.unlocksRegionId
      ? getRegionById(region.unlocksRegionId)
      : null;

    if (
      unlockTargetRegion &&
      !player.unlockedRegionIds.includes(unlockTargetRegion.id) &&
      player.power < unlockTargetRegion.recommendedPower
    ) {
      return;
    }

    const attemptsUsed = player.dailyBossAttempts;

    if (attemptsUsed >= boss.dailyChallengeLimit) {
      return;
    }

    player.dailyBossAttempts += 1;
    const effectStats = getEffectStatsForPlayer(player);

    if (
      random() >=
      calculateBossCombatWinChance(player.power, boss.power, effectStats)
    ) {
      continue;
    }

    player.bossWins += 1;
    player.gold += applyGoldBonus(boss.rewardGold, effectStats);
    player.exp += applyExpBonus(boss.rewardExp, effectStats);

    for (const material of boss.rewardMaterials) {
      addMaterial(player.materials, material.materialId, material.amount);
    }

    const rewardItemCount = scaleDropRollCount(
      boss.rewardItemCount,
      effectStats,
      random,
    );
    const droppedItems = Array.from({ length: rewardItemCount }, () =>
      generateEquipmentDrop(boss.rewardDropTableId, random, locale, effectStats),
    );

    addGeneratedItems(player, region.id, droppedItems, itemIdRef);

    if (region.unlocksRegionId && !player.unlockedRegionIds.includes(region.unlocksRegionId)) {
      player.unlockedRegionIds.push(region.unlocksRegionId);
    }

    optimizePlayer(player);
    syncCurrentRegion(player);
  }
}

function attemptForgeUpgrade(
  player: SimPlayer,
  random: () => number,
  itemIdRef: { current: number },
  locale: "zh" | "en",
) {
  const highestUnlockedRegionId = getHighestUnlockedRegionId(
    player.unlockedRegionIds,
    player.currentRegionId,
  );
  const region = getRegionById(highestUnlockedRegionId);

  if (!region) {
    return;
  }

  const materialAmounts = new Map(player.materials);
  const effectStats = getEffectStatsForPlayer(player);

  for (const slot of forgePriority) {
    const preview = getForgePreview(region, slot, locale);

    if (
      player.gold < preview.goldCost ||
      !canAffordIngredients(preview.ingredients, materialAmounts)
    ) {
      continue;
    }

    player.gold -= preview.goldCost;
    spendMaterials(player, preview.ingredients);
    const forgedItem = generateEquipmentDropForSlot(
      region.dropTableId,
      slot,
      random,
      locale,
      effectStats,
    );

    addGeneratedItems(player, region.id, [forgedItem], itemIdRef);
    optimizePlayer(player);
    return;
  }
}

function applyDailyBlessings(players: SimPlayer[]) {
  for (let index = 0; index < players.length; index += 1) {
    const sender = players[index]!;
    const target = players[(index + 1) % players.length]!;

    sender.blessingsSent += 1;
    target.blessingsReceived += 1;
    target.gold += dailyBlessingReward.gold;
    target.exp += dailyBlessingReward.exp;
  }
}

function simulateWorldBossDay(
  players: SimPlayer[],
  dayDate: Date,
) {
  const dayKey = formatWorldBossDay(dayDate);
  const boss = getWorldBossForDay(dayKey);
  let hp = boss.maxHp;
  const participants: SimPlayer[] = [];
  let finalBlowPlayer: SimPlayer | null = null;

  for (const player of players) {
    let participated = false;

    for (let attempt = 0; attempt < boss.dailyAttackLimit; attempt += 1) {
      if (hp <= 0) {
        break;
      }

      const damage = Math.min(calculateWorldBossDamage(player.power), hp);
      hp -= damage;
      participated = true;

      if (hp === 0) {
        finalBlowPlayer = player;
        break;
      }
    }

    if (participated) {
      participants.push(player);
    }

    if (hp === 0) {
      break;
    }
  }

  if (hp > 0) {
    return { defeated: false, remainingHp: hp, bossId: boss.id };
  }

  for (const player of participants) {
    player.worldBossRewards += 1;
    player.gold += boss.rewardGold;
    player.exp += boss.rewardExp;

    for (const material of boss.rewardMaterials) {
      addMaterial(player.materials, material.materialId, material.amount);
    }
  }

  if (finalBlowPlayer) {
    finalBlowPlayer.worldBossFinalBlows += 1;
  }

  return { defeated: true, remainingHp: 0, bossId: boss.id };
}

function buildSnapshot(players: SimPlayer[], day: number): SimulationSnapshot {
  const highestRegions = regionDefinitions.reduce<Record<string, number>>((acc, region) => {
    acc[region.id] = 0;
    return acc;
  }, {});

  for (const player of players) {
    const highestUnlockedRegionId = getHighestUnlockedRegionId(
      player.unlockedRegionIds,
      player.currentRegionId,
    );
    highestRegions[highestUnlockedRegionId] += 1;
  }

  const totals = players.reduce(
    (acc, player) => {
      acc.power += player.power;
      acc.gold += player.gold;
      acc.exp += player.exp;
      return acc;
    },
    { power: 0, gold: 0, exp: 0 },
  );

  return {
    day,
    averagePower: Math.round(totals.power / players.length),
    averageGold: Math.round(totals.gold / players.length),
    averageExp: Math.round(totals.exp / players.length),
    finalRegionPlayers: highestRegions.region_010 ?? 0,
    highestRegions,
  };
}

export function runPlayerSimulation(options: SimulationOptions): SimulationResult {
  const claimsPerDay = options.claimsPerDay ?? 2;
  const playerCount = options.playerCount ?? 5;
  const seed = options.seed ?? 42;
  const locale = options.locale ?? "en";
  const random = createSeededRandom(seed);
  const players = Array.from({ length: playerCount }, (_, index) => createPlayer(index));
  const dailySnapshots: SimulationSnapshot[] = [];
  const itemIdRef = { current: 1 };
  const claimMinutes = Math.floor((24 * 60) / claimsPerDay);

  for (let day = 1; day <= options.days; day += 1) {
    const dayDate = new Date(Date.UTC(2026, 0, day));

    for (const player of players) {
      player.dailyBossAttempts = 0;
    }

    applyDailyBlessings(players);

    for (let claimIndex = 0; claimIndex < claimsPerDay; claimIndex += 1) {
      for (const player of players) {
        applyIdleClaim(player, claimMinutes, random, itemIdRef, locale);
        attemptBossProgress(player, random, itemIdRef, locale);
        attemptForgeUpgrade(player, random, itemIdRef, locale);
      }
    }

    simulateWorldBossDay(players, dayDate);

    for (const player of players) {
      optimizePlayer(player);
      syncCurrentRegion(player);
    }

    dailySnapshots.push(buildSnapshot(players, day));
  }

  return {
    players,
    dailySnapshots,
    claimsPerDay,
    seed,
  };
}

export function summarizeRarityCounts(players: SimPlayer[]) {
  const totals = createRarityCounts();

  for (const player of players) {
    for (const rarity of itemRarities) {
      totals[rarity] += player.rarityCounts[rarity];
    }
  }

  return totals;
}

export function summarizePlayer(player: SimPlayer) {
  const highestUnlockedRegionId = getHighestUnlockedRegionId(
    player.unlockedRegionIds,
    player.currentRegionId,
  );

  return {
    id: player.id,
    name: player.name,
    power: player.power,
    gold: player.gold,
    exp: player.exp,
    currentRegionId: player.currentRegionId,
    highestUnlockedRegionId,
    idleClaims: player.idleClaims,
    bossWins: player.bossWins,
    blessingsSent: player.blessingsSent,
    blessingsReceived: player.blessingsReceived,
    worldBossRewards: player.worldBossRewards,
    worldBossFinalBlows: player.worldBossFinalBlows,
    equippedItemPower: player.items
      .filter((item) => item.equippedAt)
      .reduce((sum, item) => sum + calculatePower(item), 0),
  };
}

export function getDropTableByRegionId(regionId: string) {
  const region = getRegionById(regionId);

  if (!region) {
    return null;
  }

  return dropTableDefinitions.find((table) => table.id === region.dropTableId) ?? null;
}
