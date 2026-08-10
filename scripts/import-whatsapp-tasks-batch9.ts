import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const NEW_TASKS = [
  'לשלוח הודעה לתומר לשאול על כפיר דיבר איתו על פ"א עם מתן',
  "לשאול אם להצטרף לסיור ב12",
  "ספר במה לסיים עד 9",
  'לשלוח הודעה למפקדים על מל"ל',
];

const EXISTING_PARENT_TITLE = "לשלוח זימון סיום תקופה";
const NEW_SUBTASK = "לדבר עם תומר בבוקר על סיום תקופה הזמנת משפחות";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const created: unknown[] = [];

  try {
    for (const title of NEW_TASKS) {
      const task = await prisma.task.create({
        data: {
          title,
          areaId: BASE_AREA_ID,
          status: "INBOX",
          activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
        },
      });
      created.push({ id: task.id, title: task.title });
    }

    const parent = await prisma.task.findFirst({
      where: {
        title: EXISTING_PARENT_TITLE,
        status: "INBOX",
        parentTaskId: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!parent) {
      throw new Error(`Parent task not found: ${EXISTING_PARENT_TITLE}`);
    }

    const sub = await prisma.task.create({
      data: {
        title: NEW_SUBTASK,
        areaId: BASE_AREA_ID,
        status: "INBOX",
        parentTaskId: parent.id,
        activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
      },
    });

    created.push({
      parentId: parent.id,
      parentTitle: parent.title,
      subtask: { id: sub.id, title: sub.title },
    });

    console.log(`Created ${NEW_TASKS.length} tasks and 1 subtask.`);
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
