import { createEmptyStats, statKeys, type EquipmentStats } from "@/lib/game/types";

export function sumEquipmentStats(items: Array<Partial<EquipmentStats>>) {
  const total = createEmptyStats();

  for (const item of items) {
    for (const statKey of statKeys) {
      total[statKey] += item[statKey] ?? 0;
    }
  }

  return total;
}

export function calculatePower(stats: Partial<EquipmentStats>) {
  const safeStats = {
    ...createEmptyStats(),
    ...stats,
  };

  return Math.round(
    safeStats.attack * 2 +
      safeStats.defense * 1.5 +
      safeStats.hp * 0.2 +
      safeStats.luck +
      safeStats.crit * 2.5,
  );
}
