import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

export function getDb() {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient();
  }

  return globalThis.__prisma;
}
