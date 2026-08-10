import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_AREA_ID = "cmsme8fqo000bfoit9clwzwhb";

const TASKS = [
  'לשלוח סיכום קפ"ק של שבוע שעבר',
  "לשלוח זימון סיום תקופה",
  'לדבר עם ירון לפתוח הרשאות לתפוצה בסיס 108/תוה"ן',
  "לעבור על מיילים של אתמול",
  "לתאם ארוחת צהריים לסקר המפקד (לדבר עם ימית)",
];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    for (const title of TASKS) {
      const task = await prisma.task.create({
        data: {
          title,
          areaId: BASE_AREA_ID,
          status: "INBOX",
          activities: { create: { type: "CREATED", message: "המשימה נוצרה" } },
        },
      });
      console.log(JSON.stringify({ id: task.id, title: task.title }));
    }
    console.log(`Created ${TASKS.length} tasks.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
