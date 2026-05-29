import { regionDefinitions } from "../data/regions";
import {
  runPlayerSimulation,
  summarizePlayer,
  summarizeRarityCounts,
} from "./lib/simulation";

for (const days of [3, 7, 14]) {
  const result = runPlayerSimulation({
    days,
    playerCount: 5,
    claimsPerDay: 2,
    seed: 100 + days,
    locale: "en",
  });

  console.log(`\n=== ${days}-day cohort ===`);

  for (const snapshot of result.dailySnapshots) {
    console.log(
      [
        `day=${snapshot.day}`,
        `avgPower=${snapshot.averagePower}`,
        `avgGold=${snapshot.averageGold}`,
        `avgExp=${snapshot.averageExp}`,
        `finalRegionPlayers=${snapshot.finalRegionPlayers}`,
      ].join(" | "),
    );
  }

  console.log("\nplayers:");
  for (const player of result.players.map(summarizePlayer)) {
    console.log(
      [
        player.name,
        `power=${player.power}`,
        `gold=${player.gold}`,
        `exp=${player.exp}`,
        `current=${player.currentRegionId}`,
        `highest=${player.highestUnlockedRegionId}`,
        `bossWins=${player.bossWins}`,
        `worldBossRewards=${player.worldBossRewards}`,
      ].join(" | "),
    );
  }

  const rarityTotals = summarizeRarityCounts(result.players);
  console.log(
    "\nrarityTotals:",
    Object.entries(rarityTotals)
      .map(([rarity, count]) => `${rarity}=${count}`)
      .join(", "),
  );
  console.log(
    "regionLeaders:",
    regionDefinitions
      .map((region) => `${region.id}=${result.dailySnapshots.at(-1)?.highestRegions[region.id] ?? 0}`)
      .join(", "),
  );
}
