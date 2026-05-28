import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import inviteCodes from "../data/inviteCodes.json";

const prisma = new PrismaClient();

async function main() {
  for (const code of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
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
