import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const PRISMA_CLIENT_VERSION = 5;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const client = new PrismaClient({ adapter });
  (client as PrismaClient & { __version?: number }).__version = PRISMA_CLIENT_VERSION;
  return client;
}

function isStaleClient(client: PrismaClient | undefined): client is undefined {
  return (
    !client ||
    (client as PrismaClient & { __version?: number }).__version !== PRISMA_CLIENT_VERSION ||
    typeof client.stickyNote?.findMany !== "function" ||
    typeof client.taskAttachment?.createMany !== "function" ||
    typeof client.calendarEvent?.findMany !== "function"
  );
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
