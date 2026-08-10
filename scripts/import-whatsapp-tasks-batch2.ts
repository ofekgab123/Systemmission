import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const TASKS: { title: string; subtasks?: string[] }[] = [
  { title: "שליחת מיילים הענקות דרגה" },
  { title: "פקודת הופעה ולבוש אנשי מילואים" },
  { title: "ויתור טפסי 55 אופק ויאיר" },
  { title: "חתימה על תוכנית שירות ראשון על הבוקר!!!!!" },
  {
    title: "מייל העברת חתימות ערכות עזרה ראשונה",
    subtasks: ["פירוט ערכות עזרה ראשונה CAT+FC"],
  },
  { title: 'פ"א דניאל פרץ' },
  {
    title: 'פ"א - עידן כהן, אסף אוחנה, אור יעקב, בוריס יוספוב, דניאל בן שושן',
  },
  { title: "דלת פתוחה - לעדכן זימון" },
  { title: 'חוו"ד ליאור עזרה ממש ממש ממש ממש דחוף' },
  { title: "שיפום פברואר" },
  { title: "הכנה לסיור מפקד 108 ב13/12" },
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
  const created: { id: string; title: string; subtasks?: { id: string; title: string }[] }[] = [];

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
      const entry: { id: string; title: string; subtasks?: { id: string; title: string }[] } = {
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
          entry.subtasks.push({ id: sub.id, title: sub.title });
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
