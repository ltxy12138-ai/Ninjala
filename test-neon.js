const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function test() {
  const player = await db.player.findFirst();
  console.log("player:", player?.id, player?.name);
  if (!player) { console.log("no players"); await db.$disconnect(); return; }
  try {
    const result = await db.$transaction(async (tx) => {
      const p = await tx.player.findUnique({ where: { id: player.id } });
      console.log("tx found:", p?.name);
      await tx.player.update({ where: { id: player.id }, data: { gold: { increment: 0 } } });
      return "ok";
    });
    console.log("transaction:", result);
  } catch(e) {
    console.error("TX ERROR:", e.message);
  }
  await db.$disconnect();
}
test();
