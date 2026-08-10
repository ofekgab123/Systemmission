import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const TASKS: { title: string; subtasks?: string[] }[] = [
  { title: "יום ראשון לסיים - מבט אל הפרט" },
  { title: 'רענון מפקדי גפים פקודת דמ"ש ואופן השיפוט' },
  { title: 'החלפת פיקוד דב"צ', subtasks: ["שחרורים"] },
  { title: "רמת פעילות מרץ 26 - מורין דרי", subtasks: ["קובי היה צריך להגיש"] },
  { title: "הקצאות שיחות חתך" },
  { title: "שיחות חתך תומר" },
  { title: 'כתיבת מייל חו"ל' },
  { title: "ליגת טיפול בפרט- מעבר עם תומר על" },
  {
    title: "לבקש הרשאות - אי אפשר לעדכן את תומר שינוי מקצוע - תקוע (האחראית בחול)",
  },
  { title: "2 סיכומי קפק לשלוח + 1 לסיים" },
  { title: "ירון-הרשאות לתפוצות" },
];

function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

async function main() {
  const { prisma, pool } = createPrisma();
  let parentCount = 0;
  let subtaskCount = 0;
  const created: { id: string; title: string; subtasks?: string[] }[] = [];

  try {
    for (const item of TASKS) {
      const parent = await prisma.task.create({
        data: {
          title: item.title,
          areaId: BASE_AREA_ID,
          status: "INBOX",
          activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
        },
      });
      parentCount++;
      const entry: { id: string; title: string; subtasks?: string[] } = {
        id: parent.id,
        title: parent.title,
      };

      if (item.subtasks?.length) {
        entry.subtasks = [];
        for (const subTitle of item.subtasks) {
          const sub = await prisma.task.create({
            data: {
              title: subTitle,
              areaId: BASE_AREA_ID,
              status: "INBOX",
              parentTaskId: parent.id,
              activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
            },
          });
          subtaskCount++;
          entry.subtasks.push(sub.id);
        }
      }

      created.push(entry);
    }

    console.log(`Created ${parentCount} parent tasks and ${subtaskCount} subtasks.`);
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
