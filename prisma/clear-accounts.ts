import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.blessing.deleteMany();
    await tx.worldBossAttackLog.deleteMany();
    await tx.worldBossState.deleteMany();
    await tx.playerBossProgress.deleteMany();
    await tx.playerUnlockedRegion.deleteMany();
    await tx.itemInstance.deleteMany();
    await tx.materialStack.deleteMany();
    await tx.gameLog.deleteMany();
    await tx.player.deleteMany();
    await tx.user.deleteMany();
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
