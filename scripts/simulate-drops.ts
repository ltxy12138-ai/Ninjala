import { dropTableDefinitions } from "../data/drop-tables";
import { calculatePower } from "../lib/game/power";
import { generateEquipmentDrop } from "../lib/game/loot";

for (const dropTable of dropTableDefinitions) {
  const rarityCounts = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  const powers: number[] = [];

  for (let index = 0; index < 10000; index += 1) {
    const item = generateEquipmentDrop(dropTable.id, Math.random, "en");
    rarityCounts[item.rarity] += 1;
    powers.push(calculatePower(item.stats));
  }

  const averagePower =
    powers.reduce((sum, value) => sum + value, 0) / powers.length;

  console.log(`\n=== ${dropTable.id} ===`);
  console.log(
    `common=${rarityCounts.common}, rare=${rarityCounts.rare}, epic=${rarityCounts.epic}, legendary=${rarityCounts.legendary}`,
  );
  console.log(`avgPower=${averagePower.toFixed(2)}`);
}
