import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const TASK = {
  title: "לדבר עם אור על לצלם את פודי לסיום תקופה",
  subtasks: ["לדבר עם נועם מחר בבוקר על צלם"],
};

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const parent = await prisma.task.create({
      data: {
        title: TASK.title,
        areaId: BASE_AREA_ID,
        status: "INBOX",
        activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
      },
    });

    const sub = await prisma.task.create({
      data: {
        title: TASK.subtasks[0],
        areaId: BASE_AREA_ID,
        status: "INBOX",
        parentTaskId: parent.id,
        activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
      },
    });

    console.log(JSON.stringify({ parent: { id: parent.id, title: parent.title }, subtask: { id: sub.id, title: sub.title } }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
