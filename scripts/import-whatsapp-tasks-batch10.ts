import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const CANCEL_TITLES = [
  "ספר במה לסיים עד 9",
  "2 סיכומי קפק לשלוח + 1 לסיים",
  'לשלוח סיכום קפ"ק של שבוע שעבר',
];

const NEW_TASKS = [
  "ספר במה",
  "פלואו סופי",
  "מצגת אנשים לתומר",
  "מצגת מצטיינים",
  "הכנת תעודות",
  "שליחת קובץ מצטייני בסיס להדר",
  "ריכוז בקשות שחרור מסיום תקופה",
  "סיכום קפק",
  "מלל מצטיינים לספר במה",
  "מעבר על הוראת מנהלה",
  "סרטון משפחות",
  "להעביר זימון לסנדור",
];

const PARENT_WITH_SUBTASK = "הכנת תעודות";
const SUBTASK_TITLE = "הדפסת תעודות";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const log: unknown[] = [];

  try {
    for (const title of CANCEL_TITLES) {
      const tasks = await prisma.task.findMany({
        where: { title, status: { not: "CANCELLED" }, parentTaskId: null },
      });

      for (const task of tasks) {
        const subtasks = await prisma.task.findMany({
          where: { parentTaskId: task.id, status: { not: "CANCELLED" } },
          select: { id: true },
        });
        const ids = [task.id, ...subtasks.map((s) => s.id)];

        await prisma.task.updateMany({
          where: { id: { in: ids } },
          data: { status: "CANCELLED" },
        });

        await prisma.activity.createMany({
          data: ids.map((taskId) => ({
            taskId,
            type: "STATUS_CHANGED" as const,
            message: taskId === task.id ? "המשימה בוטלה" : "תת-משימה בוטלה עקב ביטול המשימה הראשית",
          })),
        });

        log.push({ cancelled: title, id: task.id, subtasks: subtasks.length });
      }
    }

    for (const title of NEW_TASKS) {
      const task = await prisma.task.create({
        data: {
          title,
          areaId: BASE_AREA_ID,
          status: "INBOX",
          activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
        },
      });
      log.push({ created: { id: task.id, title: task.title } });
    }

    const parent = await prisma.task.findFirst({
      where: {
        title: PARENT_WITH_SUBTASK,
        status: "INBOX",
        parentTaskId: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!parent) {
      throw new Error(`Parent task not found: ${PARENT_WITH_SUBTASK}`);
    }

    const sub = await prisma.task.create({
      data: {
        title: SUBTASK_TITLE,
        areaId: BASE_AREA_ID,
        status: "INBOX",
        parentTaskId: parent.id,
        activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
      },
    });

    log.push({
      subtask: {
        parentId: parent.id,
        parentTitle: parent.title,
        id: sub.id,
        title: sub.title,
      },
    });

    console.log(`Cancelled ${CANCEL_TITLES.length} titles, created ${NEW_TASKS.length} tasks and 1 subtask.`);
    console.log(JSON.stringify(log, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
