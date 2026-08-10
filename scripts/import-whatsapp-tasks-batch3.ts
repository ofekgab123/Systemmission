import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const TASKS: { title: string }[] = [
  { title: "חתימה על תוכנית שירות" },
  { title: 'חוו"ד ליאור עזרה' },
  { title: "לדבר עם תומר על ליגת פרט" },
];

function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

async function main() {
  const { prisma, pool } = createPrisma();
  const created: { id: string; title: string }[] = [];

  try {
    for (const item of TASKS) {
      const task = await prisma.task.create({
        data: {
          title: item.title,
          areaId: BASE_AREA_ID,
          status: "INBOX",
          activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
        },
      });
      created.push({ id: task.id, title: task.title });
    }

    console.log(`Created ${created.length} tasks.`);
    console.log(JSON.stringify(created, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
