import { runPlayerSimulation } from "./lib/simulation";

type SweepSummary = {
  averagePower: number;
  averageGold: number;
  averageExp: number;
  finalRegionRate: number;
  averageBossWins: number;
};

function summarizeDay(days: number, seeds: number[]) {
  const summaries = seeds.map((seed) => {
    const result = runPlayerSimulation({
      days,
      playerCount: 5,
      claimsPerDay: 2,
      seed,
      locale: "en",
    });
    const players = result.players;
    const snapshot = result.dailySnapshots.at(-1)!;

    return {
      averagePower: snapshot.averagePower,
      averageGold: snapshot.averageGold,
      averageExp: snapshot.averageExp,
      finalRegionRate: snapshot.finalRegionPlayers / players.length,
      averageBossWins:
        players.reduce((sum, player) => sum + player.bossWins, 0) / players.length,
    };
  });

  const aggregate = summaries.reduce<SweepSummary>(
    (acc, summary) => {
      acc.averagePower += summary.averagePower;
      acc.averageGold += summary.averageGold;
      acc.averageExp += summary.averageExp;
      acc.finalRegionRate += summary.finalRegionRate;
      acc.averageBossWins += summary.averageBossWins;
      return acc;
    },
    {
      averagePower: 0,
      averageGold: 0,
      averageExp: 0,
      finalRegionRate: 0,
      averageBossWins: 0,
    },
  );

  const divisor = summaries.length;

  return {
    averagePower: Math.round(aggregate.averagePower / divisor),
    averageGold: Math.round(aggregate.averageGold / divisor),
    averageExp: Math.round(aggregate.averageExp / divisor),
    finalRegionRate: aggregate.finalRegionRate / divisor,
    averageBossWins: Number((aggregate.averageBossWins / divisor).toFixed(2)),
  };
}

const seeds = Array.from({ length: 20 }, (_, index) => 500 + index);
const day3 = summarizeDay(3, seeds);
const day7 = summarizeDay(7, seeds);
const day14 = summarizeDay(14, seeds);

console.log("=== economy sweep ===");
console.log("day=3", day3);
console.log("day=7", day7);
console.log("day=14", day14);

const warnings: string[] = [];

if (day3.finalRegionRate > 0.8) {
  warnings.push("Players are reaching the final region too early by day 3.");
}

if (day14.averageGold > 20000) {
  warnings.push("Average stored gold by day 14 is high enough to suggest sink pressure is weak.");
}

if (day14.averagePower > 900) {
  warnings.push("Average day-14 power is very high compared with the current final boss curve.");
}

if (day7.averageBossWins < 4) {
  warnings.push("Boss progression may be too slow for midweek friend retention.");
}

if (warnings.length === 0) {
  console.log("warnings=none");
} else {
  console.log("warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
