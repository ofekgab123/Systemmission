import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

function isStaleClient(client: PrismaClient | undefined): client is undefined {
  return !client || typeof client.stickyNote?.findMany !== "function";
}

function getPrismaClient() {
  if (!isStaleClient(globalThis.__prisma)) {
    return globalThis.__prisma;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
