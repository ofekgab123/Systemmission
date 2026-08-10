import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const PARENT_TITLE = "מייל העברת חתימות ערכות עזרה ראשונה";
const SUBTASK_TITLE = "פירוט ערכות עזרה ראשונה CAT+FC";

function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

function toDataUrl(filePath: string): { data: string; mimeType: string } {
  const abs = resolve(filePath);
  const buffer = readFileSync(abs);
  const ext = abs.toLowerCase().split(".").pop();
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return {
    data: `data:${mimeType};base64,${buffer.toString("base64")}`,
    mimeType,
  };
}

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Usage: npx tsx scripts/attach-subtask-image.ts <image-path>");
    process.exit(1);
  }

  const { prisma, pool } = createPrisma();
  const { data, mimeType } = toDataUrl(imagePath);

  try {
    const parent = await prisma.task.findFirst({
      where: { title: PARENT_TITLE, parentTaskId: null },
      orderBy: { createdAt: "desc" },
    });
    if (!parent) {
      throw new Error(`Parent task not found: ${PARENT_TITLE}`);
    }

    const subtask = await prisma.task.findFirst({
      where: { title: SUBTASK_TITLE, parentTaskId: parent.id },
      orderBy: { createdAt: "desc" },
    });
    if (!subtask) {
      throw new Error(`Subtask not found: ${SUBTASK_TITLE}`);
    }

    const attachment = await prisma.taskAttachment.create({
      data: { taskId: subtask.id, mimeType, data },
    });

    console.log(`Attached image to subtask "${SUBTASK_TITLE}" (${subtask.id})`);
    console.log(JSON.stringify({ attachmentId: attachment.id, taskId: subtask.id }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
